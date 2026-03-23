import { Plus, Database, Settings, User, ChevronDown, History, LogOut, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
  active?: boolean;
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    title: 'REST API Design Guidelines',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    active: true,
  },
  {
    id: '2',
    title: 'API Security Best Practices',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
  },
  {
    id: '3',
    title: 'HTTP Methods & Status Codes',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: '4',
    title: 'API Versioning Strategies',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
  {
    id: '5',
    title: 'Rate Limiting Implementation',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
  },
];

const Sidebar = () => {
  const [conversations] = useState<Conversation[]>(mockConversations);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* Header - padding-left: 16px, padding-right: 8px */}
      <div className="pl-4 pr-2 py-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-gray-900 text-lg">Aida Assistant</span>
        </div>

        {/* New Chat Button */}
        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/30 active:scale-95">
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          <span className="font-medium">New Chat</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="px-4 mb-4">
        <button className="w-full px-3 py-2.5 flex items-center gap-3 rounded-lg hover:bg-gray-100 transition-colors group">
          <Database className="w-5 h-5 text-gray-500 group-hover:text-orange-600 transition-colors" />
          <span className="text-sm text-gray-700 group-hover:text-gray-900">Knowledge Base</span>
        </button>
      </div>

      {/* History */}
      <div className="flex-1 overflow-hidden flex flex-col px-4">
        <div className="flex items-center gap-2 px-3 py-2 mb-2">
          <History className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">History</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-2 -mr-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              className={`w-full px-3 py-2.5 rounded-lg flex items-start gap-3 transition-all group ${
                conv.active
                  ? 'bg-orange-50 border border-orange-100'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <History
                className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  conv.active ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'
                }`}
              />
              <div className="flex-1 text-left overflow-hidden">
                <p
                  className={`text-sm truncate ${
                    conv.active ? 'text-gray-900 font-medium' : 'text-gray-700'
                  }`}
                >
                  {conv.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {getRelativeTime(conv.timestamp)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 bg-white">
        <div
          className="relative flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
          onMouseEnter={() => setShowUserMenu(true)}
          onMouseLeave={() => setShowUserMenu(false)}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-md">
            <User className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-gray-900">Alex Chen</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform group-hover:rotate-180" />

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-10">
              <button className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left">
                <Settings className="w-4 h-4 text-gray-600" strokeWidth={2.5} />
                <span className="text-sm text-gray-700">Settings</span>
              </button>
              <button className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left">
                <LogOut className="w-4 h-4 text-gray-600" strokeWidth={2.5} />
                <span className="text-sm text-gray-700">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;