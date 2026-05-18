# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Instagram Clone backend — a **modular monolith** built with Spring Boot 3.3 (Java 21), PostgreSQL, Redis, and S3/MinIO. Frontend is planned (ReactJS) but not yet in this repo.

The full architectural reference (module boundaries, layer responsibilities, event flow, schema design, testing strategy) lives in [ARCHITECTURE.md](ARCHITECTURE.md). Read it when making non-trivial changes — the rules in §3 and §5 below are derived from it.

All code lives under [instagram-clone/backend/](instagram-clone/backend/). There is no frontend directory yet.

## Commands

Run from [instagram-clone/backend/](instagram-clone/backend/) unless noted. There is no Maven wrapper committed — use a system `mvn`.

| Task | Command |
|---|---|
| Start infra (Postgres, Redis, MinIO) | `docker-compose up -d` (from [instagram-clone/](instagram-clone/)) |
| Build (skips tests) | `mvn clean package -DskipTests` |
| Run the app (dev profile) | `mvn spring-boot:run` |
| Run all tests | `mvn test` |
| Run a single test class | `mvn test -Dtest=PostServiceTest` |
| Run a single test method | `mvn test -Dtest=PostServiceTest#createPost_shouldSaveAndPublishEvent` |
| Apply DB migrations only | `mvn liquibase:update` |

Default profile is `dev` (see [application.yml](instagram-clone/backend/src/main/resources/application.yml)). Environment variables for local dev are in [backend/.env](instagram-clone/backend/.env) — they are read by `docker-compose` and Spring placeholder resolution, not auto-loaded by Maven, so export them or use an IDE run config.

Liquibase runs automatically on app startup (`spring.liquibase.enabled: true`). JPA is in `validate` mode — schema changes must go through a new SQL changeset in [db/changelog/](instagram-clone/backend/src/main/resources/db/changelog/) and be registered in `db.changelog-master.xml`.

API docs (Swagger UI) are at `http://localhost:8080/swagger-ui.html` once the app is running.

## Architecture

### Single JVM, many modules, one database, six schemas

Everything runs in one Spring Boot process. The package layout enforces module boundaries:

```
com.instagram/
├── core/              shared primitives (BaseEntity, JwtFilter, GlobalExceptionHandler)
├── infrastructure/    external-service config + adapters (S3/MinIO StorageService, AsyncConfig)
└── module/            one package per feature: auth, user, post, story, chat, notification, media, search
```

Each `module/<name>/` has the same internal layout: `controller / service / repository / entity / dto / event / exception`.

The single Postgres database is split into per-module schemas (`user_schema`, `post_schema`, `story_schema`, `chat_schema`, `notification_schema`, `media_schema`) — see [000_create_schemas.sql](instagram-clone/backend/src/main/resources/db/changelog/000_create_schemas.sql). Each entity must declare its schema via `@Table(schema = "...")`.

### Cross-module communication — two mechanisms, no others

1. **Spring `ApplicationEvent` (pub/sub)** — for fire-and-forget side effects. The publisher does not know who listens.
   ```java
   eventPublisher.publishEvent(new PostCreatedEvent(this, post, author));
   ```
2. **`QueryService` interface in the target module** — for synchronous reads. See [UserQueryService](instagram-clone/backend/src/main/java/com/instagram/module/user/service/UserQueryService.java) as the canonical example. The interface returns DTOs (e.g. `UserSummary`), never entities.

Anything else (importing another module's `Repository`, `Entity`, or internal service class) is a boundary violation.

### Hard rules — do not break these

These come from ARCHITECTURE.md §5.1 and are the cheapest way to keep the monolith from rotting:

1. **No cross-module entity or repository imports.** If `PostService` needs user data, it calls `UserQueryService`, not `UserRepository`. If it needs to react to `UserFollowedEvent`, it adds an `@EventListener` in its own package.
2. **No entities cross module boundaries.** Public service methods take and return DTOs. Entity → DTO mapping happens via a static `from(...)` factory on the response record.
3. **FK columns between modules store the bare `id` only.** Use `@Column(name = "author_id")` — not a JPA `@ManyToOne` — when the referenced entity belongs to another module.
4. **Dependencies form a DAG.** `notification` and `search` listen to everyone; `post`/`story`/`chat` may depend on `user` and `media`; `user`/`media` depend on nothing. No back-edges.
5. **Migrations are append-only.** Add a new SQL file under `db/changelog/<module>/`, register it in `db.changelog-master.xml`. Never edit an applied changeset.

### Where things live

- JWT auth: [core/security/](instagram-clone/backend/src/main/java/com/instagram/core/security/) — `JwtFilter` runs on every request, `SecurityConfig` defines route protection.
- Global error formatting: [core/exception/GlobalExceptionHandler.java](instagram-clone/backend/src/main/java/com/instagram/core/exception/GlobalExceptionHandler.java) — module-specific exceptions extend `BusinessException` or a more specific base, then get formatted here.
- File uploads: [infrastructure/storage/StorageService.java](instagram-clone/backend/src/main/java/com/instagram/infrastructure/storage/StorageService.java) — modules depend on this interface, not directly on the S3/MinIO SDK. The `module/media` module owns the `MediaFile` entity and orchestrates uploads/resizes.
- Async event handling: [infrastructure/config/AsyncConfig.java](instagram-clone/backend/src/main/java/com/instagram/infrastructure/config/AsyncConfig.java) — `@EnableAsync` is on `InstagramApplication`. Event listeners that do heavy work should be `@Async`.

## Testing notes

- Test directories exist but are mostly empty — the testing conventions in ARCHITECTURE.md §5.3 are the target, not the current state.
- Unit tests use Mockito (mock the `QueryService` interfaces of other modules — do not load them).
- Integration tests use Testcontainers + real PostgreSQL (`@DataJpaTest` with `Replace.NONE`).
- E2E tests use `@SpringBootTest(webEnvironment = RANDOM_PORT)` with `TestRestTemplate`.
