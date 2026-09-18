import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LightboxModal } from '../UI/LightboxModal';
import { TravelItem } from '../../datamodel/portfolioData';

describe('LightboxModal logic', () => {
  const mockItem: TravelItem = {
    id: 'test-item',
    title: 'Test Location',
    timeframe: '2024',
    description: 'Test Description',
    imagePath: '/test.jpg',
    tags: ['TestTag']
  };

  it('triggers onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(<LightboxModal item={mockItem} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when clicking the backdrop overlay', () => {
    const handleClose = vi.fn();
    render(<LightboxModal item={mockItem} onClose={handleClose} />);

    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not trigger onClose when clicking inside the modal card content', () => {
    const handleClose = vi.fn();
    render(<LightboxModal item={mockItem} onClose={handleClose} />);

    const modalTitle = screen.getByText('Test Location');
    fireEvent.click(modalTitle);
    expect(handleClose).not.toHaveBeenCalled();
  });
});
