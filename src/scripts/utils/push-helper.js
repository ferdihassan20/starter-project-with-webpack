import { pushQuotes } from './quotes.js';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush(token) {
  try {
    if (Notification.permission !== 'granted') {
      const result = await Notification.requestPermission();
      if (result !== 'granted') {
        console.warn('User denied notification permission');
        return;
      }
    }

    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk'
      ),
    });

    const jsonSub = subscription.toJSON();
    console.log('Raw subscription JSON:', jsonSub);

    const payload = {
      endpoint: jsonSub.endpoint,
      keys: {
        p256dh: jsonSub.keys.p256dh,
        auth: jsonSub.keys.auth,
      },
    };

    console.log('Push Payload to Server:', payload);
    console.log('Token:', token);

    const response = await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Raw error response:", errorText);
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Push subscription success:', result);

    // 🔔 Show motivational notification right after subscribing
    const randomQuote = pushQuotes[Math.floor(Math.random() * pushQuotes.length)];

    registration.showNotification(randomQuote.title, {
      body: randomQuote.body
    });

  } catch (error) {
    console.error('Failed to subscribe user to push:', error);
  }
}
