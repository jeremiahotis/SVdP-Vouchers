<div class="wrap">
    <h1>Reconciliation</h1>
    <div class="svdp-reconciliation-intro">
        <p>Review linked vouchers and receipts to identify discrepancies.</p>
    </div>

    <h2 class="nav-tab-wrapper svdp-recon-tabs">
        <a href="#linked" class="nav-tab nav-tab-active">Linked Vouchers</a>
        <a href="#unmatched" class="nav-tab">Unmatched Receipts</a>
    </h2>

    <!-- Linked Vouchers Section -->
    <div id="tab-linked" class="svdp-tab-content active">
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>Voucher ID</th>
                    <th>Conference</th>
                    <th>Voucher Date</th>
                    <th>Name</th>
                    <th>Receipt ID</th>
                    <th>Receipt Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="svdp-reconciliation-list">
                <!-- Populated via PHP initially -->
                <?php
                $data = SVDP_Reconciliation::get_linked_vouchers();
                foreach ($data['items'] as $item):
                    $status = 'Linked';
                    $class = 'status-linked';
                    ?>
                    <tr>
                        <td>#<?php echo esc_html($item->voucher_id); ?></td>
                        <td><?php echo esc_html($item->conference_name); ?></td>
                        <td><?php echo esc_html($item->voucher_created_date); ?></td>
                        <td><?php echo esc_html($item->first_name . ' ' . $item->last_name); ?></td>
                        <td><?php echo esc_html($item->pos_receipt_id); ?></td>
                        <td>$<?php echo number_format((float) $item->receipt_gross_total, 2); ?></td>
                        <td><span class="svdp-badge <?php echo $class; ?>"><?php echo $status; ?></span></td>
                        <td>
                            <button type="button" class="button action-view-reconciliation"
                                data-id="<?php echo esc_attr($item->voucher_id); ?>">
                                View Detail
                            </button>
                        </td>
                    </tr>
                <?php endforeach; ?>

                <?php if (empty($data['items'])): ?>
                    <tr>
                        <td colspan="8">No linked vouchers found.</td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>

    <!-- Unmatched Receipts Section -->
    <div id="tab-unmatched" class="svdp-tab-content" style="display:none;">
        <div class="tablenav top">
            <div class="alignleft actions">
                <input type="date" id="filter-date-start" placeholder="Start Date">
                <input type="date" id="filter-date-end" placeholder="End Date">
                <select id="filter-store">
                    <option value="">All Stores</option>
                    <option value="1">Store 1</option> <!-- Populate dynamically in future -->
                </select>
                <input type="button" id="doaction-filter" class="button" value="Filter">
            </div>
            <div class="alignright actions">
                <a href="<?php echo admin_url('admin-post.php?action=svdp_export_unmatched'); ?>"
                    class="button button-primary">Export CSV</a>
            </div>
        </div>

        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>Receipt ID</th>
                    <th>Store ID</th>
                    <th>Date/Time</th>
                    <th>Gross Total</th>
                    <th>Items</th>
                </tr>
            </thead>
            <tbody id="svdp-unmatched-list">
                <tr>
                    <td colspan="5">Loading...</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Comparison Modal -->
    <div id="svdp-reconciliation-modal" class="svdp-modal" style="display:none;">
        <div class="svdp-modal-content large-modal">
            <span class="svdp-modal-close">&times;</span>
            <h2>Reconciliation Detail <span id="recon-voucher-id"></span></h2>

            <div class="recon-comparison-grid">
                <!-- Left: Authorized -->
                <div class="recon-column authorized">
                    <h3>Authorized (Snapshot)</h3>
                    <div class="recon-summary-card">
                        <label>Max Value Limit:</label>
                        <span class="amount" id="recon-max-value">$0.00</span>
                    </div>
                    <table class="widefat">
                        <thead>
                            <tr>
                                <th>Qty</th>
                                <th>Item</th>
                                <th>Category</th>
                                <th>Est. Price</th>
                            </tr>
                        </thead>
                        <tbody id="recon-list-authorized"></tbody>
                    </table>
                </div>

                <!-- Right: Redeemed -->
                <div class="recon-column redeemed">
                    <h3>Redeemed (POS Receipt)</h3>
                    <div class="recon-summary-card">
                        <label>Actual Gross Total:</label>
                        <span class="amount" id="recon-gross-total">$0.00</span>
                    </div>
                    <table class="widefat">
                        <thead>
                            <tr>
                                <th>Qty</th>
                                <th>Description</th>
                                <th>Code/SKU</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody id="recon-list-redeemed"></tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    /* Basic Styles for Modal (move to admin.css later ideally) */
    .svdp-modal {
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .svdp-modal-content.large-modal {
        background: #fff;
        padding: 20px;
        width: 90%;
        max-width: 1200px;
        height: 90%;
        overflow-y: auto;
        border-radius: 5px;
        position: relative;
        margin: 2% auto;
    }

    .svdp-modal-close {
        float: right;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
    }

    .recon-comparison-grid {
        display: flex;
        gap: 20px;
        margin-top: 20px;
        height: calc(100% - 60px);
    }

    .recon-column {
        flex: 1;
        border: 1px solid #ddd;
        padding: 10px;
        overflow-y: auto;
    }

    .recon-summary-card {
        background: #f0f0f1;
        padding: 10px;
        margin-bottom: 10px;
        font-weight: bold;
        font-size: 1.1em;
    }

    .recon-column.authorized {
        background: #f9fdf9;
    }

    .recon-column.redeemed {
        background: #fdf9f9;
    }
</style>