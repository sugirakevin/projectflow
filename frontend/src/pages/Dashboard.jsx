import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const PRIORITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
};

const STATUS_COLORS = {
  NOT_STARTED: '#6b7280',
  IN_PROGRESS: '#eab308',
  IN_REVIEW: '#3b82f6',
  COMPLETED: '#22c55e',
  BLOCKED: '#ef4444',
};

const STATUS_LABELS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  COMPLETED: 'Completed',
  BLOCKED: 'Blocked',
};

function StatCard({ label, value, color, icon }) {
  return (
    <div className="card p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200">
        {payload[0].name}: <strong>{payload[0].value}</strong>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/summary')
      .then(res => setSummary(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const priorityData = summary?.byPriority?.map(p => ({
    name: p.priority,
    value: p.count,
    fill: PRIORITY_COLORS[p.priority] || '#6b7280',
  })) || [];

  const statusData = summary?.byDevStatus?.map(s => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
    fill: STATUS_COLORS[s.status] || '#6b7280',
  })) || [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of your project health</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Tasks" value={summary?.total ?? 0} icon="📋" color="bg-violet-500/20" />
        <StatCard label="Overdue Tasks" value={summary?.overdue ?? 0} icon="⚠️" color="bg-red-500/20" />
        <StatCard label="Closed Tasks" value={summary?.closed ?? 0} icon="✅" color="bg-green-500/20" />
        <StatCard label="In Progress" value={summary?.byDevStatus?.find(s => s.status === 'IN_PROGRESS')?.count ?? 0} icon="⚡" color="bg-yellow-500/20" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-200 mb-6">Tasks by Priority</h2>
          {priorityData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-500">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {priorityData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={value => <span className="text-gray-400 text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-200 mb-6">Tasks by Dev Status</h2>
          {statusData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-500">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
