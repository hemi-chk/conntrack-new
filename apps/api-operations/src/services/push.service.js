import { Expo } from 'expo-server-sdk'
import { supabase } from '../config/supabase.js'

const expo = new Expo()

export async function sendDriverPush(driverId, title, body, data = {}) {
  const { data: driver, error } = await supabase
    .from('drivers')
    .select('expo_push_token')
    .eq('driver_id', driverId)
    .maybeSingle()

  if (error) throw error
  if (!driver?.expo_push_token || !Expo.isExpoPushToken(driver.expo_push_token)) return

  const messages = [{
    to: driver.expo_push_token,
    sound: 'default',
    title,
    body,
    data,
  }]

  for (const chunk of expo.chunkPushNotifications(messages)) {
    try {
      await expo.sendPushNotificationsAsync(chunk)
    } catch (pushError) {
      console.error('Driver push delivery error:', pushError.message)
    }
  }
}