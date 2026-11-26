-- =============================================================
-- CyberGuard – Phishing Detection & Email Security System
-- MySQL / MariaDB schema
-- Run with:  npm run db:setup   (from the backend folder)
-- or import this file in phpMyAdmin.
-- =============================================================

CREATE DATABASE IF NOT EXISTS cyberguard_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cyberguard_db;

-- Drop in reverse dependency order so the script can be re-run safely
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS email_scans;
DROP TABLE IF EXISTS url_scans;
DROP TABLE IF EXISTS security_tips;
DROP TABLE IF EXISTS users;

-- -------------------------------------------------------------
-- 1. users
--    password stores a bcrypt hash only, never plain text.
-- -------------------------------------------------------------
CREATE TABLE users (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 2. url_scans
--    scan_details holds the JSON list of triggered rules.
-- -------------------------------------------------------------
CREATE TABLE url_scans (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        INT UNSIGNED NOT NULL,
  submitted_url  VARCHAR(2048) NOT NULL,
  risk_score     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  risk_level     ENUM('SAFE', 'SUSPICIOUS', 'HIGH RISK') NOT NULL,
  scan_details   JSON NOT NULL,
  scanned_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_url_scans_user (user_id, scanned_at),
  KEY idx_url_scans_level (risk_level),
  CONSTRAINT fk_url_scans_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 3. email_scans
--    The full email body is NOT stored (privacy). scan_details
--    keeps indicators plus a short redacted excerpt only.
-- -------------------------------------------------------------
CREATE TABLE email_scans (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  risk_score    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  risk_level    ENUM('SAFE', 'SUSPICIOUS', 'HIGH RISK') NOT NULL,
  scan_details  JSON NOT NULL,
  scanned_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_email_scans_user (user_id, scanned_at),
  KEY idx_email_scans_level (risk_level),
  CONSTRAINT fk_email_scans_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 4. security_tips  (educational content managed by admins)
-- -------------------------------------------------------------
CREATE TABLE security_tips (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title        VARCHAR(150) NOT NULL,
  description  TEXT NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 5. activity_logs
--    user_id is nullable so failed logins for unknown emails
--    can still be recorded; logs survive user deletion.
-- -------------------------------------------------------------
CREATE TABLE activity_logs (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NULL,
  activity    VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activity_logs_user (user_id),
  KEY idx_activity_logs_created (created_at),
  CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;
