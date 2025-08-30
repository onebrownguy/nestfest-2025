'use client'

import React, { forwardRef, useState, useId } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: 'default' | 'filled' | 'underlined'
  containerClassName?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    variant = 'default',
    containerClassName,
    id,
    disabled,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [focused, setFocused] = useState(false)
    const generatedId = useId()
    const inputId = id || generatedId
    
    const isPasswordType = type === 'password'
    const inputType = isPasswordType && showPassword ? 'text' : type

    const baseStyles = 'w-full transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
    
    const variantStyles = {
      default: `
        border border-gray-300 rounded-lg px-3 py-2 text-sm
        focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10
        dark:border-gray-600 dark:bg-gray-800 dark:text-white
        dark:focus:border-blue-400
      `,
      filled: `
        bg-gray-100 border-0 rounded-lg px-3 py-2 text-sm
        focus:bg-white focus:ring-2 focus:ring-blue-500/20
        dark:bg-gray-800 dark:text-white
        dark:focus:bg-gray-700
      `,
      underlined: `
        border-0 border-b-2 border-gray-300 rounded-none px-0 py-2 text-sm bg-transparent
        focus:border-blue-500 focus:ring-0
        dark:border-gray-600 dark:text-white
        dark:focus:border-blue-400
      `
    }

    const inputStyles = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${leftIcon ? 'pl-10' : ''}
      ${rightIcon || isPasswordType ? 'pr-10' : ''}
      ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
      ${className || ''}
    `

    return (
      <div className={`w-full ${containerClassName || ''}`}>
        {label && (
          <label
            htmlFor={inputId}
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
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {leftIcon}
            </div>
          )}
          
          <input
            type={inputType}
            className={inputStyles}
            ref={ref}
            id={inputId}
            disabled={disabled}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
          
          {(rightIcon || isPasswordType) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isPasswordType ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              ) : (
                rightIcon
              )}
            </div>
          )}
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

Input.displayName = 'Input'

export { Input }