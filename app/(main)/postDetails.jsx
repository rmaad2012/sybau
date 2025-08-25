import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import PostCard from '../../components/PostCard'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import Icon from '../../assets/icons';
import Loading from '../../components/Loading';
import { createComment, fetchPostDetails, removeComment, removePost } from '../../services/postService';
import { supabase } from '../../lib/supabase';
import CommentItem from '../../components/CommentItem';
import { getUserData } from '../../services/userService';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { createNotification } from '../../services/notificationService';

const PostDetails = () => {
    const {postId, commentId} = useLocalSearchParams();
    console.log('PostDetails received postId:', postId, 'commentId:', commentId);

    const [post, setPost] = useState(null);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const {user} = useAuth();  
    const [commentText, setCommentText] = useState(""); // Changed to state instead of ref
    const inputRef = useRef(null);
    const [startLoading, setStartLoading] = useState(true);
    const MAX_COMMENT_LENGTH = 200;

    const handleNewComment = async payload=>{
        console.log('got new comment: ', payload.new)
        if(payload.new){
            let newComment = {...payload.new};
            let res = await getUserData(newComment.user_id || newComment.userId);
            newComment.user = res.success? res.data: {};
            setPost(prev=> {
                return {
                    ...prev,
                    comments: [newComment, ...prev.comments]
                }
            });
        }
    }

    useEffect(()=>{
        getPostDetails();

        let channel = supabase
        .channel('comments')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'comments',
            filter: `post_id=eq.${postId}`,
        }, handleNewComment)
        .subscribe();

        return ()=>{
            supabase.removeChannel(channel)
        }
    },[]);

    const getPostDetails = async ()=>{
        let res = await fetchPostDetails(postId);
        console.log('Post details response:', res);
        setStartLoading(false);
        if(res.success) setPost(res.data);
    }

    const onNewComment = async ()=>{
        if(!commentText.trim()) {
            Alert.alert('Comment', 'Please add some text to your comment!');
            return null;
        }
        
        let data = {
            user_id: user?.id,
            post_id: post?.id,
            content: commentText.trim(), // Use state value
        };

        setLoading(true);
        let res = await createComment(data);
        setLoading(false);
        console.log('Comment creation result:', res);
        if(res.success){
            if(user.id != (post.user_id || post.userId)){
                // send notification
                let notify = {
                    sender_id: user.id,
                    receiver_id: post.user_id || post.userId,
                    title: 'commented on your post',
                    data: JSON.stringify({post_id: post.id, comment_id: res?.data?.id})
                }
                createNotification(notify);
            }

            // Clear input and reset state
            setCommentText("");
            if (inputRef.current) {
                inputRef.current.clear();
            }
        }else{
            Alert.alert('Comment', res.msg);
        }
    }

    const onDeleteComment = async (comment)=>{
        let res = await removeComment(comment.id);
        if(res.success){
            setPost(prevPost=>{
                let updatedPost = {...prevPost};
                updatedPost.comments = updatedPost.comments.filter(c=> c.id != comment.id);
                return updatedPost;
            })
        }else{
            Alert.alert('Comment', res.msg);
        }
    }

    const onDeletePost = async ()=>{
        let res = await removePost(post.id);
        if(res.success){
            router.back();
        }else{
            Alert.alert('Post', res.msg);
        }
    }
    
    const onEditPost = async ()=>{
        router.back();
        router.push({pathname: 'newPost', params: {...post}});
    }

    if(startLoading){
        return (
            <View style={styles.center}>
                <Loading />
            </View>
        )
    }

    if(!post){
        return (
            <View style={[styles.center, {justifyContent: 'flex-start', marginTop: 100}]}>
                <Text style={styles.notFound}>Post not found !</Text>
            </View>     
        )
        
    }
    
    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                <PostCard
                    item={{...post, comments: [{count: post.comments.length}]}} 
                    currentUser={user}
                    router={router} 
                    showMoreIcon={false}
                    hasShadow={false}
                    showDelete={true}
                    onDelete={onDeletePost}
                    onEdit={onEditPost}
                />

                {/* comment input */}
                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <Input
                            inputRef={inputRef}
                            placeholder='Type comment...'
                            placeholderTextColor={theme.colors.textLight}
                            value={commentText}
                            onChangeText={setCommentText}
                            maxLength={MAX_COMMENT_LENGTH}
                            containerStyle={{flex: 1, height: hp(6.2), borderRadius: theme.radius.xl}}
                        />
                        <Text style={styles.charCount}>
                            {commentText.length}/{MAX_COMMENT_LENGTH}
                        </Text>
                    </View>

                    {
                        loading? (
                            <View style={styles.loading}>
                                <Loading size="small" />
                            </View>
                        ):(
                            <TouchableOpacity 
                                onPress={onNewComment} 
                                style={[
                                    styles.sendIcon, 
                                    !commentText.trim() && styles.sendIconDisabled
                                ]}
                                disabled={!commentText.trim()}
                            >
                                <Icon 
                                    name="send" 
                                    color={!commentText.trim() ? theme.colors.textLight : theme.colors.primaryDark} 
                                />
                            </TouchableOpacity>
                        )
                    }
                </View>

                {/* No comments message - moved higher and styled better */}
                {post?.comments?.length == 0 && (
                    <View style={styles.noCommentsContainer}>
                        <Icon name="comment" size={24} color={theme.colors.textLight} />
                        <Text style={styles.noCommentsText}>Be first to comment!</Text>
                        <Text style={styles.noCommentsSubtext}>Start the conversation</Text>
                    </View>
                )}

                {/* comment list */}
                <View style={[styles.commentList, post?.comments?.length == 0 && styles.commentListEmpty]}>
                    {
                        post?.comments?.map(comment=> 
                            <CommentItem 
                                item={comment} 
                                canDelete={user.id==(comment.user_id || comment.userId) || user.id==(post.user_id || post.userId)}
                                onDelete={onDeleteComment}
                                key={comment.id.toString()} 
                                highlight={comment.id==commentId}
                            />
                        )
                    }
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingVertical: wp(7),
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginVertical: 15,
        paddingBottom: 25, // Add padding to prevent character count overlap
    },
    inputWrapper: {
        flex: 1,
        position: 'relative',
    },
    charCount: {
        position: 'absolute',
        bottom: -20,
        right: 10,
        fontSize: hp(1.2),
        color: theme.colors.textLight,
        backgroundColor: 'white', // Add background to prevent overlap
        paddingHorizontal: 4,
        paddingVertical: 1,
    },
    list: {
        paddingHorizontal: wp(4),
    },
    sendIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0.8,
        borderColor: theme.colors.primary,
        borderRadius: theme.radius.lg,
        borderCurve: 'continuous',
        height: hp(5.8),
        width: hp(5.8)
    },
    sendIconDisabled: {
        borderColor: theme.colors.textLight,
        opacity: 0.5,
    },
    center: {
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center'
    },
    notFound: {
        fontSize: hp(2.5),
        color: theme.colors.text,
        fontWeight: theme.fonts.medium,
    },
    loading: {
        height: hp(5.8), 
        width: hp(5.8), 
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{scale: 1.3}]
    },
    noCommentsContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 15,
        paddingHorizontal: wp(4),
    },
    noCommentsText: {
        fontSize: hp(1.8),
        color: theme.colors.text,
        fontWeight: theme.fonts.medium,
        marginTop: 5,
    },
    noCommentsSubtext: {
        fontSize: hp(1.2),
        color: theme.colors.textLight,
        marginTop: 2,
    },
    commentList: {
        marginVertical: 15,
        gap: 17,
    },
    commentListEmpty: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
})

export default PostDetails