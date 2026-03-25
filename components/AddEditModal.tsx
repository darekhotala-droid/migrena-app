import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  TextInput, 
  Switch, 
  Alert, 
  Modal,
  ScrollView,
  Dimensions,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  Thermometer, 
  Droplets, 
  Calendar, 
  Pizza, 
  Plus, 
  X,
  Moon,
  Zap,
  Activity,
  Pill,
  Wind,
  Eye,
  Volume2,
  Minus,
  Smile,
  Coffee
} from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useModal } from '@/context/modal-context';
import { WeatherService, StorageService, MigraineEntry } from '@/services/data';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors, FactorColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

export function AddEditModal({ onSave }: { onSave?: () => void }) {
  const { isModalVisible, editingEntry, closeModal } = useModal();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date(),
    pain: 0,
    water: 2,
    food: '',
    period: false,
    pressure: 1013,
    temp: 20,
    weatherDesc: 'N/A',
    // New fields
    sleepHours: 8,
    sleepTime: '',
    wakeTime: '',
    stressLevel: 0,
    stressPreviousDay: 0,
    activityType: '',
    medName: '',
    medTime: '',
    medEffectiveness: '',
    environmentSmells: '',
    environmentLight: '',
    environmentNoise: '',
    mood: ''
  });

  const [activeSections, setActiveSections] = useState({
    sleep: false,
    stress: false,
    activity: false,
    meds: false,
    environment: false,
    mood: false
  });

  const calculateSleepDuration = (sleep: string, wake: string) => {
    if (!sleep || !wake || !sleep.includes(':') || !wake.includes(':')) return 8;
    const [sh, sm] = sleep.split(':').map(Number);
    const [wh, wm] = wake.split(':').map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(wh) || isNaN(wm)) return 8;
    
    let diff = (wh + wm/60) - (sh + sm/60);
    if (diff < 0) diff += 24;
    return Math.round(diff * 10) / 10;
  };

  const getPainColor = (pain: number) => {
    if (pain === 0) return '#10b981'; // Green
    if (pain <= 4) return '#facc15'; // Yellow
    if (pain <= 7) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const calculateWakeTime = (sleep: string, hours: number) => {
    if (!sleep || !sleep.includes(':')) return '08:00';
    const [sh, sm] = sleep.split(':').map(Number);
    if (isNaN(sh) || isNaN(sm)) return '08:00';

    let totalMinutes = sh * 60 + sm + hours * 60;
    let wh = Math.floor(totalMinutes / 60) % 24;
    let wm = Math.round(totalMinutes % 60);
    
    return `${String(wh).padStart(2, '0')}:${String(wm).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isModalVisible) {
      if (editingEntry) {
        // Parse the stored Polish date string (DD.MM.YYYY)
        const [day, month, year] = editingEntry.date.split('.').map(Number);
        setFormData({
          date: new Date(year, month - 1, day),
          pain: editingEntry.pain,
          water: editingEntry.water,
          food: editingEntry.food,
          period: editingEntry.period,
          pressure: editingEntry.pressure,
          temp: editingEntry.temp,
          weatherDesc: editingEntry.weatherDesc,
          sleepHours: editingEntry.sleepHours ?? 8,
          sleepTime: editingEntry.sleepTime ?? '',
          wakeTime: editingEntry.wakeTime ?? '',
          stressLevel: editingEntry.stressLevel ?? 0,
          stressPreviousDay: editingEntry.stressPreviousDay ?? 0,
          activityType: editingEntry.activityType ?? '',
          medName: editingEntry.medName ?? '',
          medTime: editingEntry.medTime ?? '',
          medEffectiveness: editingEntry.medEffectiveness ?? '',
          environmentSmells: editingEntry.environmentSmells ?? '',
          environmentLight: editingEntry.environmentLight ?? '',
          environmentNoise: editingEntry.environmentNoise ?? '',
          mood: editingEntry.mood ?? ''
        });

        // Activate sections if they have data
        setActiveSections({
          sleep: !!(editingEntry.sleepTime || editingEntry.wakeTime),
          stress: !!(editingEntry.stressLevel || editingEntry.stressPreviousDay),
          activity: !!editingEntry.activityType,
          meds: !!(editingEntry.medName || editingEntry.medTime),
          environment: !!(editingEntry.environmentSmells || editingEntry.environmentLight || editingEntry.environmentNoise),
          mood: !!editingEntry.mood
        });
      } else {
        // New entry
        setFormData(prev => ({ ...prev, date: new Date() }));
        setActiveSections({
           sleep: false,
           stress: false,
           activity: false,
           meds: false,
           environment: false,
           mood: false
        });
        fetchWeather();
      }
    }
  }, [isModalVisible, editingEntry]);

  const updateSleepTime = (type: 'sleepTime' | 'wakeTime', value: string) => {
    setFormData(prev => {
      const next = { ...prev, [type]: value };
      if (next.sleepTime.length === 5 && next.wakeTime.length === 5) {
        const hours = calculateSleepDuration(next.sleepTime, next.wakeTime);
        return { ...next, sleepHours: hours };
      }
      return next;
    });
  };

  const updateSleepHours = (hours: number) => {
    setFormData(prev => {
      const wake = calculateWakeTime(prev.sleepTime, hours);
      return { ...prev, sleepHours: hours, wakeTime: wake };
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const oldDate = formData.date.toLocaleDateString('pl-PL');
      const newDateStr = selectedDate.toLocaleDateString('pl-PL');
      
      setFormData(prev => ({ ...prev, date: selectedDate }));
      
      if (newDateStr !== oldDate) {
        Alert.alert(
          'Zmieniono datę',
          'Czy chcesz spróbować dopasować dane pogodowe dla tej daty?',
          [
            { text: 'Nie', style: 'cancel' },
            { text: 'Tak, dopasuj', onPress: () => fetchWeather(selectedDate) }
          ]
        );
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pl-PL');
  };

  const formatDateForWeb = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleWebDateChange = (e: any) => {
    const val = e.nativeEvent?.text || e.target?.value;
    const newDate = new Date(val);
    if (!isNaN(newDate.getTime())) {
      onDateChange(null, newDate);
    }
  };

  const fetchWeather = async (targetDate: Date = new Date()) => {
    const isToday = targetDate.toLocaleDateString('pl-PL') === new Date().toLocaleDateString('pl-PL');
    
    if (isToday) {
      const weather = await WeatherService.getCurrentWeather();
      setFormData(prev => ({
        ...prev,
        pressure: weather?.pressure || 1013,
        temp: weather?.temp || 20,
        weatherDesc: weather?.description || 'N/A'
      }));
    } else {
      // Try to find in forecast
      const forecast = await WeatherService.getWeatherForecast();
      const targetStr = targetDate.toLocaleDateString('pl-PL');
      const dayWeather = forecast?.find(f => f.fullDate.includes(targetStr));
      
      if (dayWeather) {
        setFormData(prev => ({
          ...prev,
          pressure: dayWeather.pressure,
          temp: dayWeather.temp,
          weatherDesc: dayWeather.description
        }));
      } else {
        // Fallback or warning
        console.log("No forecast for this date");
      }
    }
  };

  const handleSave = async () => {
    const entries = await StorageService.loadEntries();
    const now = new Date();
    let updated: MigraineEntry[];

    const dateStr = formData.date.toLocaleDateString('pl-PL');

    if (editingEntry) {
      updated = entries.map(e => e.id === editingEntry.id ? {
        ...e,
        date: dateStr,
        pain: formData.pain,
        water: formData.water,
        food: formData.food,
        period: formData.period,
        pressure: formData.pressure,
        temp: formData.temp,
        weatherDesc: formData.weatherDesc,
        // Only save if active
        sleepHours: activeSections.sleep ? formData.sleepHours : undefined,
        sleepTime: activeSections.sleep ? formData.sleepTime : undefined,
        wakeTime: activeSections.sleep ? formData.wakeTime : undefined,
        stressLevel: activeSections.stress ? formData.stressLevel : undefined,
        stressPreviousDay: activeSections.stress ? formData.stressPreviousDay : undefined,
        activityType: activeSections.activity ? formData.activityType : undefined,
        medName: activeSections.meds ? formData.medName : undefined,
        medTime: activeSections.meds ? formData.medTime : undefined,
        medEffectiveness: activeSections.meds ? formData.medEffectiveness : undefined,
        environmentSmells: activeSections.environment ? formData.environmentSmells : undefined,
        environmentLight: activeSections.environment ? formData.environmentLight : undefined,
        environmentNoise: activeSections.environment ? formData.environmentNoise : undefined,
        mood: activeSections.mood ? formData.mood : undefined,
      } : e);
      Alert.alert('Sukces', 'Wpis został zaktualizowany!');
    } else {
      const newEntry: MigraineEntry = {
        id: Date.now().toString(),
        date: dateStr,
        timestamp: now.toISOString(),
        pain: formData.pain,
        water: formData.water,
        food: formData.food,
        period: formData.period,
        pressure: formData.pressure,
        temp: formData.temp,
        weatherDesc: formData.weatherDesc,
        // Only save if active
        sleepHours: activeSections.sleep ? formData.sleepHours : undefined,
        sleepTime: activeSections.sleep ? formData.sleepTime : undefined,
        wakeTime: activeSections.sleep ? formData.wakeTime : undefined,
        stressLevel: activeSections.stress ? formData.stressLevel : undefined,
        stressPreviousDay: activeSections.stress ? formData.stressPreviousDay : undefined,
        activityType: activeSections.activity ? formData.activityType : undefined,
        medName: activeSections.meds ? formData.medName : undefined,
        medTime: activeSections.meds ? formData.medTime : undefined,
        medEffectiveness: activeSections.meds ? formData.medEffectiveness : undefined,
        environmentSmells: activeSections.environment ? formData.environmentSmells : undefined,
        environmentLight: activeSections.environment ? formData.environmentLight : undefined,
        environmentNoise: activeSections.environment ? formData.environmentNoise : undefined,
      };
      updated = [newEntry, ...entries];
      Alert.alert('Sukces', 'Wpis został zapisany!');
    }

    await StorageService.saveEntries(updated);
    closeModal();
    if (onSave) onSave();
  };

  return (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.tint }]}>
            <ThemedText style={styles.modalHeaderTitle}>
              {editingEntry ? 'Edytuj wpis' : 'Nowy wpis'}
            </ThemedText>
            <TouchableOpacity onPress={closeModal}>
              <X size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Calendar size={18} color={theme.tint} />
                <ThemedText style={styles.sectionTitle}>Data wpisu</ThemedText>
              </View>
              
              {Platform.OS === 'web' ? (
                <View style={[styles.input, { borderColor: theme.muted, position: 'relative', overflow: 'hidden' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, pointerEvents: 'none', zIndex: 1 }}>
                    <Calendar size={18} color={theme.tint} />
                    <ThemedText>{formatDate(formData.date)}</ThemedText>
                  </View>
                  <input
                    type="date"
                    value={formatDateForWeb(formData.date)}
                    onChange={handleWebDateChange}
                    onClick={(e) => {
                      if ('showPicker' in e.target) {
                        (e.target as any).showPicker();
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                      zIndex: 2
                    }}
                  />
                </View>
              ) : (
                <>
                  <TouchableOpacity 
                    onPress={() => setShowDatePicker(true)}
                    style={[styles.input, { borderColor: theme.muted, flexDirection: 'row', alignItems: 'center', gap: 10 }]}
                  >
                    <Calendar size={18} color={theme.tint} />
                    <ThemedText>{formatDate(formData.date)}</ThemedText>
                  </TouchableOpacity>
                  
                  {showDatePicker && (
                    <DateTimePicker
                      value={formData.date}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onDateChange}
                      maximumDate={new Date()}
                    />
                  )}
                </>
              )}
            </View>

            {/* PAIN SECTION */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Zap size={16} color={getPainColor(formData.pain)} />
                <ThemedText>Siła bólu: <ThemedText style={{ color: getPainColor(formData.pain), fontWeight: 'bold' }}>{formData.pain}/10</ThemedText></ThemedText>
              </View>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={0}
                maximumValue={10}
                step={1}
                value={formData.pain}
                onValueChange={v => setFormData({ ...formData, pain: v })}
                minimumTrackTintColor={getPainColor(formData.pain)}
                maximumTrackTintColor={theme.muted}
                thumbTintColor={getPainColor(formData.pain)}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.halfInput}>
                <View style={styles.labelRow}>
                  <Droplets size={16} color={theme.muted} />
                  <ThemedText>Woda (L)</ThemedText>
                </View>
                <View style={styles.waterControls}>
                  <TouchableOpacity 
                    style={[styles.waterBtn, { backgroundColor: theme.card, borderColor: theme.muted }]}
                    onPress={() => setFormData({ ...formData, water: Math.max(0, formData.water - 0.5) })}
                  >
                    <Minus size={16} color={theme.text} />
                  </TouchableOpacity>
                  
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.muted, flex: 1, textAlign: 'center', marginHorizontal: 8 }]}
                    keyboardType="numeric"
                    value={formData.water.toString()}
                    onChangeText={v => setFormData({ ...formData, water: parseFloat(v) || 0 })}
                  />
                  
                  <TouchableOpacity 
                    style={[styles.waterBtn, { backgroundColor: theme.card, borderColor: theme.muted }]}
                    onPress={() => setFormData({ ...formData, water: formData.water + 0.5 })}
                  >
                    <Plus size={16} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.halfInput}>
                <View style={styles.labelRow}>
                  <Calendar size={16} color={theme.muted} />
                  <ThemedText>Miesiączka</ThemedText>
                </View>
                <Switch
                  value={formData.period}
                  onValueChange={v => setFormData({ ...formData, period: v })}
                  trackColor={{ false: theme.muted, true: theme.tint }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Coffee size={16} color={FactorColors.diet} />
                <ThemedText>Dieta i używki</ThemedText>
              </View>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.muted }]}
                placeholder="np. sery, wino, czekolada, kawa"
                placeholderTextColor={theme.muted}
                value={formData.food}
                onChangeText={v => setFormData({ ...formData, food: v })}
              />
            </View>

            {/* MOOD SECTION */}
            {!activeSections.mood ? (
              <TouchableOpacity 
                style={[styles.addBtn, { borderColor: FactorColors.mood }]} 
                onPress={() => setActiveSections({ ...activeSections, mood: true })}
              >
                <Plus size={16} color={FactorColors.mood} />
                <ThemedText style={{ color: FactorColors.mood }}>Dodaj Samopoczucie</ThemedText>
              </TouchableOpacity>
            ) : (
              <View style={styles.trackedSection}>
                <View style={styles.sectionHeaderCustom}>
                  <View style={styles.labelRow}>
                    <Smile size={18} color={FactorColors.mood} />
                    <ThemedText style={styles.sectionTitle}>Samopoczucie</ThemedText>
                  </View>
                  <TouchableOpacity onPress={() => setActiveSections({ ...activeSections, mood: false })}>
                    <X size={16} color={theme.muted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {['Bardzo dobre', 'Dobre', 'Przeciętne', 'Złe', 'Bardzo złe'].map(m => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.moodBtn, 
                          { 
                            borderColor: formData.mood === m ? FactorColors.mood : theme.muted,
                            backgroundColor: formData.mood === m ? FactorColors.mood + '20' : 'transparent'
                          }
                        ]}
                        onPress={() => setFormData({ ...formData, mood: m })}
                      >
                        <ThemedText style={{ color: formData.mood === m ? FactorColors.mood : theme.text }}>{m}</ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* SLEEP SECTION */}
            {!activeSections.sleep ? (
              <TouchableOpacity 
                style={[styles.addBtn, { borderColor: FactorColors.sleep }]} 
                onPress={() => setActiveSections({ ...activeSections, sleep: true })}
              >
                <Plus size={16} color={FactorColors.sleep} />
                <ThemedText style={{ color: FactorColors.sleep }}>Dodaj Sen i Regenerację</ThemedText>
              </TouchableOpacity>
            ) : (
              <View style={styles.trackedSection}>
                <View style={styles.sectionHeaderCustom}>
                  <View style={styles.labelRow}>
                    <Moon size={18} color={FactorColors.sleep} />
                    <ThemedText style={styles.sectionTitle}>Sen i Regeneracja</ThemedText>
                  </View>
                  <TouchableOpacity onPress={() => setActiveSections({ ...activeSections, sleep: false })}>
                    <X size={16} color={theme.muted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.inputGroup}>
                  <ThemedText>Długość snu: <ThemedText style={{ color: FactorColors.sleep, fontWeight: 'bold' }}>{formData.sleepHours}h</ThemedText></ThemedText>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={3}
                    maximumValue={12}
                    step={0.5}
                    value={formData.sleepHours}
                    onValueChange={v => setFormData({ ...formData, sleepHours: v })}
                    minimumTrackTintColor={FactorColors.sleep}
                    maximumTrackTintColor={theme.muted}
                    thumbTintColor={FactorColors.sleep}
                  />
                </View>
                <View style={styles.inputRow}>
                  <View style={styles.halfInput}>
                    <ThemedText style={styles.miniLabel}>Godz. zaśnięcia</ThemedText>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.muted }]}
                      placeholder="np. 23:30"
                      placeholderTextColor={theme.muted}
                      value={formData.sleepTime}
                      onChangeText={v => updateSleepTime('sleepTime', v)}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <ThemedText style={styles.miniLabel}>Godz. pobudki</ThemedText>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.muted }]}
                      placeholder="np. 07:00"
                      placeholderTextColor={theme.muted}
                      value={formData.wakeTime}
                      onChangeText={v => updateSleepTime('wakeTime', v)}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* STRESS SECTION */}
            {!activeSections.stress ? (
              <TouchableOpacity 
                style={[styles.addBtn, { borderColor: FactorColors.stress }]} 
                onPress={() => setActiveSections({ ...activeSections, stress: true })}
              >
                <Plus size={16} color={FactorColors.stress} />
                <ThemedText style={{ color: FactorColors.stress }}>Dodaj Stres i Emocje</ThemedText>
              </TouchableOpacity>
            ) : (
              <View style={styles.trackedSection}>
                <View style={styles.sectionHeaderCustom}>
                  <View style={styles.labelRow}>
                    <Zap size={18} color={FactorColors.stress} />
                    <ThemedText style={styles.sectionTitle}>Stres i Emocje</ThemedText>
                  </View>
                  <TouchableOpacity onPress={() => setActiveSections({ ...activeSections, stress: false })}>
                    <X size={16} color={theme.muted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.inputRow}>
                  <View style={styles.halfInput}>
                    <ThemedText style={styles.miniLabel}>Stres dzisiaj (1-10)</ThemedText>
                    <Slider
                      style={{ width: '100%', height: 40 }}
                      minimumValue={0}
                      maximumValue={10}
                      step={1}
                      value={formData.stressLevel}
                      onValueChange={v => setFormData({ ...formData, stressLevel: v })}
                      minimumTrackTintColor={FactorColors.stress}
                      maximumTrackTintColor={theme.muted}
                      thumbTintColor={FactorColors.stress}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <ThemedText style={styles.miniLabel}>Stres wczoraj (1-10)</ThemedText>
                    <Slider
                      style={{ width: '100%', height: 40 }}
                      minimumValue={0}
                      maximumValue={10}
                      step={1}
                      value={formData.stressPreviousDay}
                      onValueChange={v => setFormData({ ...formData, stressPreviousDay: v })}
                      minimumTrackTintColor={FactorColors.stress}
                      maximumTrackTintColor={theme.muted}
                      thumbTintColor={FactorColors.stress}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* ACTIVITY SECTION */}
            {!activeSections.activity ? (
              <TouchableOpacity 
                style={[styles.addBtn, { borderColor: FactorColors.activity }]} 
                onPress={() => setActiveSections({ ...activeSections, activity: true })}
              >
                <Plus size={16} color={FactorColors.activity} />
                <ThemedText style={{ color: FactorColors.activity }}>Dodaj Aktywność Fizyczną</ThemedText>
              </TouchableOpacity>
            ) : (
              <View style={styles.trackedSection}>
                <View style={styles.sectionHeaderCustom}>
                  <View style={styles.labelRow}>
                    <Activity size={18} color={FactorColors.activity} />
                    <ThemedText style={styles.sectionTitle}>Aktywność Fizyczna</ThemedText>
                  </View>
                  <TouchableOpacity onPress={() => setActiveSections({ ...activeSections, activity: false })}>
                    <X size={16} color={theme.muted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.muted }]}
                    placeholder="np. spacer, siłownia, brak"
                    placeholderTextColor={theme.muted}
                    value={formData.activityType}
                    onChangeText={v => setFormData({ ...formData, activityType: v })}
                  />
                </View>
              </View>
            )}

            {/* MEDS SECTION */}
            {!activeSections.meds ? (
              <TouchableOpacity 
                style={[styles.addBtn, { borderColor: theme.tint }]} 
                onPress={() => setActiveSections({ ...activeSections, meds: true })}
              >
                <Plus size={16} color={theme.tint} />
                <ThemedText style={{ color: theme.tint }}>Dodaj Leki i Suplementy</ThemedText>
              </TouchableOpacity>
            ) : (
              <View style={styles.trackedSection}>
                <View style={styles.sectionHeaderCustom}>
                  <View style={styles.labelRow}>
                    <Pill size={18} color={theme.tint} />
                    <ThemedText style={styles.sectionTitle}>Leki i Suplementy</ThemedText>
                  </View>
                  <TouchableOpacity onPress={() => setActiveSections({ ...activeSections, meds: false })}>
                    <X size={16} color={theme.muted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.inputRow}>
                  <View style={styles.halfInput}>
                    <ThemedText style={styles.miniLabel}>Nazwa leku</ThemedText>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.muted }]}
                      placeholder="np. Sumatryptan"
                      placeholderTextColor={theme.muted}
                      value={formData.medName}
                      onChangeText={v => setFormData({ ...formData, medName: v })}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <ThemedText style={styles.miniLabel}>Godz. przyjęcia</ThemedText>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.muted }]}
                      placeholder="np. 08:30"
                      placeholderTextColor={theme.muted}
                      value={formData.medTime}
                      onChangeText={v => setFormData({ ...formData, medTime: v })}
                    />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.miniLabel}>Skuteczność (np. ulga po 2h)</ThemedText>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.muted }]}
                    placeholder="np. ból przeszedł, brak poprawy"
                    placeholderTextColor={theme.muted}
                    value={formData.medEffectiveness}
                    onChangeText={v => setFormData({ ...formData, medEffectiveness: v })}
                  />
                </View>
              </View>
            )}

            {/* ENVIRONMENT SECTION */}
            {!activeSections.environment ? (
              <TouchableOpacity 
                style={[styles.addBtn, { borderColor: FactorColors.environment }]} 
                onPress={() => setActiveSections({ ...activeSections, environment: true })}
              >
                <Plus size={16} color={FactorColors.environment} />
                <ThemedText style={{ color: FactorColors.environment }}>Dodaj Wyzwalacze (Otoczenie)</ThemedText>
              </TouchableOpacity>
            ) : (
              <View style={styles.trackedSection}>
                <View style={styles.sectionHeaderCustom}>
                  <View style={styles.labelRow}>
                    <Wind size={18} color={FactorColors.environment} />
                    <ThemedText style={styles.sectionTitle}>Otoczenie (Wyzwalacze)</ThemedText>
                  </View>
                  <TouchableOpacity onPress={() => setActiveSections({ ...activeSections, environment: false })}>
                    <X size={16} color={theme.muted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Wind size={14} color={theme.muted} />
                    <ThemedText style={styles.miniLabel}>Zapachy (np. perfumy, dym)</ThemedText>
                  </View>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.muted }]}
                    value={formData.environmentSmells}
                    onChangeText={v => setFormData({ ...formData, environmentSmells: v })}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Eye size={14} color={theme.muted} />
                    <ThemedText style={styles.miniLabel}>Światło (np. słońce, monitor)</ThemedText>
                  </View>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.muted }]}
                    value={formData.environmentLight}
                    onChangeText={v => setFormData({ ...formData, environmentLight: v })}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Volume2 size={14} color={theme.muted} />
                    <ThemedText style={styles.miniLabel}>Hałas (np. maszyny, muzyka)</ThemedText>
                  </View>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.muted }]}
                    value={formData.environmentNoise}
                    onChangeText={v => setFormData({ ...formData, environmentNoise: v })}
                  />
                </View>

              </View>
            )}

            <ThemedText style={[styles.sectionTitle, { fontSize: 16, marginTop: 10 }]}>Dane pogodowe (pobrane automatycznie)</ThemedText>
            <View style={styles.inputRow}>
              <View style={styles.halfInput}>
                 <ThemedText style={styles.miniLabel}>Temp (°C)</ThemedText>
                 <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.muted }]}
                  keyboardType="numeric"
                  value={formData.temp.toString()}
                  onChangeText={v => setFormData({ ...formData, temp: parseFloat(v) || 0 })}
                />
              </View>
              <View style={styles.halfInput}>
                 <ThemedText style={styles.miniLabel}>Ciśnienie (hPa)</ThemedText>
                 <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.muted }]}
                  keyboardType="numeric"
                  value={formData.pressure.toString()}
                  onChangeText={v => setFormData({ ...formData, pressure: parseFloat(v) || 0 })}
                />
              </View>
            </View>

            <View style={styles.footerButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelBtn, { borderColor: theme.muted, flex: 1 }]} 
                onPress={closeModal}
              >
                <ThemedText style={{ color: theme.text }}>Anuluj</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, { backgroundColor: theme.tint, flex: 1 }]} 
                onPress={handleSave}
              >
                <ThemedText style={[styles.buttonText, { color: '#FFF' }]}>Zapisz</ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '93%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalHeaderTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 20,
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 40,
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
  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  waterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  waterBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  sectionTitle: {
    fontWeight: 'bold',
  },
  sectionHeaderCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 16,
    justifyContent: 'center',
  },
  trackedSection: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  miniLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  moodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
});
