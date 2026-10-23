export type UserRole = 'student' | 'teacher' | 'school_admin' | 'admin';

export const UserRole = {
  ADMIN: 'admin' as const,
  SCHOOL_ADMIN: 'school_admin' as const,
  TEACHER: 'teacher' as const,
  STUDENT: 'student' as const,
};

export type ExplanationStyle = 'very_simple' | 'step_by_step' | 'detailed';

export interface User {
  id: number;
  school_id?: number | null;
  username?: string | null;
  email: string;
  full_name: string;
  father_name?: string | null;
  role: UserRole;
  grade?: number | null;
  document_number?: string | null;
  pinfl?: string | null;
  student_id_code?: string | null;
  education_level?: string | null;
  position?: string | null;
  salary?: number | null;
  phone?: string | null;
  explanation_style: ExplanationStyle;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface School {
  id: number;
  name: string;
  code: string;
  region?: string;
  district_id?: number;
  district_name?: string;
  address?: string;
  director_name?: string;
  director_phone?: string;
  phone?: string;
  student_count?: number;
  teacher_count?: number;
  student_quota?: number;
  teacher_quota?: number;
  is_active: boolean;
}

export interface ClassRoom {
  id: number;
  school_id: number;
  name: string;
  grade: number;
  academic_year: string;
  student_count?: number;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
  icon: string;
  is_active: boolean;
}

export interface Lesson {
  id: number;
  subject_id: number;
  grade: number;
  title: string;
  description?: string;
  content_markdown: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';
  created_at: string;
}

export interface Exercise {
  id: number;
  lesson_id?: number;
  subject_id: number;
  grade: number;
  topic: string;
  question_text: string;
  question_type: 'multiple_choice' | 'numeric' | 'text';
  options?: string[];
  hint_1?: string;
  hint_2?: string;
  points: number;
}

export interface ExerciseCheckResult {
  is_correct: boolean;
  correct_answer: string;
  explanation?: string;
  points_earned: number;
  message: string;
}

export interface Assignment {
  id: number;
  class_id: number;
  teacher_id: number;
  title: string;
  description?: string;
  due_date?: string;
  status: string;
  created_at: string;
  questions_count?: number;
}

export interface Submission {
  id: number;
  assignment_id: number;
  student_id: number;
  score: number;
  max_score: number;
  teacher_feedback?: string;
  submitted_at: string;
}

export interface AIResponse {
  answer: string;
  hints?: string[];
  follow_up_questions?: string[];
  conversation_id: number;
  message_id: number;
  provider: string;
  is_mock: boolean;
}

export interface AIMessage {
  id: number;
  conversation_id: number;
  sender: 'user' | 'assistant';
  content: string;
  hints_used: number;
  created_at: string;
}

export interface AIConversation {
  id: number;
  subject_id?: number;
  grade?: number;
  topic?: string;
  title: string;
  created_at: string;
  messages?: AIMessage[];
}

export interface Project {
  id: number;
  school_id: number;
  owner_id: number;
  owner_name?: string;
  title: string;
  description: string;
  category: 'web' | 'bot' | 'ai' | 'robotics' | 'tools' | 'mobile' | 'game' | 'other' | string;
  team_members?: string;
  demo_url?: string;
  repo_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  mentor_id?: number;
  review_notes?: string;
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  active_students: number;
  active_teachers: number;
  schools_count: number;
  completed_exercises: number;
  projects_count: number;
  ai_queries_count: number;
}
