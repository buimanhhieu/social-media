package com.viper.module.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class JavaMailEmailService implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:no-reply@viper-study.local}")
    private String fromAddress;

    @Async
    @Override
    public void sendOtp(String to, String purpose, String otp) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromAddress);
            msg.setTo(to);
            msg.setSubject("Your OTP Code");
            msg.setText("Your " + purpose + " OTP: " + otp + "\nExpires in 5 minutes.");
            mailSender.send(msg);
            log.info("OTP email sent purpose={} to={}", purpose, to);
        } catch (Exception e) {
            log.error("Failed to send OTP email purpose={} to={} reason={}", purpose, to, e.getMessage());
        }
    }
}
