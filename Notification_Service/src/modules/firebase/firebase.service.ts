import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private firebaseApp: admin.app.App;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const serviceAccountPath = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');
    
    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // Use project_id from service account JSON instead of env
      });
      
      console.log(`✅ Firebase Admin SDK initialized for project: ${serviceAccount.project_id}`);
    } else {
      console.warn('⚠️  Firebase service account file not found. Push notifications will be disabled.');
      console.warn(`Looking for: ${serviceAccountPath}`);
    }
  }

  async sendPushNotification(token: string, title: string, body: string, data?: Record<string, string>): Promise<string> {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }

    const message: admin.messaging.Message = {
      token,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
        },
      },
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('✅ FCM sent:', response);
      return response;
    } catch (error) {
      console.error('❌ FCM error:', error);
      throw error;
    }
  }

  async sendMulticast(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<admin.messaging.BatchResponse> {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }

    console.log(`📤 Sending FCM to ${tokens.length} device(s):`, { title, body, tokens: tokens.map(t => t.substring(0, 30) + '...') });

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
      },
      data: data || {},
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`✅ FCM multicast sent: ${response.successCount}/${tokens.length} successful`);
      if (response.failureCount > 0) {
        console.error(`❌ FCM failures:`, response.responses.filter(r => !r.success).map(r => r.error?.message));
      }
      return response;
    } catch (error) {
      console.error('❌ FCM multicast error:', error);
      throw error;
    }
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }
    return await admin.auth().verifyIdToken(idToken);
  }
}
