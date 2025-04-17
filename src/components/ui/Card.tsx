import React, { type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

// Card container styles
const cardVariants = cva(
  'rounded-lg transition-all relative overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
        outlined: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100',
        ghost: 'bg-transparent border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100',
        elevated: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-md',
        filled: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100',
      },
      size: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      },
      hover: {
        true: 'hover:shadow-md hover:-translate-y-0.5',
        false: '',
      },
      clickable: {
        true: 'cursor-pointer transition-transform active:translate-y-0.5',
        false: '',
      },
      width: {
        auto: 'w-auto',
        full: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      hover: false,
      clickable: false,
      width: 'auto',
    },
  }
);

// Card component
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  onClick?: () => void;
  status?: 'success' | 'warning' | 'danger' | 'info' | null;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    className,
    children,
    variant,
    size,
    hover,
    clickable,
    width,
    status,
    onClick,
    ...props
  }, ref) => {
    // Status indicator colors
    const statusClasses = {
      success: 'border-l-4 border-green-500',
      warning: 'border-l-4 border-yellow-500',
      danger: 'border-l-4 border-red-500',
      info: 'border-l-4 border-blue-500',
    };

    return (
      <div
        ref={ref}
        className={`
          ${cardVariants({ variant, size, hover, clickable, width, className })}
          ${status ? statusClasses[status] : ''}
        `}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card header component
export interface CardHeaderProps {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const CardHeader = ({
  className = '',
  title,
  description,
  icon,
  actions,
  children,
  ...props
}: CardHeaderProps) => {
  return (
    <div
      className={`flex justify-between items-start mb-4 ${className}`}
      {...props}
    >
      <div className="flex items-center">
        {icon && (
          <div className="mr-3">
            {icon}
          </div>
        )}
        <div>
          {title && (
            <h3 className="text-lg font-semibold">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
      {actions && (
        <div className="ml-4">
          {actions}
        </div>
      )}
    </div>
  );
};

// Card content component
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = ({
  className = '',
  children,
  ...props
}: CardContentProps) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

// Card footer component
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  actions?: React.ReactNode;
  divider?: boolean;
}

export const CardFooter = ({
  className = '',
  children,
  actions,
  divider = true,
  ...props
}: CardFooterProps) => {
  return (
    <div
      className={`
        ${divider ? 'border-t border-gray-200 dark:border-gray-700 pt-4 mt-4' : ''}
        ${actions ? 'flex justify-between items-center' : ''}
        ${className}
      `}
      {...props}
    >
      <div>
        {children}
      </div>
      {actions && (
        <div className="flex space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
};

// Card image component
export interface CardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  overlay?: boolean;
  height?: string;
}

export const CardImage = ({
  className = '',
  overlay = false,
  height = 'h-48',
  alt = '',
  ...props
}: CardImageProps) => {
  return (
    <div
      className={`
        relative w-full ${height} overflow-hidden -mt-4 -mx-4 mb-4
        ${overlay ? 'rounded-t-lg bg-black/10' : ''}
      `}
    >
      <img
        className={`
          w-full h-full object-cover ${overlay ? 'opacity-80' : ''}
          ${className}
        `}
        alt={alt}
        {...props}
      />
    </div>
  );
};

// Badge for cards
export interface CardBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default';
}

export const CardBadge = ({
  className = '',
  children,
  color = 'default',
  ...props
}: CardBadgeProps) => {
  const colorClasses = {
    primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <div
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
        ${colorClasses[color]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
