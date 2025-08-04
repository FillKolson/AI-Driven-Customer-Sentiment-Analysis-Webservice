import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface UsageData {
  current_usage: number;
  usage_limit: number;
  usage_percentage: number;
  notifications: {
    warning: boolean;
    critical: boolean;
    exceeded: boolean;
    shouldNotify: boolean;
    message: string;
    type: "warning" | "critical" | "exceeded" | null;
  };
  preferences: {
    email_notifications: boolean;
    usage_notifications: boolean;
  };
}

interface UseUsageMonitorProps {
  userId: string;
  currentUsage: number;
  usageLimit: number;
  subscriptionStatus: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useUsageMonitor({
  userId,
  currentUsage,
  usageLimit,
  subscriptionStatus,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: UseUsageMonitorProps) {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsageData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/user/usage-notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch usage data");
      }
      
      const data = await response.json();
      setUsageData(data);
      
      // Check if we should show a notification
      if (data.notifications.shouldNotify && data.preferences.usage_notifications) {
        const notificationKey = `${data.notifications.type}-${data.current_usage}`;
        
        // Only show notification if we haven't shown it for this specific state
        if (lastNotification !== notificationKey) {
          const notificationType = data.notifications.type;
          const message = data.notifications.message;
          
          toast({
            title: notificationType === "exceeded" ? "Usage Limit Exceeded" : 
                  notificationType === "critical" ? "Critical Usage Alert" : 
                  "Usage Warning",
            description: message,
            variant: notificationType === "exceeded" ? "destructive" : 
                    notificationType === "critical" ? "destructive" : 
                    "default",
            duration: notificationType === "exceeded" ? 0 : 10000, // Don't auto-dismiss exceeded
          });
          
          setLastNotification(notificationKey);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching usage data:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, currentUsage, usageLimit, toast, lastNotification]);

  // Initial fetch
  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchUsageData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchUsageData]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  // Check if usage is at a specific threshold
  const isAtThreshold = useCallback((threshold: number) => {
    if (!usageData) return false;
    return usageData.usage_percentage >= threshold;
  }, [usageData]);

  // Get usage status
  const getUsageStatus = useCallback(() => {
    if (!usageData) return "unknown";
    
    if (usageData.usage_percentage >= 100) return "exceeded";
    if (usageData.usage_percentage >= 95) return "critical";
    if (usageData.usage_percentage >= 80) return "warning";
    return "normal";
  }, [usageData]);

  // Get usage color for UI
  const getUsageColor = useCallback(() => {
    const status = getUsageStatus();
    switch (status) {
      case "exceeded":
        return "#ef4444"; // red
      case "critical":
        return "#f97316"; // orange
      case "warning":
        return "#eab308"; // amber
      default:
        return "#3b82f6"; // blue
    }
  }, [getUsageStatus]);

  return {
    usageData,
    loading,
    error,
    refresh,
    isAtThreshold,
    getUsageStatus,
    getUsageColor,
    shouldShowNotification: usageData?.notifications.shouldNotify ?? false,
    notificationType: usageData?.notifications.type ?? null,
    notificationMessage: usageData?.notifications.message ?? "",
  };
} 