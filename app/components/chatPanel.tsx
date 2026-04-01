import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import Image from 'next/image';
import {
  ArrowUp,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiUrl } from '../lib/api';
import pdfLogo from '../docs/images/pdf-logo.svg';
import {
  buildKnowledgeResults,
  buildKnowledgeResultsFromUploads,
} from '../lib/mockKnowledge';
import type {
  ComposerMode,
  KnowledgeDocument,
  Message,
  MessageAttachment,
} from '../types';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  file: File;
}

interface UploadFilePreview {
  mimetype: string;
  content: string;
  chunksAdded: number;
}

interface UploadFilesResponse {
  filePreviews?: UploadFilePreview[];
  markdown?: string;
}

interface UploadTextResponse {
  summary?: string;
  markdown?: string;
  answer?: string;
  content?: string;
}

interface ChatPanelProps {
  messages: Message[];
  onMessagesChange: (updater: (messages: Message[]) => Message[]) => void;
  onDocumentsChange: (documents: KnowledgeDocument[]) => void;
}

const UTF8_CHARSET = 'charset=utf-8';

const createMessage = (
  content: string,
  sender: Message['sender'],
  options?: Partial<Pick<Message, 'isThinking' | 'attachments'>>,
): Message => ({
  id: crypto.randomUUID(),
  sender,
  content,
  timestamp: new Date().toISOString(),
  ...options,
});

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (type: string) =>
  type.startsWith('image/') ? ImageIcon : FileText;

const isPdfFile = (type: string, name: string) =>
  type === 'application/pdf' || name.toLowerCase().endsWith('.pdf');

const createTextUploadDetails = (text: string) => text;

const createTextUploadSummary = (text: string) => {
  const normalizedText = text.trim().replace(/\s+/g, ' ');
  const summary = normalizedText.slice(0, 180);
  const suffix = normalizedText.length > 180 ? '...' : '';

  return `> ${summary || '未提取到可用摘要'}${suffix}\n`;
};

const getMarkdownSummaryFromResponse = (data: UploadTextResponse) => {
  return data.markdown ?? data.summary ?? data.answer ?? data.content ?? '';
};

const buildMarkdownFromUploadedFiles = (files: UploadFilePreview[]) => {
  return files
    .filter((file) => file.chunksAdded > 0 && file.content.trim())
    .map((file) =>
      file.content
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n'),
    )
    .join('\n\n');
};

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

const parseNDJsonLine = (line: string) => {
  try {
    const parsed = JSON.parse(line) as {
      type?: string;
      delta?: string;
      answer?: string;
      content?: string;
    };

    if (parsed.type === 'delta' && parsed.delta) {
      return parsed.delta;
    }

    if (!parsed.type && (parsed.answer || parsed.content)) {
      return parsed.answer ?? parsed.content ?? '';
    }

    return '';
  } catch {
    return line;
  }
};

const formatTimestamp = (timestamp: string) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

const toMessageAttachments = (files: UploadedFile[]): MessageAttachment[] =>
  files.map((file) => ({
    id: file.id,
    name: file.name,
    size: file.size,
    type: file.type,
  }));

