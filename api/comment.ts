import api from './index';
import { ApiResponse, Comment, PaginatedResponse } from '../types';

export const commentApi = {
  findAll: (slideId: number) => 
    api.get<any, ApiResponse<PaginatedResponse<Comment>>>(`/slides/${slideId}/comments`),
  create: (data: { slideId: number; content: string; replyId?: number }) => 
    api.post<any, ApiResponse<Comment>>(`/slides/${data.slideId}/comments`, { content: data.content, replyId: data.replyId }),
  remove: (id: number) => 
    api.delete<any, ApiResponse<null>>(`/comments/${id}`),
};
