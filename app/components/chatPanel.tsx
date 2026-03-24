import { useRef, useState } from 'react';
import {
  ArrowUp,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Sparkles,
  X,
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

const API_BASE_URL = 'http://localhost:3001';

const createMessage = (
  content: string,
  sender: Message['sender'],
): Message => ({
  id: crypto.randomUUID(),
  sender,
  content,
  timestamp: new Date(),
});

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (type: string) =>
  type.startsWith('image/') ? ImageIcon : FileText;

const ChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasStartedConversation = messages.length > 0;

  const resetComposer = () => {
    setInput('');
    setUploadedFiles([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFiles = async (files: UploadedFile[]) => {
    const formData = new FormData();

    files.forEach(({ file }) => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/api/uploadFiles`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('文件上传失败');
    }
  };

  const uploadText = async (text: string) => {
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('文本上传失败');
    }
  };

  const sendChatMessage = async (content: string) => {
    const userMessage = createMessage(content, 'user');
    setMessages((prev) => [...prev, userMessage]);

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: content }),
    });

    if (!response.ok) {
      throw new Error('请求失败');
    }

    const data = await response.json();
    setMessages((prev) => [
      ...prev,
      createMessage(data.answer ?? '暂时没有获取到回复，请稍后再试。', 'bot'),
    ]);
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput && uploadedFiles.length === 0) return;

    setIsLoading(true);

    try {
      if (uploadedFiles.length > 0) {
        await uploadFiles(uploadedFiles);
        resetComposer();
        return;
      }

      if (trimmedInput.length > 100) {
        await uploadText(trimmedInput);
        resetComposer();
        return;
      }

      await sendChatMessage(trimmedInput);
      resetComposer();
    } catch {
      setMessages((prev) => [
        ...prev,
        createMessage('发送消息失败，请检查服务是否启动后重试。', 'bot'),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  return (
    <div className="flex h-full flex-col">
      {hasStartedConversation && (
        <div className="flex-1 space-y-6 overflow-y-auto px-[34px] py-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-3.5 ${message.sender === 'user'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-gray-100 text-gray-900'
                  }`}
              >
                <p className="whitespace-pre-line text-[15px] leading-relaxed">
                  {message.content}
                </p>
                <p
                  className={`mt-2 text-xs ${message.sender === 'user'
                    ? 'text-orange-100'
                    : 'text-gray-500'
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

      <div
        className={
          hasStartedConversation
            ? 'border-t border-transparent bg-white px-[34px] py-5'
            : 'flex flex-1 items-center justify-center px-[34px]'
        }
      >
        <div className={hasStartedConversation ? 'w-full' : 'w-full max-w-3xl'}>
          {!hasStartedConversation && (
            <div className="mb-8 text-center">
              <div className="mb-4 flex items-center justify-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
                  <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
                </div>
                <p className="text-base text-gray-600">Hi, there 👏</p>
              </div>

              <h1 className="text-2xl font-medium text-gray-900">
                How can we help?
              </h1>
            </div>
          )}

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
              onKeyDown={handleInputKeyDown}
              placeholder="Ask a question..."
              rows={hasStartedConversation ? 3 : 4}
              disabled={isLoading}
              className="w-full resize-none rounded-2xl border border-orange-400/40 bg-gray-50 px-5 py-4 pb-14 pr-24 text-[15px] transition-all focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-70"
            />

            {uploadedFiles.length > 0 && (
              <div className="absolute left-5 right-24 top-4 flex flex-wrap gap-2">
                {uploadedFiles.map((file) => {
                  const FileIcon = getFileIcon(file.type);

                  return (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 rounded-lg border border-orange-200 bg-white px-2.5 py-1.5 shadow-sm"
                    >
                      <FileIcon
                        className="h-3.5 w-3.5 text-orange-600"
                        strokeWidth={2.5}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="max-w-[120px] truncate text-xs font-medium text-gray-900">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="rounded p-0.5 transition-colors hover:bg-gray-100"
                      >
                        <X className="h-3 w-3 text-gray-600" strokeWidth={2.5} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="rounded-lg p-2.5 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                title="Attach file"
              >
                <Paperclip
                  className="h-5 w-5 text-gray-600 transition-colors hover:text-orange-600"
                  strokeWidth={2.5}
                />
              </button>

              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
                className="rounded-full bg-orange-400 p-2.5 text-white transition-all active:scale-95 hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-orange-400 disabled:active:scale-100"
                title="Send message"
              >
                <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
