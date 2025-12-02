<?php
global $wpdb;
$vouchers_table = $wpdb->prefix . 'svdp_vouchers';
$conferences_table = $wpdb->prefix . 'svdp_conferences';

// Get date ranges
$today = date('Y-m-d');
$thirty_days_ago = date('Y-m-d', strtotime('-30 days'));
$ninety_days_ago = date('Y-m-d', strtotime('-90 days'));
$this_year = date('Y-01-01');

// Overall stats
$total_vouchers = $wpdb->get_var("SELECT COUNT(*) FROM $vouchers_table WHERE status != 'Denied'");
$active_vouchers = $wpdb->get_var("SELECT COUNT(*) FROM $vouchers_table WHERE status = 'Active' AND voucher_created_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)");
$redeemed_vouchers = $wpdb->get_var("SELECT COUNT(*) FROM $vouchers_table WHERE status = 'Redeemed'");
$denied_vouchers = $wpdb->get_var("SELECT COUNT(*) FROM $vouchers_table WHERE status = 'Denied'");

// Time-based stats
$vouchers_30_days = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $vouchers_table WHERE voucher_created_date >= %s AND status != 'Denied'", $thirty_days_ago));
$vouchers_90_days = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $vouchers_table WHERE voucher_created_date >= %s AND status != 'Denied'", $ninety_days_ago));
$vouchers_this_year = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $vouchers_table WHERE voucher_created_date >= %s AND status != 'Denied'", $this_year));

// Household stats
$total_adults = $wpdb->get_var("SELECT SUM(adults) FROM $vouchers_table WHERE status != 'Denied'");
$total_children = $wpdb->get_var("SELECT SUM(children) FROM $vouchers_table WHERE status != 'Denied'");
$total_people_served = $total_adults + $total_children;
$total_value = $wpdb->get_var("SELECT SUM(voucher_value) FROM $vouchers_table WHERE status != 'Denied'");

