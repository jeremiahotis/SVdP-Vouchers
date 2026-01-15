<?php
/**
 * Import handler for POS CSVs
 */
class SVDP_Import
{
    /**
     * Handle file upload and processing
     */
    public static function process_upload($file, $store_id)
    {
        if (empty($file) || $file['error'] !== UPLOAD_ERR_OK) {
            return new WP_Error('upload_error', 'File upload failed');
        }

        if (pathinfo($file['name'], PATHINFO_EXTENSION) !== 'csv') {
            return new WP_Error('invalid_file_type', 'Only CSV files are allowed');
        }

        $handle = fopen($file['tmp_name'], 'r');
        if (!$handle) {
            return new WP_Error('file_read_error', 'Could not read file');
        }

        // Create import run record
        global $wpdb;
        $table_runs = $wpdb->prefix . 'svdp_import_runs';

        $wpdb->insert($table_runs, [
            'store_id' => $store_id,
            'started_at' => current_time('mysql'),
            'status' => 'processing',
            'rows_read' => 0
        ]);
        $run_id = $wpdb->insert_id;

        // processing stats
        $rows_read = 0;
        $rows_skipped = 0;
        $receipts_created = 0;
        $items_created = 0;
        $errors = [];

        // Header mapping
        $header = fgetcsv($handle);
        if (!$header) {
            self::finish_run($run_id, 'failed', 0, 0, 0, ['Empty file']);
            return new WP_Error('empty_file', 'CSV is empty');
        }

        // Normalize headers to lowercase for mapping
        $header_map = [];
        foreach ($header as $index => $col) {
            $key = strtolower(trim(preg_replace('/[^a-zA-Z0-9]/', '', $col)));
            $header_map[$key] = $index;
        }

        // Check required columns
        if (!isset($header_map['receiptid'])) {
            self::finish_run($run_id, 'failed', 0, 0, 0, ['Missing ReceiptID column']);
            return new WP_Error('invalid_format', 'Missing required column: ReceiptID');
        }

        // Buffer receipts for aggregation
        $receipt_buffer = [];

        while (($row = fgetcsv($handle)) !== false) {
            $rows_read++;

            // Extract data using map
            $receipt_id = isset($header_map['receiptid']) ? trim($row[$header_map['receiptid']]) : '';

            if (empty($receipt_id)) {
                $rows_skipped++; // Rows without receipt ID are invalid
                continue;
            }

            // Price/Total Logic
            $price = 0.00;
            if (isset($header_map['unitprice'])) {
                $price = floatval(preg_replace('/[^0-9.-]/', '', $row[$header_map['unitprice']]));
            } elseif (isset($header_map['linetotal'])) {
                $price = floatval(preg_replace('/[^0-9.-]/', '', $row[$header_map['linetotal']]));
            }

            // Qty Logic
            $qty = 1;
            if (isset($header_map['qty'])) {
                $qty = intval(preg_replace('/[^0-9-]/', '', $row[$header_map['qty']]));
            }
            if ($qty == 0)
                $qty = 1;

            // DateTime Logic
            $datetime = null;
            if (isset($header_map['datetime']) && !empty($row[$header_map['datetime']])) {
                $datetime = $row[$header_map['datetime']];
            } elseif (isset($header_map['receiptdatetime']) && !empty($row[$header_map['receiptdatetime']])) {
                $datetime = $row[$header_map['receiptdatetime']];
            }

            // Item Details
            $sku = isset($header_map['sku']) ? trim($row[$header_map['sku']]) : '';
            $description = isset($header_map['description']) ? trim($row[$header_map['description']]) : '';
            $category = isset($header_map['category']) ? trim($row[$header_map['category']]) : '';

            // Calculate Line Total
            $line_total = $price * $qty; // Approximation if only unit price is present, or vice versa. CSV usually has both or one.
            if (isset($header_map['linetotal'])) {
                $explicit_total = floatval(preg_replace('/[^0-9.-]/', '', $row[$header_map['linetotal']]));
                if ($explicit_total != 0)
                    $line_total = $explicit_total;
            }

            // Aggregate
            if (!isset($receipt_buffer[$receipt_id])) {
                $receipt_buffer[$receipt_id] = [
                    'gross_total' => 0.00,
                    'datetime' => $datetime,
                    'items' => []
                ];
            }

            $receipt_buffer[$receipt_id]['gross_total'] += $line_total;

            if (empty($receipt_buffer[$receipt_id]['datetime']) && !empty($datetime)) {
                $receipt_buffer[$receipt_id]['datetime'] = $datetime;
            }

            // Buffer Item
            if (!empty($description) || !empty($sku)) {
                $receipt_buffer[$receipt_id]['items'][] = [
                    'sku' => $sku,
                    'description' => $description,
                    'category' => $category,
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'line_total' => $line_total
                ];
            }
        }
        fclose($handle);

        // Batch Insert
        $table_receipts = $wpdb->prefix . 'svdp_pos_receipts';
        $table_items = $wpdb->prefix . 'svdp_pos_receipt_items';

        foreach ($receipt_buffer as $r_id => $data) {
            $db_datetime = !empty($data['datetime']) ? date('Y-m-d H:i:s', strtotime($data['datetime'])) : current_time('mysql');

            $result = $wpdb->query($wpdb->prepare(
                "INSERT IGNORE INTO $table_receipts 
                (store_id, receipt_id, gross_total, receipt_datetime) 
                VALUES (%d, %s, %f, %s)",
                $store_id,
                $r_id,
                $data['gross_total'],
                $db_datetime
            ));

            if ($result === 1) {
                $receipts_created++;

                // Insert Items
                if (!empty($data['items'])) {
                    foreach ($data['items'] as $item) {
                        $wpdb->insert($table_items, [
                            'store_id' => $store_id,
                            'receipt_id' => $r_id,
                            'sku' => $item['sku'],
                            'description' => $item['description'],
                            'category' => $item['category'],
                            'quantity' => $item['quantity'],
                            'unit_price' => $item['unit_price'],
                            'line_total' => $item['line_total']
                        ]);
                        $items_created++;
                    }
                }
            } else {
                // If 0, it means duplicate key (skipped)
                $rows_skipped++; // Counting skipped receipts here effectively
            }

            // Attempt to link to voucher (Retroactive or new)
            SVDP_Reconciliation::link_receipt($store_id, $r_id);
        }

        self::finish_run($run_id, 'completed', $rows_read, $receipts_created, $rows_skipped, []);

        return [
            'success' => true,
            'message' => "Processed $rows_read rows. Imported $receipts_created new receipts with $items_created items."
        ];
    }

    /**
     * Update run status
     */
    private static function finish_run($run_id, $status, $read, $inserted, $skipped, $errors)
    {
        global $wpdb;
        $table_runs = $wpdb->prefix . 'svdp_import_runs';

        $wpdb->update($table_runs, [
            'status' => $status,
            'ended_at' => current_time('mysql'),
            'rows_read' => $read,
            'rows_inserted' => $inserted,
            'rows_skipped' => $skipped,
            'errors' => json_encode($errors)
        ], ['id' => $run_id]);
    }

    /**
     * Get recent runs
     */
    public static function get_recent_runs($limit = 10)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_import_runs';
        return $wpdb->get_results("SELECT * FROM $table ORDER BY started_at DESC LIMIT " . intval($limit));
    }
}
