export interface AITool {
  id: string;
  label: string;
  description: string;
  category: 'quick' | 'rewrite' | 'tone';
  prompt: string;
}

export const AI_TOOLS: AITool[] = [
  // Quick section
  {
    id: 'explain',
    label: 'Explain',
    description: 'Get an in-depth, simplified explanation',
    category: 'quick',
    prompt: 'Please provide a detailed, simplified explanation of the following:'
  },
  
  // Rewrite section
  {
    id: 'paraphrase',
    label: 'Paraphrase',
    description: 'Rewrite in different words',
    category: 'rewrite',
    prompt: 'Please paraphrase the following text while maintaining its original meaning:'
  },
  {
    id: 'improve',
    label: 'Improve',
    description: 'Enhance clarity and quality',
    category: 'rewrite',
    prompt: 'Please improve the following text for better clarity, flow, and quality:'
  },
  {
    id: 'expand',
    label: 'Expand',
    description: 'Add more detail and depth',
    category: 'rewrite',
    prompt: 'Please expand the following text with more details, examples, and depth:'
  },
  {
    id: 'shorten',
    label: 'Shorten',
    description: 'Make it more concise',
    category: 'rewrite',
    prompt: 'Please shorten the following text while keeping the key points:'
  },
  
  // Tone section
  {
    id: 'academic',
    label: 'Academic',
    description: 'Formal, scholarly tone',
    category: 'tone',
    prompt: 'Please rewrite the following in an academic, scholarly tone:'
  },
  {
    id: 'professional',
    label: 'Professional',
    description: 'Business-appropriate tone',
    category: 'tone',
    prompt: 'Please rewrite the following in a professional, business-appropriate tone:'
  },
  {
    id: 'persuasive',
    label: 'Persuasive',
    description: 'Convincing and compelling',
    category: 'tone',
    prompt: 'Please rewrite the following in a persuasive, compelling tone:'
  },
  {
    id: 'casual',
    label: 'Casual',
    description: 'Relaxed, conversational tone',
    category: 'tone',
    prompt: 'Please rewrite the following in a casual, conversational tone:'
  },
  {
    id: 'funny',
    label: 'Funny',
    description: 'Add humor and wit',
    category: 'tone',
    prompt: 'Please rewrite the following with humor and wit while keeping the main message:'
  }
];

export const TOOL_CATEGORIES = {
  quick: 'Quick',
  rewrite: 'Rewrite',
  tone: 'Change Tone'
} as const;