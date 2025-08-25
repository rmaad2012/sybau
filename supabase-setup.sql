-- =====================================================
-- FOUNDERRANK SUPABASE COMPLETE SETUP
-- =====================================================
-- This file sets up the complete database structure for FounderRank
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. EXTENSIONS AND BASIC SETUP
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- =====================================================
-- 2. CORE TABLES
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" UNIQUE NOT NULL,
    "image" "text",
    "bio" "text",
    "address" "text",
    "phoneNumber" "text",
    "streak_count" integer DEFAULT 0,
    "badges" text[] DEFAULT '{}',
    "total_votes_received" integer DEFAULT 0,
    "total_votes_given" integer DEFAULT 0,
    "website" "text",
    "twitter" "text",
    "linkedin" "text"
);

-- Posts table
CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "body" "text",
    "file" "text",
    "userId" "uuid" NOT NULL,
    "round_id" bigint,
    "video_duration" integer,
    "file_size" bigint,
    "is_flagged" boolean DEFAULT false
);

-- Comments table
CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "text" "text" NOT NULL,
    "userId" "uuid" NOT NULL,
    "postId" bigint NOT NULL,
    "is_flagged" boolean DEFAULT false
);

-- Votes table (replaces postLikes)
CREATE TABLE IF NOT EXISTS "public"."votes" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "postId" bigint NOT NULL,
    "userId" uuid NOT NULL,
    "value" integer NOT NULL CHECK (value IN (-1, 1)), -- -1 for dislike, 1 for like
    UNIQUE(postId, userId) -- One vote per user per post
);

-- Notifications table
CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "message" "text",
    "type" "text" DEFAULT 'general',
    "senderId" "uuid",
    "receiverId" "uuid" NOT NULL,
    "postId" bigint,
    "commentId" bigint,
    "isRead" boolean DEFAULT false,
    "data" "jsonb"
);

-- Rounds table for pitch competitions
CREATE TABLE IF NOT EXISTS "public"."rounds" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" text NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT false NOT NULL,
    "description" text
);

-- Reports table for moderation
CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "postId" bigint,
    "commentId" bigint,
    "reporterId" uuid NOT NULL,
    "reason" text NOT NULL,
    "status" text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    "admin_notes" text
);

-- Invites table for beta access control
CREATE TABLE IF NOT EXISTS "public"."invites" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" text NOT NULL UNIQUE,
    "invited_by" uuid,
    "is_used" boolean DEFAULT false,
    "expires_at" timestamp with time zone DEFAULT (now() + interval '7 days'),
    "used_at" timestamp with time zone
);

-- =====================================================
-- 3. SEQUENCES
-- =====================================================

-- Create sequences for auto-incrementing IDs
CREATE SEQUENCE IF NOT EXISTS "public"."posts_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS "public"."comments_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS "public"."votes_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS "public"."notifications_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS "public"."rounds_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS "public"."reports_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS "public"."invites_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

-- Set sequences for tables
ALTER TABLE "public"."posts" ALTER COLUMN "id" SET DEFAULT nextval('public.posts_id_seq');
ALTER TABLE "public"."comments" ALTER COLUMN "id" SET DEFAULT nextval('public.comments_id_seq');
ALTER TABLE "public"."votes" ALTER COLUMN "id" SET DEFAULT nextval('public.votes_id_seq');
ALTER TABLE "public"."notifications" ALTER COLUMN "id" SET DEFAULT nextval('public.notifications_id_seq');
ALTER TABLE "public"."rounds" ALTER COLUMN "id" SET DEFAULT nextval('public.rounds_id_seq');
ALTER TABLE "public"."reports" ALTER COLUMN "id" SET DEFAULT nextval('public.reports_id_seq');
ALTER TABLE "public"."invites" ALTER COLUMN "id" SET DEFAULT nextval('public.invites_id_seq');

-- =====================================================
-- 4. PRIMARY KEYS
-- =====================================================

ALTER TABLE ONLY "public"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."posts" ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."comments" ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."votes" ADD CONSTRAINT "votes_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."notifications" ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."rounds" ADD CONSTRAINT "rounds_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."reports" ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."invites" ADD CONSTRAINT "invites_pkey" PRIMARY KEY ("id");

-- =====================================================
-- 5. FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Posts foreign keys
ALTER TABLE ONLY "public"."posts" ADD CONSTRAINT "posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."posts" ADD CONSTRAINT "posts_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE SET NULL;

