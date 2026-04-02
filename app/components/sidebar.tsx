import {
  ChevronDown,
  Database,
  History,
  LogOut,
  Plus,
  Settings,
  Sparkles,
  User,
} from 'lucide-react';
import { useState } from 'react';

interface SidebarConversation {
  id: string;
  title: string;
  relativeTime: string;
}

interface SidebarProps {
  conversations: SidebarConversation[];
  activeConversationId: string;
  onNewChat: () => void;
  onSelectConversation: (conversationId: string) => void;
}

const Sidebar = ({
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
}: SidebarProps) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="h-full bg-gradient-to-b from-gray-50 to-white">
      <div className="sidebar-mobile-brand flex items-center gap-3 px-4 py-4 sm:px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
          <Sparkles className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-[0.08em] text-gray-900 ">
            Aida Assistant
          </p>
          <p className="text-xs text-gray-500">Knowledge workspace</p>
        </div>
      </div>

      <div className="sidebar-desktop h-full flex-col">
        <div className="px-4 py-5 sm:px-5 sm:py-6">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
              <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold text-gray-900">Aida Assistant</span>
          </div>

          <button
            type="button"
            onClick={onNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-600 active:scale-95"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        <div className="px-4 pb-4 sm:px-5">
          <button
            type="button"
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-100"
          >
            <Database className="h-5 w-5 text-gray-500 transition-colors group-hover:text-orange-600" />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">Knowledge Base</span>
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden px-4 sm:px-5">
          <div className="mb-2 flex items-center gap-2 px-3 py-2">
            <History className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              History
            </span>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto pr-1">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`group flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${isActive
                    ? 'border-orange-100 bg-orange-50'
                    : 'border-transparent hover:bg-gray-50'
                    }`}
                >
                  <History
                    className={`mt-0.5 h-4 w-4 flex-shrink-0 ${isActive
                      ? 'text-orange-600'
                      : 'text-gray-400 group-hover:text-gray-600'
                      }`}
                  />
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p
                      className={`truncate text-sm ${isActive ? 'font-medium text-gray-900' : 'text-gray-700'
                        }`}
                    >
                      {conversation.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {conversation.relativeTime}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-gray-100 bg-white p-4 sm:p-5">
          <div
            className="group relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-50"
            onMouseEnter={() => setShowUserMenu(true)}
            onMouseLeave={() => setShowUserMenu(false)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-md">
              <User className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-gray-900">Allida Li</p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-hover:rotate-180 group-hover:text-gray-600" />

            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 z-10 mb-2 rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4 text-gray-600" strokeWidth={2.5} />
                  <span className="text-sm text-gray-700">Settings</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4 text-gray-600" strokeWidth={2.5} />
                  <span className="text-sm text-gray-700">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
