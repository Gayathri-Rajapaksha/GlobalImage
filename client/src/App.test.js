import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Global Image navbar and brand', () => {
  render(<App />);
  const brandElements = screen.getAllByText(/Global Image/i);
  expect(brandElements.length).toBeGreaterThan(0);
});
