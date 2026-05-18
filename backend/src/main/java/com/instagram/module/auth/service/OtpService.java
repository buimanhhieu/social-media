package com.instagram.module.auth.service;

public interface OtpService {

    /**
     * Generate and store an OTP keyed by purpose+subject. Returns the raw OTP so the caller
     * can hand it to the email sender. Honors the 60-second resend lock and throws
     * {@link com.instagram.module.auth.exception.OtpThrottledException} when locked.
     */
    String generateAndStore(OtpPurpose purpose, String subject);

    /**
     * Verify an OTP. Consumes (deletes) the stored OTP on success.
     * Throws OtpInvalidException / OtpExpiredException / OtpTooManyAttemptsException on failure.
     */
    void verifyAndConsume(OtpPurpose purpose, String subject, String otp);
}
