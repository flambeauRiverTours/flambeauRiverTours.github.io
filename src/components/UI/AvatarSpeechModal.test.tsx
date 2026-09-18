import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AvatarSpeechModal } from '../UI/AvatarSpeechModal';

describe('AvatarSpeechModal', () => {
  it('triggers onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    const handleSetTab = vi.fn();
    render(<AvatarSpeechModal isOpen={true} onClose={handleClose} setActiveTab={handleSetTab} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('executes AI query when clicking a suggested prompt chip', async () => {
    const handleClose = vi.fn();
    const handleSetTab = vi.fn();
    render(<AvatarSpeechModal isOpen={true} onClose={handleClose} setActiveTab={handleSetTab} />);

    const promptChip = screen.getByText('How did Jack manage his team of 9 engineers?');
    fireEvent.click(promptChip);

    // Wait for response text to appear
    const responseText = await screen.findByText(/managed a team of 9 software developers/i);
    expect(responseText).toBeInTheDocument();
  });
});
