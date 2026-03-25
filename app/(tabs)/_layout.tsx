import { Tabs } from 'expo-router';
import React from 'react';
import { LayoutDashboard, ChartBar, Plus } from 'lucide-react-native';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ModalProvider, useModal } from '@/context/modal-context';
import { AddEditModal } from '@/components/AddEditModal';

function TabBarIcon({ name, color }: { name: any, color: string }) {
  const Icon = name;
  return <Icon size={24} color={color} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  return (
    <ModalProvider>
      <LayoutContent theme={theme} />
    </ModalProvider>
  );
}

import { useSafeAreaInsets } from 'react-native-safe-area-context';

function LayoutContent({ theme }: { theme: any }) {
  const { openModal } = useModal();
  const insets = useSafeAreaInsets();
  const tabBarHeight = Platform.OS === 'web' ? 60 : 60 + insets.bottom;

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: theme.background,
            borderTopColor: theme.card,
            height: tabBarHeight,
            paddingBottom: Platform.OS === 'web' ? 5 : insets.bottom + 5,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dziennik',
            tabBarIcon: ({ color }) => <TabBarIcon name={LayoutDashboard} color={color} />,
          }}
        />
        
        <Tabs.Screen
          name="add-dummy" // Fake screen
          options={{
            title: '',
            tabBarButton: () => (
              <TouchableOpacity 
                onPress={() => openModal()}
                style={styles.centerButtonContainer}
              >
                <View style={[styles.centerButton, { backgroundColor: theme.tint }]}>
                  <Plus size={30} color="#fff" />
                </View>
              </TouchableOpacity>
            ),
          }}
        />

        <Tabs.Screen
          name="explore"
          options={{
            title: 'Analiza',
            tabBarIcon: ({ color }) => <TabBarIcon name={ChartBar} color={color} />,
          }}
        />
      </Tabs>
      <AddEditModal />
    </>
  );
}

const styles = StyleSheet.create({
  centerButtonContainer: {
    top: -10, // Reduced for better web compatibility
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
