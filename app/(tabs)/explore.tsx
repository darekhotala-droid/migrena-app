import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  View, 
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from 'expo-router';
import { 
  ChartBar, 
  TrendingUp, 
  Zap, 
  AlertCircle,
  Sparkles,
  RefreshCcw,
  Wind,
  Droplets,
  Moon,
  Eye,
  Smile
} from 'lucide-react-native';


import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FactorColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StorageService, MigraineEntry, MedicalDocument } from '@/services/data';
import { GeminiService } from '@/services/gemini';
const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [entries, setEntries] = useState<MigraineEntry[]>([]);
  const [medicalDocs, setMedicalDocs] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const loadData = async () => {
    const [savedEntries, savedDocs] = await Promise.all([
      StorageService.loadEntries(),
      StorageService.loadMedicalDocuments()
    ]);

    // Sort entries
    const sorted = [...savedEntries].sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : parseInt(a.id);
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : parseInt(b.id);
      return timeA - timeB;
    });

    setEntries(sorted);
    setMedicalDocs(savedDocs);
    setLoading(false);
  };

  const runAIAnalysis = async () => {
    if (entries.length === 0) return;
    setIsAnalyzing(true);
    const insights = await GeminiService.getAIInsights(entries, medicalDocs);
    setAiAnalysis(insights);
    setIsAnalyzing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const chartData = entries.map((e, index) => ({
    x: index,
    y: e.pain,
    label: e.date.split('.')[0] + '.' + e.date.split('.')[1]
  }));

  const getAverages = () => {
    if (entries.length === 0) return { pain: 0, pressure: 0 };
    const avgPain = entries.reduce((acc, e) => acc + e.pain, 0) / entries.length;
    const avgPressure = entries.reduce((acc, e) => acc + e.pressure, 0) / entries.length;
    return { 
      pain: avgPain.toFixed(1), 
      pressure: Math.round(avgPressure) 
    };
  };

  const avgs = getAverages();

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <ThemedText type="title" style={styles.title}>Analiza Danych</ThemedText>
            <ChartBar size={28} color={theme.tint} />
          </View>
          <ThemedText style={styles.subtitle}>Odkryj swoje punkty zapalne</ThemedText>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <TrendingUp size={20} color={theme.tint} />
            <ThemedText style={styles.statValue}>{avgs.pain}</ThemedText>
            <ThemedText style={styles.statLabel}>Średni ból</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Zap size={20} color="#FFD700" />
            <ThemedText style={styles.statValue}>{entries.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Wpisy</ThemedText>
          </View>
        </View>

        {/* Chart View */}
        <View style={[styles.chartContainer, { backgroundColor: theme.card }]}>
          <ThemedText style={styles.cardTitle}>Trend Bólu</ThemedText>
          {entries.length > 1 ? (
            <LineChart
              data={{
                labels: chartData.map(d => d.label),
                datasets: [{ data: chartData.map(d => d.y) }]
              }}
              width={width - 72}
              height={220}
              chartConfig={{
                backgroundColor: theme.card,
                backgroundGradientFrom: theme.card,
                backgroundGradientTo: theme.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 45, 85, ${opacity})`,
                labelColor: (opacity = 1) => theme.text,
                style: { borderRadius: 16 },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: theme.tint
                }
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          ) : (
            <ThemedText style={styles.mutedText}>
              Dodaj więcej wpisów, aby zobaczyć wykres.
            </ThemedText>
          )}
        </View>

        {/* AI INSIGHTS SECTION */}
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={styles.sectionTitle}>Spostrzeżenia AI</ThemedText>
          <TouchableOpacity 
            onPress={runAIAnalysis} 
            disabled={isAnalyzing || entries.length === 0}
            style={[styles.aiButton, { opacity: (isAnalyzing || entries.length === 0) ? 0.5 : 1 }]}
          >
            {isAnalyzing ? (
              <ActivityIndicator size="small" color={theme.tint} />
            ) : (
              <>
                <Sparkles size={16} color={theme.tint} />
                <ThemedText style={{ color: theme.tint, fontWeight: 'bold' }}>Analizuj z Gemini</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>

        {aiAnalysis ? (
           <View style={[styles.aiCard, { backgroundColor: theme.card, borderColor: theme.tint }]}>
             <ThemedText style={styles.aiText}>{aiAnalysis}</ThemedText>
           </View>
        ) : (
          <View style={[styles.aiPlaceholder, { backgroundColor: theme.card }]}>
            <ThemedText style={styles.mutedText}>
              {entries.length > 0 
                ? "Kliknij 'Analizuj z Gemini', aby otrzymać spersonalizowane wskazówki na podstawie Twoich logów i badań."
                : "Dodaj wpisy w dzienniku, aby AI mogło przeprowadzić analizę."}
            </ThemedText>
          </View>
        )}

        {/* Insights Section */}
        <ThemedText style={styles.sectionTitle}>Spostrzeżenia Statystyczne</ThemedText>

        {/* Korelacja Meteo */}
        <View style={[styles.insightCard, { backgroundColor: FactorColors.weather + '15', borderColor: FactorColors.weather, borderWidth: 1 }]}>
          <View style={styles.labelRow}>
            <Wind size={20} color={FactorColors.weather} />
            <ThemedText style={[styles.cardTitle, { color: FactorColors.weather }]}>Korelacja Meteo</ThemedText>
          </View>
          <ThemedText style={styles.insightText}>
            {entries.filter(e => e.pain > 6).length > 0 
              ? `Średnie ciśnienie przy silnym bólu (> 6):` 
              : `Brak silnego bólu. Średnie ciśnienie ze wszystkich wpisów:`}
            <ThemedText style={{ fontWeight: 'bold', color: FactorColors.weather }}>
              {" "}{entries.length > 0
                ? (entries.filter(e => e.pain > 6).length > 0
                    ? Math.round(entries.filter(e => e.pain > 6).reduce((acc, e) => acc + e.pressure, 0) / entries.filter(e => e.pain > 6).length)
                    : Math.round(entries.reduce((acc, e) => acc + e.pressure, 0) / entries.length)) + " hPa"
                : "Brak danych"
              }
            </ThemedText>
          </ThemedText>
        </View>

        {/* Nawodnienie */}
        <View style={[styles.insightCard, { backgroundColor: FactorColors.hydration + '15', borderColor: FactorColors.hydration, borderWidth: 1 }]}>
          <View style={styles.labelRow}>
            <Droplets size={20} color={FactorColors.hydration} />
            <ThemedText style={[styles.cardTitle, { color: FactorColors.hydration }]}>Nawodnienie</ThemedText>
          </View>
          <ThemedText style={styles.insightText}>
            {entries.filter(e => e.pain < 4).length > 0
              ? `Średnie nawodnienie przy słabym bólu (< 4):`
              : `Brak słabego bólu. Średnie nawodnienie ze wszystkich wpisów:`}
            <ThemedText style={{ fontWeight: 'bold', color: FactorColors.hydration }}>
              {" "}{entries.length > 0
                ? (entries.filter(e => e.pain < 4).length > 0
                    ? (entries.filter(e => e.pain < 4).reduce((acc, e) => acc + e.water, 0) / entries.filter(e => e.pain < 4).length).toFixed(1)
                    : (entries.reduce((acc, e) => acc + e.water, 0) / entries.length).toFixed(1)) + " L"
                : "Brak danych"
              }
            </ThemedText>
          </ThemedText>
        </View>

        {/* Trigger: Stres */}
        <View style={[styles.insightCard, { backgroundColor: FactorColors.stress + '15', borderColor: FactorColors.stress, borderWidth: 1 }]}>
          <View style={styles.labelRow}>
            <Zap size={20} color={FactorColors.stress} />
            <ThemedText style={[styles.cardTitle, { color: FactorColors.stress }]}>Stres</ThemedText>
          </View>
          <ThemedText style={styles.insightText}>
            {(() => {
              const highStressEntries = entries.filter(e => e.stressLevel !== undefined && e.stressLevel > 7);
              if (highStressEntries.length === 0) return "Brak odnotowanych epizodów wysokiego stresu (> 7).";
              const avgPain = highStressEntries.reduce((acc, e) => acc + e.pain, 0) / highStressEntries.length;
              return `Przy wysokim stresie średni poziom bólu wynosi: ${avgPain.toFixed(1)}.`;
            })()}
          </ThemedText>
        </View>

        {/* Higiena Snu */}
        <View style={[styles.insightCard, { backgroundColor: FactorColors.sleep + '15', borderColor: FactorColors.sleep, borderWidth: 1 }]}>
          <View style={styles.labelRow}>
            <Moon size={20} color={FactorColors.sleep} />
            <ThemedText style={[styles.cardTitle, { color: FactorColors.sleep }]}>Higiena Snu</ThemedText>
          </View>
          <ThemedText style={styles.insightText}>
            {(() => {
              const badSleepEntries = entries.filter(e => e.sleepHours !== undefined && (e.sleepHours < 6 || e.sleepHours > 9));
              if (badSleepEntries.length === 0) return "Brak wpisów ze snem poniżej 6h lub powyżej 9h.";
              const avgPain = badSleepEntries.reduce((acc, e) => acc + e.pain, 0) / badSleepEntries.length;
              return `Przy nieregularnym śnie średni ból wynosi: ${avgPain.toFixed(1)}.`;
            })()}
          </ThemedText>
        </View>

        {/* Otoczenie */}
        <View style={[styles.insightCard, { backgroundColor: FactorColors.environment + '15', borderColor: FactorColors.environment, borderWidth: 1 }]}>
          <View style={styles.labelRow}>
            <Eye size={20} color={FactorColors.environment} />
            <ThemedText style={[styles.cardTitle, { color: FactorColors.environment }]}>Otoczenie</ThemedText>
          </View>
          <ThemedText style={styles.insightText}>
            {(() => {
              const envEntries = entries.filter(e => e.environmentSmells || e.environmentLight || e.environmentNoise);
              if (envEntries.length === 0) return "Brak odnotowanych bodźców zewnętrznych (hałas, światło, zapach).";
              const envPain = envEntries.reduce((acc, e) => acc + e.pain, 0) / envEntries.length;
              return `W obecności bodźców otoczenia średni ból wynosi: ${envPain.toFixed(1)}.`;
            })()}
          </ThemedText>
        </View>

        {/* Samopoczucie */}
        <View style={[styles.insightCard, { backgroundColor: FactorColors.mood + '15', borderColor: FactorColors.mood, borderWidth: 1 }]}>
          <View style={styles.labelRow}>
            <Smile size={20} color={FactorColors.mood} />
            <ThemedText style={[styles.cardTitle, { color: FactorColors.mood }]}>Samopoczucie</ThemedText>
          </View>
          <ThemedText style={styles.insightText}>
            {(() => {
              const badMoodEntries = entries.filter(e => e.mood === 'Złe' || e.mood === 'Bardzo złe');
              if (badMoodEntries.length === 0) return "Brak odnotowanych wpisów ze złym samopoczuciem.";
              const avgPain = badMoodEntries.reduce((acc, e) => acc + e.pain, 0) / badMoodEntries.length;
              return `Przy obniżonym nastroju średni ból wynosi: ${avgPain.toFixed(1)}.`;
            })()}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
  },
  subtitle: {
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  chartContainer: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    minHeight: 280,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  insightCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightText: {
    lineHeight: 20,
    opacity: 0.9,
  },
  mutedText: {
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 45, 85, 0.1)',
  },
  aiCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  aiText: {
    lineHeight: 22,
    fontSize: 15,
  },
  aiPlaceholder: {
    padding: 30,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
