import { useEffect, useState } from 'react';
import { messaging, getToken, onMessage } from '../config/firebase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

// VAPID key from Firebase Console - Cloud Messaging - Web Push certificates
const VAPID_KEY = 'BLbVda7ZoHsSWb_2CRMRAGZRIigci0BXTv9bHIO8OtU3Zs7mBGMJNEumGos4USlfofbQuXCJAVVW2LjOix8dSTs';

interface FirebaseNotification {
  title?: string;
  body?: string;
  data?: Record<string, any>;
}

export const useFirebaseNotifications = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const user = useAuthStore((state: any) => state.user);

  useEffect(() => {
    if (!user?.id || !messaging) {
      console.log('⚠️ Firebase notifications not initialized (no user or messaging not supported)');
      return;
    }

    setIsSupported(true);

    const initializeFirebase = async () => {
      try {
        // Check current permission status
        const currentPermission = Notification.permission;
        setPermissionStatus(currentPermission);

        if (currentPermission === 'denied') {
          console.log('❌ Notification permission denied by user');
          toast.error('Push notifications are blocked. Please enable them in browser settings.');
          return;
        }

        // Request permission if not yet granted
        if (currentPermission === 'default') {
          console.log('🔔 Requesting notification permission...');
          const permission = await Notification.requestPermission();
          setPermissionStatus(permission);

          if (permission !== 'granted') {
            console.log('❌ Notification permission denied');
            return;
          }
        }

        console.log('✅ Notification permission granted');

        // Get FCM token
        try {
          const token = await getToken(messaging!, {
            vapidKey: VAPID_KEY
          });

          if (token) {
            console.log('🔑 FCM Token received:', token.substring(0, 50) + '...');
            setFcmToken(token);

            // Register token with backend
            await registerDeviceToken(user.id, token);
          } else {
            console.log('❌ No FCM token received');
          }
        } catch (tokenError: any) {
          console.error('❌ Error getting FCM token:', tokenError);
          
          if (tokenError.code === 'messaging/permission-blocked') {
            toast.error('Push notifications are blocked. Please enable them in browser settings.');
          } else if (tokenError.code === 'messaging/unsupported-browser') {
            toast.error('Push notifications are not supported in this browser.');
          } else {
            console.error('Token error details:', tokenError.message);
          }
        }

      } catch (error) {
        console.error('❌ Error initializing Firebase notifications:', error);
      }
    };

    initializeFirebase();

    // Listen for foreground messages (when app is active)
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('🔔 Foreground message received:', payload);

        const notification = payload.notification as FirebaseNotification | undefined;
        
        // Show toast notification
        if (notification?.title) {
          toast.success(`${notification.title}${notification.body ? '\n' + notification.body : ''}`, {
            duration: 5000,
          });
        }

        // You can also dispatch to your notification store here
        // For example: notificationStore.addNotification(payload)
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user?.id]);

  const registerDeviceToken = async (userId: string, token: string) => {
    try {
      // Convert numeric userId to UUID format (00000000-0000-0000-0000-000000000038)
      const userIdUUID = `00000000-0000-0000-0000-${String(userId).padStart(12, '0')}`;
      
      const response = await fetch('http://localhost/api/notifications/register-device', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userIdUUID,
          token,
          deviceType: 'WEB',
          deviceName: `${navigator.userAgent.substring(0, 50)}...`,
        }),
      });

      if (response.ok) {
        console.log('✅ Device token registered successfully');
        toast.success('Push notifications enabled!');
      } else {
        const error = await response.json();
        console.error('❌ Failed to register device token:', error);
      }
    } catch (error) {
      console.error('❌ Error registering device token:', error);
    }
  };

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        toast.success('Notification permission granted!');
        // Re-trigger initialization
        if (messaging && user?.id) {
          const token = await getToken(messaging!, { vapidKey: VAPID_KEY });
          if (token) {
            setFcmToken(token);
            await registerDeviceToken(user.id, token);
          }
        }
      } else {
        toast.error('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Failed to request notification permission');
    }
  };

  return {
    fcmToken,
    isSupported,
    permissionStatus,
    requestPermission,
  };
};
