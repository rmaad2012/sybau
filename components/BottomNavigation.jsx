import { View, Text, StyleSheet, Pressable, Animated } from 'react-native'
import React, { useRef, useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { hp } from '../helpers/common'
import { theme } from '../constants/theme'

const BottomNavigation = ({ 
  scrollY, 
  onDiscoveryPress, 
  onPostPress, 
  onPeoplePress,
  style 
}) => {
  const insets = useSafeAreaInsets()
  const bottomNavTranslateY = useRef(new Animated.Value(0)).current
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0)
  const scrollDirection = useRef('none')

  useEffect(() => {
    if (scrollY) {
      const listener = scrollY.addListener(({ value }) => {
        const currentScrollY = value
        const previousScrollY = lastScrollY.current
        const scrollDifference = Math.abs(currentScrollY - previousScrollY)
        
        // Only trigger if scroll difference is significant enough (prevents tiny movements)
        if (scrollDifference < 5) return
        
        // Determine scroll direction
        if (currentScrollY > previousScrollY) {
          // Scrolling down
          if (scrollDirection.current !== 'down') {
            scrollDirection.current = 'down'
            // Hide navigation bar immediately when scrolling down
            setIsVisible(false)
            Animated.timing(bottomNavTranslateY, {
              toValue: 300, // Move it completely off screen
              duration: 100,
              useNativeDriver: true,
            }).start()
          }
        } else if (currentScrollY < previousScrollY) {
          // Scrolling up
          if (scrollDirection.current !== 'up') {
            scrollDirection.current = 'up'
            // Show navigation bar immediately when scrolling up
            setIsVisible(true)
            Animated.timing(bottomNavTranslateY, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }).start()
          }
        }
        
        lastScrollY.current = currentScrollY
      })

      return () => scrollY.removeListener(listener)
    }
  }, [scrollY])

  return (
    <Animated.View 
      style={[
        styles.bottomNav, 
        { 
          paddingBottom: insets.bottom,
          transform: [{ translateY: bottomNavTranslateY }],
          ...style
        }
      ]}
    >
      <Pressable style={styles.navItem} onPress={onDiscoveryPress}>
        <Text style={styles.emojiIcon}>🔍</Text>
        <Text style={styles.navText}>Discovery</Text>
      </Pressable>
      
      <Pressable style={styles.navItem} onPress={onPostPress}>
        <Text style={styles.emojiIcon}>✏️</Text>
        <Text style={styles.navText}>Post</Text>
      </Pressable>
      
      <Pressable style={styles.navItem} onPress={onPeoplePress}>
        <Text style={styles.emojiIcon}>👥</Text>
        <Text style={styles.navText}>Discover People</Text>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  navItem: {
    alignItems: 'center',
    gap: 3,
  },
  navText: {
    fontSize: hp(1.1),
    color: theme.colors.text,
    fontWeight: theme.fonts.medium,
  },
  emojiIcon: {
    fontSize: hp(2.2),
  },
})

export default BottomNavigation
