import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import TaskModal from '../components/TaskModal';
import { PriorityBadge, DevStatusBadge, TestStatusBadge, OverdueBadge } from '../components/Badge';
import Dashboard from './Dashboard';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const DEV_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'];
const TEST_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'BLOCKED'];

const DEV_LABELS = { NOT_STARTED: 'Not Started', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', COMPLETED: 'Completed', BLOCKED: 'Blocked' };
const TEST_LABELS = { NOT_STARTED: 'Not Started', IN_PROGRESS: 'In Progress', PASSED: 'Passed', FAILED: 'Failed', BLOCKED: 'Blocked' };
const PRI_LABELS = { CRITICAL: 'Critical', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };

function InlineSelect({ value, options, labels, onChange, colorClass }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`inline-select text-xs font-medium rounded px-1.5 py-0.5 border cursor-pointer ${colorClass}`}
      style={{ background: 'transparent' }}
    >
      {options.map(o => (
        <option key={o} value={o} style={{ background: '#1f2937' }}>{labels[o] || o}</option>
      ))}
    </select>
  );
}

export default function ProjectDetail() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filters, setFilters] = useState({ priority: '', devStatus: '', testStatus: '', overdue: '', search: '' });

  // Project Edit state
  const [editProjectModal, setEditProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '', status: '', deadline: '' });
  const [savingProject, setSavingProject] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      // First fetch project
      const projRes = await api.get(`/projects/${projectId}`);
      setProject(projRes.data);

      const params = { projectId };
      if (filters.priority) params.priority = filters.priority;
      if (filters.devStatus) params.devStatus = filters.devStatus;
      if (filters.testStatus) params.testStatus = filters.testStatus;
      if (filters.overdue) params.overdue = filters.overdue;
      if (filters.search) params.search = filters.search;
      const res = await api.get('/tasks', { params });
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleInlineUpdate = async (taskId, field, value) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { [field]: value });
      setTasks(prev => prev.map(t => t.id === taskId ? res.data : t));
    } catch (err) {
      console.error('Inline update failed:', err);
    }
  };

  const handleDelete = async id => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
      setDeleteId(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleModalSave = task => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    } else {
      setTasks(prev => [task, ...prev]);
    }
    setModalOpen(false);
    setEditingTask(null);
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    setSavingProject(true);
    try {
      const res = await api.put(`/projects/${projectId}`, projectForm);
      setProject(res.data);
      setEditProjectModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update project');
    } finally {
      setSavingProject(false);
    }
  };

  const getPrioritySelectStyle = (val) => ({
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    LOW: 'bg-green-500/20 text-green-400 border-green-500/30',
  }[val] || '');

  const getDevSelectStyle = (val) => ({
    NOT_STARTED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    IN_PROGRESS: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    IN_REVIEW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
    BLOCKED: 'bg-red-500/20 text-red-400 border-red-500/30',
  }[val] || '');

  const getTestSelectStyle = (val) => ({
    NOT_STARTED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    IN_PROGRESS: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    PASSED: 'bg-green-500/20 text-green-400 border-green-500/30',
    FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
    BLOCKED: 'bg-red-500/20 text-red-400 border-red-500/30',
  }[val] || '');

  if (!project && !loading) {
    return <div className="p-8 text-red-400">Project not found</div>;
  }

  return (
    <div className="p-4 md:p-6">
      {/* Project Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/projects')} className="text-sm text-gray-400 hover:text-white mb-4 inline-flex items-center gap-1">
          ← Back to Projects
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-3xl font-bold text-white">{project?.name || 'Loading...'}</h1>
              {project && (
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${
                  project.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                  project.status === 'ON_HOLD' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                  'bg-blue-500/10 text-blue-400 border-blue-500/30'
                }`}>
                  {project.status.replace('_', ' ')}
                </span>
              )}
              {user?.role === 'ADMIN' && project && (
                <button 
                  onClick={() => {
                    setProjectForm({
                      name: project.name,
                      description: project.description || '',
                      status: project.status,
                      deadline: project.deadline ? project.deadline.slice(0, 10) : ''
                    });
                    setEditProjectModal(true);
                  }}
                  className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-500 hover:text-violet-400"
                  title="Edit Project"
                >
                  ✏️
                </button>
              )}
            </div>
            {project?.description && <p className="text-gray-400 mt-2 max-w-2xl">{project.description}</p>}
            {project?.deadline && (
              <p className="text-sm mt-3 flex items-center gap-2">
                <span className="text-gray-500">Go-live:</span>
                <span className={new Date(project.deadline) < new Date() && project.status !== 'COMPLETED' ? 'text-red-400 font-medium' : 'text-gray-300'}>
                  {format(new Date(project.deadline), 'MMM d, yyyy')}
                </span>
              </p>
            )}
          </div>
          <button
            id="create-task-btn"
            onClick={() => { setEditingTask(null); setModalOpen(true); }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <span className="text-lg leading-none">+</span>
            <span className="hidden sm:inline">Add Task</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Project Dashboard (Task Analytics) */}
      <div className="-mx-4 md:-mx-6 mb-6 mt-[-1.5rem] bg-gray-900/30 border-y border-gray-800/50">
        <Dashboard projectId={projectId} />
      </div>

      {/* Filters */}
      <div className="card p-3 md:p-4 mb-4 flex flex-wrap gap-2 md:gap-3">
        <input
          id="search-input"
          type="text"
          placeholder="🔍 Search tasks…"
          className="input flex-1 min-w-0 md:w-52"
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        />
        <select id="filter-priority" className="input w-full sm:w-36" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{PRI_LABELS[p]}</option>)}
        </select>
        <select id="filter-devstatus" className="input w-full sm:w-40" value={filters.devStatus} onChange={e => setFilters(f => ({ ...f, devStatus: e.target.value }))}>
          <option value="">All Dev Status</option>
          {DEV_STATUSES.map(s => <option key={s} value={s}>{DEV_LABELS[s]}</option>)}
        </select>
        <select id="filter-teststatus" className="input w-full sm:w-40" value={filters.testStatus} onChange={e => setFilters(f => ({ ...f, testStatus: e.target.value }))}>
          <option value="">All Test Status</option>
          {TEST_STATUSES.map(s => <option key={s} value={s}>{TEST_LABELS[s]}</option>)}
        </select>
        <select id="filter-overdue" className="input w-full sm:w-36" value={filters.overdue} onChange={e => setFilters(f => ({ ...f, overdue: e.target.value }))}>
          <option value="">All Tasks</option>
          <option value="true">Overdue Only</option>
        </select>
        {(filters.priority || filters.devStatus || filters.testStatus || filters.overdue || filters.search) && (
          <button
            onClick={() => setFilters({ priority: '', devStatus: '', testStatus: '', overdue: '', search: '' })}
            className="btn-secondary text-sm"
          >
            Clear
          </button>
        )}
      </div>

      {/* Desktop Table */}
      <div className="card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-700">
              <tr>
                <th className="table-header">ID</th>
                <th className="table-header">Task / Group</th>
                <th className="table-header">Priority</th>
                <th className="table-header">Dev Status</th>
                <th className="table-header">Test Status</th>
                <th className="table-header">Deadline</th>
                <th className="table-header">Assigned To</th>
                <th className="table-header">Overdue</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                      Loading tasks…
                    </div>
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-500">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="font-medium">No tasks found</p>
                    <p className="text-sm mt-1">Create your first task to get started</p>
                  </td>
                </tr>
              ) : tasks.map(task => (
                <tr key={task.id} className="task-row transition-colors">
                  <td className="table-cell">
                    <span className="font-mono text-xs text-gray-500">{task.id.slice(-6).toUpperCase()}</span>
                  </td>
                  <td className="table-cell">
                    <Link to={`/tasks/${task.id}`} className="max-w-xs text-left group focus:outline-none block w-full">
                      <p className="font-medium text-gray-100 group-hover:text-violet-400 transition-colors truncate">{task.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 group-hover:text-gray-400 transition-colors">{task.group}</p>
                    </Link>
                  </td>
                  <td className="table-cell">
                    <InlineSelect value={task.priority} options={PRIORITIES} labels={PRI_LABELS} onChange={v => handleInlineUpdate(task.id, 'priority', v)} colorClass={getPrioritySelectStyle(task.priority)} />
                  </td>
                  <td className="table-cell">
                    <InlineSelect value={task.devStatus} options={DEV_STATUSES} labels={DEV_LABELS} onChange={v => handleInlineUpdate(task.id, 'devStatus', v)} colorClass={getDevSelectStyle(task.devStatus)} />
                  </td>
                  <td className="table-cell">
                    <InlineSelect value={task.testStatus} options={TEST_STATUSES} labels={TEST_LABELS} onChange={v => handleInlineUpdate(task.id, 'testStatus', v)} colorClass={getTestSelectStyle(task.testStatus)} />
                  </td>
                  <td className="table-cell">
                    <span className={`text-sm ${new Date(task.deadline) < new Date() && !task.isClosed ? 'text-red-400' : 'text-gray-300'}`}>
                      {format(new Date(task.deadline), 'MMM d, yyyy')}
                    </span>
                  </td>
                  <td className="table-cell">
                    {task.assignedUser ? (
                      <div>
                        <p className="text-sm text-gray-200">{task.assignedUser.name}</p>
                        <p className="text-xs text-gray-500">{task.assignedUser.email}</p>
                      </div>
                    ) : (
                      <span className="text-gray-600 text-sm">Unassigned</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <OverdueBadge overdueFlag={task.overdueFlag} overdueTeam={task.overdueTeam} isClosed={task.isClosed} />
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button id={`edit-btn-${task.id}`} onClick={() => { setEditingTask(task); setModalOpen(true); }} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-violet-400" title="Edit task">✏️</button>
                      {user?.role === 'ADMIN' && (
                        <button id={`delete-btn-${task.id}`} onClick={() => setDeleteId(task.id)} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-red-400" title="Delete task">🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="card p-8 text-center text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              Loading tasks…
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="card p-12 text-center text-gray-500">
            <div className="text-4xl mb-3">📭</div>
            <p className="font-medium">No tasks found</p>
            <p className="text-sm mt-1">Create your first task to get started</p>
          </div>
        ) : tasks.map(task => (
          <div key={task.id} className="card p-4">
            {/* Card header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <Link to={`/tasks/${task.id}`} className="flex-1 min-w-0">
                <p className="font-semibold text-gray-100 hover:text-violet-400 transition-colors">{task.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{task.group} · <span className="font-mono">{task.id.slice(-6).toUpperCase()}</span></p>
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => { setEditingTask(task); setModalOpen(true); }} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-violet-400">✏️</button>
                {user?.role === 'ADMIN' && (
                  <button onClick={() => setDeleteId(task.id)} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-red-400">🗑️</button>
                )}
              </div>
            </div>
            {/* Statuses row */}
            <div className="flex flex-wrap gap-2 mb-3">
              <InlineSelect value={task.priority} options={PRIORITIES} labels={PRI_LABELS} onChange={v => handleInlineUpdate(task.id, 'priority', v)} colorClass={getPrioritySelectStyle(task.priority)} />
              <InlineSelect value={task.devStatus} options={DEV_STATUSES} labels={DEV_LABELS} onChange={v => handleInlineUpdate(task.id, 'devStatus', v)} colorClass={getDevSelectStyle(task.devStatus)} />
              <InlineSelect value={task.testStatus} options={TEST_STATUSES} labels={TEST_LABELS} onChange={v => handleInlineUpdate(task.id, 'testStatus', v)} colorClass={getTestSelectStyle(task.testStatus)} />
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className={new Date(task.deadline) < new Date() && !task.isClosed ? 'text-red-400 font-medium' : ''}>
                📅 {format(new Date(task.deadline), 'MMM d, yyyy')}
              </span>
              <div className="flex items-center gap-2">
                {task.assignedUser && <span className="text-gray-400">👤 {task.assignedUser.name}</span>}
                <OverdueBadge overdueFlag={task.overdueFlag} overdueTeam={task.overdueTeam} isClosed={task.isClosed} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Task Modal */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          projectId={projectId}
          onClose={() => { setModalOpen(false); setEditingTask(null); }}
          onSave={handleModalSave}
        />
      )}

      {/* Delete Confirm Dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Task?</h3>
            <p className="text-gray-400 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
              <button id="confirm-delete-btn" onClick={() => handleDelete(deleteId)} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/50 rounded-t-xl">
              <h2 className="font-bold text-lg text-white">Edit Project</h2>
              <button onClick={() => setEditProjectModal(false)} className="text-gray-500 hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleEditProject} className="p-5 space-y-4">
              <div>
                <label className="label">Project Name *</label>
                <input required type="text" value={projectForm.name} onChange={e => setProjectForm(p => ({...p, name: e.target.value}))} className="input" placeholder="e.g. Website Overhaul" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea rows="3" value={projectForm.description} onChange={e => setProjectForm(p => ({...p, description: e.target.value}))} className="input custom-scrollbar resize-none" placeholder="Brief project overview..."></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Status</label>
                  <select value={projectForm.status} onChange={e => setProjectForm(p => ({...p, status: e.target.value}))} className="input">
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="label">Go-live Date</label>
                  <input type="date" value={projectForm.deadline} onChange={e => setProjectForm(p => ({...p, deadline: e.target.value}))} className="input" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setEditProjectModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={savingProject} className="btn-primary">{savingProject ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
