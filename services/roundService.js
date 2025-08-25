import { supabase } from '../lib/supabase';

export const getActiveRound = async () => {
  try {
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting active round:', error);
    return { success: false, error: error.message };
  }
};

export const getAllRounds = async () => {
  try {
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting all rounds:', error);
    return { success: false, error: error.message };
  }
};

export const getRoundById = async (roundId) => {
  try {
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('id', roundId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting round by id:', error);
    return { success: false, error: error.message };
  }
};

export const getRoundStats = async (roundId) => {
  try {
    // Get posts count for this round
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id')
      .eq('round_id', roundId);

    if (postsError) throw postsError;

    // Get total votes for this round
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('value')
      .in('postId', posts.map(p => p.id));

    if (votesError) throw votesError;

    const totalPosts = posts.length;
    const totalVotes = votes.length;
    const totalLikes = votes.filter(v => v.value === 1).length;
    const totalDislikes = votes.filter(v => v.value === -1).length;

    return {
      success: true,
      data: {
        totalPosts,
        totalVotes,
        totalLikes,
        totalDislikes,
        engagement: totalPosts > 0 ? totalVotes / totalPosts : 0
      }
    };
  } catch (error) {
    console.error('Error getting round stats:', error);
    return { success: false, error: error.message };
  }
};

export const getDaysLeft = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export const getRoundProgress = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const totalDuration = end - start;
  const elapsed = now - start;
  
  if (totalDuration <= 0) return 0;
  if (elapsed <= 0) return 0;
  if (elapsed >= totalDuration) return 100;
  
  return Math.round((elapsed / totalDuration) * 100);
};
