import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Notification } from '../types';
import {
  Sparkles, Bell, User, LogOut, Menu, X, BookOpen,
  Code, Shield, CheckCircle, GraduationCap
} from 'lucide-react';

export const Navbar: React.FC<{ onMenuToggle?: () => void }> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const fetchNotifs = () => {
    if (user) {
      api.getNotifications()
        .then(setNotifications)
        .catch(() => {});
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 20000); // 20 soniyada yangilab turadi
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('eduai_token');
      await fetch('/api/v1/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleNotificationClick = async (n: Notification) => {
    await handleMarkRead(n.id);
    if (n.link) {
      if (n.link.startsWith('#')) {
        window.location.hash = n.link;
      } else {
        navigate(n.link);
      }
      setShowNotifs(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'student': return <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">O'quvchi</span>;
      case 'teacher': return <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">O'qituvchi</span>;
      case 'school_admin': return <span className="bg-purple-100 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">Maktab Admini</span>;
      case 'school_coordinator': return <span className="bg-purple-100 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">Maktab Admini</span>;
      case 'district_coordinator': return <span className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">Hududiy Admin</span>;
      case 'admin': return <span className="bg-red-100 text-red-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">Bosh Admin</span>;
      default: return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo & Mobile Menu Button */}
          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={onMenuToggle}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
                aria-label="Menyu"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl text-slate-900 tracking-tight leading-none">
                  Edu<span className="text-blue-700">AI</span>
                </span>
                <span className="text-[10px] text-violet-600 font-bold uppercase tracking-widest mt-0.5">
                  + IT Yoshlar
                </span>
              </div>
            </Link>
          </div>

          {/* O'rtadagi umumiy havolalar */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="/#how-it-works" className="text-sm font-medium text-slate-600 hover:text-blue-700 transition">
              Imkoniyatlar
            </a>
            <Link to="/about" className="text-sm font-medium text-slate-600 hover:text-blue-700 transition">
              Biz haqimizda
            </Link>
            <Link to="/projects-showcase" className="text-sm font-medium text-slate-600 hover:text-blue-700 transition flex items-center gap-1.5">
              <Code className="w-4 h-4 text-violet-600" />
              IT Yoshlar Ko'rgazmasi
            </Link>
            <a href="/#contact" className="text-sm font-medium text-slate-600 hover:text-blue-700 transition">
              Murojaat uchun
            </a>
          </nav>

          {/* O'ng tomon: Login/Register yoki User Controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Bildirishnomalar */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 relative transition"
                    aria-label="Xabarnomalar"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Bildirishnomalar oynasi */}
                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50">
                      <div className="px-4 pb-2 border-b border-slate-100 flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-800">Xabarnomalar ({notifications.length})</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold"
                          >
                            Barchasi o'qildi
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">
                            Yangi xabarnomalar yo'q
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition ${!n.is_read ? 'bg-blue-50/70 border-l-2 border-blue-600' : ''}`}
                            >
                              <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                                <span>{n.title}</span>
                                {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                              </div>
                              <div className="text-xs text-slate-600 mt-0.5">{n.message}</div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {new Date(n.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Foydalanuvchi ma'lumoti */}
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900">{user.full_name}</span>
                  <div className="mt-0.5">{getRoleBadge(user.role)}</div>
                </div>

                {/* Chiqish tugmasi */}
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                  title="Chiqish"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-700 transition"
                >
                  Kirish
                </Link>
                <Link
                  to="/request-account"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
                >
                  <span>Ariza yuborish</span>
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
