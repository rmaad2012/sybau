import { View, Text, StyleSheet, Pressable, Dimensions, Animated } from 'react-native'
import { PanGestureHandler, State } from 'react-native-gesture-handler'
import React, { useState, useEffect, useRef } from 'react'

import { hp, wp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import Icon from '../../assets/icons'
import { useRouter } from 'expo-router'
import { fetchDiscoveryVideos } from '../../services/discoveryService'
import { Video } from 'expo-av'
import Avatar from '../../components/Avatar'
import Loading from '../../components/Loading'
import { getSupabaseFileUrl } from '../../services/imageService'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.25;

const Discovery = () => {
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const videoRef = useRef(null);
  const videoQueue = useRef([]);
  const instructionOpacity = useRef(new Animated.Value(0)).current;
  const instructionScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    // Cleanup function to stop video when component unmounts or index changes
    return () => {
      stopCurrentVideo();
    };
  }, [currentIndex]);

  useEffect(() => {
    // Animate instructions when video changes
    if (videos.length > 0 && currentIndex < videos.length) {
      animateInstructions();
    }
  }, [currentIndex, videos.length]);

  // Additional cleanup when component unmounts
  useEffect(() => {
    return () => {
      stopCurrentVideo();
    };
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      console.log('Loading discovery videos...');
      
      const result = await fetchDiscoveryVideos(20); // Fetch discovery videos
      console.log('Discovery service result:', result);
      
      if (result.success) {
        console.log('Discovery videos fetched:', result.data.length);
        console.log('First video data:', result.data[0]);
        setVideos(result.data);
      } else {
        console.error('Discovery service failed:', result.msg);
      }
    } catch (error) {
      console.error('Error loading discovery videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onGestureStart = () => {
    // Immediately pause video when user starts swiping to prevent audio overlap
    if (videoRef.current && isVideoPlaying) {
      videoRef.current.pauseAsync();
      setIsVideoPlaying(false);
    }
  };

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, translationY } = event.nativeEvent;
      
      if (Math.abs(translationX) > SWIPE_THRESHOLD) {
        // Swipe left or right
        const direction = translationX > 0 ? 1 : -1;
        handleSwipe(direction);
      } else if (Math.abs(translationY) > SWIPE_THRESHOLD) {
        // Swipe up or down
        const direction = translationY > 0 ? 1 : -1;
        handleSwipe(direction);
      } else {
        // Return to center
        resetPosition();
      }
    }
  };

  const stopCurrentVideo = async () => {
    if (videoRef.current && isVideoPlaying) {
      try {
        await videoRef.current.stopAsync();
        setIsVideoPlaying(false);
      } catch (error) {
        console.log('Error stopping video:', error);
      }
    }
  };

  const handleSwipe = async (direction) => {
    // Immediately stop current video to prevent audio overlap
    await stopCurrentVideo();

    const swipeOut = Animated.parallel([
      Animated.timing(translateX, {
        toValue: direction * screenWidth * 1.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: direction * screenHeight * 0.3,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: direction * 0.2,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    swipeOut.start(() => {
      // Add a small delay to ensure video is completely stopped before showing next
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        resetPosition();
      }, 100);
    });
  };

  const resetPosition = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLike = () => {
    handleSwipe(1); // Swipe right
  };

  const handleDislike = () => {
    handleSwipe(-1); // Swipe left
  };

  const handleVideoLoad = () => {
    console.log('Video loaded:', currentVideo.video_url);
  };

  const handleVideoPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setIsVideoPlaying(status.isPlaying);
    }
  };

  const handleVideoError = (error) => {
    console.error('Video playback error:', error);
    setIsVideoPlaying(false);
  };

  const animateInstructions = () => {
    // Reset to initial state
    instructionOpacity.setValue(0);
    instructionScale.setValue(0.8);
    
    // Animate in with pop-up effect
    Animated.parallel([
      Animated.timing(instructionOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(instructionScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start(() => {
      // After animation completes, fade out
      setTimeout(() => {
        Animated.timing(instructionOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 1500); // Show for 1.5 seconds before fading
    });
  };

  const currentVideo = videos[currentIndex];

  if (loading) {
    return (
      <View style={styles.fullScreenContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <View style={styles.headerRight}>
            <Pressable style={styles.searchButton}>
              <Icon name="search" size={hp(2.5)} color={theme.colors.textLight} />
            </Pressable>
            <Pressable style={styles.homeButton} onPress={async () => {
              await stopCurrentVideo();
              router.push('home');
            }}>
              <Icon name="home" size={hp(2.5)} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>
        
        <View style={styles.loadingContainer}>
          <Loading />
        </View>
      </View>
    );
  }

  if (!currentVideo) {
    return (
      <View style={styles.fullScreenContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <View style={styles.headerRight}>
            <Pressable style={styles.searchButton}>
              <Icon name="search" size={hp(2.5)} color={theme.colors.textLight} />
            </Pressable>
            <Pressable style={styles.homeButton} onPress={async () => {
              await stopCurrentVideo();
              router.push('home');
            }}>
              <Icon name="home" size={hp(2.5)} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>
        
        <View style={styles.noVideosContainer}>
          <View style={styles.catchUpMessage}>
            <Text style={styles.catchUpText}>You're all caught up ✨</Text>
            <Text style={styles.addMoreText}>Add more videos to keep swiping.</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullScreenContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <View style={styles.headerRight}>
          <Pressable style={styles.searchButton}>
            <Icon name="search" size={hp(2.5)} color={theme.colors.textLight} />
          </Pressable>
          <Pressable style={styles.homeButton} onPress={async () => {
            await stopCurrentVideo();
            router.push('home');
          }}>
            <Icon name="home" size={hp(2.5)} color={theme.colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Founder Info Section */}
      <View style={styles.founderInfo}>
        <View style={styles.founderHeader}>
          <View style={styles.founderLeft}>
            <Avatar 
              uri={currentVideo.user?.avatar_url || currentVideo.user?.image} 
              size={hp(4.5)}
              rounded={theme.radius.full}
            />
            <Text style={styles.founderName}>{currentVideo.user?.name || 'Anonymous'}</Text>
          </View>
          <Text style={styles.founderRole}>{currentVideo.user?.role || 'Founder'}</Text>
        </View>
      </View>

      {/* Video Card */}
      <View style={styles.videoContainer}>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          onBegan={onGestureStart}
        >
          <Animated.View
            style={[
              styles.videoCard,
              {
                transform: [
                  { translateX },
                  { translateY },
                  { scale },
                  { rotate: rotation.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ['-10deg', '10deg']
                  })}
                ]
              }
            ]}
          >
            {/* Video Player */}
            <View style={styles.videoWrapper}>
              {currentVideo.video_url ? (
                <Video
                  ref={videoRef}
                  key={`video-${currentIndex}`}
                  source={{ uri: getSupabaseFileUrl(currentVideo.video_url)?.uri }}
                  style={styles.video}
                  shouldPlay={true}
                  isLooping={true}
                  resizeMode="cover"
                  useNativeControls={false}
                  onError={handleVideoError}
                  onLoad={handleVideoLoad}
                  onPlaybackStatusUpdate={handleVideoPlaybackStatusUpdate}
                />
              ) : (
                <View style={styles.placeholderVideo}>
                  <Text style={styles.placeholderText}>Video not available</Text>
                </View>
              )}
            </View>

            {/* Video Info Overlay */}
            <View style={styles.videoInfo}>
              <View style={styles.userInfo}>
                <View style={styles.userText}>
                  <Text style={styles.userBio}>{currentVideo.caption || 'No caption'}</Text>
                  
                  {/* Hashtags */}
                  {currentVideo.hashtags && currentVideo.hashtags.length > 0 && (
                    <View style={styles.hashtagsContainer}>
                      {currentVideo.hashtags.map((tag, index) => (
                        <Text key={index} style={styles.hashtag}>#{tag}</Text>
                      ))}
                    </View>
                  )}
                  
                  {/* Location */}
                  {currentVideo.location && (
                    <Text style={styles.locationText}>📍 {currentVideo.location}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Like/Dislike Badges */}
            <Animated.View 
              style={[
                styles.likeBadge,
                { opacity: translateX.interpolate({
                  inputRange: [40, 140],
                  outputRange: [0, 1]
                })}
              ]}
            >
              <View style={styles.badge}>
                <Text style={styles.badgeText}>sybau🥀</Text>
              </View>
            </Animated.View>

            <Animated.View 
              style={[
                styles.dislikeBadge,
                { opacity: translateX.interpolate({
                  inputRange: [-140, -40],
                  outputRange: [1, 0]
                })}
              ]}
            >
              <View style={styles.badge}>
                <Text style={styles.badgeText}>cooking🧑‍🍳</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </PanGestureHandler>
      </View>

      {/* Swipe Instructions */}
      <Animated.View 
        style={[
          styles.swipeInstructions,
          {
            opacity: instructionOpacity,
            transform: [{ scale: instructionScale }]
          }
        ]}
      >
        <Text style={styles.instructionText}>← cooking🧑‍🍳🍳</Text>
        <Text style={styles.instructionText}>sybau😭✌️🥀→ </Text>
      </Animated.View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Pressable style={[styles.actionButton, styles.likeButton]} onPress={handleDislike}>
          <Text style={styles.emojiIcon}>🧑‍🍳</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.dislikeButton]} onPress={handleLike}>
          <Text style={styles.emojiIcon}>🥀</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: hp(4), // Reduced padding to move everything up
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(1.5),
    paddingBottom: hp(1),
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  homeButton: {
    padding: wp(2.5),
    borderRadius: theme.radius.sm,
  },
  searchButton: {
    padding: wp(2.5),
  },
  founderInfo: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.2),
    backgroundColor: 'white',
    marginBottom: hp(0.8),
    zIndex: 1000,
    elevation: 5,
  },
  founderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(0.8),
  },
  founderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  founderName: {
    fontSize: hp(2.4),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
  },
  founderRole: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    fontWeight: theme.fonts.medium,
  },
  startupIdea: {
    fontSize: hp(1.4),
    color: theme.colors.text,
    lineHeight: hp(1.8),
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(3),
    paddingTop: hp(0.5),
    zIndex: 1,
  },
  videoCard: {
    width: screenWidth - wp(4),
    height: screenHeight * 0.6,
    borderRadius: theme.radius.xl,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  videoWrapper: {
    flex: 1,
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  placeholderVideo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.gray,
  },
  placeholderText: {
    color: theme.colors.text,
    fontSize: hp(2),
  },
  videoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: wp(4),
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  userText: {
    flex: 1,
  },
  userName: {
    color: 'white',
    fontSize: hp(2),
    fontWeight: 'bold',
    marginBottom: hp(0.5),
  },
  userBio: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: hp(1.6),
    marginBottom: hp(1),
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginBottom: hp(1),
  },
  hashtag: {
    color: theme.colors.roseLight,
    fontSize: hp(1.4),
    fontWeight: theme.fonts.medium,
  },
  locationText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: hp(1.4),
  },
  likeBadge: {
    position: 'absolute',
    top: wp(4),
    right: wp(4),
  },
  dislikeBadge: {
    position: 'absolute',
    top: wp(4),
    left: wp(4),
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    color: 'white',
    fontSize: hp(1.4),
    fontWeight: theme.fonts.semibold,
  },
  swipeInstructions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(8),
    paddingBottom: hp(1.5),
    marginTop: hp(1),
  },
  instructionText: {
    color: theme.colors.textLight,
    fontSize: hp(1.6),
    fontWeight: theme.fonts.medium,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: wp(4),
    paddingBottom: hp(6.5),
    gap: wp(8),
    marginTop: hp(1),
  },
  actionButton: {
    width: hp(7),
    height: hp(7),
    borderRadius: hp(3.5),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  dislikeButton: {
    backgroundColor: theme.colors.roseLight,
  },
  likeButton: {
    backgroundColor: theme.colors.primary,
  },
  emojiIcon: {
    fontSize: hp(3.5),
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  noVideosContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    backgroundColor: 'white',
  },
  catchUpMessage: {
    alignItems: 'center',
    gap: hp(2),
  },
  catchUpText: {
    color: theme.colors.text,
    fontSize: hp(3.2),
    fontWeight: theme.fonts.bold,
    textAlign: 'center',
  },
  addMoreText: {
    color: theme.colors.textLight,
    fontSize: hp(2),
    textAlign: 'center',
    marginTop: hp(1),
  },
});

export default Discovery;
