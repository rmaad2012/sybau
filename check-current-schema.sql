-- Check current posts table structure
-- Run this first to see what columns actually exist

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if there are any existing posts
SELECT COUNT(*) as total_posts FROM "public"."posts";

-- Check a sample post to see the structure
SELECT * FROM "public"."posts" LIMIT 1;
