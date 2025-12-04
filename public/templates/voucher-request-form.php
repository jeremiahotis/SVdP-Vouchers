<div class="svdp-voucher-form">

    <h2>Request a Virtual Clothing Voucher</h2>

    <div class="svdp-instructions">
        <h3>What are Virtual Clothing Vouchers?</h3>
        <p>Virtual Clothing Vouchers replace paper vouchers and allow your Neighbors to access the clothing they need in a dignified manner that maintains their self-respect and gives them the power of personal choice.</p>

        <div class="svdp-important-box">
            <p><strong>⏱️ Processing Time:</strong> Vouchers are processed immediately and are ready to use right away.</p>

            <p><strong>🏪 Thrift Store Voucher Hours:</strong> 9:30 AM – 4:00 PM</p>

            <p><strong>Important:</strong> Please remind your Neighbor to stop by the Customer Service Desk at the Thrift Store <em>before</em> shopping to receive instructions. This ensures their voucher experience goes smoothly!</p>
        </div>
    </div>

    <form id="svdpVoucherForm" class="svdp-form">
        <h3>Neighbor Information</h3>

        <div class="svdp-form-row">
            <div class="svdp-form-group">
                <label>Neighbor's First Name *</label>
                <input type="text" name="firstName" required>
            </div>

            <div class="svdp-form-group">
                <label>Neighbor's Last Name *</label>
                <input type="text" name="lastName" required>
            </div>
        </div>

        <div class="svdp-form-group">
            <label>Neighbor's Date of Birth *</label>
            <input type="text" name="dob" placeholder="MM/DD/YYYY" pattern="\d{2}/\d{2}/\d{4}" required>
            <small class="svdp-help-text">We use birthdates to make sure each household receives vouchers at appropriate intervals. This helps us serve more families in our community.</small>
        </div>

        <div class="svdp-form-row">
            <div class="svdp-form-group">
                <label>How many adults (18 and over) are in your Neighbor's household? *</label>
                <input type="number" name="adults" min="0" value="1" required>
                <small class="svdp-help-text">Each household member receives $20 in conference vouchers. Please count all adults.</small>
            </div>

            <div class="svdp-form-group">
                <label>How many children (under 18) are in your Neighbor's household? *</label>
                <input type="number" name="children" min="0" value="0">
                <small class="svdp-help-text">Each household member receives $20 in conference vouchers. Please count all children.</small>
            </div>
        </div>

        <h3>Your Information</h3>

        <?php if (empty($conference)): ?>
        <div class="svdp-form-group">
            <label>What Conference are you with? *</label>
            <select name="conference" required>
                <option value="">Select your Conference...</option>
                <?php foreach ($conferences as $conf): ?>
                    <option value="<?php echo esc_attr($conf->slug); ?>"><?php echo esc_html($conf->name); ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <?php else: ?>
        <input type="hidden" name="conference" value="<?php echo esc_attr($conference->slug); ?>">
        <p><strong>Conference:</strong> <?php echo esc_html($conference->name); ?></p>
        <?php endif; ?>

        <div class="svdp-form-group">
            <label>What is your name? *</label>
            <input type="text" name="vincentianName" required>
            <small class="svdp-help-text">Your name as a Vincentian</small>
        </div>

        <div class="svdp-form-group">
            <label>What is your email address? *</label>
            <input type="email" name="vincentianEmail" required>
            <small class="svdp-help-text">Sometimes there might be questions about a voucher. Having your email lets us reach out quickly if anything comes up. We want to keep you in the loop and help you support your Neighbor!</small>
        </div>

        <button type="submit" class="svdp-btn svdp-btn-primary">Submit Voucher Request</button>
    </form>

    <div id="svdpFormMessage" class="svdp-message" style="display: none;"></div>

</div>
