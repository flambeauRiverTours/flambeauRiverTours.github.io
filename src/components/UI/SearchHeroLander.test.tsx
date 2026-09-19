import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchHeroLander } from './SearchHeroLander';

describe('SearchHeroLander Component', () => {
  it('renders search bar lander title and input field', () => {
    const handleSetTab = vi.fn();
    render(<SearchHeroLander setActiveTab={handleSetTab} />);

    expect(screen.getByText(/Ask anything about Jack Treadwell/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask about team leadership/i)).toBeInTheDocument();
  });

  it('populates search query when clicking prompt chips', async () => {
    const handleSetTab = vi.fn();
    render(<SearchHeroLander setActiveTab={handleSetTab} />);

    const promptBtn = screen.getByText('Team leadership & 9 engineers managed?');
    fireEvent.click(promptBtn);

    expect(screen.getByDisplayValue('Team leadership & 9 engineers managed?')).toBeInTheDocument();
  });
});
