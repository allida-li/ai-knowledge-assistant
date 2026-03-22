interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.sender === 'bot';

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[70%] rounded-lg p-4 ${
          isBot
            ? 'bg-white text-gray-800 shadow-sm'
            : 'bg-blue-500 text-white'
        }`}
      >
        <p className="text-sm">{message.text}</p>
        <span
          className={`mt-1 block text-xs ${
            isBot ? 'text-gray-500' : 'text-blue-100'
          }`}
        >
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}