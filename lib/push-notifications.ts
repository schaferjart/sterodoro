// Push Notification Management for iOS 18.5+ and cross-platform support
import { supabase } from './supabase';

// VAPID keys for push notification authentication
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'YOUR_VAPID_PUBLIC_KEY';
const VAPID_PRIVATE_KEY = import.meta.env.VITE_VAPID_PRIVATE_KEY || 'YOUR_VAPID_PRIVATE_KEY'; // Server-side only

// Use the built-in PushSubscription interface
type PushSubscriptionData = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

interface TimerPushData {
  type: 'TIMER_END';
  isBreak: boolean;
  currentSession: number;
  sessionCount: number;
  endTime: string;
}

class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  async initialize(): Promise<boolean> {
    try {
      console.log('🔔 Initializing push notifications...');
      
      // Check if service workers are supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('❌ Push notifications not supported');
        return false;
      }

      // Get service worker registration
      this.registration = await navigator.serviceWorker.ready;
      console.log('✅ Service worker ready');

      // Check notification permission
      if (Notification.permission === 'default') {
        console.log('📝 Requesting notification permission...');
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('❌ Notification permission denied');
          return false;
        }
      }

      if (Notification.permission !== 'granted') {
        console.log('❌ Notification permission not granted');
        return false;
      }

      console.log('✅ Notification permission granted');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
      return false;
    }
  }

  async subscribeToPush(): Promise<boolean> {
    try {
      if (!this.registration) {
        console.log('❌ Service worker not ready');
        return false;
      }

      console.log('🔔 Subscribing to push notifications...');
      console.log('VAPID Public Key:', VAPID_PUBLIC_KEY);

      // Check if VAPID key is still placeholder
      if (VAPID_PUBLIC_KEY === 'YOUR_VAPID_PUBLIC_KEY') {
        console.error('❌ VAPID key is still placeholder. Please set VITE_VAPID_PUBLIC_KEY in .env.local');
        return false;
      }

      // Convert VAPID key to Uint8Array
      const vapidPublicKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      console.log('VAPID key converted to Uint8Array:', vapidPublicKey.length, 'bytes');

      // Subscribe to push notifications
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      console.log('✅ Push subscription created:', this.subscription);
      console.log('Subscription endpoint:', this.subscription.endpoint);

      // Store subscription in Supabase (optional for testing)
      try {
        await this.storeSubscription(this.subscription as PushSubscription);
      } catch (error) {
        console.warn('⚠️ Failed to store subscription in database (this is okay for testing):', error);
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to subscribe to push notifications:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    try {
      if (!this.subscription) {
        console.log('❌ No active subscription');
        return false;
      }

      console.log('🔔 Unsubscribing from push notifications...');

      // Unsubscribe from push manager
      await this.subscription.unsubscribe();

      // Remove from Supabase
      await this.removeSubscription(this.subscription);

      this.subscription = null;
      console.log('✅ Unsubscribed from push notifications');

      return true;
    } catch (error) {
      console.error('❌ Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  async scheduleTimerNotification(timerData: {
    isBreak: boolean;
    currentSession: number;
    sessionCount: number;
    endTime: Date;
  }): Promise<boolean> {
    try {
      if (!this.subscription) {
        console.log('❌ No push subscription available');
        return false;
      }

      console.log('⏰ Scheduling timer notification...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ User not authenticated');
        return false;
      }

      // Get the subscription keys using getKey method
      const p256dh = await this.subscription.getKey('p256dh');
      const auth = await this.subscription.getKey('auth');

      // Send timer data to server for scheduling
      try {
        const { data, error } = await supabase
          .from('timer_notifications')
          .insert({
            user_id: user.id,
            subscription_endpoint: this.subscription.endpoint,
            subscription_keys: {
              p256dh: p256dh ? btoa(String.fromCharCode(...new Uint8Array(p256dh))) : null,
              auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : null
            },
            timer_data: {
              type: 'TIMER_END',
              isBreak: timerData.isBreak,
              currentSession: timerData.currentSession,
              sessionCount: timerData.sessionCount,
              endTime: timerData.endTime.toISOString()
            },
            scheduled_for: timerData.endTime.toISOString(),
            status: 'pending'
          });

        if (error) {
          console.error('❌ Failed to schedule notification:', error);
          console.log('⚠️ This is expected if database tables are not set up yet');
          return false;
        }

        console.log('✅ Timer notification scheduled');
        return true;
      } catch (error) {
        console.warn('⚠️ Failed to schedule timer notification (database tables may not be set up):', error);
        console.log('ℹ️ Timer will still work with local notifications');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to schedule timer notification:', error);
      return false;
    }
  }

  private async storeSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the subscription keys using getKey method
      const p256dh = await subscription.getKey('p256dh');
      const auth = await subscription.getKey('auth');

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: p256dh ? btoa(String.fromCharCode(...new Uint8Array(p256dh))) : null,
          auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : null,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Failed to store subscription:', error);
      } else {
        console.log('✅ Subscription stored in database');
      }
    } catch (error) {
      console.error('❌ Failed to store subscription:', error);
    }
  }

  private async removeSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('endpoint', subscription.endpoint);

      if (error) {
        console.error('❌ Failed to remove subscription:', error);
      } else {
        console.log('✅ Subscription removed from database');
      }
    } catch (error) {
      console.error('❌ Failed to remove subscription:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Check if push notifications are supported and enabled
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           Notification.permission === 'granted';
  }

  // Get current subscription status
  getSubscriptionStatus(): {
    supported: boolean;
    subscribed: boolean;
    permission: NotificationPermission;
  } {
    return {
      supported: 'serviceWorker' in navigator && 'PushManager' in window,
      subscribed: !!this.subscription,
      permission: Notification.permission
    };
  }
}

export const pushNotificationManager = new PushNotificationManager(); 