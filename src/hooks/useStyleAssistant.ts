import { useState, useCallback } from 'react';
import { useClosetItems } from './useClosetItems';
import { useOutfits } from './useOutfits';
import { useWearHistory } from './useWearHistory';
import { useAuth } from './useAuth';
import { authenticatedFetch } from '@/lib/auth-fetch';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useStyleAssistant() {
  const { items } = useClosetItems();
  const { outfits } = useOutfits();
  const { history } = useWearHistory();
  const { profile } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (input: string) => {
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    let assistantSoFar = '';

    const upsertAssistant = (nextChunk: string) => {
      assistantSoFar += nextChunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      const wishlistItems = items.filter(i => i.status === 'wishlist');
      
      const resp = await authenticatedFetch('style-assistant', {
        messages: [...messages, userMsg],
        closetItems: items,
        outfits,
        wearHistory: history,
        wishlist: wishlistItems,
        profile,
      });

      // Check if we got HTML instead of JSON (common error indicator)
      const contentType = resp.headers.get('content-type');
      if (!resp.ok) {
        if (contentType?.includes('application/json')) {
          const errorData = await resp.json().catch(() => ({}));
          throw new Error(errorData.error || `Request failed with status ${resp.status}`);
        } else {
          const errorText = await resp.text();
          console.error('Edge function returned non-JSON:', errorText.substring(0, 200));
          throw new Error(`Service error (${resp.status}). Please try again.`);
        }
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      console.error('Style assistant error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  }, [messages, items, outfits, history, profile]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
