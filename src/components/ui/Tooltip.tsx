import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cva, type VariantProps } from 'class-variance-authority';

// Tooltip style variants
const tooltipVariants = cva(
  'px-2 py-1 text-xs font-medium z-50 max-w-xs animate-fadeIn shadow-md',
  {
    variants: {
      variant: {
        default: 'bg-gray-800 text-white',
        light: 'bg-white text-gray-900 border border-gray-200',
        dark: 'bg-gray-900 text-white',
        primary: 'bg-blue-700 text-white',
        success: 'bg-green-700 text-white',
        warning: 'bg-yellow-700 text-white',
        danger: 'bg-red-700 text-white',
      },
      arrow: {
        true: 'before:content-[""] before:absolute before:w-0 before:h-0',
        false: '',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      arrow: true,
      rounded: 'md',
    },
  }
);

// Arrow position styles based on placement
const arrowStyles: Record<Placement, string> = {
  top: 'before:border-t-8 before:border-r-8 before:border-l-8 before:border-transparent before:border-t-gray-800 before:-bottom-2 before:left-1/2 before:-translate-x-1/2',
  bottom: 'before:border-b-8 before:border-r-8 before:border-l-8 before:border-transparent before:border-b-gray-800 before:-top-2 before:left-1/2 before:-translate-x-1/2',
  left: 'before:border-l-8 before:border-t-8 before:border-b-8 before:border-transparent before:border-l-gray-800 before:-right-2 before:top-1/2 before:-translate-y-1/2',
  right: 'before:border-r-8 before:border-t-8 before:border-b-8 before:border-transparent before:border-r-gray-800 before:-left-2 before:top-1/2 before:-translate-y-1/2',
  'top-start': 'before:border-t-8 before:border-r-8 before:border-l-8 before:border-transparent before:border-t-gray-800 before:-bottom-2 before:left-3',
  'top-end': 'before:border-t-8 before:border-r-8 before:border-l-8 before:border-transparent before:border-t-gray-800 before:-bottom-2 before:right-3',
  'bottom-start': 'before:border-b-8 before:border-r-8 before:border-l-8 before:border-transparent before:border-b-gray-800 before:-top-2 before:left-3',
  'bottom-end': 'before:border-b-8 before:border-r-8 before:border-l-8 before:border-transparent before:border-b-gray-800 before:-top-2 before:right-3',
  'left-start': 'before:border-l-8 before:border-t-8 before:border-b-8 before:border-transparent before:border-l-gray-800 before:-right-2 before:top-3',
  'left-end': 'before:border-l-8 before:border-t-8 before:border-b-8 before:border-transparent before:border-l-gray-800 before:-right-2 before:bottom-3',
  'right-start': 'before:border-r-8 before:border-t-8 before:border-b-8 before:border-transparent before:border-r-gray-800 before:-left-2 before:top-3',
  'right-end': 'before:border-r-8 before:border-t-8 before:border-b-8 before:border-transparent before:border-r-gray-800 before:-left-2 before:bottom-3',
};

// Arrow color overrides for different variants
const arrowColorOverrides: Record<string, Record<Placement, string>> = {
  light: {
    top: 'before:border-t-white',
    bottom: 'before:border-b-white',
    left: 'before:border-l-white',
    right: 'before:border-r-white',
    'top-start': 'before:border-t-white',
    'top-end': 'before:border-t-white',
    'bottom-start': 'before:border-b-white',
    'bottom-end': 'before:border-b-white',
    'left-start': 'before:border-l-white',
    'left-end': 'before:border-l-white',
    'right-start': 'before:border-r-white',
    'right-end': 'before:border-r-white',
  },
  dark: {
    top: 'before:border-t-gray-900',
    bottom: 'before:border-b-gray-900',
    left: 'before:border-l-gray-900',
    right: 'before:border-r-gray-900',
    'top-start': 'before:border-t-gray-900',
    'top-end': 'before:border-t-gray-900',
    'bottom-start': 'before:border-b-gray-900',
    'bottom-end': 'before:border-b-gray-900',
    'left-start': 'before:border-l-gray-900',
    'left-end': 'before:border-l-gray-900',
    'right-start': 'before:border-r-gray-900',
    'right-end': 'before:border-r-gray-900',
  },
  primary: {
    top: 'before:border-t-blue-700',
    bottom: 'before:border-b-blue-700',
    left: 'before:border-l-blue-700',
    right: 'before:border-r-blue-700',
    'top-start': 'before:border-t-blue-700',
    'top-end': 'before:border-t-blue-700',
    'bottom-start': 'before:border-b-blue-700',
    'bottom-end': 'before:border-b-blue-700',
    'left-start': 'before:border-l-blue-700',
    'left-end': 'before:border-l-blue-700',
    'right-start': 'before:border-r-blue-700',
    'right-end': 'before:border-r-blue-700',
  },
  success: {
    top: 'before:border-t-green-700',
    bottom: 'before:border-b-green-700',
    left: 'before:border-l-green-700',
    right: 'before:border-r-green-700',
    'top-start': 'before:border-t-green-700',
    'top-end': 'before:border-t-green-700',
    'bottom-start': 'before:border-b-green-700',
    'bottom-end': 'before:border-b-green-700',
    'left-start': 'before:border-l-green-700',
    'left-end': 'before:border-l-green-700',
    'right-start': 'before:border-r-green-700',
    'right-end': 'before:border-r-green-700',
  },
  warning: {
    top: 'before:border-t-yellow-700',
    bottom: 'before:border-b-yellow-700',
    left: 'before:border-l-yellow-700',
    right: 'before:border-r-yellow-700',
    'top-start': 'before:border-t-yellow-700',
    'top-end': 'before:border-t-yellow-700',
    'bottom-start': 'before:border-b-yellow-700',
    'bottom-end': 'before:border-b-yellow-700',
    'left-start': 'before:border-l-yellow-700',
    'left-end': 'before:border-l-yellow-700',
    'right-start': 'before:border-r-yellow-700',
    'right-end': 'before:border-r-yellow-700',
  },
  danger: {
    top: 'before:border-t-red-700',
    bottom: 'before:border-b-red-700',
    left: 'before:border-l-red-700',
    right: 'before:border-r-red-700',
    'top-start': 'before:border-t-red-700',
    'top-end': 'before:border-t-red-700',
    'bottom-start': 'before:border-b-red-700',
    'bottom-end': 'before:border-b-red-700',
    'left-start': 'before:border-l-red-700',
    'left-end': 'before:border-l-red-700',
    'right-start': 'before:border-r-red-700',
    'right-end': 'before:border-r-red-700',
  },
};

type Placement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end'
  | 'left-start'
  | 'left-end'
  | 'right-start'
  | 'right-end';

// Tooltip props interface
export interface TooltipProps extends VariantProps<typeof tooltipVariants> {
  content: React.ReactNode;
  children: React.ReactElement;
  placement?: Placement;
  delay?: number;
  offset?: number;
  disabled?: boolean;
  contentClassName?: string;
  interactive?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  variant = 'default',
  arrow = true,
  rounded = 'md',
  placement = 'top',
  delay = 0,
  offset = 8,
  disabled = false,
  contentClassName = '',
  interactive = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate tooltip position
  const calculatePosition = () => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = tooltipRef.current?.offsetWidth || 100;
    const tooltipHeight = tooltipRef.current?.offsetHeight || 40;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = triggerRect.top - tooltipHeight - offset;
        left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + offset;
        left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
        left = triggerRect.left - tooltipWidth - offset;
        break;
      case 'right':
        top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
        left = triggerRect.right + offset;
        break;
      case 'top-start':
        top = triggerRect.top - tooltipHeight - offset;
        left = triggerRect.left;
        break;
      case 'top-end':
        top = triggerRect.top - tooltipHeight - offset;
        left = triggerRect.right - tooltipWidth;
        break;
      case 'bottom-start':
        top = triggerRect.bottom + offset;
        left = triggerRect.left;
        break;
      case 'bottom-end':
        top = triggerRect.bottom + offset;
        left = triggerRect.right - tooltipWidth;
        break;
      case 'left-start':
        top = triggerRect.top;
        left = triggerRect.left - tooltipWidth - offset;
        break;
      case 'left-end':
        top = triggerRect.bottom - tooltipHeight;
        left = triggerRect.left - tooltipWidth - offset;
        break;
      case 'right-start':
        top = triggerRect.top;
        left = triggerRect.right + offset;
        break;
      case 'right-end':
        top = triggerRect.bottom - tooltipHeight;
        left = triggerRect.right + offset;
        break;
    }

    // Apply window boundary constraints
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Constrain left position (horizontal)
    if (left < 10) {
      left = 10;
    } else if (left + tooltipWidth > windowWidth - 10) {
      left = windowWidth - tooltipWidth - 10;
    }

    // Constrain top position (vertical)
    if (top < 10) {
      top = 10;
    } else if (top + tooltipHeight > windowHeight - 10) {
      top = windowHeight - tooltipHeight - 10;
    }

    setTooltipPosition({ top, left });
  };

  // Show tooltip with delay
  const showTooltip = () => {
    if (disabled) return;

    if (delay) {
      timerRef.current = setTimeout(() => {
        setIsVisible(true);
        calculatePosition();
      }, delay);
    } else {
      setIsVisible(true);
      calculatePosition();
    }
  };

  // Hide tooltip and clear timer
  const hideTooltip = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsVisible(false);
  };

  // Update position on scroll or resize
  useEffect(() => {
    if (isVisible) {
      const handlePositionUpdate = () => {
        calculatePosition();
      };

      window.addEventListener('scroll', handlePositionUpdate, true);
      window.addEventListener('resize', handlePositionUpdate);

      return () => {
        window.removeEventListener('scroll', handlePositionUpdate, true);
        window.removeEventListener('resize', handlePositionUpdate);
      };
    }
  }, [isVisible]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Get arrow color class based on variant
  const getArrowColorClass = () => {
    if (variant && variant !== 'default' && arrowColorOverrides[variant]) {
      return arrowColorOverrides[variant][placement];
    }
    return '';
  };

  // Clone child with event handlers
  const childrenWithProps = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: (e: React.MouseEvent) => {
      showTooltip();
      if (children.props.onMouseEnter) {
        children.props.onMouseEnter(e);
      }
    },
    onMouseLeave: (e: React.MouseEvent) => {
      if (!interactive) {
        hideTooltip();
      }
      if (children.props.onMouseLeave) {
        children.props.onMouseLeave(e);
      }
    },
    onFocus: (e: React.FocusEvent) => {
      showTooltip();
      if (children.props.onFocus) {
        children.props.onFocus(e);
      }
    },
    onBlur: (e: React.FocusEvent) => {
      hideTooltip();
      if (children.props.onBlur) {
        children.props.onBlur(e);
      }
    },
  });

  if (!content || disabled) {
    return children;
  }

  return (
    <>
      {childrenWithProps}
      {isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            aria-live="polite"
            className={`
              absolute pointer-events-none
              ${tooltipVariants({ variant, arrow, rounded })}
              ${arrow ? arrowStyles[placement] : ''}
              ${arrow && variant !== 'default' ? getArrowColorClass() : ''}
              ${interactive ? 'pointer-events-auto' : ''}
              ${contentClassName}
            `}
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
            }}
            onMouseEnter={() => {
              if (interactive) {
                showTooltip();
              }
            }}
            onMouseLeave={() => {
              if (interactive) {
                hideTooltip();
              }
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};
