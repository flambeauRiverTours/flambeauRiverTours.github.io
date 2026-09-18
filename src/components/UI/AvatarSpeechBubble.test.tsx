import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AvatarSpeechBubble } from '../UI/AvatarSpeechBubble';

describe('AvatarSpeechBubble', () => {
  it('triggers onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    const handleSetTab = vi.fn();
    render(<AvatarSpeechBubble isOpen={true} onClose={handleClose} setActiveTab={handleSetTab} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('executes AI query when clicking a suggested prompt chip', async () => {
    const handleClose = vi.fn();
    const handleSetTab = vi.fn();
    render(<AvatarSpeechBubble isOpen={true} onClose={handleClose} setActiveTab={handleSetTab} />);

    const promptChip = screen.getByText('Team leadership & 9 engineers managed?');
    fireEvent.click(promptChip);

    // Verify query input is set
    expect(screen.getByDisplayValue('Team leadership & 9 engineers managed?')).toBeInTheDocument();
  });
});
