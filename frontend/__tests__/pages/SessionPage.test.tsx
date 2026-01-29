import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SessionPage from '../../src/pages/SessionPage';

describe('SessionPage Component', () => {
  const renderWithRouter = (sessionId: string) => {
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/session/:sessionId" element={<SessionPage />} />
        </Routes>
      </BrowserRouter>,
      {
        wrapper: ({ children }) => (
          <BrowserRouter>
            {children}
          </BrowserRouter>
        ),
      }
    );
  };

  it('should render without crashing', () => {
    // Arrange & Act
    const { container } = render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SessionPage />} />
        </Routes>
      </BrowserRouter>
    );

    // Assert
    expect(container).toBeTruthy();
  });

  it('should display session ID from URL parameter', () => {
    // Arrange
    const testSessionId = 'test-session-123';

    // Act
    render(
      <BrowserRouter initialEntries={[`/session/${testSessionId}`]}>
        <Routes>
          <Route path="/session/:sessionId" element={<SessionPage />} />
        </Routes>
      </BrowserRouter>
    );

    // Assert
    const sessionIdElement = screen.getByText(new RegExp(testSessionId, 'i'));
    expect(sessionIdElement).toBeInTheDocument();
  });

  it('should extract sessionId from URL params', () => {
    // Arrange
    const sessionId = 'abc-def-456';

    // Act
    render(
      <BrowserRouter initialEntries={[`/session/${sessionId}`]}>
        <Routes>
          <Route path="/session/:sessionId" element={<SessionPage />} />
        </Routes>
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByText(new RegExp(sessionId))).toBeInTheDocument();
  });

  it('should handle different session IDs', () => {
    // Arrange
    const sessionId1 = 'session-001';

    // Act
    const { rerender } = render(
      <BrowserRouter initialEntries={[`/session/${sessionId1}`]}>
        <Routes>
          <Route path="/session/:sessionId" element={<SessionPage />} />
        </Routes>
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByText(new RegExp(sessionId1))).toBeInTheDocument();

    // Arrange
    const sessionId2 = 'session-002';

    // Act
    rerender(
      <BrowserRouter initialEntries={[`/session/${sessionId2}`]}>
        <Routes>
          <Route path="/session/:sessionId" element={<SessionPage />} />
        </Routes>
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByText(new RegExp(sessionId2))).toBeInTheDocument();
  });

  it('should render session page heading', () => {
    // Arrange
    const sessionId = 'my-session';

    // Act
    render(
      <BrowserRouter initialEntries={[`/session/${sessionId}`]}>
        <Routes>
          <Route path="/session/:sessionId" element={<SessionPage />} />
        </Routes>
      </BrowserRouter>
    );

    // Assert
    const heading = screen.getByRole('heading');
    expect(heading).toBeInTheDocument();
  });

  it('should have proper semantic structure', () => {
    // Arrange
    const sessionId = 'test-session';

    // Act
    const { container } = render(
      <BrowserRouter initialEntries={[`/session/${sessionId}`]}>
        <Routes>
          <Route path="/session/:sessionId" element={<SessionPage />} />
        </Routes>
      </BrowserRouter>
    );

    // Assert
    expect(container.firstChild).toBeTruthy();
  });

  it('should handle UUID format session IDs', () => {
    // Arrange
    const uuidSessionId = '123e4567-e89b-12d3-a456-426614174000';

    // Act
    render(
      <BrowserRouter initialEntries={[`/session/${uuidSessionId}`]}>
        <Routes>
          <Route path="/session/:sessionId" element={<SessionPage />} />
        </Routes>
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByText(new RegExp(uuidSessionId))).toBeInTheDocument();
  });

  it('should handle alphanumeric session IDs', () => {
    // Arrange
    const alphanumericId = 'Session123ABC';

    // Act
    render(
      <BrowserRouter initialEntries={[`/session/${alphanumericId}`]}>
        <Routes>
          <Route path="/session/:sessionId" element={<SessionPage />} />
        </Routes>
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByText(new RegExp(alphanumericId))).toBeInTheDocument();
  });
});
