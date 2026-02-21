import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog, CloudSun, Loader2 } from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'sun': Sun,
  'cloud': Cloud,
  'cloud-sun': CloudSun,
  'cloud-rain': CloudRain,
  'cloud-snow': CloudSnow,
  'cloud-lightning': CloudLightning,
  'cloud-drizzle': CloudDrizzle,
  'cloud-fog': CloudFog,
};

export function WeatherWidget() {
  const { weather, isLoading } = useWeather();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1.5 border border-border">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-medium">--°C</span>
      </div>
    );
  }

  const IconComponent = weather?.icon ? iconMap[weather.icon] || Cloud : Cloud;

  return (
    <div className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1.5 border border-border" title={weather?.condition || 'Weather'}>
      <IconComponent className="w-4 h-4" />
      <span className="text-sm font-medium">{weather?.temp ?? '--'}°C</span>
    </div>
  );
}
