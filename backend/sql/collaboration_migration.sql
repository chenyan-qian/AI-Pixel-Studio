-- PixelVerse community collaboration schema for databases created before this feature.
CREATE TABLE IF NOT EXISTS artwork_permission (
  artwork_id BIGINT NOT NULL,
  visibility VARCHAR(20) NOT NULL DEFAULT 'PRIVATE',
  allow_edit TINYINT NOT NULL DEFAULT 0,
  allow_comment TINYINT NOT NULL DEFAULT 1,
  allow_fork TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (artwork_id),
  CONSTRAINT fk_artwork_permission_work FOREIGN KEY (artwork_id) REFERENCES works(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS artwork_collaboration_room (
  id BIGINT NOT NULL AUTO_INCREMENT,
  artwork_id BIGINT NOT NULL,
  online_count INT NOT NULL DEFAULT 0,
  created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uk_collaboration_room_artwork (artwork_id),
  CONSTRAINT fk_collaboration_room_work FOREIGN KEY (artwork_id) REFERENCES works(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pixel_operation (
  id BIGINT NOT NULL AUTO_INCREMENT,
  artwork_id BIGINT NOT NULL, user_id BIGINT NOT NULL, x INT NOT NULL, y INT NOT NULL,
  old_color VARCHAR(16) NOT NULL, new_color VARCHAR(16) NOT NULL,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY idx_pixel_operation_artwork_time (artwork_id, create_time), KEY idx_pixel_operation_user (user_id),
  CONSTRAINT fk_pixel_operation_work FOREIGN KEY (artwork_id) REFERENCES works(id) ON DELETE CASCADE,
  CONSTRAINT fk_pixel_operation_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS artwork_version (
  id BIGINT NOT NULL AUTO_INCREMENT,
  artwork_id BIGINT NOT NULL, version_number INT NOT NULL, snapshot_url LONGTEXT NOT NULL,
  creator_id BIGINT NOT NULL, description VARCHAR(300) DEFAULT NULL,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uk_artwork_version (artwork_id, version_number), KEY idx_artwork_version_artwork (artwork_id, create_time),
  CONSTRAINT fk_artwork_version_work FOREIGN KEY (artwork_id) REFERENCES works(id) ON DELETE CASCADE,
  CONSTRAINT fk_artwork_version_user FOREIGN KEY (creator_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
