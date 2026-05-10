/**
 * Notification Service
 * Handles sending push notifications to drivers using the Expo Push API.
 */

const { Expo } = require('expo-server-sdk');
const supabase = require('../config/supabase');

// Create a new Expo SDK client
let expo = new Expo();

/**
 * Sends a push notification to a specific driver.
 * 
 * @param {number} driverId - The ID of the driver to notify.
 * @param {string} title - The title of the notification.
 * @param {string} body - The message content.
 * @param {object} data - Optional data payload (e.g., { orderId: 123 }).
 */
async function sendDriverNotification(driverId, title, body, data = {}) {
  try {
    // 1. Fetch the driver's push token from Supabase
    const { data: driver, error } = await supabase
      .from('drivers')
      .select('expo_push_token')
      .eq('driver_id', driverId)
      .single();

    if (error || !driver?.expo_push_token) {
      console.log(`Notification failed: No push token found for driver ${driverId}`);
      return;
    }

    const pushToken = driver.expo_push_token;

    // 2. Check if the token is a valid Expo push token
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return;
    }

    // 3. Construct the message
    const messages = [{
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
    }];

    // 4. Send the notification via Expo
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];

    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log('Notification Ticket:', ticketChunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending chunk:', error);
      }
    }

    return tickets;

  } catch (error) {
    console.error('Fatal error in sendDriverNotification:', error);
  }
}

module.exports = { sendDriverNotification };
