import { describe, it, expect, vi } from 'vitest';
import { streamAIChat } from './aiStreamService';

describe('aiStreamService', () => {
  it('handles stream errors and invokes fallback handler', async () => {
    const handleChunk = vi.fn();
    const handleError = vi.fn();

    // Mock fetch failure
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await streamAIChat('test query', handleChunk, handleError);

    expect(handleError).toHaveBeenCalledTimes(1);
    expect(handleChunk).not.toHaveBeenCalled();
  });
});
