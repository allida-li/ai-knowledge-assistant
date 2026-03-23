import { FileText, ExternalLink, Calendar, Folder } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  excerpt: string;
  keywords: string[];
  relevance: number;
  source: string;
  date: string;
}

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const highlightKeywords = (text: string, keywords: string[]) => {
    let highlighted = text;
    keywords.forEach((keyword) => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlighted = highlighted.replace(
        regex,
        '<mark class="bg-orange-100 text-orange-900 font-medium">$1</mark>'
      );
    });
    return highlighted;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-5 hover:shadow-xl hover:shadow-gray-200/50 hover:border-orange-200 transition-all cursor-pointer group">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-orange-50 transition-colors flex-shrink-0">
            <FileText className="w-4 h-4 text-gray-600 group-hover:text-orange-600" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors leading-snug truncate w-full">
              {document.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1 truncate max-w-[100px]">
                <Folder className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{document.source}</span>
              </span>
              <span className="flex items-center gap-1 flex-shrink-0">
                <Calendar className="w-3 h-3" />
                {new Date(document.date).toLocaleDateString('en-US')}
              </span>
            </div>
          </div>
        </div>

        {/* Relevance Score - Right Aligned */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <div className="text-right">
            <div className="text-xs text-gray-500 whitespace-nowrap">Relevance</div>
            <div className="text-sm font-semibold text-orange-600">
              {document.relevance}%
            </div>
          </div>
          <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-lg transition-all">
            <ExternalLink className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Excerpt */}
      <p
        className="text-sm text-gray-600 leading-relaxed mb-2 line-clamp-3"
        dangerouslySetInnerHTML={{
          __html: highlightKeywords(document.excerpt, document.keywords),
        }}
      />

      {/* Keywords */}
      <div className="flex flex-wrap gap-1.5">
        {document.keywords.map((keyword, index) => (
          <span
            key={index}
            className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-orange-50 hover:text-orange-700 transition-colors font-medium"
          >
            {keyword}
          </span>
        ))}
      </div>
    </div>
  );
}