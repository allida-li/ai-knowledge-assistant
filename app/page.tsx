'use client';

import { useState } from 'react';
import ChatMessage from './components/chatMessage';
import ChatInput from './components/chatInput';


interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '你好！我是AI助手，有什么可以帮你的吗？',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState([]);
  const [docText, setDocText] = useState("");

  const handleSendMessage = async (messageText: string) => {
    if (!question) return;

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // request the local api route to get the answer
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: messageText }),
    });
    const data = await response.json();

    // 添加机器人回复消息
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: data.answer,
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMessage]);
    setIsLoading(false);

  };

  const handleNewChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        text: '你好！我是AI助手，有什么可以帮你的吗？',
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
  };


  const uploadDoc = async () => {
    await fetch("http://localhost:3001/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: docText })
    });

    alert("上传成功");
  };
  return (
    <main className="flex h-screen flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-800">AI 聊天助手</h1>
        {/* 文档上传区域 */}
        <textarea
          value={docText}
          onChange={(e) => setDocText(e.target.value)}
          placeholder="粘贴你的文档内容"
        />

<button onClick={uploadDoc}>上传文档</button>
        <button
          onClick={handleNewChat}
          className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          新对话
        </button>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <div className="mx-auto max-w-4xl space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 输入区域 */}
      <div className="border-t bg-white p-4">
        <div className="mx-auto max-w-4xl">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </main>
  );
}