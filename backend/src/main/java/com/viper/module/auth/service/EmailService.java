package com.viper.module.auth.service;

public interface EmailService {
    void sendOtp(String to, String purpose, String otp);
}