-- Comments foreign keys
ALTER TABLE ONLY "public"."comments" ADD CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- Votes foreign keys
ALTER TABLE ONLY "public"."votes" ADD CONSTRAINT "votes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."votes" ADD CONSTRAINT "votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- Notifications foreign keys
ALTER TABLE ONLY "public"."notifications" ADD CONSTRAINT "notifications_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."notifications" ADD CONSTRAINT "notifications_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."notifications" ADD CONSTRAINT "notifications_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."notifications" ADD CONSTRAINT "notifications_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."comments"("id") ON DELETE CASCADE;

-- Reports foreign keys
ALTER TABLE ONLY "public"."reports" ADD CONSTRAINT "reports_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."reports" ADD CONSTRAINT "reports_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."comments"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- Invites foreign keys
ALTER TABLE ONLY "public"."invites" ADD CONSTRAINT "invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "public"."users" ("email");
CREATE INDEX IF NOT EXISTS "idx_users_name" ON "public"."users" ("name");

-- Posts indexes
CREATE INDEX IF NOT EXISTS "idx_posts_user" ON "public"."posts" ("userId");
CREATE INDEX IF NOT EXISTS "idx_posts_created" ON "public"."posts" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_posts_round" ON "public"."posts" ("round_id");
CREATE INDEX IF NOT EXISTS "idx_posts_flagged" ON "public"."posts" ("is_flagged");

-- Comments indexes
CREATE INDEX IF NOT EXISTS "idx_comments_post" ON "public"."comments" ("postId");
CREATE INDEX IF NOT EXISTS "idx_comments_user" ON "public"."comments" ("userId");
CREATE INDEX IF NOT EXISTS "idx_comments_created" ON "public"."comments" ("created_at" DESC);

-- Votes indexes
CREATE INDEX IF NOT EXISTS "idx_votes_post_user" ON "public"."votes" ("postId", "userId");
CREATE INDEX IF NOT EXISTS "idx_votes_user" ON "public"."votes" ("userId");
CREATE INDEX IF NOT EXISTS "idx_votes_post" ON "public"."votes" ("postId");

-- Notifications indexes
CREATE INDEX IF NOT EXISTS "idx_notifications_receiver" ON "public"."notifications" ("receiverId");
CREATE INDEX IF NOT EXISTS "idx_notifications_read" ON "public"."notifications" ("isRead");
CREATE INDEX IF NOT EXISTS "idx_notifications_created" ON "public"."notifications" ("created_at" DESC);

-- Rounds indexes
CREATE INDEX IF NOT EXISTS "idx_rounds_active" ON "public"."rounds" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_rounds_dates" ON "public"."rounds" ("start_date", "end_date");

-- Reports indexes
CREATE INDEX IF NOT EXISTS "idx_reports_status" ON "public"."reports" ("status");
CREATE INDEX IF NOT EXISTS "idx_reports_reporter" ON "public"."reports" ("reporterId");

-- Invites indexes
CREATE INDEX IF NOT EXISTS "idx_invites_email" ON "public"."invites" ("email");
CREATE INDEX IF NOT EXISTS "idx_invites_expires" ON "public"."invites" ("expires_at");

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."rounds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."invites" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. RLS POLICIES
-- =====================================================

-- Users policies
CREATE POLICY "Users can view all users" ON "public"."users" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON "public"."users" FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Posts policies
CREATE POLICY "Users can view all posts" ON "public"."posts" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create posts" ON "public"."posts" FOR INSERT TO authenticated WITH CHECK (auth.uid() = userId);
CREATE POLICY "Users can update own posts" ON "public"."posts" FOR UPDATE TO authenticated USING (auth.uid() = userId);
CREATE POLICY "Users can delete own posts" ON "public"."posts" FOR DELETE TO authenticated USING (auth.uid() = userId);

-- Comments policies
CREATE POLICY "Users can view all comments" ON "public"."comments" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create comments" ON "public"."comments" FOR INSERT TO authenticated WITH CHECK (auth.uid() = userId);
CREATE POLICY "Users can update own comments" ON "public"."comments" FOR UPDATE TO authenticated USING (auth.uid() = userId);
CREATE POLICY "Users can delete own comments" ON "public"."comments" FOR DELETE TO authenticated USING (auth.uid() = userId);

-- Votes policies
CREATE POLICY "Users can view all votes" ON "public"."votes" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create votes" ON "public"."votes" FOR INSERT TO authenticated WITH CHECK (auth.uid() = userId);
CREATE POLICY "Users can update own votes" ON "public"."votes" FOR UPDATE TO authenticated USING (auth.uid() = userId);
CREATE POLICY "Users can delete own votes" ON "public"."votes" FOR DELETE TO authenticated USING (auth.uid() = userId);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT TO authenticated USING (auth.uid() = receiverId);
CREATE POLICY "Users can create notifications" ON "public"."notifications" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE TO authenticated USING (auth.uid() = receiverId);

