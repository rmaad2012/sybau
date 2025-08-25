# 🚀 FounderRank Supabase Integration Guide

## 📋 Overview
This guide will walk you through setting up Supabase as the backend for your FounderRank app. The app has been fully restored to use real Supabase functionality.

## 🗄️ Database Setup

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Wait for the project to be ready (usually 2-3 minutes)

### Step 2: Run the Complete SQL Setup
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `supabase-setup.sql`
3. Paste and run the SQL script
4. You should see: `FounderRank database setup completed successfully!`

### Step 3: Configure Environment Variables
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon public key**
3. Create a `.env` file in your project root:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 🔐 Authentication Setup

### Step 1: Enable Email Auth
1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. Configure any additional settings (password strength, etc.)

### Step 2: Configure Email Templates (Optional)
1. Go to **Authentication** → **Email Templates**
2. Customize the signup and password reset emails

## 📁 Storage Setup

### Step 1: Storage Bucket
The SQL script automatically creates an `uploads` bucket with:
- **Public access** for viewing files
- **50MB file size limit**
- **Supported formats**: JPEG, PNG, GIF, WebP, MP4, QuickTime, AVI

### Step 2: Storage Policies
Storage policies are automatically configured to:
- Allow public viewing of uploads
- Allow authenticated users to upload
- Allow users to update/delete their own files

## 🔄 Real-time Features

### Step 1: Enable Realtime
The SQL script automatically enables realtime for:
- Users
- Posts
- Comments
- Votes
- Notifications
- Rounds

### Step 2: Verify Realtime
1. Go to **Database** → **Replication**
2. Ensure all tables show as "Active"

## 📊 Database Schema

### Core Tables
- **users**: User profiles and authentication data
- **posts**: User posts with media support
- **comments**: Comments on posts
- **votes**: Like/dislike system (replaces old postLikes)
- **notifications**: Real-time notifications
- **rounds**: Pitch competition rounds
- **reports**: Content moderation
- **invites**: Beta access control

### Key Features
- **Row Level Security (RLS)** enabled on all tables
- **Automatic triggers** for vote counting and notifications
- **Foreign key constraints** for data integrity
- **Performance indexes** for fast queries

## 🚀 App Features

### Authentication
- ✅ User signup/signin
- ✅ Session management
- ✅ Automatic profile creation

### Posts
- ✅ Create/edit/delete posts
- ✅ Media upload (images/videos)
- ✅ Rich text support
- ✅ Real-time updates

### Social Features
- ✅ Like/dislike posts
- ✅ Comment system
- ✅ Real-time notifications
- ✅ User profiles

### Competition System
- ✅ Weekly rounds
- ✅ Leaderboards
- ✅ Vote tracking
- ✅ Progress monitoring

## 🧪 Testing Your Setup

### Step 1: Test Authentication
1. Run your app: `npm start`
2. Try to sign up with a new account
3. Verify the user appears in Supabase **Authentication** → **Users**

### Step 2: Test Database
1. Create a post in your app
2. Check **Table Editor** → **posts** table
3. Verify the post appears with user relationship

### Step 3: Test Real-time
1. Open app in two devices/simulators
2. Create a post on one device
3. Verify it appears instantly on the other

## 🔧 Troubleshooting

### Common Issues

#### 1. "Invalid API key" error
- Verify your `.env` file has correct values
- Check that the key is the **anon public** key, not the service role key

#### 2. "Table doesn't exist" error
- Ensure you ran the complete `supabase-setup.sql` script
- Check that all tables were created successfully

#### 3. "Permission denied" error
- Verify RLS policies are correctly set
- Check that the user is authenticated

#### 4. Real-time not working
- Ensure realtime is enabled in **Database** → **Replication**
- Check that tables are added to the `supabase_realtime` publication

### Debug Steps
1. Check browser console for errors
2. Verify Supabase dashboard shows active connections
3. Test database queries in **SQL Editor**
4. Check **Logs** section for detailed error information

## 📱 App Configuration

### Current Status
- ✅ All services restored to use real Supabase
- ✅ Real-time channels enabled
- ✅ File upload/download working
- ✅ Authentication flow restored
- ✅ Database queries optimized

### Next Steps
1. **Test thoroughly** with real data
2. **Customize** email templates if needed
3. **Add admin features** for managing rounds/reports
4. **Implement analytics** using Supabase's built-in tools

## 🔒 Security Features

### Row Level Security (RLS)
- Users can only see their own notifications
- Users can only modify their own posts/comments
- Admin-only access to reports and invites

### Data Validation
- Input sanitization for posts and comments
- File type and size restrictions
- Profanity filtering support

## 📈 Performance Optimizations

### Database Indexes
- User queries by email and name
- Post queries by user and creation date
- Vote queries by post and user
- Notification queries by receiver and read status

### Real-time Efficiency
- Selective table subscriptions
- Event filtering for notifications
- Optimized payload sizes

## 🎯 Production Considerations

### Environment Variables
- Use different keys for development/production
- Never commit `.env` files to version control
- Use Supabase's environment variable management

### Monitoring
- Enable Supabase analytics
- Monitor database performance
- Set up alerting for errors

### Backup
- Enable point-in-time recovery
- Regular database backups
- Test restore procedures

---

## 🎉 You're All Set!

Your FounderRank app is now fully integrated with Supabase and ready for production use. The database is optimized, secure, and includes all the features needed for a social platform with pitch competitions.

For additional support, check the [Supabase documentation](https://supabase.com/docs) or reach out to the community.
