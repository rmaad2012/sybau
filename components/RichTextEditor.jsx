import { View, Text, StyleSheet, TextInput } from 'react-native'
import React from 'react'
import { theme } from '../constants/theme';

const RichTextEditor = ({
  initialValue,
  editorRef,
  onChange
}) => {

  return (
    <View style={styles.container}>
      <TextInput
        ref={editorRef}
        style={styles.textInput}
        placeholder="What's on your mind?"
        placeholderTextColor={theme.colors.textLight}
        multiline
        textAlignVertical="top"
        onChangeText={onChange}
        value={initialValue}
        maxLength={1000}
        autoCapitalize="sentences"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    minHeight: 285,
    borderWidth: 1.5,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.xl,
    backgroundColor: 'white',
  },
  textInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: theme.colors.textDark,
    minHeight: 280,
    textAlignVertical: 'top',
  }
})

export default RichTextEditor