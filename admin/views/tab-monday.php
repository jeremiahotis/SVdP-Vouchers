<div class="svdp-monday-tab">
    
    <div class="svdp-card">
        <h2>Monday.com Integration</h2>
        <p>Enable optional sync to keep a Monday.com board in sync with your vouchers. This is completely optional - the plugin works standalone.</p>
        
        <form method="post" action="options.php">
            <?php settings_fields('svdp_vouchers_monday'); ?>
            
            <table class="form-table">
                <tr>
                    <th>Enable Monday.com Sync</th>
                    <td>
                        <label>
                            <input type="checkbox" name="svdp_vouchers_monday_sync_enabled" value="1" <?php checked(get_option('svdp_vouchers_monday_sync_enabled'), 1); ?>>
                            Sync vouchers to Monday.com
                        </label>
                        <p class="description">When enabled, all voucher changes will be synced to Monday.com</p>
                    </td>
                </tr>
                
                <tr>
                    <th><label for="monday_api_key">API Key</label></th>
                    <td>
                        <input type="text" id="monday_api_key" name="svdp_vouchers_monday_api_key" value="<?php echo esc_attr(get_option('svdp_vouchers_monday_api_key')); ?>" class="large-text">
                        <p class="description">Get your API key from Monday.com → Avatar → Developers → API</p>
                    </td>
                </tr>
                
                <tr>
                    <th><label for="monday_board_id">Board ID</label></th>
                    <td>
                        <input type="text" id="monday_board_id" name="svdp_vouchers_monday_board_id" value="<?php echo esc_attr(get_option('svdp_vouchers_monday_board_id')); ?>" class="regular-text">
                        <p class="description">The numeric ID of your Monday.com board</p>
                    </td>
                </tr>
                
                <tr>
                    <th><label for="monday_column_ids">Column IDs (JSON)</label></th>
                    <td>
                        <textarea id="monday_column_ids" name="svdp_vouchers_monday_column_ids" rows="15" class="large-text code"><?php echo esc_textarea(get_option('svdp_vouchers_monday_column_ids', '{}')); ?></textarea>
                        <p class="description">JSON mapping of column IDs. Example format:</p>
                        <pre class="code-example">{
  "firstName": "text_abc123",
  "lastName": "text_def456",
  "dob": "date_ghi789",
  "adults": "numeric_jkl012",
  "children": "numeric_mno345"
}</pre>
                    </td>
                </tr>
            </table>
            
            <?php submit_button('Save Monday.com Settings'); ?>
        </form>
    </div>
    
    <div class="svdp-card">
        <h2>Sync Status</h2>
        <?php if (get_option('svdp_vouchers_monday_sync_enabled')): ?>
            <p class="sync-status enabled">✅ Monday.com sync is <strong>enabled</strong></p>
            <p>All new vouchers and updates will be synced to Monday.com automatically.</p>
        <?php else: ?>
            <p class="sync-status disabled">⚪ Monday.com sync is <strong>disabled</strong></p>
            <p>The plugin is operating in standalone mode. Enable sync above to connect to Monday.com.</p>
        <?php endif; ?>
    </div>
    
</div>