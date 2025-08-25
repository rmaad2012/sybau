-- =====================================================
-- FOUNDERRANK DATABASE SETUP SCRIPT (COMPATIBLE VERSION)
-- =====================================================
-- This script creates the complete database structure for FounderRank
-- Compatible with older PostgreSQL versions
-- Run this AFTER running supabase-reset.sql to start fresh

-- =====================================================
-- 1. EXTENSIONS
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 2. DROP EXISTING TABLES (IF ANY)
-- =====================================================

-- Drop tables in reverse dependency order to avoid foreign key conflicts
DROP TABLE IF EXISTS "public"."votes" CASCADE;
DROP TABLE IF EXISTS "public"."comments" CASCADE;
DROP TABLE IF EXISTS "public"."reports" CASCADE;
DROP TABLE IF EXISTS "public"."notifications" CASCADE;
DROP TABLE IF EXISTS "public"."invites" CASCADE;
DROP TABLE IF EXISTS "public"."posts" CASCADE;
DROP TABLE IF EXISTS "public"."rounds" CASCADE;
DROP TABLE IF EXISTS "public"."users" CASCADE;

-- =====================================================
-- 3. TABLES
-- =====================================================

-- Users table
CREATE TABLE "public"."users" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "email" text NOT NULL,
    "name" text NOT NULL,
    "avatar_url" text,
    "bio" text,
    "website" text,
    "location" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "is_admin" boolean DEFAULT false NOT NULL,
    "is_verified" boolean DEFAULT false NOT NULL,
    "points" integer DEFAULT 0 NOT NULL,
    "rank" text DEFAULT 'Founder' NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Rounds table
CREATE TABLE "public"."rounds" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- Posts table
CREATE TABLE "public"."posts" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "round_id" uuid,
    "title" text NOT NULL,
    "content" text NOT NULL,
    "media_urls" text[],
    "media_type" text,
    "upvotes" integer DEFAULT 0 NOT NULL,
    "downvotes" integer DEFAULT 0 NOT NULL,
    "score" integer DEFAULT 0 NOT NULL,
    "is_flagged" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- Comments table
CREATE TABLE "public"."comments" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "post_id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "content" text NOT NULL,
    "image_url" text, -- Added: support for comment images
    "parent_id" uuid,
    "upvotes" integer DEFAULT 0 NOT NULL,
    "downvotes" integer DEFAULT 0 NOT NULL,
    "score" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- Votes table
CREATE TABLE "public"."votes" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "post_id" uuid,
    "comment_id" uuid,
    "vote_type" text NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "votes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "votes_post_or_comment" CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

-- Image likes table for comment images
CREATE TABLE "public"."image_likes" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "comment_id" uuid NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "image_likes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "image_likes_user_comment_unique" UNIQUE ("user_id", "comment_id")
);

-- Notifications table
CREATE TABLE "public"."notifications" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "receiver_id" uuid NOT NULL,
    "sender_id" uuid,
    "type" text NOT NULL,
    "title" text NOT NULL,
    "message" text NOT NULL,
    "data" jsonb,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Reports table
CREATE TABLE "public"."reports" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "reporter_id" uuid NOT NULL,
    "reported_user_id" uuid,
    "reported_post_id" uuid,
    "reported_comment_id" uuid,
    "reason" text NOT NULL,
    "description" text,
    "status" text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    "admin_notes" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "reports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reports_target_required" CHECK (
        reported_user_id IS NOT NULL OR 
        reported_post_id IS NOT NULL OR 
        reported_comment_id IS NOT NULL
    )
);

-- Invites table
CREATE TABLE "public"."invites" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "email" text NOT NULL,
    "invited_by" uuid NOT NULL,
    "status" text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- =====================================================
-- 4. FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Posts foreign keys
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE SET NULL;

-- Comments foreign keys
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;

