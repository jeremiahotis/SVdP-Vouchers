<?php

use PHPUnit\Framework\TestCase;

class PermissionCallbacksTest extends TestCase
{
    private $plugin;
    private $created_users = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (!function_exists('is_user_logged_in')) {
            $this->markTestSkipped('WordPress bootstrap not loaded.');
        }

        $GLOBALS['svdp_test_transients'] = [];

        if (!get_role('svdp_cashier')) {
            add_role('svdp_cashier', 'SVdP Cashier', [
                'read' => true,
                'access_cashier_station' => true,
            ]);
        }

        $this->plugin = new SVDP_Vouchers_Plugin();
    }

    protected function tearDown(): void
    {
        foreach ($this->created_users as $user_id) {
            wp_delete_user($user_id);
        }

        $this->created_users = [];
        wp_set_current_user(0);

        parent::tearDown();
    }

    public function test_public_access_allows_anonymous(): void
    {
        wp_set_current_user(0);

        $result = $this->plugin->check_public_access(new WP_REST_Request());

        $this->assertTrue($result === true);
    }

    public function test_cashier_access_blocks_anonymous(): void
    {
        wp_set_current_user(0);

        $result = $this->plugin->check_cashier_access(new WP_REST_Request());

        $this->assertTrue(is_wp_error($result));
        $this->assertSame(403, $result->get_error_data()['status']);
    }

    public function test_cashier_access_allows_cashier_role(): void
    {
        $user_id = $this->create_user_with_role('svdp_cashier');
        wp_set_current_user($user_id);

        $result = $this->plugin->check_cashier_access(new WP_REST_Request());

        $this->assertTrue($result === true);
    }

    public function test_public_access_rate_limit_blocks_after_threshold(): void
    {
        wp_set_current_user(0);
        $_SERVER['REMOTE_ADDR'] = '192.0.2.10';
        $_SERVER['HTTP_USER_AGENT'] = 'PHPUnit';

        for ($i = 0; $i < 20; $i++) {
            $result = $this->plugin->check_public_access(new WP_REST_Request());
            $this->assertTrue($result === true);
        }

        $result = $this->plugin->check_public_access(new WP_REST_Request());
        $this->assertTrue(is_wp_error($result));
        $this->assertSame(429, $result->get_error_data()['status']);
    }

    public function test_rest_authentication_allows_anonymous_for_public_routes(): void
    {
        $GLOBALS['svdp_test_auth_cookie'] = false;
        $GLOBALS['wp'] = (object) [
            'query_vars' => [
                'rest_route' => '/svdp/v1/vouchers/check-duplicate',
            ],
        ];

        $_SERVER['HTTP_X_WP_NONCE'] = 'bad-nonce';
        $_REQUEST['_wpnonce'] = 'bad-nonce';

        $result = $this->plugin->handle_rest_authentication(null);

        $this->assertNull($result);
        $this->assertArrayNotHasKey('HTTP_X_WP_NONCE', $_SERVER);
        $this->assertArrayNotHasKey('_wpnonce', $_REQUEST);
    }

    public function test_rest_authentication_requires_nonce_for_protected_routes(): void
    {
        $GLOBALS['svdp_test_auth_cookie'] = 42;
        $GLOBALS['wp'] = (object) [
            'query_vars' => [
                'rest_route' => '/svdp/v1/vouchers/123/status',
            ],
        ];

        $_SERVER['HTTP_X_WP_NONCE'] = 'bad-nonce';
        $_REQUEST['_wpnonce'] = 'bad-nonce';

        $result = $this->plugin->handle_rest_authentication(null);

        $this->assertNull($result);
        $this->assertArrayHasKey('HTTP_X_WP_NONCE', $_SERVER);
        $this->assertArrayHasKey('_wpnonce', $_REQUEST);

        unset($_SERVER['HTTP_X_WP_NONCE'], $_REQUEST['_wpnonce'], $GLOBALS['svdp_test_auth_cookie']);
    }

    private function create_user_with_role(string $role): int
    {
        $username = 'test_' . $role . '_' . wp_generate_password(8, false);
        $email = $username . '@example.test';
        $user_id = wp_create_user($username, 'password', $email);

        $user = new WP_User($user_id);
        $user->set_role($role);

        $this->created_users[] = $user_id;

        return $user_id;
    }
}
