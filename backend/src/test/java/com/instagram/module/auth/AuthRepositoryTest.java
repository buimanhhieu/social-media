package com.instagram.module.auth;

import com.instagram.module.user.dto.request.CreateUserCommand;
import com.instagram.module.user.dto.response.UserAuthView;
import com.instagram.module.user.entity.User;
import com.instagram.module.user.repository.UserRepository;
import com.instagram.module.user.service.UserCommandServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest(
        showSql = false,
        properties = {
                "spring.jpa.hibernate.ddl-auto=validate",
                "spring.liquibase.enabled=true",
                "spring.liquibase.change-log=classpath:db/changelog/db.changelog-master.xml"
        }
)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(UserCommandServiceImpl.class)
@Testcontainers
@DisplayName("Auth repository — UserCommandService chạy với Postgres thật (Testcontainers)")
class AuthRepositoryTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("instagram_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void datasourceProps(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        r.add("spring.datasource.username", POSTGRES::getUsername);
        r.add("spring.datasource.password", POSTGRES::getPassword);
        r.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
    }

    @Autowired private UserCommandServiceImpl userCommandService;
    @Autowired private UserRepository userRepository;

    @Test
    @DisplayName("createUnverifiedUser: lưu user với is_verified=false")
    void createUnverifiedUser_shouldPersistAsUnverified() {
        var summary = userCommandService.createUnverifiedUser(new CreateUserCommand(
                "a@b.com", "alice", "HASH", "Alice"));

        User saved = userRepository.findById(summary.id()).orElseThrow();
        assertThat(saved.getEmail()).isEqualTo("a@b.com");
        assertThat(saved.getUsername()).isEqualTo("alice");
        assertThat(saved.isVerified()).isFalse();
        assertThat(saved.getPasswordHash()).isEqualTo("HASH");
    }

    @Test
    @DisplayName("unique constraint trên email: 2 user cùng email → DataIntegrityViolation")
    void uniqueEmailConstraint_shouldRejectDuplicates() {
        userCommandService.createUnverifiedUser(new CreateUserCommand(
                "dup@b.com", "user1", "H", "U1"));

        assertThatThrownBy(() -> {
            userCommandService.createUnverifiedUser(new CreateUserCommand(
                    "dup@b.com", "user2", "H", "U2"));
            userRepository.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("unique constraint trên username: trùng username → DataIntegrityViolation")
    void uniqueUsernameConstraint_shouldRejectDuplicates() {
        userCommandService.createUnverifiedUser(new CreateUserCommand(
                "u1@b.com", "samename", "H", "U1"));

        assertThatThrownBy(() -> {
            userCommandService.createUnverifiedUser(new CreateUserCommand(
                    "u2@b.com", "samename", "H", "U2"));
            userRepository.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("findAuthViewByEmail: trả DTO với passwordHash và verified flag")
    void findAuthViewByEmail_shouldReturnView() {
        var summary = userCommandService.createUnverifiedUser(new CreateUserCommand(
                "view@b.com", "viewer", "HASH-X", "View"));
        userCommandService.markEmailVerified(summary.id());
        userRepository.flush();

        Optional<UserAuthView> view = userCommandService.findAuthViewByEmail("view@b.com");

        assertThat(view).isPresent();
        assertThat(view.get().passwordHash()).isEqualTo("HASH-X");
        assertThat(view.get().verified()).isTrue();
    }

    @Test
    @DisplayName("markEmailVerified: chuyển is_verified false → true")
    void markEmailVerified_shouldFlipFlag() {
        var summary = userCommandService.createUnverifiedUser(new CreateUserCommand(
                "v@b.com", "verifyme", "H", "V"));

        userCommandService.markEmailVerified(summary.id());
        userRepository.flush();

        User reloaded = userRepository.findById(summary.id()).orElseThrow();
        assertThat(reloaded.isVerified()).isTrue();
    }

    @Test
    @DisplayName("updatePasswordHash: ghi hash mới và set last_password_change_at")
    void updatePasswordHash_shouldStampTimestamp() {
        var summary = userCommandService.createUnverifiedUser(new CreateUserCommand(
                "p@b.com", "pwduser", "OLD", "P"));

        userCommandService.updatePasswordHash(summary.id(), "NEW");
        userRepository.flush();

        User reloaded = userRepository.findById(summary.id()).orElseThrow();
        assertThat(reloaded.getPasswordHash()).isEqualTo("NEW");
        assertThat(reloaded.getLastPasswordChangeAt()).isNotNull();
    }

    @Test
    @DisplayName("existsByEmail/Username: phản ánh đúng dữ liệu DB")
    void existsByEmailAndUsername_shouldReflectState() {
        userCommandService.createUnverifiedUser(new CreateUserCommand(
                "exists@b.com", "exists", "H", null));

        assertThat(userCommandService.existsByEmail("exists@b.com")).isTrue();
        assertThat(userCommandService.existsByEmail("missing@b.com")).isFalse();
        assertThat(userCommandService.existsByUsername("exists")).isTrue();
        assertThat(userCommandService.existsByUsername("missing")).isFalse();
    }
}
