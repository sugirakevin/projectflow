import React from 'react';

const PRIORITY_STYLES = {
  CRITICAL: 'bg-red-500/20 text-red-400 border border-red-500/30',
  HIGH: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  LOW: 'bg-green-500/20 text-green-400 border border-green-500/30',
};

const DEV_STATUS_STYLES = {
  NOT_STARTED: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  IN_REVIEW: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  COMPLETED: 'bg-green-500/20 text-green-400 border border-green-500/30',
  BLOCKED: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const TEST_STATUS_STYLES = {
  NOT_STARTED: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  PASSED: 'bg-green-500/20 text-green-400 border border-green-500/30',
  FAILED: 'bg-red-500/20 text-red-400 border border-red-500/30',
  BLOCKED: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const OVERDUE_STYLES = {
  yes_dev: 'bg-red-500/20 text-red-400 border border-red-500/30',
  yes_testing: 'bg-red-500/20 text-red-400 border border-red-500/30',
  no: 'bg-green-500/20 text-green-400 border border-green-500/30',
  closed: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

const PRIORITY_LABELS = { CRITICAL: 'Critical', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };
const DEV_LABELS = { NOT_STARTED: 'Not Started', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', COMPLETED: 'Completed', BLOCKED: 'Blocked' };
const TEST_LABELS = { NOT_STARTED: 'Not Started', IN_PROGRESS: 'In Progress', PASSED: 'Passed', FAILED: 'Failed', BLOCKED: 'Blocked' };

export function PriorityBadge({ value }) {
  return (
    <span className={`badge ${PRIORITY_STYLES[value] || PRIORITY_STYLES.MEDIUM}`}>
      {PRIORITY_LABELS[value] || value}
    </span>
  );
}

export function DevStatusBadge({ value }) {
  return (
    <span className={`badge ${DEV_STATUS_STYLES[value] || DEV_STATUS_STYLES.NOT_STARTED}`}>
      {DEV_LABELS[value] || value}
    </span>
  );
}

export function TestStatusBadge({ value }) {
  return (
    <span className={`badge ${TEST_STATUS_STYLES[value] || TEST_STATUS_STYLES.NOT_STARTED}`}>
      {TEST_LABELS[value] || value}
    </span>
  );
}

export function OverdueBadge({ overdueFlag, overdueTeam, isClosed }) {
  if (isClosed) {
    return <span className={`badge ${OVERDUE_STYLES.closed}`}>✓ Closed</span>;
  }
  if (!overdueFlag) {
    return <span className={`badge ${OVERDUE_STYLES.no}`}>On Time</span>;
  }
  const key = overdueTeam === 'Dev' ? 'yes_dev' : 'yes_testing';
  return (
    <span className={`badge ${OVERDUE_STYLES[key]}`}>
      ⚠ {overdueTeam} Team
    </span>
  );
}
