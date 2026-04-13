import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', deadline: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/projects', form);
      setShowModal(false);
      setForm({ name: '', description: '', deadline: '' });
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Projects</h1>
          <p className="text-gray-400 text-sm">Manage your application lifecycles and tasks</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm shrink-0">
            + New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            Loading projects…
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-16 text-center text-gray-500 flex flex-col items-center">
          <div className="text-5xl mb-4">📁</div>
          <h3 className="text-xl font-bold text-white mb-2">No Projects Yet</h3>
          <p className="text-sm max-w-sm mb-6">Create your first project to start organizing tasks and tracking progress.</p>
          {user?.role === 'ADMIN' && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} className="card p-6 block hover:border-violet-500/50 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white group-hover:text-violet-400 transition-colors line-clamp-1">{p.name}</h3>
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${
                  p.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                  p.status === 'ON_HOLD' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                  'bg-blue-500/10 text-blue-400 border-blue-500/30'
                }`}>
                  {p.status.replace('_', ' ')}
                </span>
              </div>
              
              <p className="text-sm text-gray-400 line-clamp-2 h-10 mb-6">
                {p.description || 'No description provided'}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                  <p className="text-xs text-gray-500 mb-1 leading-none">Total Tasks</p>
                  <p className="text-xl font-medium text-white leading-none">{p._count.tasks}</p>
                </div>
                <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/10">
                  <p className="text-xs text-red-500/70 mb-1 leading-none">Overdue tasks</p>
                  <p className="text-xl font-medium text-red-400 leading-none">{p.overdueCount}</p>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4 flex flex-wrap gap-y-2 justify-between items-center text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">Created by:</span> {p.createdBy.name}
                </div>
                {p.deadline && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Go-live:</span>
                    <span className={new Date(p.deadline) < new Date() && p.status !== 'COMPLETED' ? 'text-red-400 font-medium' : 'text-gray-300'}>
                      {format(new Date(p.deadline), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/50 rounded-t-xl">
              <h2 className="font-bold text-lg text-white">Create New Project</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="label">Project Name *</label>
                <input required type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="input" placeholder="e.g. Website Overhaul" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea rows="3" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className="input custom-scrollbar resize-none" placeholder="Brief project overview..."></textarea>
              </div>
              <div>
                <label className="label">Expected Go-live Date</label>
                <input type="date" value={form.deadline} onChange={e => setForm(p => ({...p, deadline: e.target.value}))} className="input" />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Creating...' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
