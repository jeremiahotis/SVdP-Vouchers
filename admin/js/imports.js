jQuery(document).ready(function ($) {
    if (!$('#svdp-import-form').length) {
        return;
    }

    $('#svdp-import-form').on('submit', function (e) {
        e.preventDefault();

        var form = this;
        var formData = new FormData(form);
        formData.append('action', 'svdp_import_csv');
        formData.append('nonce', svdpAdmin.nonce);

        // UI State: Loading
        $('#btn-import').prop('disabled', true);
        $('.spinner').addClass('is-active');
        $('#import-message').html('').removeClass('error updated notice notice-success notice-error');

        $.ajax({
            url: svdpAdmin.ajaxUrl,
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: function (response) {
                $('.spinner').removeClass('is-active');
                $('#btn-import').prop('disabled', false);

                if (response.success) {
                    var msg = response.data.message || 'Import completed successfully.';
                    $('#import-message').html('<p>' + msg + '</p>').addClass('updated notice notice-success');

                    // Reset form
                    form.reset();

                    // Reload page to show stats after short delay
                    setTimeout(function () {
                        location.reload();
                    }, 2000);
                } else {
                    var errorMsg = response.data || 'Unknown error occurred';
                    $('#import-message').html('<p>Error: ' + errorMsg + '</p>').addClass('error notice notice-error');
                }
            },
            error: function (xhr, status, error) {
                $('.spinner').removeClass('is-active');
                $('#btn-import').prop('disabled', false);
                $('#import-message').html('<p>Connection error: ' + error + '</p>').addClass('error notice notice-error');
            }
        });
    });
});
