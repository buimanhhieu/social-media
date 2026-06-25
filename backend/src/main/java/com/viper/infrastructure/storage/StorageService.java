package com.viper.infrastructure.storage;

// Interface — module media dùng cái này, không import S3/MinIO SDK trực tiếp
public interface StorageService {
    String upload(String key, byte[] data, String contentType);
    void delete(String key);
    String getPublicUrl(String key);
}
