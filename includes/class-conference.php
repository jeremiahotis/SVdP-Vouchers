<?php
/**
 * Conference management
 */
class SVDP_Conference
{

    /**
     * Get all active conferences
     */
    public static function get_all($active_only = true)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_conferences';

        $where = $active_only ? "WHERE active = 1" : "";
        $sql = "SELECT * FROM $table $where ORDER BY name ASC";

        return $wpdb->get_results($sql);
    }

    /**
     * Get conference by ID
     */
    public static function get_by_id($id)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_conferences';

        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE id = %d",
            $id
        ));
    }

    /**
     * Get conference by slug
     */
    public static function get_by_slug($slug)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_conferences';

        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE slug = %s",
            $slug
        ));
    }

    /**
     * Create conference
     */
    public static function create($name, $slug = '', $is_emergency = 0, $organization_type = 'conference', $eligibility_days = 90, $regular_items = 7, $woodshop_paused = 0, $enable_printable_voucher = 0)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_conferences';

        // Generate slug if not provided
        if (empty($slug)) {
            $slug = sanitize_title($name);
        }

        $result = $wpdb->insert($table, [
            'name' => sanitize_text_field($name),
            'slug' => sanitize_title($slug),
            'is_emergency' => intval($is_emergency),
            'organization_type' => sanitize_text_field($organization_type),
            'woodshop_paused' => intval($woodshop_paused),
            'enable_printable_voucher' => intval($enable_printable_voucher),
            'eligibility_days' => intval($eligibility_days),
            'regular_items_per_person' => intval($regular_items),
            'emergency_items_per_person' => 3, // Default for emergency vouchers
            'allowed_voucher_types' => json_encode(['clothing']), // Default
            'active' => 1,
        ]);

        if ($result) {
            return $wpdb->insert_id;
        }

        return false;
    }

    /**
     * Update conference
     */
    public static function update($id, $data)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_conferences';

        $update_data = [];

        if (isset($data['name'])) {
            $update_data['name'] = sanitize_text_field($data['name']);
        }

        if (isset($data['slug'])) {
            $update_data['slug'] = sanitize_title($data['slug']);
        }

        if (isset($data['active'])) {
            $update_data['active'] = intval($data['active']);
        }

        if (isset($data['notification_email'])) {
            $update_data['notification_email'] = sanitize_email($data['notification_email']);
        }

        if (isset($data['eligibility_days'])) {
            $update_data['eligibility_days'] = intval($data['eligibility_days']);
        }

        if (isset($data['items_per_person'])) {
            $update_data['regular_items_per_person'] = intval($data['items_per_person']);
        }

        if (isset($data['allowed_voucher_types'])) {
            $update_data['allowed_voucher_types'] = $data['allowed_voucher_types']; // Already JSON
        }

        if (isset($data['woodshop_paused'])) {
            $update_data['woodshop_paused'] = intval($data['woodshop_paused']);
        }

        if (isset($data['enable_printable_voucher'])) {
            $update_data['enable_printable_voucher'] = intval($data['enable_printable_voucher']);
        }

        if (isset($data['custom_form_text'])) {
            $update_data['custom_form_text'] = sanitize_textarea_field($data['custom_form_text']);
        }

        if (isset($data['custom_rules_text'])) {
            $update_data['custom_rules_text'] = sanitize_textarea_field($data['custom_rules_text']);
        }

        if (empty($update_data)) {
            return false;
        }

        return $wpdb->update($table, $update_data, ['id' => $id]);
    }

    /**
     * Get the default store organization ID.
     */
    public static function get_default_store_id()
    {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_conferences';

        $default_store_id = SVDP_Settings::get_setting('default_store_id', '');
        if (!empty($default_store_id)) {
            $store = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM $table WHERE id = %d AND organization_type = 'store' AND active = 1",
                $default_store_id
            ));
            if (!empty($store)) {
                return (int) $store;
            }
        }

        $fallback = $wpdb->get_var("SELECT id FROM $table WHERE organization_type = 'store' AND active = 1 ORDER BY id ASC LIMIT 1");
        return !empty($fallback) ? (int) $fallback : null;
    }

    /**
     * Delete conference (soft delete by setting active = 0)
     */
    public static function delete($id)
    {
        return self::update($id, ['active' => 0]);
    }

    /**
     * REST API: Get conferences
     */
    public static function get_conferences($request)
    {
        $conferences = self::get_all(true);

        return rest_ensure_response([
            'success' => true,
            'conferences' => $conferences,
        ]);
    }
}
