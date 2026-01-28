import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('App Component', () => {
  it('should render without crashing', () => {
    // Arrange & Act
    const { container } = render(<App />);

    // Assert
    expect(container).toBeTruthy();
  });

  it('should render main container element', () => {
    // Arrange & Act
    render(<App />);

    // Assert
    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
  });

  it('should have proper semantic HTML structure', () => {
    // Arrange & Act
    const { container } = render(<App />);

    // Assert
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });

  it('should render app title', () => {
    // Arrange & Act
    render(<App />);

    // Assert
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toBeInTheDocument();
    expect(title.textContent).toBeTruthy();
  });

  it('should display application name in title', () => {
    // Arrange & Act
    render(<App />);

    // Assert
    const title = screen.getByRole('heading', { level: 1 });
    expect(title.textContent).toMatch(/Claude Transcript Viewer/i);
  });
});
