import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { hp, wp } from '../helpers/common';

const FloatingIconsAnimation = () => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  const phrases = [
    "nahhh youre him brodigyy 🤣",
    "gl twin 👯‍♀️",
    "huzz and the bruzz 🚶‍♂️",
    "sybau😭✌️🥀",
    "who's gonna tell 'em 🥀💔",
    "Yo:Gurt, Gurt: Yo!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.phraseText}>
        {phrases[currentPhraseIndex]}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: hp(30),
    width: wp(100),
    justifyContent: 'center',
    alignItems: 'center',
  },
  phraseText: {
    fontSize: hp(2.8),
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
    paddingHorizontal: wp(4),
    lineHeight: hp(3.5),
  },
});

export default FloatingIconsAnimation;
