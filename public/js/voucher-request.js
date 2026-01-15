(function($) {
    'use strict';

    $(document).ready(function() {
        const form = $('#svdpVoucherForm');
        const messageDiv = $('#svdpFormMessage');

        // Smart date field setup
        function isMobile() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }

        // Detect if browser supports date input
        const dateInput = document.createElement('input');
        dateInput.setAttribute('type', 'date');
        const supportsDateInput = dateInput.type === 'date';

        // If date input not supported OR on mobile, use text input with auto-format
        if (!supportsDateInput || isMobile()) {
            const dobField = $('#svdp-dob-input');
            dobField.attr('type', 'text');
            dobField.attr('pattern', '\\d{2}/\\d{2}/\\d{4}');

            // Auto-format with slash insertion
            dobField.on('input', function(e) {
                let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2);
                }
                if (value.length >= 5) {
                    value = value.substring(0, 5) + '/' + value.substring(5, 9);
                }
                e.target.value = value;
            });
        }

        function getSelectedVoucherTypes() {
            const selectedTypes = [];
            $('input[name="voucherTypes[]"]:checked').each(function() {
                selectedTypes.push($(this).val());
            });

            if (selectedTypes.length === 0) {
                const hiddenTypes = $('input[name="voucherTypes[]"][type="hidden"]').map(function() {
                    return $(this).val();
                }).get();
                selectedTypes.push.apply(selectedTypes, hiddenTypes);
            }

            return selectedTypes;
        }

        function resetCatalogSection(section) {
            section.find('.svdp-qty-input').val(0);
            section.find('.svdp-item-note').val('').hide();
            section.find('.svdp-toggle-note').removeClass('is-open');
            section.find('.svdp-totals').hide();
            section.find('.svdp-catalog-items').hide();
            section.find('.svdp-catalog-categories').show();
        }

        function updateTotals(type) {
            const section = $('.svdp-type-section[data-type="' + type + '"]');
            let minTotal = 0;
            let maxTotal = 0;
            let hasItems = false;

            section.find('.svdp-item').each(function() {
                const qty = parseInt($(this).find('.svdp-qty-input').val(), 10) || 0;
                if (qty > 0) {
                    hasItems = true;
                    const minPrice = parseFloat($(this).data('min')) || 0;
                    const maxPrice = parseFloat($(this).data('max')) || 0;
                    minTotal += qty * minPrice;
                    maxTotal += qty * maxPrice;
                }
            });

            if (hasItems) {
                section.find('.svdp-total-range').text('$' + minTotal.toFixed(2) + ' – $' + maxTotal.toFixed(2));
                section.find('.svdp-totals').show();
            } else {
                section.find('.svdp-totals').hide();
            }
        }

        function updateTypeSections() {
            const selectedTypes = getSelectedVoucherTypes();

            $('.svdp-voucher-type-card').each(function() {
                const checkbox = $(this).find('input[name="voucherTypes[]"]');
                const body = $(this).find('.svdp-type-body');
                if (checkbox.is(':checked')) {
                    body.show();
                } else {
                    body.hide();
                }
            });

            $('.svdp-type-section').each(function() {
                const section = $(this);
                const type = section.data('type');
                const defaultOpen = section.data('default-open') === 1;
                const shouldShow = selectedTypes.includes(type) || defaultOpen;

                if (shouldShow) {
                    section.show();
                } else {
                    section.hide();
                    resetCatalogSection(section);
                }
            });
        }

        form.on('change', 'input[name="voucherTypes[]"]', function() {
            updateTypeSections();
        });

        updateTypeSections();

        form.on('click', '.svdp-category-tile', function() {
            const section = $(this).closest('.svdp-type-section');
            const category = $(this).data('category');
            section.find('.svdp-category-title').text(category);
            section.find('.svdp-catalog-categories').hide();
            section.find('.svdp-category-items').hide();
            section.find('.svdp-category-items[data-category="' + category + '"]').show();
            section.find('.svdp-catalog-items').show();
        });

        form.on('click', '.svdp-back-to-categories', function() {
            const section = $(this).closest('.svdp-type-section');
            section.find('.svdp-catalog-items').hide();
            section.find('.svdp-category-items').hide();
            section.find('.svdp-catalog-categories').show();
        });

        form.on('click', '.svdp-qty-plus', function() {
            const input = $(this).siblings('.svdp-qty-input');
            input.val(parseInt(input.val(), 10) + 1);
            updateTotals($(this).closest('.svdp-item').data('type'));
        });

        form.on('click', '.svdp-qty-minus', function() {
            const input = $(this).siblings('.svdp-qty-input');
            const next = Math.max(0, parseInt(input.val(), 10) - 1);
            input.val(next);
            updateTotals($(this).closest('.svdp-item').data('type'));
        });

        form.on('change', '.svdp-qty-input', function() {
            const input = $(this);
            const next = Math.max(0, parseInt(input.val(), 10) || 0);
            input.val(next);
            updateTotals($(this).closest('.svdp-item').data('type'));
        });

        form.on('click', '.svdp-toggle-note', function() {
            const note = $(this).siblings('.svdp-item-note');
            if (note.is(':visible')) {
                note.hide();
                $(this).removeClass('is-open');
            } else {
                note.show();
                $(this).addClass('is-open');
            }
        });

        form.on('submit', function(e) {
            e.preventDefault();

            if (form.data('form-disabled') === 1) {
                showMessage('This partner is not currently enabled for voucher requests.', 'error');
                return;
            }

            // Disable submit button
            const submitBtn = form.find('button[type="submit"]');
            submitBtn.prop('disabled', true).text('Processing...');

            // Clear previous messages
            messageDiv.hide().removeClass('success error');

            // Get DOB value - handle both date input and text input
            let dobFormatted;
            const dobInput = $('input[name="dob"]').val();

            if ($('input[name="dob"]').attr('type') === 'date') {
                // Native date input returns YYYY-MM-DD
                dobFormatted = dobInput;
            } else {
                // Text input returns MM/DD/YYYY, convert to YYYY-MM-DD
                const dobParts = dobInput.split('/');
                dobFormatted = dobParts[2] + '-' + dobParts[0] + '-' + dobParts[1];
            }

            // Collect form data
            const selectedTypes = getSelectedVoucherTypes();

            const catalogItems = [];
            $('.svdp-item').each(function() {
                const qty = parseInt($(this).find('.svdp-qty-input').val(), 10) || 0;
                if (qty > 0) {
                    const note = $(this).find('.svdp-item-note').val().trim();
                    catalogItems.push({
                        type: $(this).data('type'),
                        id: $(this).data('item-id'),
                        quantity: qty,
                        note: note
                    });
                }
            });

            const requiresCatalog = selectedTypes.includes('furniture') || selectedTypes.includes('household');
            if (requiresCatalog && catalogItems.length === 0) {
                showMessage('Select at least one catalog item for furniture or household vouchers.', 'error');
                submitBtn.prop('disabled', false).text('Submit Voucher Request');
                return;
            }

            const formData = {
                firstName: $('input[name="firstName"]').val().trim(),
                lastName: $('input[name="lastName"]').val().trim(),
                dob: dobFormatted,
                adults: parseInt($('input[name="adults"]').val()),
                children: parseInt($('input[name="children"]').val()),
                conference: $('[name="conference"]').val(),
                voucherTypes: selectedTypes,
                catalogItems: catalogItems,
                vincentianName: $('input[name="vincentianName"]').val().trim(),
                vincentianEmail: $('input[name="vincentianEmail"]').val().trim(),
            };

            if (!formData.voucherTypes.length) {
                showMessage('Please select at least one voucher type.', 'error');
                submitBtn.prop('disabled', false).text('Submit Voucher Request');
                return;
            }

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
                    voucherTypes: formData.voucherTypes,
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
