CREATE DATABASE IF NOT EXISTS ai_pixel_studio
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ai_pixel_studio;

CREATE TABLE IF NOT EXISTS `user` (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  username VARCHAR(32) NOT NULL COMMENT 'Unique account name',
  password VARCHAR(100) NOT NULL COMMENT 'BCrypt password hash',
  nickname VARCHAR(32) NOT NULL COMMENT 'Display name',
  avatar VARCHAR(500) DEFAULT NULL COMMENT 'Avatar URL',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Application users';

CREATE TABLE IF NOT EXISTS `work` (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  title VARCHAR(100) NOT NULL,
  pixel_size INT NOT NULL,
  pixel_data LONGTEXT NOT NULL COMMENT 'Current complete pixel matrix JSON',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_work_user_id (user_id),
  CONSTRAINT fk_work_user FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE
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
  CONSTRAINT fk_work_history_work FOREIGN KEY (work_id) REFERENCES `work` (id) ON DELETE CASCADE,
  CONSTRAINT fk_work_history_user FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Per-user pixel work history';
