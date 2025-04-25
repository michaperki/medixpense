
export * from './core';

if (typeof window !== 'undefined') {
  // Side-effect only
  require('./browser');
} else {
  // Optionally require node-specific setup
  require('./node');
}
