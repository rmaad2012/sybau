import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { hp } from '../helpers/common'
import { theme } from '../constants/theme'
import { getUserImageSrc } from '../services/imageService'
import { Image } from 'expo-image'

const Avatar = ({
    uri, 
    size=hp(4.5), 
    rounded=theme.radius.md,
    style={}
}) => {
  // Safely get the image source, handling undefined/null cases
  const imageSource = uri ? getUserImageSrc(uri) : require('../assets/images/defaultUser.png');
  
  return (
    <Image 
        source={imageSource} 
        transition={100}
        style={[styles.avatar, {height: size, width: size, borderRadius: rounded}, style]}
    />
  )
}
const styles = StyleSheet.create({
    avatar: {
        borderCurve: 'continuous',
        borderColor: theme.colors.darkLight,
        borderWidth: 1
    }
})
export default Avatar