(function($) {
    'use strict';
    
    $(document).ready(function() {
        initializeAddConferenceForm();
        initializeConferenceActions();
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
                    slug: $('#conference_slug').val()
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
            const mondayLabel = row.find('.monday-label').val();
            
            if (confirm('Update this conference?')) {
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
                        monday_label: mondayLabel
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
    
})(jQuery);
