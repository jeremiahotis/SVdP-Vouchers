<?php
/**
 * REST API Error Helper
 *
 * Standardizes error responses for the REST API.
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class SVDP_REST_Errors
{
    /**
     * Return a 401 Unauthorized error
     *
     * @param string $message Custom error message
     * @return WP_Error
     */
    public static function unauthorized($message = 'You do not have permission to perform this action.')
    {
        return new WP_Error(
            'rest_forbidden',
            $message,
            ['status' => 401]
        );
    }

    /**
     * Return a 403 Forbidden error
     *
     * @param string $message Custom error message
     * @return WP_Error
     */
    public static function forbidden($message = 'Access denied.')
    {
        return new WP_Error(
            'rest_forbidden',
            $message,
            ['status' => 403]
        );
    }

    /**
     * Return a 400 Bad Request error
     *
     * @param string $message Custom error message
     * @return WP_Error
     */
    public static function bad_request($message = 'Invalid request parameters.')
    {
        return new WP_Error(
            'rest_invalid_param',
            $message,
            ['status' => 400]
        );
    }

    /**
     * Return a 404 Not Found error
     *
     * @param string $message Custom error message
     * @return WP_Error
     */
    public static function not_found($message = 'Resource not found.')
    {
        return new WP_Error(
            'rest_not_found',
            $message,
            ['status' => 404]
        );
    }
}
