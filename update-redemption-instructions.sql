-- Update the redemption instructions to remove ID reference and reflect virtual voucher system
-- Run this in your WordPress database (via phpMyAdmin in Local by Flywheel)

UPDATE wp_svdp_settings
SET setting_value = 'Neighbors should visit the store and provide their first name, last name, and date of birth at the counter.'
WHERE setting_key = 'redemption_instructions';
