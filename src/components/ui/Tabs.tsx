import type React from 'react';
import { createContext, useContext, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

// Style definition for tabs
const tabsVariants = cva('flex', {
  variants: {
    variant: {
      default: 'border-b border-gray-200 dark:border-gray-700',
      pills: 'space-x-1',
      buttons: 'p-1 bg-gray-100 dark:bg-gray-800 rounded-lg',
      underline: 'border-b border-gray-200 dark:border-gray-700',
      admin: 'border-b border-gray-700 gap-1',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
    fullWidth: {
      true: 'w-full',
      false: 'w-auto',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    fullWidth: false,
  },
});

// Context for tabs
type TabsContextType = {
  activeTab: string;
  setActiveTab: (id: string) => void;
  variant: 'default' | 'pills' | 'buttons' | 'underline' | 'admin';
  size: 'sm' | 'md' | 'lg';
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

// Hook to use the tabs context
const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within a Tabs component');
  }
  return context;
};

// Tabs root component
export interface TabsProps extends VariantProps<typeof tabsVariants> {
  defaultTab?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultTab,
  value,
  onValueChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
}) => {
  const [activeTabInternal, setActiveTabInternal] = useState(defaultTab || '');
  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : activeTabInternal;

  const setActiveTab = (tabId: string) => {
    if (!isControlled) {
      setActiveTabInternal(tabId);
    }
    onValueChange?.(tabId);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, variant: variant || 'default', size: size || 'md' }}>
      <div className="w-full">
        <div className={tabsVariants({ variant, size, fullWidth, className })}>
          {children}
        </div>
      </div>
    </TabsContext.Provider>
  );
};

// Tab list component
export interface TabListProps {
  children: React.ReactNode;
  className?: string;
  centered?: boolean;
}

export const TabList: React.FC<TabListProps> = ({
  children,
  className = '',
  centered = false,
}) => {
  const { /* variant */ } = useTabs();

  const baseClasses = 'flex space-x-2';

  return (
    <div
      role="tablist"
      className={`
        ${baseClasses}
        ${centered ? 'justify-center' : 'justify-start'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Tab item component
export interface TabProps extends React.HTMLAttributes<HTMLButtonElement> {
  value: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Tab: React.FC<TabProps> = ({
  value,
  disabled = false,
  icon,
  children,
  className = '',
  ...props
}) => {
  const { activeTab, setActiveTab, variant, size } = useTabs();
  const isActive = activeTab === value;

  const getVariantClasses = () => {
    switch (variant) {
      case 'pills':
        return isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';

      case 'buttons':
        return isActive
          ? 'bg-white dark:bg-gray-700 shadow'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600';

      case 'underline':
        return isActive
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
          : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 border-b-2 border-transparent';

      case 'admin':
        return isActive
          ? 'text-blue-400 border-b-2 border-blue-600 font-semibold'
          : 'text-gray-300 hover:text-blue-400 border-b-2 border-transparent';

      case 'default':
      default:
        return isActive
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
          : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 border-b-2 border-transparent';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'text-sm px-3 py-1.5';
      case 'lg': return 'text-lg px-6 py-3';
      case 'md':
      default: return 'text-base px-4 py-2';
    }
  };

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      id={`tab-${value}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        relative font-medium focus:outline-none transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      <div className="flex items-center">
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </div>
    </button>
  );
};

// Tab panel component
export interface TabPanelProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({
  value,
  children,
  className = '',
}) => {
  const { activeTab } = useTabs();
  const isActive = activeTab === value;

  if (!isActive) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={`py-4 ${className}`}
    >
      {children}
    </div>
  );
};

// New Tabs component
interface NewTab {
  id: string;
  label: string;
  disabled?: boolean;
}

interface NewTabsProps {
  tabs: NewTab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<NewTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`border-b border-gray-700 ${className}`}>
      <div className="flex space-x-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={`py-2 px-4 mb-[-1px] transition-colors font-medium text-sm rounded-t-lg focus:outline-none ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-750'
            } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
