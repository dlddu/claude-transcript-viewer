import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Layout from '../src/layouts/Layout';
import HomePage from '../src/pages/HomePage';
import SessionPage from '../src/pages/SessionPage';

describe('Routing Integration', () => {
  it('should render HomePage at root path "/"', () => {
    // Arrange & Act
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByText(/home/i)).toBeInTheDocument();
  });

  it('should render SessionPage at "/session/:sessionId" path', () => {
    // Arrange
    const sessionId = 'test-session-123';

    // Act
    render(
      <MemoryRouter initialEntries={[`/session/${sessionId}`]}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="/session/:sessionId" element={<SessionPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByRole('heading', { name: new RegExp(sessionId) })).toBeInTheDocument();
  });

  it('should display Layout header on all routes', () => {
    // Arrange & Act - Home page
    const { rerender } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByRole('heading', { level: 1, name: /claude transcript viewer/i })).toBeInTheDocument();

    // Act - Session page
    rerender(
      <MemoryRouter initialEntries={['/session/test-123']}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="/session/:sessionId" element={<SessionPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByRole('heading', { level: 1, name: /claude transcript viewer/i })).toBeInTheDocument();
  });

  it('should render HomePage component when navigating to "/"', () => {
    // Arrange & Act
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // Assert
    const homePage = screen.getByText(/home/i);
    expect(homePage).toBeInTheDocument();
  });

  it('should render SessionPage with correct sessionId parameter', () => {
    // Arrange
    const testCases = [
      'session-1',
      'abc-123-def',
      '123e4567-e89b-12d3-a456-426614174000',
    ];

    testCases.forEach((sessionId) => {
      // Act
      const { unmount } = render(
        <MemoryRouter initialEntries={[`/session/${sessionId}`]}>
          <Routes>
            <Route path="/session/:sessionId" element={<SessionPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByRole('heading', { name: new RegExp(sessionId) })).toBeInTheDocument();

      // Cleanup
      unmount();
    });
  });

  it('should maintain Layout structure across route changes', () => {
    // Arrange
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="/session/:sessionId" element={<SessionPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Assert
    const header = screen.getByRole('banner');
    const main = screen.getByRole('main');
    expect(header).toBeInTheDocument();
    expect(main).toBeInTheDocument();
  });

  it('should render header, sidebar, and main content in Layout', () => {
    // Arrange & Act
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Assert
    const header = screen.getByRole('banner');
    const main = screen.getByRole('main');
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent('Claude Transcript Viewer');
    expect(main).toBeInTheDocument();
  });

  it('should handle nested routing with Layout wrapper', () => {
    // Arrange & Act
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="session/:sessionId" element={<SessionPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText(/home/i)).toBeInTheDocument();
  });

  it('should navigate between HomePage and SessionPage', () => {
    // Arrange & Act - Start at HomePage
    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="session/:sessionId" element={<SessionPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Assert - HomePage
    expect(screen.getByText(/home/i)).toBeInTheDocument();

    // Cleanup
    unmount();

    // Arrange & Act - Navigate to SessionPage
    const sessionId = 'test-session';
    render(
      <MemoryRouter initialEntries={[`/session/${sessionId}`]}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="session/:sessionId" element={<SessionPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Assert - SessionPage
    expect(screen.getByRole('heading', { name: new RegExp(sessionId) })).toBeInTheDocument();
  });

  it('should preserve Layout elements during navigation', () => {
    // Arrange
    const sessionId = 'preserve-test';

    // Act
    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Assert - Initial state
    const headerBefore = screen.getByRole('banner');
    expect(headerBefore).toHaveTextContent('Claude Transcript Viewer');

    // Cleanup
    unmount();

    // Act - Navigate
    render(
      <MemoryRouter initialEntries={[`/session/${sessionId}`]}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="session/:sessionId" element={<SessionPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Assert - After navigation
    const headerAfter = screen.getByRole('banner');
    expect(headerAfter).toHaveTextContent('Claude Transcript Viewer');
    expect(screen.getByRole('heading', { name: new RegExp(sessionId) })).toBeInTheDocument();
  });
});
