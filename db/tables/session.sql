-- Session Table
-- Purpose: Session storage for connect-pg-simple
-- Manages web application sessions
--
-- Key Relationships:
-- - Standalone session management
-- - Not related to application business logic
--
-- Business Logic:
-- - Standard session store implementation
-- - Automatic cleanup of expired sessions
-- - JSON session data storage
--
-- Columns:
-- - sid: Session identifier (primary key)
-- - sess: Session data (JSON)
-- - expire: Session expiration timestamp
--
-- Note: This table is used by the session middleware and is not
-- directly related to the application business logic.
CREATE TABLE session (
    sid varchar NOT NULL COLLATE "default",
    sess json NOT NULL,
    expire timestamp(6) NOT NULL
) WITH (OIDS=FALSE);

ALTER TABLE session ENABLE ROW LEVEL SECURITY;