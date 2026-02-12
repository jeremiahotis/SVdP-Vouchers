<?php
// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Pagination
$page = isset($_GET['paged']) ? max(1, intval($_GET['paged'])) : 1;
$per_page = 20;
$offset = ($page - 1) * $per_page;

// Get events
$events = SVDP_Audit::get_override_events($per_page, $offset);

// Get total for pagination (simple count query)
global $wpdb;
$total_events = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}svdp_audit_events WHERE event_type = 'override'");
$total_pages = ceil($total_events / $per_page);

?>

<div class="svdp-tab-content">
    <h2>Override Audit Trail</h2>
    <p>View all manager override events.</p>

    <div class="audit-log-table-wrapper">
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>Date/Time</th>
                    <th>Voucher ID</th>
                    <th>Manager</th>
                    <th>Cashier</th>
                    <th>Reason</th>
                    <th>Type</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($events)): ?>
                    <tr>
                        <td colspan="7">No override events found.</td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($events as $event): ?>
                        <tr>
                            <td>
                                <?php echo esc_html($event->created_at); ?>
                            </td>
                            <td>
                                <?php if ($event->voucher_id): ?>
                                    #
                                    <?php echo esc_html($event->voucher_id); ?>
                                <?php else: ?>
                                    -
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php echo esc_html($event->manager_name ?? 'Unknown'); ?>
                            </td>
                            <td>
                                <?php echo esc_html($event->cashier_name ?? 'Unknown'); ?>
                            </td>
                            <td>
                                <?php echo esc_html($event->reason_text ?? 'Unknown'); ?>
                            </td>
                            <td>
                                <?php echo esc_html($event->override_type); ?>
                            </td>
                            <td>
                                <?php echo esc_html($event->notes); ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>

    <!-- Pagination -->
    <?php if ($total_pages > 1): ?>
        <div class="tablenav bottom">
            <div class="tablenav-pages">
                <span class="displaying-num">
                    <?php echo $total_events; ?> items
                </span>
                <span class="pagination-links">
                    <?php
                    $current_url = remove_query_arg('paged');

                    if ($page > 1) {
                        echo '<a class="prev-page button" href="' . esc_url(add_query_arg('paged', $page - 1, $current_url)) . '">‹</a>';
                    }

                    echo '<span class="screen-reader-text">Current Page</span>';
                    echo '<span id="table-paging" class="paging-input"><span class="tablenav-paging-text">' . $page . ' of <span class="total-pages">' . $total_pages . '</span></span></span>';

                    if ($page < $total_pages) {
                        echo '<a class="next-page button" href="' . esc_url(add_query_arg('paged', $page + 1, $current_url)) . '">›</a>';
                    }
                    ?>
                </span>
            </div>
        </div>
    <?php endif; ?>

</div>