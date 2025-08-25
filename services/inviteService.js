import { supabase } from '../lib/supabase';

export const checkInvite = async (email) => {
  try {
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { success: true, data: data || null };
  } catch (error) {
    console.error('Error checking invite:', error);
    return { success: false, error: error.message };
  }
};

export const createInvite = async (email, invitedBy = null) => {
  try {
    const { data, error } = await supabase
      .from('invites')
      .insert({
        email: email.toLowerCase(),
        invited_by: invitedBy,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating invite:', error);
    return { success: false, error: error.message };
  }
};

export const markInviteAsUsed = async (email) => {
  try {
    const { data, error } = await supabase
      .from('invites')
      .update({ 
        is_used: true,
        used_at: new Date()
      })
      .eq('email', email.toLowerCase())
      .eq('is_used', false)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error marking invite as used:', error);
    return { success: false, error: error.message };
  }
};

export const getInvitesByUser = async (invitedBy) => {
  try {
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('invited_by', invitedBy)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting invites by user:', error);
    return { success: false, error: error.message };
  }
};

export const getAllInvites = async () => {
  try {
    const { data, error } = await supabase
      .from('invites')
      .select(`
        *,
        users!invites_invited_by_fkey (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting all invites:', error);
    return { success: false, error: error.message };
  }
};

export const deleteInvite = async (inviteId) => {
  try {
    const { error } = await supabase
      .from('invites')
      .delete()
      .eq('id', inviteId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting invite:', error);
    return { success: false, error: error.message };
  }
};

export const getInviteStats = async () => {
  try {
    const { data, error } = await supabase
      .from('invites')
      .select('is_used, expires_at');

    if (error) throw error;

    const now = new Date();
    const stats = {
      total: data.length,
      used: data.filter(invite => invite.is_used).length,
      unused: data.filter(invite => !invite.is_used).length,
      expired: data.filter(invite => !invite.is_used && new Date(invite.expires_at) < now).length,
      active: data.filter(invite => !invite.is_used && new Date(invite.expires_at) >= now).length
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error getting invite stats:', error);
    return { success: false, error: error.message };
  }
};
