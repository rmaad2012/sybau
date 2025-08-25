import { supabase } from "../lib/supabase";
import { uploadFile } from "./imageService";

export const createOrUpdatePost = async (post)=>{
    try{
        console.log('createOrUpdatePost called with:', post);
        
        // Prepare the data object with correct column names
        let postData = {
            user_id: post.userId || post.user_id, // Handle both formats
            content: post.body || post.content,   // Handle both formats
            title: post.title || 'Untitled Post', // Add default title
            media_urls: [], // Initialize empty array
            media_type: null
        };

        console.log('Prepared postData:', postData);

        // Handle file upload if present
        if(post.file && typeof post.file == 'object'){
            // Better file type detection
            let isImage = false;
            if (post.file.type) {
                isImage = post.file.type.startsWith('image');
            } else if (post.file.uri) {
                // Fallback: check file extension
                const uri = post.file.uri.toLowerCase();
                isImage = uri.includes('.jpg') || uri.includes('.jpeg') || 
                         uri.includes('.png') || uri.includes('.gif') || 
                         uri.includes('.webp');
            }
            
            let folderName = isImage? 'postImages': 'postVideos';
            console.log('Uploading file:', post.file.uri, 'isImage:', isImage, 'folder:', folderName);
            
            let fileResult = await uploadFile(folderName, post?.file?.uri, isImage);
            if(fileResult.success) {
                postData.media_urls = [fileResult.data];
                postData.media_type = isImage ? 'image' : 'video';
                console.log('File uploaded successfully:', fileResult.data);
            } else {
                console.log('File upload failed:', fileResult.msg);
                return fileResult;
            }
        }

        // Add ID if updating existing post
        if (post.id) {
            postData.id = post.id;
        }
        
        console.log('Inserting post data into database:', postData);
        
        const { data, error } = await supabase
        .from('posts')
        .upsert(postData)
        .select()
        .single();

        console.log('Database operation result:', { data, error });

        if(error){
            console.log('createPost error: ', error);
            return {success: false, msg: `Could not create your post: ${error.message}`};
        }
        return {success: true, data: data};

    }catch(error){
        console.log('createPost error: ', error);
        return {success: false, msg: `Could not create your post: ${error.message}`};
    }
}