-- Rounds policies
CREATE POLICY "Users can view all rounds" ON "public"."rounds" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can manage rounds" ON "public"."rounds" FOR ALL TO authenticated USING (false);

-- Reports policies
CREATE POLICY "Users can create reports" ON "public"."reports" FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporterId);
CREATE POLICY "Only admins can view reports" ON "public"."reports" FOR SELECT TO authenticated USING (false);
CREATE POLICY "Only admins can update reports" ON "public"."reports" FOR UPDATE TO authenticated USING (false);

-- Invites policies
CREATE POLICY "Only admins can manage invites" ON "public"."invites" FOR ALL TO authenticated USING (false);

-- =====================================================
-- 9. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.users (id, name, email)
  values (new.id, new.raw_user_meta_data ->> 'name', new.email);
  return new;
end;
$$;

-- Function to update vote counts
CREATE OR REPLACE FUNCTION "public"."update_vote_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update post vote count
        UPDATE public.posts 
        SET total_votes_received = total_votes_received + NEW.value
        WHERE id = NEW."postId";
        
        -- Update user vote count
        UPDATE public.users 
        SET total_votes_given = total_votes_given + 1
        WHERE id = NEW."userId";
        
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update post vote count (remove old, add new)
        UPDATE public.posts 
        SET total_votes_received = total_votes_received - OLD.value + NEW.value
        WHERE id = NEW."postId";
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update post vote count
        UPDATE public.posts 
        SET total_votes_received = total_votes_received - OLD.value
        WHERE id = OLD."postId";
        
        -- Update user vote count
        UPDATE public.users 
        SET total_votes_given = total_votes_given - 1
        WHERE id = OLD."userId";
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Function to create notification for votes
CREATE OR REPLACE FUNCTION "public"."create_vote_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.notifications (
            title,
            message,
            type,
            senderId,
            receiverId,
            postId,
            data
        )
        SELECT 
            CASE 
                WHEN NEW.value = 1 THEN 'New Like'
                ELSE 'New Dislike'
            END,
            CASE 
                WHEN NEW.value = 1 THEN u.name || ' liked your post'
                ELSE u.name || ' disliked your post'
            END,
            'vote',
            NEW."userId",
            p."userId",
            NEW."postId",
            jsonb_build_object('voteValue', NEW.value, 'postId', NEW."postId")
        FROM public.posts p
        JOIN public.users u ON u.id = NEW."userId"
        WHERE p.id = NEW."postId";
        
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

-- Function to create notification for comments
CREATE OR REPLACE FUNCTION "public"."create_comment_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.notifications (
            title,
            message,
            type,
            senderId,
            receiverId,
            postId,
            commentId,
            data
        )
        SELECT 
            'New Comment',
            u.name || ' commented on your post',
            'comment',
            NEW."userId",
            p."userId",
            NEW."postId",
            NEW.id,
            jsonb_build_object('commentId', NEW.id, 'postId', NEW."postId")
        FROM public.posts p
        JOIN public.users u ON u.id = NEW."userId"
        WHERE p.id = NEW."postId";
        
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

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

-- Storage policies
CREATE POLICY "Allow public viewing of uploads" ON storage.objects FOR SELECT TO public USING (bucket_id = 'uploads');
CREATE POLICY "Allow authenticated users to upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads');
CREATE POLICY "Allow users to update own uploads" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Allow users to delete own uploads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- 12. REALTIME SETUP
-- =====================================================

-- Enable realtime for all tables
ALTER PUBLICATION "supabase_realtime" ADD TABLE IF NOT EXISTS "public"."users";
ALTER PUBLICATION "supabase_realtime" ADD TABLE IF NOT EXISTS "public"."posts";
ALTER PUBLICATION "supabase_realtime" ADD TABLE IF NOT EXISTS "public"."comments";
ALTER PUBLICATION "supabase_realtime" ADD TABLE IF NOT EXISTS "public"."votes";
ALTER PUBLICATION "supabase_realtime" ADD TABLE IF NOT EXISTS "public"."notifications";
ALTER PUBLICATION "supabase_realtime" ADD TABLE IF NOT EXISTS "public"."rounds";

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

-- Reset all settings
RESET ALL;

-- Success message
SELECT 'FounderRank database setup completed successfully!' as status;
