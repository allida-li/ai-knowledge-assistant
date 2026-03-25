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
const UTF8_CHARSET = 'charset=utf-8';

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

const isTextFile = (file: File) => {
  if (file.type.startsWith('text/')) return true;

  return [
    'application/json',
    'application/xml',
    'application/javascript',
    'image/svg+xml',
  ].includes(file.type);
};

const toUtf8File = async (file: File) => {
  if (!isTextFile(file)) {
    return file;
  }

  const text = await file.text();
  const utf8Bytes = new TextEncoder().encode(text);
  const type = file.type
    ? `${file.type.split(';')[0]};${UTF8_CHARSET}`
    : `text/plain;${UTF8_CHARSET}`;

  return new File([utf8Bytes], file.name, {
    type,
    lastModified: file.lastModified,
  });
};

const ChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingQueueRef = useRef<Record<string, string>>({});
  const typingActiveRef = useRef<Record<string, boolean>>({});

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

    const normalizedFiles = await Promise.all(
      files.map(async ({ file }) => toUtf8File(file)),
    );

    normalizedFiles.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/api/uploadFiles`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('文件上传失败');
    }

    if (response.status === 200) {
      setMessages((prev) => [
        ...prev,
        createMessage('文件上传成功，可开始提问', 'bot'),
      ]);
    }
  };

  const uploadText = async (text: string) => {
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('文本上传失败');
    }

    if (response.status === 200) {
      setMessages((prev) => [
        ...prev,
        createMessage('文档已准备完成，可以开始提问', 'bot'),
      ]);
    }
  };

  const appendToMessage = (messageId: string, chunk: string) => {
    if (!chunk) return;

    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId
          ? { ...message, content: `${message.content}${chunk}` }
          : message,
      ),
    );
  };

  const appendToMessageWithTyping = async (messageId: string, text: string, speed: number = 30) => {
    // Add text to queue
    typingQueueRef.current[messageId] = (typingQueueRef.current[messageId] ?? '') + text;

    // If typing is already active for this message, don't start another process
    if (typingActiveRef.current[messageId]) {
      return;
    }

    typingActiveRef.current[messageId] = true;

    // Process typing character by character
    while (typingQueueRef.current[messageId] && typingQueueRef.current[messageId].length > 0) {
      const char = typingQueueRef.current[messageId][0];
      typingQueueRef.current[messageId] = typingQueueRef.current[messageId].slice(1);

      appendToMessage(messageId, char);

      // Add small delay for typing effect
      await new Promise((resolve) => setTimeout(resolve, speed));
    }

    typingActiveRef.current[messageId] = false;
  };

  const parseNDJsonLine = (line: string) => {
    try {
      const parsed = JSON.parse(line) as {
        type?: string;
        delta?: string;
        answer?: string;
        content?: string;
      };

      // For streaming, only extract delta to avoid duplication
      if (parsed.type === 'delta' && parsed.delta) {
        return parsed.delta;
      }

      // Skip 'done' and 'start' types - they shouldn't add content
      // Only return content if there's no type specified (fallback for non-streaming)
      if (!parsed.type && (parsed.answer || parsed.content)) {
        return parsed.answer ?? parsed.content ?? '';
      }

      // Skip all other types (done, start, etc.)
      return '';
    } catch {
      return line;
    }
  };

  const sendChatMessage = async (content: string) => {
    const userMessage = createMessage(content, 'user');
    const botMessage = createMessage('', 'bot');

    setMessages((prev) => [...prev, userMessage]);

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ question: content, stream: true }),
    });

    if (!response.ok) {
      throw new Error('请求失败');
    }

    setMessages((prev) => [...prev, botMessage]);

    if (!response.body) {
      const text = await response.text();
      appendToMessage(botMessage.id, text || '暂时没有获取到回复，请稍后再试。');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    const contentType = response.headers.get('content-type') ?? '';
    let pendingChunk = '';
    let accumulatedAnswer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        pendingChunk += decoder.decode(value, { stream: true });

        if (contentType.includes('application/x-ndjson')) {
          // Split by newline and process complete lines
          const lines = pendingChunk.split('\n');
          // Keep the last incomplete line in pendingChunk
          pendingChunk = lines.pop() ?? '';

          lines.forEach((line) => {
            if (line.trim()) {
              const parsed = JSON.parse(line) as {
                type?: string;
                delta?: string;
                answer?: string;
              };

              // For delta messages, extract only the new content and add with typing effect
              if (parsed.type === 'delta' && parsed.delta) {
                void appendToMessageWithTyping(botMessage.id, parsed.delta, 20);
                accumulatedAnswer += parsed.delta;
              }
              // For done messages, ensure complete answer is added if it's longer
              else if (parsed.type === 'done' && parsed.answer) {
                if (parsed.answer.length > accumulatedAnswer.length) {
                  // If the final answer is longer, append the missing part with typing effect
                  const missingPart = parsed.answer.slice(accumulatedAnswer.length);
                  if (missingPart) {
                    void appendToMessageWithTyping(botMessage.id, missingPart, 20);
                  }
                }
              }
            }
          });

          continue;
        }

        if (contentType.includes('text/event-stream')) {
          // Handle SSE format if needed
          const events = pendingChunk.split('\n\n');
          pendingChunk = events.pop() ?? '';

          events.forEach((eventChunk) => {
            const lines = eventChunk
              .split('\n')
              .filter((line) => line.startsWith('data:'))
              .map((line) => line.slice(5).trimStart());

            lines.forEach((line) => {
              if (line && line !== '[DONE]') {
                const text = parseNDJsonLine(line);
                if (text) {
                  void appendToMessageWithTyping(botMessage.id, text, 20);
                }
              }
            });
          });

          continue;
        }

        // Fallback: append raw chunk with typing effect
        if (pendingChunk) {
          void appendToMessageWithTyping(botMessage.id, pendingChunk, 20);
          pendingChunk = '';
        }
      }

      // Handle any remaining data
      const finalChunk = decoder.decode();
      if (finalChunk) {
        pendingChunk += finalChunk;
      }

      if (pendingChunk.trim()) {
        const text = parseNDJsonLine(pendingChunk);
        if (text) {
          void appendToMessageWithTyping(botMessage.id, text, 20);
        }
      }
    } catch (error) {
      console.error('Stream reading error:', error);
      appendToMessage(botMessage.id, '流式读取出错，请重试。');
    }
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
