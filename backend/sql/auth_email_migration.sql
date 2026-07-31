-- Run once on an existing ai_pixel_studio database before deploying email authentication.
USE ai_pixel_studio;

ALTER TABLE `user`
  ADD COLUMN email VARCHAR(254) NULL COMMENT 'Verified login email' AFTER username,
  ADD COLUMN email_verified TINYINT NOT NULL DEFAULT 0 COMMENT '0 unverified, 1 verified' AFTER email,
  ADD UNIQUE KEY uk_user_email (email);

CREATE TABLE email_code (
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

-- Existing username-only accounts require an administrator to backfill a unique email
-- and then set email_verified = 1 before they can use email/password login.
