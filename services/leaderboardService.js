import { supabase } from '../lib/supabase';

export const getWeeklyLeaderboard = async (roundId) => {
  try {
    // Get all posts for the current round with user info and vote counts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        body,
        created_at,
        file,
        userId,
        users!posts_userId_fkey (
          id,
          name,
          image,
          bio,
          streak_count,
          badges
        )
      `)
      .eq('round_id', roundId)
      .order('created_at', { ascending: false });

    if (postsError) throw postsError;

    // Get vote counts for all posts
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('postId, value')
      .in('postId', posts.map(p => p.id));

    if (votesError) throw votesError;

    // Calculate scores for each post
    const postsWithScores = posts.map(post => {
      const postVotes = votes.filter(v => v.postId === post.id);
      const likes = postVotes.filter(v => v.value === 1).length;
      const dislikes = postVotes.filter(v => v.value === -1).length;
      const score = likes - dislikes;
      
      return {
        ...post,
        score,
        likes,
        dislikes,
        totalVotes: postVotes.length
      };
    });

    // Sort by score (descending)
    const sortedPosts = postsWithScores.sort((a, b) => b.score - a.score);

    // Get top 3 for Sunday Drop
    const sundayDrop = sortedPosts.slice(0, 3);

    // Get extended rankings (top 20)
    const extendedRankings = sortedPosts.slice(0, 20);

    return {
      success: true,
      data: {
        sundayDrop,
        extendedRankings,
        totalPosts: posts.length
      }
    };
  } catch (error) {
    console.error('Error getting weekly leaderboard:', error);
    return { success: false, error: error.message };
  }
};

export const getUserRanking = async (userId, roundId) => {
  try {
    // Get all posts for the round with scores
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, userId')
      .eq('round_id', roundId);

    if (postsError) throw postsError;

    // Get votes for all posts
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('postId, value')
      .in('postId', posts.map(p => p.id));

    if (votesError) throw votesError;

    // Calculate scores
    const postsWithScores = posts.map(post => {
      const postVotes = votes.filter(v => v.postId === post.id);
      const likes = postVotes.filter(v => v.value === 1).length;
      const dislikes = postVotes.filter(v => v.value === -1).length;
      return { ...post, score: likes - dislikes };
    });

    // Sort by score
    const sortedPosts = postsWithScores.sort((a, b) => b.score - a.score);

    // Find user's ranking
    const userRanking = sortedPosts.findIndex(post => post.userId === userId) + 1;

    // Get user's posts and their scores
    const userPosts = postsWithScores.filter(post => post.userId === userId);
    const totalUserScore = userPosts.reduce((sum, post) => sum + post.score, 0);

    return {
      success: true,
      data: {
        ranking: userRanking > 0 ? userRanking : 'Not ranked',
        totalScore: totalUserScore,
        postsCount: userPosts.length,
        averageScore: userPosts.length > 0 ? totalUserScore / userPosts.length : 0
      }
    };
  } catch (error) {
    console.error('Error getting user ranking:', error);
    return { success: false, error: error.message };
  }
};

export const getGlobalStats = async () => {
  try {
    // Get total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Get total posts
    const { count: totalPosts, error: postsError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    if (postsError) throw postsError;

    // Get total votes
    const { count: totalVotes, error: votesError } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true });

    if (votesError) throw votesError;

    return {
      success: true,
      data: {
        totalUsers,
        totalPosts,
        totalVotes,
        averageVotesPerPost: totalPosts > 0 ? totalVotes / totalPosts : 0
      }
    };
  } catch (error) {
    console.error('Error getting global stats:', error);
    return { success: false, error: error.message };
  }
};
