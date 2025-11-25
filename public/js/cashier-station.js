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
                        const total = parseInt(data.adults) + parseInt(data.children);
                        return total + ' ($' + (total * 20) + ')';
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
                        
                        let options = '<select class="svdp-status-dropdown" data-id="' + data.id + '">';
                        options += '<option value="Active"' + (data.status === 'Active' ? ' selected' : '') + '>Active</option>';
                        options += '<option value="Redeemed"' + (data.status === 'Redeemed' ? ' selected' : '') + '>Redeemed</option>';
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
                    if (response.found) {
                        // Show override modal
                        showOverrideModal(response, formData);
                        submitBtn.prop('disabled', false).text('Create Emergency Voucher');
                    } else {
                        // Create voucher
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
        
        pendingOverrideData = formData;
        
        modal.css('display', 'flex');
    }
    
    function initializeModal() {
        $('#svdpCancelOverride').on('click', function() {
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
            pendingOverrideData.overrideNote = 'Emergency override by ' + cashierName + ' on ' + new Date().toLocaleDateString();
            
            const form = $('#svdpEmergencyForm');
            const submitBtn = form.find('button[type="submit"]');
            const messageDiv = $('#svdpEmergencyMessage');
            
            $('#svdpOverrideModal').hide();
            createEmergencyVoucher(pendingOverrideData, submitBtn, messageDiv, form);
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
    
})(jQuery);