export const fetchPosts = async (limit=10, userId=null)=>{
    try{
        console.log('fetchPosts called with limit:', limit, 'userId:', userId);
        
        let query = supabase
        .from('posts')
        .select(`
            *,
            user: users ( id, name, avatar_url ),
            votes (*),
            comments (*)
        `)
        .order('created_at', {ascending: false })
        .limit(limit);

        if(userId){
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;
        
        if(error){
            console.log('fetchPosts error: ', error);
            return {success: false, msg: "Could not fetch the posts"};
        }
        
        console.log('fetchPosts result:', userId ? `for user: ${userId}` : 'for all users', 'posts found:', data?.length);
        if(data && data.length > 0) {
            console.log('Sample post data:', {
                id: data[0].id,
                title: data[0].title,
                content: data[0].content,
                user_id: data[0].user_id,
                created_at: data[0].created_at,
                user: data[0].user
            });
        }
        
        return {success: true, data: data || []};
    }catch(error){
        console.log('fetchPosts error: ', error);
        return {success: false, msg: "Could not fetch the posts"};
    }
}

export const fetchPostDetails = async (postId)=>{
    try{
        console.log('fetchPostDetails called with postId:', postId);
        
        // First check if the post exists at all
        const { data: postExists, error: existsError } = await supabase
        .from('posts')
        .select('id')
        .eq('id', postId)
        .single();
        
        console.log('Post existence check:', { postExists, existsError });
        
        if (existsError) {
            console.log('Post does not exist or error checking:', existsError);
            return {success: false, msg: "Post not found"};
        }
        
        const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            user: users ( id, name, avatar_url ),
            votes (*),
            comments (
                *,
                user: users(id, name, avatar_url),
                votes (*)
            )
        `)
        .eq('id', postId)
        .single();

        console.log('Supabase query result:', { data, error });

        if(error){
            console.log('postDetails error: ', error);
            return {success: false, msg: "Could not fetch the post"};
        }
        
        // Sort comments by creation date (newest first)
        if (data.comments) {
            data.comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        
        return {success: true, data: data};

    }catch(error){
        console.log('postDetails error: ', error);
        return {success: false, msg: "Could not fetch the post"};
    }
}

export const createComment = async (comment)=>{
    try{
        console.log('Creating comment with data:', comment);
        
        const { data, error } = await supabase
        .from('comments')
        .insert(comment)
        .select(`
            *,
            user: users ( id, name, avatar_url )
        `)
        .single();

        if(error){
            console.log('comment error: ', error);
            return {success: false, msg: "Could not create your comment"};
        }
        
        console.log('Comment created successfully:', data);
        return {success: true, data: data};

    }catch(error){
        console.log('comment error: ', error);
        return {success: false, msg: "Could not create your comment"};
    }
}

export const removeComment = async (commentId)=>{
    try{
        const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

        if(error){
            console.log('removeComment error: ', error);
            return {success: false, msg: "Could not remove the comment"};
        }
        return {success: true, data: {commentId}};

    }catch(error){
        console.log('removeComment error: ', error);
        return {success: false, msg: "Could not remove the comment"};
    }
}

export const removePost = async (postId)=>{
    try{
        const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

        if(error){
            console.log('removePost error: ', error);
            return {success: false, msg: "Could not remove the post"};
        }
        return {success: true, data: {postId}};

    }catch(error){
        console.log('removePost error: ', error);
        return {success: false, msg: "Could not remove the post"};
    }
}

export const createVote = async (postId, userId, value, commentId = null)=>{
    try{
        console.log('createVote called with:', { postId, userId, value, commentId });
        
        // Determine if this is a post vote or comment vote
        const targetId = commentId || postId;
        const targetType = commentId ? 'comment_id' : 'post_id';
        
        // First check if vote already exists
        const { data: existingVote, error: checkError } = await supabase
        .from('votes')
        .select('*')
        .eq(targetType, targetId)
        .eq('user_id', userId)
        .single();

        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }

        if (existingVote) {
            // Update existing vote
            const { data, error } = await supabase
            .from('votes')
            .update({ 
                vote_type: value === 1 ? 'upvote' : 'downvote',
                updated_at: new Date()
            })
            .eq('id', existingVote.id)
            .select()
            .single();

            if(error){
                console.log('vote update error: ', error);
                return {success: false, msg: "Could not update vote"};
            }
            return {success: true, data: data};
        } else {
            // Create new vote
            const voteData = {
                user_id: userId,
                vote_type: value === 1 ? 'upvote' : 'downvote'
            };
            
            if (commentId) {
                voteData.comment_id = commentId;
            } else {
                voteData.post_id = postId;
            }
            
            const { data, error } = await supabase
            .from('votes')
            .insert(voteData)
            .select()
            .single();

            if(error){
                console.log('vote create error: ', error);
                return {success: false, msg: "Could not create vote"};
            }
            return {success: true, data: data};
        }

    }catch(error){
        console.log('vote error: ', error);
        return {success: false, msg: "Could not vote on this item"};
    }
}

export const removeVote = async (postId, userId, commentId = null)=>{
    try{
        const targetId = commentId || postId;
        const targetType = commentId ? 'comment_id' : 'post_id';
        
        const { error } = await supabase
        .from('votes')
        .delete()
        .eq('user_id', userId)
        .eq(targetType, targetId)

        if(error){
            console.log('removeVote error: ', error);
            return {success: false, msg: "Could not remove vote"};
        }
        return {success: true, data: {postId, commentId, userId}};

    }catch(error){
        console.log('removeVote error: ', error);
        return {success: false, msg: "Could not remove vote"};
    }
}

// Legacy functions for backward compatibility
export const createPostLike = async (postId, userId) => {
    return createVote(postId, userId, 1);
};

export const removePostLike = async (postId, userId) => {
    return removeVote(postId, userId);
};