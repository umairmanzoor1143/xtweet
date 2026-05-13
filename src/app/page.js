'use client';

import { useState } from 'react';

const modes = [
  { id: 'professional', name: 'Professional insight or actionable advice' },
  { id: 'learning', name: 'Share a new learning or knowledge nugget' },
  { id: 'reaction', name: 'Short powerful statement that causes a reaction' },
  { id: 'relatable', name: 'A personal story that others can relate to' },
  { id: 'listicle', name: 'List of actionable tips (not numbered)' },
  { id: 'question', name: 'Popular, actionable question (e.g. "How to validate a startup idea?")' },
  { id: 'routine', name: 'Daily habits with results' },
];

const MAX_POST_LENGTH = 280;

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 12h18M12 3c3 4 3 14 0 18M12 3c-3 4-3 14 0 18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function IconMic() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconSparkles() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
      <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M6 16l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zM18 16l.7 1.6L20 18l-1.3.4L18 20l-.7-1.6L16 18l1.3-.4L18 16z" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  );
}
function IconCopy() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
      <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="5" y="5" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function IconChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
      <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' or 'replies'
  
  // Generate tweets state
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState('professional');
  const [count, setCount] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tweets, setTweets] = useState([]);
  const [charCount, setCharCount] = useState(0);
  const [textLimit, setTextLimit] = useState(280);

  // Generate replies state
  const [tweetToReply, setTweetToReply] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [replyCount, setReplyCount] = useState(3);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [replies, setReplies] = useState([]);
  const [replyCharCount, setReplyCharCount] = useState(0);
  const [replyTextLimit, setReplyTextLimit] = useState(280);

  function handleTopicChange(e) {
    const value = e.target.value;
    setTopic(value.slice(0, textLimit));
    setCharCount(value.length > textLimit ? textLimit : value.length);
  }

  function handleTextLimitChange(e) {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = 280;
    if (value < 40) value = 40;
    if (value > 280) value = 280;
    setTextLimit(value);
    if (topic.length > value) {
      setTopic(topic.slice(0, value));
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError('');
    setTweets([]);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, mode, count, exclude: [], textLimit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to generate');
      setTweets(Array.isArray(data.tweets) ? data.tweets : []);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleMore() {
    if (!topic.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, mode, count, exclude: tweets.map((t) => t.text), textLimit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to generate');
      const incoming = Array.isArray(data.tweets) ? data.tweets : [];
      // De-dup safeguard on client
      const existing = new Set(tweets.map((t) => t.text.toLowerCase()));
      const merged = [...tweets];
      for (const t of incoming) {
        const key = (t.text || '').toLowerCase();
        if (!existing.has(key)) {
          existing.add(key);
          merged.push(t);
        }
      }
      setTweets(merged);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function copy(text) {
    navigator.clipboard.writeText(text);
  }

  async function handleGenerateReplies() {
    setReplyLoading(true);
    setReplyError('');
    setReplies([]);
    try {
      const res = await fetch('/api/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tweetText: tweetToReply, 
          author: authorName || 'the author',
          count: replyCount,
          textLimit: replyTextLimit
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to generate replies');
      setReplies(Array.isArray(data.replies) ? data.replies : []);
    } catch (err) {
      setReplyError(err.message || 'Something went wrong');
    } finally {
      setReplyLoading(false);
    }
  }

  function handleReplyTweetChange(e) {
    const value = e.target.value;
    setTweetToReply(value.slice(0, replyTextLimit));
    setReplyCharCount(value.length > replyTextLimit ? replyTextLimit : value.length);
  }

  function handleReplyTextLimitChange(e) {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = 280;
    if (value < 40) value = 40;
    if (value > 280) value = 280;
    setReplyTextLimit(value);
    if (tweetToReply.length > value) {
      setTweetToReply(tweetToReply.slice(0, value));
    }
  }

  function formatTweetText(text) {
    if (!text) return '';
    
    // Convert numbered lists to proper formatting
    let formatted = text
      .replace(/(\d+\.\s)/g, '\n$1') // Add line break before numbered items
      .replace(/(\n\d+\.\s)/g, '\n• ') // Convert numbered to bullet points
      .replace(/(\n•\s)/g, '\n• ') // Ensure consistent bullet formatting
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .trim();
    
    return formatted;
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-3 sm:px-4 py-6 sm:py-8 md:py-12">
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary inline-block" />
            AI Tweet Studio
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            {activeTab === 'generate' ? "What's on your mind today?" : 'Generate thoughtful replies'}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
            {activeTab === 'generate' 
              ? 'Turn a thought into a feed-ready post. Choose your style, and get crisp, original tweets in seconds.'
              : 'Craft natural replies to any tweet in seconds. Match the tone and engage authentically.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mb-6 sm:mb-8 flex gap-2 justify-center">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'generate'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-input bg-card text-foreground hover:bg-secondary'
            }`}
          >
            Generate Tweets
          </button>
          <button
            onClick={() => setActiveTab('replies')}
            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'replies'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-input bg-card text-foreground hover:bg-secondary'
            }`}
          >
            Generate Replies
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="mb-6 sm:mb-8 flex gap-2 justify-center">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'generate'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-input bg-card text-foreground hover:bg-secondary'
            }`}
          >
            Generate Tweets
          </button>
          <button
            onClick={() => setActiveTab('replies')}
            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'replies'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-input bg-card text-foreground hover:bg-secondary'
            }`}
          >
            Generate Replies
          </button>
        </div>

        {/* Generate Tweets Tab */}
        {activeTab === 'generate' && (
        <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-4 md:p-6 shadow-sm">
          <div className="rounded-lg sm:rounded-xl border border-input/80 bg-background">
            {/* Top chip row */}
            <div className="flex items-center gap-2 p-2 sm:p-3 border-b border-border/60">
              <button className="h-6 w-6 sm:h-7 sm:w-7 grid place-items-center rounded-full border border-input bg-card hover:bg-secondary" aria-label="Add">
                <IconPlus />
              </button>
              {topic ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-input bg-card px-2 sm:px-3 py-1 text-xs text-foreground/80 max-w-[40%] sm:max-w-[50%] truncate">
                  {topic}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Add a link or write a thought…</span>
              )}
            </div>
            {/* Controls row */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 p-2 sm:p-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                <div className="inline-flex items-center gap-2 rounded-lg border border-input bg-card px-2 sm:px-3 py-2 text-sm">
                  <span className="text-foreground text-xs sm:text-sm">Style</span>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="bg-transparent text-foreground text-xs sm:text-sm focus:outline-none min-w-0"
                  >
                    {modes.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto sm:ml-auto">
                <button
                  onClick={handleGenerate}
                  disabled={loading || !topic.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium hover:opacity-90 disabled:opacity-50 shadow-sm"
                >
                  <IconSparkles /> {loading ? 'Generating…' : 'Generate'}
                </button>
                <button
                  onClick={handleMore}
                  disabled={loading || !topic.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-input bg-card text-foreground px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium hover:bg-secondary disabled:opacity-50"
                >
                  <IconSparkles /> Get more tweets
                </button>
              </div>
            </div>
            {/* Textarea */}
            <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
              <label htmlFor="textLimit" className="text-xs text-muted-foreground">Text limit:</label>
              <input
                id="textLimit"
                type="number"
                min={40}
                max={280}
                value={textLimit}
                onChange={handleTextLimitChange}
                className="w-20 border border-input rounded px-2 py-1 text-xs text-foreground bg-background focus:outline-none"
              />
              <span className="text-xs text-muted-foreground">characters</span>
            </div>
            <div className="p-2 sm:p-3 border-t border-border/60">
              <textarea
                value={topic}
                onChange={handleTopicChange}
                placeholder="Write your thought or paste a link…"
                maxLength={textLimit}
                className="w-full resize-y min-h-24 sm:min-h-28 rounded-lg border border-input px-3 sm:px-4 py-2 sm:py-3 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base"
              />
              <div className="text-xs text-muted-foreground text-right mt-1">
                {charCount}/{textLimit} characters
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Generate Replies Tab */}
        {activeTab === 'replies' && (
        <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-4 md:p-6 shadow-sm">
          <div className="rounded-lg sm:rounded-xl border border-input/80 bg-background">
            {/* Author info row */}
            <div className="flex items-center gap-2 p-2 sm:p-3 border-b border-border/60">
              <img alt="avatar" className="h-7 w-7 sm:h-9 sm:w-9 rounded-full object-cover" src="https://avatar.vercel.sh/u" />
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Author name (optional)…"
                className="flex-1 bg-transparent text-foreground text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            {/* Controls row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 sm:p-3 border-b border-border/60">
              <div className="inline-flex items-center gap-2 rounded-lg border border-input bg-card px-2 sm:px-3 py-2 text-sm">
                <span className="text-foreground text-xs sm:text-sm">Replies:</span>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={replyCount}
                  onChange={(e) => setReplyCount(Math.max(1, Math.min(6, parseInt(e.target.value) || 3)))}
                  className="w-12 bg-transparent text-foreground text-xs sm:text-sm focus:outline-none"
                />
              </div>

              <button
                onClick={handleGenerateReplies}
                disabled={replyLoading || !tweetToReply.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium hover:opacity-90 disabled:opacity-50 shadow-sm"
              >
                <IconSparkles /> {replyLoading ? 'Generating…' : 'Generate Replies'}
              </button>
            </div>

            {/* Text limit */}
            <div className="flex flex-col sm:flex-row items-center gap-2 px-2 sm:px-3 pt-2 mb-2">
              <label htmlFor="replyTextLimit" className="text-xs text-muted-foreground">Reply char limit:</label>
              <input
                id="replyTextLimit"
                type="number"
                min={40}
                max={280}
                value={replyTextLimit}
                onChange={handleReplyTextLimitChange}
                className="w-20 border border-input rounded px-2 py-1 text-xs text-foreground bg-background focus:outline-none"
              />
              <span className="text-xs text-muted-foreground">characters</span>
            </div>

            {/* Tweet textarea */}
            <div className="p-2 sm:p-3 border-t border-border/60">
              <textarea
                value={tweetToReply}
                onChange={handleReplyTweetChange}
                placeholder="Paste the tweet you want to reply to…"
                maxLength={replyTextLimit}
                className="w-full resize-y min-h-24 sm:min-h-28 rounded-lg border border-input px-3 sm:px-4 py-2 sm:py-3 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base"
              />
              <div className="text-xs text-muted-foreground text-right mt-1">
                {replyCharCount}/{replyTextLimit} characters
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Errors */}
        {activeTab === 'generate' && error && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-3 sm:px-4 py-3 text-sm">{error}</div>
        )}
        
        {activeTab === 'replies' && replyError && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-3 sm:px-4 py-3 text-sm">{replyError}</div>
        )}

        <h2 className="mt-8 sm:mt-10 mb-4 text-xl sm:text-2xl font-semibold text-center text-foreground">
          {activeTab === 'generate' ? 'Generated Tweets' : 'Generated Replies'}
        </h2>

        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
          {activeTab === 'generate' && (
            <>
              {loading && (
                Array.from({ length: Math.max(2, Math.min(6, count)) }).map((_, i) => (
                  <div key={`s-${i}`} className="rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-4 md:p-5 shadow-sm animate-pulse">
                    <div className="h-3 sm:h-4 w-2/5 bg-muted rounded mb-2 sm:mb-3" />
                    <div className="h-2 sm:h-3 w-full bg-muted rounded mb-1 sm:mb-2" />
                    <div className="h-2 sm:h-3 w-11/12 bg-muted rounded mb-3 sm:mb-4" />
                    <div className="h-6 sm:h-8 w-24 sm:w-32 bg-muted rounded" />
                  </div>
                ))
              )}
              {!loading && tweets.map((t, idx) => (
                <div key={idx} className="rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-4 md:p-5 shadow-sm">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <img alt="avatar" className="h-7 w-7 sm:h-9 sm:w-9 rounded-full object-cover" src="https://avatar.vercel.sh/u" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground text-sm sm:text-base">umair manzoor</div>
                      <p className="text-foreground/80 mt-1 text-sm sm:text-base whitespace-pre-line">{formatTweetText(t.text)}</p>
                      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="flex gap-2">
                          <a href="#" className="rounded-lg border border-input px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-secondary inline-flex items-center gap-1 sm:gap-2">
                            Open in editor <IconChevron />
                          </a>
                        </div>
                        <button onClick={() => copy(t.text)} className="h-6 w-6 sm:h-8 sm:w-8 grid place-items-center rounded-lg border border-input hover:bg-secondary" aria-label="Copy">
                          <IconCopy />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'replies' && (
            <>
              {replyLoading && (
                Array.from({ length: replyCount }).map((_, i) => (
                  <div key={`r-${i}`} className="rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-4 md:p-5 shadow-sm animate-pulse">
                    <div className="h-3 sm:h-4 w-2/5 bg-muted rounded mb-2 sm:mb-3" />
                    <div className="h-2 sm:h-3 w-full bg-muted rounded mb-1 sm:mb-2" />
                    <div className="h-2 sm:h-3 w-4/5 bg-muted rounded" />
                  </div>
                ))
              )}
              {!replyLoading && replies.map((r, idx) => (
                <div key={idx} className="rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-4 md:p-5 shadow-sm">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <img alt="avatar" className="h-7 w-7 sm:h-9 sm:w-9 rounded-full object-cover" src="https://avatar.vercel.sh/u" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground text-sm sm:text-base">You</div>
                      <p className="text-foreground/80 mt-1 text-sm sm:text-base">{r.text}</p>
                      <div className="mt-3 sm:mt-4 flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">{r.text.length} characters</span>
                        <button onClick={() => copy(r.text)} className="h-6 w-6 sm:h-8 sm:w-8 grid place-items-center rounded-lg border border-input hover:bg-secondary" aria-label="Copy">
                          <IconCopy />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
