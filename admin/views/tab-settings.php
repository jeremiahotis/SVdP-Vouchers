<div class="svdp-settings-tab">
    
    <div class="svdp-card">
        <h2>General Settings</h2>
        <p>Coming soon: Configure voucher expiration periods, coat reset dates, and other system settings.</p>
    </div>
    
    <div class="svdp-card">
        <h2>Database Info</h2>
        <?php
        global $wpdb;
        $vouchers_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}svdp_vouchers");
        $active_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}svdp_vouchers WHERE status = 'Active'");
        $redeemed_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}svdp_vouchers WHERE status = 'Redeemed'");
        $conferences_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}svdp_conferences WHERE active = 1");
        ?>
        
        <table class="widefat">
            <tr>
                <th>Total Vouchers</th>
                <td><?php echo number_format($vouchers_count); ?></td>
            </tr>
            <tr>
                <th>Active Vouchers</th>
                <td><?php echo number_format($active_count); ?></td>
            </tr>
            <tr>
                <th>Redeemed Vouchers</th>
                <td><?php echo number_format($redeemed_count); ?></td>
            </tr>
            <tr>
                <th>Active Conferences</th>
                <td><?php echo number_format($conferences_count); ?></td>
            </tr>
        </table>
    </div>
    
    <div class="svdp-card">
        <h2>System Information</h2>
        <table class="widefat">
            <tr>
                <th>Plugin Version</th>
                <td><?php echo SVDP_VOUCHERS_VERSION; ?></td>
            </tr>
            <tr>
                <th>WordPress Version</th>
                <td><?php echo get_bloginfo('version'); ?></td>
            </tr>
            <tr>
                <th>PHP Version</th>
                <td><?php echo PHP_VERSION; ?></td>
            </tr>
        </table>
    </div>
    
</div>