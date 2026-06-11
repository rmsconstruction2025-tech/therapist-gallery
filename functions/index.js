const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp }    = require('firebase-admin/app');
const { getFirestore }     = require('firebase-admin/firestore');
const { getMessaging }     = require('firebase-admin/messaging');

initializeApp();

// ── Send push to therapist when a new booking is created ──
exports.notifyTherapist = onDocumentCreated('bookings/{bookingId}', async event => {
  const booking = event.data.data();
  if (!booking?.therapistDocId) return;

  // Get therapist's FCM token from their profile
  const therapistSnap = await getFirestore()
    .collection('therapists').doc(booking.therapistDocId).get();
  const fcmToken = therapistSnap.data()?.fcmToken;
  if (!fcmToken) return;

  const isNow = booking.bookingType === 'now';
  const clientName = booking.clientName || 'A client';

  const message = {
    token: fcmToken,
    notification: {
      title: isNow ? '🔔 New Booking Request!' : '📅 New Upcoming Appointment',
      body:  isNow
        ? `${clientName} wants an immediate appointment. Accept now!`
        : `${clientName} scheduled for ${booking.scheduledDate || ''} ${booking.scheduledTime || ''}`,
    },
    data: {
      bookingId: event.params.bookingId,
      type:      booking.bookingType || 'now',
    },
    android: {
      priority: 'high',
      notification: {
        sound:              'default',
        channelId:          'bookings',
        vibrateTimingsMillis: isNow
          ? [0, 300, 100, 300, 100, 300]
          : [0, 200],
        defaultVibrateTimings: false,
      },
    },
    apns: {
      headers: { 'apns-priority': '10' },
      payload: { aps: { sound: 'default', badge: 1, contentAvailable: true } },
    },
    webpush: {
      headers:      { Urgency: 'high' },
      notification: { requireInteraction: isNow },
    },
  };

  try {
    await getMessaging().send(message);
    console.log(`Push sent to therapist ${booking.therapistDocId} for booking ${event.params.bookingId}`);
  } catch (err) {
    // Token may be stale — clear it so it gets refreshed next login
    if (err.code === 'messaging/registration-token-not-registered') {
      await getFirestore()
        .collection('therapists').doc(booking.therapistDocId)
        .update({ fcmToken: null });
    }
    console.error('FCM send error:', err);
  }
});
