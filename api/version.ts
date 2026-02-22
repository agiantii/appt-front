import api from './index';
import { ApiResponse, PaginatedResponse, Version } from '../types';

export const versionApi = {
  create: (slideId: number, data: { commitMsg: string }) => 
    api.post<any, ApiResponse<Version>>(`/slides/${slideId}/versions`, data),
  findAll: (slideId: number, params?: { page?: number; pageSize?: number }) => 
    api.get<any, ApiResponse<PaginatedResponse<Version>>>(`/slides/${slideId}/versions`, { params }),
  findOne: (slideId: number, versionId: number) => 
    api.get<any, ApiResponse<Version>>(`/slides/${slideId}/versions/${versionId}`),
  rollback: (slideId: number, versionId: number, data: { commitMsg?: string }) => 
    api.post<any, ApiResponse<{ newVersionNumber: number; newVersionId: number }>>(`/slides/${slideId}/versions/${versionId}/rollback`, data),
};
