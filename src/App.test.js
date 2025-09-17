import { render, screen } from '@testing-library/react';
import App from './App';

test('отображает основную вкладку с задачами', () => {
  render(<App />);
  const tab = screen.getByText(/Мои задачи/i);
  expect(tab).toBeInTheDocument();
});
