import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Modal, 
  Platform,
  Alert
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { FileText, Calendar, X, CloudUpload } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MedicalDocument } from '@/services/data';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onSave: (doc: MedicalDocument) => void;
}

export function MedicalUploadModal({ isVisible, onClose, onSave }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      console.error('Picker error:', err);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) {
      Alert.alert('Błąd', 'Proszę wybrać plik badania.');
      return;
    }

    setLoading(true);
    try {
      // Create document object
      const newDoc: MedicalDocument = {
        id: Date.now().toString(),
        date: date.toLocaleDateString('pl-PL'),
        timestamp: date.toISOString(),
        fileName: selectedFile.name,
        fileUri: selectedFile.uri,
        fileType: selectedFile.mimeType || 'unknown',
        content: `Przesłano badanie z dnia ${date.toLocaleDateString('pl-PL')}`
      };

      onSave(newDoc);
      setSelectedFile(null);
      setDate(new Date());
      onClose();
    } catch (e) {
      console.error('Save doc error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.tint }]}>
            <ThemedText style={styles.modalHeaderTitle}>Dodaj badanie</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {/* DATE */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Calendar size={18} color={theme.tint} />
                <ThemedText style={styles.sectionTitle}>Data badania</ThemedText>
              </View>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  style={{
                    backgroundColor: 'transparent',
                    color: theme.text,
                    border: `1px solid ${theme.muted}`,
                    borderRadius: '8px',
                    padding: '8px',
                    width: '100%',
                    marginTop: '8px',
                    colorScheme: colorScheme === 'dark' ? 'dark' : 'light'
                  }}
                  value={date.toISOString().split('T')[0]}
                  onChange={(e) => setDate(new Date(e.target.value))}
                />
              ) : (
                <TouchableOpacity 
                   style={[styles.dateButton, { borderColor: theme.muted }]} 
                   onPress={() => setShowDatePicker(true)}
                >
                  <ThemedText>{date.toLocaleDateString('pl-PL')}</ThemedText>
                </TouchableOpacity>
              )}
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  onChange={(event, d) => {
                    setShowDatePicker(false);
                    if (d) setDate(d);
                  }}
                />
              )}
            </View>

            {/* UPLOAD */}
            <TouchableOpacity 
              style={[styles.uploadBox, { borderColor: theme.tint, borderStyle: 'dashed' }]}
              onPress={pickDocument}
            >
              {selectedFile ? (
                <View style={styles.selectedFile}>
                  <FileText size={40} color={theme.tint} />
                  <ThemedText style={styles.fileName}>{selectedFile.name}</ThemedText>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <CloudUpload size={40} color={theme.muted} />
                  <ThemedText style={{ opacity: 0.6 }}>Wybierz PDF lub obraz badania</ThemedText>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelBtn, { borderColor: theme.muted }]} 
                onPress={onClose}
              >
                <ThemedText>Anuluj</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: theme.tint }]} 
                onPress={handleSave}
              >
                <ThemedText style={{ color: '#FFF', fontWeight: 'bold' }}>Zapisz</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalHeaderTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 20,
  },
  body: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  uploadBox: {
    borderWidth: 2,
    borderRadius: 16,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    gap: 10,
  },
  selectedFile: {
    alignItems: 'center',
    gap: 10,
  },
  fileName: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  }
});