// Conference breakdown
$conference_stats = $wpdb->get_results("
    SELECT c.name, 
           COUNT(v.id) as voucher_count,
           SUM(v.adults + v.children) as people_served,
           SUM(v.voucher_value) as total_value
    FROM $conferences_table c
    LEFT JOIN $vouchers_table v ON c.id = v.conference_id AND v.status != 'Denied'
    WHERE c.active = 1
    GROUP BY c.id, c.name
    ORDER BY voucher_count DESC
");

// Coat stats
$coats_issued = $wpdb->get_var("SELECT COUNT(*) FROM $vouchers_table WHERE coat_status = 'Issued'");
$coats_issued_this_season = $wpdb->get_var("SELECT COUNT(*) FROM $vouchers_table WHERE coat_status = 'Issued' AND coat_issued_date >= DATE_FORMAT(CURDATE(), '%Y-08-01')");
?>

<div class="svdp-analytics-tab">
    
    <!-- Overall Stats -->
    <div class="svdp-card">
        <h2>📊 Overview Statistics</h2>
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-number"><?php echo number_format($total_vouchers); ?></div>
                <div class="stat-label">Total Vouchers</div>
            </div>
            <div class="stat-box">
                <div class="stat-number"><?php echo number_format($active_vouchers); ?></div>
                <div class="stat-label">Active (30 days)</div>
            </div>
            <div class="stat-box">
                <div class="stat-number"><?php echo number_format($redeemed_vouchers); ?></div>
                <div class="stat-label">Redeemed</div>
            </div>
            <div class="stat-box warning">
                <div class="stat-number"><?php echo number_format($denied_vouchers); ?></div>
                <div class="stat-label">Denied/Blocked</div>
            </div>
        </div>
    </div>
    
    <!-- Time Period Stats -->
    <div class="svdp-card">
        <h2>📅 Time Period Analysis</h2>
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-number"><?php echo number_format($vouchers_30_days); ?></div>
                <div class="stat-label">Last 30 Days</div>
            </div>
            <div class="stat-box">
                <div class="stat-number"><?php echo number_format($vouchers_90_days); ?></div>
                <div class="stat-label">Last 90 Days</div>
            </div>
            <div class="stat-box">
                <div class="stat-number"><?php echo number_format($vouchers_this_year); ?></div>
                <div class="stat-label">This Year (<?php echo date('Y'); ?>)</div>
            </div>
        </div>
    </div>
    
    <!-- Impact Stats -->
    <div class="svdp-card">
        <h2>👥 Community Impact</h2>
        <div class="stats-grid">
            <div class="stat-box success">
                <div class="stat-number"><?php echo number_format($total_people_served); ?></div>
                <div class="stat-label">People Served</div>
                <div class="stat-detail"><?php echo number_format($total_adults); ?> adults, <?php echo number_format($total_children); ?> children</div>
            </div>
            <div class="stat-box success">
                <div class="stat-number">$<?php echo number_format($total_value); ?></div>
                <div class="stat-label">Total Value Provided</div>
            </div>
            <div class="stat-box info">
                <div class="stat-number"><?php echo number_format($coats_issued); ?></div>
                <div class="stat-label">Winter Coats Issued (All Time)</div>
            </div>
            <div class="stat-box info">
                <div class="stat-number"><?php echo number_format($coats_issued_this_season); ?></div>
                <div class="stat-label">Coats This Season</div>
            </div>
        </div>
    </div>
    
    <!-- Conference Breakdown -->
    <div class="svdp-card">
        <h2>🏛️ Conference Performance</h2>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>Conference</th>
                    <th>Vouchers</th>
                    <th>People Served</th>
                    <th>Total Value</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($conference_stats as $stat): ?>
                <tr>
                    <td><strong><?php echo esc_html($stat->name); ?></strong></td>
                    <td><?php echo number_format($stat->voucher_count); ?></td>
                    <td><?php echo number_format($stat->people_served); ?></td>
                    <td>$<?php echo number_format($stat->total_value); ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <!-- Denied Vouchers Analysis -->
    <div class="svdp-card">
        <h2>🚫 Denied/Blocked Vouchers</h2>
        <p class="description">These are voucher requests that were blocked due to eligibility rules. This data helps us understand demand and identify people attempting to get multiple vouchers.</p>
        
        <?php
        $denied_30_days = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $vouchers_table WHERE status = 'Denied' AND voucher_created_date >= %s", $thirty_days_ago));
        $denied_by_conference = $wpdb->get_results("
            SELECT c.name, COUNT(v.id) as denied_count
            FROM $vouchers_table v
            LEFT JOIN $conferences_table c ON v.conference_id = c.id
            WHERE v.status = 'Denied'
            GROUP BY c.id, c.name
            ORDER BY denied_count DESC
            LIMIT 10
        ");
        
        // Get recent denied vouchers
        $recent_denied = $wpdb->get_results("
            SELECT v.*, c.name as conference_name
            FROM $vouchers_table v
            LEFT JOIN $conferences_table c ON v.conference_id = c.id
            WHERE v.status = 'Denied'
            ORDER BY v.created_at DESC
            LIMIT 20
        ");
        ?>
        
        <div class="stats-grid" style="margin-bottom: 20px;">
            <div class="stat-box warning">
                <div class="stat-number"><?php echo number_format($denied_vouchers); ?></div>
                <div class="stat-label">Total Denied (All Time)</div>
            </div>
            <div class="stat-box warning">
                <div class="stat-number"><?php echo number_format($denied_30_days); ?></div>
                <div class="stat-label">Denied (Last 30 Days)</div>
            </div>
        </div>
        
        <h3>Denied by Conference</h3>
        <table class="wp-list-table widefat fixed striped" style="margin-bottom: 20px;">
            <thead>
                <tr>
                    <th>Conference</th>
                    <th>Denied Count</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($denied_by_conference as $stat): ?>
                <tr>
                    <td><?php echo esc_html($stat->name); ?></td>
                    <td><?php echo number_format($stat->denied_count); ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        
        <h3>Recent Denied Vouchers</h3>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>DOB</th>
                    <th>Conference</th>
                    <th>Requested By</th>
                    <th>Date</th>
                    <th>Reason</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($recent_denied as $voucher): ?>
                <tr>
                    <td><?php echo esc_html($voucher->first_name . ' ' . $voucher->last_name); ?></td>
                    <td><?php echo esc_html($voucher->dob); ?></td>
                    <td><?php echo esc_html($voucher->conference_name); ?></td>
                    <td><?php echo esc_html($voucher->vincentian_name ?: $voucher->created_by); ?></td>
                    <td><?php echo esc_html($voucher->voucher_created_date); ?></td>
                    <td><small><?php echo esc_html($voucher->denial_reason); ?></small></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    
    <!-- Export Section -->
    <div class="svdp-card">
        <h2>📥 Export Data</h2>
        <p>Download voucher data for reporting and analysis.</p>
        
        <form id="svdp-export-form" method="post" action="<?php echo admin_url('admin-post.php'); ?>">
            <input type="hidden" name="action" value="svdp_export_vouchers">
            <?php wp_nonce_field('svdp_export', 'svdp_export_nonce'); ?>
            
            <table class="form-table">
                <tr>
                    <th><label>Date Range</label></th>
                    <td>
                        <select name="date_range" id="export_date_range">
                            <option value="all">All Time</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 90 Days</option>
                            <option value="365">Last Year</option>
                            <option value="ytd">Year to Date</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </td>
                </tr>
                <tr id="custom_date_row" style="display: none;">
                    <th><label>Custom Dates</label></th>
                    <td>
                        <input type="date" name="start_date" id="start_date">
                        <span> to </span>
                        <input type="date" name="end_date" id="end_date">
                    </td>
                </tr>
                <tr>
                    <th><label>Include Denied Vouchers?</label></th>
                    <td>
                        <label>
                            <input type="checkbox" name="include_denied" value="1">
                            Include blocked/denied vouchers in export
                        </label>
                    </td>
                </tr>
            </table>
            
            <p class="submit">
                <button type="submit" class="button button-primary">Export to Excel</button>
            </p>
        </form>
    </div>
    
</div>

<style>
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.stat-box {
    background: white;
    border: 1px solid #ddd;
    border-left: 4px solid #006BA8;
    padding: 20px;
    text-align: center;
    border-radius: 4px;
}

.stat-box.success {
    border-left-color: #28a745;
}

.stat-box.warning {
    border-left-color: #ffc107;
}

.stat-box.info {
    border-left-color: #17a2b8;
}

.stat-number {
    font-size: 32px;
    font-weight: bold;
    color: #006BA8;
    margin-bottom: 5px;
}

.stat-box.success .stat-number {
    color: #28a745;
}

.stat-box.warning .stat-number {
    color: #ff9800;
}

.stat-box.info .stat-number {
    color: #17a2b8;
}

.stat-label {
    font-size: 14px;
    color: #666;
    font-weight: 600;
}

.stat-detail {
    font-size: 12px;
    color: #999;
    margin-top: 5px;
}
</style>

<script>
jQuery(document).ready(function($) {
    $('#export_date_range').on('change', function() {
        if ($(this).val() === 'custom') {
            $('#custom_date_row').show();
        } else {
            $('#custom_date_row').hide();
        }
    });
});
</script>
