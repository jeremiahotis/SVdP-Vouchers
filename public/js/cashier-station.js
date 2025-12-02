(function($) {
    'use strict';
    
    let table;
    let pendingOverrideData = null;
    
    $(document).ready(function() {
        initializeTable();
        initializeEmergencyForm();
        initializeModal();
        
        // Refresh table every 30 seconds
        setInterval(function() {
            table.ajax.reload(null, false);
        }, 30000);
    });
    
    function initializeTable() {
        table = $('#svdpVoucherTable').DataTable({
            ajax: {
                url: svdpVouchers.restUrl + 'svdp/v1/vouchers',
                headers: {
                    'X-WP-Nonce': svdpVouchers.nonce
                },
                dataSrc: ''
            },
            columns: [
            {
                data: null,
                render: function(data) {
                    return data.first_name + ' ' + data.last_name;
                }
            },
            { data: 'dob' },
            {
                data: null,
                render: function(data) {
                    // Display using stored voucher_value
                    const total = parseInt(data.adults) + parseInt(data.children);
                    return total + ' ($' + parseFloat(data.voucher_value).toFixed(0) + ')';
                }
            },
            { data: 'conference_name' },
            { data: 'voucher_created_date' },
                {
                    data: null,
                    render: function(data) {
                        if (data.status === 'Expired') {
                            return '<span class="svdp-status-expired">Expired</span>';
                        }
                        
                        if (data.status === 'Redeemed') {
                            return '<span class="svdp-status-redeemed">Redeemed</span>';
                        }
        
                        // Only Active vouchers can change status
                        let options = '<select class="svdp-status-dropdown" data-id="' + data.id + '">';
                        options += '<option value="Active" selected>Active</option>';
                        options += '<option value="Redeemed">Redeem</option>';
                        options += '</select>';
                        return options;
                    }
                },
                {
                    data: null,
                    render: function(data) {
                        if (data.status === 'Redeemed' && data.redeemed_date) {
                            return '<span class="svdp-status-redeemed">' + data.redeemed_date + '</span>';
                        }
                        return '-';
                    }
                },
                {
                    data: null,
                    render: function(data) {
                        if (!data.coat_eligible) {
                            return '<span class="svdp-coat-not-eligible">Not eligible until ' + data.coat_eligible_after + '</span>';
                        }
                        
                        if (data.coat_status === 'Issued' && data.coat_issued_date) {
                            return '<span class="svdp-coat-issued">Issued ' + data.coat_issued_date + '</span>';
                        }
                        
                        let options = '<select class="svdp-coat-dropdown" data-id="' + data.id + '">';
                        options += '<option value="Available">Available</option>';
                        options += '<option value="Issued">Issue Coat</option>';
                        options += '</select>';
                        return options;
                    }
                }
            ],
            order: [[4, 'desc']],
            pageLength: 25,
            responsive: true,
            language: {
                search: "Search vouchers:",
                lengthMenu: "Show _MENU_ vouchers",
                info: "Showing _START_ to _END_ of _TOTAL_ vouchers",
                infoEmpty: "No vouchers found",
                infoFiltered: "(filtered from _MAX_ total)"
            }
        });
        
        // Handle status change
        $('#svdpVoucherTable').on('change', '.svdp-status-dropdown', function() {
            const voucherId = $(this).data('id');
            const newStatus = $(this).val();
            const dropdown = $(this);
            
            if (confirm('Mark this voucher as ' + newStatus + '?')) {
                updateVoucherStatus(voucherId, newStatus, dropdown);
            } else {
                // Reset dropdown
                table.ajax.reload(null, false);
            }
        });
        
        // Handle coat status change
        $('#svdpVoucherTable').on('change', '.svdp-coat-dropdown', function() {
            const voucherId = $(this).data('id');
            const dropdown = $(this);
            
            if ($(this).val() === 'Issued') {
                if (confirm('Issue winter coat to this person?')) {
                    updateCoatStatus(voucherId, dropdown);
                } else {
                    $(this).val('Available');
                }
            }
        });
    }
    
    function updateVoucherStatus(voucherId, newStatus, dropdown) {
        $.ajax({
            url: svdpVouchers.restUrl + 'svdp/v1/vouchers/' + voucherId + '/status',
            method: 'PATCH',
            headers: {
                'X-WP-Nonce': svdpVouchers.nonce
            },
            data: JSON.stringify({ status: newStatus }),
            contentType: 'application/json',
            success: function() {
                table.ajax.reload(null, false);
            },
            error: function(xhr) {
                alert('Error updating status: ' + (xhr.responseJSON?.message || 'Unknown error'));
                table.ajax.reload(null, false);
            }
        });
    }
    
    function updateCoatStatus(voucherId, dropdown) {
        $.ajax({
            url: svdpVouchers.restUrl + 'svdp/v1/vouchers/' + voucherId + '/coat',
            method: 'PATCH',
            headers: {
                'X-WP-Nonce': svdpVouchers.nonce
            },
            data: JSON.stringify({ coatStatus: 'Issued' }),
            contentType: 'application/json',
            success: function() {
                table.ajax.reload(null, false);
            },
            error: function(xhr) {
                alert('Error updating coat status: ' + (xhr.responseJSON?.message || 'Unknown error'));
                dropdown.val('Available');
            }
        });
    }
    
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
                    console.log('Duplicate check response:', response);
                    
                    if (response.found && response.matchType === 'exact') {
                        // EXACT match - show override modal
                        showOverrideModal(response, formData);
                        submitBtn.prop('disabled', false).text('Create Emergency Voucher');
                    } else if (response.found && response.matchType === 'similar') {
                        // SIMILAR match - show warning, let them decide
                        showSimilarWarning(response, formData, submitBtn, messageDiv, form);
                    } else {
                        // No match - create voucher
                        createEmergencyVoucher(formData, submitBtn, messageDiv, form);
                    }
                },
                error: function(xhr) {
                    console.error('Duplicate check error:', xhr);
                    const error = xhr.responseJSON?.message || 'Error checking for duplicates';
                    messageDiv.html(error).addClass('error').fadeIn();
                    submitBtn.prop('disabled', false).text('Create Emergency Voucher');
                }
            });
        });
    }

    function showSimilarWarning(similarData, formData, submitBtn, messageDiv, form) {
        let warning = '<div style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 4px;">';
        warning += '<strong>⚠️ Similar Name(s) Found</strong><br><br>';
        warning += 'We found ' + similarData.matches.length + ' voucher(s) with similar name(s) and the same date of birth:<br><br>';
        
        similarData.matches.forEach(function(match, index) {
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
    
    function showOverrideModal(duplicateData, formData) {
        const modal = $('#svdpOverrideModal');
        const message = $('#svdpOverrideMessage');
        const cashierNameSection = $('#svdpCashierNameSection');
        
        let msg = `<strong>${duplicateData.firstName} ${duplicateData.lastName}</strong> already has a voucher:<br><br>`;
        msg += `<strong>Conference:</strong> ${duplicateData.conference}<br>`;
        msg += `<strong>Created:</strong> ${duplicateData.voucherCreatedDate}<br>`;
        msg += `<strong>Next Eligible:</strong> ${duplicateData.nextEligibleDate}<br><br>`;
        msg += `<strong>Do you want to override and create an emergency voucher anyway?</strong>`;
        
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
                table.ajax.reload();
                
                setTimeout(function() {
                    messageDiv.fadeOut();
                }, 5000);
                
                submitBtn.prop('disabled', false).text('Create Emergency Voucher');
            },
            error: function(xhr) {
                const error = xhr.responseJSON?.message || 'Error creating voucher';
                messageDiv.html(error).removeClass('success').addClass('error').fadeIn();
                submitBtn.prop('disabled', false).text('Create Emergency Voucher');
            }
        });
    }

    function saveDeniedVoucher(formData, duplicateData) {
        // Save denied voucher for tracking (silently in background)
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
    
})(jQuery);
