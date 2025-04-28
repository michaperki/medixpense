
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

function HelloWorld() {
  return <div>Hello World</div>;
}

describe('HelloWorld component', () => {
  it('renders the correct text', () => {
    render(<HelloWorld />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});

