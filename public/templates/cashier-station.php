<div class="svdp-cashier-container">
    
    <!-- Voucher Table -->
    <div class="svdp-table-wrapper">
        <h2>Active Vouchers</h2>
        <div class="svdp-table-scroll">
            <table id="svdpVoucherTable" class="display compact" style="width:100%; font-size: 12px;">
                <thead>
                    <tr>
                        <th>Neighbor</th>
                        <th>DOB</th>
                        <th>Qty</th>
                        <th>Conference</th>
                        <th>Created</th>
                        <th>Status</th>
                        <th>Redeemed</th>
                        <th>Winter Coat</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </div>
    
    <!-- Emergency Voucher Form -->
    <div class="svdp-emergency-form-wrapper">
        <h3>Emergency Voucher</h3>
        <form id="svdpEmergencyForm" class="svdp-form">
            <div class="svdp-form-group">
                <label>First Name *</label>
                <input type="text" name="firstName" required>
            </div>
            
            <div class="svdp-form-group">
                <label>Last Name *</label>
                <input type="text" name="lastName" required>
            </div>
            
            <div class="svdp-form-group">
                <label>Date of Birth *</label>
                <input type="date" name="dob" required>
            </div>
            
            <div class="svdp-form-row">
                <div class="svdp-form-row">
                <div class="svdp-form-group">
                    <label># Adults *</label>
                    <input type="number" name="adults" min="0" value="1" required>
                    <small class="svdp-help-text">Emergency: $10 per person</small>
                </div>
                
                <div class="svdp-form-group">
                    <label># Children *</label>
                    <input type="number" name="children" min="0" value="0" required>
                    <small class="svdp-help-text">Emergency: $10 per person</small>
                </div>
            </div>
            </div>
            
            <button type="submit" class="svdp-btn svdp-btn-primary">Create Emergency Voucher</button>
        </form>
        
        <div id="svdpEmergencyMessage" class="svdp-message" style="display: none;"></div>
    </div>
    
</div>

<!-- Override Modal -->
<div id="svdpOverrideModal" class="svdp-modal">
    <div class="svdp-modal-content">
        <h3>⚠️ Duplicate Found</h3>
        <p id="svdpOverrideMessage"></p>
        
        <div id="svdpCashierNameSection" class="svdp-cashier-name-section" style="display: none;">
            <label for="svdpCashierName">Your Name *</label>
            <input type="text" id="svdpCashierName" placeholder="Enter your name" required>
            <small>This will be recorded in the override note for accountability.</small>
        </div>
        
        <div class="svdp-modal-buttons">
            <button id="svdpCancelOverride" class="svdp-btn svdp-btn-secondary">Cancel</button>
            <button id="svdpConfirmOverride" class="svdp-btn svdp-btn-warning">Override & Create</button>
        </div>
    </div>
</div>
