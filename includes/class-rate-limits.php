<?php
/**
 * Rate limiting utilities.
 */

if (!defined('ABSPATH')) {
    exit;
}

class SVDP_Rate_Limits
{
    const BURST_LIMIT = 20;
    const DAILY_LIMIT = 100;

    public static function check_public_rate_limit()
    {
        $ip = self::get_client_ip();
        $user_agent = self::get_user_agent();
        $key_suffix = self::get_key_suffix($ip, $user_agent);

        $burst_key = 'svdp_rl_burst_' . $key_suffix;
        $daily_key = 'svdp_rl_daily_' . $key_suffix;

        $burst_count = (int) get_transient($burst_key);
        $daily_count = (int) get_transient($daily_key);

        if ($burst_count >= self::BURST_LIMIT || $daily_count >= self::DAILY_LIMIT) {
            return SVDP_REST_Errors::too_many_requests('Too many requests.');
        }

        set_transient($burst_key, $burst_count + 1, 5 * MINUTE_IN_SECONDS);
        set_transient($daily_key, $daily_count + 1, DAY_IN_SECONDS);

        return true;
    }

    private static function get_client_ip()
    {
        if (function_exists('rest_get_ip_address')) {
            return (string) rest_get_ip_address();
        }

        return isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : 'unknown';
    }

    private static function get_user_agent()
    {
        return isset($_SERVER['HTTP_USER_AGENT']) ? (string) $_SERVER['HTTP_USER_AGENT'] : '';
    }

    private static function get_key_suffix($ip, $user_agent)
    {
        $key_source = $ip;
        if (!empty($user_agent)) {
            $key_source .= '|' . $user_agent;
        }

        return md5($key_source);
    }
}
