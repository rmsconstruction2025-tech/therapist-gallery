const functions = require('firebase-functions');
const admin     = require('firebase-admin');
admin.initializeApp();

// ── Send push to therapist when a new booking is created ──
exports.notifyTherapist = functions
  .region('asia-south1')
  .firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const booking = snap.data();
    if (!booking?.therapistDocId) return null;

    // Get therapist's FCM token
    const therapistSnap = await admin.firestore()
      .collection('therapists').doc(booking.therapistDocId).get();
    const fcmToken = therapistSnap.data()?.fcmToken;
    if (!fcmToken) return null;

    const isNow      = booking.bookingType === 'now';
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
        bookingId: context.params.bookingId,
        type:      booking.bookingType || 'now',
      },
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'bookings' },
      },
      apns: {
        headers: { 'apns-priority': '10' },
        payload: { aps: { sound: 'default', badge: 1 } },
      },
      webpush: {
        headers:      { Urgency: 'high' },
        notification: { requireInteraction: isNow },
      },
    };

    try {
      await admin.messaging().send(message);
      console.log('Push sent to', booking.therapistDocId);
    } catch (err) {
      if (err.code === 'messaging/registration-token-not-registered') {
        await admin.firestore()
          .collection('therapists').doc(booking.therapistDocId)
          .update({ fcmToken: null });
      }
      console.error('FCM error:', err);
    }
    return null;
  });
