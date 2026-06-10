import { Home, Utensils, Car, Heart, Smile, BookOpen, Shirt, RefreshCw, TrendingUp, Tag, Briefcase, PlusCircle, Wallet, Target } from 'lucide-react';

export const CATEGORY_COLORS = {
  'Moradia':       '#378ADD',
  'Alimentação':   '#1D9E75',
  'Transporte':    '#D85A30',
  'Saúde':         '#7F77DD',
  'Lazer':         '#EF9F27',
  'Educação':      '#E24B4A',
  'Vestuário':     '#D4537E',
  'Assinaturas':   '#BA7517',
  'Investimentos': '#639922',
  'Outros':        '#888780',
  'Salário':       '#1D9E75',
  'Renda Extra':   '#7F77DD',
};

export const CATEGORY_ICONS = {
  'home': Home, 'utensils': Utensils, 'car': Car,
  'heart': Heart, 'smile': Smile, 'book': BookOpen,
  'shirt': Shirt, 'repeat': RefreshCw, 'trending-up': TrendingUp,
  'tag': Tag, 'briefcase': Briefcase, 'plus-circle': PlusCircle,
  'wallet': Wallet, 'target': Target,
};

export function getCategoryColor(categoryName, fallback = '#888780') {
  return CATEGORY_COLORS[categoryName] ?? fallback;
}

export function getCategoryIcon(iconName) {
  return CATEGORY_ICONS[iconName] ?? Tag;
}
