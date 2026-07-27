-- Run this once for installations created with the former `work` table.
CREATE TABLE IF NOT EXISTS `works` (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  title VARCHAR(100) NOT NULL,
  source_image_url VARCHAR(500) DEFAULT NULL,
  pixel_image_url VARCHAR(500) DEFAULT NULL,
  pixel_size INT NOT NULL,
  image_width INT NOT NULL,
  image_height INT NOT NULL,
  grid_width INT NOT NULL,
  grid_height INT NOT NULL,
  canvas_width INT NOT NULL,
  canvas_height INT NOT NULL,
  pixel_data LONGTEXT NOT NULL,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_works_user_updated (user_id, update_time),
  CONSTRAINT fk_works_user FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Preserve data created by the old implementation. The old payload did not
-- store source dimensions, so its grid/canvas dimensions are used as a safe
-- fallback until the work is opened and saved again.
INSERT IGNORE INTO works (id, user_id, title, source_image_url, pixel_image_url, pixel_size,
  image_width, image_height, grid_width, grid_height, canvas_width, canvas_height,
  pixel_data, create_time, update_time)
SELECT id, user_id, title, source_image_url, NULL, pixel_size,
  1, 1, 1, 1, 1, 1, pixel_data, create_time, update_time
FROM `work`;

ALTER TABLE work_history DROP FOREIGN KEY fk_work_history_work;
ALTER TABLE work_history
  ADD CONSTRAINT fk_work_history_work FOREIGN KEY (work_id) REFERENCES works (id) ON DELETE CASCADE;
