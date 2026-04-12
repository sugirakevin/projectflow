import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('USERS');
  
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'USER', canEditBranding: false });
  const [submittingUser, setSubmittingUser] = useState(false);

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamForm, setTeamForm] = useState({ name: '', userIds: [] });
  const [submittingTeam, setSubmittingTeam] = useState(false);

  const fetchData = async () => {
    try {
      const [uRes, tRes] = await Promise.all([
        axios.get('/admin/users'),
        axios.get('/teams')
      ]);
      setUsers(uRes.data);
      setTeams(tRes.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchData();
    } else {
      setLoading(false);
      setError('You do not have permission to view this page.');
    }
  }, [user]);

  // --- USER HANDLERS ---
  const handleDeleteUser = async (id) => {
    if (id === user.id) return alert("You cannot delete yourself.");
    if (!window.confirm('Are you certain you want to delete this user?')) return;
    try {
      await axios.delete(`/admin/users/${id}`);
      fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Failed to delete user'); }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setSubmittingUser(true);
    try {
      const payload = { ...userForm };
      if (editingUser && !payload.password) delete payload.password;
      if (editingUser) {
        await axios.put(`/admin/users/${editingUser.id}`, payload);
      } else {
        await axios.post('/admin/users', payload);
      }
      setShowUserModal(false);
      fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Failed to save user'); }
    finally { setSubmittingUser(false); }
  };

  // --- TEAM HANDLERS ---
  const handleDeleteTeam = async (id) => {
    if (!window.confirm('Delete this team?')) return;
    try {
      await axios.delete(`/teams/${id}`);
      fetchData();
    } catch (err) { alert('Failed to delete team'); }
  };

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    setSubmittingTeam(true);
    try {
      if (editingTeam) {
        if (editingTeam.name !== teamForm.name) {
          // Just ignore name change for now if unsupported, or just update users
        }
        await axios.put(`/teams/${editingTeam.id}/users`, { userIds: teamForm.userIds });
      } else {
        const res = await axios.post('/teams', { name: teamForm.name });
        if (teamForm.userIds.length > 0) {
          await axios.put(`/teams/${res.data.id}/users`, { userIds: teamForm.userIds });
        }
      }
      setShowTeamModal(false);
      fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Failed to save team'); }
    finally { setSubmittingTeam(false); }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading admin panel...</div>;
  if (error) return <div className="p-8 text-red-500 font-bold">{error}</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-4">Admin Panel</h1>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('USERS')}
              className={`pb-2 px-1 border-b-2 font-medium transition-colors ${activeTab === 'USERS' ? 'border-violet-500 text-violet-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
              System Users ({users.length})
            </button>
            <button 
              onClick={() => setActiveTab('TEAMS')}
              className={`pb-2 px-1 border-b-2 font-medium transition-colors ${activeTab === 'TEAMS' ? 'border-violet-500 text-violet-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
              Group Directory ({teams.length})
            </button>
          </div>
        </div>
        
        {activeTab === 'USERS' ? (
          <button onClick={() => { setEditingUser(null); setUserForm({ name: '', email: '', password: '', role: 'USER', canEditBranding: false }); setShowUserModal(true); }} className="btn-primary text-sm">
            + New User
          </button>
        ) : (
          <button onClick={() => { setEditingTeam(null); setTeamForm({ name: '', userIds: [] }); setShowTeamModal(true); }} className="btn-primary text-sm">
            + Create Group
          </button>
        )}
      </div>

      {activeTab === 'USERS' && (
        <div className="card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-800">
                <th className="p-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Brand Auth</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-gray-200">{u.name} {u.id === user.id && <span className="ml-2 text-[10px] bg-violet-600/30 text-violet-400 px-1.5 py-0.5 rounded">YOU</span>}</div>
                    <div className="text-sm text-gray-500">{u.email}</div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase rounded border ${u.role === 'ADMIN' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.role === 'ADMIN' ? (
                       <span className="text-xs text-gray-500 italic">Global</span>
                    ) : u.canEditBranding ? (
                       <span className="text-xs text-brand font-medium">Granted</span>
                    ) : (
                       <span className="text-xs text-gray-600">Locked</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-400">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                  <td className="p-4 text-right space-x-3">
                    <button onClick={() => { setEditingUser(u); setUserForm({ name: u.name, email: u.email, password: '', role: u.role, canEditBranding: u.canEditBranding || false }); setShowUserModal(true); }} className="text-sm font-medium text-brand">Edit</button>
                    <button onClick={() => handleDeleteUser(u.id)} disabled={u.id === user.id} className="text-sm font-medium text-red-400 disabled:opacity-30">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'TEAMS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(t => (
            <div key={t.id} className="card p-5 relative group border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button onClick={() => { setEditingTeam(t); setTeamForm({ name: t.name, userIds: t.users.map(u => u.id) }); setShowTeamModal(true); }} className="text-xs text-violet-400">Manage</button>
                <button onClick={() => handleDeleteTeam(t.id)} className="text-xs text-red-400">Delete</button>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{t.name}</h3>
              <p className="text-xs text-gray-500 mb-4">{t.users.length} member{t.users.length !== 1 ? 's' : ''}</p>
              
              <div className="space-y-2">
                {t.users.length > 0 ? t.users.map(u => (
                  <div key={u.id} className="flex items-center gap-3 text-sm bg-gray-900/50 p-2 rounded-lg">
                    <div className="flex-1 truncate">
                      <p className="text-gray-300 font-medium truncate">{u.name}</p>
                      <p className="text-gray-500 text-xs truncate">{u.email}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-600 text-sm italic">No users in group</p>
                )}
              </div>
            </div>
          ))}
          {teams.length === 0 && <p className="text-gray-500">No groups created yet.</p>}
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-800 flex justify-between">
              <h2 className="font-bold text-white">{editingUser ? 'Edit User' : 'New User'}</h2>
              <button onClick={() => setShowUserModal(false)} className="text-gray-500">✕</button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-4 space-y-4">
              <input required type="text" placeholder="Name" value={userForm.name} onChange={e => setUserForm(p => ({...p, name: e.target.value}))} className="input" />
              <input required type="email" placeholder="Email" value={userForm.email} onChange={e => setUserForm(p => ({...p, email: e.target.value}))} className="input" />
              <input type="password" required={!editingUser} placeholder={editingUser ? "Leave blank to keep current" : "Password"} value={userForm.password} onChange={e => setUserForm(p => ({...p, password: e.target.value}))} className="input" />
              <select value={userForm.role} onChange={e => setUserForm(p => ({...p, role: e.target.value}))} className="input">
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
              {userForm.role === 'USER' && (
                <label className="flex items-start gap-3 p-3 bg-gray-950 border border-gray-800 rounded-lg cursor-pointer hover:bg-gray-900 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={userForm.canEditBranding}
                    onChange={e => setUserForm(p => ({...p, canEditBranding: e.target.checked}))}
                    className="mt-1 rounded border-gray-700 bg-gray-900 text-brand focus:ring-brand/20 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-200">Grant Branding Authority</p>
                    <p className="text-xs text-gray-500">Allow user to edit company colors and logo.</p>
                  </div>
                </label>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowUserModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submittingUser} className="btn-primary">{submittingUser ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-gray-800 flex justify-between shrink-0">
              <h2 className="font-bold text-white">{editingTeam ? `Manage Group: ${editingTeam.name}` : 'Create Group'}</h2>
              <button onClick={() => setShowTeamModal(false)} className="text-gray-500">✕</button>
            </div>
            <form onSubmit={handleTeamSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
                {!editingTeam && (
                  <div>
                    <label className="label">Group Name *</label>
                    <input required type="text" placeholder="e.g. Frontend Team" value={teamForm.name} onChange={e => setTeamForm(p => ({...p, name: e.target.value}))} className="input" />
                  </div>
                )}
                
                <div>
                  <label className="label">Assign Members</label>
                  <p className="text-xs text-gray-500 mb-3">Select users who belong to this group.</p>
                  <div className="space-y-2 border border-gray-800 rounded-lg p-2 bg-gray-950/50 max-h-60 overflow-y-auto custom-scrollbar">
                    {users.map(u => {
                      const isSelected = teamForm.userIds.includes(u.id);
                      return (
                        <label key={u.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-800/50 cursor-pointer transition-colors">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => {
                              setTeamForm(prev => ({
                                ...prev,
                                userIds: isSelected ? prev.userIds.filter(id => id !== u.id) : [...prev.userIds, u.id]
                              }));
                            }}
                            className="rounded border-gray-700 bg-gray-900 text-violet-500 focus:ring-violet-500/20"
                          />
                          <div className="flex-1 truncate">
                            <p className="text-sm font-medium text-gray-200">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-800 flex justify-end gap-2 shrink-0">
                <button type="button" onClick={() => setShowTeamModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submittingTeam} className="btn-primary">{submittingTeam ? 'Saving...' : 'Save Group'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
