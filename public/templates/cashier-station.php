<div class="svdp-cashier-container">

    <!-- Header with Search and Filters -->
    <div class="svdp-cashier-header">
        <h1>Cashier Station</h1>

        <div class="svdp-search-filter-bar">
            <div class="svdp-search-box">
                <input type="text" id="svdpSearchInput" placeholder="Search by name, DOB, or conference...">
            </div>

            <div class="svdp-filter-buttons">
                <button class="svdp-filter-btn active" data-filter="all">All</button>
                <button class="svdp-filter-btn" data-filter="active">Active</button>
                <button class="svdp-filter-btn" data-filter="redeemed">Redeemed</button>
                <button class="svdp-filter-btn" data-filter="expired">Expired</button>
                <button class="svdp-filter-btn" data-filter="coat-available">Coat Available</button>
            </div>

            <select class="svdp-sort-dropdown" id="svdpSortDropdown">
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
            </select>
        </div>
    </div>

    <!-- Stats Bar -->
    <div class="svdp-stats-bar">
        <div class="svdp-stat-item">
            <span class="svdp-stat-label">Active Vouchers</span>
            <span class="svdp-stat-value" id="statActive">-</span>
        </div>
        <div class="svdp-stat-item">
            <span class="svdp-stat-label">Redeemed Today</span>
            <span class="svdp-stat-value" id="statRedeemed">-</span>
        </div>
        <div class="svdp-stat-item">
            <span class="svdp-stat-label">Coats Available</span>
            <span class="svdp-stat-value" id="statCoats">-</span>
        </div>
        <div class="svdp-stat-item">
            <span class="svdp-stat-label">Showing</span>
            <span class="svdp-stat-value" id="statShowing">-</span>
        </div>
    </div>

    <!-- Main Content Layout -->
    <div class="svdp-main-content">

        <!-- Vouchers Section -->
        <div class="svdp-vouchers-section">
            <!-- Loading State -->
            <div id="svdpLoadingState" class="svdp-loading">
                <div class="svdp-spinner"></div>
                <p>Loading vouchers...</p>
            </div>

            <!-- Vouchers Container -->
            <div id="svdpVouchersContainer" class="svdp-vouchers-container"></div>

            <!-- Load More Button -->
            <button id="svdpLoadMore" class="svdp-btn svdp-load-more" style="display: none;">
                Load More Vouchers
            </button>
        </div>

        <!-- Emergency Voucher Form Sidebar -->
        <div class="svdp-emergency-form-wrapper">
            <h3>Emergency Voucher</h3>

            <div id="svdpEmergencyMessage" class="svdp-message" style="display: none;"></div>

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

                <button type="submit" class="svdp-btn svdp-btn-primary">Create Emergency Voucher</button>
            </form>
        </div>

    </div>

</div>

<!-- Override Modal -->
<div id="svdpOverrideModal" class="svdp-modal">
    <div class="svdp-modal-content">
        <h3>⚠️ Duplicate Found - Manager Approval Required</h3>
        <p id="svdpOverrideMessage"></p>

        <div class="svdp-override-fields">
            <div class="svdp-form-group">
                <label for="svdpManagerCode">Manager Code *</label>
                <input type="password"
                       id="svdpManagerCode"
                       placeholder="Enter 6-digit code"
                       maxlength="6"
                       pattern="[0-9]{6}"
                       required>
                <small>Enter the manager's 6-digit approval code</small>
            </div>

            <div class="svdp-form-group">
                <label for="svdpOverrideReason">Reason *</label>
                <select id="svdpOverrideReason" required>
                    <option value="">Select a reason...</option>
                    <!-- Populated via JavaScript -->
                </select>
            </div>
        </div>

        <div class="svdp-modal-buttons">
            <button id="svdpCancelOverride" class="svdp-btn svdp-btn-secondary">Cancel</button>
            <button id="svdpConfirmOverride" class="svdp-btn svdp-btn-warning">Validate & Create</button>
        </div>
    </div>
</div>

<!-- Coat Issue Modal -->
<div id="svdpCoatModal" class="svdp-modal">
    <div class="svdp-modal-content">
        <h3>🧥 Issue Winter Coats</h3>
        <p id="svdpCoatVoucherInfo" style="margin-bottom: 20px; padding: 10px; background: #f0f0f0; border-radius: 4px;"></p>

        <form id="svdpCoatForm">
            <input type="hidden" id="svdpCoatVoucherId" value="">

            <div class="svdp-form-group">
                <label for="svdpCoatAdults"># of Adult Coats *</label>
                <input type="number" id="svdpCoatAdults" min="0" value="0" required>
                <small>Maximum: <span id="svdpCoatMaxAdults">0</span> adults in household</small>
            </div>

            <div class="svdp-form-group">
                <label for="svdpCoatChildren"># of Children's Coats *</label>
                <input type="number" id="svdpCoatChildren" min="0" value="0" required>
                <small>Maximum: <span id="svdpCoatMaxChildren">0</span> children in household</small>
            </div>

            <div id="svdpCoatTotal" style="margin: 15px 0; padding: 10px; background: #e8f4f8; border-left: 4px solid #006BA8; font-weight: bold;">
                Total Coats: <span id="svdpCoatTotalCount">0</span>
            </div>

            <div class="svdp-modal-buttons">
                <button type="button" id="svdpCancelCoat" class="svdp-btn svdp-btn-secondary">Cancel</button>
                <button type="submit" id="svdpConfirmCoat" class="svdp-btn svdp-btn-primary">Issue Coats</button>
            </div>
        </form>
    </div>
</div>

<!-- Redemption Modal -->
<div id="svdpRedemptionModal" class="svdp-modal">
    <div class="svdp-modal-content">
        <h3>🎫 Redeem Voucher</h3>
        <div id="svdpRedemptionVoucherInfo" style="margin-bottom: 20px; padding: 15px; background: #f0f0f0; border-radius: 4px;"></div>

        <form id="svdpRedemptionForm">
            <input type="hidden" id="svdpRedemptionVoucherId" value="">

            <div class="svdp-form-group">
                <label for="svdpItemsAdult">Adult Items Provided *</label>
                <input type="number" id="svdpItemsAdult" name="itemsAdult" min="0" value="0" required>
                <small>Maximum: <span id="svdpMaxAdultItems">0</span> items</small>
            </div>

            <div class="svdp-form-group">
                <label for="svdpItemsChildren">Child Items Provided *</label>
                <input type="number" id="svdpItemsChildren" name="itemsChildren" min="0" value="0" required>
                <small>Maximum: <span id="svdpMaxChildItems">0</span> items</small>
            </div>

            <div id="svdpRedemptionSummary" style="margin: 15px 0; padding: 15px; background: #e8f4f8; border-left: 4px solid #006BA8;">
                <div style="font-weight: bold; margin-bottom: 8px;">Redemption Summary:</div>
                <div>Total Items: <span id="svdpTotalItems">0</span> / <span id="svdpMaxTotalItems">0</span></div>
                <div>Estimated Value: $<span id="svdpEstimatedValue">0.00</span></div>
            </div>

            <div id="svdpRedemptionError" style="display: none; margin: 10px 0; padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;"></div>

            <div class="svdp-modal-buttons">
                <button type="button" id="svdpCancelRedemption" class="svdp-btn svdp-btn-secondary">Cancel</button>
                <button type="submit" id="svdpConfirmRedemption" class="svdp-btn svdp-btn-primary">Mark as Redeemed</button>
            </div>
        </form>
    </div>
</div>
