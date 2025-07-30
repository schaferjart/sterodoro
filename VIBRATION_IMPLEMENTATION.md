# Vibration Implementation Guide

## Platform Support

### ✅ Supported Platforms
- **iOS Safari**: ✅ Full support
- **Android Chrome**: ✅ Full support
- **Android Firefox**: ✅ Full support
- **Desktop Chrome**: ❌ Not available
- **Desktop Firefox**: ❌ Not available
- **Desktop Safari**: ❌ Not available

## Implementation Details

### Basic Vibration API
```javascript
// Check if vibration is supported
if ('vibrate' in navigator) {
  // Single vibration (200ms)
  navigator.vibrate(200);
  
  // Vibration pattern [on, off, on, off, ...]
  navigator.vibrate([200, 100, 200, 100, 200]);
}
```

### Current Implementation in Sterodoro

#### Service Worker Vibration
```javascript
// In public/sw.js - handleTimerEnd function
try {
  if ('vibrate' in navigator) {
    // Pattern: 3 short vibrations with pauses
    navigator.vibrate([200, 100, 200, 100, 200]);
    console.log('Vibration triggered');
  }
} catch (error) {
  console.log('Vibration not available in service worker:', error);
}
```

#### Timer Screen Vibration
```javascript
// In screens/TimerScreen.tsx - timer end effect
if ('vibrate' in navigator) {
  try {
    // Same pattern as service worker
    navigator.vibrate([200, 100, 200, 100, 200]);
  } catch (error) {
    console.log('Vibration not supported or failed:', error);
  }
}
```

## Vibration Patterns

### Timer End Pattern
```javascript
[200, 100, 200, 100, 200]
// 200ms on, 100ms off, 200ms on, 100ms off, 200ms on
// Total: 800ms, 3 vibrations
```

### Alternative Patterns

#### Short Alert
```javascript
[100, 50, 100]
// 100ms on, 50ms off, 100ms on
// Total: 250ms, 2 vibrations
```

#### Long Alert
```javascript
[300, 150, 300, 150, 300, 150, 300]
// 300ms on, 150ms off, 300ms on, 150ms off, 300ms on, 150ms off, 300ms on
// Total: 1650ms, 4 vibrations
```

#### Continuous Vibration
```javascript
[500, 200, 500, 200, 500]
// 500ms on, 200ms off, 500ms on, 200ms off, 500ms on
// Total: 1900ms, 3 long vibrations
```

## Platform-Specific Considerations

### iOS Safari
- **Best Support**: Vibration works reliably in background
- **Pattern Length**: Keep under 2 seconds for best UX
- **Battery Impact**: Minimal impact on battery life
- **User Experience**: Familiar iOS vibration feel

### Android Chrome
- **Best Support**: Vibration works reliably in background
- **Pattern Length**: Can handle longer patterns
- **Battery Impact**: Slightly more impact than iOS
- **User Experience**: Android-specific vibration feel

### Desktop Browsers
- **No Support**: Vibration API not available
- **Fallback**: Sound notifications only
- **Alternative**: Visual alerts (screen flash, etc.)

## Testing Vibration

### Manual Testing
```javascript
// Test in browser console
if ('vibrate' in navigator) {
  navigator.vibrate([200, 100, 200, 100, 200]);
  console.log('Vibration test triggered');
} else {
  console.log('Vibration not supported');
}
```

### Automated Testing
```javascript
// Check vibration support
function testVibration() {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(100);
      return true;
    } catch (error) {
      console.error('Vibration test failed:', error);
      return false;
    }
  }
  return false;
}
```

## Best Practices

### 1. Always Check Support
```javascript
if ('vibrate' in navigator) {
  // Use vibration
} else {
  // Fallback to sound or visual alert
}
```

### 2. Use Try-Catch
```javascript
try {
  navigator.vibrate([200, 100, 200, 100, 200]);
} catch (error) {
  console.log('Vibration failed:', error);
  // Fallback mechanism
}
```

### 3. Keep Patterns Short
- **Optimal Length**: 500ms - 1500ms
- **Avoid**: Patterns longer than 3 seconds
- **Consider**: Battery impact and user annoyance

### 4. Provide Fallbacks
```javascript
function alertUser() {
  // Primary: Vibration
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200, 100, 200]);
    } catch (error) {
      // Fallback to sound
      playSound();
    }
  } else {
    // Fallback to sound
    playSound();
  }
}
```

## Current Sterodoro Implementation

### Timer End Vibration
- **Pattern**: `[200, 100, 200, 100, 200]`
- **Duration**: 800ms
- **Vibrations**: 3 short bursts
- **Platforms**: iOS Safari, Android Chrome
- **Fallback**: Sound when app is active

### Service Worker Integration
- **Background**: Works when app is in background
- **Reliability**: High on supported platforms
- **Battery**: Minimal impact
- **User Experience**: Consistent across platforms

## Future Enhancements

### Customizable Patterns
```javascript
// User preferences for vibration patterns
const userPreferences = {
  timerEnd: [200, 100, 200, 100, 200],
  breakEnd: [300, 150, 300],
  sessionEnd: [500, 200, 500, 200, 500]
};
```

### Intensity Levels
```javascript
// Different patterns for different events
const vibrationPatterns = {
  gentle: [100, 50, 100],
  normal: [200, 100, 200, 100, 200],
  strong: [300, 150, 300, 150, 300]
};
```

### Accessibility Support
```javascript
// Respect user accessibility settings
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // Use gentler vibration or disable
  navigator.vibrate([100, 50, 100]);
} else {
  // Use normal vibration
  navigator.vibrate([200, 100, 200, 100, 200]);
}
``` 