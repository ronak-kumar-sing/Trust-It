import React, { useState, useEffect, memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { formatDuration } from '../../utils/formatters';

export interface CountdownTimerProps {
  initialSeconds: number;
  label?: string;
  onExpire?: () => void;
  warningThresholdSeconds?: number; // threshold under which display turns warning red
}

/**
 * CountdownTimer manages a deterministic local countdown timer for
 * inspection windows, auto-releases, and match confirmation timeouts.
 */
export const CountdownTimer: React.FC<CountdownTimerProps> = memo(({
  initialSeconds,
  label = 'Time Remaining',
  onExpire,
  warningThresholdSeconds = 3600, // default 1 hour
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire?.();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onExpire]);

  const isWarning = secondsLeft <= warningThresholdSeconds && secondsLeft > 0;
  const isExpired = secondsLeft <= 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.badge,
          isWarning && styles.badgeWarning,
          isExpired && styles.badgeExpired,
        ]}
      >
        <Text
          style={[
            styles.timeText,
            isWarning && styles.textWarning,
            isExpired && styles.textExpired,
          ]}
        >
          {isExpired ? 'EXPIRED' : formatDuration(secondsLeft)}
        </Text>
      </View>
    </View>
  );
});

CountdownTimer.displayName = 'CountdownTimer';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  label: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeWarning: {
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    borderColor: Colors.warning,
  },
  badgeExpired: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderColor: Colors.danger,
  },
  timeText: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  textWarning: {
    color: Colors.warning,
  },
  textExpired: {
    color: Colors.danger,
  },
});
