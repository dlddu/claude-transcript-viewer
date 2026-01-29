interface MessageBubbleProps {
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

function MessageBubble({ type, content, timestamp }: MessageBubbleProps) {
  const isUser = type === 'user';

  return (
    <div
      className={`max-w-[80%] ${isUser ? 'ml-auto' : 'mr-auto'}`}
      data-testid="message-bubble"
    >
      <div
        className={`
          ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}
          rounded-lg px-4 py-2 whitespace-pre-wrap break-words
        `}
      >
        {content}
      </div>
      <time className="text-xs text-gray-500 mt-1 block">
        {timestamp}
      </time>
    </div>
  );
}

export default MessageBubble;
