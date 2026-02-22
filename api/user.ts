import api from './index';
import { User, ApiResponse, PaginatedResponse } from '../types';

export const userApi = {
  register: (data: any) => api.post<any, ApiResponse<any>>('/users/register', data),
  login: (data: any) => api.post<any, ApiResponse<{ token: string; user: User }>>('/users/login', data),
  getCurrentUser: () => api.get<any, ApiResponse<User>>('/users/me'),
  updateCurrentUser: (data: any) => api.put<any, ApiResponse<User>>('/users/me', data),
  changePassword: (data: any) => api.post<any, ApiResponse<null>>('/users/change-password', data),
  resetPassword: (data: any) => api.post<any, ApiResponse<null>>('/users/reset-password', data),
  search: (params: { keyword?: string; page?: number; pageSize?: number }) => 
    api.get<any, ApiResponse<PaginatedResponse<User>>>('/users/search', { params }),
};
