import { CategoryItem } from '../types.js';

export const DEFAULT_UNITS: string[] = [
  'kg',
  'g',
  'litre',
  'ml',
  'piece',
  'packet',
  'bottle',
  'cylinder',
  'month',
  'bill',
  'recharge',
  'service',
  'other',
];

export const CATEGORY_COLORS: Record<string, string> = {
  'Groceries': '#10B981', // Emerald
  'Utilities': '#3B82F6', // Blue
  'Communication': '#6366F1', // Indigo
  'Household': '#F59E0B', // Amber
  'Transport': '#EC4899', // Pink
  'Health': '#EF4444', // Red
  'Entertainment': '#8B5CF6', // Purple
  'Education': '#06B6D4', // Cyan
  'Shopping': '#F97316', // Orange
  'Other': '#64748B', // Slate
};

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    name: 'Groceries',
    color: '#10B981',
    subcategories: [
      'Rice',
      'Wheat',
      'Dal',
      'Milk',
      'Vegetables',
      'Fruits',
      'Cooking Oil',
      'Sugar',
      'Eggs',
      'Snacks',
      'Spices',
      'Other',
    ],
  },
  {
    name: 'Utilities',
    color: '#3B82F6',
    subcategories: ['Electricity', 'Cooking Gas', 'Water', 'Garbage/Maintenance', 'Other'],
  },
  {
    name: 'Communication',
    color: '#6366F1',
    subcategories: ['WiFi', 'Mobile Recharge', 'Broadband', 'Cable TV', 'Other'],
  },
  {
    name: 'Household',
    color: '#F59E0B',
    subcategories: ['Maid', 'Cleaning', 'Repairs', 'Household Supplies', 'Laundry', 'Other'],
  },
  {
    name: 'Transport',
    color: '#EC4899',
    subcategories: ['Fuel', 'Public Transit', 'Taxi/Cab', 'Vehicle Service', 'Parking', 'Other'],
  },
  {
    name: 'Health',
    color: '#EF4444',
    subcategories: ['Medicines', "Doctor's Visit", 'Lab Tests', 'Fitness/Gym', 'Insurance', 'Other'],
  },
  {
    name: 'Entertainment',
    color: '#8B5CF6',
    subcategories: ['Streaming (Netflix/Prime)', 'Movies', 'Dining Out', 'Games', 'Hobby', 'Other'],
  },
  {
    name: 'Education',
    color: '#06B6D4',
    subcategories: ['School/College Fees', 'Books/Stationery', 'Online Courses', 'Tuition', 'Other'],
  },
  {
    name: 'Shopping',
    color: '#F97316',
    subcategories: ['Clothing', 'Electronics', 'Footwear', 'Personal Care', 'Home Decor', 'Other'],
  },
  {
    name: 'Other',
    color: '#64748B',
    subcategories: ['Gifts/Donations', 'Taxes', 'Miscellaneous'],
  },
];


