import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBrand } from '../contexts/BrandContext';
import Notifications from './Notifications';

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'shadow border'
            : 'border border-transparent opacity-70 hover:opacity-100 hover:bg-black/5'
        }`
      }
      style={({ isActive }) => isActive ? {
        backgroundColor: 'color-mix(in srgb, var(--brand-text-color) 15%, transparent)',
        borderColor: 'color-mix(in srgb, var(--brand-text-color) 25%, transparent)'
      } : {}}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { brand } = useBrand();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const hasBrandingAccess = user?.role === 'ADMIN' || user?.canEditBranding;

  return (
    <div className="min-h-screen flex text-gray-100 relative bg-gray-950/90 backdrop-blur-sm">
      {/* Sidebar */}
      <aside 
        className="w-64 flex-shrink-0 border-r flex flex-col z-10 shadow-2xl transition-colors duration-300"
        style={{ 
          backgroundColor: 'var(--brand-color)', 
          color: 'var(--brand-text-color)', 
          borderColor: 'color-mix(in srgb, var(--brand-text-color) 15%, transparent)' 
        }}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b" style={{ borderColor: 'color-mix(in srgb, var(--brand-text-color) 15%, transparent)' }}>
          <div className="flex items-center gap-3">
            {brand?.logoUrl ? (
              <img src={brand.logoUrl} alt="Logo" className="max-h-8 max-w-full object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border border-transparent" style={{ backgroundColor: 'var(--brand-text-color)', color: 'var(--brand-color)' }}>PF</div>
            )}
            {!brand?.logoUrl && <span className="font-bold text-lg tracking-tight truncate">TBprojects</span>}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          <NavItem to="/tasks" icon="📋" label="Task Board" />
          <NavItem to="/dashboard" icon="📊" label="Dashboard" />
          {user?.role === 'ADMIN' && (
            <NavItem to="/admin" icon="🎛️" label="Admin Panel" />
          )}
          {hasBrandingAccess && (
            <NavItem to="/brand-settings" icon="✨" label="Brand Settings" />
          )}
        </nav>

        {/* User Footer */}
        <div className="px-4 py-4 border-t" style={{ borderColor: 'color-mix(in srgb, var(--brand-text-color) 15%, transparent)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
                 style={{ 
                   backgroundColor: 'color-mix(in srgb, var(--brand-text-color) 20%, transparent)',
                 }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs opacity-70 truncate">{user?.email}</p>
            </div>
            <span style={{ backgroundColor: 'color-mix(in srgb, var(--brand-text-color) 10%, transparent)' }} className="rounded-full inline-flex text-inherit">
              <Notifications />
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-sm py-1.5 px-3 rounded-lg transition-all duration-200 text-left opacity-70 hover:opacity-100 hover:bg-black/5"
            style={{ color: 'inherit' }}
          >
            Sign out →
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
