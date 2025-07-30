# Push Notification Setup Guide

## Overview

This guide explains how to set up remote push notifications for the Sterodoro app using Supabase and VAPID keys. This approach solves the iOS background notification limitations by using server-side push notifications.

## Required Setup

### 1. VAPID Keys Generation

Generate VAPID keys for push notification authentication:

```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys
```

This will output:
```
=======================================
Public Key:
BPHhJ...

Private Key:
...
=======================================
```

### 2. Environment Variables

Add to your `.env.local`:

```env
VITE_VAPID_PUBLIC_KEY=your_public_key_here
VITE_VAPID_PRIVATE_KEY=your_private_key_here
```

### 3. Supabase Database Schema

Create these tables in your Supabase database:

#### Push Subscriptions Table
```sql
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT,
  auth TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);
```

#### Timer Notifications Table
```sql
CREATE TABLE timer_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_endpoint TEXT NOT NULL,
  subscription_keys JSONB,
  timer_data JSONB NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE timer_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own timer notifications" ON timer_notifications
  FOR ALL USING (auth.uid() = user_id);
```

### 4. Supabase Edge Functions

Create a Supabase Edge Function to handle push notifications:

#### Create the function:
```bash
supabase functions new send-push-notification
```

#### Function code (`supabase/functions/send-push-notification/index.ts`):
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { subscription, payload } = await req.json()
    
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
        'Authorization': `vapid t=${generateVAPIDToken(subscription)}`
      },
      body: JSON.stringify(payload)
    })

    return new Response(
      JSON.stringify({ success: response.ok }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateVAPIDToken(subscription: any) {
  // Implementation for VAPID token generation
  // This requires the web-push library or manual implementation
}
```

### 5. Database Triggers

Create a database trigger to automatically send push notifications:

```sql
-- Function to send push notification
CREATE OR REPLACE FUNCTION send_timer_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the edge function to send push notification
  PERFORM
    net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/send-push-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}',
      body := json_build_object(
        'subscription', json_build_object(
          'endpoint', NEW.subscription_endpoint,
          'keys', NEW.subscription_keys
        ),
        'payload', json_build_object(
          'title', 'Sterodoro Timer',
          'body', CASE 
            WHEN (NEW.timer_data->>'isBreak')::boolean THEN 'Break completed!'
            ELSE 'Session completed!'
          END,
          'data', NEW.timer_data
        )
      )::text
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to send notification when timer notification is created
CREATE TRIGGER trigger_send_timer_notification
  AFTER INSERT ON timer_notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_timer_notification();
```

## Implementation Steps

### 1. Update Environment Variables
Replace the placeholder VAPID keys in `lib/push-notifications.ts`:

```typescript
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
```

### 2. Deploy Edge Function
```bash
supabase functions deploy send-push-notification
```

### 3. Test the Implementation

1. **Enable push notifications** in the app
2. **Start a timer** (20 seconds for testing)
3. **Switch to another app** or lock screen
4. **Wait for timer to end**
5. **Check for push notification**

## How It Works

### Flow:
1. **User starts timer** → App schedules remote notification
2. **Timer data sent to Supabase** → Stored in `timer_notifications` table
3. **Database trigger fires** → Calls edge function
4. **Edge function sends push** → To user's device via Web Push API
5. **Service worker receives push** → Shows notification with sound/vibration
6. **User gets alerted** → Even when app is backgrounded

### Benefits:
- **Works on iOS 18.5+** → Uses Apple's Web Push API
- **Background notifications** → Server can wake service worker
- **Cross-platform** → Same implementation for all platforms
- **Reliable** → Server-side scheduling ensures delivery

## Troubleshooting

### Common Issues:

1. **VAPID Key Errors**
   - Ensure keys are correctly formatted
   - Check environment variable names

2. **Permission Denied**
   - User must grant notification permission
   - PWA must be installed from home screen (iOS)

3. **Service Worker Not Registered**
   - Check service worker registration
   - Ensure HTTPS is used (required for service workers)

4. **Push Not Received**
   - Check subscription endpoint
   - Verify VAPID token generation
   - Check edge function logs

### Debug Steps:

1. **Check browser console** for errors
2. **Verify service worker** registration
3. **Test subscription** creation
4. **Check database** for stored subscriptions
5. **Monitor edge function** logs

## Security Considerations

- **VAPID keys** should be kept secure
- **Service role key** should not be exposed to client
- **Row Level Security** ensures user data isolation
- **HTTPS required** for service workers and push notifications 