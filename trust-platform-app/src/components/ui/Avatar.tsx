import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  name: string;
  uri?: string;
  size?: AvatarSize;
  verified?: boolean;
  badge?: 'verified';
  style?: ViewStyle;
}

const sizeMap: Record<AvatarSize, number> = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 80,
};

export const Avatar: React.FC<AvatarProps> = React.memo(({
  name,
  uri,
  size = 'md',
  verified = false,
  badge,
  style,
}) => {
  const isVerified = verified || badge === 'verified';
  const dimension = sizeMap[size];
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const containerStyle: ViewStyle[] = [
    styles.container,
    {
      width: dimension,
      height: dimension,
      borderRadius: dimension / 2,
    },
    style ?? {},
  ];

  const textStyle: TextStyle[] = [
    styles.initials,
    size === 'sm' ? styles.initialsSm : size === 'lg' ? styles.initialsLg : styles.initialsMd,
  ];

  return (
    <View style={containerStyle}>
      {uri ? (
        <Image
          accessibilityLabel={name}
          source={{ uri }}
          style={{ width: dimension, height: dimension, borderRadius: dimension / 2 }}
        />
      ) : (
        <Text style={textStyle}>{initials || '?'}</Text>
      )}

      {isVerified ? <View style={styles.verifiedBadge} /> : null}
    </View>
  );
});

Avatar.displayName = 'Avatar';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  initials: {
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
  initialsSm: {
    fontSize: Typography.size.xs,
  },
  initialsMd: {
    fontSize: Typography.size.sm,
  },
  initialsLg: {
    fontSize: Typography.size.lg,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
});
