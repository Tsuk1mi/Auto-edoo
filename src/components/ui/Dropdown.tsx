import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface DropdownProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  align?: 'left' | 'right';
  width?: number;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  closeOnOutsideClick?: boolean;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  children,
  trigger,
  align = 'left',
  width = 220,
  isOpen: controlledIsOpen,
  onOpenChange,
  closeOnOutsideClick = true,
  className = '',
}) => {
  // Support both controlled and uncontrolled mode
  const [isOpenUncontrolled, setIsOpenUncontrolled] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : isOpenUncontrolled;

  const setIsOpen = (value: boolean) => {
    if (!isControlled) {
      setIsOpenUncontrolled(value);
    }
    onOpenChange?.(value);
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Calculate menu position
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const left = align === 'left' ? rect.left : rect.right - width;
      const top = rect.bottom + window.scrollY + 5; // Add a small gap

      setMenuPosition({ top, left });
    }
  }, [isOpen, align, width]);

  // Handle clicks outside
  useEffect(() => {
    if (!isOpen || !closeOnOutsideClick) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeOnOutsideClick, setIsOpen]);

  // Handle escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, setIsOpen]);

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-block cursor-pointer"
        onClick={toggleOpen}
      >
        {trigger}
      </div>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: menuPosition.top,
            left: menuPosition.left,
            width: width,
            zIndex: 50,
          }}
          className={`bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 animate-fadeIn ${className}`}
        >
          {children}
        </div>,
        document.body
      )}
    </>
  );
};

export interface MenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
  className?: string;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  disabled = false,
  danger = false,
  onClick,
  className = '',
  children,
  ...props
}) => {
  const baseClasses = `
    flex items-center px-4 py-2 text-sm cursor-pointer transition-colors
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
    ${danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'}
    ${className}
  `;

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <div
      className={baseClasses}
      onClick={handleClick}
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </div>
  );
};

export const MenuSeparator = () => {
  return <div className="border-t border-gray-200 dark:border-gray-700 my-1" />;
};

export const MenuHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      {children}
    </div>
  );
};
