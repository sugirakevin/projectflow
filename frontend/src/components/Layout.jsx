import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBrand } from '../contexts/BrandContext';
import Notifications from './Notifications';

function NavItem({ to, icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const hasBrandingAccess = user?.role === 'ADMIN' || user?.canEditBranding;
  const closeSidebar = () => setSidebarOpen(false);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'color-mix(in srgb, var(--brand-text-color) 15%, transparent)' }}>
        <div className="flex items-center gap-3">
          {brand?.logoUrl ? (
            <img src={brand.logoUrl} alt="Logo" className="max-h-8 max-w-full object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border border-transparent" style={{ backgroundColor: 'var(--brand-text-color)', color: 'var(--brand-color)' }}>TB</div>
          )}
          {!brand?.logoUrl && <span className="font-bold text-lg tracking-tight truncate">TBprojects</span>}
        </div>
        {/* Close button – mobile only */}
        <button
          className="md:hidden p-1 rounded-lg opacity-70 hover:opacity-100"
          onClick={closeSidebar}
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        <NavItem to="/tasks" icon="📋" label="Task Board" onClick={closeSidebar} />
        <NavItem to="/dashboard" icon="📊" label="Dashboard" onClick={closeSidebar} />
        {user?.role === 'ADMIN' && (
          <NavItem to="/admin" icon="🎛️" label="Admin Panel" onClick={closeSidebar} />
        )}
        {hasBrandingAccess && (
          <NavItem to="/brand-settings" icon="✨" label="Brand Settings" onClick={closeSidebar} />
        )}
      </nav>

      {/* User Footer */}
      <div className="px-4 py-4 border-t" style={{ borderColor: 'color-mix(in srgb, var(--brand-text-color) 15%, transparent)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
               style={{ backgroundColor: 'color-mix(in srgb, var(--brand-text-color) 20%, transparent)' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs opacity-70 truncate">{user?.email}</p>
          </div>
          <span style={{ backgroundColor: 'color-mix(in srgb, var(--brand-text-color) 10%, transparent)' }} className="rounded-full inline-flex text-inherit">
            <Notifications placement="bottom" />
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
    </>
  );

  return (
    <div className="min-h-screen flex text-gray-100 relative bg-gray-950/90 backdrop-blur-sm">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* ── Sidebar – desktop: always visible | mobile: slide-in ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 flex flex-col shadow-2xl transition-transform duration-300
          md:static md:translate-x-0 md:flex-shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          backgroundColor: 'var(--brand-color)',
          color: 'var(--brand-text-color)',
          borderRight: '1px solid color-mix(in srgb, var(--brand-text-color) 15%, transparent)'
        }}
      >
        {sidebarContent}
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header
          className="md:hidden flex items-center gap-3 px-4 py-3 border-b shadow-sm"
          style={{
            backgroundColor: 'var(--brand-color)',
            color: 'var(--brand-text-color)',
            borderColor: 'color-mix(in srgb, var(--brand-text-color) 15%, transparent)'
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg opacity-80 hover:opacity-100 hover:bg-black/10 transition-colors"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="flex items-center gap-2 flex-1">
            {brand?.logoUrl ? (
              <img src={brand.logoUrl} alt="Logo" className="max-h-7 object-contain" />
            ) : (
              <span className="font-bold text-base tracking-tight">TBprojects</span>
            )}
          </div>
          <Notifications />
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
