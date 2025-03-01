import React from 'react';
import { Search, Filter } from 'lucide-react';
import type { SolutionCategory } from '../../templates/types';

interface SolutionsHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: SolutionCategory | 'all';
  onCategoryChange: (category: SolutionCategory | 'all') => void;
  categories: SolutionCategory[];
}

export function SolutionsHeader({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories
}: SolutionsHeaderProps) {
  return (
    <div className="flex flex-col space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-cyber-blue">
          AI Assistant Solutions
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Bar */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search solutions..."
            className="w-full pl-10 pr-4 py-2 bg-navy-800/50 rounded-lg border border-cyber-blue/20 focus:outline-none focus:border-cyber-blue"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value as SolutionCategory | 'all')}
            className="px-4 py-2 bg-navy-800/50 rounded-lg border border-cyber-blue/20 focus:outline-none focus:border-cyber-blue"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
