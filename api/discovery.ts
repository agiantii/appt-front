import api from './index';
import { ApiResponse, PaginatedResponse } from '../types';

export const themeApi = {
  create: (data: { packageName: string; previewUrl?: string }) => 
    api.post<any, ApiResponse<any>>('/themes', data),
  findAll: () => 
    api.get<any, ApiResponse<any[]>>('/themes'),
  search: (params: { keyword?: string; page?: number; pageSize?: number }) => 
    api.get<any, ApiResponse<PaginatedResponse<any>>>('/themes/search', { params }),
  findOne: (id: number) => 
    api.get<any, ApiResponse<any>>(`/themes/${id}`),
  update: (id: number, data: { packageName?: string; previewUrl?: string }) => 
    api.put<any, ApiResponse<any>>(`/themes/${id}`, data),
  remove: (id: number) => 
    api.delete<any, ApiResponse<null>>(`/themes/${id}`),
};

export const pluginApi = {
  create: (data: { packageName: string }) => 
    api.post<any, ApiResponse<any>>('/plugins', data),
  findAll: () => 
    api.get<any, ApiResponse<any[]>>('/plugins'),
  search: (params: { keyword?: string; page?: number; pageSize?: number }) => 
    api.get<any, ApiResponse<PaginatedResponse<any>>>('/plugins/search', { params }),
  findOne: (id: number) => 
    api.get<any, ApiResponse<any>>(`/plugins/${id}`),
  update: (id: number, data: { packageName?: string }) => 
    api.put<any, ApiResponse<any>>(`/plugins/${id}`, data),
  remove: (id: number) => 
    api.delete<any, ApiResponse<null>>(`/plugins/${id}`),
};
