import { useParams } from 'react-router-dom';

function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Session: {sessionId}
      </h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Viewing session: {sessionId}
        </p>
      </div>
    </div>
  );
}

export default SessionPage;
