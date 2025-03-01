import { type ChatMessage } from '../lib/chat';

export type AssistantTone = 'professional' | 'friendly' | 'technical';

export interface APIProvider {
  id: string;
  name: string;
  apiKey?: string;
  models: string[];
  baseUrl?: string;
}

export interface AssistantConfig {
  enableModelSelection: boolean;
  enableChatHistory: boolean;
  enableFileUploads: boolean;
  providers: APIProvider[];
  defaultProvider: string;
  defaultModel: string;
}

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  isComplete: boolean;
  component: React.ComponentType<WizardStepProps>;
}

export interface WizardStepProps {
  data: Partial<AssistantTemplate>;
  onUpdate: (updates: Partial<AssistantTemplate>) => void;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
}

export interface WizardState {
  currentStep: number;
  template: Partial<AssistantTemplate>;
  isPreviewEnabled: boolean;
}

export interface AssistantSelectionState {
  savedAssistants: SavedAssistant[];
  selectedAssistantId: string | null;
  isWizardOpen: boolean;
}

export interface AssistantTemplate {
  id: string;
  title: string;
  systemPrompt: string;
  initialMessage: string;
  model: string;
  tone: AssistantTone;
  expertise: string[];
  customInstructions?: string;
  metadata?: Record<string, unknown>;
  created_by: string;
  isPublic: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavedAssistant extends AssistantTemplate {
  isFavorite: boolean;
  lastUsed: string | null;
}

export interface AssistantState {
  isOpen: boolean;
  isMinimized: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
}

export interface AssistantActions {
  sendMessage: (message: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  configure: () => void;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

export interface AssistantContext {
  userId: string;
  isAdmin: boolean;
  template: AssistantTemplate;
  state: AssistantState;
  actions: AssistantActions;
}

export type SolutionCategory = 
  | 'Business & Productivity'
  | 'Development & Technical'
  | 'Creative & Content'
  | 'Education & Learning'
  | 'Customer Service'
  | 'Data Analysis';

export type ComplexityLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface SolutionTemplate extends Omit<AssistantTemplate, 'id'> {
  id: string;
  category: SolutionCategory;
  useCase: string;
  benefits: string[];
  setupTime: string;
  complexity: ComplexityLevel;
  description: string;
  requirements?: string[];
  featured?: boolean;
}

export interface SolutionsState {
  templates: SolutionTemplate[];
  selectedCategory: SolutionCategory | 'all';
  searchQuery: string;
  selectedTemplate: SolutionTemplate | null;
}
