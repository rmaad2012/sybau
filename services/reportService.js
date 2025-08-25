import { supabase } from '../lib/supabase';

export const reportPost = async (postId, reporterId, reason) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        postId,
        reporterId,
        reason
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error reporting post:', error);
    return { success: false, error: error.message };
  }
};

export const reportComment = async (commentId, reporterId, reason) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        commentId,
        reporterId,
        reason
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error reporting comment:', error);
    return { success: false, error: error.message };
  }
};

export const getReports = async (status = 'pending') => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        posts!reports_postId_fkey (
          id,
          body,
          file,
          users!posts_userId_fkey (
            id,
            name,
            email
          )
        ),
        comments!reports_commentId_fkey (
          id,
          text,
          users!comments_userId_fkey (
            id,
            name,
            email
          )
        ),
        users!reports_reporterId_fkey (
          id,
          name,
          email
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting reports:', error);
    return { success: false, error: error.message };
  }
};

export const updateReportStatus = async (reportId, status, adminNotes = '') => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .update({ 
        status,
        admin_notes: adminNotes,
        updated_at: new Date()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating report status:', error);
    return { success: false, error: error.message };
  }
};

export const getReportStats = async () => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('status');

    if (error) throw error;

    const stats = {
      pending: data.filter(r => r.status === 'pending').length,
      reviewed: data.filter(r => r.status === 'reviewed').length,
      resolved: data.filter(r => r.status === 'resolved').length,
      dismissed: data.filter(r => r.status === 'dismissed').length,
      total: data.length
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error getting report stats:', error);
    return { success: false, error: error.message };
  }
};

// Basic profanity filter (can be enhanced with more sophisticated libraries)
export const containsProfanity = (text) => {
  if (!text) return false;
  
  const profanityWords = [
    'badword1', 'badword2', 'badword3' // Add actual profanity words here
  ];
  
  const lowerText = text.toLowerCase();
  return profanityWords.some(word => lowerText.includes(word));
};

export const filterProfanity = (text) => {
  if (!text) return text;
  
  const profanityWords = [
    'badword1', 'badword2', 'badword3' // Add actual profanity words here
  ];
  
  let filteredText = text;
  profanityWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filteredText = filteredText.replace(regex, '*'.repeat(word.length));
  });
  
  return filteredText;
};
