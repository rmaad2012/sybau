-- Add company_position field to users table

-- This will store the user's position at their company (e.g., "CEO", "CTO", "Product Manager", etc.)

-- Add the new column
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "company_position" text;

-- Add a comment to describe the field
COMMENT ON COLUMN "public"."users"."company_position" IS 'The user''s position or role at their company (e.g., CEO, CTO, Product Manager, etc.)';

-- Update existing users to have a default value if needed
-- UPDATE "public"."users" SET "company_position" = 'Founder' WHERE "company_position" IS NULL;

-- Grant permissions to the new column
GRANT SELECT, INSERT, UPDATE ON "public"."users" TO "authenticated";
GRANT SELECT ON "public"."users" TO "anon";

-- The column will be included in RLS policies automatically since it's part of the users table
