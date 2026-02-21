import * as React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  label?: string;
}

export function CircularProgress({
  value,
  size = 80,
  strokeWidth = 6,
  className,
  showValue = true,
  label,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  // Color based on score
  const getScoreColor = () => {
    if (value >= 80) return "hsl(var(--score-high))";
    if (value >= 60) return "hsl(var(--score-medium))";
    return "hsl(var(--score-low))";
  };

  const getScoreLabel = () => {
    if (value >= 80) return "Great!";
    if (value >= 60) return "Good";
    return "Okay";
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getScoreColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span 
            className="font-bold leading-none"
            style={{ fontSize: size * 0.22 }}
          >
            {Math.round(value)}
          </span>
          {label && (
            <span 
              className="text-muted-foreground leading-tight"
              style={{ fontSize: size * 0.12 }}
            >
              {label}
            </span>
          )}
          {!label && (
            <span 
              className="text-muted-foreground leading-tight"
              style={{ fontSize: size * 0.11 }}
            >
              {getScoreLabel()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