const ChatPanel = ({
  messages,
  onMessagesChange,
  onDocumentsChange,
}: ChatPanelProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [composerMode, setComposerMode] = useState<ComposerMode>('ask');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const hasStartedConversation = messages.length > 0;
  const isUploadAction = composerMode === 'ingest' || uploadedFiles.length > 0;

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messages]);

  const updateMessages = (updater: (currentMessages: Message[]) => Message[]) => {
    onMessagesChange(updater);
  };

  const resetComposer = () => {
    setInput('');
    setUploadedFiles([]);
    setComposerMode('ask');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const appendToMessage = (messageId: string, chunk: string) => {
    if (!chunk) return;

    updateMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === messageId
          ? {
            ...message,
            content: message.isThinking ? chunk : `${message.content}${chunk}`,
            isThinking: false,
          }
          : message,
      ),
    );
  };

  const replaceMessageContent = (messageId: string, content: string) => {
    updateMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === messageId
          ? {
            ...message,
            content,
            isThinking: false,
          }
          : message,
      ),
    );
  };

  const uploadFiles = async (files: UploadedFile[]) => {
    const formData = new FormData();

    const normalizedFiles = await Promise.all(
      files.map(async ({ file }) => toUtf8File(file)),
    );

    normalizedFiles.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(apiUrl('/api/uploadFiles'), {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('文件上传失败');
    }

    const data = (await response.json()) as UploadFilesResponse;
    const markdownSummary = (
      buildMarkdownFromUploadedFiles(data.filePreviews ?? []) || data.markdown || ''
    ).trim();

    updateMessages((currentMessages) => [
      ...currentMessages,
      createMessage(markdownSummary || '未提取到可用内容。', 'bot'),
    ]);
    onDocumentsChange(buildKnowledgeResultsFromUploads(data.filePreviews ?? []));
  };

  const uploadText = async (text: string) => {
    const response = await fetch(apiUrl('/api/upload'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        text,
        responseFormat: 'markdown',
        summaryInstructions:
          'Read the uploaded text, understand the meaning, and return only a concise markdown summary. Prefer blockquote, short bullets, and short sections when helpful. Do not wrap the result in code fences.',
      }),
    });

    if (!response.ok) {
      throw new Error('文本上传失败');
    }

    const data = (await response.json()) as UploadTextResponse;
    const markdownSummary = getMarkdownSummaryFromResponse(data).trim();

    updateMessages((currentMessages) => [
      ...currentMessages,
      createMessage(markdownSummary || createTextUploadSummary(text), 'bot'),
    ]);
    onDocumentsChange(buildKnowledgeResults(text));
  };

  const sendChatMessage = async (content: string) => {
    const userMessage = createMessage(content, 'user');
    const botMessage = createMessage('', 'bot', { isThinking: true });

    updateMessages((currentMessages) => [...currentMessages, userMessage]);
    onDocumentsChange(buildKnowledgeResults(content));

    const response = await fetch(apiUrl('/api/chat'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ question: content, stream: true }),
    });

    if (!response.ok) {
      throw new Error('请求失败');
    }

    updateMessages((currentMessages) => [...currentMessages, botMessage]);

    if (!response.body) {
      const text = await response.text();
      appendToMessage(botMessage.id, text || '暂时没有获取到回复，请稍后再试。');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    const contentType = response.headers.get('content-type') ?? '';
    let pendingChunk = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        pendingChunk += decoder.decode(value, { stream: true });

        if (contentType.includes('application/x-ndjson')) {
          const lines = pendingChunk.split('\n');
          pendingChunk = lines.pop() ?? '';

          lines.forEach((line) => {
            if (!line.trim()) {
              return;
            }

            const parsed = JSON.parse(line) as {
              type?: string;
              delta?: string;
              answer?: string;
            };

            if (parsed.type === 'delta' && parsed.delta) {
              appendToMessage(botMessage.id, parsed.delta);
            } else if (parsed.type === 'done' && parsed.answer) {
              replaceMessageContent(botMessage.id, parsed.answer);
            }
          });

          continue;
        }

        if (contentType.includes('text/event-stream')) {
          const events = pendingChunk.split('\n\n');
          pendingChunk = events.pop() ?? '';

          events.forEach((eventChunk) => {
            const eventLines = eventChunk
              .split('\n')
              .filter((line) => line.startsWith('data:'))
              .map((line) => line.slice(5).trimStart());

            eventLines.forEach((line) => {
              if (line && line !== '[DONE]') {
                const text = parseNDJsonLine(line);
                if (text) {
                  appendToMessage(botMessage.id, text);
                }
              }
            });
          });

          continue;
        }

        if (pendingChunk) {
          appendToMessage(botMessage.id, pendingChunk);
          pendingChunk = '';
        }
      }

      const finalChunk = decoder.decode();
      if (finalChunk) {
        pendingChunk += finalChunk;
      }

      if (!pendingChunk.trim()) {
        return;
      }

      if (contentType.includes('application/x-ndjson')) {
        const parsed = JSON.parse(pendingChunk) as {
          type?: string;
          delta?: string;
          answer?: string;
        };

        if (parsed.type === 'delta' && parsed.delta) {
          appendToMessage(botMessage.id, parsed.delta);
        } else if (parsed.type === 'done' && parsed.answer) {
          replaceMessageContent(botMessage.id, parsed.answer);
        }

        return;
      }

      const text = parseNDJsonLine(pendingChunk);
      if (text) {
        appendToMessage(botMessage.id, text);
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
        const filesToUpload = uploadedFiles;

        updateMessages((currentMessages) => [
          ...currentMessages,
          createMessage('', 'user', {
            attachments: toMessageAttachments(filesToUpload),
          }),
        ]);

        resetComposer();
        await uploadFiles(filesToUpload);
        return;
      }

      if (composerMode === 'ingest') {
        updateMessages((currentMessages) => [
          ...currentMessages,
          createMessage(createTextUploadDetails(trimmedInput), 'user'),
        ]);
        await uploadText(trimmedInput);
        resetComposer();
        return;
      }

      await sendChatMessage(trimmedInput);
      resetComposer();
    } catch {
      updateMessages((currentMessages) => [
        ...currentMessages,
        createMessage('发送消息失败，请检查服务是否启动后重试。', 'bot'),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      file,
    }));

    setUploadedFiles((currentFiles) => {
      const seen = new Set(
        currentFiles.map((file) =>
          `${file.name}:${file.size}:${file.type}:${file.lastModified}`,
        ),
      );
      const uniqueNewFiles = newFiles.filter((file) => {
        const signature = `${file.name}:${file.size}:${file.type}:${file.lastModified}`;
        if (seen.has(signature)) {
          return false;
        }

        seen.add(signature);
        return true;
      });

      return [...currentFiles, ...uniqueNewFiles];
    });
    setComposerMode('ingest');
    event.target.value = '';
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((currentFiles) =>
      currentFiles.filter((file) => file.id !== fileId),
    );
  };

  const renderFileCards = (
    files: Array<Pick<MessageAttachment, 'id' | 'name' | 'size' | 'type'>>,
    options?: {
      removable?: boolean;
      onRemove?: (fileId: string) => void;
      className?: string;
      cardClassName?: string;
      iconClassName?: string;
      nameClassName?: string;
      sizeClassName?: string;
    },
  ) => (
    <div className={options?.className ?? 'flex flex-wrap gap-2'}>
      {files.map((file) => {
        const FileIcon = getFileIcon(file.type);
        const showPdfLogo = isPdfFile(file.type, file.name);
        const sharedCardBehavior =
          'h-[52px] border border-orange-400/40 bg-white shadow-sm transition-all hover:border-orange-500';
        const cardClassName = options?.cardClassName
          ?? (showPdfLogo
            ? `flex max-w-full items-center gap-3 rounded-xl pl-2.5 pr-3 ${sharedCardBehavior}`
            : `flex max-w-full items-center gap-2 rounded-lg px-2.5 ${sharedCardBehavior}`);
        const fileNameClassName = options?.nameClassName
          ?? (showPdfLogo
            ? 'max-w-[160px] truncate text-[14px] font-semibold leading-tight text-gray-900'
            : 'max-w-[120px] truncate text-[14px] font-medium text-gray-900');
        const fileSizeClassName = options?.sizeClassName
          ?? (showPdfLogo
            ? 'mt-0.5 text-xs text-gray-500'
            : 'text-[11px] text-gray-500');

        return (
          <div
            key={file.id}
            className={cardClassName}
          >
            {showPdfLogo ? (
              <Image
                src={pdfLogo}
                alt="PDF"
                className="h-10 w-10 shrink-0 object-contain"
              />
            ) : (
              <FileIcon
                className={options?.iconClassName ?? 'h-3.5 w-3.5 text-orange-600'}
                strokeWidth={2.5}
              />
            )}
            <div className="min-w-0 flex-1">
              <p className={fileNameClassName}>
                {file.name}
              </p>
              <p className={fileSizeClassName}>
                {formatFileSize(file.size)}
              </p>
            </div>
            {options?.removable && options.onRemove ? (
              <button
                type="button"
                onClick={() => options.onRemove?.(file.id)}
                className="rounded p-0.5 transition-colors hover:bg-gray-100"
              >
                <X className="h-3 w-3 text-gray-600" strokeWidth={2.5} />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      {hasStartedConversation && (
        <div
          ref={messagesContainerRef}
          className="flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8"
        >
          {messages.map((message) => (
            (() => {
              const isUserAttachmentOnly =
                message.sender === 'user'
                && Boolean(message.attachments?.length)
                && !message.content;

              return (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                >
                  <div
                    className={`max-w-[88%] sm:max-w-[78%] ${isUserAttachmentOnly
                      ? 'bg-transparent p-0 shadow-none'
                      : `rounded-2xl px-4 py-3.5 sm:px-5 ${message.sender === 'user'
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                        : 'bg-gray-100 text-gray-900'
                      }`
                      }`}
                  >
                    <div className="text-[15px] leading-relaxed">
                      {message.isThinking ? (
                        <span className="inline-flex items-center gap-1.5 text-gray-500">
                          <span>AI正在思考中</span>
                          <span className="flex gap-1">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                          </span>
                        </span>
                      ) : message.sender === 'bot' ? (
                        <div className="space-y-3">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => (
                                <p className="whitespace-pre-wrap leading-7 text-gray-800">
                                  {children}
                                </p>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc space-y-2 pl-5 text-gray-800">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal space-y-2 pl-5 text-gray-800">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => <li className="pl-1">{children}</li>,
                              blockquote: ({ children }) => (
                                <blockquote className="rounded-r-2xl border-l-4 border-orange-400 bg-orange-50/80 px-4 py-3 text-[15px] italic text-orange-900 shadow-sm">
                                  {children}
                                </blockquote>
                              ),
                              h1: ({ children }) => (
                                <h1 className="text-lg font-semibold text-gray-900">{children}</h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-base font-semibold text-gray-900">{children}</h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-sm font-semibold text-gray-900">{children}</h3>
                              ),
                              code: ({ children }) => (
                                <code className="rounded-md bg-gray-200 px-1.5 py-0.5 text-[13px] text-gray-900">
                                  {children}
                                </code>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {message.attachments?.length ? (
                            renderFileCards(message.attachments, {
                              className: 'flex flex-wrap gap-2',
                            })
                          ) : null}
                          {message.content ? (
                            <div className="whitespace-pre-wrap break-words text-white">
                              {message.content}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <p
                      className={`mt-2 text-xs ${message.sender === 'user'
                        ? isUserAttachmentOnly
                          ? 'text-gray-500'
                          : 'text-orange-100'
                        : 'text-gray-500'
                        }`}
                    >
                      {formatTimestamp(message.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })()
          ))}
        </div>
      )}

      <div
        className={
          hasStartedConversation
            ? 'border-t border-gray-100 bg-white px-4 py-5 sm:px-6 lg:px-8'
            : 'flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8'
        }
      >
        <div className={hasStartedConversation ? 'w-full' : 'w-full max-w-3xl'}>
          {!hasStartedConversation && (
            <div className="mb-8 text-center">
              <div className="mb-4 flex items-center justify-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
                  <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
                </div>
                <p className="text-base text-gray-600">Hi, there</p>
              </div>

              <h1 className="text-2xl font-medium text-gray-900 sm:text-3xl">
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

          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setComposerMode('ask')}
              disabled={isLoading}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${composerMode === 'ask'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Ask question
            </button>
            <button
              type="button"
              onClick={() => setComposerMode('ingest')}
              disabled={isLoading}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${composerMode === 'ingest'
                ? 'bg-orange-500 text-white'
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                }`}
            >
              <Upload className="h-4 w-4" strokeWidth={2.5} />
              Add knowledge
            </button>
          </div>

          <div className="relative rounded-[1.75rem] border border-orange-400/40 bg-gray-50 p-3 shadow-sm transition-all focus-within:border-orange-500 focus-within:bg-white">
            {uploadedFiles.length > 0 && (
              <div className="mb-3">
                {renderFileCards(uploadedFiles, {
                  removable: true,
                  onRemove: removeFile,
                })}
              </div>
            )}

            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={
                composerMode === 'ingest'
                  ? 'Paste text to add to the knowledge base...'
                  : 'Ask a question...'
              }
              rows={hasStartedConversation ? 3 : 4}
              disabled={isLoading}
              className="w-full resize-none bg-transparent px-2 py-1 text-[15px] outline-none disabled:cursor-not-allowed disabled:opacity-70"
            />

            <div className="mt-3 flex items-center justify-end gap-3">
              <div className="flex items-center gap-2">
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
                  className="rounded-full bg-orange-400 p-2.5 text-white transition-all hover:bg-orange-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-orange-400 disabled:active:scale-100"
                  title="Send message"
                >
                  <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
