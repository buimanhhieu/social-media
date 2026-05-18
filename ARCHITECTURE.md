# Tài liệu kiến trúc: Instagram Clone — Modular Monolith

> **Stack:** Spring Boot · ReactJS · PostgreSQL  
> **Phong cách kiến trúc:** Modular Monolith

---

## Mục lục

1. [Modular Monolith là gì?](#1-modular-monolith-là-gì)
   - 1.1 Định nghĩa
   - 1.2 So sánh ba kiến trúc phổ biến
   - 1.3 Tại sao chọn Modular Monolith cho dự án này?
   - 1.4 Nguyên tắc cốt lõi
   - 1.5 Vòng đời một request
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
   - 2.1 Toàn bộ project
   - 2.2 Cấu trúc bên trong một module
   - 2.3 Vai trò từng layer (controller / service / repository / entity / dto / event / exception)
   - 2.4 Danh sách tất cả module
   - 2.5 Module `media` — chi tiết lưu trữ ảnh & video lên S3
3. [Giao tiếp giữa các module](#3-giao-tiếp-giữa-các-module)
   - 3.1 Cơ chế 1 — Spring ApplicationEvent (Pub/Sub)
   - 3.2 Cơ chế 2 — Public Interface (Internal API)
   - 3.3 Quy tắc dependency giữa các module
   - 3.4 Đồng bộ vs Bất đồng bộ
4. [Database Strategy](#4-database-strategy)
   - 4.1 Một PostgreSQL, nhiều Schema
   - 4.2 Cấu hình JPA theo schema
   - 4.3 Schema SQL đầy đủ từng module
   - 4.4 Transaction Boundary
   - 4.5 Migration với Liquibase
5. [Quy tắc & Best Practices](#5-quy-tắc--best-practices)
   - 5.1 Năm quy tắc cứng không được vi phạm
   - 5.2 Tín hiệu nhận biết module đang bị vi phạm
   - 5.3 Chiến lược testing theo từng tầng
   - 5.4 Checklist trước khi code mỗi module mới
   - 5.5 Cấu trúc thư mục hoàn chỉnh

---

## 1. Modular Monolith là gì?

### 1.1 Định nghĩa

**Modular Monolith** là một ứng dụng chạy trong **một process duy nhất** (một file JAR, một JVM), nhưng bên trong được tổ chức thành các **module độc lập**, mỗi module có ranh giới rõ ràng và chỉ giao tiếp với nhau theo cách được kiểm soát.

Nói đơn giản: _một va li, nhưng có ngăn kéo — không phải đồ bỏ lộn xộn vào một đống._

### 1.2 So sánh ba kiến trúc phổ biến

| Tiêu chí | Monolith thường | **Modular Monolith** | Microservices |
|---|---|---|---|
| Số process khi chạy | 1 | **1** | Nhiều (mỗi service 1 process) |
| Cấu trúc code | Lộn xộn, không ranh giới | **Module rõ ràng** | Service hoàn toàn tách biệt |
| Giao tiếp nội bộ | Gọi thẳng, không kiểm soát | **Spring Events / internal API** | HTTP / gRPC / Message Queue |
| Độ phức tạp khi bắt đầu | Thấp | **Thấp - Trung bình** | Cao |
| Khả năng maintain | Kém (code rối theo thời gian) | **Tốt** | Tốt nhưng tốn chi phí vận hành |
| Deploy | 1 lần | **1 lần** | Phức tạp (K8s, CI/CD từng service) |
| Scale | Scale cả ứng dụng | **Scale cả ứng dụng** | Scale từng service độc lập |
| Phù hợp với | Prototype, MVP nhỏ | **Team nhỏ - vừa, dự án dài hạn** | Team lớn, traffic cực cao |

### 1.3 Tại sao chọn Modular Monolith cho dự án này?

Dự án Instagram Clone ở giai đoạn đầu phù hợp với Modular Monolith vì:

- **Team nhỏ** — không cần overhead của microservices (DevOps, service discovery, distributed tracing).
- **Deploy đơn giản** — chỉ cần build 1 file JAR, chạy trên 1 server hoặc 1 Docker container.
- **Dễ refactor** — khi cần scale một tính năng cụ thể trong tương lai, module đã có ranh giới sẵn, tách ra thành microservice dễ dàng hơn.
- **Transaction đơn giản** — các thao tác liên quan đến nhiều module (ví dụ: tạo post + gửi notification) có thể dùng chung 1 database transaction mà không cần saga pattern phức tạp.
- **Debug dễ** — tất cả log nằm trong 1 process, stack trace rõ ràng.

### 1.4 Nguyên tắc cốt lõi của Modular Monolith

Có **3 nguyên tắc** bắt buộc phải tuân thủ:

**Nguyên tắc 1 — Ranh giới module (Module Boundary)**  
Mỗi module là một "hộp đen" từ bên ngoài nhìn vào. Các module khác chỉ được tương tác thông qua _public API_ của module đó (interface, event), không được gọi thẳng vào `repository` hay `entity` bên trong.

```
# Đúng
postModule.getPostById(id)         ← gọi qua public service interface

# Sai
postRepository.findById(id)        ← module khác truy cập trực tiếp vào repo của post
```

**Nguyên tắc 2 — Dependency một chiều (Unidirectional Dependency)**  
Sự phụ thuộc giữa các module phải đi một chiều, không được có vòng tròn (circular dependency).

```
# Đúng
notification → post (notification biết về post event)
post → user  (post biết về user để lấy thông tin tác giả)

# Sai
post → notification VÀ notification → post  ← vòng tròn, cấm!
```

**Nguyên tắc 3 — Giao tiếp qua sự kiện (Event-driven communication)**  
Khi module A cần thông báo điều gì đó cho module B, A _phát ra một sự kiện_ (`ApplicationEvent`), B _lắng nghe_ sự kiện đó. A không cần biết B tồn tại.

```java
// Module post phát sự kiện — không biết ai sẽ lắng nghe
eventPublisher.publishEvent(new PostCreatedEvent(post));

// Module notification lắng nghe — không cần post biết đến mình
@EventListener
public void onPostCreated(PostCreatedEvent event) { ... }
```

### 1.5 Vòng đời một request trong Modular Monolith

Khi người dùng tạo một bài post mới, luồng xử lý như sau:

```
Client (ReactJS)
    │  POST /api/posts
    ▼
PostController          ← nhận request, validate
    │
    ▼
PostService             ← xử lý business logic, lưu DB
    │
    ├─ lưu Post vào database
    │
    └─ publishEvent(PostCreatedEvent)
              │
              ├──▶ NotificationListener  → tạo notification cho followers
              └──▶ SearchIndexListener   → index bài post vào Elasticsearch
```

Toàn bộ luồng trên xảy ra **trong cùng một JVM process**, **cùng một thread** (hoặc async tùy config), không có HTTP call nào giữa các module.

---

_Tiếp theo: [Cấu trúc thư mục →](#2-cấu-trúc-thư-mục)_

---

## 2. Cấu trúc thư mục

### 2.1 Toàn bộ project

```
backend/
└── src/main/java/com/instagram/
    │
    ├── core/                         ← dùng chung, không phụ thuộc vào module nào
    │   ├── entity/
    │   │   └── BaseEntity.java       ← id, createdAt, updatedAt dùng chung
    │   ├── security/
    │   │   ├── JwtFilter.java
    │   │   ├── JwtUtil.java
    │   │   └── SecurityConfig.java
    │   ├── exception/
    │   │   └── GlobalExceptionHandler.java
    │   └── utils/
    │       └── PageResponse.java     ← wrapper pagination dùng chung
    │
    ├── module/                       ← mỗi tính năng là một module
    │   ├── auth/
    │   ├── user/
    │   ├── post/
    │   ├── story/
    │   ├── chat/
    │   ├── notification/
    │   ├── media/
    │   └── search/
    │
    └── infrastructure/               ← cấu hình kết nối dịch vụ bên ngoài
        ├── config/
        │   ├── RedisConfig.java
        │   ├── S3Config.java
        │   └── SwaggerConfig.java
        └── storage/
            └── S3StorageService.java
```

> **Quy tắc phụ thuộc (Dependency Rule):**
> - `module` có thể dùng `core`
> - `infrastructure` có thể dùng `core`
> - `module` **không được** import class từ `infrastructure` trực tiếp — dùng interface trong `core`
> - `module` này **không được** import `entity` hoặc `repository` của module khác

---

### 2.2 Cấu trúc bên trong một module

Lấy module `post` làm ví dụ mẫu — tất cả các module còn lại đều theo cùng cấu trúc này:

```
module/post/
├── controller/
│   └── PostController.java
├── service/
│   └── PostService.java
├── repository/
│   └── PostRepository.java
├── entity/
│   ├── Post.java
│   ├── Like.java
│   └── Comment.java
├── dto/
│   ├── request/
│   │   ├── CreatePostRequest.java
│   │   └── UpdatePostRequest.java
│   └── response/
│       ├── PostResponse.java
│       └── PostSummaryResponse.java
├── event/
│   └── PostCreatedEvent.java
└── exception/
    ├── PostNotFoundException.java
    └── PostAccessDeniedException.java
```

---

### 2.3 Vai trò từng layer — giải thích chi tiết

#### `controller/` — cửa vào của module

Nhận HTTP request, validate đầu vào cơ bản, gọi service, trả response. **Không chứa logic nghiệp vụ.**

```java
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public ResponseEntity<PostResponse> createPost(
            @Valid @RequestBody CreatePostRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        PostResponse response = postService.createPost(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPost(@PathVariable Long id) {
        return ResponseEntity.ok(postService.getPostById(id));
    }
}
```

> Câu hỏi để tự kiểm tra: _"Controller này có chứa if/else nào liên quan đến nghiệp vụ không?"_ — Nếu có, hãy chuyển xuống service.

---

#### `service/` — trung tâm xử lý nghiệp vụ

Toàn bộ business logic nằm ở đây. Service được phép gọi repository, gọi các service khác trong cùng module, và phát event.

```java
@Service
@RequiredArgsConstructor
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final UserService userService;             // gọi module user qua interface
    private final ApplicationEventPublisher publisher;

    public PostResponse createPost(CreatePostRequest request, String username) {
        // 1. Lấy thông tin user
        UserSummary author = userService.getUserSummaryByUsername(username);

        // 2. Tạo và lưu post
        Post post = Post.builder()
                .caption(request.getCaption())
                .authorId(author.getId())
                .build();
        post = postRepository.save(post);

        // 3. Thông báo cho các module khác (notification, search...)
        publisher.publishEvent(new PostCreatedEvent(this, post, author));

        // 4. Trả về DTO — không trả entity
        return PostResponse.from(post, author);
    }

    @Transactional(readOnly = true)
    public PostResponse getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new PostNotFoundException(id));
        UserSummary author = userService.getUserSummaryById(post.getAuthorId());
        return PostResponse.from(post, author);
    }
}
```

---

#### `repository/` — giao tiếp với database

Kế thừa `JpaRepository`, thêm các query tùy chỉnh nếu cần. Không chứa logic.

```java
public interface PostRepository extends JpaRepository<Post, Long> {

    // Spring Data tự tạo SQL từ tên method
    List<Post> findByAuthorIdOrderByCreatedAtDesc(Long authorId);

    // Dùng JPQL cho query phức tạp hơn
    @Query("SELECT p FROM Post p WHERE p.authorId IN :authorIds ORDER BY p.createdAt DESC")
    Page<Post> findFeedPosts(@Param("authorIds") List<Long> authorIds, Pageable pageable);
}
```

---

#### `entity/` — ánh xạ bảng database

Chỉ mô tả cấu trúc dữ liệu. **Không bao giờ trả entity ra ngoài module** — phải chuyển sang DTO trước.

```java
@Entity
@Table(name = "posts")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Post extends BaseEntity {   // BaseEntity chứa id, createdAt, updatedAt

    @Column(columnDefinition = "TEXT")
    private String caption;

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostType type = PostType.IMAGE;   // IMAGE | VIDEO | REEL

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Like> likes = new ArrayList<>();
}
```

---

#### `dto/` — dữ liệu trao đổi với bên ngoài

DTO đi vào (`request`) và đi ra (`response`) luôn tách biệt nhau.

```java
// Request: dữ liệu client gửi lên
public record CreatePostRequest(
        @NotBlank String caption,
        @NotNull PostType type,
        @NotEmpty List<String> mediaUrls
) {}

// Response: dữ liệu trả về client — không lộ thông tin nhạy cảm
public record PostResponse(
        Long id,
        String caption,
        UserSummaryResponse author,
        int likeCount,
        int commentCount,
        LocalDateTime createdAt
) {
    // Factory method — entity → DTO xảy ra ở đây, không ở nơi khác
    public static PostResponse from(Post post, UserSummary author) {
        return new PostResponse(
                post.getId(),
                post.getCaption(),
                UserSummaryResponse.from(author),
                post.getLikes().size(),
                0,
                post.getCreatedAt()
        );
    }
}
```

---

#### `event/` — thông báo cho module khác

Event là một plain object mang dữ liệu. Module phát event không cần biết ai lắng nghe.

```java
@Getter
public class PostCreatedEvent extends ApplicationEvent {

    private final Post post;
    private final UserSummary author;

    public PostCreatedEvent(Object source, Post post, UserSummary author) {
        super(source);
        this.post = post;
        this.author = author;
    }
}
```

---

#### `exception/` — lỗi nghiệp vụ riêng của module

Mỗi module tự định nghĩa lỗi của mình. `GlobalExceptionHandler` trong `core` sẽ bắt và format lại.

```java
public class PostNotFoundException extends RuntimeException {
    public PostNotFoundException(Long id) {
        super("Post not found with id: " + id);
    }
}
```

---

### 2.4 Danh sách đầy đủ tất cả module

| Module | Entities chính | Chức năng |
|---|---|---|
| `auth` | — | Đăng ký, đăng nhập, refresh token, OAuth2 |
| `user` | `User`, `Follow` | Profile, follow/unfollow, gợi ý theo dõi |
| `post` | `Post`, `Like`, `Comment` | Đăng bài, feed, like, comment, hashtag |
| `story` | `Story`, `StoryView` | Story 24h, viewer list, highlight |
| `chat` | `Conversation`, `Message` | Direct message, group chat, seen status |
| `notification` | `Notification` | Tạo và đọc thông báo in-app |
| `media` | — | Upload, resize ảnh, upload video |
| `search` | — | Tìm kiếm user và hashtag |

---

_Tiếp theo: [Giao tiếp giữa các module →](#3-giao-tiếp-giữa-các-module)_

---

### 2.5 Module `media` — chi tiết lưu trữ file

Toàn bộ ảnh và video đều được lưu trên **S3** (hoặc MinIO khi chạy local). Backend không lưu file trực tiếp trên ổ đĩa.

#### Cấu trúc thư mục module media

```
module/media/
├── controller/
│   └── MediaController.java
├── service/
│   └── MediaService.java
├── repository/
│   └── MediaFileRepository.java
├── entity/
│   └── MediaFile.java
├── dto/
│   ├── request/
│   │   └── UploadMediaRequest.java
│   └── response/
│       └── MediaResponse.java
└── exception/
    ├── MediaNotFoundException.java
    └── InvalidMediaTypeException.java
```

#### Tổ chức thư mục trên S3

```
s3-bucket/
├── images/
│   ├── posts/
│   │   └── {userId}/{postId}/{uuid}.jpg       ← ảnh bài đăng (gốc, resize tối đa 1080px)
│   ├── posts/thumbnails/
│   │   └── {userId}/{postId}/{uuid}_thumb.jpg  ← thumbnail 320px, tự động tạo khi upload
│   ├── stories/
│   │   └── {userId}/{storyId}/{uuid}.jpg
│   ├── avatars/
│   │   └── {userId}/{uuid}.jpg
│   └── messages/
│       └── {conversationId}/{uuid}.jpg
└── videos/
    ├── posts/
    │   └── {userId}/{postId}/{uuid}.mp4
    └── stories/
        └── {userId}/{storyId}/{uuid}.mp4
```

#### Entity `MediaFile`

```java
@Entity
@Table(name = "media_files")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaFile extends BaseEntity {

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MediaType mediaType;          // IMAGE | VIDEO

    @Enumerated(EnumType.STRING)
    @Column(name = "media_context")
    private MediaContext context;         // POST | STORY | AVATAR | MESSAGE

    @Column(name = "s3_key", nullable = false)
    private String s3Key;                 // key đầy đủ trong S3, vd: images/posts/42/1/{uuid}.jpg

    @Column(name = "public_url", nullable = false)
    private String publicUrl;             // URL CDN trả về cho client

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;          // có với cả ảnh lẫn video

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "mime_type")
    private String mimeType;              // image/jpeg | image/png | video/mp4

    @Column(name = "width_px")
    private Integer widthPx;

    @Column(name = "height_px")
    private Integer heightPx;
}
```

#### Flow upload ảnh

```
Client
  │  POST /api/media/upload  (multipart/form-data, field: file, context)
  ▼
MediaController
  │
  ▼
MediaService
  ├─ 1. Validate: định dạng (jpg, png, webp), kích thước tối đa 10MB
  ├─ 2. Resize ảnh gốc về tối đa 1080px (Thumbnailator)
  ├─ 3. Tạo thumbnail 320px
  ├─ 4. Upload ảnh đã resize lên S3  → nhận s3Key + publicUrl
  ├─ 5. Upload thumbnail lên S3      → nhận thumbnailUrl
  ├─ 6. Lưu MediaFile vào PostgreSQL
  └─ 7. Trả về MediaResponse { id, publicUrl, thumbnailUrl }
```

#### Flow upload video

```
Client
  │  POST /api/media/upload  (multipart/form-data, field: file, context)
  ▼
MediaController
  │
  ▼
MediaService
  ├─ 1. Validate: định dạng (mp4, mov), kích thước tối đa 100MB
  ├─ 2. Upload video gốc thẳng lên S3 (không xử lý server-side)
  ├─ 3. Trích frame đầu làm thumbnail nếu FFmpeg có sẵn
  ├─ 4. Upload thumbnail lên S3
  ├─ 5. Lưu MediaFile vào PostgreSQL
  └─ 6. Trả về MediaResponse { id, publicUrl, thumbnailUrl }
```

> **Lưu ý:** Transcoding video (đổi độ phân giải, format) là tác vụ nặng — xử lý bất đồng bộ qua `@Async` hoặc queue nếu cần. MVP thì upload thẳng video gốc lên S3 là đủ.

#### `MediaService` — phần cốt lõi

```java
@Service
@RequiredArgsConstructor
public class MediaService {

    private final S3StorageService s3Service;
    private final MediaFileRepository mediaRepo;
    private final ImageResizeService resizeService;

    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024L;   // 10MB
    private static final long MAX_VIDEO_SIZE = 100 * 1024 * 1024L;  // 100MB

    private static final Set<String> ALLOWED_IMAGE_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp");
    private static final Set<String> ALLOWED_VIDEO_TYPES =
            Set.of("video/mp4", "video/quicktime");

    public MediaResponse uploadMedia(MultipartFile file, Long ownerId, MediaContext context) {
        String mimeType = file.getContentType();

        if (ALLOWED_IMAGE_TYPES.contains(mimeType)) {
            return uploadImage(file, ownerId, context);
        } else if (ALLOWED_VIDEO_TYPES.contains(mimeType)) {
            return uploadVideo(file, ownerId, context);
        }
        throw new InvalidMediaTypeException(mimeType);
    }

    private MediaResponse uploadImage(MultipartFile file, Long ownerId, MediaContext context) {
        if (file.getSize() > MAX_IMAGE_SIZE) throw new FileTooLargeException("Ảnh tối đa 10MB");

        byte[] resized   = resizeService.resizeToMaxWidth(file.getBytes(), 1080);
        byte[] thumbnail = resizeService.resizeToMaxWidth(file.getBytes(), 320);

        String folder  = "images/" + context.name().toLowerCase() + "/" + ownerId;
        String uuid    = UUID.randomUUID().toString();
        String s3Key   = folder + "/" + uuid + ".jpg";
        String thumbKey = folder + "/thumbnails/" + uuid + "_thumb.jpg";

        String publicUrl    = s3Service.upload(s3Key,   resized,   "image/jpeg");
        String thumbnailUrl = s3Service.upload(thumbKey, thumbnail, "image/jpeg");

        MediaFile media = MediaFile.builder()
                .ownerId(ownerId).mediaType(MediaType.IMAGE).context(context)
                .s3Key(s3Key).publicUrl(publicUrl).thumbnailUrl(thumbnailUrl)
                .fileSizeBytes((long) resized.length).mimeType("image/jpeg")
                .build();

        return MediaResponse.from(mediaRepo.save(media));
    }

    private MediaResponse uploadVideo(MultipartFile file, Long ownerId, MediaContext context) {
        if (file.getSize() > MAX_VIDEO_SIZE) throw new FileTooLargeException("Video tối đa 100MB");

        String folder = "videos/" + context.name().toLowerCase() + "/" + ownerId;
        String s3Key  = folder + "/" + UUID.randomUUID() + ".mp4";

        String publicUrl = s3Service.upload(s3Key, file.getBytes(), "video/mp4");

        MediaFile media = MediaFile.builder()
                .ownerId(ownerId).mediaType(MediaType.VIDEO).context(context)
                .s3Key(s3Key).publicUrl(publicUrl)
                .fileSizeBytes(file.getSize()).mimeType("video/mp4")
                .build();

        return MediaResponse.from(mediaRepo.save(media));
    }
}
```

#### Dependencies cần thêm vào `pom.xml`

```xml
<!-- Resize ảnh -->
<dependency>
    <groupId>net.coobird</groupId>
    <artifactId>thumbnailator</artifactId>
    <version>0.4.20</version>
</dependency>

<!-- AWS S3 SDK -->
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>s3</artifactId>
    <version>2.25.0</version>
</dependency>

<!-- MinIO (thay S3 khi dev local) -->
<dependency>
    <groupId>io.minio</groupId>
    <artifactId>minio</artifactId>
    <version>8.5.9</version>
</dependency>
```

#### Cấu hình `application.yml`

```yaml
app:
  storage:
    provider: s3                               # s3 | minio
    bucket: instagram-clone-media
    region: ap-southeast-1
    cdn-url: https://cdn.yourdomain.com        # URL CDN trả về cho client

# Dùng AWS S3 (production)
cloud:
  aws:
    credentials:
      access-key: ${AWS_ACCESS_KEY}
      secret-key: ${AWS_SECRET_KEY}
    region:
      static: ap-southeast-1

# Dùng MinIO (dev local)
minio:
  endpoint: http://localhost:9000
  access-key: minioadmin
  secret-key: minioadmin
```

---

## 3. Giao tiếp giữa các module

Trong Modular Monolith, các module **không được gọi thẳng vào nội tạng của nhau** (repository, entity). Có hai cơ chế giao tiếp hợp lệ tùy theo tình huống:

| Tình huống | Cơ chế | Ví dụ |
|---|---|---|
| Module A cần **thông báo** điều gì đó xảy ra | Spring `ApplicationEvent` | Post tạo xong → thông báo cho Notification, Search |
| Module A cần **lấy dữ liệu** từ module B | Public interface (internal API) | Post cần lấy thông tin tác giả từ User |

---

### 3.1 Cơ chế 1 — Spring ApplicationEvent (Pub/Sub)

Dùng khi: một hành động xảy ra ở module A cần kích hoạt nhiều phản ứng ở các module khác.

#### Bước 1 — Tạo class Event (trong module phát)

Event là một plain object chứa dữ liệu cần chia sẻ. Đặt trong `module/post/event/`.

```java
// module/post/event/PostCreatedEvent.java
@Getter
public class PostCreatedEvent extends ApplicationEvent {

    private final Long postId;
    private final Long authorId;
    private final String authorUsername;

    public PostCreatedEvent(Object source, Long postId, Long authorId, String authorUsername) {
        super(source);
        this.postId          = postId;
        this.authorId        = authorId;
        this.authorUsername  = authorUsername;
    }
}
```

> Chỉ đưa vào event những gì listener cần — không truyền toàn bộ entity `Post` vào event để tránh module khác phụ thuộc vào entity của mình.

---

#### Bước 2 — Phát event trong Service (module post)

```java
// module/post/service/PostService.java
@Service
@RequiredArgsConstructor
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final ApplicationEventPublisher eventPublisher;

    public PostResponse createPost(CreatePostRequest request, Long authorId) {
        Post post = Post.builder()
                .caption(request.getCaption())
                .authorId(authorId)
                .build();
        post = postRepository.save(post);

        // Phát event — PostService không biết ai sẽ lắng nghe
        eventPublisher.publishEvent(
            new PostCreatedEvent(this, post.getId(), authorId, request.getAuthorUsername())
        );

        return PostResponse.from(post);
    }
}
```

---

#### Bước 3 — Lắng nghe event (các module khác)

Mỗi listener là một `@Component` riêng biệt, nằm trong module của chính nó.

```java
// module/notification/event/PostEventListener.java
@Component
@RequiredArgsConstructor
public class PostEventListener {

    private final NotificationService notificationService;
    private final FollowRepository followRepository;

    @EventListener
    @Async   // xử lý bất đồng bộ, không block thread của PostService
    public void onPostCreated(PostCreatedEvent event) {
        // Lấy danh sách follower của tác giả
        List<Long> followerIds = followRepository
                .findFollowerIdsByUserId(event.getAuthorId());

        // Tạo notification cho từng người
        followerIds.forEach(followerId ->
            notificationService.create(
                followerId,
                NotificationType.NEW_POST,
                event.getAuthorUsername() + " vừa đăng bài mới",
                event.getPostId()
            )
        );
    }
}
```

```java
// module/search/event/PostEventListener.java
@Component
@RequiredArgsConstructor
public class PostEventListener {

    private final SearchIndexService searchIndexService;

    @EventListener
    @Async
    public void onPostCreated(PostCreatedEvent event) {
        searchIndexService.indexPost(event.getPostId());
    }
}
```

> `@Async` yêu cầu thêm `@EnableAsync` vào class `@Configuration` bất kỳ. Khi dùng `@Async`, listener chạy trên thread riêng — lỗi trong listener **không** rollback transaction của `PostService`.

---

#### Danh sách tất cả Event trong dự án

| Event | Module phát | Module lắng nghe | Mô tả |
|---|---|---|---|
| `PostCreatedEvent` | `post` | `notification`, `search` | Bài viết mới được tạo |
| `PostLikedEvent` | `post` | `notification` | Ai đó like bài viết |
| `CommentAddedEvent` | `post` | `notification` | Ai đó bình luận |
| `UserFollowedEvent` | `user` | `notification` | Ai đó follow |
| `StoryCreatedEvent` | `story` | `notification` | Story mới |
| `StoryExpiredEvent` | `story` | `media` | Story hết 24h → xóa file S3 |
| `MessageSentEvent` | `chat` | `notification` | Tin nhắn mới trong DM |
| `MediaUploadedEvent` | `media` | `post`, `story` | Upload file hoàn tất |

---

### 3.2 Cơ chế 2 — Public Interface (Internal API)

Dùng khi: module A cần **query dữ liệu** từ module B một cách đồng bộ trong cùng luồng xử lý.

Ví dụ: `PostService` cần lấy thông tin tác giả khi tạo `PostResponse` — phải gọi `UserService`, nhưng không được import `UserRepository` hay `User` entity.

#### Bước 1 — Module B khai báo interface công khai

```java
// module/user/service/UserQueryService.java  ← đây là "public API" của module user
public interface UserQueryService {

    UserSummary getUserSummaryById(Long userId);

    UserSummary getUserSummaryByUsername(String username);

    boolean existsById(Long userId);
}
```

```java
// DTO dùng để trả ra ngoài module — đặt trong module/user/dto/
public record UserSummary(
        Long id,
        String username,
        String displayName,
        String avatarUrl
) {}
```

#### Bước 2 — Module B implement interface

```java
// module/user/service/UserQueryServiceImpl.java
@Service
@RequiredArgsConstructor
public class UserQueryServiceImpl implements UserQueryService {

    private final UserRepository userRepository;

    @Override
    public UserSummary getUserSummaryById(Long userId) {
        return userRepository.findById(userId)
                .map(u -> new UserSummary(u.getId(), u.getUsername(),
                                         u.getDisplayName(), u.getAvatarUrl()))
                .orElseThrow(() -> new UserNotFoundException(userId));
    }

    @Override
    public UserSummary getUserSummaryByUsername(String username) {
        return userRepository.findByUsername(username)
                .map(u -> new UserSummary(u.getId(), u.getUsername(),
                                         u.getDisplayName(), u.getAvatarUrl()))
                .orElseThrow(() -> new UserNotFoundException(username));
    }

    @Override
    public boolean existsById(Long userId) {
        return userRepository.existsById(userId);
    }
}
```

#### Bước 3 — Module A dùng interface, không dùng impl

```java
// module/post/service/PostService.java
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserQueryService userQueryService;    // ← interface, không phải UserQueryServiceImpl
    private final ApplicationEventPublisher eventPublisher;

    public PostResponse createPost(CreatePostRequest request, String username) {
        // Lấy thông tin tác giả qua interface — không đụng vào UserRepository
        UserSummary author = userQueryService.getUserSummaryByUsername(username);

        Post post = Post.builder()
                .caption(request.getCaption())
                .authorId(author.id())
                .build();
        post = postRepository.save(post);

        eventPublisher.publishEvent(
            new PostCreatedEvent(this, post.getId(), author.id(), author.username())
        );

        return PostResponse.from(post, author);
    }
}
```

---

### 3.3 Quy tắc phụ thuộc giữa các module

Biểu đồ dưới đây mô tả chiều phụ thuộc hợp lệ. Mũi tên nghĩa là "được phép dùng".

```
core  ←────────────────────────── tất cả module đều dùng core
  ↑
  │        auth ──→ user
  │        user (không phụ thuộc module nào khác)
  │        post ──→ user,  media
  │        story ──→ user, media
  │        chat ──→ user,  media
  │        notification ──→ user (đọc thông tin người nhận)
  │        search ──→ user, post (đọc để index)
  │        media (không phụ thuộc module nào khác)
```

**Quy tắc cứng — không được vi phạm:**

```
# Cấm tuyệt đối
notification  ──→ post        (vòng tròn: post đã phụ thuộc notification qua event)
post          ──→ notification (post chỉ publish event, không gọi notification service)
user          ──→ post         (user không biết post tồn tại)
media         ──→ post         (media chỉ lưu file, không biết về post)
```

**Cách phát hiện vi phạm:** Nếu bạn thấy mình đang `import com.instagram.module.notification.*` bên trong `module/post/`, đó là dấu hiệu vi phạm — hãy chuyển sang dùng event.

---

### 3.4 Đồng bộ vs Bất đồng bộ

| | `@EventListener` | `@EventListener` + `@Async` |
|---|---|---|
| Chạy trên | Cùng thread với người phát | Thread riêng (thread pool) |
| Transaction | Cùng transaction | Transaction riêng (hoặc không có) |
| Lỗi trong listener | Rollback cả transaction gốc | Không ảnh hưởng transaction gốc |
| Dùng khi | Listener phải thành công cùng với action chính | Listener là side-effect, có thể retry độc lập |
| Ví dụ | Tạo audit log (bắt buộc kèm theo) | Gửi notification, index search |

**Ví dụ dùng đồng bộ** (không `@Async`) — audit log phải ghi cùng transaction:

```java
@EventListener   // không có @Async
public void onPostCreated(PostCreatedEvent event) {
    auditLogRepository.save(new AuditLog(
        "POST_CREATED", event.getAuthorId(), event.getPostId()
    ));
}
```

**Bật `@Async`** trong config:

```java
// infrastructure/config/AsyncConfig.java
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "eventListenerExecutor")
    public Executor eventListenerExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("event-");
        executor.initialize();
        return executor;
    }
}
```

---

## 4. Database Strategy

### 4.1 Một PostgreSQL, nhiều Schema

Modular Monolith vẫn dùng **một database duy nhất**, nhưng chia thành nhiều **PostgreSQL schema** — mỗi module sở hữu một schema riêng. Đây là ranh giới dữ liệu tương tự như ranh giới code.

```
instagram_db
├── user_schema
│   ├── users
│   ├── follows
│   ├── user_blocks
│   └── user_settings
├── post_schema
│   ├── posts
│   ├── post_media
│   ├── likes
│   ├── comments
│   └── hashtags
├── story_schema
│   ├── stories
│   └── story_views
├── chat_schema
│   ├── conversations
│   ├── conversation_members
│   └── messages
├── notification_schema
│   └── notifications
└── media_schema
    └── media_files
```

**Tại sao dùng schema thay vì tên bảng prefix?**

| | Prefix tên bảng (`post_posts`) | Schema riêng (`post_schema.posts`) |
|---|---|---|
| Phân tách rõ ràng | Không, vẫn chung không gian | Có, mỗi module là một namespace |
| Phân quyền DB user | Khó | Dễ — `GRANT` theo schema |
| Di chuyển lên microservice sau | Khó | Dễ hơn — dump schema là xong |
| Độ phức tạp setup | Thấp | Thấp — chỉ cần tạo schema trước |

---

### 4.2 Cấu hình JPA theo schema

Mỗi entity khai báo schema của mình trong annotation `@Table`.

```java
// module/user/entity/User.java
@Entity
@Table(name = "users", schema = "user_schema")
public class User extends BaseEntity { ... }

// module/post/entity/Post.java
@Entity
@Table(name = "posts", schema = "post_schema")
public class Post extends BaseEntity { ... }

// module/post/entity/Like.java
@Entity
@Table(name = "likes", schema = "post_schema")
public class Like extends BaseEntity { ... }
```

Cấu hình `application.yml` — bật `create_schemas` để Hibernate tự tạo schema nếu chưa có:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/instagram_db
    username: ${DB_USER}
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: validate          # production: validate, dev: update
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        default_schema: public    # schema mặc định nếu entity không khai báo
        format_sql: true
    show-sql: false
```

Tạo schema trong Liquibase migration (chạy trước khi Hibernate khởi động):

```sql
-- db/changelog/000_create_schemas.sql
CREATE SCHEMA IF NOT EXISTS user_schema;
CREATE SCHEMA IF NOT EXISTS post_schema;
CREATE SCHEMA IF NOT EXISTS story_schema;
CREATE SCHEMA IF NOT EXISTS chat_schema;
CREATE SCHEMA IF NOT EXISTS notification_schema;
CREATE SCHEMA IF NOT EXISTS media_schema;
```

---

### 4.3 Schema đầy đủ từng module

#### Module `user`

```sql
-- user_schema.users
CREATE TABLE user_schema.users (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(30)  NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),                        -- null nếu đăng nhập OAuth2
    display_name  VARCHAR(60),
    bio           TEXT,
    avatar_url    VARCHAR(500),
    website_url   VARCHAR(500),
    is_private    BOOLEAN      NOT NULL DEFAULT FALSE,
    is_verified   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- user_schema.follows
CREATE TABLE user_schema.follows (
    follower_id  BIGINT      NOT NULL REFERENCES user_schema.users(id) ON DELETE CASCADE,
    following_id BIGINT      NOT NULL REFERENCES user_schema.users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX idx_follows_following ON user_schema.follows(following_id);
```

#### Module `post`

```sql
-- post_schema.posts
CREATE TABLE post_schema.posts (
    id         BIGSERIAL    PRIMARY KEY,
    author_id  BIGINT       NOT NULL REFERENCES user_schema.users(id) ON DELETE CASCADE,
    caption    TEXT,
    type       VARCHAR(10)  NOT NULL DEFAULT 'IMAGE',  -- IMAGE | VIDEO | REEL
    location   VARCHAR(100),
    is_hidden  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_author ON post_schema.posts(author_id, created_at DESC);

-- post_schema.post_media (1 post có thể có nhiều ảnh/video)
CREATE TABLE post_schema.post_media (
    id          BIGSERIAL   PRIMARY KEY,
    post_id     BIGINT      NOT NULL REFERENCES post_schema.posts(id) ON DELETE CASCADE,
    media_url   VARCHAR(500) NOT NULL,
    thumb_url   VARCHAR(500),
    order_index SMALLINT    NOT NULL DEFAULT 0,
    media_type  VARCHAR(10) NOT NULL DEFAULT 'IMAGE'
);

-- post_schema.likes
CREATE TABLE post_schema.likes (
    user_id    BIGINT      NOT NULL REFERENCES user_schema.users(id) ON DELETE CASCADE,
    post_id    BIGINT      NOT NULL REFERENCES post_schema.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- post_schema.comments
CREATE TABLE post_schema.comments (
    id         BIGSERIAL   PRIMARY KEY,
    post_id    BIGINT      NOT NULL REFERENCES post_schema.posts(id) ON DELETE CASCADE,
    author_id  BIGINT      NOT NULL REFERENCES user_schema.users(id) ON DELETE CASCADE,
    parent_id  BIGINT      REFERENCES post_schema.comments(id) ON DELETE CASCADE,  -- reply
    content    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON post_schema.comments(post_id, created_at);

-- post_schema.hashtags
CREATE TABLE post_schema.hashtags (
    id   BIGSERIAL   PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE post_schema.post_hashtags (
    post_id    BIGINT NOT NULL REFERENCES post_schema.posts(id) ON DELETE CASCADE,
    hashtag_id BIGINT NOT NULL REFERENCES post_schema.hashtags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, hashtag_id)
);
```

#### Module `story`

```sql
-- story_schema.stories
CREATE TABLE story_schema.stories (
    id         BIGSERIAL    PRIMARY KEY,
    author_id  BIGINT       NOT NULL REFERENCES user_schema.users(id) ON DELETE CASCADE,
    media_url  VARCHAR(500) NOT NULL,
    thumb_url  VARCHAR(500),
    media_type VARCHAR(10)  NOT NULL DEFAULT 'IMAGE',
    caption    TEXT,
    expires_at TIMESTAMPTZ  NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stories_author_expires ON story_schema.stories(author_id, expires_at);

-- story_schema.story_views
CREATE TABLE story_schema.story_views (
    story_id   BIGINT      NOT NULL REFERENCES story_schema.stories(id) ON DELETE CASCADE,
    viewer_id  BIGINT      NOT NULL REFERENCES user_schema.users(id) ON DELETE CASCADE,
    viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (story_id, viewer_id)
);
```

#### Module `chat`

```sql
-- chat_schema.conversations
CREATE TABLE chat_schema.conversations (
    id         BIGSERIAL   PRIMARY KEY,
    is_group   BOOLEAN     NOT NULL DEFAULT FALSE,
    name       VARCHAR(100),                          -- chỉ có với group chat
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- chat_schema.conversation_members
CREATE TABLE chat_schema.conversation_members (
    conversation_id BIGINT      NOT NULL REFERENCES chat_schema.conversations(id) ON DELETE CASCADE,
    user_id         BIGINT      NOT NULL REFERENCES user_schema.users(id)  ON DELETE CASCADE,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);

-- chat_schema.messages
CREATE TABLE chat_schema.messages (
    id              BIGSERIAL    PRIMARY KEY,
    conversation_id BIGINT       NOT NULL REFERENCES chat_schema.conversations(id) ON DELETE CASCADE,
    sender_id       BIGINT       NOT NULL REFERENCES user_schema.users(id) ON DELETE CASCADE,
    content         TEXT,
    media_url       VARCHAR(500),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    seen_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conv ON chat_schema.messages(conversation_id, created_at DESC);
```

#### Module `notification`

```sql
-- notification_schema.notifications
CREATE TABLE notification_schema.notifications (
    id          BIGSERIAL   PRIMARY KEY,
    recipient_id BIGINT     NOT NULL REFERENCES user_schema.users(id) ON DELETE CASCADE,
    actor_id    BIGINT      REFERENCES user_schema.users(id) ON DELETE SET NULL,
    type        VARCHAR(30) NOT NULL,   -- NEW_POST | LIKE | COMMENT | FOLLOW | MENTION
    entity_id   BIGINT,                -- id của post/comment/story liên quan
    entity_type VARCHAR(20),           -- POST | COMMENT | STORY
    message     TEXT        NOT NULL,
    is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_recipient ON notification_schema.notifications(recipient_id, is_read, created_at DESC);
```

---

### 4.4 Transaction Boundary

Đây là điểm quan trọng nhất khi làm việc với nhiều module.

#### Trường hợp 1 — Cùng module: dùng `@Transactional` bình thường

Các thao tác trong cùng một module có thể gộp chung một transaction. Nếu một bước lỗi, toàn bộ rollback.

```java
// Tạo post + lưu media — cùng transaction, rollback nếu lỗi
@Transactional
public PostResponse createPost(CreatePostRequest request, Long authorId) {
    Post post = postRepository.save(Post.builder()
            .caption(request.getCaption())
            .authorId(authorId)
            .build());

    // Lưu danh sách media — cùng transaction với post
    request.getMediaUrls().forEach(url ->
        postMediaRepository.save(PostMedia.builder()
                .postId(post.getId())
                .mediaUrl(url)
                .build())
    );

    eventPublisher.publishEvent(new PostCreatedEvent(this, post.getId(), authorId));
    return PostResponse.from(post);
    // Nếu bất kỳ bước nào ném exception → cả post lẫn media đều rollback
}
```

#### Trường hợp 2 — Khác module qua `@Async`: transaction độc lập

Listener chạy trên thread riêng nên **không tham gia** transaction của bên phát. Dùng `@Transactional` riêng trong listener.

```java
@Component
@RequiredArgsConstructor
public class PostEventListener {

    private final NotificationService notificationService;

    @Async
    @EventListener
    @Transactional   // transaction riêng của listener này
    public void onPostCreated(PostCreatedEvent event) {
        // Nếu lỗi ở đây → chỉ rollback notification, không ảnh hưởng post đã lưu
        notificationService.notifyFollowers(event.getAuthorId(), event.getPostId());
    }
}
```

#### Trường hợp 3 — Khác module, cần atomicity: dùng `@EventListener` đồng bộ

Trường hợp hiếm — khi notification **bắt buộc phải thành công cùng lúc** với post (ví dụ audit log bắt buộc):

```java
@EventListener   // KHÔNG có @Async → cùng thread, cùng transaction
public void onPostCreated(PostCreatedEvent event) {
    auditLogRepository.save(new AuditLog(
            "POST_CREATED", event.getAuthorId(), event.getPostId(), Instant.now()
    ));
    // Nếu lỗi ở đây → rollback cả post (vì cùng transaction)
}
```

> Dùng cách này cẩn thận — chỉ khi thực sự cần atomicity. Hầu hết notification/search index nên dùng `@Async`.

---

### 4.5 Migration với Liquibase

Mỗi module quản lý migration của schema mình qua Liquibase changelog riêng.

**Cấu trúc thư mục migration:**

```
src/main/resources/db/
├── changelog/
│   ├── db.changelog-master.xml     ← file gốc, include tất cả module
│   ├── user/
│   │   ├── 001_create_users.sql
│   │   └── 002_create_follows.sql
│   ├── post/
│   │   ├── 001_create_posts.sql
│   │   └── 002_create_likes_comments.sql
│   ├── story/
│   │   └── 001_create_stories.sql
│   ├── chat/
│   │   └── 001_create_chat.sql
│   └── notification/
│       └── 001_create_notifications.sql
```

**`db.changelog-master.xml`:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                   xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
                   http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.0.xsd">

    <include file="db/changelog/000_create_schemas.sql"/>

    <!-- Thứ tự quan trọng: module không phụ thuộc trước -->
    <include file="db/changelog/user/001_create_users.sql"/>
    <include file="db/changelog/user/002_create_follows.sql"/>
    <include file="db/changelog/post/001_create_posts.sql"/>
    <include file="db/changelog/post/002_create_likes_comments.sql"/>
    <include file="db/changelog/story/001_create_stories.sql"/>
    <include file="db/changelog/chat/001_create_chat.sql"/>
    <include file="db/changelog/notification/001_create_notifications.sql"/>
    <include file="db/changelog/media/001_create_media.sql"/>

</databaseChangeLog>
```

**`application.yml` — khai báo Liquibase:**

```yaml
spring:
  liquibase:
    enabled: true
    change-log: classpath:db/changelog/db.changelog-master.xml
```


---

## 5. Quy tắc & Best Practices

### 5.1 Năm quy tắc cứng — không được vi phạm

Đây là những quy tắc mà nếu vi phạm, dự án sẽ dần trở thành Monolith lộn xộn dù có đặt tên module.

---

**Quy tắc 1 — Entity không được rời khỏi module**

Entity chỉ tồn tại bên trong module của nó. Module khác muốn dữ liệu thì nhận DTO, không nhận entity.

```java
// Vi phạm — PostService trả về User entity của module user
public Post createPost(User author, ...) { ... }

// Đúng — PostService chỉ nhận UserSummary (DTO nhỏ)
public PostResponse createPost(UserSummary author, ...) { ... }
```

---

**Quy tắc 2 — Không truy cập Repository của module khác**

Module A không được inject hoặc gọi Repository của module B dù đang trong cùng một JVM.

```java
// Vi phạm
@Service
public class PostService {
    @Autowired
    private UserRepository userRepository;   // ← UserRepository thuộc module user
}

// Đúng
@Service
public class PostService {
    @Autowired
    private UserQueryService userQueryService;   // ← interface công khai của module user
}
```

---

**Quy tắc 3 — Dependency một chiều, không có vòng tròn**

Nếu module A dùng module B thì module B không được dùng module A dưới bất kỳ hình thức nào — kể cả qua event.

```
# Đúng
post → user   (post cần thông tin user)
notification → user   (notification cần tên người nhận)

# Vi phạm — vòng tròn
post → notification   VÀ   notification → post
```

Giải pháp khi cần hai chiều: tạo event và để bên có dependency thấp hơn lắng nghe.

---

**Quy tắc 4 — `core` chỉ chứa thứ không thuộc về module nào**

`core` là nơi chứa code dùng chung thực sự: `BaseEntity`, exception handler, security config, pagination wrapper. Không đặt entity nghiệp vụ (`Post`, `User`) vào `core` dù nhiều module cùng cần.

```
# Đúng để trong core
core/entity/BaseEntity.java         ← id, createdAt, updatedAt
core/exception/GlobalExceptionHandler.java
core/security/JwtFilter.java
core/utils/PageResponse.java

# Sai — entity nghiệp vụ không thuộc core
core/entity/User.java               ← phải nằm trong module/user/entity/
core/entity/Post.java               ← phải nằm trong module/post/entity/
```

---

**Quy tắc 5 — Giao tiếp giữa module chỉ qua hai cơ chế đã định nghĩa**

Hai cơ chế hợp lệ duy nhất:
- **Spring Event** — khi thông báo điều gì đó xảy ra
- **Public interface** — khi cần query dữ liệu đồng bộ

Không có cơ chế thứ ba. Không dùng `static method`, không dùng `@Autowired` trực tiếp sang service của module khác ngoài interface.

---

### 5.2 Tín hiệu nhận biết module đang bị vi phạm

Khi review code, những dấu hiệu sau là cảnh báo cần xem xét ngay:

| Dấu hiệu | Vấn đề | Cách sửa |
|---|---|---|
| `import com.instagram.module.notification.*` trong `module/post/` | Post phụ thuộc trực tiếp vào Notification | Chuyển sang publishEvent |
| `UserRepository` xuất hiện trong `PostService` | Vi phạm ranh giới repository | Dùng `UserQueryService` interface |
| `User` entity trong param hoặc return của `PostService` | Entity rò rỉ ra ngoài module | Thay bằng `UserSummary` DTO |
| Entity nằm trong package `core/entity/` (trừ BaseEntity) | Entity nhầm chỗ | Chuyển vào module tương ứng |
| Một service có hơn 500 dòng code | Service đang làm quá nhiều việc | Tách thêm service con trong module |
| `@SpringBootTest` trong unit test của service | Test không cô lập | Dùng `@ExtendWith(MockitoExtension.class)` |

---

### 5.3 Chiến lược testing theo từng tầng

Modular Monolith có ranh giới rõ ràng nên việc test trở nên dễ hơn nhiều so với Monolith thường — mỗi module có thể test độc lập.

#### Unit Test — test từng module riêng

```java
@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserQueryService userQueryService;       // mock interface, không load module user

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private PostService postService;

    @Test
    void createPost_shouldSaveAndPublishEvent() {
        // Arrange
        UserSummary author = new UserSummary(1L, "john", "John Doe", null);
        when(userQueryService.getUserSummaryByUsername("john")).thenReturn(author);
        when(postRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Act
        PostResponse result = postService.createPost(
            new CreatePostRequest("Hello world", PostType.IMAGE, List.of()),
            "john"
        );

        // Assert
        assertThat(result.caption()).isEqualTo("Hello world");
        verify(eventPublisher).publishEvent(any(PostCreatedEvent.class));
    }
}
```

#### Integration Test — test một module với DB thật

```java
@DataJpaTest                         // chỉ load JPA layer, không load toàn bộ app
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PostRepositoryTest {

    @Autowired
    private PostRepository postRepository;

    @Test
    void findFeedPosts_shouldReturnPostsFromFollowedUsers() {
        // Test trực tiếp với PostgreSQL test container
        List<Long> followingIds = List.of(1L, 2L);
        Page<Post> feed = postRepository.findFeedPosts(followingIds, PageRequest.of(0, 10));
        assertThat(feed).isNotEmpty();
    }
}
```

#### End-to-End Test — test API từ ngoài vào

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PostApiTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void createPost_withValidToken_shouldReturn201() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(getTestToken());

        ResponseEntity<PostResponse> response = restTemplate.exchange(
            "/api/posts", HttpMethod.POST,
            new HttpEntity<>(new CreatePostRequest("Test", PostType.IMAGE, List.of()), headers),
            PostResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }
}
```

**Tỷ lệ test đề xuất:**

```
Unit Test (Mockito)      70%  — nhanh, test logic nghiệp vụ từng module
Integration Test (JPA)   20%  — test query DB, test repository
E2E Test                 10%  — test luồng quan trọng từ đầu đến cuối
```

---

### 5.4 Checklist trước khi bắt đầu code mỗi module mới

Trước khi viết dòng code đầu tiên cho một module, hãy trả lời đủ các câu hỏi sau:

**Xác định ranh giới:**
- [ ] Module này sở hữu những bảng nào trong database?
- [ ] Module này cần dữ liệu gì từ module khác?
- [ ] Module này cần thông báo điều gì cho module khác khi có sự kiện xảy ra?
- [ ] Module nào cần dữ liệu từ module này?

**Thiết kế interface:**
- [ ] Đã tạo `QueryService` interface với các method cần thiết chưa?
- [ ] Đã định nghĩa các DTO (`request`, `response`) chưa?
- [ ] Đã định nghĩa các `Event` class cho các sự kiện module sẽ phát chưa?

**Kiểm tra dependency:**
- [ ] Không có import từ `module` khác ngoài interface và DTO?
- [ ] Không có entity của module này trong param/return của method public?
- [ ] Dependency graph không tạo vòng tròn?

**Database:**
- [ ] Đã tạo migration SQL cho schema của module chưa?
- [ ] Tất cả entity đã khai báo đúng `schema` trong `@Table`?
- [ ] FK sang module khác chỉ tham chiếu đến PK (`id`), không tham chiếu cột khác?

---

### 5.5 Cấu trúc hoàn chỉnh để tham khảo

```
backend/
└── src/
    ├── main/
    │   ├── java/com/instagram/
    │   │   ├── InstagramApplication.java
    │   │   ├── core/
    │   │   │   ├── entity/BaseEntity.java
    │   │   │   ├── security/
    │   │   │   │   ├── JwtFilter.java
    │   │   │   │   ├── JwtUtil.java
    │   │   │   │   └── SecurityConfig.java
    │   │   │   ├── exception/
    │   │   │   │   ├── GlobalExceptionHandler.java
    │   │   │   │   └── ErrorResponse.java
    │   │   │   └── utils/
    │   │   │       └── PageResponse.java
    │   │   ├── module/
    │   │   │   ├── auth/
    │   │   │   │   ├── controller/AuthController.java
    │   │   │   │   ├── service/AuthService.java
    │   │   │   │   └── dto/
    │   │   │   ├── user/
    │   │   │   │   ├── controller/UserController.java
    │   │   │   │   ├── service/
    │   │   │   │   │   ├── UserService.java
    │   │   │   │   │   ├── UserQueryService.java        ← interface public
    │   │   │   │   │   └── UserQueryServiceImpl.java
    │   │   │   │   ├── repository/UserRepository.java
    │   │   │   │   ├── entity/
    │   │   │   │   │   ├── User.java
    │   │   │   │   │   └── Follow.java
    │   │   │   │   ├── dto/
    │   │   │   │   │   ├── request/
    │   │   │   │   │   └── response/
    │   │   │   │   │       └── UserSummary.java         ← DTO dùng chung
    │   │   │   │   └── event/
    │   │   │   │       └── UserFollowedEvent.java
    │   │   │   ├── post/
    │   │   │   │   ├── controller/PostController.java
    │   │   │   │   ├── service/PostService.java
    │   │   │   │   ├── repository/PostRepository.java
    │   │   │   │   ├── entity/
    │   │   │   │   │   ├── Post.java
    │   │   │   │   │   ├── Like.java
    │   │   │   │   │   └── Comment.java
    │   │   │   │   ├── dto/
    │   │   │   │   ├── event/
    │   │   │   │   │   ├── PostCreatedEvent.java
    │   │   │   │   │   └── PostLikedEvent.java
    │   │   │   │   └── exception/
    │   │   │   ├── story/   ...
    │   │   │   ├── chat/    ...
    │   │   │   ├── notification/
    │   │   │   │   └── event/
    │   │   │   │       └── PostEventListener.java       ← lắng nghe event của post
    │   │   │   ├── media/   ...
    │   │   │   └── search/  ...
    │   │   └── infrastructure/
    │   │       ├── config/
    │   │       │   ├── AsyncConfig.java
    │   │       │   ├── RedisConfig.java
    │   │       │   ├── S3Config.java
    │   │       │   └── SwaggerConfig.java
    │   │       └── storage/
    │   │           └── S3StorageService.java
    │   └── resources/
    │       ├── application.yml
    │       ├── application-dev.yml
    │       └── db/changelog/
    │           ├── db.changelog-master.xml
    │           ├── 000_create_schemas.sql
    │           ├── user/
    │           ├── post/
    │           ├── story/
    │           ├── chat/
    │           ├── notification/
    │           └── media/
    └── test/
        └── java/com/instagram/
            ├── module/
            │   ├── post/PostServiceTest.java
            │   └── user/UserServiceTest.java
            └── api/PostApiTest.java
```

---

*Tài liệu hoàn thành — phiên bản 1.0*
*Stack: Spring Boot · ReactJS · PostgreSQL · Redis · S3*
