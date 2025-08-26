import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image as RNImage,
  Alert,
  TouchableOpacity,
  TextInput,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ScreenWrapper from "../../components/ScreenWrapper";
import { hp, wp } from "../../helpers/common";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import {
  getFilePath,
  getSupabaseFileUrl,
  getUserImageSrc,
  uploadFile,
} from "../../services/imageService";
import { Image } from "expo-image";
import RichTextEditor from "../../components/RichTextEditor";
import Button from "../../components/Button";
import {
  AntDesign,
  FontAwesome,
  FontAwesome6,
  Ionicons,
} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Video, AVPlaybackStatus } from "expo-av";
import { createOrUpdatePost } from "../../services/postService";
import { createDiscoveryVideo } from "../../services/discoveryService";
import Header from "../../components/Header";
import { useLocalSearchParams, useRouter } from "expo-router";
import Avatar from "../../components/Avatar";
import Icon from "../../assets/icons";

const NewPost = () => {
  const { user } = useAuth();
  const post = useLocalSearchParams();
  console.log("post: ", post);
  // const videoRef = useRef(null);
  const [file, setFile] = useState(null);
  const [body, setBody] = useState(""); // Changed from ref to state
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState('regular'); // 'regular' or 'discovery'
  const [caption, setCaption] = useState(""); // For discovery videos
  const [hashtags, setHashtags] = useState([]); // For discovery videos
  const [location, setLocation] = useState(""); // For discovery videos
  const editorRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (post && post.id) {
      setBody(post.body || "");
      setFile(post.file || null);
    }
  }, [post]);

  const onPick = async (isImage) => {
    try {
      // No permissions request is necessary for launching the image library
      let mediaConfig = {
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        // base64: true
      };

      if (!isImage) {
        mediaConfig = {
          mediaTypes: ["videos"],
          allowsEditing: true,
          // base64: true
        };
      }
      let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);

      if (!result.canceled) {
        // console.log({...result.assets[0]});
        setFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media. Please try again.');
    }
  };

  const onSubmit = async () => {
    try {
      // validate data
      if (!file) {
        Alert.alert("Post", "Please choose a video or image!");
        return;
      }

      // For discovery videos, ensure it's actually a video
      if (postType === 'discovery') {
        if (!caption.trim()) {
          Alert.alert("Discovery Video", "Please add a caption for your discovery video!");
          return;
        }
        
        // Check if file is a video
        const isVideo = getFileType(file) === 'video';
        if (!isVideo) {
          Alert.alert("Discovery Video", "Discovery videos must be video files, not images!");
          return;
        }
      }

      console.log('Creating post with data:', { 
        postType, 
        body: body.trim(), 
        caption: caption.trim(),
        file, 
        user_id: user?.id 
      });

      setLoading(true);
      let res;

      if (postType === 'discovery') {
        // Create discovery video
        let discoveryData = {
          file,
          user_id: user?.id,
          caption: caption.trim(),
          hashtags: hashtags,
          location: location,
          duration: 0 // You can calculate this later
        };
        res = await createDiscoveryVideo(discoveryData);
      } else {
        // Create regular post
        let data = {
          file,
          body: body.trim(),
          user_id: user?.id,
        };
        if (post && post.id) data.id = post.id;
        res = await createOrUpdatePost(data);
      }

      console.log('Post creation result:', res);
      setLoading(false);
      if (res.success) {
        setFile(null);
        setBody("");
        setCaption("");
        setHashtags([]);
        setLocation("");
        router.back();
      } else {
        Alert.alert("Post", res.msg);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setLoading(false);
      Alert.alert("Error", "Failed to create post. Please try again.");
    }
  };

  const isLocalFile = (file) => {
    if (!file) return null;

    if (typeof file == "object") return true;
    return false;
  };

  const getFileType = (file) => {
    if (!file) return null;

    if (isLocalFile(file)) {
      return file.type;
    }

    if (file.includes("postImages")) {
      return "image";
    }

    return "video";
  };

  const getFileUri = (file) => {
    if (!file) return null;
    if (isLocalFile(file)) {
      return file.uri;
    } else {
      return getSupabaseFileUrl(file)?.uri;
    }
  };

  console.log("file: ", file);

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Icon name="arrowLeft" size={hp(2.5)} color={theme.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Create Post</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={{ gap: 20 }}>
          {/* header */}
          <View style={styles.header}>
            <Avatar
              uri={user?.image}
              size={hp(6.5)}
              rounded={theme.radius.xl}
            />
            {/* <Image source={getUserImageSrc(user?.image)} style={styles.avatar} /> */}
            <View style={{ gap: 2 }}>
              <Text style={styles.username}>{user && user.name}</Text>
              <Text style={styles.publicText}>Public</Text>
            </View>
          </View>
          {/* Post Type Selector */}
          <View style={styles.postTypeSelector}>
            <Text style={styles.postTypeLabel}>Post Type:</Text>
            <View style={styles.postTypeButtons}>
              <Pressable 
                style={[
                  styles.postTypeButton, 
                  postType === 'regular' && styles.postTypeButtonActive
                ]}
                onPress={() => setPostType('regular')}
              >
                <Text style={[
                  styles.postTypeButtonText,
                  postType === 'regular' && styles.postTypeButtonTextActive
                ]}>Regular Post</Text>
              </Pressable>
              <Pressable 
                style={[
                  styles.postTypeButton, 
                  postType === 'discovery' && styles.postTypeButtonActive
                ]}
                onPress={() => setPostType('discovery')}
              >
                <Text style={[
                  styles.postTypeButtonText,
                  postType === 'discovery' && styles.postTypeButtonTextActive
                ]}>Discovery Video</Text>
              </Pressable>
            </View>
          </View>

          {/* Content Input - Different for each post type */}
          {postType === 'regular' ? (
            <View style={styles.textEditor}>
              <RichTextEditor
                editorRef={editorRef}
                onChange={(body) => setBody(body)}
              />
            </View>
          ) : (
            <View style={styles.discoveryInputs}>
              <Text style={styles.inputLabel}>Caption</Text>
              <TextInput
                style={styles.captionInput}
                placeholder="Write a caption for your discovery video..."
                placeholderTextColor={theme.colors.textLight}
                value={caption}
                onChangeText={setCaption}
                multiline
                numberOfLines={3}
              />
              <Text style={styles.inputLabel}>Location (optional)</Text>
              <TextInput
                style={styles.locationInput}
                placeholder="Add location..."
                placeholderTextColor={theme.colors.textLight}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          )}
          {file && (
            <View style={styles.file}>
              {/* {
                  file?.type=='video'? (
                    <Video
                      style={{flex: 1}}
                      source={{
                        uri: file?.uri,
                      }}
                      useNativeControls
                      resizeMode="cover"
                      isLooping
                    />
                  ):(
                    <RNImage source={{uri: file?.uri}} resizeMode='cover' style={{flex: 1}} />
                  )
                } */}

              {getFileType(file) == "video" ? (
                <Video
                  style={{ flex: 1 }}
                  source={{
                    uri: getFileUri(file),
                  }}
                  useNativeControls
                  resizeMode="cover"
                  isLooping
                />
              ) : (
                <Image
                  source={{ uri: getFileUri(file) }}
                  contentFit="cover"
                  style={{ flex: 1 }}
                />
              )}

              <Pressable style={styles.closeIcon} onPress={() => setFile(null)}>
                <AntDesign
                  name="closecircle"
                  size={25}
                  color="rgba(255, 0,0,0.6)"
                />
              </Pressable>
            </View>
          )}
          <View style={styles.media}>
            <Text style={styles.addImageText}>
              {postType === 'discovery' ? 'Add video to your discovery post' : 'Add to your post'}
            </Text>
            <View style={styles.mediaIcons}>
              {postType === 'regular' && (
                <TouchableOpacity onPress={() => onPick(true)}>
                  <Icon name="image" size={30} color={theme.colors.dark} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => onPick(false)}>
                <Icon name="video" size={33} color={theme.colors.dark} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <Button
          buttonStyle={{ height: hp(6.2) }}
          title={post && post.id ? "Update" : "Post"}
          loading={loading}
          hasShadow={false}
          onPress={onSubmit}
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: 'red',
    marginBottom: 30,
    paddingHorizontal: wp(4),
    gap: 15,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingTop: hp(1),
  },
  backButton: {
    padding: wp(2),
    borderRadius: theme.radius.sm,
  },
  headerTitle: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: hp(4.5), // Same width as back button for centering
  },
  title: {
    // marginBottom: 10,
    fontSize: hp(2.5),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  username: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  avatar: {
    height: hp(6.5),
    width: hp(6.5),
    borderRadius: theme.radius.xl,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  publicText: {
    fontSize: hp(1.7),
    fontWeight: theme.fonts.medium,
    color: theme.colors.textLight,
  },

  textEditor: {
    // marginTop: 10,
  },

  media: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    padding: 12,
    paddingHorizontal: 18,
    borderRadius: theme.radius.xl,
    borderCurve: "continuous",
    borderColor: theme.colors.gray,
  },
  mediaIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  addImageText: {
    fontSize: hp(1.9),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  imageIcon: {
    // backgroundColor: theme.colors.gray,
    borderRadius: theme.radius.md,
    // padding: 6,
  },
  file: {
    height: hp(30),
    width: "100%",
    borderRadius: theme.radius.xl,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  video: {},
  closeIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    // shadowColor: theme.colors.textLight,
    // shadowOffset: {width: 0, height: 3},
    // shadowOpacity: 0.6,
    // shadowRadius: 8
  },
  postTypeSelector: {
    marginBottom: 15,
  },
  postTypeLabel: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    marginBottom: 10,
  },
  postTypeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  postTypeButton: {
    flex: 1,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.gray,
    alignItems: 'center',
  },
  postTypeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  postTypeButtonText: {
    fontSize: hp(1.6),
    fontWeight: theme.fonts.medium,
    color: theme.colors.text,
  },
  postTypeButtonTextActive: {
    color: 'white',
  },
  discoveryInputs: {
    gap: 15,
  },
  inputLabel: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.md,
    padding: wp(3),
    fontSize: hp(1.6),
    color: theme.colors.text,
    minHeight: hp(8),
    textAlignVertical: 'top',
  },
  locationInput: {
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.md,
    padding: wp(3),
    fontSize: hp(1.6),
    color: theme.colors.text,
    height: hp(5),
  },
});

export default NewPost;
