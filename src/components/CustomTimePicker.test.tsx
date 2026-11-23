import { render, screen, fireEvent } from '@testing-library/react';
import { CustomTimePicker } from './CustomTimePicker';

test('renders hour, minute, AM/PM selectors and confirms time', () => {
  const mockChange = vi.fn();
  // Start with a known AM time so we can toggle to PM
  render(<CustomTimePicker value="03:00" onChange={mockChange} />);

  // Get all comboboxes (hour and minute selects)
  const selects = screen.getAllByRole('combobox');
  expect(selects.length).toBeGreaterThanOrEqual(2);

  const hourSelect = selects[0];
  expect(hourSelect).toBeInTheDocument();

  // Minute selector: set to 15
  const minuteSelect = selects[1];
  fireEvent.change(minuteSelect, { target: { value: '15' } });

  // Toggle AM/PM from AM to PM (component starts at AM since hour=3)
  const ampmButton = screen.getByRole('button', { name: /am|pm/i });
  fireEvent.click(ampmButton); // switch to PM

  // Click Confirm
  const confirmBtn = screen.getByRole('button', { name: /confirm/i });
  fireEvent.click(confirmBtn);

  expect(mockChange).toHaveBeenCalledTimes(1);
  const calledWith = mockChange.mock.calls[0][0];
  // Hour 3 PM = 15 in 24h, minute = 15
  expect(calledWith).toMatch(/^15:15$/);
});
