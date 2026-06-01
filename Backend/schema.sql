-- Project Management System Schema
-- Run automatically on first startup

CREATE TABLE IF NOT EXISTS users (
    id          VARCHAR(36) PRIMARY KEY,
    email       VARCHAR(255) UNIQUE NOT NULL,
    name        VARCHAR(255) NOT NULL,
    role        VARCHAR(50)  NOT NULL DEFAULT 'member',
    username    VARCHAR(255),
    user_id     VARCHAR(255),
    password    VARCHAR(255),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id          VARCHAR(36) PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    status      VARCHAR(50)  DEFAULT 'planning',
    priority    VARCHAR(50)  DEFAULT 'medium',
    dateline    VARCHAR(50),
    assignee    VARCHAR(36)  REFERENCES users(id) ON DELETE SET NULL,
    progress    FLOAT        DEFAULT 0.0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id          VARCHAR(36) PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    status      VARCHAR(50)  DEFAULT 'todo',
    priority    VARCHAR(50)  DEFAULT 'medium',
    due_date    VARCHAR(50),
    assignee    VARCHAR(36)  REFERENCES users(id) ON DELETE SET NULL,
    project_id  VARCHAR(36)  REFERENCES projects(id) ON DELETE SET NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
    id          VARCHAR(36) PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    leader      VARCHAR(36)  REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
    team_id     VARCHAR(36) REFERENCES teams(id) ON DELETE CASCADE,
    user_id     VARCHAR(36)  REFERENCES users(id) ON DELETE CASCADE,
    role_in_team VARCHAR(50),
    PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id              VARCHAR(36) PRIMARY KEY,
    message         TEXT        NOT NULL,
    type            VARCHAR(50),
    user_id         VARCHAR(36),
    is_read         BOOLEAN     DEFAULT FALSE,
    related_task_id VARCHAR(36) REFERENCES tasks(id) ON DELETE SET NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
    id          VARCHAR(36) PRIMARY KEY,
    text        TEXT        NOT NULL,
    author      VARCHAR(255),
    task_id     VARCHAR(36)  REFERENCES tasks(id) ON DELETE CASCADE,
    project_id  VARCHAR(36)  REFERENCES projects(id) ON DELETE SET NULL,
    data        VARCHAR(255),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS files (
    id          VARCHAR(36) PRIMARY KEY,
    file_name   VARCHAR(255) NOT NULL,
    url         TEXT,
    type        VARCHAR(50),
    uploaded_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    project_id  VARCHAR(36) REFERENCES projects(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comment     TEXT
);

CREATE TABLE IF NOT EXISTS messages (
    id          VARCHAR(36) PRIMARY KEY,
    sender_id   VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    receiver_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    content     TEXT        NOT NULL,
    sent_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    project_id  VARCHAR(36) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS milestones (
    id          VARCHAR(36) PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    deadline    VARCHAR(50),
    project_id  VARCHAR(36) REFERENCES projects(id) ON DELETE SET NULL,
    status      VARCHAR(50) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS activity_log (
    id          VARCHAR(36) PRIMARY KEY,
    user_id     VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    action      TEXT        NOT NULL,
    timestamp   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    project_id  VARCHAR(36) REFERENCES projects(id) ON DELETE SET NULL
);
