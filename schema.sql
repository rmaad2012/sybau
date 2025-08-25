
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_level_security = off;

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- Create rounds table for pitch competitions
CREATE TABLE IF NOT EXISTS "public"."rounds" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" text NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT false NOT NULL,
    "description" text
);

-- Create votes table to replace postLikes
CREATE TABLE IF NOT EXISTS "public"."votes" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "postId" bigint NOT NULL,
    "userId" uuid NOT NULL,
    "value" integer NOT NULL CHECK (value IN (-1, 1)), -- -1 for dislike, 1 for like
    UNIQUE(postId, userId) -- One vote per user per post
);

-- Create reports table for moderation
CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "postId" bigint,
    "commentId" bigint,
    "reporterId" uuid NOT NULL,
    "reason" text NOT NULL,
    "status" text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed'))
);

-- Create invites table for beta access control
CREATE TABLE IF NOT EXISTS "public"."invites" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" text NOT NULL UNIQUE,
    "invited_by" uuid,
    "is_used" boolean DEFAULT false,
    "expires_at" timestamp with time zone DEFAULT (now() + interval '7 days')
);

-- Update users table to add gamification fields
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "streak_count" integer DEFAULT 0;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "badges" text[] DEFAULT '{}';
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "total_votes_received" integer DEFAULT 0;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "total_votes_given" integer DEFAULT 0;

-- Update posts table to add round_id and video constraints
ALTER TABLE "public"."posts" ADD COLUMN IF NOT EXISTS "round_id" bigint;
ALTER TABLE "public"."posts" ADD COLUMN IF NOT EXISTS "video_duration" integer; -- in seconds
ALTER TABLE "public"."posts" ADD COLUMN IF NOT EXISTS "file_size" bigint; -- in bytes

-- Update comments table to add moderation fields
ALTER TABLE "public"."comments" ADD COLUMN IF NOT EXISTS "is_flagged" boolean DEFAULT false;

-- Create sequences for new tables
CREATE SEQUENCE IF NOT EXISTS "public"."rounds_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS "public"."votes_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS "public"."reports_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS "public"."invites_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

-- Set sequences for new tables
ALTER TABLE "public"."rounds" ALTER COLUMN "id" SET DEFAULT nextval('public.rounds_id_seq');
ALTER TABLE "public"."votes" ALTER COLUMN "id" SET DEFAULT nextval('public.votes_id_seq');
ALTER TABLE "public"."reports" ALTER COLUMN "id" SET DEFAULT nextval('public.reports_id_seq');
ALTER TABLE "public"."invites" ALTER COLUMN "id" SET DEFAULT nextval('public.invites_id_seq');

-- Set ownership
ALTER TABLE "public"."rounds" OWNER TO "postgres";
ALTER TABLE "public"."votes" OWNER TO "postgres";
ALTER TABLE "public"."reports" OWNER TO "postgres";
ALTER TABLE "public"."invites" OWNER TO "postgres";

-- Create primary keys
ALTER TABLE ONLY "public"."rounds" ADD CONSTRAINT "rounds_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."votes" ADD CONSTRAINT "votes_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."reports" ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."invites" ADD CONSTRAINT "invites_pkey" PRIMARY KEY ("id");

-- Create foreign key constraints
ALTER TABLE ONLY "public"."votes" ADD CONSTRAINT "votes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."votes" ADD CONSTRAINT "votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."reports" ADD CONSTRAINT "reports_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."reports" ADD CONSTRAINT "reports_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."comments"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."invites" ADD CONSTRAINT "invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."posts" ADD CONSTRAINT "posts_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_votes_post_user" ON "public"."votes" ("postId", "userId");
CREATE INDEX IF NOT EXISTS "idx_votes_user" ON "public"."votes" ("userId");
CREATE INDEX IF NOT EXISTS "idx_posts_round" ON "public"."posts" ("round_id");
CREATE INDEX IF NOT EXISTS "idx_rounds_active" ON "public"."rounds" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_reports_status" ON "public"."reports" ("status");

-- Create RLS policies for new tables
ALTER TABLE "public"."rounds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."invites" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rounds
CREATE POLICY "Enable read access for all users" ON "public"."rounds" TO "authenticated" USING (true);
CREATE POLICY "Enable insert/update for admins only" ON "public"."rounds" TO "authenticated" USING (false);

-- RLS Policies for votes
CREATE POLICY "Enable read access for all users" ON "public"."votes" TO "authenticated" USING (true);
CREATE POLICY "Enable insert/update for authenticated users" ON "public"."votes" TO "authenticated" USING (true) WITH CHECK (true);

