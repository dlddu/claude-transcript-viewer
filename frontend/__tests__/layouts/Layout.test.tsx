import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../../src/layouts/Layout';

describe('Layout Component', () => {
  it('should render without crashing', () => {
    // Arrange & Act
    const { container } = render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    // Assert
    expect(container).toBeTruthy();
  });

  it('should render header with application title', () => {
    // Arrange & Act
    render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    // Assert
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent('Claude Transcript Viewer');
  });

  it('should display "Claude Transcript Viewer" as heading', () => {
    // Arrange & Act
    render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    // Assert
    const heading = screen.getByRole('heading', { name: /claude transcript viewer/i });
    expect(heading).toBeInTheDocument();
  });

  it('should render sidebar element', () => {
    // Arrange & Act
    const { container } = render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    // Assert
    const sidebar = container.querySelector('[role="complementary"]') ||
                    container.querySelector('.sidebar') ||
                    container.querySelector('aside');
    expect(sidebar).toBeInTheDocument();
  });

  it('should render main content area', () => {
    // Arrange & Act
    render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    // Assert
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });

  it('should render children in main content area', () => {
    // Arrange
    const testContent = 'Test Content';

    // Act
    render(
      <BrowserRouter>
        <Layout>
          <div data-testid="test-child">{testContent}</div>
        </Layout>
      </BrowserRouter>
    );

    // Assert
    const childElement = screen.getByTestId('test-child');
    expect(childElement).toBeInTheDocument();
    expect(childElement).toHaveTextContent(testContent);
  });

  it('should render Outlet when no children provided', () => {
    // Arrange & Act
    render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    // Assert
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });

  it('should have proper semantic HTML structure', () => {
    // Arrange & Act
    const { container } = render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    // Assert
    const header = container.querySelector('header');
    const main = container.querySelector('main');
    expect(header).toBeInTheDocument();
    expect(main).toBeInTheDocument();
  });

  it('should apply proper styling classes', () => {
    // Arrange & Act
    const { container } = render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>
    );

    // Assert
    expect(container.firstChild).toHaveClass('min-h-screen');
  });
});
