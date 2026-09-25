-- Migration: 0001_initial
-- Creates all content and activity tables for the Seven Zillions admin panel.

-- Company (singleton row, id always 1)
CREATE TABLE company (
  id      INTEGER PRIMARY KEY DEFAULT 1,
  data    TEXT NOT NULL  -- JSON blob of Company object
);

-- Content collections
CREATE TABLE products (
  slug       TEXT PRIMARY KEY,
  data       TEXT NOT NULL,  -- JSON blob of Product
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE solutions (
  slug       TEXT PRIMARY KEY,
  data       TEXT NOT NULL,  -- JSON blob of Solution
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE packages (
  slug       TEXT PRIMARY KEY,
  data       TEXT NOT NULL,  -- JSON blob of Package
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE insights (
  slug       TEXT PRIMARY KEY,
  data       TEXT NOT NULL,  -- JSON blob of Insight
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Projects (keyed by server-generated UUID, not slug)
CREATE TABLE projects (
  id         TEXT PRIMARY KEY,  -- crypto.randomUUID()
  data       TEXT NOT NULL,     -- JSON blob of Project
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Services (singleton row storing a JSON array of Service objects)
CREATE TABLE services (
  id   INTEGER PRIMARY KEY DEFAULT 1,
  data TEXT NOT NULL  -- JSON array of Service objects
);

-- Activity log
CREATE TABLE activity_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  path       TEXT,
  slug       TEXT,
  timestamp  TEXT NOT NULL  -- ISO 8601 UTC
);

-- Indexes for activity log queries
CREATE INDEX idx_activity_timestamp ON activity_log(timestamp DESC);
CREATE INDEX idx_activity_type      ON activity_log(event_type);
