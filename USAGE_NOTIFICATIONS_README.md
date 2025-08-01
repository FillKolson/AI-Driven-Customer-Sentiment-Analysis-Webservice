# Usage Notifications System

This document describes the usage notification system implemented to alert users when they approach their API usage limits.

## Overview

The usage notification system provides real-time alerts to users when they are approaching or have exceeded their monthly API usage limits. The system includes:

- **Visual indicators** with color-coded progress bars
- **Toast notifications** for immediate alerts
- **User preferences** to control notification settings
- **Multiple threshold levels** (warning, critical, exceeded)
- **Real-time monitoring** with auto-refresh capabilities

## Features

### 1. Usage Thresholds

The system defines three notification thresholds:

- **Warning (80%)**: User is approaching their usage limit
- **Critical (95%)**: User is very close to their usage limit
- **Exceeded (100%)**: User has exceeded their usage limit

### 2. Visual Indicators

- **Color-coded progress bars**: Blue (normal) → Amber (warning) → Orange (critical) → Red (exceeded)
- **Status badges**: Normal, Warning, Critical, Exceeded
- **Icons**: Different icons for each status level
- **Warning messages**: Contextual messages with emojis for clarity

### 3. Notification Types

- **Toast notifications**: Immediate pop-up alerts
- **In-component warnings**: Embedded warnings in analysis components
- **User preference control**: Users can disable notifications if desired

## Components

### UsageDisplay

A reusable component for displaying usage information with visual indicators.

```tsx
<UsageDisplay
  currentUsage={75}
  usageLimit={100}
  showDetails={true}
  showWarnings={true}
  size="md"
/>
```

**Props:**
- `currentUsage`: Current API usage count
- `usageLimit`: Monthly API limit
- `showDetails`: Whether to show detailed usage information
- `showWarnings`: Whether to show warning messages
- `size`: Component size ("sm", "md", "lg")
- `className`: Additional CSS classes

### UsageNotification

A component that fetches usage data and displays notifications.

```tsx
<UsageNotification
  userId="user-123"
  currentUsage={75}
  usageLimit={100}
  subscriptionStatus="free"
/>
```

### useUsageMonitor Hook

A custom hook for real-time usage monitoring.

```tsx
const {
  usageData,
  loading,
  error,
  refresh,
  isAtThreshold,
  getUsageStatus,
  getUsageColor,
  shouldShowNotification,
  notificationType,
  notificationMessage,
} = useUsageMonitor({
  userId: "user-123",
  currentUsage: 75,
  usageLimit: 100,
  subscriptionStatus: "free",
  autoRefresh: true,
  refreshInterval: 30000,
});
```

## API Endpoints

### GET /api/user/usage-notifications

Fetches current usage data and notification status.

**Response:**
```json
{
  "current_usage": 75,
  "usage_limit": 100,
  "usage_percentage": 75,
  "notifications": {
    "warning": false,
    "critical": false,
    "exceeded": false,
    "shouldNotify": false,
    "message": "",
    "type": null
  },
  "preferences": {
    "email_notifications": true,
    "usage_notifications": true
  }
}
```

### POST /api/user/usage-notifications

Updates usage notification preferences.

**Request:**
```json
{
  "usage_notifications": true
}
```

## Database Schema

### user_preferences Table

Added a new column for usage notifications:

```sql
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS usage_notifications boolean DEFAULT true;
```

## User Preferences

Users can control their notification preferences in the settings page:

- **Email Notifications**: Receive email updates about account
- **Marketing Emails**: Receive updates about new features and promotions
- **Usage Notifications**: Get alerts when approaching API usage limits

## Integration Points

### Dashboard

The usage notification system is integrated into the main dashboard:

1. **UsageNotification component** displays alerts at the top
2. **UsageDisplay component** shows usage in analysis tools
3. **Real-time monitoring** with auto-refresh every 30 seconds

### Analysis Components

Both single and batch analysis components include:

- **Usage warnings** before analysis
- **Visual indicators** during analysis
- **Limit enforcement** to prevent exceeding limits

### Settings Page

Users can manage their notification preferences:

- **Enable/disable usage notifications**
- **View current usage status**
- **Access upgrade options**

## Testing

The system includes comprehensive tests covering:

- **Component rendering** with different usage levels
- **Notification triggers** at various thresholds
- **User preference handling**
- **API endpoint functionality**

Run tests with:
```bash
npm test -- usage-notifications.test.tsx
```

## Configuration

### Thresholds

Thresholds can be configured in the API endpoint:

```typescript
const thresholds = {
  warning: 80,    // 80% of limit
  critical: 95,   // 95% of limit
  exceeded: 100,  // 100% of limit
};
```

### Auto-refresh Interval

The monitoring hook refreshes data every 30 seconds by default:

```typescript
refreshInterval = 30000, // 30 seconds
```

### Notification Duration

Toast notifications have different durations:

- **Warning/Critical**: 10 seconds (auto-dismiss)
- **Exceeded**: No auto-dismiss (user must dismiss manually)

## Future Enhancements

Potential improvements for the notification system:

1. **Email notifications** for critical/exceeded states
2. **Push notifications** for mobile users
3. **Usage predictions** based on current usage patterns
4. **Custom thresholds** per user or plan
5. **Usage analytics** and reporting
6. **Integration with external notification services**

## Troubleshooting

### Common Issues

1. **Notifications not showing**: Check user preferences and notification settings
2. **Incorrect usage data**: Verify database triggers and usage tracking
3. **Performance issues**: Adjust refresh intervals for better performance

### Debug Mode

Enable debug logging by setting the log level:

```typescript
console.log('Usage data:', usageData);
console.log('Notification status:', shouldShowNotification);
```

## Security Considerations

- **Authentication required** for all usage endpoints
- **User isolation** - users can only access their own usage data
- **Rate limiting** on API endpoints to prevent abuse
- **Input validation** for all user preferences 