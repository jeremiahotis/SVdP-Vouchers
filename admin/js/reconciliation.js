jQuery(document).ready(function ($) {
    // Tab Switching - Specific to Reconciliation Sub-tabs
    $('.svdp-recon-tabs a').on('click', function (e) {
        e.preventDefault();
        var target = $(this).attr('href').replace('#', '');

        $('.nav-tab').removeClass('nav-tab-active');
        $(this).addClass('nav-tab-active');

        $('.svdp-tab-content').hide();
        $('#tab-' + target).show();

        // If Unmatched tab, load data if empty?
        if (target === 'unmatched') {
            loadUnmatchedReceipts();
        }
    });

    // Open Modal
    $(document).on('click', '.action-view-reconciliation', function (e) {
        e.preventDefault();
        var voucherId = $(this).data('id');

        // Show loading state?
        $('#svdp-reconciliation-modal').show();
        $('#recon-voucher-id').text('#' + voucherId);
        $('#recon-list-authorized').html('<tr><td colspan="4">Loading...</td></tr>');
        $('#recon-list-redeemed').html('<tr><td colspan="4">Loading...</td></tr>');

        // Fetch Data
        $.ajax({
            url: svdpAdmin.ajaxUrl,
            method: 'POST',
            data: {
                action: 'svdp_get_reconciliation_detail',
                nonce: svdpAdmin.nonce,
                voucher_id: voucherId
            },
            success: function (response) {
                if (response.success) {
                    renderReconciliation(response.data);
                } else {
                    alert('Error: ' + response.data.message);
                }
            },
            error: function () {
                alert('Ajax request failed');
            }
        });
    });

    // Close Modal
    $('.svdp-modal-close').on('click', function () {
        $('#svdp-reconciliation-modal').hide();
    });

    // Close on outside click
    $(window).on('click', function (e) {
        if ($(e.target).is('#svdp-reconciliation-modal')) {
            $('#svdp-reconciliation-modal').hide();
        }
    });

    function renderReconciliation(data) {
        // Summary
        $('#recon-max-value').text('$' + parseFloat(data.summary.authorized_max_value).toFixed(2));
        $('#recon-gross-total').text('$' + parseFloat(data.summary.redeemed_gross_total).toFixed(2));

        // Render Authorized Items
        var authHtml = '';
        if (data.authorized_items.length > 0) {
            data.authorized_items.forEach(function (item) {
                var priceRange = '$' + item.item_price_min + ' - $' + item.item_price_max;
                authHtml += '<tr>' +
                    '<td>' + item.quantity + '</td>' +
                    '<td>' + item.item_name + '</td>' +
                    '<td>' + item.item_category + '</td>' +
                    '<td>' + priceRange + '</td>' +
                    '</tr>';
            });
        } else {
            authHtml = '<tr><td colspan="4">No authorized items found (Legacy Voucher?)</td></tr>';
        }
        $('#recon-list-authorized').html(authHtml);

        // Render Redeemed Items
        var redHtml = '';
        if (data.redeemed_items.length > 0) {
            data.redeemed_items.forEach(function (item) {
                redHtml += '<tr>' +
                    '<td>' + item.quantity + '</td>' +
                    '<td>' + (item.description || 'N/A') + '</td>' +
                    '<td>' + (item.sku || '-') + '</td>' +
                    '<td>$' + parseFloat(item.line_total).toFixed(2) + '</td>' +
                    '</tr>';
            });
        } else {
            redHtml = '<tr><td colspan="4">No receipt items found (Summary Only Receipt?)</td></tr>';
        }
        $('#recon-list-redeemed').html(redHtml);
    }
});
