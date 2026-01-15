<div class="svdp-report-tab">
    <h1>Financial Reports</h1>

    <!-- Filters -->
    <div class="svdp-card svdp-filters-panel">
        <div class="filter-grid">
            <div class="filter-group">
                <label>📅 Date Range</label>
                <select id="report_date_range">
                    <option value="">All Time</option>
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                    <option value="this_year">This Year</option>
                    <option value="last_year">Last Year</option>
                    <option value="custom">Custom Range</option>
                </select>
            </div>

            <div class="filter-group" id="report_custom_dates" style="display:none;">
                <label>Custom Range</label>
                <div style="display:flex; gap:10px;">
                    <input type="date" id="report_date_start">
                    <input type="date" id="report_date_end">
                </div>
            </div>

            <div class="filter-group">
                <label>🏢 Conference</label>
                <select id="report_conference_id">
                    <option value="">All Conferences</option>
                    <?php
                    $conferences = $wpdb->get_results("SELECT id, name FROM {$wpdb->prefix}svdp_conferences ORDER BY name");
                    foreach ($conferences as $conf) {
                        echo '<option value="' . esc_attr($conf->id) . '">' . esc_html($conf->name) . '</option>';
                    }
                    ?>
                </select>
            </div>

            <div class="filter-actions">
                <button type="button" class="button button-primary" id="btn-run-report">Run Report</button>
                <form method="post" action="<?php echo admin_url('admin-post.php'); ?>" style="display:inline;">
                    <input type="hidden" name="action" value="svdp_export_report">
                    <?php wp_nonce_field('svdp_export_report'); ?>
                    <input type="hidden" name="date_start" id="export_report_start">
                    <input type="hidden" name="date_end" id="export_report_end">
                    <input type="hidden" name="conference_id" id="export_report_conf">
                    <button type="submit" class="button">Export CSV</button>
                </form>
            </div>
        </div>
    </div>

    <!-- KPIs -->
    <div class="stats-grid">
        <div class="stat-box">
            <div class="stat-number" id="rpt-issued">-</div>
            <div class="stat-label">Vouchers Issued</div>
        </div>
        <div class="stat-box">
            <div class="stat-number" id="rpt-redeemed">-</div>
            <div class="stat-label">Redeemed</div>
        </div>
        <div class="stat-box info">
            <div class="stat-number" id="rpt-authorized">-</div>
            <div class="stat-label">Authorized Amount</div>
        </div>
        <div class="stat-box success">
            <div class="stat-number" id="rpt-conf-share">-</div>
            <div class="stat-label">Conference Share</div>
        </div>
        <div class="stat-box warning">
            <div class="stat-number" id="rpt-store-share">-</div>
            <div class="stat-label">Store Share (Subsidy)</div>
        </div>
    </div>

    <!-- Data Table -->
    <div class="svdp-card">
        <table class="wp-list-table widefat fixed striped" id="report-table">
            <thead>
                <tr>
                    <th>Report Key</th>
                    <th>Issued</th>
                    <th>Redeemed</th>
                    <th>Authorized ($)</th>
                    <th>Conf. Share ($)</th>
                    <th>Store Share ($)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="6">Select filters and run report.</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<style>
    /* Reusing styles from Analytics tab ideally, but defining here for safety if not shared */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 20px;
        margin: 20px 0;
    }

    .stat-box {
        background: white;
        padding: 20px;
        border: 1px solid #ddd;
        border-left: 4px solid #0073aa;
    }

    .stat-box.success {
        border-left-color: #46b450;
    }

    .stat-box.warning {
        border-left-color: #ffb900;
    }

    .stat-box.info {
        border-left-color: #00a0d2;
    }

    .stat-number {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 5px;
    }

    .svdp-card {
        background: #fff;
        padding: 15px;
        border: 1px solid #ccd0d4;
        box-shadow: 0 1px 1px rgba(0, 0, 0, .04);
        margin-bottom: 20px;
    }

    .filter-grid {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
        align-items: flex-end;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
</style>

<script>
    jQuery(document).ready(function ($) {

        // Date Range Logic
        $('#report_date_range').on('change', function () {
            var val = $(this).val();
            if (val === 'custom') {
                $('#report_custom_dates').show();
            } else {
                $('#report_custom_dates').hide();
                // Calculate standard ranges
                var end = new Date();
                var start = new Date();

                if (val === '30') start.setDate(end.getDate() - 30);
                if (val === '90') start.setDate(end.getDate() - 90);
                if (val === 'this_year') start = new Date(end.getFullYear(), 0, 1);
                if (val === 'last_year') {
                    start = new Date(end.getFullYear() - 1, 0, 1);
                    end = new Date(end.getFullYear() - 1, 11, 31);
                }

                if (val) {
                    $('#report_date_start').val(start.toISOString().split('T')[0]);
                    $('#report_date_end').val(end.toISOString().split('T')[0]);
                } else {
                    $('#report_date_start').val('');
                    $('#report_date_end').val('');
                }
            }
        });

        // Run Report
        $('#btn-run-report').on('click', function () {
            var data = {
                action: 'svdp_get_report_data',
                nonce: svdpAdmin.nonce,
                date_start: $('#report_date_start').val(),
                date_end: $('#report_date_end').val(),
                conference_id: $('#report_conference_id').val()
            };

            // Sync to export form
            $('#export_report_start').val(data.date_start);
            $('#export_report_end').val(data.date_end);
            $('#export_report_conf').val(data.conference_id);

            $('#report-table tbody').html('<tr><td colspan="6">Loading...</td></tr>');

            $.ajax({
                url: svdpAdmin.ajaxUrl,
                method: 'POST',
                data: data,
                success: function (response) {
                    if (response.success) {
                        renderReport(response.data);
                    } else {
                        $('#report-table tbody').html('<tr><td colspan="6">Error: ' + response.data + '</td></tr>');
                    }
                }
            });
        });

        function renderReport(data) {
            // KPIs
            $('#rpt-issued').text(Number(data.totals.issued).toLocaleString());
            $('#rpt-redeemed').text(Number(data.totals.redeemed).toLocaleString());
            $('#rpt-authorized').text('$' + Number(data.totals.authorized).toLocaleString(undefined, { minimumFractionDigits: 2 }));
            $('#rpt-conf-share').text('$' + Number(data.totals.conference_liability).toLocaleString(undefined, { minimumFractionDigits: 2 }));
            $('#rpt-store-share').text('$' + Number(data.totals.store_liability).toLocaleString(undefined, { minimumFractionDigits: 2 }));

            // Table
            var html = '';
            if (data.breakdown.length > 0) {
                data.breakdown.forEach(function (row) {
                    html += '<tr>' +
                        '<td>' + row.report_key + '</td>' +
                        '<td>' + row.total_issued + '</td>' +
                        '<td>' + row.total_redeemed + '</td>' +
                        '<td>$' + Number(row.total_authorized_amount).toFixed(2) + '</td>' +
                        '<td>$' + Number(row.total_conference_share).toFixed(2) + '</td>' +
                        '<td>$' + Number(row.total_store_share).toFixed(2) + '</td>' +
                        '</tr>';
                });
            } else {
                html = '<tr><td colspan="6">No data found.</td></tr>';
            }
            $('#report-table tbody').html(html);
        }
    });
</script>