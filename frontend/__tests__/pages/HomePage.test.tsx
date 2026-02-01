import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../../src/pages/HomePage';

describe('HomePage Component', () => {
  it('should render without crashing', () => {
    // Arrange & Act
    const { container } = render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Assert
    expect(container).toBeTruthy();
  });

  it('should display "Sessions" heading', () => {
    // Arrange & Act
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Assert
    const sessionsHeading = screen.getByRole('heading', { name: /sessions/i });
    expect(sessionsHeading).toBeInTheDocument();
  });

  it('should render home page heading', () => {
    // Arrange & Act
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Assert
    const heading = screen.getByRole('heading');
    expect(heading).toBeInTheDocument();
  });

  it('should have proper semantic structure', () => {
    // Arrange & Act
    const { container } = render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Assert
    expect(container.firstChild).toBeTruthy();
  });

  it('should render as a container element', () => {
    // Arrange & Act
    const { container } = render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Assert
    const pageContainer = container.firstChild as HTMLElement;
    expect(pageContainer).toBeInTheDocument();
  });

  it('should display SessionList component', () => {
    // Arrange & Act
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Assert
    const sessionsHeading = screen.getByRole('heading', { name: /sessions/i });
    expect(sessionsHeading).toBeInTheDocument();
  });
});
