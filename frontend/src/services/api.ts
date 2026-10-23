import {
  User, AuthResponse, School, ClassRoom, Subject, Lesson,
  Exercise, ExerciseCheckResult, Assignment, Submission,
  AIResponse, AIConversation, Project, Notification, DashboardStats,
  ExplanationStyle, UserRole
} from '../types';

const API_BASE = '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('eduai_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "Xatolik yuz berdi";
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorDetail;
    } catch {
      // response matn bo'lsa
    }
    throw new Error(errorDetail);
  }

  // Agar 204 yoki bo'sh javob bo'lsa
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // --- Autentifikatsiya ---
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const data = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('eduai_token', data.access_token);
    localStorage.setItem('eduai_user', JSON.stringify(data.user));
    return data;
  },

  register: async (userData: {
    email: string;
    full_name: string;
    password: string;
    role: UserRole;
    grade?: number;
    school_id?: number;
  }): Promise<AuthResponse> => {
    const data = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    localStorage.setItem('eduai_token', data.access_token);
    localStorage.setItem('eduai_user', JSON.stringify(data.user));
    return data;
  },

  getMe: async (): Promise<User> => {
    return request<User>('/auth/me');
  },

  updateProfile: async (data: {
    full_name?: string;
    grade?: number;
    explanation_style?: ExplanationStyle;
    password?: string;
  }): Promise<User> => {
    return request<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  logout: () => {
    localStorage.removeItem('eduai_token');
    localStorage.removeItem('eduai_user');
  },

  // --- Maktablar ---
  getSchools: async (): Promise<School[]> => {
    return request<School[]>('/schools');
  },

  // --- Sinflar ---
  getClasses: async (): Promise<ClassRoom[]> => {
    return request<ClassRoom[]>('/classes');
  },

  createClass: async (data: { name: string; grade: number; academic_year?: string }): Promise<ClassRoom> => {
    return request<ClassRoom>('/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --- Fanlar ---
  getSubjects: async (): Promise<Subject[]> => {
    return request<Subject[]>('/subjects');
  },

  // --- Darslar ---
  getLessons: async (params?: { subject_id?: number; grade?: number }): Promise<Lesson[]> => {
    const query = new URLSearchParams();
    if (params?.subject_id) query.append('subject_id', params.subject_id.toString());
    if (params?.grade) query.append('grade', params.grade.toString());
    return request<Lesson[]>(`/lessons?${query.toString()}`);
  },

  getLesson: async (id: number): Promise<Lesson> => {
    return request<Lesson>(`/lessons/${id}`);
  },

  createLesson: async (data: {
    subject_id: number;
    grade: number;
    title: string;
    description?: string;
    content_markdown: string;
  }): Promise<Lesson> => {
    return request<Lesson>('/lessons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  reviewLesson: async (id: number, data: { status: string; review_feedback?: string }): Promise<Lesson> => {
    return request<Lesson>(`/lessons/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // --- Mashqlar va Testlar ---
  getExercises: async (params?: { subject_id?: number; grade?: number; topic?: string }): Promise<Exercise[]> => {
    const query = new URLSearchParams();
    if (params?.subject_id) query.append('subject_id', params.subject_id.toString());
    if (params?.grade) query.append('grade', params.grade.toString());
    if (params?.topic) query.append('topic', params.topic);
    return request<Exercise[]>(`/quizzes/exercises?${query.toString()}`);
  },

  checkAnswer: async (exercise_id: number, student_answer: string): Promise<ExerciseCheckResult> => {
    return request<ExerciseCheckResult>('/quizzes/check-answer', {
      method: 'POST',
      body: JSON.stringify({ exercise_id, student_answer }),
    });
  },

  // --- Topshiriqlar ---
  getAssignments: async (class_id?: number): Promise<Assignment[]> => {
    const query = class_id ? `?class_id=${class_id}` : '';
    return request<Assignment[]>(`/assignments${query}`);
  },

  createAssignment: async (data: {
    class_id: number;
    title: string;
    description?: string;
    due_date?: string;
    exercise_ids: number[];
  }): Promise<Assignment> => {
    return request<Assignment>('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  submitAssignment: async (assignment_id: number, answers: Record<string, string>): Promise<Submission> => {
    return request<Submission>(`/assignments/${assignment_id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  getAssignmentSubmissions: async (assignment_id: number): Promise<Submission[]> => {
    return request<Submission[]>(`/assignments/${assignment_id}/submissions`);
  },

  // --- EduAI Repetitori ---
  askAI: async (query: {
    subject: string;
    grade: number;
    topic?: string;
    question: string;
    explanation_style?: ExplanationStyle;
    request_type?: string;
    conversation_id?: number;
  }): Promise<AIResponse> => {
    return request<AIResponse>('/ai/query', {
      method: 'POST',
      body: JSON.stringify(query),
    });
  },

  getConversations: async (): Promise<AIConversation[]> => {
    return request<AIConversation[]>('/ai/conversations');
  },

  getConversation: async (id: number): Promise<AIConversation> => {
    return request<AIConversation>(`/ai/conversations/${id}`);
  },

  sendAiFeedback: async (data: { message_id: number; is_helpful: boolean; comment?: string }) => {
    return request<{ message: string }>('/ai/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --- IT Yoshlar Loyihalari ---
  getProjects: async (params?: { category?: string; my_projects?: boolean }): Promise<Project[]> => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.my_projects) query.append('my_projects', 'true');
    return request<Project[]>(`/projects?${query.toString()}`);
  },

  createProject: async (data: {
    title: string;
    description: string;
    category: string;
    team_members?: string;
    demo_url?: string;
    repo_url?: string;
  }): Promise<Project> => {
    return request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  reviewProject: async (id: number, data: { status: string; review_notes?: string }): Promise<Project> => {
    return request<Project>(`/projects/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // --- Bildirishnomalar ---
  getNotifications: async (): Promise<Notification[]> => {
    return request<Notification[]>('/notifications');
  },

  markNotificationAsRead: async (id: number): Promise<Notification> => {
    return request<Notification>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  // --- Tahlil va Statistika ---
  getDashboardStats: async (): Promise<DashboardStats> => {
    return request<DashboardStats>('/reports/dashboard-stats');
  },

  // --- Admin ---
  getUsers: async (): Promise<User[]> => {
    return request<User[]>('/admin/users');
  },

  updateUserRole: async (userId: number, newRole: UserRole): Promise<User> => {
    return request<User>(`/admin/users/${userId}/role?new_role=${newRole}`, {
      method: 'PUT',
    });
  },

  getAuditLogs: async (): Promise<any[]> => {
    return request<any[]>('/admin/audit-logs');
  },

  getAiStatus: async (): Promise<any> => {
    return request<any>('/admin/ai-status');
  },
};
