import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MigraineEntry } from '@/services/data';

interface ModalContextType {
  isModalVisible: boolean;
  editingEntry: MigraineEntry | null;
  openModal: (entry?: MigraineEntry) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MigraineEntry | null>(null);

  const openModal = (entry?: MigraineEntry) => {
    setEditingEntry(entry || null);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingEntry(null);
  };

  return (
    <ModalContext.Provider value={{ isModalVisible, editingEntry, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
