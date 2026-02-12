<div class="svdp-vouchers-tab">
    <div class="svdp-card">
        <h2>Vouchers</h2>
        <p class="description">View and reprint recent vouchers.</p>

        <?php
        $page = isset($_GET['paged']) ? max(1, intval($_GET['paged'])) : 1;
        $limit = 20;
        $offset = ($page - 1) * $limit;

        $vouchers = SVDP_Voucher::get_all($limit, $offset);
        $total_items = SVDP_Voucher::get_count();
        $total_pages = ceil($total_items / $limit);

        $store_hours = SVDP_Settings::get_setting('store_hours', '');
        $store_address = SVDP_Settings::get_setting('store_address', '1600 S Calhoun St, Fort Wayne, IN 46802');
        ?>

        <div class="tablenav top">
            <div class="tablenav-pages">
                <span class="displaying-num">
                    <?php echo $total_items; ?> items
                </span>
                <?php if ($total_pages > 1): ?>
                    <span class="pagination-links">
                        <?php if ($page > 1): ?>
                            <a class="prev-page button"
                                href="?page=svdp-vouchers&tab=vouchers&paged=<?php echo $page - 1; ?>">‹</a>
                        <?php endif; ?>
                        <span class="paging-input">
                            <span class="current-page">
                                <?php echo $page; ?>
                            </span> of <span class="total-pages">
                                <?php echo $total_pages; ?>
                            </span>
                        </span>
                        <?php if ($page < $total_pages): ?>
                            <a class="next-page button"
                                href="?page=svdp-vouchers&tab=vouchers&paged=<?php echo $page + 1; ?>">›</a>
                        <?php endif; ?>
                    </span>
                <?php endif; ?>
            </div>
        </div>

        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th scope="col" class="manage-column column-id" style="width: 60px;">ID</th>
                    <th scope="col" class="manage-column column-date" style="width: 100px;">Date</th>
                    <th scope="col" class="manage-column column-name">Name</th>
                    <th scope="col" class="manage-column column-conference">Conference</th>
                    <th scope="col" class="manage-column column-type">Type</th>
                    <th scope="col" class="manage-column column-value">Value</th>
                    <th scope="col" class="manage-column column-status">Status</th>
                    <th scope="col" class="manage-column column-actions" style="width: 100px;">Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($vouchers)): ?>
                    <tr>
                        <td colspan="8">No vouchers found.</td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($vouchers as $voucher):
                        // Prepare print data
                        // Calculate item breakdown for reprint
                        $household_size = max(1, intval($voucher->adults) + intval($voucher->children));
                        $items_per_person = intval($voucher->voucher_items_count) / $household_size;

                        $print_data = [
                            'firstName' => $voucher->first_name,
                            'lastName' => $voucher->last_name,
                            'id' => $voucher->id,
                            'voucherCreatedDate' => date('m/d/Y', strtotime($voucher->voucher_created_date)),
                            'voucherValue' => (float) $voucher->voucher_value, // Kept in data, but hidden in UI
                            'voucherItemsCount' => (int) $voucher->voucher_items_count,
                            'itemsAdult' => intval($voucher->adults) * $items_per_person,
                            'itemsChildren' => intval($voucher->children) * $items_per_person,
                            'adults' => intval($voucher->adults),
                            'children' => intval($voucher->children),
                            'voucherType' => explode(',', $voucher->voucher_type),
                            'storeHours' => $store_hours ?: 'Monday-Friday 9am-5pm',
                            'storeAddress' => $store_address,
                            'nextEligibleDate' => null,
                            'issuedBy' => $voucher->vincentian_name,
                            'issuedOrg' => $voucher->conference_name
                        ];
                        ?>
                        <tr>
                            <td>#
                                <?php echo $voucher->id; ?>
                            </td>
                            <td>
                                <?php echo date('m/d/Y', strtotime($voucher->voucher_created_date)); ?>
                            </td>
                            <td>
                                <strong>
                                    <?php echo esc_html($voucher->last_name . ', ' . $voucher->first_name); ?>
                                </strong><br>
                                <span style="color: #666; font-size: 11px;">DOB:
                                    <?php echo date('m/d/Y', strtotime($voucher->dob)); ?>
                                </span>
                            </td>
                            <td>
                                <?php echo esc_html($voucher->conference_name); ?>
                            </td>
                            <td>
                                <?php echo esc_html(ucwords(str_replace(',', ', ', $voucher->voucher_type))); ?>
                            </td>
                            <td>$
                                <?php echo number_format($voucher->voucher_value, 2); ?>
                            </td>
                            <td>
                                <?php
                                $status_colors = [
                                    'Active' => '#46b450',
                                    'Redeemed' => '#0073aa',
                                    'Expired' => '#999',
                                    'Void' => '#d63638',
                                    'Denied' => '#333'
                                ];
                                $color = $status_colors[$voucher->status] ?? '#666';

                                // Check expiration
                                if ($voucher->status === 'Active') {
                                    $created = new DateTime($voucher->voucher_created_date);
                                    $expires = clone $created;
                                    $expires->modify('+30 days');
                                    if (new DateTime() > $expires) {
                                        $voucher->status = 'Expired';
                                        $color = $status_colors['Expired'];
                                    }
                                }
                                ?>
                                <span style="color: <?php echo $color; ?>; font-weight: bold;">
                                    <?php echo $voucher->status; ?>
                                </span>
                            </td>
                            <td>
                                <button type="button" class="button button-small svdp-reprint-btn"
                                    data-voucher="<?php echo esc_attr(json_encode($print_data)); ?>">
                                    <span class="dashicons dashicons-printer" style="margin-top: 3px;"></span> Reprint
                                </button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>

        <script>
            jQuery(document).ready(funct ion ($) {
                $('.svdp-reprint-btn').on('click', func tion () {
                    const data = $(this).data('voucher');
                    if (window.SVDP_PrintReceipt) {
                        window.SVDP_PrintReceipt.showModal(data);
                    } else {
                        alert('Print module not loaded.');
                    }
                });
            });
        </script>
    </div>
</div>