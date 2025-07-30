// Service Worker for Sterodoro PWA
const CACHE_NAME = 'sterodoro-v1';
const STATIC_CACHE = 'sterodoro-static-v1';
const DYNAMIC_CACHE = 'sterodoro-dynamic-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sound.mp3'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Background sync registration
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'sterodoro-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Timer completed!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'timer-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Sterodoro Timer', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'open' || event.action === '') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' })
        .then((clients) => {
          // If app is already open, focus it
          if (clients.length > 0) {
            return clients[0].focus();
          }
          // Otherwise, open the app
          return self.clients.openWindow('/');
        })
    );
  }
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);
  
  if (event.data.type === 'TIMER_END') {
    handleTimerEnd(event.data);
  }
});

// Handle background sync
async function handleBackgroundSync() {
  try {
    console.log('Starting background sync...');
    
    // Get all clients
    const clients = await self.clients.matchAll();
    
    // Send sync message to all clients
    clients.forEach((client) => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        timestamp: new Date().toISOString() // Service worker uses native Date for simplicity
      });
    });
    
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Handle timer end in background
async function handleTimerEnd(data) {
  try {
    console.log('Handling timer end in background:', data);
    
    // Show notification
    const options = {
      body: `${data.isBreak ? 'Break' : 'Session'} completed!`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'timer-end',
      requireInteraction: true,
      silent: false, // This should trigger sound
      actions: [
        {
          action: 'open',
          title: 'Open App'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };
    
    await self.registration.showNotification('Sterodoro Timer', options);
    
    // Try to play sound using Audio API (may not work in all browsers)
    try {
      const audio = new Audio('/sound.mp3');
      await audio.play();
    } catch (error) {
      console.log('Could not play sound in background:', error);
    }
    
    // Try vibration (works better on iOS)
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    } catch (error) {
      console.log('Vibration not available in service worker:', error);
    }
    
  } catch (error) {
    console.error('Failed to handle timer end:', error);
  }
}

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests (Supabase, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Handle static files
  if (STATIC_FILES.includes(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request);
        })
    );
    return;
  }
  
  // Handle dynamic content (API calls)
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              cache.put(request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Return cached response when offline
        return caches.match(request);
      })
  );
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'REGISTER_BACKGROUND_SYNC':
      registerBackgroundSync();
      break;
      
    case 'CLEAR_CACHE':
      clearCache();
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

// Register background sync
async function registerBackgroundSync() {
  try {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sterodoro-sync');
      console.log('Background sync registered');
    } else {
      console.log('Background sync not supported');
    }
  } catch (error) {
    console.error('Failed to register background sync:', error);
  }
}

// Clear cache
async function clearCache() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => caches.delete(cacheName))
    );
    console.log('Cache cleared');
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

// Push notification event (for future use)
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: 'Sterodoro: Time to sync your data!',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'sterodoro-sync',
    data: {
      url: '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Sterodoro', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll()
      .then((clients) => {
        if (clients.length > 0) {
          clients[0].focus();
        } else {
          self.clients.openWindow('/');
        }
      })
  );
}); 