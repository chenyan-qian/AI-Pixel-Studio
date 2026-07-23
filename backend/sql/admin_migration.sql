-- Migration for an existing AI Pixel Studio database. Run once before deploying the admin module.
USE ai_pixel_studio;

ALTER TABLE `user`
  ADD COLUMN role VARCHAR(16) NOT NULL DEFAULT 'USER' COMMENT 'USER or ADMIN' AFTER avatar,
  ADD COLUMN status TINYINT NOT NULL DEFAULT 1 COMMENT '1 active, 0 disabled' AFTER role;

ALTER TABLE work
  ADD COLUMN source_image_url VARCHAR(500) DEFAULT NULL COMMENT 'Original uploaded image URL' AFTER pixel_size;

CREATE TABLE IF NOT EXISTS operation_log (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  operation VARCHAR(255) NOT NULL,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY idx_operation_log_create_time (create_time),
  CONSTRAINT fk_operation_log_user FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS upload_file (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(32) NOT NULL DEFAULT 'UPLOAD',
  file_size BIGINT NOT NULL,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uk_upload_file_stored_name (stored_name),
  KEY idx_upload_file_create_time (create_time),
  CONSTRAINT fk_upload_file_user FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS generation_log (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY idx_generation_log_create_time (create_time),
  CONSTRAINT fk_generation_log_user FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Promote an existing account after verifying its identity:
-- UPDATE `user` SET role = 'ADMIN', status = 1 WHERE username = 'your-admin-username';
