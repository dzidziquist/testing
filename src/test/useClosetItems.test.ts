import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClosetItems } from '@/hooks/useClosetItems';

// --- Mock Supabase client ---
const mockRange = vi.fn();
const mockIn = vi.fn();
const mockNot = vi.fn();

// Chain builder for metadata query (.select(METADATA_COLUMNS).eq().order().range())
// and image query (.select('id, image_url').in().not())
const chain = {
  select: () => chain,
  eq: () => chain,
  order: () => chain,
  range: (...args: any[]) => { mockRange(...args); return mockRange(); },
  insert: () => chain,
  update: () => chain,
  delete: () => chain,
  single: vi.fn(),
  in: (...args: any[]) => { mockIn(...args); return chain; },
  not: (...args: any[]) => { mockNot(...args); return mockNot(); },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => chain,
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}));

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const sampleItems = [
  {
    id: 'item-1',
    user_id: 'user-123',
    name: 'White T-Shirt',
    category: 'tops',
    status: 'active',
    wear_count: 3,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'item-2',
    user_id: 'user-123',
    name: 'Blue Jeans',
    category: 'bottoms',
    status: 'active',
    wear_count: 5,
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useClosetItems', () => {
  // Protects: Items load correctly with two-step fetch (metadata then images)
  it('fetches items successfully', async () => {
    mockRange.mockReturnValue(Promise.resolve({ data: sampleItems, error: null }));
    mockNot.mockReturnValue(Promise.resolve({ data: [{ id: 'item-1', image_url: 'https://example.com/img.jpg' }], error: null }));

    let result: any;
    await act(async () => {
      const rendered = renderHook(() => useClosetItems());
      result = rendered.result;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0].name).toBe('White T-Shirt');
  });

  // Protects: Empty closet renders correctly without errors
  it('handles empty closet state', async () => {
    mockRange.mockReturnValue(Promise.resolve({ data: [], error: null }));

    let result: any;
    await act(async () => {
      const rendered = renderHook(() => useClosetItems());
      result = rendered.result;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.items).toHaveLength(0);
    expect(result.current.hasMore).toBe(false);
  });

  // Protects: Database errors surface to the user via toast notification
  it('shows error toast on fetch failure', async () => {
    mockRange.mockReturnValue(Promise.resolve({
      data: null,
      error: { message: 'Network error' },
    }));

    let result: any;
    await act(async () => {
      const rendered = renderHook(() => useClosetItems());
      result = rendered.result;
    });

    expect(result.current.loading).toBe(false);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error loading items',
        variant: 'destructive',
      })
    );
  });

  // Protects: Pagination boundary — hasMore flag is set when full page returned
  it('sets hasMore=true when full page returned', async () => {
    const fullPage = Array.from({ length: 30 }, (_, i) => ({
      ...sampleItems[0],
      id: `item-${i}`,
    }));
    mockRange.mockReturnValue(Promise.resolve({ data: fullPage, error: null }));
    mockNot.mockReturnValue(Promise.resolve({ data: [], error: null }));

    let result: any;
    await act(async () => {
      const rendered = renderHook(() => useClosetItems());
      result = rendered.result;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.hasMore).toBe(true);
  });
});