-- Votes foreign keys
ALTER TABLE "public"."votes" ADD CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE "public"."votes" ADD CONSTRAINT "votes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;
ALTER TABLE "public"."votes" ADD CONSTRAINT "votes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;

-- Image likes foreign keys
ALTER TABLE "public"."image_likes" ADD CONSTRAINT "image_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE "public"."image_likes" ADD CONSTRAINT "image_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;

-- Notifications foreign keys
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- Reports foreign keys
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_reported_post_id_fkey" FOREIGN KEY ("reported_post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_reported_comment_id_fkey" FOREIGN KEY ("reported_comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;

-- Invites foreign keys
ALTER TABLE "public"."invites" ADD CONSTRAINT "invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- =====================================================
-- 5. UNIQUE CONSTRAINTS (COMPATIBLE VERSION)
-- =====================================================

-- Users unique constraints
ALTER TABLE "public"."users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");

-- Votes unique constraints (simplified for compatibility)
ALTER TABLE "public"."votes" ADD CONSTRAINT "votes_user_post_unique" UNIQUE ("user_id", "post_id");
ALTER TABLE "public"."votes" ADD CONSTRAINT "votes_user_comment_unique" UNIQUE ("user_id", "comment_id");

-- Invites unique constraints
ALTER TABLE "public"."invites" ADD CONSTRAINT "invites_email_unique" UNIQUE ("email");

-- =====================================================
-- 6. INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "public"."users" ("email");
CREATE INDEX IF NOT EXISTS "idx_users_name" ON "public"."users" ("name");

-- Posts indexes
CREATE INDEX IF NOT EXISTS "idx_posts_user" ON "public"."posts" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_posts_created" ON "public"."posts" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_posts_round" ON "public"."posts" ("round_id");
CREATE INDEX IF NOT EXISTS "idx_posts_flagged" ON "public"."posts" ("is_flagged");

-- Comments indexes
CREATE INDEX IF NOT EXISTS "idx_comments_post" ON "public"."comments" ("post_id");
CREATE INDEX IF NOT EXISTS "idx_comments_user" ON "public"."comments" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_comments_created" ON "public"."comments" ("created_at" DESC);

-- Votes indexes
CREATE INDEX IF NOT EXISTS "idx_votes_post_user" ON "public"."votes" ("post_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_votes_user" ON "public"."votes" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_votes_post" ON "public"."votes" ("post_id");

-- Image likes indexes
CREATE INDEX IF NOT EXISTS "idx_image_likes_comment" ON "public"."image_likes" ("comment_id");
CREATE INDEX IF NOT EXISTS "idx_image_likes_user" ON "public"."image_likes" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_image_likes_created" ON "public"."image_likes" ("created_at" DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS "idx_notifications_receiver" ON "public"."notifications" ("receiver_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_read" ON "public"."notifications" ("is_read");
CREATE INDEX IF NOT EXISTS "idx_notifications_created" ON "public"."notifications" ("created_at" DESC);

-- Rounds indexes
CREATE INDEX IF NOT EXISTS "idx_rounds_active" ON "public"."rounds" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_rounds_dates" ON "public"."rounds" ("start_date", "end_date");

-- Reports indexes
CREATE INDEX IF NOT EXISTS "idx_reports_status" ON "public"."reports" ("status");
CREATE INDEX IF NOT EXISTS "idx_reports_reporter" ON "public"."reports" ("reporter_id");

-- Invites indexes
CREATE INDEX IF NOT EXISTS "idx_invites_email" ON "public"."invites" ("email");
CREATE INDEX IF NOT EXISTS "idx_invites_expires" ON "public"."invites" ("expires_at");

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) - COMPATIBLE VERSION
-- =====================================================

-- Enable RLS on all tables (compatible with older PostgreSQL)
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."rounds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."invites" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. RLS POLICIES
-- =====================================================

