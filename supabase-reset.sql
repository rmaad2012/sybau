-- =====================================================
-- FOUNDERRANK DATABASE RESET SCRIPT
-- =====================================================
-- Run this BEFORE running supabase-setup.sql to start fresh
-- This will completely clear your database

-- =====================================================
-- 1. DROP ALL EXISTING TABLES
-- =====================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS "public"."votes" CASCADE;
DROP TABLE IF EXISTS "public"."comments" CASCADE;
DROP TABLE IF EXISTS "public"."notifications" CASCADE;
DROP TABLE IF EXISTS "public"."reports" CASCADE;
DROP TABLE IF EXISTS "public"."posts" CASCADE;
DROP TABLE IF EXISTS "public"."invites" CASCADE;
DROP TABLE IF EXISTS "public"."rounds" CASCADE;
DROP TABLE IF EXISTS "public"."users" CASCADE;

-- =====================================================
-- 2. DROP ALL SEQUENCES
-- =====================================================

DROP SEQUENCE IF EXISTS "public"."votes_id_seq" CASCADE;
DROP SEQUENCE IF EXISTS "public"."comments_id_seq" CASCADE;
DROP SEQUENCE IF EXISTS "public"."notifications_id_seq" CASCADE;
DROP SEQUENCE IF EXISTS "public"."posts_id_seq" CASCADE;
DROP SEQUENCE IF EXISTS "public"."rounds_id_seq" CASCADE;
DROP SEQUENCE IF EXISTS "public"."reports_id_seq" CASCADE;
DROP SEQUENCE IF EXISTS "public"."invites_id_seq" CASCADE;

-- =====================================================
-- 3. DROP ALL FUNCTIONS
-- =====================================================

DROP FUNCTION IF EXISTS "public"."handle_new_user"() CASCADE;
DROP FUNCTION IF EXISTS "public"."update_vote_counts"() CASCADE;
DROP FUNCTION IF EXISTS "public"."create_vote_notification"() CASCADE;
DROP FUNCTION IF EXISTS "public"."create_comment_notification"() CASCADE;

-- =====================================================
-- 4. DROP ALL TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS "createAuthUser" ON "auth"."users" CASCADE;
DROP TRIGGER IF EXISTS "update_vote_counts_trigger" ON "public"."votes" CASCADE;
DROP TRIGGER IF EXISTS "create_vote_notification_trigger" ON "public"."votes" CASCADE;
DROP TRIGGER IF EXISTS "create_comment_notification_trigger" ON "public"."comments" CASCADE;

-- =====================================================
-- 5. DROP ALL POLICIES
-- =====================================================

-- Users policies
DROP POLICY IF EXISTS "Users can view all users" ON "public"."users";
DROP POLICY IF EXISTS "Users can update own profile" ON "public"."users";
DROP POLICY IF EXISTS "Users can insert own profile" ON "public"."users";

-- Posts policies
DROP POLICY IF EXISTS "Users can view all posts" ON "public"."posts";
DROP POLICY IF EXISTS "Users can create posts" ON "public"."posts";
DROP POLICY IF EXISTS "Users can update own posts" ON "public"."posts";
DROP POLICY IF EXISTS "Users can delete own posts" ON "public"."posts";

-- Comments policies
DROP POLICY IF EXISTS "Users can view all comments" ON "public"."comments";
DROP POLICY IF EXISTS "Users can create comments" ON "public"."comments";
DROP POLICY IF EXISTS "Users can update own comments" ON "public"."comments";
DROP POLICY IF EXISTS "Users can delete own comments" ON "public"."comments";

-- Votes policies
DROP POLICY IF EXISTS "Users can view all votes" ON "public"."votes";
DROP POLICY IF EXISTS "Users can create votes" ON "public"."votes";
DROP POLICY IF EXISTS "Users can update own votes" ON "public"."votes";
DROP POLICY IF EXISTS "Users can delete own votes" ON "public"."votes";

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON "public"."notifications";
DROP POLICY IF EXISTS "Users can create notifications" ON "public"."notifications";
DROP POLICY IF EXISTS "Users can update own notifications" ON "public"."notifications";

