import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStyleAssistant, Message } from '@/hooks/useStyleAssistant';
import { useClosetItems } from '@/hooks/useClosetItems';
import { OutfitUploadButton } from './OutfitUploadButton';
import { OutfitImageGrid } from './OutfitImageGrid';
import ReactMarkdown from 'react-markdown';
import inukkiMark from '@/assets/inukki-mark.svg';

interface StyleAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  { label: '✨ Style me', prompt: 'Put together a killer outfit for me from my closet — surprise me!' },
  { label: '💯 Rate my fits', prompt: 'Score my saved outfits and tell me which ones are giving and which need work' },
  { label: '🛍️ Shopping list', prompt: 'What pieces am I missing? Help me fill the gaps in my wardrobe with shopping links.' },
  { label: '🔥 Hidden gems', prompt: 'Which items in my closet am I sleeping on? Find me some underrated pieces.' },
];

function extractMentionedItems(content: string, items: any[]): string[] {
  const mentionedIds: string[] = [];
  items.forEach(item => {
    const nameLower = item.name.toLowerCase();
    const contentLower = content.toLowerCase();
    if (contentLower.includes(nameLower) ||
        nameLower.split(' ').some((word: string) => word.length > 3 && contentLower.includes(word))) {
      if (!mentionedIds.includes(item.id)) mentionedIds.push(item.id);
    }
  });
  return mentionedIds;
}

function extractShoppingLinks(content: string): { name: string; url: string; store: string }[] {
  const links: { name: string; url: string; store: string }[] = [];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const storeName = match[1];
    const url = match[2];
    let store = storeName;
    if (url.includes('asos.com')) store = 'ASOS';
    else if (url.includes('zara.com')) store = 'Zara';
    else if (url.includes('hm.com')) store = 'H&M';
    else if (url.includes('nordstrom.com')) store = 'Nordstrom';
    else if (url.includes('amazon.com')) store = 'Amazon';
    else if (url.includes('uniqlo.com')) store = 'Uniqlo';
    else if (url.includes('mango.com')) store = 'Mango';
    links.push({ name: storeName, url, store });
  }
  return links;
}

export function StyleAssistant({ isOpen, onClose }: StyleAssistantProps) {
  const { messages, isLoading, error, sendMessage, clearMessages } = useStyleAssistant();
  const { items } = useClosetItems();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const itemsById = useMemo(() => {
    const map = new Map();
    items.forEach(item => map.set(item.id, item));
    return map;
  }, [items]);

  const renderMessage = (msg: Message, idx: number) => {
    const isAssistant = msg.role === 'assistant';
    let mentionedItems: any[] = [];
    let shoppingLinks: { name: string; url: string; store: string }[] = [];

    if (isAssistant) {
      const mentionedIds = extractMentionedItems(msg.content, items);
      mentionedItems = mentionedIds.map(id => itemsById.get(id)).filter(Boolean);
      shoppingLinks = extractShoppingLinks(msg.content);
    }

    return (
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        {isAssistant && (
          <img src={inukkiMark} alt="" className="w-6 h-6 mt-1 mr-2 flex-shrink-0" />
        )}
        <div
          className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
            msg.role === 'user'
              ? 'bg-foreground text-background'
              : 'bg-card border-2 border-strong'
          }`}
        >
          {isAssistant ? (
            <div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              <OutfitImageGrid items={mentionedItems} shoppingLinks={shoppingLinks} />
            </div>
          ) : (
            <p className="text-sm">{msg.content}</p>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="absolute inset-x-0 bottom-0 top-10 bg-background rounded-t-2xl shadow-elevated flex flex-col border-t-2 border-x-2 border-strong"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-strong">
              <div className="flex items-center gap-2.5">
                <img src={inukkiMark} alt="Inukki" className="w-7 h-7" />
                <div>
                  <span className="font-semibold text-sm text-foreground">Inukki</span>
                  <p className="text-[10px] text-muted-foreground italic">your style companion</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <Button variant="ghost" size="icon" onClick={clearMessages} className="h-8 w-8 text-muted-foreground">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <img src={inukkiMark} alt="Inukki" className="w-14 h-14 mb-4 opacity-60" />
                  <h3 className="font-semibold text-sm mb-1 text-foreground">Hey bestie ✨</h3>
                  <p className="text-xs text-muted-foreground mb-6 max-w-[220px]">
                    I'm Inukki, your style BFF. Let's make your closet work harder for you.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {QUICK_PROMPTS.map((qp) => (
                      <button
                        key={qp.label}
                        onClick={() => sendMessage(qp.prompt)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-card text-foreground border-2 border-strong hover:bg-secondary transition-colors"
                      >
                        {qp.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg, idx) => renderMessage(msg, idx))}
                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                      <img src={inukkiMark} alt="" className="w-6 h-6 mt-1 mr-2 flex-shrink-0 animate-pulse" />
                      <div className="bg-card border-2 border-strong rounded-2xl px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
              {error && (
                <div className="mt-3 p-2.5 bg-destructive/10 text-destructive rounded-lg text-xs border-2 border-destructive/20">
                  {error}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSubmit} className="px-4 py-3 border-t-2 border-strong">
              <div className="flex gap-2">
                <OutfitUploadButton
                  variant="icon"
                  onAnalysisComplete={(result) => {
                    sendMessage(`I just uploaded an outfit photo and got a score of ${result.score}/100. ${result.reasoning}`);
                  }}
                />
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Inukki about your style..."
                  disabled={isLoading}
                  className="flex-1 h-9 text-sm border-2 border-strong"
                />
                <Button type="submit" disabled={!input.trim() || isLoading} size="icon" className="h-9 w-9 bg-foreground text-background hover:bg-foreground/90 border-2 border-strong">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
