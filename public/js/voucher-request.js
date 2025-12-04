(function($) {
    'use strict';

    $(document).ready(function() {
        const form = $('#svdpVoucherForm');
        const messageDiv = $('#svdpFormMessage');

        form.on('submit', function(e) {
            e.preventDefault();

            // Disable submit button
            const submitBtn = form.find('button[type="submit"]');
            submitBtn.prop('disabled', true).text('Processing...');

            // Clear previous messages
            messageDiv.hide().removeClass('success error');

            // Convert MM/DD/YYYY to YYYY-MM-DD for backend
            const dobInput = $('input[name="dob"]').val();
            const dobParts = dobInput.split('/');
            const dobFormatted = dobParts[2] + '-' + dobParts[0] + '-' + dobParts[1];

            // Collect form data
            const formData = {
                firstName: $('input[name="firstName"]').val().trim(),
                lastName: $('input[name="lastName"]').val().trim(),
                dob: dobFormatted,
                adults: parseInt($('input[name="adults"]').val()),
                children: parseInt($('input[name="children"]').val()),
                conference: $('[name="conference"]').val(),
                vincentianName: $('input[name="vincentianName"]').val().trim(),
                vincentianEmail: $('input[name="vincentianEmail"]').val().trim(),
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
                    createdBy: 'Vincentian'
                }),
                contentType: 'application/json',
                success: function(response) {
                    if (response.found) {
                        // Duplicate found - show message
                        showDuplicateMessage(response);
                        submitBtn.prop('disabled', false).text('Submit Voucher Request');
                    } else {
                        // No duplicate - create voucher
                        createVoucher(formData, submitBtn);
                    }
                },
                error: function(xhr) {
                    const error = xhr.responseJSON?.message || 'Error checking for duplicates';
                    showMessage(error, 'error');
                    submitBtn.prop('disabled', false).text('Submit Voucher Request');
                }
            });
        });

        function showDuplicateMessage(duplicateData) {
            let message = `<strong>This person has already received a voucher recently.</strong><br><br>`;
            message += `<strong>Last Voucher Details:</strong><br>`;
            message += `Conference: ${duplicateData.conference}<br>`;
            message += `Date: ${duplicateData.voucherCreatedDate}<br>`;

            if (duplicateData.vincentianName) {
                message += `Vincentian: ${duplicateData.vincentianName}<br>`;
            }

            message += `<br><strong>Next Eligible Date:</strong> ${duplicateData.nextEligibleDate}<br>`;
            message += `<br><em>If this person needs assistance before then, please contact the District Office or connect them with resources that can help in the meantime.</em>`;

            showMessage(message, 'error');
        }

        function createVoucher(formData, submitBtn) {
            $.ajax({
                url: svdpVouchers.restUrl + 'svdp/v1/vouchers/create',
                method: 'POST',
                headers: {
                    'X-WP-Nonce': svdpVouchers.nonce
                },
                data: JSON.stringify(formData),
                contentType: 'application/json',
                success: function(response) {
                    let message = `<strong>✅ Voucher Created Successfully!</strong><br><br>`;
                    message += `The voucher has been created and is ready to use immediately.<br><br>`;
                    message += `<strong>Important Reminders:</strong><br>`;
                    message += `• Thrift Store hours: 9:30 AM – 4:00 PM<br>`;
                    message += `• Ask your Neighbor to check in at Customer Service before shopping<br>`;
                    message += `• This household can receive another voucher after: <strong>${response.nextEligibleDate}</strong><br>`;

                    if (response.coatEligibleAfter) {
                        message += `• Winter coat eligible after: <strong>${response.coatEligibleAfter}</strong>`;
                    }

                    showMessage(message, 'success');

                    // Reset form
                    form[0].reset();
                    submitBtn.prop('disabled', false).text('Submit Voucher Request');

                    // Scroll to message
                    $('html, body').animate({
                        scrollTop: messageDiv.offset().top - 20
                    }, 500);
                },
                error: function(xhr) {
                    const error = xhr.responseJSON?.message || 'Error creating voucher';
                    showMessage(error, 'error');
                    submitBtn.prop('disabled', false).text('Submit Voucher Request');
                }
            });
        }

        function showMessage(message, type) {
            messageDiv
                .html(message)
                .removeClass('success error')
                .addClass(type)
                .fadeIn();
        }
    });

})(jQuery);
