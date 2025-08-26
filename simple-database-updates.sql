-- Essential database updates for Discovery feature
-- Run these one by one in your Supabase SQL editor

-- Step 1: Add missing columns
ALTER TABLE "public"."posts" ADD COLUMN IF NOT EXISTS "media_urls" text[];
ALTER TABLE "public"."posts" ADD COLUMN IF NOT EXISTS "media_type" text;
ALTER TABLE "public"."posts" ADD COLUMN IF NOT EXISTS "content" text;

-- Step 2: Copy body to content for existing posts
UPDATE "public"."posts" SET "content" = "body" WHERE "content" IS NULL AND "body" IS NOT NULL;

-- Step 3: Set media_type for existing posts based on file path
UPDATE "public"."posts" SET "media_type" = 'video' WHERE "file" LIKE '%postVideos%' AND "media_type" IS NULL;
UPDATE "public"."posts" SET "media_type" = 'image' WHERE "file" LIKE '%postImages%' AND "media_type" IS NULL;

-- Step 4: Copy file paths to media_urls for existing posts
UPDATE "public"."posts" SET "media_urls" = ARRAY["file"] WHERE "media_urls" IS NULL AND "file" IS NOT NULL;

-- Step 5: Verify the changes
SELECT id, body, content, file, media_urls, media_type FROM "public"."posts" LIMIT 5;
