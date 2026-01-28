(function($) {
    'use strict';
    
    $(document).ready(function() {
        initializeAddConferenceForm();
        initializeConferenceActions();
        initializeCatalogAvailabilityToggles();
        initializeCatalogForms();
        initializeCatalogItemActions();
    });
    
    function initializeAddConferenceForm() {
        $('#svdp-add-conference-form').on('submit', function(e) {
            e.preventDefault();
            
            const form = $(this);
            const submitBtn = form.find('button[type="submit"]');
            const messageDiv = $('#add-conference-message');
            
            submitBtn.prop('disabled', true).text('Adding...');
            messageDiv.empty();
            
            $.ajax({
                url: svdpAdmin.ajaxUrl,
                method: 'POST',
                data: {
                    action: 'svdp_add_conference',
                    nonce: svdpAdmin.nonce,
                    name: $('#conference_name').val(),
                    slug: $('#conference_slug').val(),
                    organization_type: $('input[name="organization_type"]:checked').val(),
                    eligibility_days: $('#eligibility_days').val(),
                    regular_items: $('#regular_items').val(),
                    woodshop_paused: $('#woodshop_paused').is(':checked') ? 1 : 0,
                    enable_printable_voucher: $('#enable_printable_voucher').is(':checked') ? 1 : 0
                },
                success: function(response) {
                    if (response.success) {
                        messageDiv.html('<div class="notice notice-success"><p>' + response.data.message + '</p></div>');
                        form[0].reset();
                        
                        // Reload page to show new conference
                        setTimeout(function() {
                            location.reload();
                        }, 1000);
                    } else {
                        messageDiv.html('<div class="notice notice-error"><p>' + response.data + '</p></div>');
                    }
                    submitBtn.prop('disabled', false).text('Add Conference');
                },
                error: function() {
                    messageDiv.html('<div class="notice notice-error"><p>Error adding conference</p></div>');
                    submitBtn.prop('disabled', false).text('Add Conference');
                }
            });
        });
        
        // Auto-generate slug from name
        $('#conference_name').on('input', function() {
            if ($('#conference_slug').val() === '') {
                const slug = $(this).val()
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                $('#conference_slug').val(slug);
            }
        });
    }
    
    function initializeConferenceActions() {
        // Update conference
        $('.update-conference').on('click', function() {
            const conferenceId = $(this).data('id');
            const row = $(this).closest('tr');
            const name = row.find('strong').text().trim();
            const slug = row.find('code').text().trim();
            const notificationEmail = row.find('.notification-email').val();
            const eligibilityDays = row.find('.eligibility-days').val();
            const itemsPerPerson = row.find('.items-per-person').val();
            const active = row.find('.organization-active').is(':checked') ? 1 : 0;
            const woodshopPaused = row.find('.woodshop-paused').is(':checked') ? 1 : 0;
            const enablePrintableVoucher = row.find('.enable-printable-voucher').is(':checked') ? 1 : 0;

            if (confirm('Update this organization?')) {
                $.ajax({
                    url: svdpAdmin.ajaxUrl,
                    method: 'POST',
                    data: {
                        action: 'svdp_update_conference',
                        nonce: svdpAdmin.nonce,
                        id: conferenceId,
                        name: name,
                        slug: slug,
                        notification_email: notificationEmail,
                        eligibility_days: eligibilityDays,
                        items_per_person: itemsPerPerson,
                        active: active,
                        woodshop_paused: woodshopPaused,
                        enable_printable_voucher: enablePrintableVoucher
                    },
                    success: function(response) {
                        if (response.success) {
                            alert('Conference updated successfully!');
                        } else {
                            alert('Error: ' + response.data);
                        }
                    },
                    error: function() {
                        alert('Error updating conference');
                    }
                });
            }
        });
        
        // Delete conference
        $('.delete-conference').on('click', function() {
            const conferenceId = $(this).data('id');
            const conferenceName = $(this).closest('tr').find('strong').text();
            
            if (confirm('Are you sure you want to delete "' + conferenceName + '"?\n\nThis will not delete existing vouchers, but the conference will no longer be available for new vouchers.')) {
                $.ajax({
                    url: svdpAdmin.ajaxUrl,
                    method: 'POST',
                    data: {
                        action: 'svdp_delete_conference',
                        nonce: svdpAdmin.nonce,
                        id: conferenceId
                    },
                    success: function(response) {
                        if (response.success) {
                            alert('Conference deleted successfully!');
                            location.reload();
                        } else {
                            alert('Error: ' + response.data);
                        }
                    },
                    error: function() {
                        alert('Error deleting conference');
                    }
                });
            }
        });
    }

    function initializeCatalogAvailabilityToggles() {
        function syncAvailability($toggle) {
            const container = $toggle.closest('tr').length ? $toggle.closest('tr') : $toggle.closest('form');
            const availability = container.find('.catalog-availability');
            if (!availability.length) {
                return;
            }

            const isWoodshop = $toggle.is(':checked');
            availability.prop('disabled', !isWoodshop);
            if (!isWoodshop) {
                availability.val('available');
            }
        }

        $('.catalog-woodshop-toggle').each(function() {
            syncAvailability($(this));
        });

        $(document).on('change', '.catalog-woodshop-toggle', function() {
            syncAvailability($(this));
        });
    }

    function initializeCatalogForms() {
        $('.svdp-catalog-form').on('submit', function(e) {
            e.preventDefault();
            
            const form = $(this);
            const type = form.data('catalog-type');
            const submitBtn = form.find('button[type="submit"]');
            const messageDiv = $('#' + type + '-item-message');
            
            submitBtn.prop('disabled', true).text('Adding...');
            messageDiv.empty();
            
            // Gather data
            const data = {
                action: 'svdp_add_catalog_item',
                nonce: svdpAdmin.nonce,
                voucher_type: type,
                category: form.find('[name="category"]').val(),
                name: form.find('[name="name"]').val(),
                min_price: form.find('[name="min_price"]').val(),
                max_price: form.find('[name="max_price"]').val(),
                is_woodshop: form.find('[name="is_woodshop"]').is(':checked') ? 1 : 0,
                availability_status: form.find('[name="availability_status"]').val(),
                sort_order: form.find('[name="sort_order"]').val()
            };

            $.ajax({
                url: svdpAdmin.ajaxUrl,
                method: 'POST',
                data: data,
                success: function(response) {
                    if (response.success) {
                        messageDiv.html('<div class="notice notice-success inline"><p>' + response.data + '</p></div>');
                        form[0].reset();
                        // Reset availability dropdown if needed
                        form.find('.catalog-availability').prop('disabled', true).val('available');
                        
                        // Reload to show new item
                        setTimeout(function() {
                            location.reload();
                        }, 1000);
                    } else {
                        messageDiv.html('<div class="notice notice-error inline"><p>' + response.data + '</p></div>');
                        submitBtn.prop('disabled', false).text('Add ' + type.charAt(0).toUpperCase() + type.slice(1) + ' Item');
                    }
                },
                error: function() {
                    messageDiv.html('<div class="notice notice-error inline"><p>Error adding item</p></div>');
                    submitBtn.prop('disabled', false).text('Add ' + type.charAt(0).toUpperCase() + type.slice(1) + ' Item');
                }
            });
        });
    }

    function initializeCatalogItemActions() {
        $('.svdp-update-catalog-item').on('click', function() {
            const btn = $(this);
            const row = btn.closest('tr');
            const id = row.data('id');
            const type = row.data('catalog-type');
            
            const originalText = btn.text();
            btn.prop('disabled', true).text('Saving...');

            const data = {
                action: 'svdp_update_catalog_item',
                nonce: svdpAdmin.nonce,
                id: id,
                voucher_type: type,
                name: row.find('.catalog-name').val(),
                category: row.find('.catalog-category').val(),
                min_price: row.find('.catalog-min-price').val(),
                max_price: row.find('.catalog-max-price').val(),
                is_woodshop: row.find('.catalog-woodshop-toggle').is(':checked') ? 1 : 0,
                availability_status: row.find('.catalog-availability').val(),
                sort_order: row.find('.catalog-sort-order').val(),
                active: row.find('.catalog-active').is(':checked') ? 1 : 0
            };

            $.ajax({
                url: svdpAdmin.ajaxUrl,
                method: 'POST',
                data: data,
                success: function(response) {
                    if (response.success) {
                        // Visual feedback
                        btn.text('Saved!');
                        setTimeout(function() {
                            btn.prop('disabled', false).text(originalText);
                        }, 2000);
                    } else {
                        alert('Error: ' + response.data);
                        btn.prop('disabled', false).text(originalText);
                    }
                },
                error: function() {
                    alert('Error updating item');
                    btn.prop('disabled', false).text(originalText);
                }
            });
        });
    }
    
})(jQuery);
