import { Search, FileText, Filter } from 'lucide-react';
import { DocumentCard } from './documentCard';

interface Document {
  id: string;
  title: string;
  excerpt: string;
  keywords: string[];
  relevance: number;
  source: string;
  date: string;
}

const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'REST API Design Best Practices',
    excerpt: 'When designing REST APIs, it is crucial to follow established conventions and best practices. Use clear resource naming, implement proper versioning, and ensure consistent response formats...',
    keywords: ['API', 'REST', 'design', 'best practices'],
    relevance: 98,
    source: 'Engineering Wiki',
    date: '2026-03-15',
  },
  {
    id: '2',
    title: 'API Versioning Strategies',
    excerpt: 'There are several approaches to API versioning: URL versioning, header versioning, and query parameter versioning. Each has its own advantages and trade-offs...',
    keywords: ['API', 'versioning', 'strategies'],
    relevance: 95,
    source: 'Technical Documentation',
    date: '2026-03-10',
  },
  {
    id: '3',
    title: 'HTTP Methods and Status Codes',
    excerpt: 'Understanding HTTP methods (GET, POST, PUT, DELETE, PATCH) and their appropriate use is fundamental to RESTful API design. Status codes should accurately reflect the outcome...',
    keywords: ['HTTP', 'methods', 'status codes', 'REST'],
    relevance: 92,
    source: 'Development Guide',
    date: '2026-03-08',
  },
  {
    id: '4',
    title: 'API Security and Authentication',
    excerpt: 'Securing your API endpoints is paramount. Implement OAuth 2.0, JWT tokens, or API keys depending on your use case. Always use HTTPS and validate input data...',
    keywords: ['API', 'security', 'authentication', 'OAuth'],
    relevance: 89,
    source: 'Security Handbook',
    date: '2026-03-05',
  },
  {
    id: '5',
    title: 'Error Handling in APIs',
    excerpt: 'Provide clear, actionable error messages with appropriate status codes. Include error codes, descriptions, and suggestions for resolution when possible...',
    keywords: ['error handling', 'API', 'best practices'],
    relevance: 87,
    source: 'Engineering Wiki',
    date: '2026-03-01',
  },
  {
    id: '6',
    title: 'API Documentation Standards',
    excerpt: 'Well-documented APIs are easier to use and maintain. Use OpenAPI/Swagger specifications, provide code examples, and keep documentation up to date...',
    keywords: ['documentation', 'API', 'OpenAPI', 'Swagger'],
    relevance: 84,
    source: 'Documentation Guide',
    date: '2026-02-28',
  },
  {
    id: '7',
    title: 'Rate Limiting and Throttling',
    excerpt: 'Implement rate limiting to protect your API from abuse and ensure fair usage. Common strategies include token bucket and sliding window algorithms...',
    keywords: ['rate limiting', 'API', 'throttling'],
    relevance: 81,
    source: 'Infrastructure Docs',
    date: '2026-02-25',
  },
  {
    id: '8',
    title: 'API Performance Optimization',
    excerpt: 'Optimize API performance through caching, pagination, field filtering, and compression. Monitor response times and implement CDNs where appropriate...',
    keywords: ['performance', 'optimization', 'API', 'caching'],
    relevance: 78,
    source: 'Performance Guide',
    date: '2026-02-20',
  },
];

const ResultsPanel = () => {
  return (
    <div className="h-full flex flex-col">
      {/* Header - padding: 20px */}
      <div className="p-5 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" strokeWidth={2.5} />
            <h2 className="font-semibold text-gray-900">Knowledge Results</h2>
            <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
              {mockDocuments.length}
            </span>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Filter className="w-4 h-4 text-gray-600" strokeWidth={2.5} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter results..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm"
          />
        </div>
      </div>

      {/* Results - padding: 20px */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {mockDocuments.map((doc) => (
          <DocumentCard key={doc.id} document={doc} />
        ))}
      </div>
    </div>
  );
}

export default ResultsPanel;