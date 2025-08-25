const { createClient } = require('@supabase/supabase-js');

// Test comment functionality
async function testComments() {
  const supabaseUrl = 'https://ppctlownnzfnngqlmrmd.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwY3Rsb3dubnpmbm5ncWxtcm1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5Nzk5NjIsImV4cCI6MjA3MTU1NTk2Mn0.N0WQM2c4rqOdhcxhYlFu0PYF2h5BQUK-_tFgLrGnOQ4';

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log('Testing comment functionality...');

    // Test 1: Check if comments table exists and is accessible
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .limit(5);

    if (commentsError) {
      console.error('❌ Failed to fetch comments:', commentsError);
      return;
    }

    console.log('✅ Comments table accessible');
    console.log(`📝 Found ${comments.length} comments`);

    // Test 2: Check comment structure
    if (comments.length > 0) {
      const sampleComment = comments[0];
      console.log('📋 Sample comment structure:', {
        id: sampleComment.id,
        content: sampleComment.content,
        user_id: sampleComment.user_id,
        post_id: sampleComment.post_id,
        created_at: sampleComment.created_at,
        upvotes: sampleComment.upvotes,
        downvotes: sampleComment.downvotes
      });
    }

    // Test 3: Check votes table for comments
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .not('comment_id', 'is', null)
      .limit(5);

    if (votesError) {
      console.error('❌ Failed to fetch comment votes:', votesError);
    } else {
      console.log('✅ Comment votes accessible');
      console.log(`👍 Found ${votes.length} comment votes`);
    }

    // Test 4: Check RLS policies
    console.log('\n🔒 Checking RLS policies for comments...');
    
    // Test comment creation policy (this will fail for anonymous users, which is expected)
    const { data: testComment, error: createError } = await supabase
      .from('comments')
      .insert({
        content: 'Test comment',
        user_id: '00000000-0000-0000-0000-000000000000',
        post_id: '00000000-0000-0000-0000-000000000000'
      });

    if (createError && createError.code === '42501') {
      console.log('✅ RLS policy working - anonymous users cannot create comments');
    } else if (createError) {
      console.log('ℹ️  Comment creation test result:', createError.message);
    } else {
      console.log('⚠️  Comment creation succeeded unexpectedly');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testComments();
