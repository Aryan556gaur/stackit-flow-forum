
export interface User {
  id: number;
  username: string;
  email: string;
  reputation: number;
  avatar?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Question {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  author_id: number;
  author: User;
  votes: number;
  answers: number;
  views: number;
  tags: string[];
  created_at: Date;
  updated_at: Date;
  has_accepted_answer: boolean;
}

export interface Answer {
  id: number;
  content: string;
  question_id: number;
  author_id: number;
  author: User;
  votes: number;
  is_accepted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Vote {
  id: number;
  user_id: number;
  target_id: number;
  target_type: 'question' | 'answer';
  vote_type: 'up' | 'down';
  created_at: Date;
}

export interface Tag {
  id: number;
  name: string;
  description?: string;
  question_count: number;
  created_at: Date;
}

export interface CreateQuestionData {
  title: string;
  content: string;
  tags: string[];
}

export interface CreateAnswerData {
  content: string;
  question_id: number;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
