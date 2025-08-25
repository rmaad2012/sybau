import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image as RNImage,
  Alert,
  TouchableOpacity,
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
      if (!body.trim() && !file) {
        Alert.alert("Post", "Please choose an image or add post body!");
        return;
      }

      console.log('Creating post with data:', { body: body.trim(), file, user_id: user?.id });

      setLoading(true);
      let data = {
        file,
        body: body.trim(),
        user_id: user?.id, // Fixed: use user_id consistently
      };
      if (post && post.id) data.id = post.id;

      console.log('Final post data being sent:', data);

      let res = await createOrUpdatePost(data);
      console.log('Post creation result:', res);
      setLoading(false);
      if (res.success) {
        setFile(null);
        setBody("");
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
        <Header title="Create Post" mb={15} />

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
          <View style={styles.textEditor}>
            <RichTextEditor
              editorRef={editorRef}
              onChange={(body) => setBody(body)}
            />
          </View>
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
            <Text style={styles.addImageText}>Add to your post</Text>
            <View style={styles.mediaIcons}>
              <TouchableOpacity onPress={() => onPick(true)}>
                <Icon name="image" size={30} color={theme.colors.dark} />
              </TouchableOpacity>
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
});

export default NewPost;
