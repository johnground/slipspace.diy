import React, { useState, useEffect } from 'react';
import type { SolutionTemplate, SolutionCategory } from '../templates/types';
import { AssistantWizard } from './AssistantWizard';
import { SolutionCard } from './solutions/SolutionCard';
import { SolutionsHeader } from './solutions/SolutionsHeader';
import { SOLUTION_TEMPLATES } from '../templates/solutionTemplates';

interface SolutionsProps {
  userId: string;
  isAdmin: boolean;
  onSelectTemplate?: (template: SolutionTemplate) => void;
}

const CATEGORIES: SolutionCategory[] = [
  'Business & Productivity',
  'Development & Technical',
  'Creative & Content',
  'Education & Learning',
  'Customer Service',
  'Data Analysis'
];

export function Solutions({ userId, isAdmin, onSelectTemplate }: SolutionsProps) {
  const [templates, setTemplates] = useState<SolutionTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SolutionCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<SolutionTemplate | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  useEffect(() => {
    // In a real app, we would fetch from an API
    setTemplates(SOLUTION_TEMPLATES);
  }, []);

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.useCase.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (template: SolutionTemplate) => {
    setSelectedTemplate(template);
    setIsWizardOpen(true);
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white p-6" id="solutions">
      {isWizardOpen && selectedTemplate ? (
        <AssistantWizard
          userId={userId}
          isAdmin={isAdmin}
          initialTemplate={selectedTemplate}
          onComplete={(assistant) => {
            setIsWizardOpen(false);
            onSelectTemplate?.(selectedTemplate);
          }}
          onClose={() => setIsWizardOpen(false)}
        />
      ) : (
        <div className="max-w-7xl mx-auto">
          <SolutionsHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={CATEGORIES}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {filteredTemplates.map((template) => (
              <SolutionCard
                key={template.id}
                template={template}
                onUse={handleUseTemplate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
