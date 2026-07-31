import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/AIChatbot.css';

// ─── Quick Reply Suggestions ──────────────────────────────────────────────────
const QUICK_REPLIES = [
  '🛒 Browse products',
  '📦 Track my order',
  '🌾 How do I sell?',
  '🔐 Reset password',
  '🥕 Fresh produce tips',
  '📞 Contact support',
];

// ─── Lightweight markdown renderer ───────────────────────────────────────────
function renderMarkdown(text) {
  // Bold **text**
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic *text*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Line breaks
  html = html.replace(/\n/g, '<br/>');
  // Bullet points starting with - or •
  html = html.replace(/^[-•]\s+(.+)$/gm, '• $1');
  return html;
}

// ─── Single message bubble ────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isBot = msg.role === 'bot';
  return (
    <div className={`ai-msg ${isBot ? 'bot-msg' : 'user-msg'}`}>
      <div className="ai-msg-icon">
        {isBot ? '🌿' : '👤'}
      </div>
      <div
        className="ai-msg-bubble"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
      />
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="ai-msg bot-msg">
      <div className="ai-msg-icon">🌿</div>
      <div className="ai-msg-bubble" style={{ padding: '6px 14px' }}>
        <div className="typing-indicator">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

// ─── Main Chatbot Component ───────────────────────────────────────────────────
const AIChatbot = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: `Hello${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! 👋 I'm **FarmBot**, your FreshFarm assistant. I can help you with products, orders, account setup, and more.\n\nHow can I help you today? 🌿`,
      id: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasNewMsg, setHasNewMsg] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 300);
      setHasNewMsg(false);
    }
  }, [isOpen]);

  const handleOpen = () => {
    setIsClosing(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const toggleChat = () => {
    if (isOpen) handleClose();
    else handleOpen();
  };

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 90) + 'px';
    }
  };

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || inputValue).trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg = { role: 'user', text: trimmed, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to get a response');
      }

      const botMsg = { role: 'bot', text: data.reply, id: Date.now() + 1 };
      setMessages(prev => [...prev, botMsg]);

      // Show badge if panel is closed
      if (!isOpen) setHasNewMsg(true);

    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickReply = (chipText) => {
    // Strip emoji prefix for the actual message
    const msg = chipText.replace(/^[\u{1F300}-\u{1FFFF}\u{2600}-\u{27FF}]\s*/u, '').trim();
    sendMessage(msg);
  };

  // Determine which quick replies to show (only when there are few messages)
  const showQuickReplies = messages.length <= 2 && !isLoading;

  return (
    <>
      {/* ── Chat Panel ──────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className={`ai-chat-panel ${isClosing ? 'closing' : ''}`} role="dialog" aria-label="FarmBot AI Assistant">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-avatar" aria-hidden="true">🌿</div>
            <div className="ai-chat-header-info">
              <div className="ai-chat-header-name">FarmBot Assistant</div>
              <div className="ai-chat-header-status">
                <span className="status-dot" />
                <span>Online · Powered by AI</span>
              </div>
            </div>
            <button
              className="ai-chat-header-close"
              onClick={handleClose}
              aria-label="Close chat"
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="ai-chat-messages" role="log" aria-live="polite">
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {showQuickReplies && (
            <div className="ai-chat-quick-replies" aria-label="Suggested questions">
              {QUICK_REPLIES.map(chip => (
                <button
                  key={chip}
                  className="ai-chat-quick-chip"
                  onClick={() => handleQuickReply(chip)}
                  disabled={isLoading}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="ai-chat-error" role="alert">
              ⚠️ {error}
            </div>
          )}

          {/* Input row */}
          <div className="ai-chat-input-row">
            <textarea
              ref={textareaRef}
              className="ai-chat-input"
              placeholder="Ask me anything about FreshFarm…"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
              aria-label="Type your message"
              id="ai-chat-textarea"
            />
            <button
              className="ai-chat-send-btn"
              onClick={() => sendMessage()}
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send message"
              id="ai-chat-send-btn"
            >
              {isLoading ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      )}

      {/* ── Floating Action Button ───────────────────────────────────────── */}
      <button
        className={`ai-chat-fab ${isOpen ? 'is-open' : ''}`}
        onClick={toggleChat}
        aria-label={isOpen ? 'Close FarmBot chat' : 'Open FarmBot chat'}
        title={isOpen ? 'Close chat' : 'Chat with FarmBot 🌿'}
        id="ai-chat-fab-btn"
      >
        {hasNewMsg && !isOpen && (
          <span className="ai-chat-fab-badge" aria-label="New message">1</span>
        )}
        <span className="ai-chat-fab-icon" aria-hidden="true">
          {isOpen ? '✕' : '🌿'}
        </span>
      </button>
    </>
  );
};

export default AIChatbot;
