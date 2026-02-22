
export interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  state: number;
  createdAt: string;
  updatedAt: string;
}

export interface Slide {
  id: number;
  title: string;
  content: string;
  slideSpaceId: number;
  parentId: number | null;
  isPublic: boolean;
  allowComment: boolean;
  createdAt: string;
  updatedAt: string;
  isBuild?: boolean;
}

export interface SlideSpace {
  id: number;
  name: string;
  ownerId: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Snippet {
  id: number;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  slideId: number;
  userId: number;
  username: string;
  avatarUrl: string | null;
  content: string;
  replyId: number | null;
  createdAt: string;
  user?: {
    username: string;
    avatar: string | null;
  };
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FileTreeNode extends Slide {
  children?: FileTreeNode[];
}

export type SidebarTab = 'explorer' | 'git' | 'comments' | 'ai' | 'snippets';

export interface SlidePageInfo {
  index: number;
  title: string;
  preview: string;
  lineStart: number;
}

export interface Version {
  id: number;
  versionNumber: number;
  slideId: number;
  content: string;
  commitMsg: string;
  createdBy: number;
  creatorName: string;
  createdAt: string;
}

export interface ConnectionInfo {
  url: string;
  docName: string;
  token: string;
}
