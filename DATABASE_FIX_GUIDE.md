# Database Fix Guide for FounderRank

## Problem Description
The app is not fetching post data, likes, and comments properly. Posts are being created but disappear after refreshing the app. Additionally, comments are not displaying their content, comment liking functionality is missing, and users cannot upload images with their comments.

This indicates issues with:

1. **Database Schema Mismatches** - Column names don't match between app and database
2. **RLS (Row Level Security) Policies** - Posts might not be visible due to restrictive policies
3. **Data Structure Inconsistencies** - App expects different data format than what's stored
4. **Comment Display Issues** - Comments are created but content doesn't show
5. **Missing Comment Like Functionality** - Users can't like comments
6. **Missing Comment Image Support** - Users can't upload images with comments

## Root Causes Identified

### 1. Column Name Mismatches
- App uses `userId` but database uses `user_id`
- App expects `image` but database has `avatar_url`
- App looks for `body` but database stores `content`
- Comments use `text` instead of `content`

### 2. RLS Policy Issues
- Posts might not be visible to all authenticated users
- Policies might be too restrictive

### 3. Data Fetching Issues
- Post service not properly handling column name variations
- Real-time updates not working correctly
- Comment votes not being fetched properly

### 4. Comment Functionality Issues
- Comment content not displaying due to column name mismatch
- Comment like system not implemented
- Missing 200 character limit for comments
- No support for comment image uploads
- Missing storage bucket for comment images
- **No image-specific like functionality**
- **UI layout issues with image sizing and character count overlap**

## Solution Steps

### Step 1: Reset and Recreate Database
Run these SQL scripts in your Supabase SQL Editor in this order:

1. **First, run the reset script:**
```sql
-- Run supabase-reset.sql first
```

2. **Then, run the setup script:**
```sql
-- Run supabase-setup-compatible.sql
```

### Step 2: Verify Database Structure
After running the setup scripts, verify these tables exist with correct structure:

```sql
-- Check posts table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;

-- Check comments table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'comments' 
ORDER BY ordinal_position;

-- Check votes table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'votes' 
ORDER BY ordinal_position;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('posts', 'comments', 'votes');
```

### Step 3: Test Database Connection
Run the test scripts to verify everything is working:

```bash
# Test basic database connectivity
node scripts/test-database.js

# Test comment functionality
node scripts/test-comments.js
```

### Step 4: Verify RLS Policies
Ensure these policies exist and are correct:

```sql
-- Posts should be viewable by all authenticated users
CREATE POLICY "Users can view all posts" ON "public"."posts" 
FOR SELECT TO authenticated USING (true);

-- Users should be able to create posts
CREATE POLICY "Users can create posts" ON "public"."posts" 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Comments should be viewable by all authenticated users
CREATE POLICY "Users can view all comments" ON "public"."comments" 
FOR SELECT TO authenticated USING (true);

-- Users should be able to create comments
CREATE POLICY "Users can create comments" ON "public"."comments" 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Votes should be viewable by all authenticated users
CREATE POLICY "Users can view all votes" ON "public"."votes" 
FOR SELECT TO authenticated USING (true);

-- Users should be able to create votes
CREATE POLICY "Users can create votes" ON "public"."votes" 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
```

## Key Changes Made

### 1. Post Service (`services/postService.js`)
- Fixed column name handling (`user_id` vs `userId`)
- Improved error handling and logging
- Fixed user data fetching (`avatar_url` vs `image`)
- Enhanced comment creation with proper user data fetching
- Updated vote functions to handle both posts and comments
- Added comment sorting by creation date

### 2. PostCard Component (`components/PostCard.jsx`)
- Updated to handle both old and new data structures
- Fixed avatar display logic

### 3. Home Screen (`app/(main)/home.jsx`)
- Improved post fetching logic
- Better real-time update handling
- Added pull-to-refresh functionality
- Fixed user data references

### 4. CommentItem Component (`components/CommentItem.jsx`)
- Fixed comment content display (`content` vs `text`)
- Added comment like functionality with heart icon
- Proper vote handling for comments
- Better user avatar handling

### 5. PostDetails Screen (`app/(main)/postDetails.jsx`)
- Fixed comment creation and display
- Added 200 character limit with counter
- Added **comment image upload functionality**
- Added image picker button and preview
- **Fixed character count overlap with better spacing**
- **Reduced comment image preview size for better UX**
- Improved comment input handling
- Better comment deletion logic
- Enhanced real-time comment updates

### 6. CommentItem Component (`components/CommentItem.jsx`)
- Fixed comment content display (`content` vs `text`)
- Added comment like functionality with heart icon
- Added **comment image display support**
- **Added image-specific like functionality with heart button overlay**
- **Reduced comment image size from hp(20) to hp(15) for better layout**
- **Improved image like button styling with semi-transparent background**
- Proper vote handling for comments
- Better user avatar handling

