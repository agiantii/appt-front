
import { Slide, SlideSpace, User } from '../types';

export const mockUser: User = {
  id: 'user-1',
  name: 'Alex Rivera',
  avatar: 'https://picsum.photos/seed/user1/100/100',
  email: 'alex@example.com'
};

export const mockSlideSpaces: SlideSpace[] = [
  { id: 1, name: 'Product Roadmap 2025', description: 'Internal roadmap for Q1-Q4', url: 'roadmap-2025' },
  { id: 2, name: 'Marketing Assets', description: 'Campaign slides and materials', url: 'marketing' },
  { id: 3, name: 'Engineering Docs', description: 'System design and architecture', url: 'engineering' },
];

export const mockSlides: Slide[] = [
  { 
    id: 1, 
    title: 'Introduction', 
    content: '---\ntheme: seriph\n---\n# Welcome to Slidev\nThis is the first page.\n\n---\n# Page 2\nContent here...', 
    slide_space_id: 1, 
    parent_id: null, 
    is_public: true, 
    allow_comment: true, 
    created_at: '2024-01-01', 
    updated_at: '2024-01-01' 
  },
  { id: 2, title: 'Features', content: '# Features List', slide_space_id: 1, parent_id: 1, is_public: false, allow_comment: true, created_at: '2024-01-02', updated_at: '2024-01-02' },
  { id: 3, title: 'Pricing', content: '# Pricing Models', slide_space_id: 1, parent_id: 1, is_public: false, allow_comment: false, created_at: '2024-01-03', updated_at: '2024-01-03' },
  { id: 4, title: 'Overview', content: '# Product Overview', slide_space_id: 1, parent_id: null, is_public: true, allow_comment: true, created_at: '2024-01-04', updated_at: '2024-01-04' },
];

export const exploreItems = [
  { id: 1, title: 'Elegant Minimalist', author: 'DesignPro', type: 'theme', preview: 'https://picsum.photos/seed/p1/400/250' },
  { id: 2, title: 'Data Viz Kit', author: 'ChartMaster', type: 'plugin', preview: 'https://picsum.photos/seed/p2/400/250' },
  { id: 3, title: 'Q4 Review', author: 'CorporateHub', type: 'slide', preview: 'https://picsum.photos/seed/p3/400/250' },
  { id: 4, title: 'AI Integration', author: 'DevTeam', type: 'plugin', preview: 'https://picsum.photos/seed/p4/400/250' },
  { id: 5, title: 'Dark Mode Master', author: 'UIWizard', type: 'theme', preview: 'https://picsum.photos/seed/p5/400/250' },
  { id: 6, title: 'Product Launch', author: 'MarketingX', type: 'slide', preview: 'https://picsum.photos/seed/p6/400/250' },
];
