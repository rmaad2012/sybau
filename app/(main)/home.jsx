import { View, Text, Button, Alert, StyleSheet, Pressable, ScrollView, FlatList, Animated } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import {Svg, Circle, Path} from 'react-native-svg';
import { theme } from '../../constants/theme'
import Icon from '../../assets/icons'
import { Image } from 'expo-image'
import { getUserImageSrc } from '../../services/imageService'
import { hp, wp } from '../../helpers/common'
import { useRouter } from 'expo-router'
import { fetchPosts } from '../../services/postService'
import PostCard from '../../components/PostCard'
import Loading from '../../components/Loading'
import { getUserData } from '../../services/userService'
import Avatar from '../../components/Avatar'
import { Octicons } from '@expo/vector-icons';

import BottomNavigation from '../../components/BottomNavigation';

const HomeScreen = () => {
    const {user, setAuth} = useAuth();
    const router = useRouter();

    const [posts, setPosts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [notificationCount, setNotificationCount] = useState(0);
    const [loading, setLoading] = useState(true);
    
    // Add scroll animation ref
    const scrollY = useRef(new Animated.Value(0)).current;

    const handlePostEvent = async (payload)=>{
      console.log('got post event: ', payload);
      if(payload.eventType == 'INSERT' && payload?.new?.id){
        let newPost = {...payload.new};
        // Fetch user data for the new post
        let res = await getUserData(newPost.user_id);
        newPost.user = res.success? res.data: {};
        newPost.votes = []; // Initialize empty votes
        newPost.comments = []; // Initialize empty comments
        setPosts(prevPosts=> [newPost, ...prevPosts]);
      }

      if(payload.eventType == 'DELETE' && payload?.old?.id){
        setPosts(prevPosts=> {
          let updatedPosts = prevPosts.filter(post=> post.id!=payload.old.id);
          return updatedPosts;
        })
      }

      if(payload.eventType == 'UPDATE' && payload?.new?.id){
        setPosts(prevPosts=> {
          let updatedPosts = prevPosts.map(post=> {
            if(post.id==payload.new.id){
              return { ...post, ...payload.new };
            }
            return post;
          });
          return updatedPosts;
        })
      }
    }

    const handleNewNotification = payload=>{
      console.log('got new notification : ', payload);
      if(payload.eventType=='INSERT' && payload?.new?.id){
        setNotificationCount(prev=> prev+1);
      }
    }

    const handleVoteChange = async (payload)=>{
      console.log('got vote change: ', payload);
      if(payload.eventType == 'INSERT' || payload.eventType == 'UPDATE' || payload.eventType == 'DELETE'){
        // Refresh posts to get updated vote counts
        getPosts();
      }
    }

    const getPosts = async ()=>{
      if(!hasMore) return null; // if no more posts then don't call the api
      console.log('fetching posts...');
      setLoading(true);
      
      try {
        let res = await fetchPosts(50); // Increased limit to get more posts
        if(res.success){
          console.log('Posts fetched successfully:', res.data.length);
          setPosts(res.data);
          setHasMore(res.data.length >= 50); // If we got less than 50, there are no more posts
        } else {
          console.log('Failed to fetch posts:', res.msg);
        }
      } catch (error) {
        console.log('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    }

    const refreshPosts = async () => {
      setHasMore(true);
      await getPosts();
    }

    useEffect(()=>{
      // Set up real-time subscriptions
      let postChannel = supabase
      .channel('posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, handlePostEvent)
      .subscribe();

      let notificationChannel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `receiver_id=eq.${user.id}`, }, handleNewNotification)
      .subscribe();

      let votesChannel = supabase
      .channel('votes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, handleVoteChange)
      .subscribe();

      // Initial posts fetch
      getPosts();

      return ()=>{
        supabase.removeChannel(postChannel);
        supabase.removeChannel(notificationChannel);
        supabase.removeChannel(votesChannel);
      }

    },[]);
    
  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        {/* header */}
        <View style={styles.header}>
          <Pressable>
            <Text style={styles.title}>sybau🥀💔</Text>
          </Pressable>
          <View style={styles.icons}>
            <Pressable onPress={()=> {
              setNotificationCount(0);
              router.push('notifications');
            }}>
              <Icon name="heart" size={hp(3.2)} strokeWidth={2} color={theme.colors.text}  />
              {
                notificationCount>0 && (
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{notificationCount}</Text>
                  </View>
                )
              }
            </Pressable>
            <Pressable onPress={()=> router.push('newPost')}>
              <Icon name="plus" size={hp(3.2)} strokeWidth={2} color={theme.colors.text}  />
            </Pressable>
            <Pressable onPress={()=> router.push('profile')}>
              <Avatar 
                uri={user?.avatar_url || user?.image} 
                size={hp(4.3)}
                rounded={theme.radius.sm}
                style={{borderWidth: 2}}
              />
            </Pressable>
          </View>
        </View>

        {/* posts */}
        <Animated.FlatList
          data={posts}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listStyle}
          keyExtractor={(item, index) => item.id.toString()}
          renderItem={({ item }) => <PostCard 
            item={item} 
            currentUser={user}
            router={router} 
          />}
          onEndReached={() => {
            if (hasMore && !loading) {
              getPosts();
            }
          }}
          onEndReachedThreshold={0.1}
          refreshing={loading}
          onRefresh={refreshPosts}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={8}
          ListFooterComponent={hasMore? (
              <View style={{marginVertical: posts.length==0? 200: 30}}>
                <Loading />
              </View>
            ):(
              <View style={{marginVertical: 30}}>
                <Text style={styles.noPosts}>No more posts</Text>
              </View>
            )
          }
          ListEmptyComponent={
            loading ? (
              <View style={{marginVertical: 200}}>
                <Loading />
              </View>
            ) : (
              <View style={{marginVertical: 200}}>
                <Text style={styles.noPosts}>No posts yet. Be the first to share something!</Text>
              </View>
            )
          }
        />
      </View>

      {/* Bottom Navigation Bar */}
      <BottomNavigation
        scrollY={scrollY}
        onDiscoveryPress={() => router.push('search')}
        onPostPress={() => router.push('newPost')}
        onPeoplePress={() => router.push('profile')}
      />
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingHorizontal: wp(4)
    // Removed paddingBottom to allow full content visibility when nav is hidden
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginHorizontal: wp(4)
  },
  title: {
    color: theme.colors.text,
    fontSize: hp(3.2),
    fontWeight: theme.fonts.bold
  },
  avatarImage: {
    height: hp(4.3),
    width: hp(4.3),
    borderRadius: theme.radius.sm,
    borderCurve: 'continuous',
    borderColor: theme.colors.gray,
    borderWidth: 3
  },
  icons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18
  },
  listStyle: {
    paddingTop: 20,
    paddingHorizontal: wp(4),
    paddingBottom: hp(8), // Add some bottom padding for the last items to be visible above nav bar
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: 'center',
    color: theme.colors.text
  },
  pill: {
    position: 'absolute',
    right: -10,
    top: -4,
    height: hp(2.2),
    width: hp(2.2),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: theme.colors.roseLight
  },
  pillText: {
    color: 'white',
    fontSize: hp(1.2),
    fontWeight: theme.fonts.bold
  },

})

export default HomeScreen