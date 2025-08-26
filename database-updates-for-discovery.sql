-- Database updates needed for Discovery feature to work properly
-- Run these commands in your Supabase SQL editor

-- 1. Add missing columns to posts table
ALTER TABLE "public"."posts" 
ADD COLUMN IF NOT EXISTS "media_urls" text[],
ADD COLUMN IF NOT EXISTS "media_type" text,
ADD COLUMN IF NOT EXISTS "content" text,
ADD COLUMN IF NOT EXISTS "title" text;

-- 2. Rename userId column to user_id for consistency
ALTER TABLE "public"."posts" 
RENAME COLUMN "userId" TO "user_id";

-- 3. Copy existing body content to content column for backward compatibility
UPDATE "public"."posts" 
SET "content" = "body" 
WHERE "content" IS NULL AND "body" IS NOT NULL;

-- 4. Update existing posts to have proper media_type based on file column
UPDATE "public"."posts" 
SET "media_type" = CASE 
    WHEN "file" LIKE '%postVideos%' THEN 'video'
    WHEN "file" LIKE '%postImages%' THEN 'image'
    ELSE NULL
END
WHERE "media_type" IS NULL AND "file" IS NOT NULL;

-- 5. Migrate existing file paths to media_urls array for backward compatibility
UPDATE "public"."posts" 
SET "media_urls" = ARRAY["file"]
WHERE "media_urls" IS NULL AND "file" IS NOT NULL;

-- 6. Add indexes for better performance on discovery queries
CREATE INDEX IF NOT EXISTS "idx_posts_media_type" ON "public"."posts" ("media_type");
CREATE INDEX IF NOT EXISTS "idx_posts_created_at" ON "public"."posts" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_posts_user_id" ON "public"."posts" ("user_id");

-- 7. Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."posts";
CREATE POLICY "Enable read access for all users" ON "public"."posts" 
FOR SELECT TO authenticated USING (true);

-- 8. Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_updated_at 
    BEFORE UPDATE ON "public"."posts" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Verify the updates
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;
