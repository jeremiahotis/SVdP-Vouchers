<div class="svdp-voucher-form">

    <h2>Voucher Request Form</h2>
    <p class="svdp-form-intro">Use this form to request a voucher on behalf of a neighbor in need.</p>

    <?php
    // Get global boilerplate text from settings
    $store_hours = SVDP_Settings::get_setting('store_hours', '');
    $redemption_instructions = SVDP_Settings::get_setting('redemption_instructions', '');

    // Get organization-specific custom text if set
    $custom_form_text = !empty($conference) ? ($conference->custom_form_text ?? '') : '';
    $custom_rules_text = !empty($conference) ? ($conference->custom_rules_text ?? '') : '';
    ?>

    <!-- Global Boilerplate -->
    <?php if (!empty($store_hours) || !empty($redemption_instructions)): ?>
        <div class="svdp-instructions">
            <h3>Store Information</h3>
            <?php if (!empty($store_hours)): ?>
                <p><strong>🏪 Hours:</strong> <?php echo esc_html($store_hours); ?></p>
            <?php endif; ?>
            <?php if (!empty($redemption_instructions)): ?>
                <p><strong>ℹ️ Instructions:</strong> <?php echo esc_html($redemption_instructions); ?></p>
            <?php endif; ?>
        </div>
    <?php endif; ?>

    <!-- Organization-Specific Custom Text -->
    <?php if (!empty($custom_form_text)): ?>
        <div class="svdp-custom-text">
            <h3><?php echo !empty($conference) ? esc_html($conference->name) : 'Organization'; ?> Information</h3>
            <p><?php echo nl2br(esc_html($custom_form_text)); ?></p>
        </div>
    <?php endif; ?>

    <!-- Organization-Specific Rules -->
    <?php if (!empty($custom_rules_text)): ?>
        <div class="svdp-custom-rules">
            <h3>Eligibility Requirements</h3>
            <div class="rules-content"><?php echo nl2br(esc_html($custom_rules_text)); ?></div>
        </div>
    <?php endif; ?>

    <?php
    // Get available voucher types
    if (!empty($conference)) {
        $allowed_types_raw = !empty($conference->allowed_voucher_types)
            ? json_decode($conference->allowed_voucher_types, true)
            : [];
    } else {
        // Default available types from settings
        $available_types = explode(',', SVDP_Settings::get_setting('available_voucher_types', 'clothing,furniture,household'));
        $allowed_types_raw = array_map('trim', $available_types);
    }

    $allowed_types = [];
    if (is_array($allowed_types_raw)) {
        foreach ($allowed_types_raw as $type) {
            $type = sanitize_key($type);
            if (!empty($type) && $type !== 'coat' && $type !== 'coats') {
                $allowed_types[] = $type;
            }
        }
    }

    $can_submit = count($allowed_types) > 0;

    // Check woodshop_paused from current conference context (if it's a store) or default store
    $woodshop_paused = false;
    
    if (!empty($conference) && $conference->organization_type === 'store') {
        $woodshop_paused = intval($conference->woodshop_paused) === 1;
    } else {
        $default_store_id = SVDP_Conference::get_default_store_id();
        $default_store = $default_store_id ? SVDP_Conference::get_by_id($default_store_id) : null;
        $woodshop_paused = !empty($default_store) && intval($default_store->woodshop_paused) === 1;
    }
    ?>

    <form id="svdpVoucherForm" class="svdp-form" <?php echo $can_submit ? '' : 'data-form-disabled="1"'; ?>>
        <h3>Neighbor Information</h3>

        <div class="svdp-form-row">
            <div class="svdp-form-group">
                <label>First Name *</label>
                <input type="text" name="firstName" required>
            </div>

            <div class="svdp-form-group">
                <label>Last Name *</label>
                <input type="text" name="lastName" required>
            </div>
        </div>

        <div class="svdp-form-group svdp-dob-field">
            <label>Date of Birth *</label>
            <input type="date" name="dob" id="svdp-dob-input" class="svdp-date-input" placeholder="MM/DD/YYYY" required>
            <small class="svdp-help-text">Used to track voucher eligibility and ensure appropriate intervals between
                requests.</small>
        </div>

        <div class="svdp-form-row">
            <div class="svdp-form-group">
                <label>Number of adults (18 and over) in household *</label>
                <input type="number" name="adults" min="0" value="1" required>
                <small class="svdp-help-text">Item allocation is based on household size. Count all adults in the
                    home.</small>
            </div>

            <div class="svdp-form-group">
                <label>Number of children (under 18) in household *</label>
                <input type="number" name="children" min="0" value="0">
                <small class="svdp-help-text">Item allocation is based on household size. Count all children in the
                    home.</small>
            </div>
        </div>

        <?php if (!$can_submit): ?>
            <div class="svdp-custom-rules">
                <h3>Voucher Requests Unavailable</h3>
                <div class="rules-content">This partner is not currently enabled for voucher requests.</div>
            </div>
        <?php elseif (count($allowed_types) > 1): ?>
            <div class="svdp-form-group">
                <label>Voucher Types *</label>
                <div class="svdp-voucher-type-list">
                    <?php foreach ($allowed_types as $type): ?>
                        <div class="svdp-voucher-type-card" data-type="<?php echo esc_attr($type); ?>">
                            <label class="svdp-type-header">
                                <input type="checkbox" name="voucherTypes[]" value="<?php echo esc_attr($type); ?>">
                                <?php echo esc_html(ucfirst($type)); ?>
                            </label>
                            <div class="svdp-type-body" style="display: none;">
                                <small class="svdp-help-text">Include <?php echo esc_html($type); ?> items on this
                                    voucher.</small>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
                <small class="svdp-help-text">Select all voucher types needed (Clothing, Furniture, Household
                    Items).</small>
            </div>
        <?php else: ?>
            <input type="hidden" name="voucherTypes[]" value="<?php echo esc_attr($allowed_types[0]); ?>">
            <div class="svdp-form-group">
                <label>Voucher Type</label>
                <div class="svdp-voucher-type-card is-single">
                    <div class="svdp-type-header"><?php echo esc_html(ucfirst($allowed_types[0])); ?></div>
                </div>
            </div>
        <?php endif; ?>

        <?php
        $single_allowed_type = (count($allowed_types) === 1) ? $allowed_types[0] : '';
        ?>

        <?php foreach ($allowed_types as $type): ?>
            <?php if ($type === 'clothing'): ?>
                <div class="svdp-type-section" data-type="clothing" <?php echo $type === $single_allowed_type ? 'data-default-open="1"' : ''; ?> style="display: none;">
                    <h3>Clothing</h3>
                </div>
            <?php elseif ($type === 'furniture' || $type === 'household'): ?>
                <?php
                $catalog_items = SVDP_Catalog::get_items($type, true);
                $items_by_category = [];
                foreach ($catalog_items as $item) {
                    $items_by_category[$item->category][] = $item;
                }
                ?>
                <div class="svdp-type-section" data-type="<?php echo esc_attr($type); ?>" <?php echo $type === $single_allowed_type ? 'data-default-open="1"' : ''; ?> style="display: none;">
                    <h3><?php echo esc_html(ucfirst($type)); ?> Items</h3>

                    <div class="svdp-catalog-categories">
                        <?php foreach (SVDP_Catalog::get_categories($type) as $category): ?>
                            <button type="button" class="svdp-category-tile" data-category="<?php echo esc_attr($category); ?>">
                                <?php echo esc_html($category); ?>
                            </button>
                        <?php endforeach; ?>
                    </div>

                    <div class="svdp-catalog-items" style="display: none;">
                        <div class="svdp-category-header">
                            <button type="button" class="svdp-back-to-categories">Back to categories</button>
                            <div class="svdp-category-title"></div>
                        </div>

                        <?php foreach (SVDP_Catalog::get_categories($type) as $category): ?>
                            <div class="svdp-category-items" data-category="<?php echo esc_attr($category); ?>"
                                style="display: none;">
                                <?php if (!empty($items_by_category[$category])): ?>
                                    <?php foreach ($items_by_category[$category] as $item): ?>
                                        <?php
                                        $is_woodshop = !empty($item->is_woodshop);
                                        $availability = $is_woodshop ? sanitize_key($item->availability_status ?? 'available') : 'available';
                                        if ($availability !== 'out_of_stock') {
                                            $availability = 'available';
                                        }
                                        ?>
                                        <div class="svdp-item" data-type="<?php echo esc_attr($type); ?>"
                                            data-item-id="<?php echo esc_attr($item->id); ?>"
                                            data-min="<?php echo esc_attr($item->min_price); ?>"
                                            data-max="<?php echo esc_attr($item->max_price); ?>"
                                            data-woodshop="<?php echo $is_woodshop ? '1' : '0'; ?>"
                                            data-availability="<?php echo esc_attr($availability); ?>">
                                            <div class="svdp-item-name">
                                                <?php echo esc_html($item->name); ?>
                                            </div>
                                            <?php if ($is_woodshop): ?>
                                                <div class="svdp-item-flags">
                                                    <?php if ($woodshop_paused): ?>
                                                        <span class="svdp-item-flag svdp-flag-paused">Woodshop paused (temporary)</span>
                                                    <?php endif; ?>
                                                    <?php if ($availability === 'out_of_stock'): ?>
                                                        <span class="svdp-item-flag svdp-flag-out">Currently out of stock</span>
                                                    <?php endif; ?>
                                                </div>
                                            <?php endif; ?>
                                            <div class="svdp-qty-controls">
                                                <button type="button" class="svdp-qty-btn svdp-qty-minus">−</button>
                                                <input type="number" class="svdp-qty-input" value="0" min="0">
                                                <button type="button" class="svdp-qty-btn svdp-qty-plus">+</button>
                                            </div>
                                            <button type="button" class="svdp-toggle-note">Add note</button>
                                            <textarea class="svdp-item-note" rows="2" placeholder="Optional item note"
                                                style="display: none;"></textarea>
                                        </div>
                                    <?php endforeach; ?>
                                <?php else: ?>
                                    <div class="svdp-empty-category">No items in this category.</div>
                                <?php endif; ?>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <div class="svdp-totals" style="display: none;">
                        <strong>Estimated total:</strong>
                        <span class="svdp-total-range">$0 – $0</span>
                    </div>
                </div>
            <?php endif; ?>
        <?php endforeach; ?>

        <h3>Requestor Information</h3>

        <?php if (empty($conference)): ?>
            <div class="svdp-form-group">
                <label>Conference or Partner Organization *</label>
                <select name="conference" required>
                    <option value="">Select your organization...</option>
                    <?php foreach ($conferences as $conf): ?>
                        <option value="<?php echo esc_attr($conf->slug); ?>"><?php echo esc_html($conf->name); ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
        <?php else: ?>
            <input type="hidden" name="conference" value="<?php echo esc_attr($conference->slug); ?>">
            <p><strong>Organization:</strong> <?php echo esc_html($conference->name); ?></p>
        <?php endif; ?>

        <div class="svdp-form-group">
            <label>Your Name *</label>
            <input type="text" name="vincentianName" required>
            <small class="svdp-help-text">Your name as the staff member or volunteer requesting this voucher</small>
        </div>

        <div class="svdp-form-group">
            <label>Your Email Address *</label>
            <input type="email" name="vincentianEmail" required>
            <small class="svdp-help-text">For voucher confirmation and follow-up if needed</small>
        </div>

        <button type="submit" class="svdp-btn svdp-btn-primary" <?php echo $can_submit ? '' : 'disabled'; ?>>Submit
            Voucher Request</button>
    </form>

    <div id="svdpFormMessage" class="svdp-message" style="display: none;"></div>

</div>