# 🧠 Migrena-Log – Twój osobisty analityk migreny

## 📋 O projekcie
Aplikacja stworzona, aby pomóc osobom cierpiącym na migreny w identyfikacji ukrytych przyczyn ataków. Projekt łączy monitorowanie zdrowia z danymi biometeorologicznymi, tworząc bazę wiedzy o Twoim samopoczuciu.

**Dlaczego to buduję?** Jako osoba wchodząca do świata IT, chciałem rozwiązać realny problem, z którym boryka się wielu ludzi, jednocześnie ucząc się nowoczesnych technologii.

## 🚀 Funkcje
- 📝 **Dziennik wpisów**: Rejestracja natężenia bólu, spożytych pokarmów i ilości wypitej wody.
- 🩸 **Cykl hormonalny**: Opcja zaznaczania dni miesiączki dla lepszej analizy korelacji.
- ☁️ **Dane Biometeo**: Automatyczne pobieranie ciśnienia i temperatury oraz **prognoza na 7 dni**.
- 📊 **Analityka AI (Gemini)**: Zaawansowana analiza logów i wyników badań przez model Gemini 1.5 Flash.
- 🛡️ **Zarządzanie Dokumentacją**: Możliwość przesyłania wyników badań (PDF/Obrazy) z przypisaniem do daty.
- 🔮 **Przewidywanie Ataków**: Inteligentny system ostrzegania przed migreną na podstawie historii i prognoz pogody.
- 💾 **Trwałość danych**: Wykorzystanie `AsyncStorage` – Twoje dane są bezpieczne lokalnie na urządzeniu.
- 🔔 **Powiadomienia**: Codzienne przypomnienia o wpisie.

## 🛠️ Technologie
- **Frontend**: React Native (Expo SDK 54)
- **AI Engine**: Google Gemini API (Generative AI)
- **Komponenty**: Lucide-React-Native, Expo Router
- **Dokumenty**: Expo Document Picker & FileSystem
- **Pogoda**: OpenWeatherMap API

## 📈 Plan Rozwoju (Roadmap)
- [x] Przejście na **React Native (Expo)**.
- [x] Integracja z **OpenWeatherMap API**.
- [x] **Analiza AI (Gemini)** – spersonalizowane spostrzeżenia i porady.
- [x] **Zarządzanie badaniami medycznymi**.
- [x] **Przewidywanie ryzyka migreny**.
- [ ] Synchronizacja danych w chmurze.
- [ ] Logowanie użytkownika i zapis danych w chmurze (Firebase).

## 💻 Jak uruchomić projekt lokalnie?
1. Sklonuj repozytorium: `git clone https://github.com/darekhotala-droid/migrena.git`
2. Wejdź do folderu: `cd migrena-app`
3. Zainstaluj zależności: `npm install`
4. Uruchom aplikację: `npx expo start`