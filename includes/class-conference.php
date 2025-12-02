<?php
/**
 * Conference management
 */
class SVDP_Conference {
    
    /**
     * Get all active conferences
     */
    public static function get_all($active_only = true) {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_conferences';
        
        $where = $active_only ? "WHERE active = 1" : "";
        $sql = "SELECT * FROM $table $where ORDER BY name ASC";
        
        return $wpdb->get_results($sql);
    }
    
    /**
     * Get conference by ID
     */
    public static function get_by_id($id) {
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
    public static function get_by_slug($slug) {
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
    public static function create($name, $slug = '', $is_emergency = 0) {
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
    public static function update($id, $data) {
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
        
        if (isset($data['monday_label'])) {
            $update_data['monday_label'] = sanitize_text_field($data['monday_label']);
        }
        
        if (isset($data['notification_email'])) {
            $update_data['notification_email'] = sanitize_email($data['notification_email']);
        }
        
        if (empty($update_data)) {
            return false;
        }
        
        return $wpdb->update($table, $update_data, ['id' => $id]);
    }
    
    /**
     * Delete conference (soft delete by setting active = 0)
     */
    public static function delete($id) {
        return self::update($id, ['active' => 0]);
    }
    
    /**
     * REST API: Get conferences
     */
    public static function get_conferences($request) {
        $conferences = self::get_all(true);
        
        return rest_ensure_response([
            'success' => true,
            'conferences' => $conferences,
        ]);
    }
}
