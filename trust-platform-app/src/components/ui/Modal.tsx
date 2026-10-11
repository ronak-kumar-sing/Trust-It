import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { Button, ButtonVariant } from './Button';
import { Strings } from '../../constants/strings';

export interface ModalProps {
  visible: boolean;
  title: string;
  message?: string;
  children?: React.ReactNode;
  onConfirm?: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: ButtonVariant;
  loading?: boolean;
}

/**
 * Accessible confirmation and alert dialog modal.
 */
export const Modal: React.FC<ModalProps> = React.memo(({
  visible,
  title,
  message,
  children,
  onConfirm,
  onCancel,
  confirmText = Strings.common.confirm,
  cancelText = Strings.common.cancel,
  confirmVariant = 'primary',
  loading = false,
}) => {
  return (
    <RNModal
      animationType="fade"
      hardwareAccelerated
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.dialogCard}>
              <Text style={styles.title}>{title}</Text>

              {message ? <Text style={styles.message}>{message}</Text> : null}

              {children ? <View style={styles.content}>{children}</View> : null}

              <View style={styles.actions}>
                <Button
                  disabled={loading}
                  onPress={onCancel}
                  style={styles.actionButton}
                  title={cancelText}
                  variant="secondary"
                />

                {onConfirm ? (
                  <Button
                    loading={loading}
                    onPress={onConfirm}
                    style={styles.actionButton}
                    title={confirmText}
                    variant={confirmVariant}
                  />
                ) : null}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
});

Modal.displayName = 'Modal';

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadiusLg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  message: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.base,
    marginBottom: Spacing.md,
  },
  content: {
    marginBottom: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
