import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        primary: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        secondary: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        outline: "bg-transparent border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300",
        red: "bg-red-900/30 border border-red-800 text-red-300",
        blue: "bg-blue-900/30 border border-blue-800 text-blue-300",
        green: "bg-green-900/30 border border-green-800 text-green-300",
        gray: "bg-gray-800/50 border border-gray-700 text-gray-300",
      },
      size: {
        sm: "text-xs px-2 py-0.5",
        md: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1",
      },
      rounded: {
        full: "rounded-full",
        md: "rounded-md",
        none: "rounded-none",
      },
      withDot: {
        true: "pl-1.5", // Less left padding to accommodate the dot
        false: "",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      rounded: "full",
      withDot: false,
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dotColor?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({
    className,
    variant,
    size,
    rounded,
    withDot,
    dotColor,
    icon,
    iconPosition = 'left',
    children,
    ...props
  }, ref) => {
    // Default dot color based on variant if not explicitly provided
    const defaultDotColors: Record<string, string> = {
      default: "bg-gray-500",
      primary: "bg-blue-500",
      secondary: "bg-gray-500",
      success: "bg-green-500",
      warning: "bg-yellow-500",
      danger: "bg-red-500",
      info: "bg-blue-500",
      outline: "bg-gray-500",
      red: "bg-red-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      gray: "bg-gray-500",
    };

    const getDotColor = () => {
      if (dotColor) return dotColor;
      if (variant && defaultDotColors[variant]) {
        return defaultDotColors[variant];
      }
      return defaultDotColors.default;
    };

    return (
      <div
        ref={ref}
        className={badgeVariants({ variant, size, rounded, withDot, className })}
        {...props}
      >
        {withDot && (
          <span
            className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${getDotColor()}`}
          />
        )}

        {icon && iconPosition === 'left' && (
          <span className="mr-1">{icon}</span>
        )}

        {children}

        {icon && iconPosition === 'right' && (
          <span className="ml-1">{icon}</span>
        )}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
