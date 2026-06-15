import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui';
import {
  LayoutDashboard,
  GitBranch,
  CalendarDays,
  BookOpen,
  FileText,
  GraduationCap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X
} from '../components/ui/Icons';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentDateStr, setCurrentDateStr] = useState('');

  // Generate Date string: "13 JUN 2026"
  useEffect(() => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    setCurrentDateStr(`${day} ${month} ${year}`);
  }, []);

  // Determine breadcrumb label from route
  // Determine breadcrumb label from route
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/dashboard') return isAdmin ? 'System Overview' : 'My Classroom';
    if (path === '/dashboard/branches') return 'Branches Registry';
    if (path === '/dashboard/semesters') return 'Semesters Registry';
    if (path === '/dashboard/subjects') return 'Subjects Matrix';
    if (path === '/dashboard/papers') return 'Papers Archive';
    return 'Dashboard';
  };

  // Nav items configuration based on user roles
  const navItems = isAdmin
    ? [
        { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
        { icon: GitBranch, label: 'Branches', path: '/dashboard/branches' },
        { icon: CalendarDays, label: 'Semesters', path: '/dashboard/semesters' },
        { icon: BookOpen, label: 'Subjects', path: '/dashboard/subjects' },
        { icon: FileText, label: 'Papers', path: '/dashboard/papers' },
      ]
    : [
        { icon: GraduationCap, label: 'Classroom', path: '/dashboard' },
      ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#faf6ef] text-[#1a1a1a] font-ui flex selection:bg-[#8026d3]/10 selection:text-[#8026d3]">
      {/* Subtle Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.012] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9Ii4xIi8+Cjwvc3ZnPg==')] bg-repeat" />

      {/* ─── Mobile Sidebar Overlay Backdrop ─── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-[3px] z-39 lg:hidden"
        />
      )}

      {/* ─── Sidebar Panel (Desktop + Mobile overlay drawer) ─── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 bg-[#ffffff] border-r border-[#cfc2d6]/35 z-40 flex flex-col transition-all duration-[220ms] ease-out lg:translate-x-0 ${
          collapsed ? 'w-[60px]' : 'w-[232px]'
        } ${mobileOpen ? 'translate-x-0 w-[260px]' : 'translate-x-[-100%] lg:translate-x-0'}`}
      >
        {/* Header brand mark */}
        <div className="h-[60px] px-4 border-b border-[#cfc2d6]/30 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Square Logo mark */}
            <div className="w-8 h-8 shrink-0 bg-[rgba(128,38,211,0.08)] border border-[rgba(128,38,211,0.18)] rounded-lg flex items-center justify-center">
              <span className="font-display text-[13px] font-semibold text-[#8026d3] leading-none">
                GB
              </span>
            </div>
            {/* App label details */}
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col whitespace-nowrap overflow-hidden">
                <span className="text-[14px] font-semibold text-[#1a1a1a] tracking-tight leading-tight">
                  GTU Exam Buddy
                </span>
                <span className="text-[9px] text-[#8026d3]/80 tracking-[0.12em] uppercase font-mono mt-[1px]">
                  Academic Intelligence
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-[#76746f] hover:text-[#ff4d4d] p-1"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto py-4 px-2.5 flex flex-col gap-1">
          {(!collapsed || mobileOpen) && (
            <p className="text-[9px] font-semibold text-[#76746f] tracking-[0.12em] uppercase px-2 py-2 mb-1">
              {isAdmin ? 'MANAGE' : 'PORTAL'}
            </p>
          )}

          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={idx}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`h-[38px] px-2.5 rounded-lg flex items-center gap-2.5 cursor-pointer select-none group relative overflow-hidden transition-all duration-[120ms] ${
                  isActive
                    ? 'bg-[rgba(128,38,211,0.08)] text-[#8026d3]'
                    : 'text-[#4c4354] hover:bg-[rgba(128,38,211,0.04)] hover:text-[#8026d3]'
                }`}
              >
                {/* Active marker line */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#8026d3]" />
                )}

                <Icon
                  size={17}
                  className={`transition-colors duration-[120ms] shrink-0 ${
                    isActive ? 'text-[#8026d3]' : 'text-[#76746f] group-hover:text-[#8026d3]'
                  }`}
                />

                {(!collapsed || mobileOpen) && (
                  <span className={`text-[13.5px] font-medium leading-none ${isActive ? 'font-bold' : ''}`}>
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse sidebar toggler (desktop only) */}
        <div className="hidden lg:flex justify-center items-center py-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 rounded-md bg-[rgba(128,38,211,0.04)] hover:bg-[rgba(128,38,211,0.08)] text-[#76746f] hover:text-[#8026d3] flex items-center justify-center transition-colors duration-150"
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* User section details */}
        <div className="p-2.5 border-t border-[#cfc2d6]/30 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2.5 py-2 px-1.5 rounded-lg">
            <div className="flex items-center gap-2.5 overflow-hidden">
              {/* Profile letter avatar */}
              <div className="w-[30px] h-[30px] rounded-full bg-[rgba(128,38,211,0.08)] border border-[rgba(128,38,211,0.18)] flex items-center justify-center shrink-0">
                <span className="font-display text-[13px] font-semibold text-[#8026d3]">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              {(!collapsed || mobileOpen) && (
                <div className="flex flex-col overflow-hidden text-left">
                  <span className="text-[13px] font-semibold text-[#1a1a1a] truncate max-w-[110px]">
                    {user?.name || 'Academic'}
                  </span>
                  <span className="text-[11px] text-[#76746f] capitalize font-medium">
                    {user?.role || 'student'}
                  </span>
                </div>
              )}
            </div>

            {/* Logout button */}
            {(!collapsed || mobileOpen) && (
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="text-[#76746f] hover:text-[#ff4d4d] p-1.5 transition-colors duration-[120ms] rounded-md hover:bg-[rgba(255,77,77,0.06)]"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>

          {/* Show centered logout button when collapsed */}
          {collapsed && !mobileOpen && (
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="text-[#76746f] hover:text-[#ff4d4d] p-2 flex items-center justify-center transition-colors duration-[120ms] rounded-md hover:bg-[rgba(255,77,77,0.06)]"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </aside>

      {/* ─── Main Workspace Content scrolling space ─── */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-[220ms] ease-out ml-0 ${
          collapsed ? 'lg:ml-[60px]' : 'lg:ml-[232px]'
        }`}
      >
        {/* Sticky blur header bar */}
        <header className="h-[56px] sticky top-0 bg-[#faf6ef]/90 backdrop-blur-[16px] border-b border-[#cfc2d6]/35 px-6 lg:px-10 flex items-center justify-between z-30">
          <div className="flex items-center gap-4">
            {/* Hamburger button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-[#76746f] hover:text-[#1a1a1a] p-1 -ml-1 transition-colors duration-150"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb label */}
            <span className="text-[14px] font-semibold text-[#76746f] hidden sm:inline">
              {getBreadcrumb()}
            </span>
          </div>

          {/* Right meta tags */}
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-mono text-[#76746f] tracking-wider font-semibold">
              {currentDateStr}
            </span>
            <div className="w-1 h-1 rounded-full bg-[#cfc2d6]" />
            <Badge variant="gold" size="sm">
              {user?.role || 'student'}
            </Badge>
          </div>
        </header>

        {/* Content viewport wrapper */}
        <main className="flex-1 px-6 lg:px-10 py-8 max-w-[1360px] w-full mx-auto">
          <Outlet />
        </main>

        {/* Editorial footer block */}
        <footer className="h-14 border-t border-[#cfc2d6]/25 px-6 lg:px-10 flex items-center justify-between bg-[#ffffff]/30">
          <p className="text-[9px] font-mono text-[#76746f] tracking-[0.2em] uppercase font-semibold">
            GTU EXAM BUDDY — ACADEMIC SYSTEM CONSOLE
          </p>
        </footer>
      </div>
    </div>
  );
}
