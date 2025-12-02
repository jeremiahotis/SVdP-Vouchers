<div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    
    <h2 class="nav-tab-wrapper">
        <a href="?page=svdp-vouchers&tab=analytics" class="nav-tab <?php echo $active_tab === 'analytics' ? 'nav-tab-active' : ''; ?>">
            Analytics
        </a>
        <a href="?page=svdp-vouchers&tab=conferences" class="nav-tab <?php echo $active_tab === 'conferences' ? 'nav-tab-active' : ''; ?>">
            Conferences
        </a>
        <a href="?page=svdp-vouchers&tab=monday" class="nav-tab <?php echo $active_tab === 'monday' ? 'nav-tab-active' : ''; ?>">
            Monday.com Sync
        </a>
        <a href="?page=svdp-vouchers&tab=settings" class="nav-tab <?php echo $active_tab === 'settings' ? 'nav-tab-active' : ''; ?>">
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
            case 'monday':
                include 'tab-monday.php';
                break;
            case 'settings':
                include 'tab-settings.php';
                break;
        }
        ?>
    </div>
</div>
