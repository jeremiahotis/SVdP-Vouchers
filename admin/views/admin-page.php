<div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

    <h2 class="nav-tab-wrapper">
        <a href="?page=svdp-vouchers&tab=analytics"
            class="nav-tab <?php echo $active_tab === 'analytics' ? 'nav-tab-active' : ''; ?>">
            Analytics
        </a>
        <a href="?page=svdp-vouchers&tab=conferences"
            class="nav-tab <?php echo $active_tab === 'conferences' ? 'nav-tab-active' : ''; ?>">
            Conferences
        </a>
        <a href="?page=svdp-vouchers&tab=vouchers"
            class="nav-tab <?php echo $active_tab === 'vouchers' ? 'nav-tab-active' : ''; ?>">
            Vouchers
        </a>
        <a href="?page=svdp-vouchers&tab=furniture"
            class="nav-tab <?php echo $active_tab === 'furniture' ? 'nav-tab-active' : ''; ?>">
            Furniture
        </a>
        <a href="?page=svdp-vouchers&tab=household-goods"
            class="nav-tab <?php echo $active_tab === 'household-goods' ? 'nav-tab-active' : ''; ?>">
            Household Goods
        </a>
        <a href="?page=svdp-vouchers&tab=managers"
            class="nav-tab <?php echo $active_tab === 'managers' ? 'nav-tab-active' : ''; ?>">
            Managers
        </a>
        <a href="?page=svdp-vouchers&tab=override-reasons"
            class="nav-tab <?php echo $active_tab === 'override-reasons' ? 'nav-tab-active' : ''; ?>">
            Override Reasons
        </a>
        <a href="?page=svdp-vouchers&tab=audit-trail"
            class="nav-tab <?php echo $active_tab === 'audit-trail' ? 'nav-tab-active' : ''; ?>">
            Audit Trail
        </a>
        <a href="?page=svdp-vouchers&tab=reports"
            class="nav-tab <?php echo $active_tab === 'reports' ? 'nav-tab-active' : ''; ?>">
            Reports
        </a>
        <a href="?page=svdp-vouchers&tab=reconciliation"
            class="nav-tab <?php echo $active_tab === 'reconciliation' ? 'nav-tab-active' : ''; ?>">
            Reconciliation
        </a>
        <a href="?page=svdp-vouchers&tab=imports"
            class="nav-tab <?php echo $active_tab === 'imports' ? 'nav-tab-active' : ''; ?>">
            Imports
        </a>
        <a href="?page=svdp-vouchers&tab=settings"
            class="nav-tab <?php echo $active_tab === 'settings' ? 'nav-tab-active' : ''; ?>">
            Settings
        </a>
    </h2>

    <div class="svdp-admin-content">
        <?php
        switch ($active_tab) {
            case 'analytics':
                include 'tab-analytics.php';
                break;
            case 'conferences':
                include 'tab-conferences.php';
                break;
            case 'vouchers':
                include 'tab-vouchers.php';
                break;
            case 'furniture':
                include 'tab-furniture.php';
                break;
            case 'household-goods':
                include 'tab-household-goods.php';
                break;
            case 'managers':
                include 'managers-tab.php';
                break;
            case 'override-reasons':
                include 'override-reasons-tab.php';
                break;
            case 'audit-trail':
                include 'tab-audit-trail.php';
                break;
            case 'reports':
                include 'tab-reports.php';
                break;
            case 'imports':
                include 'tab-imports.php';
                break;
            case 'reconciliation':
                include 'tab-reconciliation.php';
                break;
            case 'settings':
                include 'tab-settings.php';
                break;
        }
        ?>
    </div>
</div>