'use client'

import React, { useState, useMemo } from 'react'
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  FunnelIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline'
import { Input } from './Input'
import { Select } from './Select'
import { Button } from './Button'

export interface TableColumn<T> {
  key: keyof T | string
  header: string
  accessor?: (row: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  filterType?: 'text' | 'select'
  filterOptions?: Array<{ value: string; label: string }>
  width?: string
  className?: string
  headerClassName?: string
}

export interface TableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  sortable?: boolean
  filterable?: boolean
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange?: (pageSize: number) => void
  }
  onRowClick?: (row: T, index: number) => void
  emptyMessage?: string
  className?: string
  actions?: (row: T, index: number) => React.ReactNode
}

type SortDirection = 'asc' | 'desc' | null

export function Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  sortable = true,
  filterable = false,
  pagination,
  onRowClick,
  emptyMessage = 'No data available',
  className,
  actions
}: TableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | string
    direction: SortDirection
  }>({ key: '', direction: null })
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = useState(false)

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = [...data]

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(row =>
        columns.some(col => {
          const value = col.accessor ? 
            col.accessor(row) : 
            row[col.key as keyof T]
          return String(value).toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter(row => {
          const value = String(row[key as keyof T]).toLowerCase()
          return value.includes(filterValue.toLowerCase())
        })
      }
    })

    return filtered
  }, [data, searchTerm, filters, columns])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredData

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key as keyof T]
      const bVal = b[sortConfig.key as keyof T]

      if (aVal === bVal) return 0
      
      const comparison = aVal < bVal ? -1 : 1
      return sortConfig.direction === 'desc' ? -comparison : comparison
    })
  }, [filteredData, sortConfig])

  const handleSort = (key: keyof T | string) => {
    if (!sortable) return
    
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getSortIcon = (key: keyof T | string) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === 'asc' ? 
      <ChevronUpIcon className="h-4 w-4" /> : 
      <ChevronDownIcon className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4 dark:bg-gray-700"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded mb-2 dark:bg-gray-800"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full ${className || ''}`}>
      {/* Search and Filter Controls */}
      <div className="mb-4 space-y-4">
        <div className="flex items-center gap-4">
          {searchable && (
            <div className="flex-1 max-w-md">
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
              />
            </div>
          )}
          
          {filterable && (
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<FunnelIcon className="h-4 w-4" />}
            >
              Filters
            </Button>
          )}
        </div>

        {/* Filter Controls */}
        {filterable && showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
            {columns
              .filter(col => col.filterable)
              .map(col => (
                <div key={String(col.key)}>
                  {col.filterType === 'select' && col.filterOptions ? (
                    <Select
                      label={col.header}
                      placeholder={`Filter by ${col.header}`}
                      options={[
                        { value: '', label: 'All' },
                        ...col.filterOptions
                      ]}
                      value={filters[String(col.key)] || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        [String(col.key)]: e.target.value
                      }))}
                    />
                  ) : (
                    <Input
                      label={col.header}
                      placeholder={`Filter by ${col.header}`}
                      value={filters[String(col.key)] || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        [String(col.key)]: e.target.value
                      }))}
                    />
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`
                    px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                    dark:text-gray-400
                    ${column.sortable && sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                    ${column.headerClassName || ''}
                  `}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr
                  key={index}
                  className={`
                    hover:bg-gray-50 dark:hover:bg-gray-800
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                  onClick={() => onRowClick?.(row, index)}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`
                        px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100
                        ${column.className || ''}
                      `}
                    >
                      {column.accessor ? 
                        column.accessor(row) : 
                        String(row[column.key as keyof T] || '')
                      }
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {actions(row, index)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 dark:bg-gray-900 dark:border-gray-700">
          <div className="flex-1 flex justify-between items-center">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {pagination.page}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page * pagination.pageSize >= pagination.total}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}