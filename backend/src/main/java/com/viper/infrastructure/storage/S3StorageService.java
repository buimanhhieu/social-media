package com.viper.infrastructure.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Slf4j
@Service
public class S3StorageService implements StorageService {

    private final S3Client s3;
    private final String bucket;
    private final String region;
    private final String cdnUrl;

    public S3StorageService(
            S3Client s3,
            @Value("${app.storage.bucket}") String bucket,
            @Value("${app.storage.region}") String region,
            @Value("${app.storage.cdn-url:}") String cdnUrl) {
        this.s3 = s3;
        this.bucket = bucket;
        this.region = region;
        this.cdnUrl = cdnUrl;
    }

    @Override
    public String upload(String key, byte[] data, String contentType) {
        s3.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(contentType)
                        .build(),
                RequestBody.fromBytes(data));
        log.debug("Uploaded s3://{}/{} ({} bytes)", bucket, key, data.length);
        return getPublicUrl(key);
    }

    @Override
    public void delete(String key) {
        s3.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
    }

    @Override
    public String getPublicUrl(String key) {
        if (StringUtils.hasText(cdnUrl)) {
            return trimSlash(cdnUrl) + "/" + key;
        }
        return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
    }

    private static String trimSlash(String s) {
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }
}
