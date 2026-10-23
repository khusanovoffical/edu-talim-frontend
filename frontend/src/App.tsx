import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Sahifalar
import { HomePage } from './pages/HomePage';
import { AboutPage, PrivacyPage, TermsPage } from './pages/StaticPages';
import { ProjectsShowcasePage } from './pages/ProjectsShowcasePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { RequestAccountPage } from './pages/RequestAccountPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { AiTutorPage } from './pages/AiTutorPage';
import { MathPage } from './pages/MathPage';
import { EnglishPage } from './pages/EnglishPage';
import { QuizzesPage } from './pages/QuizzesPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { MyProjectsPage } from './pages/MyProjectsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { ContentReviewPage } from './pages/ContentReviewPage';
import { TeacherSubmissionsPage } from './pages/TeacherSubmissionsPage';
import { TeacherAssignmentBuilderPage } from './pages/TeacherAssignmentBuilderPage';
import { SchoolAdminDashboard } from './pages/SchoolAdminDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

// Himoyalangan Layout
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="lg:pl-64 pt-4 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-all">
        {children}
      </main>
    </div>
  );
};

// Ochiq Layout (Navbar bilan)
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <main className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Ochiq yo'nalishlar */}
          <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
          <Route path="/privacy" element={<PublicLayout><PrivacyPage /></PublicLayout>} />
          <Route path="/terms" element={<PublicLayout><TermsPage /></PublicLayout>} />
          <Route path="/projects-showcase" element={<PublicLayout><ProjectsShowcasePage /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
          <Route path="/request-account" element={<PublicLayout><RequestAccountPage /></PublicLayout>} />
          <Route path="/register" element={<Navigate to="/request-account" replace />} />

          {/* O'quvchi va umumiy himoyalangan yo'nalishlar */}
          <Route path="/dashboard" element={<AppLayout><StudentDashboard /></AppLayout>} />
          <Route path="/ai-tutor" element={<AppLayout><AiTutorPage /></AppLayout>} />
          <Route path="/math" element={<AppLayout><MathPage /></AppLayout>} />
          <Route path="/english" element={<AppLayout><EnglishPage /></AppLayout>} />
          <Route path="/quizzes" element={<AppLayout><QuizzesPage /></AppLayout>} />
          <Route path="/assignments" element={<AppLayout><AssignmentsPage /></AppLayout>} />
          <Route path="/my-projects" element={<AppLayout><MyProjectsPage /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />

          {/* O'qituvchi yo'nalishlari */}
          <Route path="/teacher" element={<AppLayout><TeacherDashboard /></AppLayout>} />
          <Route path="/classes" element={<AppLayout><TeacherDashboard /></AppLayout>} />
          <Route path="/teacher/assignments" element={<AppLayout><TeacherAssignmentBuilderPage /></AppLayout>} />
          <Route path="/teacher/content-review" element={<AppLayout><ContentReviewPage /></AppLayout>} />
          <Route path="/teacher/submissions" element={<AppLayout><TeacherSubmissionsPage /></AppLayout>} />

          {/* Maktab Admini (Zam Direktor) yo'nalishlari */}
          <Route path="/school-admin" element={<AppLayout><SchoolAdminDashboard /></AppLayout>} />
          <Route path="/coordinator" element={<Navigate to="/school-admin" replace />} />
          <Route path="/coordinator/projects" element={<Navigate to="/school-admin" replace />} />

          {/* Bosh Administrator yo'nalishlari */}
          <Route path="/admin" element={<AppLayout><AdminDashboard /></AppLayout>} />
          <Route path="/admin/users" element={<AppLayout><AdminDashboard /></AppLayout>} />
          <Route path="/admin/audit" element={<AppLayout><AdminDashboard /></AppLayout>} />
          <Route path="/admin/ai-status" element={<AppLayout><AdminDashboard /></AppLayout>} />
          <Route path="/schools" element={<AppLayout><AdminDashboard /></AppLayout>} />

          {/* Noma'lum yo'nalishlar */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};
