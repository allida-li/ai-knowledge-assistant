import { useState, FormEvent, KeyboardEvent, useRef } from 'react';
import { Send, Sparkles, Paperclip, X, FileText, Image as ImageIcon, ArrowUp } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

// export default function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
//   const [input, setInput] = useState('');

//   const handleSubmit = (e: FormEvent) => {
//     e.preventDefault();
//     if (input.trim() && !isLoading) {
//       onSendMessage(input.trim());
//       setInput('');
//     }
//   };

//   const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSubmit(e);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="flex items-end space-x-2">
//       <div className="flex-1">
//         <textarea
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyDown={handleKeyDown}
//           placeholder="输入消息... (Shift + Enter 换行)"
//           disabled={isLoading}
//           rows={1}
//           className="max-h-32 w-full resize-none rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
//         />
//       </div>
//       <button
//         type="submit"
//         disabled={isLoading || !input.trim()}
//         className="rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
//       >
//         发送
//       </button>
//     </form>
//   );
// }

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

const ChatPanel= () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!input.trim() && uploadedFiles.length === 0) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInput('');
    setUploadedFiles([]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Searching the knowledge base for relevant information...',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 500);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(uploadedFiles.filter((f) => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    return FileText;
  };

  const hasStartedConversation = messages.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Messages - only show when conversation has started - horizontal padding: 34px */}
      {hasStartedConversation && (
        <div className="flex-1 overflow-y-auto px-[34px] py-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-3.5 ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-[15px] leading-relaxed whitespace-pre-line">{message.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-orange-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input Area - horizontal padding: 34px when conversation started */}
      <div className={`${hasStartedConversation ? 'px-[34px] py-5 border-t border-transparent bg-white' : 'flex-1 flex items-center justify-center px-[34px]'}`}>
        <div className={`${hasStartedConversation ? 'w-full' : 'w-full max-w-3xl'}`}>
          {/* Welcome Message - only show when no conversation */}
          {!hasStartedConversation && (
            <div className="text-center mb-8">
              {/* Logo and Greeting in one line */}
              <div className="flex items-center justify-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <p className="text-base text-gray-600">
                  Hi, there 👏
                </p>
              </div>

              {/* Main question */}
              <h1 className="text-2xl font-medium text-gray-900">
                How can we help?
              </h1>
            </div>
          )}

          {/* Input with embedded buttons */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask a question..."
              rows={hasStartedConversation ? 3 : 4}
              className="w-full px-5 py-4 pr-24 pb-14 bg-gray-50 border border-orange-400/40 rounded-2xl focus:outline-none focus:ring-0 focus:bg-white focus:border-orange-500 transition-all text-[15px] resize-none"
            />

            {/* Uploaded Files Preview - inside textarea */}
            {uploadedFiles.length > 0 && (
              <div className="absolute top-4 left-5 right-24 flex flex-wrap gap-2">
                {uploadedFiles.map((file) => {
                  const FileIcon = getFileIcon(file.type);
                  return (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-orange-200 rounded-lg shadow-sm"
                    >
                      <FileIcon className="w-3.5 h-3.5 text-orange-600" strokeWidth={2.5} />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900 truncate max-w-[120px]">
                          {file.name}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                      >
                        <X className="w-3 h-3 text-gray-600" strokeWidth={2.5} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Buttons container - bottom right */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 hover:bg-gray-200 rounded-lg transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5 text-gray-600 hover:text-orange-600 transition-colors" strokeWidth={2.5} />
              </button>

              <button
                onClick={handleSend}
                disabled={!input.trim() && uploadedFiles.length === 0}
                className="p-2.5 bg-orange-400 text-white rounded-full hover:bg-orange-500 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-orange-400 disabled:active:scale-100"
                title="Send message"
              >
                <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;