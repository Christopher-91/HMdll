-- Migration: Add group chat support to conversations table
-- Run once against the PostgreSQL database.

-- 1. Add the is_group flag (defaults to false so existing DMs are unaffected)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_group BOOLEAN NOT NULL DEFAULT false;

-- 2. Add a display name column for groups
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS name VARCHAR(255) NULL;

-- 3. Drop the old direct_key unique constraint (if it exists) and replace it
--    with a PARTIAL unique index that only enforces uniqueness for non-group
--    conversations. Group chats don't use direct_key at all.
--    Note: The existing constraint name may vary; we handle both possibilities.
DO $$
BEGIN
  -- Try dropping the known constraint name from the original schema
  BEGIN
    ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_direct_key_key;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
END $$;

-- Recreate uniqueness only for DM conversations
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_direct_key_unique
  ON conversations (direct_key)
  WHERE is_group = false AND direct_key IS NOT NULL;

-- 4. Add a role column to conversation_participants if it doesn't exist
--    (it should already exist, but be safe)
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'member';
