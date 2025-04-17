import { useState, useCallback } from 'react';

interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  openModal: () => void; // Алиас для open
  closeModal: () => void; // Алиас для close
}

export const useModal = (initialState = false): UseModalReturn => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Возвращаем и алиасы для совместимости с обоими вариантами названий
  return {
    isOpen,
    open,
    close,
    toggle,
    openModal: open, // Алиас для open
    closeModal: close // Алиас для close
  };
};