### 7. Database Schema
- Consistent column naming (`user_id`, `avatar_url`, `content`)
- Added `image_url` column to comments table
- **Added new `image_likes` table for tracking comment image likes**
- Proper RLS policies for public post viewing
- Correct foreign key relationships
- Enhanced vote triggers for both posts and comments
- **New storage bucket for comment images** (`commentImages`)

## Testing the Fix

### 1. Create a Test Post
1. Sign in to the app
2. Go to "New Post"
3. Add some text and create the post
4. Verify it appears in the feed immediately

### 2. Test Comment Functionality
1. Open the post details
2. Type a comment (should see character counter)
3. **Add an image to your comment using the image button**
4. Verify comment appears with content and image
5. Test comment like functionality
6. **Test image-specific like functionality (heart button on image)**
7. Verify comment persists after refresh

### 3. Test Comment Limits and Images
1. Try to type more than 200 characters
2. Verify input is limited
3. Verify character counter works correctly
4. **Test image upload functionality**
5. **Verify image preview appears before posting**
6. **Test removing image before posting**

### 4. Refresh the App
1. Close and reopen the app
2. Sign in again
3. Check if posts and comments are still visible

### 5. Check Real-time Updates
1. Open the app on two devices
2. Create a post/comment on one device
3. Verify it appears on the other device without refresh

## Common Issues and Solutions

### Issue: Comments Still Not Visible
**Solution:** Check comment data structure
```sql
-- Verify comments exist and have content
SELECT id, content, user_id, post_id FROM comments LIMIT 5;
```

### Issue: Comment Likes Not Working
**Solution:** Check vote triggers
```sql
-- Verify vote trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'update_vote_counts_trigger';
```

### Issue: Character Limit Not Working
**Solution:** Check Input component props
- Ensure `maxLength={200}` is passed to TextInput
- Verify character counter is displayed

### Issue: Authentication Errors
**Solution:** Check user creation trigger
```sql
-- Verify trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'createAuthUser';
```

### Issue: Real-time Not Working
**Solution:** Check publication settings
```sql
-- Verify realtime is enabled
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

## Monitoring and Debugging

### 1. Check Console Logs
The updated code includes extensive logging. Check your console for:
- Post creation success/failure
- Comment creation success/failure
- Vote handling success/failure
- Fetch errors
- Real-time event handling

### 2. Database Queries
Use Supabase dashboard to run test queries:
```sql
-- Check if posts exist
SELECT COUNT(*) FROM posts;

-- Check if comments exist
SELECT COUNT(*) FROM comments;

-- Check comment data structure
SELECT c.*, u.name as user_name 
FROM comments c 
JOIN users u ON c.user_id = u.id 
LIMIT 5;

-- Check comment votes
SELECT v.*, c.content 
FROM votes v 
JOIN comments c ON v.comment_id = c.id 
LIMIT 5;
```

### 3. RLS Policy Testing
Test policies with different user contexts:
```sql
-- Test as authenticated user
SET request.jwt.claim.sub = 'test-user-id';
SELECT * FROM comments LIMIT 1;
```

## Final Verification

After implementing all fixes, verify:

1. ✅ Posts are created successfully
2. ✅ Posts appear in feed immediately
3. ✅ Posts persist after app refresh
4. ✅ Comments are created successfully
5. ✅ Comment content is displayed properly
6. ✅ Comment character limit (200) works
7. ✅ Comment likes function properly
8. ✅ **Comment images can be uploaded and displayed**
9. ✅ **Comment image preview works before posting**
10. ✅ **Comment images are properly sized (not too large)**
11. ✅ **Character count doesn't overlap with other elements**
12. ✅ **Image-specific like functionality works (heart button on images)**
13. ✅ Real-time updates work between devices
14. ✅ All users can see all posts and comments (as intended)

## Support

If issues persist after following this guide:

1. Check Supabase logs for errors
2. Verify environment variables are correct
3. Test database connection with the provided test scripts
4. Check RLS policies are properly applied
5. Ensure all SQL scripts ran successfully
6. Verify comment data structure in database

## Files Modified

- `services/postService.js` - Fixed data fetching, column handling, vote functions, and **comment image uploads**
- `components/PostCard.jsx` - Updated data structure handling
- `app/(main)/home.jsx` - Improved post management and real-time updates
- `app/(main)/newPost.jsx` - Fixed column name consistency
- `app/(main)/postDetails.jsx` - Fixed comment functionality, added character limit, and **comment image uploads**
- `components/CommentItem.jsx` - Added comment likes, fixed content display, and **comment image display**
- `components/Input.jsx` - Enhanced with character limit support
- `supabase-setup-compatible.sql` - Updated database schema, policies, triggers, and **comment image support**
- `scripts/test-database.js` - Added database testing utility
- `scripts/test-comments.js` - Added comment functionality testing utility
- `scripts/test-comment-images.js` - Added **comment image functionality testing utility**
