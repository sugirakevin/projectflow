import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const DEV_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'];
const TEST_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'BLOCKED'];
const GROUPS = ['Backend', 'Frontend', 'DevOps', 'Design', 'QA', 'Data', 'Mobile', 'Other'];

const DEFAULT_FORM = {
  title: '',
  group: 'Backend',
  description: '',
  priority: 'MEDIUM',
  devStatus: 'NOT_STARTED',
  testStatus: 'NOT_STARTED',
  deadline: '',
  notes: '',
  assignedUserId: '',
};

export default function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditing = !!task;

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        group: task.group || 'Backend',
        description: task.description || '',
        priority: task.priority || 'MEDIUM',
        devStatus: task.devStatus || 'NOT_STARTED',
        testStatus: task.testStatus || 'NOT_STARTED',
        deadline: task.deadline ? task.deadline.slice(0, 10) : '',
        notes: task.notes || '',
        assignedTeamId: task.assignedTeamId || '',
        assignedUserId: task.assignedUserId || '',
      });
    } else {
      setForm({ ...DEFAULT_FORM, assignedTeamId: '' });
    }
    // Load users and teams for assigning
    Promise.all([
      api.get('/tasks/users'),
      api.get('/teams')
    ]).then(([uRes, tRes]) => {
      setUsers(uRes.data);
      setTeams(tRes.data);
    }).catch(() => {});
  }, [task]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        assignedUserId: form.assignedUserId || null,
        assignedTeamId: form.assignedTeamId || null,
      };
      let res;
      if (isEditing) {
        res = await api.put(`/tasks/${task.id}`, payload);
      } else {
        res = await api.post('/tasks', payload);
      }
      onSave(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task.');
    } finally {
      setSaving(false);
    }
  };

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-lg font-semibold text-white">{isEditing ? 'Edit Task' : 'Create New Task'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-gray-200">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          {/* Title & Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Task Title *</label>
              <input
                id="task-title"
                type="text"
                required
                className="input"
                placeholder="e.g. Set up CI/CD pipeline"
                value={form.title}
                onChange={e => set('title', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Group *</label>
              <select id="task-group" className="input" value={form.group} onChange={e => set('group', e.target.value)}>
                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea
              id="task-description"
              className="input resize-none"
              rows={3}
              placeholder="Brief description of the task…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          {/* Priority & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Priority</label>
              <select id="task-priority" className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Deadline *</label>
              <input
                id="task-deadline"
                type="date"
                required
                className="input"
                value={form.deadline}
                onChange={e => set('deadline', e.target.value)}
              />
            </div>
          </div>

          {/* Dev Status & Test Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Dev Status</label>
              <select id="task-devstatus" className="input" value={form.devStatus} onChange={e => set('devStatus', e.target.value)}>
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="COMPLETED">Completed</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
            <div>
              <label className="label">Test Status</label>
              <select id="task-teststatus" className="input" value={form.testStatus} onChange={e => set('testStatus', e.target.value)}>
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PASSED">Passed</option>
                <option value="FAILED">Failed</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
          </div>

          {/* Assigned Group & User */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Assigned Group *</label>
              <select 
                id="task-assignee-group" 
                required
                className="input" 
                value={form.assignedTeamId} 
                onChange={e => {
                  set('assignedTeamId', e.target.value);
                  // Optionally clear assigned user if they don't belong to new group
                  set('assignedUserId', ''); 
                }}
              >
                <option value="" disabled>Select a Group</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Assigned Individual</label>
              <select id="task-assignee" className="input" value={form.assignedUserId} onChange={e => set('assignedUserId', e.target.value)}>
                <option value="">Unassigned</option>
                {users
                  .filter(u => {
                    // Filter down to only team members if a team is selected
                    if (!form.assignedTeamId) return true;
                    const selectedTeam = teams.find(t => t.id === form.assignedTeamId);
                    if (!selectedTeam) return true;
                    return selectedTeam.users.some(tu => tu.id === u.id);
                  })
                  .map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea
              id="task-notes"
              className="input resize-none"
              rows={2}
              placeholder="Any additional notes…"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-800">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button
              type="submit"
              id="save-task-btn"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving…
                </span>
              ) : isEditing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
