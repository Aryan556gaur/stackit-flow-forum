
import { 
  User, 
  Question, 
  Answer, 
  Vote, 
  Tag, 
  CreateQuestionData, 
  CreateAnswerData, 
  LoginData, 
  RegisterData,
  ApiResponse,
  PaginatedResponse 
} from '@/types/database';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Authentication
  async login(credentials: LoginData): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.makeRequest('/auth/me');
  }

  async logout(): Promise<ApiResponse<void>> {
    const result = await this.makeRequest('/auth/logout', { method: 'POST' });
    localStorage.removeItem('auth_token');
    return result;
  }

  // Questions
  async getQuestions(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    search?: string;
    tags?: string[];
  }): Promise<ApiResponse<PaginatedResponse<Question>>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.tags) params.tags.forEach(tag => queryParams.append('tags[]', tag));

    const queryString = queryParams.toString();
    return this.makeRequest(`/questions${queryString ? `?${queryString}` : ''}`);
  }

  async getQuestion(id: number): Promise<ApiResponse<Question>> {
    return this.makeRequest(`/questions/${id}`);
  }

  async createQuestion(questionData: CreateQuestionData): Promise<ApiResponse<Question>> {
    return this.makeRequest('/questions', {
      method: 'POST',
      body: JSON.stringify(questionData),
    });
  }

  async updateQuestion(id: number, questionData: Partial<CreateQuestionData>): Promise<ApiResponse<Question>> {
    return this.makeRequest(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(questionData),
    });
  }

  async deleteQuestion(id: number): Promise<ApiResponse<void>> {
    return this.makeRequest(`/questions/${id}`, { method: 'DELETE' });
  }

  // Answers
  async getAnswers(questionId: number): Promise<ApiResponse<Answer[]>> {
    return this.makeRequest(`/questions/${questionId}/answers`);
  }

  async createAnswer(answerData: CreateAnswerData): Promise<ApiResponse<Answer>> {
    return this.makeRequest('/answers', {
      method: 'POST',
      body: JSON.stringify(answerData),
    });
  }

  async updateAnswer(id: number, content: string): Promise<ApiResponse<Answer>> {
    return this.makeRequest(`/answers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async deleteAnswer(id: number): Promise<ApiResponse<void>> {
    return this.makeRequest(`/answers/${id}`, { method: 'DELETE' });
  }

  async acceptAnswer(id: number): Promise<ApiResponse<Answer>> {
    return this.makeRequest(`/answers/${id}/accept`, { method: 'POST' });
  }

  // Voting
  async vote(targetId: number, targetType: 'question' | 'answer', voteType: 'up' | 'down'): Promise<ApiResponse<Vote>> {
    return this.makeRequest('/votes', {
      method: 'POST',
      body: JSON.stringify({ target_id: targetId, target_type: targetType, vote_type: voteType }),
    });
  }

  async removeVote(targetId: number, targetType: 'question' | 'answer'): Promise<ApiResponse<void>> {
    return this.makeRequest(`/votes/${targetType}/${targetId}`, { method: 'DELETE' });
  }

  // Tags
  async getTags(): Promise<ApiResponse<Tag[]>> {
    return this.makeRequest('/tags');
  }

  async getPopularTags(limit = 20): Promise<ApiResponse<Tag[]>> {
    return this.makeRequest(`/tags/popular?limit=${limit}`);
  }

  // Users
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<User>>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    return this.makeRequest(`/users${queryString ? `?${queryString}` : ''}`);
  }

  async getUser(id: number): Promise<ApiResponse<User>> {
    return this.makeRequest(`/users/${id}`);
  }

  // Statistics
  async getStats(): Promise<ApiResponse<{
    total_questions: number;
    total_answers: number;
    total_users: number;
    questions_today: number;
  }>> {
    return this.makeRequest('/stats');
  }
}

export const apiService = new ApiService();