-- Users policies
CREATE POLICY "Users can view all users" ON "public"."users" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON "public"."users" FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Posts policies - ALLOW PUBLIC VIEWING FOR ALL AUTHENTICATED USERS
CREATE POLICY "Users can view all posts" ON "public"."posts" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create posts" ON "public"."posts" FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON "public"."posts" FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON "public"."posts" FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Users can view all comments" ON "public"."comments" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create comments" ON "public"."comments" FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON "public"."comments" FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON "public"."comments" FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Votes policies
CREATE POLICY "Users can view all votes" ON "public"."votes" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create votes" ON "public"."votes" FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON "public"."votes" FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON "public"."votes" FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Image likes policies
CREATE POLICY "Users can view all image likes" ON "public"."image_likes" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create image likes" ON "public"."image_likes" FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own image likes" ON "public"."image_likes" FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT TO authenticated USING (auth.uid() = receiver_id);
CREATE POLICY "Users can create notifications" ON "public"."notifications" FOR INSERT TO authenticated WITH CHECK (auth.uid() = receiver_id);
CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);

-- Rounds policies
CREATE POLICY "Users can view all rounds" ON "public"."rounds" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can manage rounds" ON "public"."rounds" FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM "public"."users" WHERE id = auth.uid() AND is_admin = true)
);

-- Reports policies
CREATE POLICY "Users can create reports" ON "public"."reports" FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Only admins can view reports" ON "public"."reports" FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM "public"."users" WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Only admins can update reports" ON "public"."reports" FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM "public"."users" WHERE id = auth.uid() AND is_admin = true)
);

-- Invites policies
CREATE POLICY "Only admins can manage invites" ON "public"."invites" FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM "public"."users" WHERE id = auth.uid() AND is_admin = true)
);

