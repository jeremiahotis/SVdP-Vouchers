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

    <form id="svdpVoucherForm" class="svdp-form">
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
            <input type="date"
                   name="dob"
                   id="svdp-dob-input"
                   class="svdp-date-input"
                   placeholder="MM/DD/YYYY"
                   required>
            <small class="svdp-help-text">Used to track voucher eligibility and ensure appropriate intervals between requests.</small>
        </div>

        <div class="svdp-form-row">
            <div class="svdp-form-group">
                <label>Number of adults (18 and over) in household *</label>
                <input type="number" name="adults" min="0" value="1" required>
                <small class="svdp-help-text">Item allocation is based on household size. Count all adults in the home.</small>
            </div>

            <div class="svdp-form-group">
                <label>Number of children (under 18) in household *</label>
                <input type="number" name="children" min="0" value="0">
                <small class="svdp-help-text">Item allocation is based on household size. Count all children in the home.</small>
            </div>
        </div>

        <?php
        // Get available voucher types
        if (!empty($conference)) {
            $allowed_types = !empty($conference->allowed_voucher_types)
                ? json_decode($conference->allowed_voucher_types, true)
                : ['clothing'];
        } else {
            // Default available types from settings
            $available_types = explode(',', SVDP_Settings::get_setting('available_voucher_types', 'clothing,furniture,household'));
            $allowed_types = array_map('trim', $available_types);
        }
        ?>

        <?php if (count($allowed_types) > 1): ?>
        <div class="svdp-form-group">
            <label>Voucher Type *</label>
            <select name="voucherType" required>
                <option value="">Select voucher type...</option>
                <?php foreach ($allowed_types as $type): ?>
                    <option value="<?php echo esc_attr($type); ?>"><?php echo esc_html(ucfirst($type)); ?></option>
                <?php endforeach; ?>
            </select>
            <small class="svdp-help-text">Select the type of voucher needed (Clothing, Furniture, Household Items).</small>
        </div>
        <?php else: ?>
        <input type="hidden" name="voucherType" value="<?php echo esc_attr($allowed_types[0]); ?>">
        <?php endif; ?>

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

        <button type="submit" class="svdp-btn svdp-btn-primary">Submit Voucher Request</button>
    </form>

    <div id="svdpFormMessage" class="svdp-message" style="display: none;"></div>

</div>
