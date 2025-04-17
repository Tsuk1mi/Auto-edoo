import { type InputHTMLAttributes, forwardRef, type ReactNode } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      icon,
      iconPosition = 'left',
      size = 'md',
      fullWidth = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-3 text-base',
    };

    const paddingWithIcon = {
      left: 'pl-10',
      right: 'pr-10',
    };

    const inputClasses = `
      bg-gray-700 rounded-lg ${sizes[size]} focus:outline-none focus:ring-2 focus:ring-blue-500
      w-full text-gray-200 ${icon ? paddingWithIcon[iconPosition] : ''}
      ${error ? 'border border-red-500' : 'border border-gray-600'}
      ${props.disabled ? 'opacity-60 cursor-not-allowed' : ''}
      ${className}
    `;

    return (
      <div className={`${fullWidth ? 'w-full' : ''} space-y-1`}>
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {label}
          </label>
        )}

        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}

          <input ref={ref} className={inputClasses} {...props} />

          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }
);
