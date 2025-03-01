import React from 'react';
import { Star, Clock, BookOpen, ChevronRight } from 'lucide-react';
import type { SolutionTemplate, ComplexityLevel } from '../../templates/types';

interface SolutionCardProps {
  template: SolutionTemplate;
  onUse: (template: SolutionTemplate) => void;
}

const COMPLEXITY_COLORS: Record<ComplexityLevel, string> = {
  'Beginner': 'text-green-400',
  'Intermediate': 'text-yellow-400',
  'Advanced': 'text-red-400'
};

export function SolutionCard({ template, onUse }: SolutionCardProps) {
  return (
    <div className="group relative bg-navy-800/50 rounded-lg border border-cyber-blue/20 hover:border-cyber-blue overflow-hidden transition-all duration-300">
      {template.featured && (
        <div className="absolute top-4 right-4">
          <Star className="h-6 w-6 text-cyber-orange fill-current" />
        </div>
      )}
      
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-cyber-blue group-hover:text-white transition-colors">
            {template.title}
          </h3>
          <p className="text-sm text-gray-400">
            {template.useCase}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-gray-400" />
            <span className={COMPLEXITY_COLORS[template.complexity]}>
              {template.complexity}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">
              Setup: {template.setupTime}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {template.expertise.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="px-2 py-1 text-xs bg-navy-700/50 rounded-full text-gray-300"
            >
              {skill}
            </span>
          ))}
          {template.expertise.length > 3 && (
            <span className="px-2 py-1 text-xs bg-navy-700/50 rounded-full text-gray-300">
              +{template.expertise.length - 3} more
            </span>
          )}
        </div>

        <button
          onClick={() => onUse(template)}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-cyber-blue/20 rounded-lg border border-cyber-blue text-cyber-blue hover:text-white group-hover:bg-cyber-blue/30 transition-all duration-300"
        >
          <span>Use Template</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
