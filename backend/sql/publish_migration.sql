-- Run once on an existing database after works_migration.sql.
USE ai_pixel_studio;

ALTER TABLE works
  ADD COLUMN review_status VARCHAR(16) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT, PENDING, PUBLISHED, REJECTED' AFTER pixel_data,
  ADD COLUMN review_note VARCHAR(500) DEFAULT NULL AFTER review_status,
  ADD COLUMN reviewer_id BIGINT DEFAULT NULL AFTER review_note,
  ADD COLUMN reviewed_time DATETIME DEFAULT NULL AFTER reviewer_id,
  ADD COLUMN published_time DATETIME DEFAULT NULL AFTER reviewed_time,
  ADD KEY idx_works_review_published (review_status, published_time);
