CREATE DATABASE IF NOT EXISTS ai_pixel_studio
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ai_pixel_studio;

CREATE TABLE IF NOT EXISTS `user` (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  username VARCHAR(32) NOT NULL COMMENT 'Unique account name',
  email VARCHAR(254) NOT NULL COMMENT 'Verified login email',
  email_verified TINYINT NOT NULL DEFAULT 0 COMMENT '0 unverified, 1 verified',
  password VARCHAR(100) NOT NULL COMMENT 'BCrypt password hash',
  nickname VARCHAR(32) NOT NULL COMMENT 'Display name',
  avatar VARCHAR(500) DEFAULT NULL COMMENT 'Avatar URL',
  role VARCHAR(16) NOT NULL DEFAULT 'USER' COMMENT 'USER or ADMIN',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1 active, 0 disabled',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_username (username),
  UNIQUE KEY uk_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Application users';

CREATE TABLE IF NOT EXISTS email_code (
  id BIGINT NOT NULL AUTO_INCREMENT,
  email VARCHAR(254) NOT NULL,
  code CHAR(6) NOT NULL,
  expire_time DATETIME NOT NULL,
  used TINYINT NOT NULL DEFAULT 0 COMMENT '0 unused, 1 used or invalidated',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_email_code_email_time (email, create_time),
  KEY idx_email_code_lookup (email, code, used, expire_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Email verification codes';

CREATE TABLE IF NOT EXISTS `works` (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  title VARCHAR(100) NOT NULL,
  pixel_size INT NOT NULL,
  source_image_url VARCHAR(500) DEFAULT NULL COMMENT 'Original uploaded image URL',
  pixel_image_url VARCHAR(500) DEFAULT NULL COMMENT 'Pixelated image URL',
  image_width INT NOT NULL,
  image_height INT NOT NULL,
  grid_width INT NOT NULL,
  grid_height INT NOT NULL,
  canvas_width INT NOT NULL,
  canvas_height INT NOT NULL,
  pixel_data LONGTEXT NOT NULL COMMENT 'Current complete pixel matrix JSON',
  review_status VARCHAR(16) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT, PENDING, PUBLISHED, REJECTED',
  review_note VARCHAR(500) DEFAULT NULL,
  reviewer_id BIGINT DEFAULT NULL,
  reviewed_time DATETIME DEFAULT NULL,
  published_time DATETIME DEFAULT NULL,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_work_user_id (user_id),
  KEY idx_works_review_published (review_status, published_time),
  CONSTRAINT fk_works_user FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Saved pixel works';

CREATE TABLE IF NOT EXISTS work_history (
  id BIGINT NOT NULL AUTO_INCREMENT,
  work_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  operation_no INT NOT NULL COMMENT 'Client history step number',
  operation_type VARCHAR(32) NOT NULL,
  operation_desc VARCHAR(500) NOT NULL,
  pixel_data LONGTEXT NULL COMMENT 'Full snapshot for the latest 20 steps',
  softness_data LONGTEXT NULL,
  compressed_snapshot LONGTEXT NULL COMMENT 'RLE snapshot for older steps',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_work_history_step (work_id, operation_no),
  KEY idx_work_history_user_work (user_id, work_id),
  CONSTRAINT fk_work_history_work FOREIGN KEY (work_id) REFERENCES `works` (id) ON DELETE CASCADE,
  CONSTRAINT fk_work_history_user FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Per-user pixel work history';

CREATE TABLE IF NOT EXISTS artwork_permission (
  artwork_id BIGINT NOT NULL,
  visibility VARCHAR(20) NOT NULL DEFAULT 'PRIVATE' COMMENT 'PRIVATE, PUBLIC, PUBLIC_COLLAB',
  allow_edit TINYINT NOT NULL DEFAULT 0,
  allow_comment TINYINT NOT NULL DEFAULT 1,
  allow_fork TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (artwork_id),
  CONSTRAINT fk_artwork_permission_work FOREIGN KEY (artwork_id) REFERENCES works(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS artwork_collaboration_room (
  id BIGINT NOT NULL AUTO_INCREMENT,
  artwork_id BIGINT NOT NULL,
  online_count INT NOT NULL DEFAULT 0,
  created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_collaboration_room_artwork (artwork_id),
  CONSTRAINT fk_collaboration_room_work FOREIGN KEY (artwork_id) REFERENCES works(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pixel_operation (
  id BIGINT NOT NULL AUTO_INCREMENT,
  artwork_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  x INT NOT NULL,
  y INT NOT NULL,
  old_color VARCHAR(16) NOT NULL,
  new_color VARCHAR(16) NOT NULL,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pixel_operation_artwork_time (artwork_id, create_time),
  KEY idx_pixel_operation_user (user_id),
  CONSTRAINT fk_pixel_operation_work FOREIGN KEY (artwork_id) REFERENCES works(id) ON DELETE CASCADE,
  CONSTRAINT fk_pixel_operation_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS artwork_version (
  id BIGINT NOT NULL AUTO_INCREMENT,
  artwork_id BIGINT NOT NULL,
  version_number INT NOT NULL,
  snapshot_url LONGTEXT NOT NULL COMMENT 'Pixel matrix JSON snapshot',
  creator_id BIGINT NOT NULL,
  description VARCHAR(300) DEFAULT NULL,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_artwork_version (artwork_id, version_number),
  KEY idx_artwork_version_artwork (artwork_id, create_time),
  CONSTRAINT fk_artwork_version_work FOREIGN KEY (artwork_id) REFERENCES works(id) ON DELETE CASCADE,
  CONSTRAINT fk_artwork_version_user FOREIGN KEY (creator_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS operation_log (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  operation VARCHAR(255) NOT NULL,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY idx_operation_log_create_time (create_time),
  CONSTRAINT fk_operation_log_user FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Administrator operation audit log';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Uploaded file metadata';

CREATE TABLE IF NOT EXISTS generation_log (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY idx_generation_log_create_time (create_time),
  CONSTRAINT fk_generation_log_user FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Successful pixel generation statistics';
