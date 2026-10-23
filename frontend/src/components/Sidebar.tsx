import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Bot, Calculator, Globe, HelpCircle,
  FileText, Code, Settings, Users, CheckSquare, BarChart3,
  ShieldAlert, BookOpen, School, X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  // Har bir rol uchun mos navigatsiya havolalari
  const studentLinks = [
    { to: '/dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
    { to: '/ai-tutor', label: 'EduAI Repetitori', icon: Bot, badge: 'AI' },
    { to: '/math', label: 'Matematika', icon: Calculator },
    { to: '/english', label: 'Ingliz tili', icon: Globe },
    { to: '/quizzes', label: 'Mashqlar & Testlar', icon: HelpCircle },
    { to: '/assignments', label: 'Topshiriqlarim', icon: FileText },
    { to: '/my-projects', label: 'IT Yoshlar Loyihalarim', icon: Code },
    { to: '/settings', label: 'Sozlamalar', icon: Settings },
  ];

  const teacherLinks = [
    { to: '/teacher', label: 'Ustoz Paneli', icon: LayoutDashboard },
    { to: '/classes', label: 'Biriktirilgan Sinflar', icon: Users },
    { to: '/teacher/assignments', label: 'Topshiriq Yaratish', icon: FileText },
    { to: '/teacher/content-review', label: 'Kontent Tasdiqlash', icon: CheckSquare, badge: 'Review' },
    { to: '/teacher/submissions', label: 'Tekshirish & Baholar', icon: BarChart3 },
    { to: '/ai-tutor', label: 'AI Dars Yordamchisi', icon: Bot },
  ];

  const schoolAdminLinks = [
    { to: '/school-admin', label: 'Maktab Admini Paneli', icon: LayoutDashboard },
    { to: '/school-admin', label: 'O\'quvchilar & Ustozlar', icon: Users },
    { to: '/projects-showcase', label: 'IT Yoshlar Ko\'rgazmasi', icon: Code },
    { to: '/about', label: 'Maktab Qoidalari', icon: School },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Bosh Admin Paneli', icon: LayoutDashboard },
    { to: '/admin', label: 'Foydalanuvchilar', icon: Users },
    { to: '/admin', label: 'Xavfsizlik Jurnali', icon: ShieldAlert },
    { to: '/admin', label: 'SI Provayder Holati', icon: Bot },
    { to: '/schools', label: 'Maktablar & Tumanlar', icon: School },
  ];

  let links = studentLinks;
  if (role === 'teacher') links = teacherLinks;
  else if (role === 'school_admin' || (role as string) === 'school_coordinator' || (role as string) === 'district_coordinator') links = schoolAdminLinks;
  else if (role === 'admin') links = adminLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between py-4 px-3 overflow-y-auto`}
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 py-2 lg:hidden">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Menyu</span>
            <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Foydalanuvchi ma'lumoti pastda */}
        <div className="pt-4 border-t border-slate-100 px-3">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-xs font-bold text-slate-800 truncate">{user.full_name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
            {user.grade && (
              <p className="text-[11px] font-semibold text-blue-600 mt-1">{user.grade}-sinf o'quvchisi</p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
