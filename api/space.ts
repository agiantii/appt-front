import api from './index';
import { SlideSpace, ApiResponse, PaginatedResponse } from '../types';

export const spaceApi = {
  create: (data: { name: string; isPublic?: boolean }) => 
    api.post<any, ApiResponse<SlideSpace>>('/slide-spaces', data),
  findAll: (params?: { page?: number; pageSize?: number }) => 
    api.get<any, ApiResponse<PaginatedResponse<SlideSpace>>>('/slide-spaces', { params }),
  findOne: (id: number) => 
    api.get<any, ApiResponse<SlideSpace>>(`/slide-spaces/${id}`),
  update: (id: number, data: { name?: string; isPublic?: boolean }) => 
    api.put<any, ApiResponse<SlideSpace>>(`/slide-spaces/${id}`, data),
  remove: (id: number) => 
    api.delete<any, ApiResponse<null>>(`/slide-spaces/${id}`),
  search: (params: { keyword?: string; page?: number; pageSize?: number }) => 
    api.get<any, ApiResponse<PaginatedResponse<SlideSpace>>>('/slide-spaces/search', { params }),
  searchMySpaces: (params: { keyword?: string; page?: number; pageSize?: number }) => 
    api.get<any, ApiResponse<PaginatedResponse<SlideSpace>>>('/slide-spaces/me/search', { params }),
  like: (spaceId: number) => 
    api.post<any, ApiResponse<null>>(`/slide-spaces/${spaceId}/like`),
  unlike: (spaceId: number) => 
    api.delete<any, ApiResponse<null>>(`/slide-spaces/${spaceId}/like`),
};
