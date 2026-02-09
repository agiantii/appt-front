
export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

export interface Slide {
  id: number;
  title: string;
  content: string;
  slide_space_id: number;
  parent_id: number | null;
  is_public: boolean;
  allow_comment: boolean;
  created_at: string;
  updated_at: string;
}

export interface SlideSpace {
  id: number;
  name: string;
  description: string;
  url: string;
  owner_id: string;
}

export interface Snippet {
  id: string;
  name: string;
  code: string;
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
