<?php
// Imports Tab Template
if (!defined('ABSPATH'))
    exit;

$runs = SVDP_Import::get_recent_runs();
?>

<div class="wrap">
    <h3>Weekly POS Import</h3>
    <p class="description">Upload the weekly CSV export from ThriftWorks to update receipt data.</p>

    <div class="card">
        <form id="svdp-import-form">
            <table class="form-table">
                <tr>
                    <th scope="row"><label for="store_id">Store ID</label></th>
                    <td>
                        <input type="number" name="store_id" id="store_id" value="1" class="small-text" min="1">
                        <p class="description">Enter the numeric ID for the store this CSV belongs to.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="import_file">CSV File</label></th>
                    <td>
                        <input type="file" name="import_file" id="import_file" accept=".csv" required>
                        <p class="description">Select the CSV file exported from ThriftWorks.</p>
                    </td>
                </tr>
            </table>
            <p class="submit">
                <button type="submit" class="button button-primary" id="btn-import">Upload & Process</button>
                <span class="spinner" style="float:none; margin-top:0;"></span>
            </p>
            <div id="import-message" style="margin-top: 10px;"></div>
        </form>
    </div>

    <br>

    <h3>Recent Import Runs</h3>
    <table class="widefat fixed striped">
        <thead>
            <tr>
                <th>ID</th>
                <th>Store</th>
                <th>Started</th>
                <th>Status</th>
                <th>Rows Read</th>
                <th>Receipts Inserted</th>
                <th>Skipped (Dupes/Empty)</th>
                <th>Errors</th>
            </tr>
        </thead>
        <tbody>
            <?php if ($runs): ?>
                <?php foreach ($runs as $run): ?>
                    <tr>
                        <td>
                            <?php echo esc_html($run->id); ?>
                        </td>
                        <td>
                            <?php echo esc_html($run->store_id); ?>
                        </td>
                        <td>
                            <?php echo esc_html($run->started_at); ?>
                        </td>
                        <td>
                            <?php
                            $status_class = $run->status === 'completed' ? 'yes' : ($run->status === 'failed' ? 'no' : '');
                            echo '<span class="dashicons dashicons-' . $status_class . '"></span> ' . esc_html(ucfirst($run->status));
                            ?>
                        </td>
                        <td>
                            <?php echo esc_html($run->rows_read); ?>
                        </td>
                        <td><strong>
                                <?php echo esc_html($run->rows_inserted); ?>
                            </strong></td>
                        <td>
                            <?php echo esc_html($run->rows_skipped); ?>
                        </td>
                        <td>
                            <?php
                            $errs = json_decode($run->errors);
                            if ($errs && is_array($errs))
                                echo implode(', ', array_map('esc_html', $errs));
                            ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            <?php else: ?>
                <tr>
                    <td colspan="8">No import runs found.</td>
                </tr>
            <?php endif; ?>
        </tbody>
    </table>
</div>