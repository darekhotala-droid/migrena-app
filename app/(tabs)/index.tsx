import { MedicalUploadModal } from '@/components/MedicalUploadModal';
import { useModal } from '@/context/modal-context';
import { Image } from 'expo-image';
import {
  Activity,
  AlertTriangle,
  Cloud,
  CloudRain,
  Droplets,
  Edit2,
  Eye,
  Moon,
  Pill,
  Pizza,
  Plus,
  Sparkles,
  Sun,
  Thermometer,
  Trash2,
  Wind,
  X,
  Zap,
  ChevronDown,
  Smile,
  Coffee
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FactorColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MedicalDocument, MigraineEntry, StorageService, WeatherService } from '@/services/data';
import { FileText } from 'lucide-react-native';

const AccordionItem = ({ title, color, icon, children }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: color + '40' }}>
      <TouchableOpacity 
        onPress={() => setIsOpen(!isOpen)} 
        style={{ backgroundColor: color + '15', padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}
      >
        {icon}
        <ThemedText style={{ color, fontWeight: 'bold', flex: 1, fontSize: 13 }}>{title}</ThemedText>
        <ChevronDown size={16} color={color} style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
      </TouchableOpacity>
      {isOpen && (
        <View style={{ padding: 10, backgroundColor: 'rgba(255,255,255,0.02)' }}>
          {children}
        </View>
      )}
    </View>
  );
};

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [entries, setEntries] = useState<MigraineEntry[]>([]);
  const [medicalDocs, setMedicalDocs] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [aiRisk, setAiRisk] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [isMedicalModalVisible, setIsMedicalModalVisible] = useState(false);

  const { openModal, isModalVisible } = useModal();

  const loadData = async () => {
    const [savedEntries, savedDocs] = await Promise.all([
      StorageService.loadEntries(),
      StorageService.loadMedicalDocuments()
    ]);
    setEntries(savedEntries);
    setMedicalDocs(savedDocs);
    const [current, fc] = await Promise.all([
      WeatherService.getCurrentWeather(),
      WeatherService.getWeatherForecast()
    ]);
    setWeather(current);
    if (fc) setForecast(fc);
    setLoading(false);

    // Run prediction if we have history and forecast
    if (savedEntries.length > 0 && fc) {
      const { GeminiService } = await import('@/services/gemini');
      const prediction = await GeminiService.getMigrainePrediction(savedEntries, fc);
      setAiRisk(prediction);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!isModalVisible) {
      loadData();
    }
  }, [isModalVisible]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) {
        onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Usuń', style: 'destructive', onPress: onConfirm }
      ]);
    }
  };

  const getPainColor = (pain: number) => {
    if (pain === 0) return '#10b981'; // Green
    if (pain <= 4) return '#facc15'; // Yellow
    if (pain <= 7) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getWeatherInfo = (description: string) => {
    const desc = description?.toLowerCase() || '';
    if (desc.includes('clear') || desc.includes('sun')) return { icon: <Sun size={20} color="#facc15" />, label: 'Słońce' };
    if (desc.includes('cloud')) return { icon: <Cloud size={20} color="#60a5fa" />, label: 'Chmury' };
    if (desc.includes('rain')) return { icon: <CloudRain size={20} color="#3b82f6" />, label: 'Deszcz' };
    return { icon: <Wind size={20} color={theme.muted} />, label: description };
  };

  const getPast3Days = () => {
    const days = [];
    for (let i = 3; i >= 1; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric' });
      // Find entry for this day
      const entry = entries.find(e => {
        const entryDate = new Date(e.timestamp);
        return entryDate.getDate() === d.getDate() && entryDate.getMonth() === d.getMonth();
      });
      days.push({ dayStr, ...entry });
    }
    return days;
  };

  const deleteSelectedPrompt = () => {
    const count = selectedIds.size;
    confirmAction(
      'Usuń wpisy',
      `Czy na pewno chcesz usunąć ${count} ${count === 1 ? 'wpis' : 'wpisy'}?`,
      async () => {
        const updated = entries.filter(e => !selectedIds.has(e.id));
        setEntries(updated);
        await StorageService.saveEntries(updated);
        setSelectedIds(new Set());
      }
    );
  };

  const deleteEntryPrompt = (id: string) => {
    confirmAction('Usuń wpis', 'Czy na pewno chcesz usunąć ten wpis?', async () => {
      const updated = entries.filter(e => e.id !== id);
      setEntries(updated);
      await StorageService.saveEntries(updated);
    });
  };

  const clearData = () => {
    confirmAction(
      'Wyczyść dane',
      'Czy na pewno chcesz usunąć wszystkie wpisy? Tej operacji nie można cofnąć.',
      async () => {
        await StorageService.saveEntries([]);
        setEntries([]);
      }
    );
  };

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
        refreshControl={< RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
      >
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
          />
          <View>
            <ThemedText type="title" style={styles.title}>Pamiętnik Migrenowca</ThemedText>
            <ThemedText style={styles.subtitle}>Twój analityk biometeo</ThemedText>
          </View>
        </View>

        {/* Forecast Panel */}
        <View style={[styles.forecastContainer, { backgroundColor: theme.card }]}>
          <ThemedText style={[styles.cardTitle, { textAlign: 'center', marginBottom: 16 }]}>Pogoda</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, flexGrow: 1, justifyContent: 'center' }}>
            {getPast3Days().map((d: any, i) => (
              <View key={`past-${i}`} style={[styles.forecastItem, { opacity: 0.6 }]}>
                <ThemedText style={styles.forecastDay}>{d.dayStr}</ThemedText>
                {d.temp ? (
                  <>
                    <ThemedText style={styles.forecastTemp}>{Math.round(d.temp)}°C</ThemedText>
                    {getWeatherInfo(d.description || '').icon}
                  </>
                ) : (
                  <ThemedText style={styles.mutedTextSmall}>Brak logów</ThemedText>
                )}
              </View>
            ))}

            <View style={[styles.forecastItem, styles.todayItem, { borderColor: theme.tint }]}>
              <ThemedText style={[styles.forecastDay, { color: theme.tint, fontWeight: 'bold' }]}>DZISIAJ</ThemedText>
              {weather ? (
                <>
                  <ThemedText style={[styles.forecastTemp, { fontSize: 22 }]}>{Math.round(weather.temp)}°C</ThemedText>
                  {getWeatherInfo(weather.description).icon}
                  <ThemedText style={[styles.forecastDesc, { color: theme.tint }]}>{getWeatherInfo(weather.description).label}</ThemedText>
                </>
              ) : (
                <ActivityIndicator size="small" color={theme.tint} />
              )}
            </View>

            {forecast.slice(1, 4).map((f, i) => (
              <View key={`future-${i}`} style={styles.forecastItem}>
                <ThemedText style={styles.forecastDay}>{f.fullDate.split(',')[0]}</ThemedText>
                <ThemedText style={styles.forecastTemp}>{Math.round(f.temp)}°C</ThemedText>
                {getWeatherInfo(f.description).icon}
                <ThemedText style={styles.forecastDesc}>{getWeatherInfo(f.description).label}</ThemedText>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Weather Card */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={[styles.weatherHeader, { justifyContent: 'center' }]}>
            <CloudRain size={20} color={theme.tint} />
            <ThemedText style={[styles.cardTitle, { textAlign: 'center' }]}>Aktualna Pogoda</ThemedText>
          </View>
          {weather ? (
            <View style={styles.weatherRow}>
               <View style={{ flex: 1 }}>
                <View style={styles.weatherStat}>
                  <Thermometer size={16} color={theme.muted} />
                  <ThemedText>{weather.temp}°C</ThemedText>
                </View>
                <View style={styles.weatherStat}>
                  <Wind size={16} color={theme.muted} />
                  <ThemedText>{weather.pressure} hPa</ThemedText>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {getWeatherInfo(weather.description).icon}
                <ThemedText style={{ color: theme.tint, fontWeight: 'bold' }}>{getWeatherInfo(weather.description).label}</ThemedText>
              </View>
            </View>
          ) : (
            <ThemedText style={styles.mutedText}>Pobieranie pogody...</ThemedText>
          )}
        </View>

        {/* AI RISK WARNING */}
        {aiRisk && aiRisk.riskLevel !== 'Niskie' && (
          <View style={[styles.riskCard, { borderColor: aiRisk.riskLevel === 'Wysokie' ? '#ef4444' : '#f97316' }]}>
            <View style={styles.labelRow}>
              <AlertTriangle size={20} color={aiRisk.riskLevel === 'Wysokie' ? '#ef4444' : '#f97316'} />
              <ThemedText style={[styles.riskTitle, { color: aiRisk.riskLevel === 'Wysokie' ? '#ef4444' : '#f97316' }]}>
                Ostrzeżenie: Ryzyko {aiRisk.riskLevel}
              </ThemedText>
            </View>
            <ThemedText style={styles.riskText}>{aiRisk.warning}</ThemedText>
            {aiRisk.advice && (
              <View style={[styles.adviceBox, { backgroundColor: theme.background }]}>
                <Sparkles size={14} color={theme.tint} style={{ marginRight: 6 }} />
                <ThemedText style={styles.adviceText}>{aiRisk.advice}</ThemedText>
              </View>
            )}
            {aiRisk.targetDay && (
              <ThemedText style={styles.riskDay}>Uwaga na: {aiRisk.targetDay}</ThemedText>
            )}
          </View>
        )}

        {/* Spostrzeżenia Statystyczne */}
        {(entries.some(e => e.pain > 6 && (
          e.pressure < 1005 || e.food || e.water < 1.5 || (e.stressLevel !== undefined && e.stressLevel > 7) ||
          (e.sleepHours !== undefined && (e.sleepHours < 6 || e.sleepHours > 9)) ||
          e.environmentSmells || e.environmentLight || e.environmentNoise
        ))) && (
            <View style={styles.insightsSection}>
              <ThemedText style={[styles.cardTitle, { marginBottom: 10 }]}>Spostrzeżenia Statystyczne</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 5 }}>
                {entries.some(e => e.pain > 6 && e.pressure < 1005) && (
                  <View style={[styles.insightCard, { borderColor: FactorColors.weather }]}>
                    <Wind size={18} color={FactorColors.weather} />
                    <ThemedText style={styles.insightTitle}>Korelacja Meteo</ThemedText>
                    <ThemedText style={styles.insightText}>Ataki przy niskim ciśnieniu</ThemedText>
                  </View>
                )}
                {entries.some(e => e.pain > 6 && e.water < 1.5) && (
                  <View style={[styles.insightCard, { borderColor: FactorColors.hydration }]}>
                    <Droplets size={18} color={FactorColors.hydration} />
                    <ThemedText style={styles.insightTitle}>Nawodnienie</ThemedText>
                    <ThemedText style={styles.insightText}>{'Ból przy mniej niż 1.5L wody'}</ThemedText>
                  </View>
                )}
                {entries.some(e => e.pain > 6 && e.stressLevel !== undefined && e.stressLevel > 7) && (
                  <View style={[styles.insightCard, { borderColor: FactorColors.stress }]}>
                    <Zap size={18} color={FactorColors.stress} />
                    <ThemedText style={styles.insightTitle}>Stres</ThemedText>
                    <ThemedText style={styles.insightText}>Ataki przy wysokim stresie</ThemedText>
                  </View>
                )}
                {entries.some(e => e.pain > 6 && e.sleepHours !== undefined && (e.sleepHours < 6 || e.sleepHours > 9)) && (
                  <View style={[styles.insightCard, { borderColor: FactorColors.sleep }]}>
                    <Moon size={18} color={FactorColors.sleep} />
                    <ThemedText style={styles.insightTitle}>Higiena Snu</ThemedText>
                    <ThemedText style={styles.insightText}>Zaburzenia snu i ból</ThemedText>
                  </View>
                )}
                {entries.some(e => e.pain > 6 && (e.environmentSmells || e.environmentLight || e.environmentNoise)) && (
                  <View style={[styles.insightCard, { borderColor: FactorColors.environment }]}>
                    <Eye size={18} color={FactorColors.environment} />
                    <ThemedText style={styles.insightTitle}>Otoczenie</ThemedText>
                    <ThemedText style={styles.insightText}>Wpływ czynników zewnętrznych</ThemedText>
                  </View>
                )}
                {entries.some(e => e.pain > 6 && (e.mood === 'Złe' || e.mood === 'Bardzo złe')) && (
                  <View style={[styles.insightCard, { borderColor: FactorColors.mood }]}>
                    <Smile size={18} color={FactorColors.mood} />
                    <ThemedText style={styles.insightTitle}>Samopoczucie</ThemedText>
                    <ThemedText style={styles.insightText}>Obniżony nastrój a ból</ThemedText>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

        {/* History List Header */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <ThemedText style={styles.sectionTitle}>Dziennik</ThemedText>
            <TouchableOpacity
              style={[styles.addMedicalBtn, { backgroundColor: theme.tint + '15', borderColor: theme.tint }]}
              onPress={() => setIsMedicalModalVisible(true)}
            >
              <FileText size={16} color={theme.tint} />
              <ThemedText style={{ color: theme.tint, fontWeight: 'bold', fontSize: 13 }}>Dodaj badanie</ThemedText>
            </TouchableOpacity>
          </View>
          <View style={styles.headerActions}>
            {selectedIds.size === 0 ? (
              <TouchableOpacity onPress={clearData}>
                <ThemedText style={{ color: theme.muted }}>Wyczyść historię</ThemedText>
              </TouchableOpacity>
            ) : (
              <View style={styles.selectionActions}>
                {selectedIds.size === 1 && (
                  <TouchableOpacity
                    onPress={() => {
                      const entry = entries.find(e => e.id === Array.from(selectedIds)[0]);
                      if (entry) openModal(entry);
                    }}
                    style={styles.actionIcon}
                  >
                    <Edit2 size={22} color={theme.muted} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={deleteSelectedPrompt} style={styles.actionIcon}>
                  <Trash2 size={22} color={theme.tint} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelectedIds(new Set())} style={[styles.actionIcon, { marginLeft: 8 }]}>
                  <X size={22} color={theme.muted} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <MedicalUploadModal
          isVisible={isMedicalModalVisible}
          onClose={() => setIsMedicalModalVisible(false)}
          onSave={async (doc) => {
            const updated = [doc, ...medicalDocs];
            setMedicalDocs(updated);
            await StorageService.saveMedicalDocuments(updated);
          }}
        />

        {entries.length === 0 && medicalDocs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.mutedText}>Brak wpisów. Kliknij +, aby dodać.</ThemedText>
          </View>
        ) : (
          [...entries, ...medicalDocs.map(d => ({ ...d, isMedical: true } as any))]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map((item: any) => (
              item.isMedical ? (
                <View key={item.id} style={[styles.historyCard, { backgroundColor: theme.card, borderLeftColor: '#3b82f6', borderLeftWidth: 5 }]}>
                  <View style={styles.historyHeader}>
                    <ThemedText style={styles.dateText}>{item.date}</ThemedText>
                    <TouchableOpacity onPress={async () => {
                      const updated = medicalDocs.filter(d => d.id !== item.id);
                      setMedicalDocs(updated);
                      await StorageService.saveMedicalDocuments(updated);
                    }}>
                      <Trash2 size={16} color={theme.muted} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.historyBody}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <FileText size={20} color="#3b82f6" />
                      <ThemedText style={{ fontWeight: 'bold' }}>Wynik badania: {item.fileName}</ThemedText>
                    </View>
                    <ThemedText style={styles.historyDetails}>Dokument medyczny dodany do analizy AI</ThemedText>
                  </View>
                </View>
              ) : (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    if (selectedIds.size > 0) {
                      toggleSelection(item.id);
                    } else {
                      setExpandedEntryId(prev => prev === item.id ? null : item.id);
                    }
                  }}
                  onLongPress={() => toggleSelection(item.id)}
                  delayLongPress={300}
                  style={({ pressed }) => [
                    styles.historyCard,
                    {
                      backgroundColor: selectedIds.has(item.id)
                        ? (colorScheme === 'dark' ? 'rgba(255, 45, 85, 0.15)' : 'rgba(255, 45, 85, 0.05)')
                        : theme.card,
                      borderColor: selectedIds.has(item.id) ? theme.tint : 'transparent',
                      borderWidth: selectedIds.has(item.id) ? 1 : 0,
                      opacity: pressed ? 0.7 : 1
                    }
                  ]}
                >
                  <View style={styles.historyRow}>
                    <View style={styles.historyLeft}>
                      <View style={[styles.painBadgeSmall, { backgroundColor: getPainColor(item.pain) + '20', borderColor: getPainColor(item.pain) }]}>
                        <ThemedText style={[styles.painTextSmall, { color: getPainColor(item.pain) }]}>
                          {item.pain}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.historyCenter}>
                      <View style={styles.historyHeaderMini}>
                        <ThemedText style={styles.dateTextMini}>{item.date}</ThemedText>
                        {selectedIds.has(item.id) && (
                          <View style={styles.selectedBadgeMini}>
                            <ThemedText style={{ color: theme.tint, fontSize: 8, fontWeight: 'bold' }}>OK</ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText style={styles.historySummaryMini}>
                        {item.pressure} hPa | {item.temp}°C | {item.water}L
                      </ThemedText>
                    </View>

                    <View style={styles.historyRight}>
                      {item.sleepHours && <Moon size={14} color={FactorColors.sleep} />}
                      {item.medName && <Pill size={14} color={theme.tint} />}
                      {item.stressLevel > 5 && <Zap size={14} color={FactorColors.stress} />}
                      {item.activityType && <Activity size={14} color={FactorColors.activity} />}
                      {item.food && <Coffee size={14} color={FactorColors.diet} />}
                      {(item.environmentSmells || item.environmentLight || item.environmentNoise) && <Eye size={14} color={FactorColors.environment} />}
                      {item.mood && <Smile size={14} color={FactorColors.mood} />}
                    </View>
                  </View>

                  {/* Expanded Content Accordions */}
                  {expandedEntryId === item.id && (
                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
                      <ThemedText style={{ fontStyle: 'italic', marginBottom: 8, fontSize: 12, opacity: 0.6 }}>Opcje i szczegóły wpisu:</ThemedText>
                      
                      {item.stressLevel > 0 && (
                        <AccordionItem title="Stres" color={FactorColors.stress} icon={<Zap size={16} color={FactorColors.stress} />}>
                          <ThemedText>Poziom stresu: {item.stressLevel}/10</ThemedText>
                        </AccordionItem>
                      )}

                      {(item.environmentSmells || item.environmentLight || item.environmentNoise) && (
                        <AccordionItem title="Otoczenie" color={FactorColors.environment} icon={<Eye size={16} color={FactorColors.environment} />}>
                          {item.environmentSmells && <ThemedText>• Intensywne zapachy</ThemedText>}
                          {item.environmentLight && <ThemedText>• Rażące światło</ThemedText>}
                          {item.environmentNoise && <ThemedText>• Hałas</ThemedText>}
                        </AccordionItem>
                      )}

                      {!!item.food && (
                        <AccordionItem title="Dieta i Używki" color={FactorColors.diet} icon={<Coffee size={16} color={FactorColors.diet} />}>
                          <ThemedText>{item.food}</ThemedText>
                        </AccordionItem>
                      )}

                      {!!item.mood && (
                        <AccordionItem title="Samopoczucie" color={FactorColors.mood} icon={<Smile size={16} color={FactorColors.mood} />}>
                          <ThemedText>{item.mood}</ThemedText>
                        </AccordionItem>
                      )}

                      {!!item.sleepHours && (
                        <AccordionItem title="Higiena Snu" color={FactorColors.sleep} icon={<Moon size={16} color={FactorColors.sleep} />}>
                          <ThemedText>Przespane godziny: {item.sleepHours}h</ThemedText>
                        </AccordionItem>
                      )}

                      {!!item.medName && (
                        <AccordionItem title="Leki" color={theme.tint} icon={<Pill size={16} color={theme.tint} />}>
                          <ThemedText>{item.medName}</ThemedText>
                        </AccordionItem>
                      )}
                      
                      <TouchableOpacity style={{ marginTop: 16, alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 5 }} onPress={() => openModal(item)}>
                        <Edit2 size={16} color={theme.tint} />
                        <ThemedText style={{ color: theme.tint, fontWeight: 'bold' }}>Edytuj wpis</ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}
                </Pressable>
              )
            ))
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 15,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  title: {
    fontSize: 26,
  },
  subtitle: {
    opacity: 0.7,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weatherStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  alertCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 45, 85, 0.05)',
  },
  alertText: {
    fontSize: 14,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    minHeight: 40,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  riskCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 45, 85, 0.05)',
  },
  riskTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  riskText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  adviceBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  adviceText: {
    fontSize: 13,
    fontStyle: 'italic',
    flex: 1,
  },
  riskDay: {
    marginTop: 8,
    fontWeight: 'bold',
    fontSize: 14,
  },
  insightsSection: {
    marginBottom: 20,
  },
  insightCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    minWidth: 140,
    alignItems: 'center',
    gap: 4,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  insightText: {
    fontSize: 10,
    opacity: 0.7,
    textAlign: 'center',
  },
  historyCard: {
    borderRadius: 16,
    padding: 10,
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyLeft: {
    width: 36,
    alignItems: 'center',
  },
  painBadgeSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  painTextSmall: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  historyCenter: {
    flex: 1,
  },
  historyHeaderMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTextMini: {
    fontSize: 12,
    fontWeight: 'bold',
    opacity: 0.7,
  },
  selectedBadgeMini: {
    backgroundColor: 'rgba(255, 45, 85, 0.1)',
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 45, 85, 0.4)',
  },
  historySummaryMini: {
    fontSize: 11,
    opacity: 0.6,
  },
  historyRight: {
    flexDirection: 'row',
    gap: 8,
    opacity: 0.8,
  },
  addMedicalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },

  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontWeight: 'bold',
    opacity: 0.6,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIcon: {
    padding: 4,
  },
  historyBody: {
    gap: 4,
  },
  painBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  painText: {
    fontWeight: '900',
    fontSize: 18,
  },
  historyDetails: {
    fontSize: 14,
    opacity: 0.8,
  },
  historyFood: {
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
  },
  extraDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    opacity: 0.8,
  },
  environmentText: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 4,
    fontStyle: 'italic',
  },
  mutedText: {
    opacity: 0.5,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  clearButton: {
    marginTop: 30,
    marginBottom: 100,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalScroll: {
    paddingBottom: 40,
  },
  miniLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  emptyContainer: {
    paddingVertical: 40,
  },
  selectedBadge: {
    backgroundColor: 'rgba(255, 45, 85, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 45, 85, 0.3)',
  },
  forecastContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  forecastItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  todayItem: {
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 45, 85, 0.05)',
    paddingHorizontal: 10,
  },
  forecastDay: {
    fontSize: 11,
    opacity: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  forecastTemp: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  forecastDesc: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  mutedTextSmall: {
    fontSize: 10,
    opacity: 0.4,
    fontStyle: 'italic',
    marginTop: 8,
  },
});
