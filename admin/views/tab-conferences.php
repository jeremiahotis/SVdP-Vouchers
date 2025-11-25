<div class="svdp-conferences-tab">
    
    <div class="svdp-card">
        <h2>Add New Conference</h2>
        <form id="svdp-add-conference-form">
            <table class="form-table">
                <tr>
                    <th><label for="conference_name">Conference Name *</label></th>
                    <td>
                        <input type="text" id="conference_name" name="name" class="regular-text" required>
                        <p class="description">Full name of the conference (e.g., "St Mary - Fort Wayne")</p>
                    </td>
                </tr>
                <tr>
                    <th><label for="conference_slug">Slug</label></th>
                    <td>
                        <input type="text" id="conference_slug" name="slug" class="regular-text">
                        <p class="description">URL-friendly version (auto-generated if left blank)</p>
                    </td>
                </tr>
            </table>
            <p class="submit">
                <button type="submit" class="button button-primary">Add Conference</button>
            </p>
        </form>
        <div id="add-conference-message"></div>
    </div>
    
    <div class="svdp-card">
        <h2>Existing Conferences</h2>
        <p class="description">
            These conferences are available for voucher requests. 
            <strong>Emergency</strong> cannot be deleted as it's used by the cashier station.
        </p>
        
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Shortcode</th>
                    <th>Monday Label</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="conferences-list">
                <?php
                $conferences = SVDP_Conference::get_all(false);
                foreach ($conferences as $conference):
                    $is_emergency = $conference->is_emergency;
                ?>
                <tr data-id="<?php echo $conference->id; ?>" class="<?php echo !$conference->active ? 'inactive' : ''; ?>">
                    <td>
                        <strong><?php echo esc_html($conference->name); ?></strong>
                        <?php if (!$conference->active): ?>
                            <span class="dashicons dashicons-hidden" title="Inactive"></span>
                        <?php endif; ?>
                    </td>
                    <td><code><?php echo esc_html($conference->slug); ?></code></td>
                    <td>
                        <input type="text" readonly value='[svdp_voucher_request conference="<?php echo esc_attr($conference->slug); ?>"]' class="shortcode-input" onclick="this.select()">
                    </td>
                    <td>
                        <input type="text" class="monday-label" value="<?php echo esc_attr($conference->monday_label); ?>" data-id="<?php echo $conference->id; ?>" placeholder="Same as name">
                    </td>
                    <td>
                        <?php if (!$is_emergency): ?>
                            <button class="button update-conference" data-id="<?php echo $conference->id; ?>">Update</button>
                            <button class="button delete-conference" data-id="<?php echo $conference->id; ?>">Delete</button>
                        <?php else: ?>
                            <em>System conference</em>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    
    <div class="svdp-card">
        <h2>Usage Instructions</h2>
        <ol>
            <li>Create a new WordPress page for each conference (e.g., "Virtual Clothing Voucher - St Mary")</li>
            <li>Copy the shortcode from the table above</li>
            <li>Paste the shortcode into the page content</li>
            <li>Publish the page</li>
        </ol>
        <p><strong>For the cashier station:</strong> Create a page and use the shortcode <code>[svdp_cashier_station]</code></p>
        <p class="description">Only users with the "SVdP Cashier" role or administrators can access the cashier station.</p>
    </div>
    
</div>