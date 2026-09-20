-- Migration: create connection_requests table
-- Run once against the PostgreSQL database.
-- Uses a bidirectional connection_key (sorted UUID pair) to guarantee
-- only one relationship row can ever exist between two users.

CREATE TABLE IF NOT EXISTS connection_requests (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id   UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id   UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Bidirectional unique key: smaller UUID : larger UUID (alphabetical sort)
  -- Mirrors the direct_key pattern used in the conversations table.
  connection_key VARCHAR(200) NOT NULL,
  status         TEXT         NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  -- Enforce one-and-only-one relationship row between any two users
  CONSTRAINT connection_requests_key_unique UNIQUE (connection_key)
);

-- Index for fast lookups by recipient (for pending requests feed)
CREATE INDEX IF NOT EXISTS idx_conn_requests_recipient
  ON connection_requests (recipient_id, status);

-- Index for fast lookups by requester
CREATE INDEX IF NOT EXISTS idx_conn_requests_requester
  ON connection_requests (requester_id, status);
