<?php
/**
 * Settings management
 */
class SVDP_Settings {

    /**
     * Get a setting value
     *
     * @param string $key Setting key
     * @param mixed $default Default value if setting not found
     * @return mixed Setting value or default
     */
    public static function get_setting($key, $default = null) {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_settings';

        $setting = $wpdb->get_row($wpdb->prepare(
            "SELECT setting_value FROM $table WHERE setting_key = %s",
            $key
        ));

        if ($setting) {
            return $setting->setting_value;
        }

        return $default;
    }

    /**
     * Update a setting value
     *
     * @param string $key Setting key
     * @param mixed $value Setting value
     * @param string $type Setting type (text, decimal, textarea)
     * @return bool Success
     */
    public static function update_setting($key, $value, $type = 'text') {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_settings';

        // Check if setting exists
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table WHERE setting_key = %s",
            $key
        ));

        if ($exists) {
            // Update existing setting
            $result = $wpdb->update(
                $table,
                [
                    'setting_value' => $value,
                    'setting_type' => $type,
                    'updated_at' => current_time('mysql')
                ],
                ['setting_key' => $key]
            );

            return $result !== false;
        } else {
            // Insert new setting
            $result = $wpdb->insert(
                $table,
                [
                    'setting_key' => $key,
                    'setting_value' => $value,
                    'setting_type' => $type
                ]
            );

            return $result !== false;
        }
    }

    /**
     * Get all settings as an associative array
     *
     * @return array Settings array [key => value]
     */
    public static function get_all_settings() {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_settings';

        $settings = $wpdb->get_results("SELECT setting_key, setting_value FROM $table");

        $result = [];
        foreach ($settings as $setting) {
            $result[$setting->setting_key] = $setting->setting_value;
        }

        return $result;
    }

    /**
     * Get item values (adult and child)
     *
     * @return array ['adult' => float, 'child' => float]
     */
    public static function get_item_values() {
        return [
            'adult' => (float) self::get_setting('adult_item_value', 5.00),
            'child' => (float) self::get_setting('child_item_value', 3.00)
        ];
    }

    /**
     * Get available voucher types
     *
     * @return array Array of voucher type strings
     */
    public static function get_available_voucher_types() {
        $types_string = self::get_setting('available_voucher_types', 'clothing');
        return array_map('trim', explode(',', $types_string));
    }

    /**
     * Get store hours
     *
     * @return string Store hours text
     */
    public static function get_store_hours() {
        return self::get_setting('store_hours', 'Monday-Friday 9am-5pm');
    }

    /**
     * Get redemption instructions
     *
     * @return string Redemption instructions text
     */
    public static function get_redemption_instructions() {
        return self::get_setting('redemption_instructions', 'Please bring your voucher and ID to the store.');
    }
}
