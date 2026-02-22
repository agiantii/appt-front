import { Slide, SlideSpace, User, Snippet } from '../types';

export const mockUser: User = {
  id: 1,
  username: 'Alex Rivera',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  email: 'alex@example.com',
  state: 1,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01'
};

export const mockSlideSpaces: SlideSpace[] = [
  { id: 1, name: 'Product Roadmap 2025', isPublic: false, ownerId: 1, createdAt: '2024-01-01' },
  { id: 2, name: 'Marketing Assets', isPublic: false, ownerId: 1, createdAt: '2024-01-01' },
  { id: 3, name: 'Engineering Docs', isPublic: false, ownerId: 1, createdAt: '2024-01-01' },
];

export const mockSlides: Slide[] = [
  { 
    id: 1, 
    title: 'Introduction', 
    content: '---\ntheme: seriph\n---\n# Welcome to Slidev\nThis is the first page.\n\n---\n# Page 2\nContent here about the vision...', 
    slideSpaceId: 1, 
    parentId: null, 
    isPublic: true, 
    allowComment: true, 
    createdAt: '2024-01-01', 
    updatedAt: '2024-01-01' 
  },
  { id: 2, title: 'Features Deep Dive', content: '---\nlayout: center\n---\n# Key Features\n- Real-time collaboration\n- AI Assistant\n- VS Code integration', slideSpaceId: 1, parentId: 1, isPublic: false, allowComment: true, createdAt: '2024-01-02', updatedAt: '2024-01-02' },
  { id: 3, title: 'Pricing Table', content: '# Pricing Models\nCompare our basic vs pro plans.', slideSpaceId: 1, parentId: 1, isPublic: false, allowComment: false, createdAt: '2024-01-03', updatedAt: '2024-01-03' },
  { id: 4, title: 'Executive Overview', content: '# Executive Summary\nSummary for the stakeholders.', slideSpaceId: 1, parentId: null, isPublic: true, allowComment: true, createdAt: '2024-01-04', updatedAt: '2024-01-04' },
];

export const mockSnippets: Snippet[] = [
  { 
    id: 1, 
    name: 'Slidev: Center Layout', 
    content: '---\nlayout: center\n---\n# Title\nContent goes here...',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  { 
    id: 2, 
    name: 'Slidev: Two Columns', 
    content: '---\nlayout: two-cols\n---\n# Title\n\n::left::\nLeft content\n\n::right::\nRight content',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  { 
    id: 3, 
    name: 'Vue: Counter Component', 
    content: '<script setup>\nimport { ref } from "vue"\nconst count = ref(0)\n</script>\n\n<template>\n  <button @click="count++">{{ count }}</button>\n</template>',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  { 
    id: 4, 
    name: 'Slidev: Click Animations', 
    content: '<ul>\n  <li v-click>First item</li>\n  <li v-click>Second item</li>\n  <li v-click>Third item</li>\n</ul>',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  { 
    id: 5, 
    name: 'Slidev: Template', 
    content: '---\n theme: default \n --- \n #slide 1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  }
];

export const exploreItems = [
  { id: 1, title: 'Elegant Minimalist', author: 'DesignPro', type: 'theme', preview: 'https://picsum.photos/seed/exp1/400/250' },
  { id: 2, title: 'Data Viz Kit', author: 'ChartMaster', type: 'plugin', preview: 'https://picsum.photos/seed/exp2/400/250' },
  { id: 3, title: 'Q4 Business Review', author: 'CorporateHub', type: 'slide', preview: 'https://picsum.photos/seed/exp3/400/250' },
  { id: 4, title: 'AI Automation', author: 'DevTeam', type: 'plugin', preview: 'https://picsum.photos/seed/exp4/400/250' },
  { id: 5, title: 'Dark Mode Master', author: 'UIWizard', type: 'theme', preview: 'https://picsum.photos/seed/exp5/400/250' },
  { id: 6, title: 'Product Launch 2.0', author: 'MarketingX', type: 'slide', preview: 'https://picsum.photos/seed/exp6/400/250' },
  { id: 7, title: 'Interactive Charts', author: 'VizLab', type: 'plugin', preview: 'https://picsum.photos/seed/exp7/400/250' },
  { id: 8, title: 'Saas Pitch Deck', author: 'FounderKit', type: 'slide', preview: 'https://picsum.photos/seed/exp8/400/250' },
];
