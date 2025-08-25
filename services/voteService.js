import { supabase } from '../lib/supabase';

export const voteOnPost = async (postId, userId, value) => {
  try {
    console.log('voteOnPost called with:', { postId, userId, value });
    
    // Check if user already voted on this post
    const { data: existingVote, error: checkError } = await supabase
      .from('votes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    console.log('Existing vote check:', { existingVote, checkError });

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingVote) {
      console.log('Updating existing vote...');
      // Update existing vote
      const { data, error } = await supabase
        .from('votes')
        .update({ vote_type: value === 1 ? 'upvote' : 'downvote', updated_at: new Date() })
        .eq('id', existingVote.id)
        .select()
        .single();

      if (error) throw error;
      console.log('Vote updated successfully:', data);
      return { success: true, data, isUpdate: true };
    } else {
      console.log('Creating new vote...');
      // Create new vote
      const { data, error } = await supabase
        .from('votes')
        .insert({ 
          post_id: postId, 
          user_id: userId, 
          vote_type: value === 1 ? 'upvote' : 'downvote' 
        })
        .select()
        .single();

      if (error) throw error;
      console.log('Vote created successfully:', data);
      return { success: true, data, isUpdate: false };
    }
  } catch (error) {
    console.error('Error voting on post:', error);
    return { success: false, error: error.message };
  }
};

export const getPostVotes = async (postId) => {
  try {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('post_id', postId);

    if (error) throw error;

    const likes = data.filter(vote => vote.vote_type === 'upvote').length;
    const dislikes = data.filter(vote => vote.vote_type === 'downvote').length;
    const total = likes - dislikes;

    return { 
      success: true, 
      data: { 
        votes: data, 
        likes, 
        dislikes, 
        total,
        count: data.length 
      } 
    };
  } catch (error) {
    console.error('Error getting post votes:', error);
    return { success: false, error: error.message };
  }
};

export const getUserVote = async (postId, userId) => {
  try {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { success: true, data: data || null };
  } catch (error) {
    console.error('Error getting user vote:', error);
    return { success: false, error: error.message };
  }
};

export const removeVote = async (postId, userId) => {
  try {
    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error removing vote:', error);
    return { success: false, error: error.message };
  }
};

// Legacy functions for backward compatibility
export const createVote = async (voteData) => {
  return voteOnPost(voteData.postId, voteData.userId, voteData.value);
};

export const updateVote = async (voteId, value) => {
  try {
    const { data, error } = await supabase
      .from('votes')
      .update({ value, updated_at: new Date() })
      .eq('id', voteId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating vote:', error);
    return { success: false, error: error.message };
  }
};
