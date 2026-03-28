import type { KnowledgeDocument } from '../types';

export const DEFAULT_KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: '1',
    title: 'REST API Design Best Practices',
    excerpt:
      'When designing REST APIs, it is crucial to follow established conventions and best practices. Use clear resource naming, implement proper versioning, and ensure consistent response formats...',
    keywords: ['API', 'REST', 'design', 'best practices'],
    relevance: 98,
    source: 'Engineering Wiki',
    date: '2026-03-15',
  },
  {
    id: '2',
    title: 'API Versioning Strategies',
    excerpt:
      'There are several approaches to API versioning: URL versioning, header versioning, and query parameter versioning. Each has its own advantages and trade-offs...',
    keywords: ['API', 'versioning', 'strategies'],
    relevance: 95,
    source: 'Technical Documentation',
    date: '2026-03-10',
  },
  {
    id: '3',
    title: 'HTTP Methods and Status Codes',
    excerpt:
      'Understanding HTTP methods (GET, POST, PUT, DELETE, PATCH) and their appropriate use is fundamental to RESTful API design. Status codes should accurately reflect the outcome...',
    keywords: ['HTTP', 'methods', 'status codes', 'REST'],
    relevance: 92,
    source: 'Development Guide',
    date: '2026-03-08',
  },
  {
    id: '4',
    title: 'API Security and Authentication',
    excerpt:
      'Securing your API endpoints is paramount. Implement OAuth 2.0, JWT tokens, or API keys depending on your use case. Always use HTTPS and validate input data...',
    keywords: ['API', 'security', 'authentication', 'OAuth'],
    relevance: 89,
    source: 'Security Handbook',
    date: '2026-03-05',
  },
  {
    id: '5',
    title: 'Error Handling in APIs',
    excerpt:
      'Provide clear, actionable error messages with appropriate status codes. Include error codes, descriptions, and suggestions for resolution when possible...',
    keywords: ['error handling', 'API', 'best practices'],
    relevance: 87,
    source: 'Engineering Wiki',
    date: '2026-03-01',
  },
  {
    id: '6',
    title: 'API Documentation Standards',
    excerpt:
      'Well-documented APIs are easier to use and maintain. Use OpenAPI/Swagger specifications, provide code examples, and keep documentation up to date...',
    keywords: ['documentation', 'API', 'OpenAPI', 'Swagger'],
    relevance: 84,
    source: 'Documentation Guide',
    date: '2026-02-28',
  },
  {
    id: '7',
    title: 'Rate Limiting and Throttling',
    excerpt:
      'Implement rate limiting to protect your API from abuse and ensure fair usage. Common strategies include token bucket and sliding window algorithms...',
    keywords: ['rate limiting', 'API', 'throttling'],
    relevance: 81,
    source: 'Infrastructure Docs',
    date: '2026-02-25',
  },
  {
    id: '8',
    title: 'API Performance Optimization',
    excerpt:
      'Optimize API performance through caching, pagination, field filtering, and compression. Monitor response times and implement CDNs where appropriate...',
    keywords: ['performance', 'optimization', 'API', 'caching'],
    relevance: 78,
    source: 'Performance Guide',
    date: '2026-02-20',
  },
];

const scoreDocument = (document: KnowledgeDocument, query: string) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return document.relevance;
  }

  const haystack = [
    document.title,
    document.excerpt,
    document.source,
    ...document.keywords,
  ]
    .join(' ')
    .toLowerCase();

  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  const matches = queryTerms.reduce((count, term) => {
    return haystack.includes(term) ? count + 1 : count;
  }, 0);

  return document.relevance + matches * 8;
};

export const buildKnowledgeResults = (query: string) => {
  return [...DEFAULT_KNOWLEDGE_DOCUMENTS]
    .map((document) => ({
      ...document,
      relevance: Math.min(scoreDocument(document, query), 99),
    }))
    .sort((left, right) => right.relevance - left.relevance)
    .slice(0, 6);
};
