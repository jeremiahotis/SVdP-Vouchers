<?php

$explicit_root = getenv('WP_ROOT');
$use_wp_bootstrap = getenv('SVDP_USE_WP_BOOTSTRAP') === '1';

if ($use_wp_bootstrap) {
    if (!empty($explicit_root)) {
        $wp_load = rtrim($explicit_root, '/\\') . '/wp-load.php';
    } else {
        $wp_load = dirname(__DIR__, 4) . '/wp-load.php';
    }

    if (!file_exists($wp_load)) {
        fwrite(STDERR, "WP bootstrap not found. Set WP_ROOT to WordPress root.\n");
        exit(1);
    }

    require_once $wp_load;
} else {
    if (!defined('ABSPATH')) {
        define('ABSPATH', dirname(__DIR__) . '/');
    }

    $GLOBALS['svdp_test_users'] = [];
    $GLOBALS['svdp_test_current_user'] = 0;
    $GLOBALS['svdp_test_roles'] = [];
    $GLOBALS['svdp_test_transients'] = [];

    if (!defined('MINUTE_IN_SECONDS')) {
        define('MINUTE_IN_SECONDS', 60);
    }
    if (!defined('DAY_IN_SECONDS')) {
        define('DAY_IN_SECONDS', 86400);
    }

    if (!function_exists('plugin_dir_path')) {
        function plugin_dir_path($file)
        {
            return rtrim(dirname($file), '/\\') . '/';
        }
    }

    if (!function_exists('plugin_dir_url')) {
        function plugin_dir_url($file)
        {
            return 'http://example.test/wp-content/plugins/SVdP-Vouchers/';
        }
    }

    if (!function_exists('add_action')) {
        function add_action($hook, $callback, $priority = 10, $accepted_args = 1)
        {
            return true;
        }
    }

    if (!function_exists('add_filter')) {
        function add_filter($hook, $callback, $priority = 10, $accepted_args = 1)
        {
            return true;
        }
    }

    if (!function_exists('register_activation_hook')) {
        function register_activation_hook($file, $callback)
        {
            return true;
        }
    }

    if (!function_exists('register_deactivation_hook')) {
        function register_deactivation_hook($file, $callback)
        {
            return true;
        }
    }

    if (!function_exists('flush_rewrite_rules')) {
        function flush_rewrite_rules()
        {
            return true;
        }
    }

    if (!function_exists('is_admin')) {
        function is_admin()
        {
            return false;
        }
    }

    if (!function_exists('add_role')) {
        function add_role($role, $label, $caps = [])
        {
            $GLOBALS['svdp_test_roles'][$role] = $caps;
            return true;
        }
    }

    if (!function_exists('get_role')) {
        function get_role($role)
        {
            return $GLOBALS['svdp_test_roles'][$role] ?? null;
        }
    }

    if (!function_exists('wp_generate_password')) {
        function wp_generate_password($length = 12, $special_chars = true)
        {
            return str_repeat('a', $length);
        }
    }

    if (!function_exists('get_transient')) {
        function get_transient($key)
        {
            return $GLOBALS['svdp_test_transients'][$key]['value'] ?? false;
        }
    }

    if (!function_exists('set_transient')) {
        function set_transient($key, $value, $expiration = 0)
        {
            $GLOBALS['svdp_test_transients'][$key] = [
                'value' => $value,
                'expiration' => $expiration,
            ];
            return true;
        }
    }

    if (!function_exists('delete_transient')) {
        function delete_transient($key)
        {
            unset($GLOBALS['svdp_test_transients'][$key]);
            return true;
        }
    }

    if (!function_exists('wp_create_user')) {
        function wp_create_user($username, $password, $email)
        {
            $id = count($GLOBALS['svdp_test_users']) + 1;
            $GLOBALS['svdp_test_users'][$id] = [
                'ID' => $id,
                'user_login' => $username,
                'user_email' => $email,
                'roles' => [],
            ];
            return $id;
        }
    }

    if (!function_exists('wp_delete_user')) {
        function wp_delete_user($user_id)
        {
            unset($GLOBALS['svdp_test_users'][$user_id]);
            if ($GLOBALS['svdp_test_current_user'] === $user_id) {
                $GLOBALS['svdp_test_current_user'] = 0;
            }
            return true;
        }
    }

    if (!function_exists('wp_set_current_user')) {
        function wp_set_current_user($user_id)
        {
            $GLOBALS['svdp_test_current_user'] = (int) $user_id;
            return true;
        }
    }

    if (!function_exists('wp_validate_auth_cookie')) {
        function wp_validate_auth_cookie($cookie = '', $scheme = 'logged_in')
        {
            return $GLOBALS['svdp_test_auth_cookie'] ?? false;
        }
    }

    if (!function_exists('wp_get_current_user')) {
        function wp_get_current_user()
        {
            $id = (int) $GLOBALS['svdp_test_current_user'];
            return new WP_User($id);
        }
    }

    if (!function_exists('is_user_logged_in')) {
        function is_user_logged_in()
        {
            return (int) $GLOBALS['svdp_test_current_user'] > 0;
        }
    }

    if (!function_exists('current_user_can')) {
        function current_user_can($cap)
        {
            $user = wp_get_current_user();
            return !empty($user->allcaps[$cap]);
        }
    }

    if (!class_exists('WP_User')) {
        class WP_User
        {
            public $ID = 0;
            public $roles = [];
            public $allcaps = [];

            public function __construct($user_id)
            {
                $user = $GLOBALS['svdp_test_users'][$user_id] ?? null;
                if ($user) {
                    $this->ID = $user['ID'];
                    $this->roles = $user['roles'];
                    foreach ($this->roles as $role) {
                        $caps = $GLOBALS['svdp_test_roles'][$role] ?? [];
                        $this->allcaps = array_merge($this->allcaps, $caps);
                    }
                }
            }

            public function set_role($role)
            {
                if ($this->ID <= 0) {
                    return;
                }
                $this->roles = [$role];
                $GLOBALS['svdp_test_users'][$this->ID]['roles'] = $this->roles;
                $this->allcaps = $GLOBALS['svdp_test_roles'][$role] ?? [];
            }
        }
    }

    if (!class_exists('WP_Error')) {
        class WP_Error
        {
            private $code;
            private $message;
            private $data;

            public function __construct($code, $message = '', $data = [])
            {
                $this->code = $code;
                $this->message = $message;
                $this->data = $data;
            }

            public function get_error_data()
            {
                return $this->data;
            }
        }
    }

    if (!function_exists('is_wp_error')) {
        function is_wp_error($thing)
        {
            return $thing instanceof WP_Error;
        }
    }

    if (!class_exists('WP_REST_Request')) {
        class WP_REST_Request
        {
        }
    }
}

require_once dirname(__DIR__) . '/svdp-vouchers.php';
