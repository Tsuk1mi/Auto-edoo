import React, { useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

// Switch styles
const switchVariants = cva(
  'relative inline-flex items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-5 w-9',
        md: 'h-6 w-11',
        lg: 'h-7 w-14',
      },
      variant: {
        default: 'bg-gray-300 data-[state=checked]:bg-blue-600 dark:bg-gray-600 dark:data-[state=checked]:bg-blue-500',
        primary: 'bg-gray-300 data-[state=checked]:bg-blue-600 dark:bg-gray-600 dark:data-[state=checked]:bg-blue-500',
        success: 'bg-gray-300 data-[state=checked]:bg-green-600 dark:bg-gray-600 dark:data-[state=checked]:bg-green-500',
        danger: 'bg-gray-300 data-[state=checked]:bg-red-600 dark:bg-gray-600 dark:data-[state=checked]:bg-red-500',
        warning: 'bg-gray-300 data-[state=checked]:bg-yellow-600 dark:bg-gray-600 dark:data-[state=checked]:bg-yellow-500',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

// Thumb styles
const thumbVariants = cva(
  'pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform',
  {
    variants: {
      size: {
        sm: 'h-3.5 w-3.5 data-[state=checked]:translate-x-4',
        md: 'h-4.5 w-4.5 data-[state=checked]:translate-x-5',
        lg: 'h-5.5 w-5.5 data-[state=checked]:translate-x-7',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, VariantProps<typeof switchVariants> {
  label?: string;
  description?: string;
  labelPosition?: 'left' | 'right';
  icon?: React.ReactNode;
  thumbIcon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({
    checked,
    onChange,
    label,
    description,
    labelPosition = 'right',
    size,
    variant,
    disabled = false,
    icon,
    thumbIcon,
    wrapperClassName = '',
    className = '',
    id: propId,
    ...props
  }, ref) => {
    const id = useId() || propId;

    // Thumb position classes
    const thumbPositionClasses = {
      sm: 'translate-x-0.5',
      md: 'translate-x-0.5',
      lg: 'translate-x-1',
    };

    // Calculate the proper thumb size based on switch size
    const getThumbSize = () => {
      if (size === 'sm') return 'h-4 w-4';
      if (size === 'lg') return 'h-6 w-6';
      return 'h-5 w-5'; // Default (md)
    };

    // Base thumb position (unchecked)
    const getThumbPosition = () => {
      if (size) {
        return thumbPositionClasses[size] || thumbPositionClasses.md;
      }
      return thumbPositionClasses.md;
    };

    return (
      <div className={`flex ${labelPosition === 'left' ? 'flex-row-reverse justify-end' : 'items-center'} gap-3 ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={id}
            className={`text-sm font-medium ${disabled ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}
          >
            <div className="flex flex-col">
              <span>{label}</span>
              {description && (
                <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                  {description}
                </span>
              )}
            </div>
          </label>
        )}
        <div className="flex items-center">
          {icon && (
            <div className="mr-2 text-gray-500 dark:text-gray-400">
              {icon}
            </div>
          )}
          <div
            data-state={checked ? 'checked' : 'unchecked'}
            className={`${switchVariants({ size, variant, className })} cursor-pointer`}
            onClick={disabled ? undefined : () => onChange?.(!checked as any)}
          >
            <span
              data-state={checked ? 'checked' : 'unchecked'}
              className={`
                ${thumbVariants({ size })}
                ${!checked ? getThumbPosition() : ''}
                ${getThumbSize()}
                flex items-center justify-center
              `}
            >
              {thumbIcon && (
                <span className="text-xs">
                  {thumbIcon}
                </span>
              )}
            </span>
          </div>
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={(e) => onChange?.(e)}
            disabled={disabled}
            {...props}
          />
        </div>
      </div>
    );
  }
);

Switch.displayName = 'Switch';
