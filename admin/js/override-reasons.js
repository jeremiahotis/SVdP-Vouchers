(function($) {
    'use strict';

    $(document).ready(function() {
        if ($('#svdp-reasons-list').length === 0) {
            return; // Not on reasons tab
        }

        loadReasons();

        // Add reason
        $('#svdp-add-reason').on('click', function() {
            const reasonText = $('#svdp-new-reason-text').val().trim();

            if (!reasonText) {
                alert('Please enter a reason');
                return;
            }

            $.ajax({
                url: svdpAdmin.ajaxUrl,
                method: 'POST',
                data: {
                    action: 'svdp_add_reason',
                    nonce: svdpAdmin.nonce,
                    reason_text: reasonText
                },
                success: function(response) {
                    if (response.success) {
                        $('#svdp-new-reason-text').val('');
                        loadReasons();
                    } else {
                        alert('Error: ' + response.data);
                    }
                },
                error: function() {
                    alert('Failed to add reason');
                }
            });
        });

        // Edit reason
        $(document).on('click', '.svdp-edit-reason', function() {
            const id = $(this).data('id');
            const text = $(this).data('text');

            $('#svdp-edit-reason-id').val(id);
            $('#svdp-edit-reason-text').val(text);
            $('#svdp-edit-reason-modal').show();
        });

        // Save edit
        $('#svdp-save-reason-edit').on('click', function() {
            const id = $('#svdp-edit-reason-id').val();
            const text = $('#svdp-edit-reason-text').val().trim();

            if (!text) {
                alert('Please enter a reason');
                return;
            }

            $.ajax({
                url: svdpAdmin.ajaxUrl,
                method: 'POST',
                data: {
                    action: 'svdp_update_reason',
                    nonce: svdpAdmin.nonce,
                    id: id,
                    reason_text: text
                },
                success: function(response) {
                    if (response.success) {
                        $('#svdp-edit-reason-modal').hide();
                        loadReasons();
                    } else {
                        alert('Error: ' + response.data);
                    }
                },
                error: function() {
                    alert('Failed to update reason');
                }
            });
        });

        // Delete reason
        $(document).on('click', '.svdp-delete-reason', function() {
            if (!confirm('Delete this reason? This cannot be undone.')) {
                return;
            }

            const id = $(this).data('id');

            $.ajax({
                url: svdpAdmin.ajaxUrl,
                method: 'POST',
                data: {
                    action: 'svdp_delete_reason',
                    nonce: svdpAdmin.nonce,
                    id: id
                },
                success: function(response) {
                    if (response.success) {
                        loadReasons();
                    } else {
                        alert('Error: ' + response.data);
                    }
                },
                error: function() {
                    alert('Failed to delete reason');
                }
            });
        });
    });

    function loadReasons() {
        $.ajax({
            url: svdpAdmin.ajaxUrl,
            method: 'POST',
            data: {
                action: 'svdp_get_reasons',
                nonce: svdpAdmin.nonce
            },
            success: function(response) {
                if (response.success) {
                    renderReasons(response.data);
                }
            }
        });
    }

    function renderReasons(reasons) {
        const tbody = $('#svdp-reasons-list');
        tbody.empty();

        if (reasons.length === 0) {
            tbody.append('<tr><td colspan="4">No reasons yet. Add one above!</td></tr>');
            return;
        }

        reasons.forEach(function(reason, index) {
            const statusClass = reason.active == 1 ? 'reason-status-active' : 'reason-status-inactive';
            const statusText = reason.active == 1 ? 'Active' : 'Inactive';

            const row = $('<tr>').attr('data-id', reason.id);
            row.append($('<td>').html('<span class="svdp-drag-handle"></span> ' + (index + 1)));
            row.append($('<td>').text(reason.reason_text));
            row.append($('<td>').html('<span class="' + statusClass + '">' + statusText + '</span>'));

            const actions = $('<td>');
            actions.append(
                $('<button>')
                    .addClass('button button-small svdp-edit-reason')
                    .attr('data-id', reason.id)
                    .attr('data-text', reason.reason_text)
                    .text('Edit')
            );
            actions.append(' ');
            actions.append(
                $('<button>')
                    .addClass('button button-small svdp-delete-reason')
                    .attr('data-id', reason.id)
                    .text('Delete')
            );

            row.append(actions);
            tbody.append(row);
        });

        // Enable sortable
        tbody.sortable({
            handle: '.svdp-drag-handle',
            update: function(event, ui) {
                saveOrder();
            }
        });
    }

    function saveOrder() {
        const order = [];
        $('#svdp-reasons-list tr').each(function() {
            const id = $(this).data('id');
            if (id) {
                order.push(id);
            }
        });

        $.ajax({
            url: svdpAdmin.ajaxUrl,
            method: 'POST',
            data: {
                action: 'svdp_reorder_reasons',
                nonce: svdpAdmin.nonce,
                order: order
            },
            success: function(response) {
                if (!response.success) {
                    alert('Failed to save order');
                    loadReasons(); // Reload to reset
                }
            }
        });
    }

})(jQuery);
