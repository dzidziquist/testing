import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
}

interface UseWeatherReturn {
  weather: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useWeather(): UseWeatherReturn {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (latitude: number, longitude: number) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        // Use fallback weather for non-authenticated users
        setWeather({ temp: 20, condition: 'Unknown', icon: 'cloud' });
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('get-weather', {
        body: { latitude, longitude },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setWeather(data);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch weather');
      // Fallback to default weather
      setWeather({ temp: 20, condition: 'Unknown', icon: 'cloud' });
    } finally {
      setIsLoading(false);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      // Default to a location if geolocation not available
      fetchWeather(40.7128, -74.0060); // New York
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        // Fallback to default location
        fetchWeather(40.7128, -74.0060);
      },
      { timeout: 5000, enableHighAccuracy: false }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  return {
    weather,
    isLoading,
    error,
    refetch: getLocation,
  };
}
