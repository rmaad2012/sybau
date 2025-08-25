import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native'
import React, { useState } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import Header from '../../components/Header'
import { hp, wp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import Icon from '../../assets/icons'

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <Header title="Discovery" showBackButton={false} />
        
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={hp(2.5)} color={theme.colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for posts, people, or topics..."
            placeholderTextColor={theme.colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Placeholder Content */}
        <View style={styles.content}>
          <Text style={styles.placeholderText}>
            Search functionality coming soon!
          </Text>
          <Text style={styles.subText}>
            You'll be able to discover posts, people, and trending topics here.
          </Text>
        </View>
      </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray || '#F5F5F5',
    borderRadius: theme.radius.md || 12,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    marginBottom: hp(3),
  },
  searchInput: {
    flex: 1,
    marginLeft: wp(2),
    fontSize: hp(1.8),
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(4),
  },
  placeholderText: {
    fontSize: hp(2.5),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: hp(1),
  },
  subText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: hp(2.2),
  },
})

export default Search