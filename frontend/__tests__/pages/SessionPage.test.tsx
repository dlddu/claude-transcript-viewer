import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SessionPage from '../../src/pages/SessionPage';

describe('SessionPage Component', () => {

  it('should render without crashing', () => {
    // Arrange & Act
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<SessionPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Assert
    expect(container).toBeTruthy();
  });

  it('should display session ID from URL parameter', () => {
    // Arrange
    const testSessionId = 'test-session-123';

    // Act
    render(
      <MemoryRouter initialEntries={[`/session/${testSessionId}`]}>
        <Routes>
          <Route path="/session/:sessionId" element={<SessionPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Assert
    const sessionIdElement = screen.getByRole('heading', { name: new RegExp(testSessionId, 'i') });
    expect(sessionIdElement).toBeInTheDocument();
  });

  it('should extract sessionId from URL params', () => {
    // Arrange
    const sessionId = 'abc-def-456';

    // Act
    render(
      <MemoryRouter initialEntries={[`/session/${sessionId}`]}>
        <Routes>
          <Route path="/session/:sessionId" element={<SessionPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByRole('heading', { name: new RegExp(sessionId) })).toBeInTheDocument();
  });

  it('should handle different session IDs', () => {
    // Arrange
    const sessionId1 = 'session-001';

    // Act
    const { unmount } = render(
      <MemoryRouter initialEntries={[`/session/${sessionId1}`]}>
        <Routes>
          <Route path="/session/:sessionId" element={<SessionPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByRole('heading', { name: new RegExp(sessionId1) })).toBeInTheDocument();

    // Cleanup
    unmount();

    // Arrange
    const sessionId2 = 'session-002';

    // Act
    render(
      <MemoryRouter initialEntries={[`/session/${sessionId2}`]}>
        <Routes>
          <Route path="/session/:sessionId" element={<SessionPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByRole('heading', { name: new RegExp(sessionId2) })).toBeInTheDocument();
  });

  it('should render session page heading', () => {
    // Arrange
    const sessionId = 'my-session';

    // Act
    render(
      <MemoryRouter initialEntries={[`/session/${sessionId}`]}>
        <Routes>
          <Route path="/session/:sessionId" element={<SessionPage />} />
        </Routes>
      </MemoryRouter>
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
      <MemoryRouter initialEntries={[`/session/${sessionId}`]}>
        <Routes>
          <Route path="/session/:sessionId" element={<SessionPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Assert
    expect(container.firstChild).toBeTruthy();
  });

  it('should handle UUID format session IDs', () => {
    // Arrange
    const uuidSessionId = '123e4567-e89b-12d3-a456-426614174000';

    // Act
    render(
      <MemoryRouter initialEntries={[`/session/${uuidSessionId}`]}>
        <Routes>
          <Route path="/session/:sessionId" element={<SessionPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByRole('heading', { name: new RegExp(uuidSessionId) })).toBeInTheDocument();
  });

  it('should handle alphanumeric session IDs', () => {
    // Arrange
    const alphanumericId = 'Session123ABC';

    // Act
    render(
      <MemoryRouter initialEntries={[`/session/${alphanumericId}`]}>
        <Routes>
          <Route path="/session/:sessionId" element={<SessionPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByRole('heading', { name: new RegExp(alphanumericId) })).toBeInTheDocument();
  });
});
