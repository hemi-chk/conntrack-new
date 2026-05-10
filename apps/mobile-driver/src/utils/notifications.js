/**
 * Push Notification Utility
 * Handles requesting permissions and retrieving the Expo Push Token.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../constants/config';

// Configure how notifications are handled when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests notification permissions and returns the Expo Push Token.
 * Also configures Android-specific channels.
 */
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
        projectId: "your-project-id" // Optional: Specify if you have a custom Expo project ID
    })).data;
    console.log('Push Token Generated:', token);
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Syncs the push token with the backend for a specific driver.
 */
export async function syncPushToken(driverId, token) {
  if (!driverId || !token) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/driver/update-push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        driverId: driverId,
        pushToken: token
      }),
    });

    const result = await response.json();
    if (result.success) {
      console.log('Push token synced with backend successfully');
    }
  } catch (error) {
    console.error('Error syncing push token:', error);
  }
}
