import React from 'react';
import {  render, screen  } from "@testing-library/react";
import {  Layout  } from "../Layout";

describe('Layout', () => {
  test('renders children correctly', () => {
    const testContent = 'Test content';
    render(
      <Layout>
        <div>{testContent}</div>
      </Layout>
    );

    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  test('applies custom className', () => {
    render(
      <Layout className="custom-class">
        <div>Content</div>
      </Layout>
    );

    expect(screen.getByRole('main')).toHaveClass('custom-class');
  });

  test('preserves layout structure', () => {
    render(
      <Layout>
        <div>Header</div>
        <div>Content</div>
        <div>Footer</div>
      </Layout>
    );

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});