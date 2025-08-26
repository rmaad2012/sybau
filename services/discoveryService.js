import { supabase } from "../lib/supabase";
import { uploadFile } from "./imageService";

export const createDiscoveryVideo = async (videoData) => {
  try {
    console.log('createDiscoveryVideo called with:', videoData);
    
    // Prepare the discovery video data
    let discoveryData = {
      user_id: videoData.user_id,
      caption: videoData.caption || '',
      hashtags: videoData.hashtags || [],
      location: videoData.location || '',
      audio_source: videoData.audio_source || 'original sound',
      duration: videoData.duration || 0
    };

    // Handle video upload
    if (videoData.file && typeof videoData.file === 'object') {
      console.log('Uploading discovery video:', videoData.file.uri);
      
      let fileResult = await uploadFile('discoveryVideos', videoData.file.uri, false);
      if (fileResult.success) {
        discoveryData.video_url = fileResult.data;
        console.log('Discovery video uploaded successfully:', fileResult.data);
      } else {
        console.log('Discovery video upload failed:', fileResult.msg);
        return fileResult;
      }
    }

    // Create discovery video record
    const { data: discoveryVideo, error: discoveryError } = await supabase
      .from('discovery_videos')
      .insert(discoveryData)
      .select()
      .single();

    if (discoveryError) {
      console.log('discovery video creation error:', discoveryError);
      return { success: false, msg: `Could not create discovery video: ${discoveryError.message}` };
    }

    // Also create a post record for the discovery video
    let postData = {
      user_id: videoData.user_id,
      content: videoData.caption || '',
      media_urls: [discoveryData.video_url],
      media_type: 'video',
      discovery_id: discoveryVideo.id,
      title: 'Discovery Video'
    };

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single();

    if (postError) {
      console.log('post creation error:', postError);
      // If post creation fails, we should clean up the discovery video
      await supabase.from('discovery_videos').delete().eq('id', discoveryVideo.id);
      return { success: false, msg: `Could not create post: ${postError.message}` };
    }

    console.log('Discovery video and post created successfully');
    return { 
      success: true, 
      data: { 
        discoveryVideo, 
        post,
        id: discoveryVideo.id // Return discovery video ID for reference
      }
    };

  } catch (error) {
    console.log('createDiscoveryVideo error:', error);
    return { success: false, msg: `Could not create discovery video: ${error.message}` };
  }
};

export const fetchDiscoveryVideos = async (limit = 20, userId = null) => {
  try {
    console.log('fetchDiscoveryVideos called with limit:', limit, 'userId:', userId);
    
    // First, let's try a simple query without the join
    console.log('Attempting simple query...');
    let simpleQuery = supabase
      .from('discovery_videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      simpleQuery = simpleQuery.eq('user_id', userId);
    }

    const { data: simpleData, error: simpleError } = await simpleQuery;
    
    if (simpleError) {
      console.log('Simple query error:', simpleError);
      return { success: false, msg: `Simple query failed: ${simpleError.message}` };
    }
    
    console.log('Simple query successful, got', simpleData?.length, 'videos');
    
    // Now try the full query with user data
    console.log('Attempting full query with user data...');
    let fullQuery = supabase
      .from('discovery_videos')
      .select(`
        *,
        user: users ( id, name, avatar_url, image )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      fullQuery = fullQuery.eq('user_id', userId);
    }

    const { data, error } = await fullQuery;
    
    if (error) {
      console.log('Full query error:', error);
      // If the full query fails, return the simple data
      console.log('Returning simple data without user info');
      return { success: true, data: simpleData || [] };
    }
    
    console.log('Full query successful, got', data?.length, 'videos with user data');
    return { success: true, data: data || [] };
  } catch (error) {
    console.log('fetchDiscoveryVideos error:', error);
    return { success: false, msg: `Service error: ${error.message}` };
  }
};

export const likeDiscoveryVideo = async (videoId, userId) => {
  try {
    // For now, we'll just log the like action
    // You can implement a proper likes table later
    console.log('User', userId, 'liked discovery video', videoId);
    return { success: true, data: { liked: true } };
  } catch (error) {
    console.log('likeDiscoveryVideo error:', error);
    return { success: false, msg: "Could not like video" };
  }
};

export const dislikeDiscoveryVideo = async (videoId, userId) => {
  try {
    // For now, we'll just log the dislike action
    // You can implement a proper dislikes table later
    console.log('User', userId, 'disliked discovery video', videoId);
    return { success: true, data: { disliked: true } };
  } catch (error) {
    console.log('dislikeDiscoveryVideo error:', error);
    return { success: false, msg: "Could not dislike video" };
  }
};
