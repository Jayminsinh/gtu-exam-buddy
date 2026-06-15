import { FileText, BookOpen, GitBranch, Sparkles } from '../components/ui/Icons';

export const features = [
  {
    icon: FileText,
    themeColor: '#006633', // Green
    bgColor: 'rgba(0, 102, 51, 0.06)',
    badgeText: 'RESOURCE',
    title: 'Curated Papers',
    description:
      'A meticulously organized repository of past examination papers, indexed by branch, semester, and subject with strict quality controls.',
    image: '/assets/feature-papers.webp'
  },
  {
    icon: BookOpen,
    themeColor: '#f5af1c', // Yellow/Orange
    bgColor: 'rgba(245, 175, 28, 0.08)',
    badgeText: 'SYLLABUS',
    title: 'Structured Syllabi',
    description:
      'Complete syllabus tracking with absolute version history, ensuring students study exactly what is prescribed by the university.',
    image: '/assets/feature-syllabus.webp'
  },
  {
    icon: GitBranch,
    themeColor: '#2db9aa', // Teal
    bgColor: 'rgba(45, 185, 170, 0.08)',
    badgeText: 'TAXONOMY',
    title: 'Academic Taxonomy',
    description:
      'Branches, semesters, and subjects mapped with editorial precision — an architecture built for visual clarity and calm authority.',
    image: '/assets/feature-analytics.webp'
  }
];
