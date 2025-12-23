(function($) {
    'use strict';

    // Global variables for card-based rendering
    let allVouchers = [];              // All vouchers from API
    let filteredVouchers = [];         // After search/filter applied
    let currentFilter = 'all';         // Current filter selection
    let currentSort = 'date-desc';     // Current sort selection
    let searchTerm = '';               // Current search term
    let displayCount = 5;             // Number of cards to display
    let autoRefreshEnabled = true;     // Control auto-refresh
    let autoRefreshInterval = null;    // Store interval ID
    let pendingOverrideData = null;   // For override modal
    let currentCoatVoucher = null;    // For coat modal

    $(document).ready(function() {
        // Check if we're on the cashier station page
        if ($('#svdpVouchersContainer').length === 0) {
            return; // Not on cashier station page, exit
        }

        // Small delay to ensure DOM is fully ready
        setTimeout(function() {
            setupEventListeners();
            initializeEmergencyForm();
            initializeModal();
            initializeCoatModal();
            loadVouchers();
            setupHeartbeat();

            // Auto-refresh every 30 seconds
            autoRefreshInterval = setInterval(function() {
                if (autoRefreshEnabled) {
                    loadVouchers(true); // Silent refresh
                }
            }, 30000);
        }, 100);
    });

    /**
     * Load vouchers from REST API
     */
    function loadVouchers(silent = false) {
        if (!silent) {
            $('#svdpLoadingState').show();
            $('#svdpVouchersContainer').empty();
        }

        $.ajax({
            url: svdpVouchers.restUrl + 'svdp/v1/vouchers',
            method: 'GET',
            headers: {
                'X-WP-Nonce': svdpVouchers.nonce
            },
            success: function(response) {
                allVouchers = response;
                filterAndRenderVouchers();
                $('#svdpLoadingState').hide();
            },
            error: function(xhr) {
                // Handle 403 (nonce expired) specially
                if (xhr.status === 403) {
                    handleNonceExpired(function() {
                        // Retry after nonce refresh
                        loadVouchers(silent);
                    }, function() {
                        // Nonce refresh failed - show error
                        handleLoadError(xhr);
                    });
                } else {
                    handleLoadError(xhr);
                }
            }
        });
    }

    /**
     * Handle errors when loading vouchers
     */
    function handleLoadError(xhr) {
        let errorMsg = '';

        if (xhr.status === 401 || xhr.status === 403 || xhr.status === 0) {
            // Authentication expired - STOP auto-refresh
            autoRefreshEnabled = false;
            errorMsg = '<div class="svdp-error-message">';
            errorMsg += '<h2>⚠️ Session Expired</h2>';
            errorMsg += '<p>Your session has expired. Please refresh the page to continue.</p>';
            errorMsg += '<button onclick="location.reload()" class="svdp-btn svdp-btn-primary">Refresh Page</button>';
            errorMsg += '</div>';
        } else {
            // Temporary error - KEEP auto-refresh running
            errorMsg = '<div class="svdp-error-message warning">';
            errorMsg += '<h3>⚠️ Temporary Error</h3>';
            errorMsg += '<p>Could not load vouchers (Status: ' + xhr.status + '). Will retry in 30 seconds...</p>';
            errorMsg += '<button onclick="loadVouchers()" class="svdp-btn svdp-btn-secondary">Retry Now</button>';
            errorMsg += '</div>';
            // Don't set autoRefreshEnabled = false
        }

        $('#svdpLoadingState').hide();
        $('#svdpVouchersContainer').html(errorMsg);
        $('#svdpLoadMore').hide();
    }

    /**
     * Filter and render vouchers
     */
    function filterAndRenderVouchers() {
        // Filter vouchers
        filteredVouchers = allVouchers.filter(function(v) {
            // Search filter
            if (searchTerm) {
                const searchable = (v.first_name + ' ' + v.last_name + ' ' + v.dob + ' ' + v.conference_name).toLowerCase();
                if (!searchable.includes(searchTerm)) return false;
            }

            // Status filter
            if (currentFilter === 'active' && v.status !== 'Active') return false;
            if (currentFilter === 'redeemed' && v.status !== 'Redeemed') return false;
            if (currentFilter === 'expired' && v.status !== 'Expired') return false;
            if (currentFilter === 'coat-available' && !v.coat_eligible) return false;

            return true;
        });

        // Sort vouchers
        filteredVouchers.sort(function(a, b) {
            if (currentSort === 'date-desc') {
                return new Date(b.voucher_created_date) - new Date(a.voucher_created_date);
            } else if (currentSort === 'date-asc') {
                return new Date(a.voucher_created_date) - new Date(b.voucher_created_date);
            } else if (currentSort === 'name-asc') {
                return (a.first_name + a.last_name).localeCompare(b.first_name + b.last_name);
            } else if (currentSort === 'name-desc') {
                return (b.first_name + b.last_name).localeCompare(a.first_name + a.last_name);
            }
        });

        // Reset display count
        displayCount = 5;

        // Render
        renderVouchers();
        updateStats();
    }

    /**
     * Render vouchers as cards
     */
    function renderVouchers() {
        const container = $('#svdpVouchersContainer');
        container.empty();

        if (filteredVouchers.length === 0) {
            container.html(
                '<div class="svdp-empty-state">' +
                '<div class="svdp-empty-icon">📋</div>' +
                '<div class="svdp-empty-text">No vouchers found</div>' +
                '</div>'
            );
            $('#svdpLoadMore').hide();
            return;
        }

        // Render cards up to displayCount
        const vouchersToShow = filteredVouchers.slice(0, displayCount);
        vouchersToShow.forEach(function(voucher) {
            container.append(renderVoucherCard(voucher));
        });

        // Show/hide Load More button
        if (filteredVouchers.length > displayCount) {
            $('#svdpLoadMore').show();
        } else {
            $('#svdpLoadMore').hide();
        }

        // Attach event listeners to cards
        attachCardEventListeners();
    }

    /**
     * Render a single voucher card
     */
    function renderVoucherCard(voucher) {
        const statusClass = voucher.status.toLowerCase();
        const statusBadgeClass = 'svdp-badge-' + statusClass;
        const total = parseInt(voucher.adults) + parseInt(voucher.children);

        let card = '<div class="svdp-voucher-card svdp-card-' + statusClass + '" data-id="' + voucher.id + '">';

        // Card Header
        card += '<div class="svdp-card-header">';
        card += '<div class="svdp-card-name">' + voucher.first_name + ' ' + voucher.last_name + '</div>';
        card += '<span class="svdp-status-badge ' + statusBadgeClass + '">' + voucher.status + '</span>';
        card += '</div>';

        // Card Details
        card += '<div class="svdp-card-details">';
        card += '<div class="svdp-detail-item">';
        card += '<span class="svdp-detail-label">DOB</span>';
        card += '<span class="svdp-detail-value">' + voucher.dob + '</span>';
        card += '</div>';
        card += '<div class="svdp-detail-item">';
        card += '<span class="svdp-detail-label">Household</span>';
        card += '<span class="svdp-detail-value">' + total + ' people ($' + voucher.voucher_value + ')</span>';
        card += '</div>';
        card += '<div class="svdp-detail-item">';
        card += '<span class="svdp-detail-label">Conference</span>';
        card += '<span class="svdp-detail-value">' + voucher.conference_name + '</span>';
        card += '</div>';
        card += '<div class="svdp-detail-item">';
        card += '<span class="svdp-detail-label">Created</span>';
        card += '<span class="svdp-detail-value">' + voucher.voucher_created_date + '</span>';
        card += '</div>';

        if (voucher.status === 'Redeemed' && voucher.redeemed_date) {
            card += '<div class="svdp-detail-item">';
            card += '<span class="svdp-detail-label">Redeemed</span>';
            card += '<span class="svdp-detail-value">' + voucher.redeemed_date + '</span>';
            card += '</div>';
        }

        card += '</div>'; // End card details

        // Coat Info
        card += renderCoatInfo(voucher);

        // Card Actions
        card += '<div class="svdp-card-actions">';

        if (voucher.status === 'Active') {
            card += '<button class="svdp-btn svdp-btn-success svdp-redeem-btn" data-id="' + voucher.id + '">';
            card += '✓ Mark Redeemed';
            card += '</button>';
        }

        if (voucher.coat_eligible && voucher.coat_status !== 'Issued') {
            card += '<button class="svdp-btn svdp-btn-coat svdp-issue-coat" ';
            card += 'data-id="' + voucher.id + '" ';
            card += 'data-adults="' + voucher.adults + '" ';
            card += 'data-children="' + voucher.children + '" ';
            card += 'data-firstname="' + voucher.first_name + '" ';
            card += 'data-lastname="' + voucher.last_name + '">';
            card += '🧥 Issue Coat';
            card += '</button>';
        }

        card += '</div>'; // End card actions
        card += '</div>'; // End card

        return card;
    }

    /**
     * Render coat eligibility info
     */
    function renderCoatInfo(voucher) {
        let html = '';

        if (voucher.coat_status === 'Issued' && voucher.coat_issued_date) {
            const adults = voucher.coat_adults_issued || 0;
            const children = voucher.coat_children_issued || 0;
            html += '<div class="svdp-coat-info issued">';
            html += '🧥 Coats Issued: ' + adults + ' adults, ' + children + ' children (' + voucher.coat_issued_date + ')';
            html += '</div>';
        } else if (!voucher.coat_eligible) {
            html += '<div class="svdp-coat-info not-eligible">';
            html += '🧥 Coat not eligible until ' + voucher.coat_eligible_after;
            html += '</div>';
        } else {
            html += '<div class="svdp-coat-info eligible">';
            html += '🧥 Coat Available';
            html += '</div>';
        }

        return html;
    }

    /**
     * Attach event listeners to card action buttons
     */
    function attachCardEventListeners() {
        // Redeem button
        $('.svdp-redeem-btn').off('click').on('click', function() {
            const voucherId = $(this).data('id');
            if (confirm('Mark this voucher as redeemed?')) {
                updateVoucherStatus(voucherId, 'Redeemed');
            }
        });

        // Issue coat button
        $('.svdp-issue-coat').off('click').on('click', function() {
            const voucherId = $(this).data('id');
            const adults = parseInt($(this).data('adults')) || 0;
            const children = parseInt($(this).data('children')) || 0;
            const firstName = $(this).data('firstname');
            const lastName = $(this).data('lastname');

            openCoatModal(voucherId, adults, children, firstName, lastName);
        });
    }

    /**
     * Load more vouchers (increase display count)
     */
    function loadMoreVouchers() {
        displayCount += 5;
        renderVouchers();
    }

    /**
     * Update stats display
     */
    function updateStats() {
        const today = new Date().toISOString().split('T')[0];

        const activeCount = allVouchers.filter(v => v.status === 'Active').length;
        const redeemedToday = allVouchers.filter(v => v.status === 'Redeemed' && v.redeemed_date === today).length;
        const coatsAvailable = allVouchers.filter(v => v.coat_eligible && v.coat_status !== 'Issued').length;

        $('#statActive').text(activeCount);
        $('#statRedeemed').text(redeemedToday);
        $('#statCoats').text(coatsAvailable);
        $('#statShowing').text(filteredVouchers.length);
    }

    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Search input
        $('#svdpSearchInput').on('input', function() {
            searchTerm = $(this).val().toLowerCase();
            filterAndRenderVouchers();
        });

        // Filter buttons
        $('.svdp-filter-btn').on('click', function() {
            $('.svdp-filter-btn').removeClass('active');
            $(this).addClass('active');
            currentFilter = $(this).data('filter');
            filterAndRenderVouchers();
        });

        // Sort dropdown
        $('#svdpSortDropdown').on('change', function() {
            currentSort = $(this).val();
            filterAndRenderVouchers();
        });

        // Load More button
        $('#svdpLoadMore').on('click', function() {
            loadMoreVouchers();
        });
    }

    /**
     * Update voucher status
     */
    function updateVoucherStatus(voucherId, newStatus) {
        $.ajax({
            url: svdpVouchers.restUrl + 'svdp/v1/vouchers/' + voucherId + '/status',
            method: 'PATCH',
            headers: {
                'X-WP-Nonce': svdpVouchers.nonce
            },
            data: JSON.stringify({ status: newStatus }),
            contentType: 'application/json',
            success: function() {
                loadVouchers(true); // Silent reload
            },
            error: function(xhr) {
                if (xhr.status === 403) {
                    handleNonceExpired(function() {
                        updateVoucherStatus(voucherId, newStatus); // Retry
                    }, function() {
                        alert('Error updating status: Session expired. Please refresh the page.');
                    });
                } else {
                    alert('Error updating status: ' + (xhr.responseJSON?.message || 'Unknown error'));
                }
            }
        });
    }

    /**
     * Initialize emergency form
     */
    function initializeEmergencyForm() {
        const form = $('#svdpEmergencyForm');
        const messageDiv = $('#svdpEmergencyMessage');

        form.on('submit', function(e) {
            e.preventDefault();

            const submitBtn = form.find('button[type="submit"]');
            submitBtn.prop('disabled', true).text('Processing...');
            messageDiv.hide().removeClass('success error');

            const formData = {
                firstName: $('input[name="firstName"]', form).val().trim(),
                lastName: $('input[name="lastName"]', form).val().trim(),
                dob: $('input[name="dob"]', form).val(),
                adults: parseInt($('input[name="adults"]', form).val()),
                children: parseInt($('input[name="children"]', form).val()),
                conference: 'emergency',
            };

            // Check for duplicate
            $.ajax({
                url: svdpVouchers.restUrl + 'svdp/v1/vouchers/check-duplicate',
                method: 'POST',
                headers: {
                    'X-WP-Nonce': svdpVouchers.nonce
                },
                data: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    dob: formData.dob,
                    createdBy: 'Cashier'
                }),
                contentType: 'application/json',
                success: function(response) {
                    if (response.found && response.matchType === 'exact') {
                        // EXACT match - show override modal
                        showOverrideModal(response, formData);
                        submitBtn.prop('disabled', false).text('Create Emergency Voucher');
                    } else if (response.found && response.matchType === 'similar') {
                        // SIMILAR match - show warning
                        showSimilarWarning(response, formData, submitBtn, messageDiv, form);
                    } else {
                        // No match - create voucher
                        createEmergencyVoucher(formData, submitBtn, messageDiv, form);
                    }
                },
                error: function(xhr) {
                    const error = xhr.responseJSON?.message || 'Error checking for duplicates';
                    messageDiv.html(error).addClass('error').fadeIn();
                    submitBtn.prop('disabled', false).text('Create Emergency Voucher');
                }
            });
        });
    }

    /**
     * Show similar name warning
     */
    function showSimilarWarning(similarData, formData, submitBtn, messageDiv, form) {
        let warning = '<div style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 4px;">';
        warning += '<strong>⚠️ Similar Name(s) Found</strong><br><br>';
        warning += 'We found ' + similarData.matches.length + ' voucher(s) with similar name(s) and the same date of birth:<br><br>';

        similarData.matches.forEach(function(match) {
            warning += '<div style="margin: 10px 0; padding: 10px; background: white; border-left: 3px solid #ffc107;">';
            warning += '<strong>' + match.firstName + ' ' + match.lastName + '</strong><br>';
            warning += 'DOB: ' + match.dob + '<br>';
            warning += 'Conference: ' + match.conference + '<br>';
            warning += 'Created: ' + match.voucherCreatedDate;
            if (match.vincentianName) {
                warning += '<br>By: ' + match.vincentianName;
            }
            warning += '</div>';
        });

        warning += '<br><strong>Is this the same person with a name variation?</strong><br>';
        warning += '<div style="margin-top: 15px;">';
        warning += '<button id="svdpProceedAnyway" class="svdp-btn svdp-btn-warning" style="margin-right: 10px;">No, Create New Voucher</button>';
        warning += '<button id="svdpCancelSimilar" class="svdp-btn svdp-btn-secondary">Yes, Cancel</button>';
        warning += '</div>';
        warning += '</div>';

        messageDiv.html(warning).removeClass('success error').fadeIn();
        submitBtn.prop('disabled', false).text('Create Emergency Voucher');

        // Handle proceed
        $('#svdpProceedAnyway').on('click', function() {
            messageDiv.fadeOut();
            createEmergencyVoucher(formData, submitBtn, messageDiv, form);
        });

        // Handle cancel
        $('#svdpCancelSimilar').on('click', function() {
            messageDiv.fadeOut();
            form[0].reset();
        });
    }

    /**
     * Show override modal for exact duplicate
     */
    function showOverrideModal(duplicateData, formData) {
        const modal = $('#svdpOverrideModal');
        const message = $('#svdpOverrideMessage');
        const cashierNameSection = $('#svdpCashierNameSection');

        let msg = '<strong>' + duplicateData.firstName + ' ' + duplicateData.lastName + '</strong> already has a voucher:<br><br>';
        msg += '<strong>Conference:</strong> ' + duplicateData.conference + '<br>';
        msg += '<strong>Created:</strong> ' + duplicateData.voucherCreatedDate + '<br>';
        msg += '<strong>Next Eligible:</strong> ' + duplicateData.nextEligibleDate + '<br><br>';
        msg += '<strong>Do you want to override and create an emergency voucher anyway?</strong>';

        message.html(msg);
        cashierNameSection.show();
        $('#svdpCashierName').val('');

        // Store both formData and duplicateData
        pendingOverrideData = {
            formData: formData,
            duplicateData: duplicateData
        };

        modal.css('display', 'flex');
    }

    /**
     * Initialize override modal
     */
    function initializeModal() {
        $('#svdpCancelOverride').on('click', function() {
            // Save denied voucher when they cancel
            if (pendingOverrideData) {
                saveDeniedVoucher(pendingOverrideData.formData, pendingOverrideData.duplicateData);
            }
            $('#svdpOverrideModal').hide();
            pendingOverrideData = null;
        });

        $('#svdpConfirmOverride').on('click', function() {
            const cashierName = $('#svdpCashierName').val().trim();

            if (!cashierName) {
                alert('Please enter your name for the override record');
                return;
            }

            if (!pendingOverrideData) {
                alert('Error: No pending override data');
                return;
            }

            // Add override note
            pendingOverrideData.formData.overrideNote = 'Emergency override by ' + cashierName + ' on ' + new Date().toLocaleDateString();

            const form = $('#svdpEmergencyForm');
            const submitBtn = form.find('button[type="submit"]');
            const messageDiv = $('#svdpEmergencyMessage');

            $('#svdpOverrideModal').hide();
            createEmergencyVoucher(pendingOverrideData.formData, submitBtn, messageDiv, form);
            pendingOverrideData = null;
        });
    }

    /**
     * Initialize coat modal
     */
    function initializeCoatModal() {
        // Update coat total when numbers change
        $('#svdpCoatAdults, #svdpCoatChildren').on('input', function() {
            updateCoatTotal();
        });

        // Cancel coat modal
        $('#svdpCancelCoat').on('click', function() {
            closeCoatModal();
        });

        // Submit coat form
        $('#svdpCoatForm').on('submit', function(e) {
            e.preventDefault();
            submitCoatIssuance();
        });

        // Close modal on background click
        $('#svdpCoatModal').on('click', function(e) {
            if (e.target === this) {
                closeCoatModal();
            }
        });
    }

    /**
     * Open coat modal
     */
    function openCoatModal(voucherId, maxAdults, maxChildren, firstName, lastName) {
        $('#svdpCoatVoucherId').val(voucherId);
        $('#svdpCoatVoucherInfo').html(
            '<strong>' + firstName + ' ' + lastName + '</strong><br>' +
            'Household: ' + maxAdults + ' adults, ' + maxChildren + ' children'
        );

        $('#svdpCoatMaxAdults').text(maxAdults);
        $('#svdpCoatMaxChildren').text(maxChildren);
        $('#svdpCoatAdults').attr('max', maxAdults).val(maxAdults);
        $('#svdpCoatChildren').attr('max', maxChildren).val(maxChildren);

        updateCoatTotal();
        $('#svdpCoatModal').fadeIn(200);
    }

    /**
     * Close coat modal
     */
    function closeCoatModal() {
        $('#svdpCoatModal').fadeOut(200);
        $('#svdpCoatForm')[0].reset();
    }

    /**
     * Update coat total count
     */
    function updateCoatTotal() {
        const adults = parseInt($('#svdpCoatAdults').val()) || 0;
        const children = parseInt($('#svdpCoatChildren').val()) || 0;
        const total = adults + children;
        $('#svdpCoatTotalCount').text(total);
        $('#svdpConfirmCoat').prop('disabled', total === 0);
    }

    /**
     * Submit coat issuance
     */
    function submitCoatIssuance() {
        const voucherId = $('#svdpCoatVoucherId').val();
        const adults = parseInt($('#svdpCoatAdults').val()) || 0;
        const children = parseInt($('#svdpCoatChildren').val()) || 0;
        const messageDiv = $('#svdpEmergencyMessage');

        const submitBtn = $('#svdpConfirmCoat');
        submitBtn.prop('disabled', true).text('Issuing...');

        $.ajax({
            url: svdpVouchers.restUrl + 'svdp/v1/vouchers/' + voucherId + '/coat',
            method: 'PATCH',
            contentType: 'application/json',
            headers: {
                'X-WP-Nonce': svdpVouchers.nonce
            },
            data: JSON.stringify({
                adults: adults,
                children: children
            }),
            success: function(response) {
                closeCoatModal();
                showMessage('success',
                    '✅ Successfully issued ' + response.total + ' coat(s): ' +
                    response.adults + ' adult, ' + response.children + ' children',
                    messageDiv
                );
                loadVouchers(true); // Silent reload

                setTimeout(function() {
                    messageDiv.fadeOut();
                }, 5000);
            },
            error: function(xhr) {
                if (xhr.status === 403) {
                    handleNonceExpired(function() {
                        submitCoatIssuance(); // Retry
                    }, function() {
                        showMessage('error', 'Session expired. Please refresh the page.', messageDiv);
                    });
                } else {
                    showMessage('error', 'Failed to issue coats: ' + (xhr.responseJSON?.message || 'Unknown error'), messageDiv);
                }
            },
            complete: function() {
                submitBtn.prop('disabled', false).text('Issue Coats');
            }
        });
    }

    /**
     * Show message in message div
     */
    function showMessage(type, message, messageDiv) {
        messageDiv
            .html(message)
            .removeClass('success error')
            .addClass(type)
            .fadeIn();
    }

    /**
     * Create emergency voucher
     */
    function createEmergencyVoucher(formData, submitBtn, messageDiv, form) {
        $.ajax({
            url: svdpVouchers.restUrl + 'svdp/v1/vouchers/create',
            method: 'POST',
            headers: {
                'X-WP-Nonce': svdpVouchers.nonce
            },
            data: JSON.stringify(formData),
            contentType: 'application/json',
            success: function(response) {
                messageDiv
                    .html('✅ Emergency voucher created successfully!')
                    .removeClass('error')
                    .addClass('success')
                    .fadeIn();

                form[0].reset();
                loadVouchers(true); // Silent reload

                setTimeout(function() {
                    messageDiv.fadeOut();
                }, 5000);

                submitBtn.prop('disabled', false).text('Create Emergency Voucher');
            },
            error: function(xhr) {
                if (xhr.status === 403) {
                    handleNonceExpired(function() {
                        createEmergencyVoucher(formData, submitBtn, messageDiv, form); // Retry
                    }, function() {
                        const error = 'Session expired. Please refresh the page.';
                        messageDiv.html(error).removeClass('success').addClass('error').fadeIn();
                        submitBtn.prop('disabled', false).text('Create Emergency Voucher');
                    });
                } else {
                    const error = xhr.responseJSON?.message || 'Error creating voucher';
                    messageDiv.html(error).removeClass('success').addClass('error').fadeIn();
                    submitBtn.prop('disabled', false).text('Create Emergency Voucher');
                }
            }
        });
    }

    /**
     * Save denied voucher for tracking
     */
    function saveDeniedVoucher(formData, duplicateData) {
        const denialReason = 'Duplicate found: ' + duplicateData.firstName + ' ' + duplicateData.lastName +
                            ' received voucher from ' + duplicateData.conference +
                            ' on ' + duplicateData.voucherCreatedDate +
                            '. Next eligible: ' + duplicateData.nextEligibleDate;

        $.ajax({
            url: svdpVouchers.restUrl + 'svdp/v1/vouchers/create-denied',
            method: 'POST',
            headers: {
                'X-WP-Nonce': svdpVouchers.nonce
            },
            data: JSON.stringify({
                firstName: formData.firstName,
                lastName: formData.lastName,
                dob: formData.dob,
                adults: formData.adults,
                children: formData.children,
                conference: 'emergency',
                denialReason: denialReason,
                createdBy: 'Cashier'
            }),
            contentType: 'application/json'
            // Silent - no success/error handling needed
        });
    }

    /**
     * Handle expired nonce - request fresh one and retry
     */
    function handleNonceExpired(onSuccess, onError) {
        console.log('⚠ Nonce expired, requesting fresh nonce...');

        $.ajax({
            url: svdpVouchers.restUrl + 'svdp/v1/auth/refresh-nonce',
            method: 'POST',
            // Don't send nonce header - this endpoint uses cookie auth
            success: function(response) {
                if (response.nonce) {
                    svdpVouchers.nonce = response.nonce;
                    console.log('✓ Nonce refreshed successfully');
                    onSuccess();
                } else {
                    console.error('Nonce refresh failed: no nonce in response');
                    onError();
                }
            },
            error: function(xhr) {
                console.error('Nonce refresh failed:', xhr.status);
                onError();
            }
        });
    }

    /**
     * Setup WordPress Heartbeat for session keep-alive and nonce refresh
     */
    function setupHeartbeat() {
        // Only run if Heartbeat API is available
        if (typeof wp === 'undefined' || typeof wp.heartbeat === 'undefined') {
            console.warn('WordPress Heartbeat API not available - nonce refresh disabled');
            return;
        }

        // Send cashier station flag on every heartbeat
        $(document).on('heartbeat-send', function(event, data) {
            data.svdp_cashier_active = true;
        });

        // Receive heartbeat response
        $(document).on('heartbeat-tick', function(event, data) {
            if (data.svdp_heartbeat_status === 'logged_out') {
                // User was logged out server-side
                handleLoadError({ status: 401 });
                autoRefreshEnabled = false;
            } else if (data.svdp_nonce) {
                // Update nonce with fresh value
                svdpVouchers.nonce = data.svdp_nonce;
                console.log('✓ Nonce refreshed via heartbeat');
            }
        });

        // Handle heartbeat errors (optional logging)
        $(document).on('heartbeat-error', function(event, jqXHR, textStatus) {
            console.warn('Heartbeat error:', textStatus);
            // Don't stop auto-refresh - heartbeat is supplementary
        });

        console.log('✓ Heartbeat session keep-alive enabled (60s interval)');
    }

})(jQuery);