-- RLS Policies for reports
CREATE POLICY "Enable read access for admins only" ON "public"."reports" TO "authenticated" USING (false);
CREATE POLICY "Enable insert for authenticated users" ON "public"."reports" TO "authenticated" USING (true) WITH CHECK (true);

-- RLS Policies for invites
CREATE POLICY "Enable read access for admins only" ON "public"."invites" TO "authenticated" USING (false);
CREATE POLICY "Enable insert for admins only" ON "public"."invites" TO "authenticated" USING (false);

-- Grant permissions
GRANT ALL ON TABLE "public"."rounds" TO "anon";
GRANT ALL ON TABLE "public"."rounds" TO "authenticated";
GRANT ALL ON TABLE "public"."rounds" TO "service_role";

GRANT ALL ON TABLE "public"."votes" TO "anon";
GRANT ALL ON TABLE "public"."votes" TO "authenticated";
GRANT ALL ON TABLE "public"."votes" TO "service_role";

GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";

GRANT ALL ON TABLE "public"."invites" TO "anon";
GRANT ALL ON TABLE "public"."invites" TO "authenticated";
GRANT ALL ON TABLE "public"."invites" TO "service_role";

GRANT ALL ON SEQUENCE "public"."rounds_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rounds_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rounds_id_seq" TO "service_role";

GRANT ALL ON SEQUENCE "public"."votes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."votes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."votes_id_seq" TO "service_role";

GRANT ALL ON SEQUENCE "public"."reports_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."reports_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."reports_id_seq" TO "service_role";

GRANT ALL ON SEQUENCE "public"."invites_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."invites_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."invites_id_seq" TO "service_role";

-- Insert default active round
INSERT INTO "public"."rounds" (name, start_date, end_date, is_active, description) 
VALUES ('Week 1', NOW(), NOW() + INTERVAL '7 days', true, 'First week of pitch competition')
ON CONFLICT DO NOTHING;

-- Keep existing tables and policies
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

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

-- Keep existing tables
CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "text" "text",
    "userId" "uuid",
    "postId" bigint
);

ALTER TABLE "public"."comments" OWNER TO "postgres";

ALTER TABLE "public"."comments" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."comments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "senderId" "uuid",
    "receiverId" "uuid",
    "data" "text"
);

ALTER TABLE "public"."notifications" OWNER TO "postgres";

ALTER TABLE "public"."notifications" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."notifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."postLikes" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "postId" bigint,
    "userId" "uuid"
);

ALTER TABLE "public"."postLikes" OWNER TO "postgres";

ALTER TABLE "public"."postLikes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."postLikes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "body" "text",
    "file" "text",
    "userId" "uuid"
);

ALTER TABLE "public"."posts" OWNER TO "postgres";

ALTER TABLE "public"."posts" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."posts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "image" "text",
    "bio" "text",
    "email" "text",
    "address" "text",
    "phoneNumber" "text"
);

ALTER TABLE "public"."users" OWNER TO "postgres";

-- Keep existing primary keys
ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."postLikes"
    ADD CONSTRAINT "postLikes_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- Keep existing foreign keys
ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."postLikes"
    ADD CONSTRAINT "postLikes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."postLikes"
    ADD CONSTRAINT "postLikes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- Keep existing policies
CREATE POLICY "Enable read access  on post likes for all users" ON "public"."postLikes" TO "authenticated" USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."notifications" TO "authenticated" USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."posts" TO "authenticated" USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."users" TO "authenticated" USING (true);

CREATE POLICY "Enable read access for all users for comments" ON "public"."comments" TO "authenticated" USING (true);

-- Keep existing RLS
ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."postLikes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

-- Keep existing publication
ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."comments";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."posts";

-- Add new tables to realtime
ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."votes";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."rounds";

-- Keep existing grants
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";

GRANT ALL ON SEQUENCE "public"."comments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."comments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."comments_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";

GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."postLikes" TO "anon";
GRANT ALL ON TABLE "public"."postLikes" TO "authenticated";
GRANT ALL ON TABLE "public"."postLikes" TO "service_role";

GRANT ALL ON SEQUENCE "public"."postLikes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."postLikes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."postLikes_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";

GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";

-- Keep existing defaults
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

-- Keep existing trigger
create trigger createAuthUser
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep existing storage policies
INSERT INTO STORAGE.buckets (id, name, public) VALUES('uploads', 'uploads', TRUE)
ON CONFLICT DO NOTHING;

CREATE POLICY "allow all 1va6avm_0" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'uploads');

CREATE POLICY "allow all 1va6avm_1" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "allow all 1va6avm_2" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'uploads');

CREATE POLICY "allow all 1va6avm_3" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'uploads');

RESET ALL;
