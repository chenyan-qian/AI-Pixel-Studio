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
