'use client'

import { useState, useEffect } from 'react'
import { errorTracker, ErrorReport, NetworkError, PerformanceMetric } from '@/lib/monitoring/error-tracker'

export function ErrorDashboard() {
  const [errors, setErrors] = useState<ErrorReport[]>([])
  const [networkErrors, setNetworkErrors] = useState<NetworkError[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [summary, setSummary] = useState<any>({})
  const [isVisible, setIsVisible] = useState(false)

  const refreshData = () => {
    setErrors(errorTracker.getErrors())
    setNetworkErrors(errorTracker.getNetworkErrors())
    setMetrics(errorTracker.getMetrics())
    setSummary(errorTracker.getErrorSummary())
  }

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 2000) // Refresh every 2 seconds
    return () => clearInterval(interval)
  }, [])

  // Toggle dashboard with Ctrl+Shift+E (Error Dashboard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault()
        setIsVisible(!isVisible)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible])

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-red-500 text-white px-3 py-1 rounded-full text-xs shadow-lg hover:bg-red-600 transition-colors"
          title="Open Error Dashboard (Ctrl+Shift+E)"
        >
          🚨 {summary.totalErrors || 0}
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-4 bg-gray-900 text-white p-6 rounded-lg shadow-2xl z-50 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-red-400">
          🚨 NestFest Error Monitoring Dashboard
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={refreshData}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => {
              errorTracker.clearAll()
              refreshData()
            }}
            className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
          >
            🗑️ Clear All
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-800 p-4 rounded">
          <h3 className="font-semibold">Total Errors</h3>
          <p className="text-2xl">{summary.totalErrors || 0}</p>
        </div>
        <div className="bg-orange-800 p-4 rounded">
          <h3 className="font-semibold">Network Errors</h3>
          <p className="text-2xl">{summary.networkErrorsCount || 0}</p>
        </div>
        <div className="bg-blue-800 p-4 rounded">
          <h3 className="font-semibold">Session ID</h3>
          <p className="text-sm font-mono">{summary.sessionId?.slice(-8) || 'N/A'}</p>
        </div>
        <div className="bg-green-800 p-4 rounded">
          <h3 className="font-semibold">Performance Metrics</h3>
          <p className="text-2xl">{metrics.length}</p>
        </div>
      </div>

      {/* Error Suggestions */}
      {summary.suggestions && summary.suggestions.length > 0 && (
        <div className="bg-yellow-900 p-4 rounded mb-6">
          <h3 className="font-semibold text-yellow-300 mb-2">💡 Suggestions:</h3>
          {summary.suggestions.map((suggestion: string, index: number) => (
            <p key={index} className="text-yellow-200 text-sm mb-1">{suggestion}</p>
          ))}
        </div>
      )}

      {/* Recent 405 Errors */}
      {summary.recent405Errors && summary.recent405Errors.length > 0 && (
        <div className="bg-purple-900 p-4 rounded mb-6">
          <h3 className="font-semibold text-purple-300 mb-2">🔒 Recent 405 Errors:</h3>
          {summary.recent405Errors.map((error: NetworkError) => (
            <div key={error.id} className="text-purple-200 text-sm mb-1">
              <code>{error.method} {error.url}</code> - {new Date(error.timestamp).toLocaleTimeString()}
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 mb-4">
        <button
          className="px-4 py-2 bg-red-700 rounded"
          onClick={() => document.getElementById('errors-tab')?.scrollIntoView()}
        >
          Errors ({errors.length})
        </button>
        <button
          className="px-4 py-2 bg-orange-700 rounded"
          onClick={() => document.getElementById('network-tab')?.scrollIntoView()}
        >
          Network ({networkErrors.length})
        </button>
        <button
          className="px-4 py-2 bg-blue-700 rounded"
          onClick={() => document.getElementById('metrics-tab')?.scrollIntoView()}
        >
          Metrics ({metrics.length})
        </button>
      </div>

      {/* JavaScript Errors */}
      <div id="errors-tab" className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-red-300">🐛 JavaScript Errors</h3>
        {errors.length === 0 ? (
          <p className="text-green-400">✅ No errors detected!</p>
        ) : (
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {errors.slice(0, 10).map((error) => (
              <div key={error.id} className="bg-red-900/50 p-4 rounded border border-red-700">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-red-700 px-2 py-1 rounded text-xs font-semibold">
                    {error.type.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(error.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="font-semibold text-red-300 mb-2">{error.message}</p>
                <p className="text-xs text-gray-300">URL: {error.url}</p>
                {error.line && (
                  <p className="text-xs text-gray-300">Line: {error.line}:{error.column}</p>
                )}
                {error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-400 cursor-pointer">Stack Trace</summary>
                    <pre className="text-xs text-gray-300 mt-2 whitespace-pre-wrap bg-gray-800 p-2 rounded">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Network Errors */}
      <div id="network-tab" className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-orange-300">🌐 Network Errors</h3>
        {networkErrors.length === 0 ? (
          <p className="text-green-400">✅ No network errors detected!</p>
        ) : (
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {networkErrors.slice(0, 10).map((error) => (
              <div key={error.id} className="bg-orange-900/50 p-4 rounded border border-orange-700">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    error.status >= 500 ? 'bg-red-700' : 
                    error.status >= 400 ? 'bg-orange-700' : 'bg-gray-700'
                  }`}>
                    {error.status} {error.statusText}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(error.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="font-semibold text-orange-300">
                  {error.method} {error.url}
                </p>
                <p className="text-xs text-gray-300">
                  Response Time: {error.responseTime}ms
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div id="metrics-tab" className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-blue-300">⚡ Performance Metrics</h3>
        {metrics.length === 0 ? (
          <p className="text-gray-400">No metrics recorded yet.</p>
        ) : (
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {metrics.slice(0, 10).map((metric) => (
              <div key={metric.id} className="bg-blue-900/50 p-4 rounded border border-blue-700">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-blue-700 px-2 py-1 rounded text-xs font-semibold">
                    {metric.type.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(metric.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="font-semibold text-blue-300">{metric.name}</p>
                <p className="text-lg text-blue-200">{metric.duration.toFixed(2)}ms</p>
                {metric.metadata && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-400 cursor-pointer">Details</summary>
                    <pre className="text-xs text-gray-300 mt-2 whitespace-pre-wrap bg-gray-800 p-2 rounded">
                      {JSON.stringify(metric.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-400 text-center">
        Press Ctrl+Shift+E to toggle | Auto-refreshes every 2 seconds
      </div>
    </div>
  )
}