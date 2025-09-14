"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { AlertTriangle, AlertCircle, XCircle, TrendingUp } from "lucide-react";
import { useToast } from "./ui/use-toast";

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

export default function GlobalUsageNotification() {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsageNotifications = async () => {
      try {
        const response = await fetch("/api/user/usage-notifications");
        if (response.ok) {
          const data = await response.json();
          setUsageData(data);
          
          // Check if notification has already been shown in this session
          const notificationShown = sessionStorage.getItem('usageNotificationShown');
          const notificationKey = `${data.current_usage}_${data.usage_limit}_${data.notifications.type}`;
          
          if (data.notifications.shouldNotify && data.preferences.usage_notifications && !notificationShown) {
            // Mark as shown for this session
            sessionStorage.setItem('usageNotificationShown', notificationKey);
            
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
              duration: notificationType === "exceeded" ? 0 : 10000,
            });
            
            // Show the banner notification
            setShowNotification(true);
          }
        }
      } catch (error) {
        console.error("Error fetching usage notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageNotifications();
  }, [toast]);

  const handleDismiss = () => {
    setShowNotification(false);
  };

  const handleUpgrade = () => {
    window.location.href = "/pricing";
  };

  if (loading || !usageData || !showNotification) {
    return null;
  }

  if (!usageData.preferences.usage_notifications) {
    return null;
  }

  if (!usageData.notifications.shouldNotify) {
    return null;
  }

  const getAlertIcon = () => {
    switch (usageData.notifications.type) {
      case "exceeded":
        return <XCircle className="h-4 w-4" />;
      case "critical":
        return <AlertCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getAlertVariant = () => {
    switch (usageData.notifications.type) {
      case "exceeded":
        return "destructive";
      case "critical":
        return "destructive";
      case "warning":
        return "default";
      default:
        return "default";
    }
  };

  const getAlertTitle = () => {
    switch (usageData.notifications.type) {
      case "exceeded":
        return "Usage Limit Exceeded";
      case "critical":
        return "Critical Usage Alert";
      case "warning":
        return "Usage Warning";
      default:
        return "Usage Alert";
    }
  };

  const getUsageColor = () => {
    const percentage = usageData.usage_percentage;
    if (percentage >= 100) return "#ef4444";
    if (percentage >= 95) return "#f97316";
    if (percentage >= 80) return "#eab308";
    return "#3b82f6";
  };

  const getUsedColor = () => {
    const baseColor = getUsageColor();
    return baseColor === "#ef4444" ? "#dc2626" :
           baseColor === "#f97316" ? "#ea580c" :
           baseColor === "#eab308" ? "#d97706" :
           "#2563eb";
  };

  const remainingPercentage = 100 - usageData.usage_percentage;
  const show95Label = usageData.usage_percentage < 97;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
      <Alert variant={getAlertVariant()} className="mb-4 shadow-lg bg-white dark:bg-gray-900 border">
        <div className="flex items-start gap-3">
          {getAlertIcon()}
          <div className="flex-1">
            <AlertTitle>{getAlertTitle()}</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="space-y-3">
                <p>{usageData.notifications.message}</p>
                
                {/* Usage Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Usage</span>
                    <span className="font-medium">
                      {usageData.current_usage}/{usageData.usage_limit} calls
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    {/* Used part (darker version of the color) */}
                    <div 
                      className="absolute left-0 top-0 h-full transition-all duration-300"
                      style={{
                        width: `${usageData.usage_percentage}%`,
                        backgroundColor: getUsedColor(),
                      }}
                    />
                    {/* Remaining part (main color) */}
                    <div 
                      className="absolute right-0 top-0 h-full transition-all duration-300"
                      style={{
                        width: `${remainingPercentage}%`,
                        backgroundColor: getUsageColor(),
                      }}
                    />
                  </div>
                  <div className="relative text-xs text-gray-500 pb-4">
                    <span className="absolute" style={{ left: '0%' }}>0%</span>
                    <span className="absolute" style={{ left: '50%', transform: 'translateX(-50%)' }}>50%</span>
                    <span className="absolute" style={{ left: '80%', transform: 'translateX(-50%)' }}>80%</span>
                    {show95Label && (
                      <span className="absolute" style={{ left: '95%', transform: 'translateX(-50%)' }}>95%</span>
                    )}
                    <span className="absolute" style={{ right: '0%' }}>100%</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 mt-4">
                  <Button 
                    size="sm" 
                    onClick={handleUpgrade}
                    variant={usageData.notifications.type === "exceeded" ? "default" : "outline"}
                  >
                    {usageData.notifications.type === "exceeded" ? "Upgrade Now" : "View Plans"}
                  </Button>
                  {usageData.notifications.type !== "exceeded" && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handleDismiss}
                    >
                      Dismiss
                    </Button>
                  )}
                </div>
              </div>
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
} 