-- =====================================================
-- 9. FUNCTIONS
-- =====================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION "public"."handle_new_user"()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO "public"."users" (id, email, name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update vote counts
CREATE OR REPLACE FUNCTION "public"."update_vote_counts"()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update post vote counts
        IF NEW.post_id IS NOT NULL THEN
            UPDATE "public"."posts" 
            SET 
                upvotes = (SELECT COUNT(*) FROM "public"."votes" WHERE post_id = NEW.post_id AND vote_type = 'upvote'),
                downvotes = (SELECT COUNT(*) FROM "public"."votes" WHERE post_id = NEW.post_id AND vote_type = 'downvote'),
                score = (SELECT COUNT(*) FROM "public"."votes" WHERE post_id = NEW.post_id AND vote_type = 'upvote') - 
                        (SELECT COUNT(*) FROM "public"."votes" WHERE post_id = NEW.post_id AND vote_type = 'downvote'),
                updated_at = NOW()
            WHERE id = NEW.post_id;
        END IF;
        
        -- Update comment vote counts
        IF NEW.comment_id IS NOT NULL THEN
            UPDATE "public"."comments" 
            SET 
                upvotes = (SELECT COUNT(*) FROM "public"."votes" WHERE comment_id = NEW.comment_id AND vote_type = 'upvote'),
                downvotes = (SELECT COUNT(*) FROM "public"."votes" WHERE comment_id = NEW.comment_id AND vote_type = 'downvote'),
                score = (SELECT COUNT(*) FROM "public"."votes" WHERE comment_id = NEW.comment_id AND vote_type = 'upvote') - 
                        (SELECT COUNT(*) FROM "public"."votes" WHERE comment_id = NEW.comment_id AND vote_type = 'downvote'),
                updated_at = NOW()
            WHERE id = NEW.comment_id;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update post vote counts after deletion
        IF OLD.post_id IS NOT NULL THEN
            UPDATE "public"."posts" 
            SET 
                upvotes = (SELECT COUNT(*) FROM "public"."votes" WHERE post_id = OLD.post_id AND vote_type = 'upvote'),
                downvotes = (SELECT COUNT(*) FROM "public"."votes" WHERE post_id = OLD.post_id AND vote_type = 'downvote'),
                score = (SELECT COUNT(*) FROM "public"."votes" WHERE post_id = OLD.post_id AND vote_type = 'upvote') - 
                        (SELECT COUNT(*) FROM "public"."votes" WHERE post_id = OLD.post_id AND vote_type = 'downvote'),
                updated_at = NOW()
            WHERE id = OLD.post_id;
        END IF;
        
        -- Update comment vote counts after deletion
        IF OLD.comment_id IS NOT NULL THEN
            UPDATE "public"."comments" 
            SET 
                upvotes = (SELECT COUNT(*) FROM "public"."votes" WHERE comment_id = OLD.comment_id AND vote_type = 'upvote'),
                downvotes = (SELECT COUNT(*) FROM "public"."votes" WHERE comment_id = OLD.comment_id AND vote_type = 'downvote'),
                score = (SELECT COUNT(*) FROM "public"."votes" WHERE comment_id = OLD.comment_id AND vote_type = 'upvote') - 
                        (SELECT COUNT(*) FROM "public"."votes" WHERE comment_id = OLD.comment_id AND vote_type = 'downvote'),
                updated_at = NOW()
            WHERE id = OLD.comment_id;
        END IF;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create vote notifications
CREATE OR REPLACE FUNCTION "public"."create_vote_notification"()
RETURNS TRIGGER AS $$
DECLARE
    post_title text;
    comment_content text;
    notification_title text;
    notification_message text;
BEGIN
    IF NEW.vote_type = 'upvote' THEN
        -- Get post title or comment content
        IF NEW.post_id IS NOT NULL THEN
            SELECT title INTO post_title FROM "public"."posts" WHERE id = NEW.post_id;
            notification_title = 'New Upvote!';
            notification_message = 'Someone upvoted your post: ' || COALESCE(post_title, 'Untitled Post');
        ELSIF NEW.comment_id IS NOT NULL THEN
            SELECT content INTO comment_content FROM "public"."comments" WHERE id = NEW.comment_id;
            notification_title = 'New Upvote!';
            notification_message = 'Someone upvoted your comment: ' || COALESCE(comment_content, 'Comment');
        END IF;
        
        -- Create notification for post/comment owner
        IF NEW.post_id IS NOT NULL THEN
            INSERT INTO "public"."notifications" (receiver_id, sender_id, type, title, message, data)
            SELECT 
                user_id, 
                NEW.user_id, 
                'vote', 
                notification_title, 
                notification_message,
                jsonb_build_object('post_id', NEW.post_id, 'vote_type', NEW.vote_type)
            FROM "public"."posts" 
            WHERE id = NEW.post_id AND user_id != NEW.user_id;
        ELSIF NEW.comment_id IS NOT NULL THEN
            INSERT INTO "public"."notifications" (receiver_id, sender_id, type, title, message, data)
            SELECT 
                user_id, 
                NEW.user_id, 
                'vote', 
                notification_title, 
                notification_message,
                jsonb_build_object('comment_id', NEW.comment_id, 'vote_type', NEW.vote_type)
            FROM "public"."comments" 
            WHERE id = NEW.comment_id AND user_id != NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create comment notifications
CREATE OR REPLACE FUNCTION "public"."create_comment_notification"()
RETURNS TRIGGER AS $$
DECLARE
    post_title text;
    commenter_name text;
BEGIN
    -- Get post title and commenter name
    SELECT p.title, u.name INTO post_title, commenter_name
    FROM "public"."posts" p
    JOIN "public"."users" u ON u.id = NEW.user_id
    WHERE p.id = NEW.post_id;
    
    -- Create notification for post owner (if not commenting on own post)
    IF NEW.user_id != (SELECT user_id FROM "public"."posts" WHERE id = NEW.post_id) THEN
        INSERT INTO "public"."notifications" (receiver_id, sender_id, type, title, message, data)
        VALUES (
            (SELECT user_id FROM "public"."posts" WHERE id = NEW.post_id),
            NEW.user_id,
            'comment',
            'New Comment!',
            commenter_name || ' commented on your post: ' || COALESCE(post_title, 'Untitled Post'),
            jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. TRIGGERS
-- =====================================================

-- Trigger for new user creation
DROP TRIGGER IF EXISTS "createAuthUser" ON "auth"."users";
CREATE TRIGGER "createAuthUser"
    AFTER INSERT ON "auth"."users"
    FOR EACH ROW EXECUTE PROCEDURE "public"."handle_new_user"();

-- Trigger for vote count updates
DROP TRIGGER IF EXISTS "update_vote_counts_trigger" ON "public"."votes";
CREATE TRIGGER "update_vote_counts_trigger"
    AFTER INSERT OR UPDATE OR DELETE ON "public"."votes"
    FOR EACH ROW EXECUTE PROCEDURE "public"."update_vote_counts"();

-- Trigger for vote notifications
DROP TRIGGER IF EXISTS "create_vote_notification_trigger" ON "public"."votes";
CREATE TRIGGER "create_vote_notification_trigger"
    AFTER INSERT ON "public"."votes"
    FOR EACH ROW EXECUTE PROCEDURE "public"."create_vote_notification"();

-- Trigger for comment notifications
DROP TRIGGER IF EXISTS "create_comment_notification_trigger" ON "public"."comments";
CREATE TRIGGER "create_comment_notification_trigger"
    AFTER INSERT ON "public"."comments"
    FOR EACH ROW EXECUTE PROCEDURE "public"."create_comment_notification"();

-- =====================================================
-- 11. STORAGE SETUP
-- =====================================================

-- Create storage bucket for uploads
INSERT INTO STORAGE.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'uploads', 
    'uploads', 
    TRUE, 
    52428800, -- 50MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo']
) ON CONFLICT DO NOTHING;

-- Create storage bucket for comment images
INSERT INTO STORAGE.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'commentImages', 
    'commentImages', 
    TRUE, 
    10485760, -- 10MB limit for comment images
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT DO NOTHING;

-- Storage policies for uploads bucket
CREATE POLICY "Allow public viewing of uploads" ON storage.objects FOR SELECT TO public USING (bucket_id = 'uploads');
CREATE POLICY "Allow authenticated users to upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads');
CREATE POLICY "Allow users to update own uploads" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Allow users to delete own uploads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for commentImages bucket
CREATE POLICY "Allow public viewing of comment images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'commentImages');
CREATE POLICY "Allow authenticated users to upload comment images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'commentImages');
CREATE POLICY "Allow users to update own comment images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'commentImages' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Allow users to delete own comment images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'commentImages' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- 12. REALTIME SETUP (COMPATIBLE VERSION)
-- =====================================================

-- Enable realtime for all tables (compatible with older PostgreSQL)
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."users";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."posts";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."comments";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."votes";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."notifications";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."rounds";

-- =====================================================
-- 13. SAMPLE DATA
-- =====================================================

-- Insert default active round
INSERT INTO "public"."rounds" (name, start_date, end_date, is_active, description) 
VALUES (
    'Week 1', 
    NOW(), 
    NOW() + INTERVAL '7 days', 
    true, 
    'First week of pitch competition - Share your startup ideas!'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 14. PERMISSIONS
-- =====================================================

-- Grant permissions to all roles
GRANT USAGE ON SCHEMA "public" TO "postgres", "anon", "authenticated", "service_role";
GRANT ALL ON ALL TABLES IN SCHEMA "public" TO "postgres", "anon", "authenticated", "service_role";
GRANT ALL ON ALL SEQUENCES IN SCHEMA "public" TO "postgres", "anon", "authenticated", "service_role";
GRANT ALL ON ALL FUNCTIONS IN SCHEMA "public" TO "postgres", "anon", "authenticated", "service_role";

-- =====================================================
-- 15. FINAL SETUP
-- =====================================================

-- Success message
SELECT 'FounderRank database setup completed successfully!' as status;


