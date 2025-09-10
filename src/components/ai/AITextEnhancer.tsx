/**
 * AI Text Enhancer Component
 * 
 * A reusable React component for enhancing text using Claude AI
 * Integrates with the /api/ai/enhance endpoint
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useAIEnhancement } from '@/hooks/useAIEnhancement'
import type { AIEnhancementRequest } from '@/types'

interface AITextEnhancerProps {
  initialText?: string
  onTextChange?: (text: string) => void
  onEnhanced?: (originalText: string, enhancedText: string) => void
  className?: string
  placeholder?: string
  context?: AIEnhancementRequest['context']
  tone?: AIEnhancementRequest['tone']
  targetLength?: AIEnhancementRequest['target_length']
  focusAreas?: AIEnhancementRequest['focus_areas']
  showSettings?: boolean
  maxHeight?: string
}

const contextOptions = [
  { value: 'project_description', label: 'Project Description' },
  { value: 'competition_pitch', label: 'Competition Pitch' },
  { value: 'executive_summary', label: 'Executive Summary' },
  { value: 'general', label: 'General Text' }
] as const

const toneOptions = [
  { value: 'professional', label: 'Professional' },
  { value: 'enthusiastic', label: 'Enthusiastic' },
  { value: 'technical', label: 'Technical' },
  { value: 'conversational', label: 'Conversational' }
] as const

const targetLengthOptions = [
  { value: 'maintain', label: 'Maintain Length' },
  { value: 'expand', label: 'Expand Details' },
  { value: 'condense', label: 'Make Concise' }
] as const

const focusAreaOptions = [
  { value: 'clarity', label: 'Clarity' },
  { value: 'impact', label: 'Impact' },
  { value: 'technical_detail', label: 'Technical Detail' },
  { value: 'market_appeal', label: 'Market Appeal' },
  { value: 'innovation', label: 'Innovation' }
] as const

export function AITextEnhancer({
  initialText = '',
  onTextChange,
  onEnhanced,
  className = '',
  placeholder = 'Enter text to enhance...',
  context = 'project_description',
  tone = 'professional',
  targetLength = 'maintain',
  focusAreas = ['clarity', 'impact'],
  showSettings = false,
  maxHeight = '300px'
}: AITextEnhancerProps) {
  const [text, setText] = useState(initialText)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [settings, setSettings] = useState({
    context,
    tone,
    target_length: targetLength,
    focus_areas: focusAreas
  })
  const [showComparison, setShowComparison] = useState(false)

  const {
    enhanceText,
    isLoading,
    error,
    lastResult,
    clearError,
    canEnhance,
    getCharacterStatus
  } = useAIEnhancement({
    onSuccess: (result) => {
      onEnhanced?.(result.originalText, result.enhancedText)
    }
  })

  const characterStatus = getCharacterStatus(text)

  useEffect(() => {
    onTextChange?.(text)
  }, [text, onTextChange])

  const handleEnhance = async () => {
    if (!canEnhance(text)) return

    try {
      const result = await enhanceText(text, settings)
      setText(result.enhancedText)
      setShowComparison(true)
    } catch (error) {
      // Error is handled by the hook
    }
  }

  const handleAcceptEnhancement = () => {
    if (lastResult) {
      setText(lastResult.enhancedText)
      setShowComparison(false)
    }
  }

  const handleRejectEnhancement = () => {
    if (lastResult) {
      setText(lastResult.originalText)
      setShowComparison(false)
    }
  }

  const handleFocusAreaToggle = (area: typeof focusAreas[number]) => {
    setSettings(prev => ({
      ...prev,
      focus_areas: prev.focus_areas.includes(area)
        ? prev.focus_areas.filter(a => a !== area)
        : [...prev.focus_areas, area]
    }))
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Text Area */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className={`w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? 'border-red-500' : ''
          }`}
          style={{ height: maxHeight }}
          disabled={isLoading}
        />
        
        {/* Character Counter */}
        <div className="absolute bottom-2 right-2 text-sm text-gray-500">
          <span className={characterStatus.isNearMax ? 'text-orange-500' : ''}>
            {characterStatus.count}
          </span>
          <span className="text-gray-400">/{characterStatus.max}</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Enhancement Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleEnhance}
            disabled={!canEnhance(text) || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path fill="currentColor" d="m12 2 1.41 1.41-1.41 1.42 1.41 1.41L12 7.66 10.59 6.24 12 4.83 10.59 3.41 12 2z" className="opacity-75" />
              </svg>
            )}
            <span>{isLoading ? 'Enhancing...' : 'Enhance with AI'}</span>
          </button>

          {showSettings && (
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Settings
            </button>
          )}
        </div>

        {/* Character Status */}
        <div className="text-sm text-gray-500">
          {!characterStatus.isValid && (
            <span className="text-red-500">
              {characterStatus.count < characterStatus.min
                ? `Need ${characterStatus.min - characterStatus.count} more characters`
                : `${characterStatus.count - characterStatus.max} characters over limit`
              }
            </span>
          )}
        </div>
      </div>

      {/* Advanced Settings */}
      {showAdvanced && showSettings && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
          <h3 className="font-medium text-gray-900">Enhancement Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Context */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Context</label>
              <select
                value={settings.context}
                onChange={(e) => setSettings(prev => ({ ...prev, context: e.target.value as any }))}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                {contextOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
              <select
                value={settings.tone}
                onChange={(e) => setSettings(prev => ({ ...prev, tone: e.target.value as any }))}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                {toneOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Length */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
              <select
                value={settings.target_length}
                onChange={(e) => setSettings(prev => ({ ...prev, target_length: e.target.value as any }))}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                {targetLengthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Focus Areas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Focus Areas</label>
            <div className="flex flex-wrap gap-2">
              {focusAreaOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleFocusAreaToggle(option.value)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    settings.focus_areas.includes(option.value)
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhancement Results */}
      {lastResult && showComparison && (
        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-green-900">Enhancement Complete!</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleAcceptEnhancement}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Accept
              </button>
              <button
                onClick={handleRejectEnhancement}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Revert
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-4 text-sm text-green-700 mb-3">
            <span>
              {lastResult.characterCount.change > 0 ? '+' : ''}
              {lastResult.characterCount.change} characters
            </span>
            <span>
              {lastResult.wordCount.change > 0 ? '+' : ''}
              {lastResult.wordCount.change} words
            </span>
            <span className="capitalize">{lastResult.enhancementStrength} changes</span>
            <span>{lastResult.processingTime}ms</span>
          </div>

          {/* Improvements */}
          {lastResult.improvements.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-green-900">Improvements Made:</h4>
              <ul className="space-y-1">
                {lastResult.improvements.map((improvement, index) => (
                  <li key={index} className="text-sm text-green-700">
                    <span className="font-medium capitalize">{improvement.category}:</span> {improvement.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AITextEnhancer