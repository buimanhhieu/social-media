package com.viper.module.media.service;

import com.viper.core.exception.BusinessException;
import com.viper.infrastructure.storage.StorageService;
import com.viper.module.media.dto.response.MediaResponse;
import com.viper.module.media.entity.MediaContext;
import com.viper.module.media.entity.MediaFile;
import com.viper.module.media.entity.MediaType;
import com.viper.module.media.exception.InvalidMediaTypeException;
import com.viper.module.media.repository.MediaFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MediaService {

    private final StorageService storageService;
    private final MediaFileRepository mediaFileRepository;

    @Value("${app.storage.image-max-dimension:1080}")
    private int maxDimension;

    @Value("${app.storage.thumbnail-dimension:320}")
    private int thumbnailDimension;

    @Transactional
    public MediaResponse uploadImage(Long ownerId, MediaContext context, MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new InvalidMediaTypeException(contentType);
        }
        try {
            BufferedImage source = ImageIO.read(file.getInputStream());
            if (source == null) {
                throw new InvalidMediaTypeException(contentType);
            }

            byte[] main = scaleToJpeg(source, maxDimension);
            byte[] thumb = scaleToJpeg(source, thumbnailDimension);
            int[] dim = jpegDimensions(main);

            String uuid = UUID.randomUUID().toString();
            String folder = "images/" + context.path() + "/" + ownerId;
            String mainKey = folder + "/" + uuid + ".jpg";
            String thumbKey = "images/" + context.path() + "/thumbnails/" + ownerId + "/" + uuid + "_thumb.jpg";

            String mainUrl = storageService.upload(mainKey, main, "image/jpeg");
            String thumbUrl = storageService.upload(thumbKey, thumb, "image/jpeg");

            MediaFile saved = mediaFileRepository.save(MediaFile.builder()
                    .ownerId(ownerId)
                    .mediaType(MediaType.IMAGE)
                    .context(context)
                    .s3Key(mainKey)
                    .publicUrl(mainUrl)
                    .thumbnailUrl(thumbUrl)
                    .fileSizeBytes((long) main.length)
                    .mimeType("image/jpeg")
                    .widthPx(dim[0])
                    .heightPx(dim[1])
                    .build());

            log.info("Uploaded media id={} owner={} context={}", saved.getId(), ownerId, context);
            return MediaResponse.from(saved);
        } catch (IOException e) {
            throw new BusinessException("Failed to process image", HttpStatus.UNPROCESSABLE_ENTITY, "MEDIA_PROCESSING_FAILED");
        }
    }

    /** Re-encode as JPEG, shrinking so the longest side fits {@code maxSide} (never upscales). */
    private byte[] scaleToJpeg(BufferedImage source, int maxSide) throws IOException {
        double scale = Math.min(1.0, (double) maxSide / Math.max(source.getWidth(), source.getHeight()));
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Thumbnails.of(source)
                .scale(scale)
                .outputFormat("jpg")
                .outputQuality(0.85)
                .toOutputStream(out);
        return out.toByteArray();
    }

    private int[] jpegDimensions(byte[] jpeg) throws IOException {
        BufferedImage img = ImageIO.read(new ByteArrayInputStream(jpeg));
        return new int[]{img.getWidth(), img.getHeight()};
    }
}
