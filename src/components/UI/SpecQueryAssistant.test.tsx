import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpecQueryAssistant } from './SpecQueryAssistant';

describe('SpecQueryAssistant Inline Tool', () => {
  it('renders terminal query prompt line and prompt buttons', () => {
    const handleSetTab = vi.fn();
    render(<SpecQueryAssistant setActiveTab={handleSetTab} />);

    expect(screen.getByText('System Specification Query Tool')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/query --topic/i)).toBeInTheDocument();
  });

  it('populates query input when clicking a prompt button', async () => {
    const handleSetTab = vi.fn();
    render(<SpecQueryAssistant setActiveTab={handleSetTab} />);

    const promptBtn = screen.getByText('Team leadership & 9 engineers managed?');
    fireEvent.click(promptBtn);

    expect(screen.getByDisplayValue('Team leadership & 9 engineers managed?')).toBeInTheDocument();
  });
});
