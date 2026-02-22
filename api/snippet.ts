import api from './index';
import { Snippet, ApiResponse } from '../types';

export const snippetApi = {
  create: (data: { name: string; content: string }) => 
    api.post<any, ApiResponse<Snippet>>('/snippets', data),
  findAll: () => 
    api.get<any, ApiResponse<Snippet[]>>('/snippets'),
  findOne: (id: number) => 
    api.get<any, ApiResponse<Snippet>>(`/snippets/${id}`),
  update: (id: number, data: { name?: string; content?: string }) => 
    api.patch<any, ApiResponse<Snippet>>(`/snippets/${id}`, data),
  remove: (id: number) => 
    api.delete<any, ApiResponse<null>>(`/snippets/${id}`),
};
