'use client'

import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from 'recharts'

// Color palette for charts
const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
]

// Dashboard stats overview chart
interface StatsOverviewChartProps {
  data: Array<{
    period: string
    submissions: number
    reviews: number
    users: number
  }>
  height?: number
  timeframe?: 'daily' | 'weekly' | 'monthly'
}

export const StatsOverviewChart: React.FC<StatsOverviewChartProps> = ({
  data,
  height = 300,
  timeframe = 'daily'
}) => {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              fontSize: '14px'
            }}
            labelFormatter={(label) => `${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="users"
            stackId="1"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.3}
            name="New Users"
          />
          <Area
            type="monotone"
            dataKey="submissions"
            stackId="1"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.6}
            name="Submissions"
          />
          <Area
            type="monotone"
            dataKey="reviews"
            stackId="1"
            stroke="#10B981"
            fill="#10B981"
            fillOpacity={0.8}
            name="Reviews"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// User engagement metrics
interface UserEngagementChartProps {
  data: Array<{
    date: string
    activeUsers: number
    sessionsPerUser: number
    avgSessionDuration: number
  }>
  height?: number
}

export const UserEngagementChart: React.FC<UserEngagementChartProps> = ({
  data,
  height = 300
}) => {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="activeUsers" 
            stroke="#3B82F6" 
            strokeWidth={3}
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            name="Active Users"
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="sessionsPerUser" 
            stroke="#10B981" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
            name="Sessions per User"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Competition performance metrics
interface CompetitionMetricsChartProps {
  data: Array<{
    name: string
    submissions: number
    participants: number
    completionRate: number
    satisfaction: number
  }>
  height?: number
}

export const CompetitionMetricsChart: React.FC<CompetitionMetricsChartProps> = ({
  data,
  height = 300
}) => {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name) => [
              typeof value === 'number' && name.includes('Rate') ? `${value}%` : value,
              name
            ]}
          />
          <Bar 
            yAxisId="left"
            dataKey="submissions" 
            fill="#3B82F6"
            radius={[2, 2, 0, 0]}
            name="Submissions"
          />
          <Bar 
            yAxisId="left"
            dataKey="participants" 
            fill="#10B981"
            radius={[2, 2, 0, 0]}
            name="Participants"
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="completionRate" 
            stroke="#F59E0B" 
            strokeWidth={3}
            name="Completion Rate %"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// System performance metrics
interface SystemPerformanceChartProps {
  data: Array<{
    time: string
    responseTime: number
    throughput: number
    errorRate: number
    cpuUsage: number
  }>
  height?: number
}

export const SystemPerformanceChart: React.FC<SystemPerformanceChartProps> = ({
  data,
  height = 250
}) => {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 11 }}
            stroke="#6B7280"
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 11 }}
            stroke="#6B7280"
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11 }}
            stroke="#6B7280"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '12px'
            }}
            formatter={(value, name) => [
              `${value}${
                name === 'responseTime' ? 'ms' : 
                name === 'errorRate' ? '%' : 
                name === 'cpuUsage' ? '%' : 
                '/min'
              }`,
              name === 'responseTime' ? 'Response Time' :
              name === 'throughput' ? 'Requests' :
              name === 'errorRate' ? 'Error Rate' :
              'CPU Usage'
            ]}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="responseTime" 
            stroke="#3B82F6" 
            strokeWidth={2}
            dot={false}
            name="responseTime"
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="errorRate" 
            stroke="#EF4444" 
            strokeWidth={2}
            dot={false}
            name="errorRate"
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="cpuUsage" 
            stroke="#F59E0B" 
            strokeWidth={2}
            dot={false}
            name="cpuUsage"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// User role distribution
interface UserRoleDistributionProps {
  data: Array<{
    role: string
    count: number
    percentage: number
  }>
  height?: number
}

export const UserRoleDistribution: React.FC<UserRoleDistributionProps> = ({
  data,
  height = 200
}) => {
  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={<CustomLabel />}
            outerRadius={60}
            fill="#8884d8"
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name, props) => [
              `${value} users (${props.payload.percentage.toFixed(1)}%)`,
              props.payload.role
            ]}
            labelFormatter={() => ''}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// Progress tracking radial chart
interface ProgressRadialChartProps {
  data: Array<{
    name: string
    value: number
    target: number
    fill: string
  }>
  height?: number
}

export const ProgressRadialChart: React.FC<ProgressRadialChartProps> = ({
  data,
  height = 250
}) => {
  const processedData = data.map(item => ({
    ...item,
    percentage: (item.value / item.target) * 100
  }))

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart 
          cx="50%" 
          cy="50%" 
          innerRadius="20%" 
          outerRadius="90%" 
          data={processedData}
        >
          <RadialBar 
            dataKey="percentage" 
            cornerRadius={10}
            label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value, name, props) => [
              `${props.payload.value}/${props.payload.target} (${value.toFixed(1)}%)`,
              props.payload.name
            ]}
            labelFormatter={() => ''}
            contentStyle={{ 
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Activity heatmap data (would need a different library for true heatmap)
interface ActivitySummaryChartProps {
  data: Array<{
    hour: string
    submissions: number
    reviews: number
    votes: number
  }>
  height?: number
}

export const ActivitySummaryChart: React.FC<ActivitySummaryChartProps> = ({
  data,
  height = 200
}) => {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="hour" 
            tick={{ fontSize: 10 }}
            stroke="#6B7280"
            axisLine={false}
          />
          <YAxis 
            tick={{ fontSize: 10 }}
            stroke="#6B7280"
            axisLine={false}
            width={25}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '12px'
            }}
            labelFormatter={(label) => `Hour: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="votes"
            stackId="1"
            stroke="#F59E0B"
            fill="#F59E0B"
            fillOpacity={0.4}
            name="Votes"
          />
          <Area
            type="monotone"
            dataKey="reviews"
            stackId="1"
            stroke="#10B981"
            fill="#10B981"
            fillOpacity={0.6}
            name="Reviews"
          />
          <Area
            type="monotone"
            dataKey="submissions"
            stackId="1"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.8}
            name="Submissions"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Revenue/credits tracking (if applicable)
interface RevenueTrackingChartProps {
  data: Array<{
    period: string
    revenue: number
    credits_sold: number
    credits_used: number
  }>
  height?: number
}

export const RevenueTrackingChart: React.FC<RevenueTrackingChartProps> = ({
  data,
  height = 300
}) => {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name) => [
              name === 'revenue' ? `$${value}` : value,
              name === 'revenue' ? 'Revenue' : 
              name === 'credits_sold' ? 'Credits Sold' : 'Credits Used'
            ]}
          />
          <Bar 
            yAxisId="left"
            dataKey="revenue" 
            fill="#10B981"
            radius={[4, 4, 0, 0]}
            name="revenue"
          />
          <Bar 
            yAxisId="right"
            dataKey="credits_sold" 
            fill="#3B82F6"
            radius={[4, 4, 0, 0]}
            name="credits_sold"
          />
          <Bar 
            yAxisId="right"
            dataKey="credits_used" 
            fill="#F59E0B"
            radius={[4, 4, 0, 0]}
            name="credits_used"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}