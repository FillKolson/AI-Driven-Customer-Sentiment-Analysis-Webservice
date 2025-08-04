"use client";

import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { AlertTriangle, AlertCircle, XCircle, TrendingUp } from "lucide-react";

interface UsageDisplayProps {
  currentUsage: number;
  usageLimit: number;
  showDetails?: boolean;
  showWarnings?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function UsageDisplay({
  currentUsage,
  usageLimit,
  showDetails = true,
  showWarnings = true,
  size = "md",
  className = "",
}: UsageDisplayProps) {
  const usagePercentage = (currentUsage / usageLimit) * 100;
  const remainingPercentage = 100 - usagePercentage;
  
  const getUsageStatus = () => {
    if (usagePercentage >= 100) return "exceeded";
    if (usagePercentage >= 95) return "critical";
    if (usagePercentage >= 80) return "warning";
    return "normal";
  };

  const getUsageColor = () => {
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
  };

  const getUsedColor = () => {
    const baseColor = getUsageColor();
    return baseColor === "#ef4444" ? "#dc2626" :
           baseColor === "#f97316" ? "#ea580c" :
           baseColor === "#eab308" ? "#d97706" :
           "#2563eb";
  };

  const getStatusIcon = () => {
    const status = getUsageStatus();
    switch (status) {
      case "exceeded":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "critical":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default:
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusBadge = () => {
    const status = getUsageStatus();
    switch (status) {
      case "exceeded":
        return <Badge variant="destructive" className="text-xs">Exceeded</Badge>;
      case "critical":
        return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">Critical</Badge>;
      case "warning":
        return <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">Warning</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">Normal</Badge>;
    }
  };

  const getWarningMessage = () => {
    const status = getUsageStatus();
    switch (status) {
      case "exceeded":
        return "❌ Usage limit exceeded. Please upgrade your plan to continue.";
      case "critical":
        return "⚠️ Critical: You're very close to your usage limit. Upgrade soon!";
      case "warning":
        return "⚠️ You're approaching your usage limit. Consider upgrading your plan.";
      default:
        return null;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          container: "text-sm",
          progress: "h-1",
          text: "text-xs",
        };
      case "lg":
        return {
          container: "text-base",
          progress: "h-3",
          text: "text-sm",
        };
      default:
        return {
          container: "text-sm",
          progress: "h-2",
          text: "text-xs",
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Usage Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`font-medium ${sizeClasses.container}`}>
            API Usage
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-medium ${sizeClasses.container}`}>
            {currentUsage}/{usageLimit} calls
          </span>
          {getStatusBadge()}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className={`relative ${sizeClasses.progress} w-full overflow-hidden rounded-full bg-gray-100`}>
          {/* Used part (darker version of the color) */}
          <div 
            className="absolute left-0 top-0 h-full transition-all duration-300"
            style={{
              width: `${usagePercentage}%`,
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
        
        {/* Progress Labels */}
        <div className={`relative ${sizeClasses.text} text-gray-500 pb-4`}>
          <span className="absolute" style={{ left: '0%' }}>0%</span>
          <span className="absolute" style={{ left: '50%', transform: 'translateX(-50%)' }}>50%</span>
          <span className="absolute" style={{ left: '80%', transform: 'translateX(-50%)' }}>80%</span>
          <span className="absolute" style={{ left: '95%', transform: 'translateX(-50%)' }}>95%</span>
        </div>
      </div>

      {/* Usage Details */}
      {showDetails && (
        <div className={`${sizeClasses.text} text-gray-600`}>
          <div className="flex justify-between">
            <span>Usage Percentage:</span>
            <span className="font-medium">{Math.round(usagePercentage)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Remaining Calls:</span>
            <span className="font-medium">{Math.max(0, usageLimit - currentUsage)}</span>
          </div>
        </div>
      )}

      {/* Warning Message */}
      {showWarnings && getWarningMessage() && (
        <div className={`${sizeClasses.text} mt-3 p-2 rounded border ${
          getUsageStatus() === "exceeded" 
            ? "bg-red-50 border-red-200 text-red-800" 
            : getUsageStatus() === "critical"
            ? "bg-orange-50 border-orange-200 text-orange-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}>
          {getWarningMessage()}
        </div>
      )}
    </div>
  );
}