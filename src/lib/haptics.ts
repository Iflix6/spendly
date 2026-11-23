import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

async function perform(action: () => Promise<void>): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  try {
    await action();
  } catch {
    // Haptics are optional when the device or platform does not support them.
  }
}

export function selection(): Promise<void> {
  return perform(() => Haptics.selectionAsync());
}

export function lightImpact(): Promise<void> {
  return perform(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function success(): Promise<void> {
  return perform(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function warning(): Promise<void> {
  return perform(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}
