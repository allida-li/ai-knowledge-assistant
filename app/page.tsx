'use client';

import { useEffect, useState } from 'react';
import ChatMessage from './components/chatMessage';
import ChatInput from './components/chatPanel';
import ChatBoxDashboard from './components/chatPanel';
import Sidebar from './components/sidebar';
import ResultsPanel from './components/resultsPanel';
import ChatPanel from './components/chatPanel';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
  id: 'initial-bot-message',
  text: '你好！我是AI助手，有什么可以帮你的吗？',
  sender: 'bot',
  timestamp: new Date(0),
};

const createMessage = (
  text: string,
  sender: Message['sender'],
): Message => ({
  id: crypto.randomUUID(),
  text,
  sender,
  timestamp: new Date(),
});

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [docText, setDocText] = useState('');

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0].id !== INITIAL_MESSAGE.id) {
        return prev;
      }

      return [
        {
          ...INITIAL_MESSAGE,
          timestamp: new Date(),
        },
      ];
    });
  }, []);

  const handleSendMessage = async (messageText: string) => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || isLoading) return;

    setMessages((prev) => [...prev, createMessage(trimmedMessage, 'user')]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: trimmedMessage }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        createMessage(data.answer ?? '暂时没有获取到回复，请稍后再试。', 'bot'),
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        createMessage('发送消息失败，请检查服务是否启动后重试。', 'bot'),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  const uploadDoc = async () => {
    await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: docText }),
    });

    alert('上传成功');
  };
  return (
    // <main className="flex h-screen flex-col">
    //   {/* 头部 */}
    //   <div className="flex items-center justify-between border-b bg-white px-6 py-4">
    //     <h1 className="text-xl font-semibold text-gray-800">AI 聊天助手</h1>
    //     {/* 文档上传区域 */}
    //     <textarea
    //       value={docText}
    //       onChange={(e) => setDocText(e.target.value)}
    //       placeholder="粘贴你的文档内容"
    //     />
    //     <button onClick={uploadDoc}>上传文档</button>
    //     <button
    //       onClick={handleNewChat}
    //       className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    //     >
    //       新对话
    //     </button>
    //   </div>

    //   {/* 消息列表 */}
    //   <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
    //     <div className="mx-auto max-w-4xl space-y-4">
    //       {messages.map((message) => (
    //         <ChatMessage key={message.id} message={message} />
    //       ))}
    //       {isLoading && (
    //         <div className="flex justify-start">
    //           <div className="rounded-lg bg-white p-4 shadow-sm">
    //             <div className="flex space-x-2">
    //               <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
    //               <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.2s' }}></div>
    //               <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.4s' }}></div>
    //             </div>
    //           </div>
    //         </div>
    //       )}
    //     </div>
    //   </div>

    //   {/* 输入区域 */}
    //   <div className="border-t bg-white p-4">
    //     <div className="mx-auto max-w-4xl">
    //       <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    //     </div>
    //   </div>
    // </main>
       <div className="size-full flex bg-gray-50 min-w-[1440px] max-h-screen overflow-scroll">
      {/* Sidebar - 256px fixed width */}
      <div className="w-64 bg-white flex-shrink-0">
        <Sidebar />
      </div>

      {/* Left Panel - Chat - flexible width */}
      <div className="flex-1 bg-white border-r border-transparent">
        <ChatPanel />
      </div>

      {/* Right Panel - Knowledge Results - 420px fixed width */}
      <div className="w-[420px] bg-gray-50 flex-shrink-0">
        <ResultsPanel />
      </div>
    </div>
  );
}
