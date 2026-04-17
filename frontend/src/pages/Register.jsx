import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import api from '../api/axios';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  React.useEffect(() => {
    api.get('/auth/registration-status')
      .then(res => setIsOpen(res.data.isOpen))
      .catch(console.error)
      .finally(() => setFetchingStatus(false));
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await register(form.name, form.email, form.password);
      if (res?.pendingApproval) {
        setIsPendingApproval(true);
      } else {
        navigate('/projects');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600 rounded-2xl mb-4 shadow-lg shadow-violet-500/30">
            <span className="text-white font-bold text-xl">PF</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Get started</h1>
          <p className="text-gray-400 mt-2">Create your TBprojects account</p>
        </div>

        <div className="card p-8">
          {fetchingStatus ? (
             <div className="flex justify-center p-4">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
             </div>
          ) : isPendingApproval ? (
             <div className="text-center py-4">
               <div className="text-4xl mb-4">⏳</div>
               <h3 className="text-xl font-bold text-white mb-2">Account Pending</h3>
               <p className="text-gray-400 text-sm">
                 Your account has been created successfully, but it requires administrator approval before you can log in.
               </p>
               <Link to="/login" className="btn-primary inline-flex mt-6 px-6">Return to login</Link>
             </div>
          ) : !isOpen ? (
             <div className="text-center py-4">
               <div className="text-4xl mb-4">🔒</div>
               <h3 className="text-xl font-bold text-white mb-2">Registration Disabled</h3>
               <p className="text-gray-400 text-sm">
                 Public sign-ups are currently disabled for this platform. Please contact an administrator to create an account for you.
               </p>
               <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium inline-flex mt-6">← Back to login</Link>
             </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label">Full name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    minLength={2}
                    className="input"
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Email address</label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    className="input"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    minLength={6}
                    className="input"
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  />
                </div>
                <button
                  type="submit"
                  id="register-btn"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating account…
                    </span>
                  ) : 'Create account'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