-- Rounds policies
DROP POLICY IF EXISTS "Users can view all rounds" ON "public"."rounds";
DROP POLICY IF EXISTS "Only admins can manage rounds" ON "public"."rounds";

-- Reports policies
DROP POLICY IF EXISTS "Users can create reports" ON "public"."reports";
DROP POLICY IF EXISTS "Only admins can view reports" ON "public"."reports";
DROP POLICY IF EXISTS "Only admins can update reports" ON "public"."reports";

-- Invites policies
DROP POLICY IF EXISTS "Only admins can manage invites" ON "public"."invites";

-- Legacy policies (if they exist)
DROP POLICY IF EXISTS "Enable read access  on post likes for all users" ON "public"."postLikes";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."notifications";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."posts";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."users";
DROP POLICY IF EXISTS "Enable read access for all users for comments" ON "public"."comments";

-- =====================================================
-- 6. DROP ALL INDEXES
-- =====================================================

-- Users indexes
DROP INDEX IF EXISTS "idx_users_email";
DROP INDEX IF EXISTS "idx_users_name";

-- Posts indexes
DROP INDEX IF EXISTS "idx_posts_user";
DROP INDEX IF EXISTS "idx_posts_created";
DROP INDEX IF EXISTS "idx_posts_round";
DROP INDEX IF EXISTS "idx_posts_flagged";

-- Comments indexes
DROP INDEX IF EXISTS "idx_comments_post";
DROP INDEX IF EXISTS "idx_comments_user";
DROP INDEX IF EXISTS "idx_comments_created";

-- Votes indexes
DROP INDEX IF EXISTS "idx_votes_post_user";
DROP INDEX IF EXISTS "idx_votes_user";
DROP INDEX IF EXISTS "idx_votes_post";

-- Notifications indexes
DROP INDEX IF EXISTS "idx_notifications_receiver";
DROP INDEX IF EXISTS "idx_notifications_read";
DROP INDEX IF EXISTS "idx_notifications_created";

-- Rounds indexes
DROP INDEX IF EXISTS "idx_rounds_active";
DROP INDEX IF EXISTS "idx_rounds_dates";

-- Reports indexes
DROP INDEX IF EXISTS "idx_reports_status";
DROP INDEX IF EXISTS "idx_reports_reporter";

-- Invites indexes
DROP INDEX IF EXISTS "idx_invites_email";
DROP INDEX IF EXISTS "idx_invites_expires";

-- =====================================================
-- 7. CLEAR STORAGE
-- =====================================================

-- Remove all files from storage
DELETE FROM storage.objects WHERE bucket_id = 'uploads';

-- =====================================================
-- 8. CLEAR AUTH USERS (Optional - Uncomment if you want to clear all users)
-- =====================================================

-- WARNING: This will delete ALL users from authentication
-- Uncomment the next line only if you want to start completely fresh
-- DELETE FROM auth.users;

-- =====================================================
-- 9. RESET REALTIME
-- =====================================================

-- Remove all tables from realtime publication
ALTER PUBLICATION "supabase_realtime" DROP TABLE IF EXISTS "public"."users";
ALTER PUBLICATION "supabase_realtime" DROP TABLE IF EXISTS "public"."posts";
ALTER PUBLICATION "supabase_realtime" DROP TABLE IF EXISTS "public"."comments";
ALTER PUBLICATION "supabase_realtime" DROP TABLE IF EXISTS "public"."votes";
ALTER PUBLICATION "supabase_realtime" DROP TABLE IF EXISTS "public"."notifications";
ALTER PUBLICATION "supabase_realtime" DROP TABLE IF EXISTS "public"."rounds";

-- =====================================================
-- 10. FINAL CLEANUP
-- =====================================================

-- Reset all settings
RESET ALL;

-- Success message
SELECT 'Database reset completed successfully! Ready for fresh setup.' as status;
