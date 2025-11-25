import React from 'react';
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../Button";

describe('Button', () => {
  test('renders with default props', () => {
    render(<Button aria-label="Click me" variant="default">Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  test('applies custom className', () => {
    render(<Button aria-label="Button" variant="default" className="custom-class">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button aria-label="Click me" variant="default" onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('renders different variants', () => {
    const { rerender } = render(<Button aria-label="Default" variant="default">Default</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary');

    rerender(<Button aria-label="Destructive" variant="destructive">Destructive</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');

    rerender(<Button aria-label="Outline" variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-input');
  });

  test('renders different sizes', () => {
    const { rerender } = render(<Button aria-label="Default" variant="default" size="default">Default</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10');

    rerender(<Button aria-label="Small" variant="default" size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-9');

    rerender(<Button aria-label="Large" variant="default" size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-11');
  });

  test('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button aria-label="Button" variant="default" ref={ref}>Button</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  test('is disabled when loading', () => {
    render(<Button aria-label="Loading" variant="default" isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  test('shows loading spinner when loading', () => {
    render(<Button aria-label="Loading" variant="default" isLoading>Loading</Button>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});