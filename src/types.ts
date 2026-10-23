export type UserRole =
  | 'student'
  | 'teacher'
  | 'school_coordinator'
  | 'district_coordinator'
  | 'admin';

export type ExplanationStyle = 'very_simple' | 'step_by_step' | 'detailed';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  schoolId: string | null;
  schoolName?: string;
  districtId: string | null;
  grade: number | null;
  preferredStyle: ExplanationStyle;
  englishLevel: 'A1' | 'A2' | 'B1' | 'B2';
}

export interface SchoolItem {
  id: string;
  name: string;
  code: string;
  city: string;
  status: string;
  district_name?: string;
  member_count?: number;
}

export interface LessonItem {
  id: string;
  school_id: string | null;
  subject_code: 'math' | 'english' | string;
  grade: number;
  topic_slug: string;
  title_uz: string;
  level_tag: string;
  summary_uz: string;
  content_uz: string;
  worked_example_uz: string;
  approval_status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';
  author_name?: string;
  reviewer_name?: string;
  reviewed_at?: string;
  revision_notes?: string;
  created_at: string;
}

export interface AssignmentItem {
  id: string;
  school_id: string;
  class_id: string | null;
  class_name?: string;
  teacher_id: string;
  teacher_name?: string;
  subject_code: string;
  grade: number;
  topic_slug: string;
  title_uz: string;
  description_uz: string;
  assignment_type: 'practice' | 'quiz' | 'homework';
  is_published: number;
  due_date: string | null;
  question_count?: number;
  created_at: string;
  mySubmission?: {
    id: string;
    score: number;
    max_score: number;
    percentage: number;
    teacher_feedback_uz?: string;
    submitted_at: string;
  } | null;
}

export interface QuestionItem {
  id: string;
  questionType: 'multiple_choice' | 'numeric' | 'fill_blank' | 'short_answer';
  promptUz: string;
  options: string[] | null;
  hintUz: string;
  points: number;
  orderIndex: number;
  correctAnswer?: string;
  explanationUz?: string;
}

export interface SubmissionResultItem {
  questionId: string;
  promptUz?: string;
  studentAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints?: number;
  feedbackUz?: string;
  explanationUz?: string;
}

export interface ProjectItem {
  id: string;
  school_id: string;
  school_name: string;
  title_uz: string;
  description_uz: string;
  category: string;
  status: 'draft' | 'pending_review' | 'approved' | 'showcase' | 'rejected';
  milestones: { title: string; done: boolean }[];
  demo_url?: string;
  repo_url?: string;
  team_names: string;
  mentor_name?: string;
  review_feedback_uz?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  title_uz: string;
  body_uz: string;
  category: string;
  is_read: number;
  created_at: string;
}
