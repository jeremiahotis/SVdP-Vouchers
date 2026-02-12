<?php
/**
 * Migration v0006: Create POS receipt import tables
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
