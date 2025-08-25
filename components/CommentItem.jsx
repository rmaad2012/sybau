import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import Avatar from './Avatar'
import moment from 'moment';
import { theme } from '../constants/theme';
import { hp, wp } from '../helpers/common';
import Icon from '../assets/icons';
import { createVote, removeVote } from '../services/postService';
import { useAuth } from '../contexts/AuthContext';

const CommentItem = ({
    item,
    canDelete=false,
    onDelete=()=>{},
    highlight = false,
}) => {
    const { user } = useAuth();
    const [likes, setLikes] = useState([]);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    const createdAt = moment(item?.created_at).format('MMM D');

    useEffect(() => {
        // Initialize likes from item data
        const commentLikes = item?.votes || [];
        setLikes(commentLikes);
        setLikeCount(commentLikes.filter(like => like.vote_type === 'upvote').length);
        
        // Check if current user liked this comment
        const userLiked = commentLikes.some(like => 
            (like.user_id === user?.id || like.userId === user?.id) && 
            like.vote_type === 'upvote'
        );
        setLiked(userLiked);
    }, [item?.votes, user?.id]);

    const handleLike = async () => {
        if (!user?.id) return;

        try {
            if (liked) {
                // Remove like - pass commentId as the third parameter
                const res = await removeVote(null, user.id, item.id);
                if (res.success) {
                    setLiked(false);
                    setLikeCount(prev => Math.max(0, prev - 1));
                    // Remove from local likes
                    setLikes(prev => prev.filter(like => 
                        !(like.user_id === user.id || like.userId === user.id)
                    ));
                }
            } else {
                // Add like - pass commentId as the fourth parameter
                const res = await createVote(null, user.id, 1, item.id);
                if (res.success) {
                    setLiked(true);
                    setLikeCount(prev => prev + 1);
                    // Add to local likes
                    const newLike = {
                        user_id: user.id,
                        comment_id: item.id,
                        vote_type: 'upvote'
                    };
                    setLikes(prev => [...prev, newLike]);
                }
            }
        } catch (error) {
            console.log('Error handling comment like:', error);
        }
    };

    const handleDelete = ()=>{
        Alert.alert('Confirm', 'Are you sure you want to delete this comment?', [
            {
              text: 'Cancel',
              onPress: () => console.log('Cancel delete'),
              style: 'cancel',
            },
            {
                text: 'Delete', 
                onPress: () => onDelete(item),
                style: 'destructive'
            },
        ]);
    }

    return (
        <View style={styles.container}>
            <Avatar
                uri={item?.user?.avatar_url || item?.user?.image}
                size={hp(4)}
                rounded={theme.radius.md}
            />
            <View style={[styles.content, highlight && styles.highlight]}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                    <View style={styles.nameContainer}>
                        <Text style={styles.text}>{item?.user?.name}</Text>
                        <Text>•</Text>
                        <Text style={[styles.text, {color: theme.colors.textLight}]}>{createdAt}</Text>
                    </View>
                    {
                        canDelete && (
                            <TouchableOpacity onPress={handleDelete}>
                                <Icon name="delete" size={20} color={theme.colors.rose} />
                            </TouchableOpacity>
                        )
                    }
                </View>
                
                <Text style={[styles.text, {fontWeight: 'normal'}]}>
                    {item.content || item.text}
                </Text>

                {/* Comment Like button */}
                <View style={styles.likeContainer}>
                    <TouchableOpacity onPress={handleLike} style={styles.likeButton}>
                        <Icon 
                            name="heart" 
                            size={16} 
                            color={liked ? theme.colors.rose : theme.colors.textLight}
                            fill={liked ? theme.colors.rose : 'transparent'}
                        />
                        <Text style={[styles.likeCount, { color: liked ? theme.colors.rose : theme.colors.textLight }]}>
                            {likeCount}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        gap: 7,
    },
    content: {
        backgroundColor: 'rgba(0,0,0,0.06)',
        flex: 1,
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: theme.radius.md,
        borderCurve: 'continuous',
    },
    highlight: {
        borderWidth: 0.2,
        backgroundColor: 'white',
        borderColor: theme.colors.dark,
        shadowColor: theme.colors.dark,
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    text: {
        fontSize: hp(1.6),
        fontWeight: theme.fonts.medium,
        color: theme.colors.textDark,
    },
    likeContainer: {
        marginTop: 5,
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    likeCount: {
        fontSize: hp(1.4),
        fontWeight: theme.fonts.medium,
    }
})

export default CommentItem;