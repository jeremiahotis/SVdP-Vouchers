<?php
/**
 * Migration v0003: Add store_id and store settings
 *
 * Idempotent: YES
 * Notes:
 * - Use $wpdb->get_results("SHOW COLUMNS ...") / "SHOW TABLES LIKE ..." checks
 * - Use dbDelta() for CREATE/ALTER where appropriate
 */
return function() {
    global $wpdb;

    // TODO: implement
};
