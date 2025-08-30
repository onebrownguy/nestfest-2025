'use client'

import React, { forwardRef, useId } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  options: SelectOption[]
  placeholder?: string
  variant?: 'default' | 'filled' | 'underlined'
  size?: 'sm' | 'default' | 'lg'
  containerClassName?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    className,
    label,
    error,
    helperText,
    options,
    placeholder,
    variant = 'default',
    size = 'default',
    containerClassName,
    id,
    disabled,
    ...props
  }, ref) => {
    const generatedId = useId()
    const selectId = id || generatedId

    const baseStyles = 'w-full appearance-none bg-white transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900 dark:text-white'
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      default: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base'
    }
    
    const variantStyles = {
      default: `
        border border-gray-300 rounded-lg
        focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10
        dark:border-gray-600 dark:bg-gray-800
        dark:focus:border-blue-400
      `,
      filled: `
        bg-gray-100 border-0 rounded-lg
        focus:bg-white focus:ring-2 focus:ring-blue-500/20
        dark:bg-gray-800
        dark:focus:bg-gray-700
      `,
      underlined: `
        border-0 border-b-2 border-gray-300 rounded-none bg-transparent
        focus:border-blue-500 focus:ring-0
        dark:border-gray-600
        dark:focus:border-blue-400
      `
    }

    const selectStyles = `
      ${baseStyles}
      ${sizeStyles[size]}
      ${variantStyles[variant]}
      ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
      ${className || ''}
    `

    return (
      <div className={`w-full ${containerClassName || ''}`}>
        {label && (
          <label
            htmlFor={selectId}
            className={`
              block text-sm font-medium mb-1.5 transition-colors
              ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}
              ${disabled ? 'opacity-50' : ''}
            `}
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          <select
            className={selectStyles}
            ref={ref}
            id={selectId}
            disabled={disabled}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500">
            <ChevronDownIcon className="h-4 w-4" />
          </div>
        </div>
        
        {(error || helperText) && (
          <p className={`
            mt-1.5 text-xs
            ${error 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-gray-500 dark:text-gray-400'
            }
          `}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }