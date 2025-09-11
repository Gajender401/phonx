import axios, { AxiosInstance } from 'axios';

// VKG API Configuration
const VKG_BASE_URL = process.env.NEXT_PUBLIC_VKG_URL || 'http://185.62.108.226:53107';

// Create axios instance for VKG API
const vkgApi: AxiosInstance = axios.create({
  baseURL: VKG_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for loading state if needed
vkgApi.interceptors.request.use(
  (config) => {
    // You can add loading state management here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
vkgApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // You can add global error handling here
    return Promise.reject(error);
  }
);

// Type Definitions based on API specification
export interface VKGInsertRequest {
  main_question: string;
  how_to_answer_question: string;
  routing_status: boolean;
  knowledge_id: string;
  company_name: string;
  status_ai_approval: boolean;
  department: string;
  requirement_gathering?: string;
  how_to_gather_requirement?: string;
}

export interface VKGInsertResponse {
  success: boolean;
  chunk_index?: string;
  message?: string;
}

export interface VKGUpdateRequest {
  main_question: string;
  how_to_answer_question: string;
  routing_status: boolean;
  doc_id: string;
  chunk_index: string;
  department: string;
  requirement_gathering?: string;
  how_to_gather_requirement?: string;
}

export interface VKGUpdateResponse {
  success: boolean;
  chunk_index?: string;
  message?: string;
}

export interface VKGDeleteRequest {
  knowledge_id: string;
  chunk_index: string;
}

export interface VKGDeleteResponse {
  success: boolean;
  message: string;
  deleted_chunk_index?: string;
}

export interface VKGQuestion {
  main_question: string;
  how_to_answer_question: string;
  routing_status: boolean;
  requirement_gathering?: string;
  how_to_gather_requirement?: string;
  department: string;
  chunk_index: string;
}

export interface VKGGetAllResponse {
  knowledge_id: string;
  [key: `question_${number}`]: VKGQuestion; // Dynamic keys like "question_1", "question_2", etc.
}

export interface VKGGetAllRequest {
  page?: number;
  page_size?: number;
  department?: string;
  q?: string;
}

export interface VKGErrorResponse {
  detail: string;
}

// Generic API wrapper functions
export const vkgApiClient = {
  get: async <T>(url: string): Promise<T> => {
    const response = await vkgApi.get(url);
    return response.data;
  },

  post: async <T>(url: string, data?: any): Promise<T> => {
    const response = await vkgApi.post(url, data);
    return response.data;
  },

  put: async <T>(url: string, data?: any): Promise<T> => {
    const response = await vkgApi.put(url, data);
    return response.data;
  },

  delete: async <T>(url: string, data?: any): Promise<T> => {
    const response = await vkgApi.delete(url, { data });
    return response.data;
  },
};

// VKG API Functions
export const vkgApiService = {
  // Health check endpoint
  getWelcome: async (): Promise<{ message: string }> => {
    return vkgApiClient.get<{ message: string }>('/');
  },

  // Insert a new question
  insertQuestion: async (data: VKGInsertRequest): Promise<VKGInsertResponse> => {
    return vkgApiClient.post<VKGInsertResponse>('/vkg/insert', data);
  },

  // Update an existing question
  updateQuestion: async (data: VKGUpdateRequest): Promise<VKGUpdateResponse> => {
    return vkgApiClient.put<VKGUpdateResponse>('/vkg/update', data);
  },

  // Retrieve all questions for a knowledge_id with filters and pagination
  getAllQuestions: async (
    knowledgeId: string,
    params?: VKGGetAllRequest
  ): Promise<VKGGetAllResponse> => {
    // Build query string from parameters
    const queryParams = new URLSearchParams();

    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.page_size !== undefined) queryParams.append('page_size', params.page_size.toString());
    if (params?.department && params.department !== 'All Departments') queryParams.append('department', params.department);
    if (params?.q) queryParams.append('q', params.q);

    const queryString = queryParams.toString();
    const url = `/vkg/retrieve-all/${knowledgeId}${queryString ? `?${queryString}` : ''}`;

    const response = await vkgApiClient.get<VKGGetAllResponse>(url);
    console.log('VKG API Request URL:', url, 'with params:', params); // Debug log
    console.log('VKG API Response for', knowledgeId, ':', response); // Debug log
    return response;
  },

  // Delete a specific question chunk
  deleteQuestion: async (data: VKGDeleteRequest): Promise<VKGDeleteResponse> => {
    return vkgApiClient.delete<VKGDeleteResponse>('/vkg/delete', data);
  },
};

// Helper function to transform VKG response to FAQ format
// The VKG API returns questions as direct properties of the response object
// with keys like "question_1", "question_2", etc. instead of a nested "questions" array
export const transformVKGToFAQ = (vkgResponse: VKGGetAllResponse): Array<{
  id: string;
  question: string;
  answer: string;
  department: string;
  routing_status: boolean;
  requirement_gathering?: string;
  how_to_gather_requirement?: string;
}> => {
  const questions: any[] = [];

  // Extract questions from the response object (keys like "question_1", "question_2", etc.)
  Object.keys(vkgResponse).forEach(key => {
    if (key.startsWith('question_')) {
      const question = vkgResponse[key as keyof VKGGetAllResponse] as VKGQuestion;
      if (question && typeof question === 'object' && question.main_question) {
        questions.push({
          id: question.chunk_index,
          question: question.main_question,
          answer: question.how_to_answer_question,
          department: question.department,
          routing_status: question.routing_status,
          requirement_gathering: question.requirement_gathering || '',
          how_to_gather_requirement: question.how_to_gather_requirement || '',
        });
      }
    }
  });

  console.log('Transformed FAQ questions:', questions); // Debug log
  return questions;
};

export default vkgApi;
