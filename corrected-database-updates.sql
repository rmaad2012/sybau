-- CORRECTED database updates for Discovery feature
-- Run these after checking your current schema with check-current-schema.sql

-- Step 1: Add missing columns (these should work)
ALTER TABLE "public"."posts" ADD COLUMN IF NOT EXISTS "media_urls" text[];
ALTER TABLE "public"."posts" ADD COLUMN IF NOT EXISTS "media_type" text;
ALTER TABLE "public"."posts" ADD COLUMN IF NOT EXISTS "content" text;

-- Step 2: Check what text content column exists and copy data appropriately
-- If you have a different text column (like 'description', 'text', etc.), 
-- replace 'your_text_column' with the actual column name

-- First, let's see what text columns exist:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public' 
AND data_type = 'text';

-- Step 3: Set media_type for existing posts based on file column
UPDATE "public"."posts" SET "media_type" = 'video' WHERE "file" LIKE '%postVideos%' AND "media_type" IS NULL;
UPDATE "public"."posts" SET "media_type" = 'image' WHERE "file" LIKE '%postImages%' AND "media_type" IS NULL;

-- Step 4: Copy file paths to media_urls for existing posts
UPDATE "public"."posts" SET "media_urls" = ARRAY["file"] WHERE "media_urls" IS NULL AND "file" IS NOT NULL;

-- Step 5: Verify the changes
SELECT id, file, media_urls, media_type, content FROM "public"."posts" LIMIT 5;
