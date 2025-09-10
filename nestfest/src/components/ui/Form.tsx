'use client'

import React, { createContext, useContext, useId } from 'react'
import { useForm, FormProvider, UseFormReturn, FieldPath, FieldValues } from 'react-hook-form'
import { Input, InputProps } from './Input'
import { Select, SelectProps } from './Select'
import { Button } from './Button'

// Form Context
interface FormContextType {
  form: UseFormReturn<any>
}

const FormContext = createContext<FormContextType | null>(null)

// Main Form Component
export interface FormProps<T extends FieldValues> {
  form: UseFormReturn<T>
  onSubmit: (data: T) => void | Promise<void>
  children: React.ReactNode
  className?: string
}

export function Form<T extends FieldValues>({
  form,
  onSubmit,
  children,
  className
}: FormProps<T>) {
  return (
    <FormProvider {...form}>
      <FormContext.Provider value={{ form }}>
        <form 
          onSubmit={form.handleSubmit(onSubmit)}
          className={className}
          noValidate
        >
          {children}
        </form>
      </FormContext.Provider>
    </FormProvider>
  )
}

// Form Field Component
export interface FormFieldProps<T extends FieldValues> {
  name: FieldPath<T>
  children: (field: {
    value: any
    onChange: (value: any) => void
    onBlur: () => void
    error?: string
  }) => React.ReactNode
}

export function FormField<T extends FieldValues>({
  name,
  children
}: FormFieldProps<T>) {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('FormField must be used within a Form component')
  }

  const { form } = context
  const {
    register,
    formState: { errors },
    watch,
    setValue,
    trigger
  } = form

  const fieldError = errors[name]
  const value = watch(name)

  const handleChange = async (newValue: any) => {
    setValue(name, newValue, { shouldDirty: true })
    await trigger(name)
  }

  const handleBlur = async () => {
    await trigger(name)
  }

  return children({
    value,
    onChange: handleChange,
    onBlur: handleBlur,
    error: fieldError?.message as string | undefined
  })
}

// Form Input Component
export interface FormInputProps<T extends FieldValues> 
  extends Omit<InputProps, 'value' | 'onChange' | 'onBlur' | 'error'> {
  name: FieldPath<T>
}

export function FormInput<T extends FieldValues>({
  name,
  ...props
}: FormInputProps<T>) {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('FormInput must be used within a Form component')
  }

  const { form } = context
  const {
    register,
    formState: { errors }
  } = form

  const fieldError = errors[name]

  return (
    <Input
      {...register(name)}
      error={fieldError?.message as string | undefined}
      {...props}
    />
  )
}

// Form Select Component
export interface FormSelectProps<T extends FieldValues>
  extends Omit<SelectProps, 'value' | 'onChange' | 'onBlur' | 'error'> {
  name: FieldPath<T>
}

export function FormSelect<T extends FieldValues>({
  name,
  ...props
}: FormSelectProps<T>) {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('FormSelect must be used within a Form component')
  }

  const { form } = context
  const {
    register,
    formState: { errors }
  } = form

  const fieldError = errors[name]

  return (
    <Select
      {...register(name)}
      error={fieldError?.message as string | undefined}
      {...props}
    />
  )
}

// Form Textarea Component
export interface FormTextareaProps<T extends FieldValues>
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> {
  name: FieldPath<T>
  label?: string
  error?: string
  helperText?: string
  containerClassName?: string
}

export function FormTextarea<T extends FieldValues>({
  name,
  label,
  error,
  helperText,
  containerClassName,
  className,
  id,
  disabled,
  ...props
}: FormTextareaProps<T>) {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('FormTextarea must be used within a Form component')
  }

  const { form } = context
  const {
    register,
    formState: { errors }
  } = form

  const fieldError = errors[name]
  const textareaId = id || `textarea-${Math.random().toString(36).substring(7)}`
  const displayError = error || (fieldError?.message as string | undefined)

  return (
    <div className={`w-full ${containerClassName || ''}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className={`
            block text-sm font-medium mb-1.5 transition-colors
            ${displayError ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}
            ${disabled ? 'opacity-50' : ''}
          `}
        >
          {label}
        </label>
      )}
      
      <textarea
        {...register(name)}
        id={textareaId}
        disabled={disabled}
        className={`
          w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
          focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none
          disabled:cursor-not-allowed disabled:opacity-50 transition-colors
          dark:border-gray-600 dark:bg-gray-800 dark:text-white
          dark:focus:border-blue-400
          ${displayError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
          ${className || ''}
        `}
        {...props}
      />
      
      {(displayError || helperText) && (
        <p className={`
          mt-1.5 text-xs
          ${displayError 
            ? 'text-red-600 dark:text-red-400' 
            : 'text-gray-500 dark:text-gray-400'
          }
        `}>
          {displayError || helperText}
        </p>
      )}
    </div>
  )
}

// Form Checkbox Component
export interface FormCheckboxProps<T extends FieldValues> {
  name: FieldPath<T>
  label: string
  description?: string
  disabled?: boolean
  className?: string
}

export function FormCheckbox<T extends FieldValues>({
  name,
  label,
  description,
  disabled,
  className
}: FormCheckboxProps<T>) {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('FormCheckbox must be used within a Form component')
  }

  const { form } = context
  const {
    register,
    formState: { errors }
  } = form

  const fieldError = errors[name]
  const checkboxId = useId()

  return (
    <div className={`flex items-start ${className || ''}`}>
      <div className="flex items-center h-5">
        <input
          {...register(name)}
          id={checkboxId}
          type="checkbox"
          disabled={disabled}
          className="
            w-4 h-4 text-blue-600 border-gray-300 rounded 
            focus:ring-blue-500 focus:ring-2 focus:ring-offset-0
            disabled:cursor-not-allowed disabled:opacity-50
            dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-400
          "
        />
      </div>
      <div className="ml-3 text-sm">
        <label 
          htmlFor={checkboxId}
          className={`
            font-medium text-gray-700 cursor-pointer dark:text-gray-300
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {label}
        </label>
        {description && (
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        )}
        {fieldError && (
          <p className="text-red-600 dark:text-red-400 mt-1">
            {fieldError.message as string}
          </p>
        )}
      </div>
    </div>
  )
}

// Form Submit Button Component
export interface FormSubmitProps {
  children: React.ReactNode
  loading?: boolean
  disabled?: boolean
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function FormSubmit({
  children,
  loading,
  disabled,
  ...props
}: FormSubmitProps) {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('FormSubmit must be used within a Form component')
  }

  const { form } = context
  const { formState: { isSubmitting, isValid } } = form

  return (
    <Button
      type="submit"
      loading={loading || isSubmitting}
      disabled={disabled || isSubmitting}
      {...props}
    >
      {children}
    </Button>
  )
}

// Hook to use form context
export function useFormContext() {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('useFormContext must be used within a Form component')
  }
  return context.form
}

// Export all components
export {
  useForm,
  type UseFormReturn,
  type FieldValues,
  type FieldPath
}