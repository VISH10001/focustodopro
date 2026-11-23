// WeekdaySelector.test.tsx
import { render, fireEvent } from '@testing-library/react';
import { WeekdaySelector } from './WeekdaySelector';

describe('WeekdaySelector', () => {
  it('renders 7 day buttons', () => {
    const { getAllByRole } = render(<WeekdaySelector selected={[]} onChange={() => {}} />);
    // After mount, 7 day buttons should appear
    // We wait for useEffect by using async
    // (Vitest renders synchronously with JSDOM)
    const buttons = getAllByRole('button');
    // Should have 7 buttons (one per day)
    expect(buttons.length).toBe(7);
  });

  it('calls onChange when a day is toggled on', () => {
    const handleChange = vi.fn();
    const { getAllByRole } = render(<WeekdaySelector selected={[]} onChange={handleChange} />);
    const buttons = getAllByRole('button');
    fireEvent.click(buttons[0]); // click first day (Monday)
    expect(handleChange).toHaveBeenCalledTimes(1);
    // Should have added day 1 (Monday = JS getDay 1)
    const args = handleChange.mock.calls[0][0] as number[];
    expect(args.length).toBe(1);
  });

  it('calls onChange to remove a day that is already selected', () => {
    // Pre-select day 1 (Monday)
    const handleChange = vi.fn();
    const { getAllByRole } = render(<WeekdaySelector selected={[1]} onChange={handleChange} />);
    const buttons = getAllByRole('button');
    fireEvent.click(buttons[0]); // click Monday again to deselect
    expect(handleChange).toHaveBeenCalledTimes(1);
    const args = handleChange.mock.calls[0][0] as number[];
    expect(args.length).toBe(0);
  });
});
