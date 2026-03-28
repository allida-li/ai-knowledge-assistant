import { FileText, Filter, Search } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { DocumentCard } from './documentCard';
import type { KnowledgeDocument } from '../types';

interface ResultsPanelProps {
  documents: KnowledgeDocument[];
}

const ResultsPanel = ({ documents }: ResultsPanelProps) => {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filteredDocuments = documents.filter((document) => {
    if (!normalizedQuery) {
      return true;
    }

    return [
      document.title,
      document.excerpt,
      document.source,
      ...document.keywords,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery);
  });

  return (
    <div className="flex h-full min-h-[24rem] flex-col">
      <div className="border-b border-gray-100 bg-white/80 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" strokeWidth={2.5} />
            <h2 className="font-semibold text-gray-900">Knowledge Results</h2>
            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
              {filteredDocuments.length}
            </span>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          >
            <Filter className="h-4 w-4 text-gray-600" strokeWidth={2.5} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter results..."
            className="w-full rounded-xl border-0 bg-gray-50 py-2.5 pl-10 pr-4 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-6 text-sm text-gray-500">
            No matching results yet. Upload knowledge or ask a narrower question.
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPanel;
