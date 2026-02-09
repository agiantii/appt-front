
import { Slide, SlideSpace, User, Snippet } from '../types';

export const mockUser: User = {
  id: 'user-1',
  name: 'Alex Rivera',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  email: 'alex@example.com'
};

export const mockSlideSpaces: SlideSpace[] = [
  { id: 1, name: 'Product Roadmap 2025', description: 'Internal roadmap for Q1-Q4 product strategy and feature rollout.', url: 'roadmap-2025', owner_id: 'user-1' },
  { id: 2, name: 'Marketing Assets', description: 'Campaign slides, brand materials, and social media templates.', url: 'marketing', owner_id: 'user-1' },
  { id: 3, name: 'Engineering Docs', description: 'System design, architecture diagrams, and onboarding slides.', url: 'engineering', owner_id: 'user-1' },
];

export const mockSlides: Slide[] = [
  { 
    id: 1, 
    title: 'Introduction', 
    content: '---\ntheme: seriph\n---\n# Welcome to Slidev\nThis is the first page.\n\n---\n# Page 2\nContent here about the vision...', 
    slide_space_id: 1, 
    parent_id: null, 
    is_public: true, 
    allow_comment: true, 
    created_at: '2024-01-01', 
    updated_at: '2024-01-01' 
  },
  { id: 2, title: 'Features Deep Dive', content: '---\nlayout: center\n---\n# Key Features\n- Real-time collaboration\n- AI Assistant\n- VS Code integration', slide_space_id: 1, parent_id: 1, is_public: false, allow_comment: true, created_at: '2024-01-02', updated_at: '2024-01-02' },
  { id: 3, title: 'Pricing Table', content: '# Pricing Models\nCompare our basic vs pro plans.', slide_space_id: 1, parent_id: 1, is_public: false, allow_comment: false, created_at: '2024-01-03', updated_at: '2024-01-03' },
  { id: 4, title: 'Executive Overview', content: '# Executive Summary\nSummary for the stakeholders.', slide_space_id: 1, parent_id: null, is_public: true, allow_comment: true, created_at: '2024-01-04', updated_at: '2024-01-04' },
];

export const mockSnippets: Snippet[] = [
  { 
    id: 's1', 
    name: 'Slidev: Center Layout', 
    code: '---\nlayout: center\n---\n# Title\nContent goes here...' 
  },
  { 
    id: 's2', 
    name: 'Slidev: Two Columns', 
    code: '---\nlayout: two-cols\n---\n# Title\n\n::left::\nLeft content\n\n::right::\nRight content' 
  },
  { 
    id: 's3', 
    name: 'Vue: Counter Component', 
    code: '<script setup>\nimport { ref } from "vue"\nconst count = ref(0)\n</script>\n\n<template>\n  <button @click="count++">{{ count }}</button>\n</template>' 
  },
  { 
    id: 's4', 
    name: 'Slidev: Click Animations', 
    code: '<ul>\n  <li v-click>First item</li>\n  <li v-click>Second item</li>\n  <li v-click>Third item</li>\n</ul>' 
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
