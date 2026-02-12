<?php
/**
 * Catalog management for itemized voucher types
 */
class SVDP_Catalog {
    private const FURNITURE_CATEGORIES = [
        'Beds & Mattresses',
        'Kids Furniture',
        'Seating',
        'Tables',
        'Storage',
        'Appliances',
        'Handmade Furniture (Woodshop)',
        'Accessibility & Safety',
    ];

    private const HOUSEHOLD_CATEGORIES = [
        'Bedding & Linens',
        'Towels & Bath',
        'Kitchenware',
        'Food Storage & Prep',
        'Window Coverings',
        'Cleaning & Home Care',
        'Small Appliances',
        'Home Basics',
    ];

    /**
     * Normalize catalog type input
     */
    private static function normalize_type($type) {
        $type = sanitize_text_field($type);
        if ($type === 'household_goods') {
            return 'household';
        }
        return $type;
    }

    /**
     * Get catalog table name
     */
    private static function table_for_type($type) {
        global $wpdb;
        $type = self::normalize_type($type);

        if ($type !== 'household' && $type !== 'furniture') {
            return null;
        }

        return $wpdb->prefix . 'svdp_catalog_items';
    }

    /**
     * Get catalog items
     */
    public static function get_items($type, $active_only = true) {
        global $wpdb;
        $table = self::table_for_type($type);
        $type = self::normalize_type($type);

        if (!$table) {
            return [];
        }

        $where = "WHERE voucher_type = %s";
        if ($active_only) {
            $where .= " AND active = 1";
        }
        $sql = $wpdb->prepare(
            "SELECT * FROM $table $where ORDER BY category ASC, sort_order ASC, name ASC",
            $type
        );

        return $wpdb->get_results($sql);
    }

    /**
     * Get a single catalog item
     */
    public static function get_item($type, $id) {
        global $wpdb;
        $table = self::table_for_type($type);
        $type = self::normalize_type($type);

        if (!$table) {
            return null;
        }

        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE id = %d AND voucher_type = %s",
            $id,
            $type
        ));
    }

    /**
     * Get allowed categories for a catalog type.
     */
    public static function get_categories($type) {
        $type = self::normalize_type($type);

        if ($type === 'furniture') {
            return self::FURNITURE_CATEGORIES;
        }

        if ($type === 'household') {
            return self::HOUSEHOLD_CATEGORIES;
        }

        return [];
    }

    /**
     * Validate category for catalog type.
     */
    private static function is_valid_category($type, $category) {
        $category = trim((string) $category);
        if ($category === '') {
            return false;
        }

        return in_array($category, self::get_categories($type), true);
    }

    /**
     * Create catalog item
     */
    public static function create_item($type, $data) {
        global $wpdb;
        $table = self::table_for_type($type);
        $type = self::normalize_type($type);

        if (!$table) {
            return false;
        }

        if (empty($data['category']) || !self::is_valid_category($type, $data['category'])) {
            return false;
        }

        if (!empty($data['name']) && preg_match('/^other\\b/i', $data['name'])) {
            return false;
        }

        $is_woodshop = !empty($data['is_woodshop']) ? 1 : 0;
        $availability = isset($data['availability_status']) ? sanitize_key($data['availability_status']) : 'available';
        if (!in_array($availability, ['available', 'out_of_stock'], true)) {
            $availability = 'available';
        }
        if (!$is_woodshop) {
            $availability = 'available';
        }

        $result = $wpdb->insert($table, [
            'voucher_type' => $type,
            'category' => sanitize_text_field($data['category']),
            'name' => sanitize_text_field($data['name']),
            'min_price' => floatval($data['min_price']),
            'max_price' => floatval($data['max_price']),
            'is_woodshop' => $is_woodshop,
            'availability_status' => $availability,
            'active' => isset($data['active']) ? intval($data['active']) : 1,
            'sort_order' => isset($data['sort_order']) ? intval($data['sort_order']) : 0,
        ]);

        if ($result === false) {
            return false;
        }

        return $wpdb->insert_id;
    }

    /**
     * Update catalog item
     */
    public static function update_item($type, $id, $data) {
        global $wpdb;
        $table = self::table_for_type($type);
        $type = self::normalize_type($type);

        if (!$table) {
            return false;
        }

        if (isset($data['name']) && preg_match('/^other\\b/i', $data['name'])) {
            return false;
        }

        $update_data = [];

        if (isset($data['category'])) {
            if (!self::is_valid_category($type, $data['category'])) {
                return false;
            }
            $update_data['category'] = sanitize_text_field($data['category']);
        }
        if (isset($data['name'])) {
            $update_data['name'] = sanitize_text_field($data['name']);
        }
        if (isset($data['min_price'])) {
            $update_data['min_price'] = floatval($data['min_price']);
        }
        if (isset($data['max_price'])) {
            $update_data['max_price'] = floatval($data['max_price']);
        }
        if (isset($data['is_woodshop'])) {
            $update_data['is_woodshop'] = intval($data['is_woodshop']) ? 1 : 0;
        }
        if (isset($data['availability_status'])) {
            $availability = sanitize_key($data['availability_status']);
            if (!in_array($availability, ['available', 'out_of_stock'], true)) {
                $availability = 'available';
            }
            $update_data['availability_status'] = $availability;
        }
        if (isset($data['active'])) {
            $update_data['active'] = intval($data['active']);
        }
        if (isset($data['sort_order'])) {
            $update_data['sort_order'] = intval($data['sort_order']);
        }

        if (empty($update_data)) {
            return false;
        }

        if (array_key_exists('is_woodshop', $update_data) && $update_data['is_woodshop'] === 0) {
            $update_data['availability_status'] = 'available';
        }

        return $wpdb->update($table, $update_data, ['id' => intval($id), 'voucher_type' => $type]);
    }

    /**
     * REST: Get household catalog
     */
    public static function get_household_catalog() {
        return rest_ensure_response(self::get_items('household', true));
    }

    /**
     * REST: Get furniture catalog
     */
    public static function get_furniture_catalog() {
        return rest_ensure_response(self::get_items('furniture', true));
    }
}
