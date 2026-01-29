import { useTranscript } from '../hooks/useTranscript';
import MessageBubble from './MessageBubble';
import type { TranscriptRecord, TextBlock, Message } from '../types';

interface TranscriptViewProps {
  sessionId: string;
}

function TranscriptView({ sessionId }: TranscriptViewProps) {
  const { loading, error, transcript } = useTranscript(sessionId);

  // Extract text content from message
  const extractTextContent = (message: Message): string => {
    return message.content
      .filter((block): block is TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"
          role="status"
        />
        <p className="mt-4 text-gray-600">Loading transcript...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <p className="text-red-700">{error.message}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!transcript || transcript.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-gray-500">Select a session to view transcript</p>
      </div>
    );
  }

  // Success state - render messages
  return (
    <div className="flex flex-col">
      <div className="space-y-4">
        {transcript.map((record: TranscriptRecord, index: number) => (
          <MessageBubble
            key={`${record.timestamp}-${index}`}
            type={record.type}
            content={extractTextContent(record.message)}
            timestamp={record.timestamp}
          />
        ))}
      </div>
    </div>
  );
}

export default TranscriptView;
