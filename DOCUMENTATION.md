# Dokumentacja Techniczna - Migrena-Log

## 🏗️ Architektura i Działanie
Aplikacja została zbudowana w oparciu o framework **Expo** (React Native) z wykorzystaniem **TypeScript**. Dane są przechowywane wyłącznie lokalnie na urządzeniu użytkownika, co gwarantuje prywatność.

### 🏠 Ekran Główny (Dziennik)
- Wyświetla oś czasu z wpisami o migrenach oraz dodanymi badaniami medycznymi.
- Zawiera panel prognozy pogody na 7 dni (pobierany z OpenWeatherMap).
- Wyświetla system ostrzegania AI, jeśli ryzyko migreny jest podwyższone.

### 🧪 Ekran Analizy (Analytics)
- Prezentuje wykresy trendów bólu.
- Posiada przycisk „Analizuj z Gemini”, który przesyła zagregowane i anonimowe dane z logów oraz treść badań do modelu AI w celu znalezienia korelacji.

---

## 🛠️ Usługi i Logika (Services)

### 1. `StorageService` (`data.ts`)
Zarządza zapisem i odczytem danych za pomocą `@react-native-async-storage/async-storage`.
- **Kluczowe modele**:
  - `MigraineEntry`: Przechowuje siłę bólu (0-10), czynniki (sen, stres, woda, jedzenie) oraz dane pogodowe.
  - `MedicalDocument`: Przechowuje metadane badań (data, nazwa pliku) oraz ich treść/interpretację.

### 2. `WeatherService` (`data.ts`)
Integruje się z **OpenWeatherMap API**.
- Pobiera aktualne ciśnienie i temperaturę na podstawie lokalizacji urządzenia (`expo-location`).
- Obsługuje 5/7-dniową prognozę pogody do celów predykcyjnych.

### 3. `GeminiService` (`gemini.ts`)
Wykorzystuje SDK `@google/generative-ai` do komunikacji z modelem **Gemini 1.5 Flash**.
- `getAIInsights`: Analizuje historię pod kątem stałych triggerów (np. dieta + pogoda).
- `getMigrainePrediction`: Ocenia ryzyko na podstawie prognozy pogody i dostarcza spersonalizowaną poradę profilaktyczną.

---

## 📦 Główne Zależności
- `@react-native-async-storage/async-storage`: Baza danych lokalna.
- `@google/generative-ai`: Integracja z modelem AI.
- `expo-document-picker`: Wybór plików (badania medyczne).
- `expo-file-system`: Zarządzanie zapisanymi dokumentami.
- `lucide-react-native`: System ikon.
- `react-native-chart-kit`: Renderowanie wykresów trendów.
