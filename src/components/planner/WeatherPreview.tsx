import { Cloud, CloudRain, Sun, CloudSnow, CloudLightning, Wind } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface WeatherPreviewProps {
  weather: {
    temp: number;
    condition: string;
    icon?: string;
  } | null;
  isLoading: boolean;
}

const weatherIcons: Record<string, React.ElementType> = {
  'Clear': Sun,
  'Sunny': Sun,
  'Partly cloudy': Cloud,
  'Cloudy': Cloud,
  'Overcast': Cloud,
  'Rain': CloudRain,
  'Light rain': CloudRain,
  'Heavy rain': CloudRain,
  'Drizzle': CloudRain,
  'Snow': CloudSnow,
  'Light snow': CloudSnow,
  'Heavy snow': CloudSnow,
  'Thunderstorm': CloudLightning,
  'Windy': Wind,
};

export function WeatherPreview({ weather, isLoading }: WeatherPreviewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
        <Skeleton className="w-5 h-5 rounded" />
        <Skeleton className="w-16 h-4" />
      </div>
    );
  }

  if (!weather) return null;

  const IconComponent = weatherIcons[weather.condition] || Cloud;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg border-2 border-strong">
      <IconComponent className="w-5 h-5 text-muted-foreground" />
      <span className="text-sm font-medium">{Math.round(weather.temp)}°</span>
      <span className="text-xs text-muted-foreground">{weather.condition}</span>
    </div>
  );
}
