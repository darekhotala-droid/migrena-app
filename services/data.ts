import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WEATHER_API_KEY } from '@/config/api-keys';
const STORAGE_KEY = 'migraine-data-v3';
const MEDICAL_STORAGE_KEY = 'migraine-medical-docs-v1';
const AI_ANALYSES_STORAGE_KEY = 'migraine-ai-analyses-v1';

export interface MedicalDocument {
  id: string;
  date: string;
  timestamp: string;
  fileName: string;
  fileUri: string;
  fileType: string;
  content?: string;
  aiInterpretation?: string;
}

export interface AIAnalysis {
  id: string;
  date: string;       // e.g. 25.03.2024
  time: string;       // e.g. 21:40
  timestamp: string;  // ISO string
  content: string;
}

export interface MigraineEntry {
  id: string;
  date: string; // Display date (e.g. 12.03.2024)
  timestamp: string; // ISO string for sorting
  pain: number;
  water: number;
  food: string;
  period: boolean;
  pressure: number;
  temp: number;
  weatherDesc: string;
  // New fields
  sleepHours?: number;
  sleepTime?: string;
  wakeTime?: string;
  stressLevel?: number;
  stressPreviousDay?: number;
  activityType?: string;
  medName?: string;
  medTime?: string;
  medEffectiveness?: string;
  environmentSmells?: string;
  environmentLight?: string;
  environmentNoise?: string;
  mood?: string;
}

export const WeatherService = {
  async getCurrentWeather() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      if ((WEATHER_API_KEY as string) === 'YOUR_API_KEY_HERE' || !WEATHER_API_KEY) {
        return {
          temp: 20,
          pressure: 1013,
          description: 'Brak klucza API',
        };
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`
      );
      
      if (!response.ok) throw new Error('Weather API error');
      
      const data = await response.json();

      return {
        temp: Math.round(data.main.temp),
        pressure: data.main.pressure,
        description: data.weather[0].main,
      };
    } catch (e) {
      console.warn('Weather fetch failed, using default values', e);
      return {
        temp: 20,
        pressure: 1013,
        description: 'Błąd połączenia',
      };
    }
  },
  async getWeatherForecast() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      if (!WEATHER_API_KEY) return null;

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`
      );
      
      if (!response.ok) throw new Error('Forecast API error');
      
      const data = await response.json();
      
      // Group by day and take noon forecast or first of day
      const dailyForecast: any[] = [];
      const seenDates = new Set();
      
      data.list.forEach((item: any) => {
        const date = item.dt_txt.split(' ')[0];
        if (!seenDates.has(date) && dailyForecast.length < 7) {
          seenDates.add(date);
          dailyForecast.push({
            date,
            temp: Math.round(item.main.temp),
            pressure: item.main.pressure,
            description: item.weather[0].main,
            icon: item.weather[0].icon,
            fullDate: new Date(item.dt * 1000).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })
          });
        }
      });

      return dailyForecast;
    } catch (e) {
      console.error('Forecast fetch failed', e);
      return null;
    }
  }
};

export const StorageService = {
  async saveEntries(entries: MigraineEntry[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.error('Save failed', e);
    }
  },
  async loadEntries(): Promise<MigraineEntry[]> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Load failed', e);
      return [];
    }
  },
  async saveMedicalDocuments(docs: MedicalDocument[]) {
    try {
      await AsyncStorage.setItem(MEDICAL_STORAGE_KEY, JSON.stringify(docs));
    } catch (e) {
      console.error('Save medical docs failed', e);
    }
  },
  async loadMedicalDocuments(): Promise<MedicalDocument[]> {
    try {
      const saved = await AsyncStorage.getItem(MEDICAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Load medical docs failed', e);
      return [];
    }
  },
  async saveAIAnalyses(analyses: AIAnalysis[]) {
    try {
      await AsyncStorage.setItem(AI_ANALYSES_STORAGE_KEY, JSON.stringify(analyses));
    } catch (e) {
      console.error('Save AI analyses failed', e);
    }
  },
  async loadAIAnalyses(): Promise<AIAnalysis[]> {
    try {
      const saved = await AsyncStorage.getItem(AI_ANALYSES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Load AI analyses failed', e);
      return [];
    }
  }
};
