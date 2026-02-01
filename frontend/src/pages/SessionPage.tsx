import { useParams } from 'react-router-dom';
import TranscriptView from '../components/TranscriptView';

function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Session: {sessionId}
      </h2>
      <div className="bg-white rounded-lg shadow p-6">
        {sessionId ? (
          <TranscriptView sessionId={sessionId} />
        ) : (
          <p className="text-gray-600">No session ID provided</p>
        )}
      </div>
    </div>
  );
}

export default SessionPage;
