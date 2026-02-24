export type SlideRole = 'owner' | 'editor' | 'commenter' | 'viewer';
export const PERMISSIONS: Record<SlideRole, string[]> = {
  owner: ['read', 'comment', 'edit', 'view_history', 'manage', 'delete'],
  editor: ['read', 'comment', 'edit', 'view_history'],
  commenter: ['read', 'comment', 'view_history'],
  viewer: ['read', 'view_history'],
};
