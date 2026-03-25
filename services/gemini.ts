import { GoogleGenerativeAI } from "@google/generative-ai";
import { MedicalDocument, MigraineEntry } from "./data";
import { GEMINI_API_KEY } from "@/config/api-keys";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const GeminiService = {
  async getAIInsights(entries: MigraineEntry[], medicalDocs: MedicalDocument[]) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const entriesContext = entries.map(e => (
        `Date: ${e.date}, Pain: ${e.pain}/10, Pressure: ${e.pressure}hPa, Temp: ${e.temp}C, Water: ${e.water}L, Food: ${e.food}, Sleep: ${e.sleepHours}h, Stress: ${e.stressLevel}, Mood: ${e.mood || 'N/A'}`
      )).join('\n');

      const docsContext = medicalDocs.map(d => (
        `Exam Date: ${d.date}, Content: ${d.content || 'N/A'}`
      )).join('\n');

      const prompt = `
        Jesteś ekspertem analizy danych medycznych specjalizującym się w migrenach. 
        Poniżej znajdują się logi pacjenta dotyczące ataków migreny oraz wyniki jego badań lekarskich.
        Przeanalizuj te dane i znajdź potencjalne zależności, wyzwalacze lub spostrzeżenia, które mogą pomóc pacjentowi zrozumieć jego stan.
        
        LOGI ATAKÓW:
        ${entriesContext}
        
        WYNIKI BADAŃ:
        ${docsContext}
        
        Proszę o zwięzłą analizę (max 4-5 punktów) w języku polskim. Skup się na korelacjach między wynikami badań a atakami.
        Jeśli nie widzisz wyraźnych korelacji, zasugeruj na co pacjent powinien zwrócić uwagę (np. konkretne czynniki pogodowe lub dietetyczne wspomniane w badaniach).
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (e) {
      console.error("Gemini AI error:", e);
      return "Nie udało się wygenerować analizy AI. Sprawdź połączenie lub spróbuj ponownie.";
    }
  },

  async getMigrainePrediction(entries: MigraineEntry[], forecast: any[]) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const historyContext = entries.slice(0, 10).map(e => (
        `Date: ${e.date}, Pain: ${e.pain}, Pressure: ${e.pressure}hPa, Temp: ${e.temp}C`
      )).join('\n');

      const forecastContext = forecast.map(f => (
        `Day: ${f.fullDate}, Temp: ${f.temp}C, Pressure: ${f.pressure}hPa, Sky: ${f.description}`
      )).join('\n');

      const prompt = `
        Jesteś systemem wczesnego ostrzegania przed migreną. 
        NA PODSTAWIE HISTORII:
        ${historyContext}
        
        ORAZ PROGNOZY POGODY:
        ${forecastContext}
        
        Oceń ryzyko wystąpienia migreny w najbliższych dniach. 
        Zwróć odpowiedź w formacie JSON:
        {
          "riskLevel": "Niskie" | "Średnie" | "Wysokie",
          "warning": "Krótkie ostrzeżenie po polsku (np. Skok ciśnienia jutro)",
          "targetDay": "Dzień, na który należy uważać",
          "advice": "Konkretna porada jak zapobiec atakowi w tej sytuacji (np. Unikaj kawy, nawadniaj się bardziej, odpocznij)"
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Clean up JSON if Gemini adds markdown
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    } catch (e) {
      console.error("Prediction error:", e);
      return { riskLevel: "Błąd", warning: "Nie udało się pobrać prognozy AI.", targetDay: "", advice: "" };
    }
  }
};
