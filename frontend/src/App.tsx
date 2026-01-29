import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import HomePage from './pages/HomePage';
import SessionPage from './pages/SessionPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="session/:sessionId" element={<SessionPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
