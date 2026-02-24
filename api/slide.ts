import api from './index';
import { Slide, ApiResponse, PaginatedResponse } from '../types';

export const slideApi = {
  create: (data: { title: string; slideSpaceId: number; parentId?: number | null; content?: string; isPublic?: boolean; allowComment?: boolean }) => 
    api.post<any, ApiResponse<Slide>>('/slides', data),
  findAllBySpace: (spaceId: number) => 
    api.get<any, ApiResponse<any[]>>(`/slide-spaces/${spaceId}/slides`),
  update: (id: number, data: { title?: string; content?: string; isPublic?: boolean; allowComment?: boolean; previewUrl?: string }) => 
    api.put<any, ApiResponse<Slide>>(`/slides/${id}`, data),
  remove: (id: number) => 
    api.delete<any, ApiResponse<null>>(`/slides/${id}`),
  saveContent: (id: number, content: string) => 
    api.post<any, ApiResponse<{ id: number; updatedAt: string }>>(`/slides/${id}/save`, { content }),
  move: (id: number, params: { parentId: number | null; targetId?: number; position?: 'before' | 'after' }) => 
    api.post<any, ApiResponse<Slide | Slide[]>>(`/slides/${id}/move`, params),
  findRecent: (limit?: number) => 
    api.get<any, ApiResponse<any[]>>('/slides/recent', { params: { limit } }),
  findOne: (id: number) => 
    api.get<any, ApiResponse<Slide>>(`/slides/detail/${id}`),
  search: (params: { keyword?: string; page?: number; pageSize?: number }) => 
    api.get<any, ApiResponse<PaginatedResponse<Slide>>>('/slides/search', { params }),
  searchMySlides: (params: { keyword?: string; page?: number; pageSize?: number }) => 
    api.get<any, ApiResponse<PaginatedResponse<Slide>>>('/slides/me/search', { params }),
  preview: (id: number, mode: 'dev' | 'build') => 
    api.get<any, ApiResponse<{ url: string; mode: string }>>(`/slides/${id}/preview`, { params: { mode } }),
  build: (id: number) => 
    api.post<any, ApiResponse<{ slideId: number; buildPath: string; isBuild: boolean }>>(`/slides/${id}/build`),
  stopDev: (id: number) => 
    api.delete<any, ApiResponse<null>>(`/slides/${id}/dev/stop`),
  like: (slideId: number) => 
    api.post<any, ApiResponse<null>>(`/slides/${slideId}/like`),
  unlike: (slideId: number) => 
    api.delete<any, ApiResponse<null>>(`/slides/${slideId}/like`),
  getCollaborators: (slideId: number) => 
    api.get<any, ApiResponse<any[]>>(`/slides/${slideId}/collaborators`),
  addCollaborator: (slideId: number, data: { userId: number; role: string }) => 
    api.post<any, ApiResponse<any>>(`/slides/${slideId}/collaborators`, data),
  updateCollaborator: (slideId: number, userId: number, role: string) => 
    api.put<any, ApiResponse<any>>(`/slides/${slideId}/collaborators/${userId}`, { role }),
  removeCollaborator: (slideId: number, userId: number) => 
    api.delete<any, ApiResponse<null>>(`/slides/${slideId}/collaborators/${userId}`),
  getMyRole: (slideId: number) => 
    api.get<any, ApiResponse<{ role: string; isOwner: boolean }>>(`/slides/${slideId}/collaborators/my-role`),
  getConnectionInfo: (slideId: number) => 
    api.post<any, ApiResponse<{ url: string; docName: string; token: string }>>(`/shared-docs/${slideId}/connect`),
};
