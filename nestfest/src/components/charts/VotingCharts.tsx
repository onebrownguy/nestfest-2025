'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter
} from 'recharts'

// Color palette for charts
const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
]

// Real-time voting results chart
interface VotingResultsChartProps {
  data: Array<{
    submission: string
    votes: number
    credits: number
    percentage: number
  }>
  height?: number
  showCredits?: boolean
}

export const VotingResultsChart: React.FC<VotingResultsChartProps> = ({
  data,
  height = 300,
  showCredits = false
}) => {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="submission" 
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />
          <YAxis 
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
              value,
              name === 'votes' ? 'Votes' : name === 'credits' ? 'Credits' : name
            ]}
          />
          <Bar 
            dataKey="votes" 
            fill="#3B82F6"
            radius={[4, 4, 0, 0]}
            name="Votes"
          />
          {showCredits && (
            <Bar 
              dataKey="credits" 
              fill="#10B981"
              radius={[4, 4, 0, 0]}
              name="Credits"
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Vote distribution pie chart
interface VoteDistributionChartProps {
  data: Array<{
    name: string
    value: number
    percentage: number
  }>
  height?: number
}

export const VoteDistributionChart: React.FC<VoteDistributionChartProps> = ({
  data,
  height = 300
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value} votes ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      )
    }
    return null
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
            label={({ percentage }) => `${percentage.toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// Real-time voting activity chart
interface VotingActivityChartProps {
  data: Array<{
    time: string
    votes: number
    cumulative: number
  }>
  height?: number
}

export const VotingActivityChart: React.FC<VotingActivityChartProps> = ({
  data,
  height = 300
}) => {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />
          <YAxis 
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
            labelFormatter={(label) => `Time: ${label}`}
            formatter={(value, name) => [
              value,
              name === 'votes' ? 'Votes This Period' : 'Total Votes'
            ]}
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            stackId="1"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.3}
            name="cumulative"
          />
          <Area
            type="monotone"
            dataKey="votes"
            stackId="2"
            stroke="#10B981"
            fill="#10B981"
            fillOpacity={0.6}
            name="votes"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Submission scores comparison
interface SubmissionScoresChartProps {
  data: Array<{
    submission: string
    averageScore: number
    reviewCount: number
    category: string
  }>
  height?: number
}

export const SubmissionScoresChart: React.FC<SubmissionScoresChartProps> = ({
  data,
  height = 300
}) => {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="reviewCount" 
            type="number"
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
            label={{ value: 'Number of Reviews', position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            dataKey="averageScore"
            type="number"
            domain={[0, 10]}
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
            label={{ value: 'Average Score', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name, props) => [
              name === 'averageScore' ? `${value.toFixed(1)}/10` : value,
              name === 'averageScore' ? 'Average Score' : 'Reviews'
            ]}
            labelFormatter={(label, payload) => 
              payload?.[0]?.payload?.submission || 'Submission'
            }
          />
          <Scatter 
            dataKey="averageScore" 
            fill="#3B82F6"
            r={6}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

// Competition timeline chart
interface CompetitionTimelineChartProps {
  data: Array<{
    date: string
    submissions: number
    reviews: number
    votes: number
  }>
  height?: number
}

export const CompetitionTimelineChart: React.FC<CompetitionTimelineChartProps> = ({
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
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="submissions" 
            stroke="#3B82F6" 
            strokeWidth={2}
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            name="Submissions"
          />
          <Line 
            type="monotone" 
            dataKey="reviews" 
            stroke="#10B981" 
            strokeWidth={2}
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            name="Reviews"
          />
          <Line 
            type="monotone" 
            dataKey="votes" 
            stroke="#F59E0B" 
            strokeWidth={2}
            dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
            name="Votes"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Score distribution chart
interface ScoreDistributionChartProps {
  data: Array<{
    scoreRange: string
    count: number
    percentage: number
  }>
  height?: number
}

export const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({
  data,
  height = 300
}) => {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="scoreRange" 
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />
          <YAxis 
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
              `${value} (${data.find(d => d.count === value)?.percentage.toFixed(1)}%)`,
              'Submissions'
            ]}
          />
          <Bar 
            dataKey="count" 
            fill="#8B5CF6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Category performance chart
interface CategoryPerformanceChartProps {
  data: Array<{
    category: string
    submissions: number
    averageScore: number
    totalVotes: number
  }>
  height?: number
}

export const CategoryPerformanceChart: React.FC<CategoryPerformanceChartProps> = ({
  data,
  height = 300
}) => {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart 
          layout="horizontal"
          data={data} 
          margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            type="number"
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />
          <YAxis 
            type="category"
            dataKey="category" 
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
            width={75}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name) => [
              value,
              name === 'submissions' ? 'Submissions' : 
              name === 'averageScore' ? 'Avg Score' : 'Total Votes'
            ]}
          />
          <Bar 
            dataKey="submissions" 
            fill="#3B82F6"
            radius={[0, 4, 4, 0]}
            name="submissions"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Live voting momentum chart
interface VotingMomentumChartProps {
  data: Array<{
    timestamp: string
    votes: number
    velocity: number // votes per minute
  }>
  height?: number
}

export const VotingMomentumChart: React.FC<VotingMomentumChartProps> = ({
  data,
  height = 200
}) => {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis 
            dataKey="timestamp" 
            tick={{ fontSize: 10 }}
            stroke="#6B7280"
            hide
          />
          <YAxis 
            tick={{ fontSize: 10 }}
            stroke="#6B7280"
            width={30}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '12px'
            }}
            labelFormatter={(label) => `Time: ${label}`}
            formatter={(value, name) => [
              `${value}${name === 'velocity' ? '/min' : ''}`,
              name === 'velocity' ? 'Vote Rate' : 'Total Votes'
            ]}
          />
          <Line 
            type="monotone" 
            dataKey="velocity" 
            stroke="#EF4444" 
            strokeWidth={2}
            dot={false}
            name="velocity"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}