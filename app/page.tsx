'use client';

import { useCallback, useState } from 'react';
import ChatPanel from './components/chatPanel';
import ResultsPanel from './components/resultsPanel';
import Sidebar from './components/sidebar';
import { DEFAULT_KNOWLEDGE_DOCUMENTS } from './lib/mockKnowledge';
import type { Conversation, KnowledgeDocument, Message } from './types';

const createConversation = (): Conversation => ({
  id: crypto.randomUUID(),
  title: 'New conversation',
  updatedAt: new Date().toISOString(),
  messages: [],
  documents: DEFAULT_KNOWLEDGE_DOCUMENTS,
});

const getConversationTitle = (messages: Message[]) => {
  const firstUserMessage = messages.find((message) => message.sender === 'user');

  if (!firstUserMessage) {
    return 'New conversation';
  }

  const normalizedTitle = firstUserMessage.content.replace(/\s+/g, ' ').trim();
  return normalizedTitle.slice(0, 36) || 'New conversation';
};

const formatRelativeTime = (timestamp: string) => {
  const elapsed = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.max(1, Math.floor(elapsed / 60000));

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const initialConversation = createConversation();
    return [initialConversation];
  });
  const [activeConversationId, setActiveConversationId] = useState(
    () => conversations[0]?.id ?? '',
  );

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  ) ?? conversations[0];

  const updateActiveConversation = useCallback((
    updater: (conversation: Conversation) => Conversation,
  ) => {
    setConversations((previousConversations) =>
      previousConversations.map((conversation) =>
        conversation.id === activeConversationId
          ? updater(conversation)
          : conversation,
      ),
    );
  }, [activeConversationId]);

  const handleMessagesChange = useCallback((
    updater: (messages: Message[]) => Message[],
  ) => {
    updateActiveConversation((conversation) => {
      const nextMessages = updater(conversation.messages);

      return {
        ...conversation,
        messages: nextMessages,
        title: getConversationTitle(nextMessages),
        updatedAt: new Date().toISOString(),
      };
    });
  }, [updateActiveConversation]);

  const handleDocumentsChange = useCallback((documents: KnowledgeDocument[]) => {
    updateActiveConversation((conversation) => ({
      ...conversation,
      documents,
      updatedAt: new Date().toISOString(),
    }));
  }, [updateActiveConversation]);

  const handleNewChat = useCallback(() => {
    const nextConversation = createConversation();

    setConversations((previousConversations) => [
      nextConversation,
      ...previousConversations,
    ]);
    setActiveConversationId(nextConversation.id);
  }, []);

  const handleSelectConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
  }, []);

  if (!activeConversation) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 xl:h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col xl:grid xl:h-screen xl:grid-cols-[16rem_minmax(0,1fr)_24rem]">
        <aside className="border-b border-gray-200 bg-white xl:overflow-hidden xl:border-b-0 xl:border-r">
          <Sidebar
            conversations={conversations.map((conversation) => ({
              id: conversation.id,
              title: conversation.title,
              relativeTime: formatRelativeTime(conversation.updatedAt),
            }))}
            activeConversationId={activeConversation.id}
            onNewChat={handleNewChat}
            onSelectConversation={handleSelectConversation}
          />
        </aside>

        <section className="min-h-[60vh] bg-white xl:min-h-0 xl:overflow-hidden xl:border-r xl:border-gray-200">
          <ChatPanel
            key={activeConversation.id}
            messages={activeConversation.messages}
            onMessagesChange={handleMessagesChange}
            onDocumentsChange={handleDocumentsChange}
          />
        </section>

        <aside className="border-t border-gray-200 bg-gray-50 xl:overflow-hidden xl:border-t-0">
          <ResultsPanel
            key={activeConversation.id}
            documents={activeConversation.documents}
          />
        </aside>
      </div>
    </main>
  );
}
