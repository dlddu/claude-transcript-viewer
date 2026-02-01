import { useNavigate } from 'react-router-dom';
import SessionList from '../components/SessionList';

function HomePage() {
  const navigate = useNavigate();

  const handleSessionSelect = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <SessionList onSessionSelect={handleSessionSelect} />
      </div>
    </div>
  );
}

export default HomePage;
