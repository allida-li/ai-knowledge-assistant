export interface MessageAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string;
  isThinking?: boolean;
  attachments?: MessageAttachment[];
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  excerpt: string;
  keywords: string[];
  relevance: number;
  source: string;
  date: string;
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: Message[];
  documents: KnowledgeDocument[];
}

export type ComposerMode = 'ask' | 'ingest';
