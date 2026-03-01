'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Mermaid from '../components/Mermaid';
import styles from './page.module.css';

declare global {
    interface Window { marked: any; SpeechRecognition: any; webkitSpeechRecognition: any; }
}

type Attachment = { dataUrl: string; base64: string; mimeType: string; name: string; isFile?: boolean; fileText?: string; };

type Message = {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    attachment?: Attachment;
};

type Conversation = {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
};

type ExpertiseLevel = 'Newbie' | 'Intermediate' | 'Expert';
type ModelId = 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.0-flash';

const STORAGE_KEY = 'ai_chat_conversations';

function loadConversations(): Conversation[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveConversations(convs: Conversation[]) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(convs)); } catch { }
}

function generateId() { return Math.random().toString(36).slice(2, 10); }

function formatTime(ts: number) {
    const d = new Date(ts);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

let markedLoaded = false;
function loadMarked(): Promise<void> {
    if (markedLoaded || typeof window === 'undefined') return Promise.resolve();
    return new Promise(resolve => {
        if (window.marked) { markedLoaded = true; return resolve(); }
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/marked@9/marked.min.js';
        s.onload = () => { markedLoaded = true; resolve(); };
        document.head.appendChild(s);
    });
}

function parseMarkdown(text: string): string {
    if (typeof window !== 'undefined' && window.marked) {
        try { return window.marked.parse(text); } catch { }
    }
    return text.replace(/\n/g, '<br />');
}

const SUGGESTIONS = [
    { icon: '🌍', text: 'Giải thích biến đổi khí hậu', label: 'Giải thích biến đổi khí hậu là gì và tác động của nó' },
    { icon: '💻', text: 'Viết code', label: 'Viết hàm Python đọc file CSV và tính trung bình cột' },
    { icon: '🧠', text: 'Tâm lý học', label: 'Tại sao con người hay trì hoãn công việc quan trọng?' },
    { icon: '📈', text: 'Đầu tư', label: 'Hướng dẫn đầu tư an toàn cho người mới bắt đầu' },
];

export default function Home() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [level, setLevel] = useState<ExpertiseLevel>('Intermediate');
    const [model, setModel] = useState<ModelId>('gemini-2.5-flash');
    const [isDebateMode, setIsDebateMode] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [attachment, setAttachment] = useState<Attachment | null>(null);
    const [markedReady, setMarkedReady] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    const activeConv = conversations.find(c => c.id === activeId);
    const messages = activeConv?.messages || [];

    // Load data
    useEffect(() => {
        const saved = loadConversations();
        setConversations(saved);
        if (saved.length > 0) setActiveId(saved[0].id);
        const theme = localStorage.getItem('theme') || 'light';
        if (theme === 'dark') { setDarkMode(true); document.documentElement.setAttribute('data-theme', 'dark'); }
        loadMarked().then(() => setMarkedReady(true));
    }, []);

    useEffect(() => {
        if (markedReady) setMarkedReady(true); // trigger re-render after marked loads
    }, [markedReady]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const toggleDark = () => {
        const next = !darkMode;
        setDarkMode(next);
        document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
        localStorage.setItem('theme', next ? 'dark' : 'light');
    };

    const newChat = () => {
        const conv: Conversation = { id: generateId(), title: 'Cuộc trò chuyện mới', messages: [], createdAt: Date.now() };
        const updated = [conv, ...conversations];
        setConversations(updated);
        saveConversations(updated);
        setActiveId(conv.id);
        setInput('');
        setAttachment(null);
    };

    const deleteConv = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = conversations.filter(c => c.id !== id);
        setConversations(updated);
        saveConversations(updated);
        if (activeId === id) setActiveId(updated[0]?.id || null);
    };

    const updateMessages = useCallback((id: string, msgs: Message[]) => {
        setConversations(prev => {
            const updated = prev.map(c => c.id === id ? { ...c, messages: msgs, title: msgs[0]?.content.slice(0, 40) || c.title } : c);
            saveConversations(updated);
            return updated;
        });
    }, []);

    const handleSend = async (textToSend: string) => {
        let targetId = activeId;

        if (!targetId) {
            const conv: Conversation = { id: generateId(), title: textToSend.slice(0, 40), messages: [], createdAt: Date.now() };
            const updated = [conv, ...conversations];
            setConversations(updated);
            saveConversations(updated);
            setActiveId(conv.id);
            targetId = conv.id;
        }

        if (!textToSend.trim() && !attachment) return;
        if (isLoading) return;

        const userMsg: Message = { role: 'user', content: textToSend, timestamp: Date.now(), attachment: attachment || undefined };
        const currentConv = conversations.find(c => c.id === targetId) || { messages: [] };
        const newMessages = [...currentConv.messages, userMsg];

        setConversations(prev => {
            const updated = prev.map(c => c.id === targetId
                ? { ...c, messages: newMessages, title: c.title === 'Cuộc trò chuyện mới' ? textToSend.slice(0, 40) : c.title }
                : c);
            saveConversations(updated);
            return updated;
        });

        setInput('');
        setAttachment(null);
        setIsLoading(true);

        const aiMsg: Message = { role: 'assistant', content: '', timestamp: Date.now() };
        const messagesWithAI = [...newMessages, aiMsg];

        setConversations(prev => {
            const updated = prev.map(c => c.id === targetId ? { ...c, messages: messagesWithAI } : c);
            saveConversations(updated);
            return updated;
        });

        try {
            const resp = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages.map(m => ({ role: m.role, content: m.content })),
                    expertiseLevel: level,
                    isDebateMode,
                    model,
                    imageBase64: attachment?.base64 || null,
                    imageMime: attachment?.mimeType || null,
                    fileText: attachment?.fileText || null,
                }),
            });

            if (!resp.ok || !resp.body) throw new Error('API Error');

            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fullText += decoder.decode(value, { stream: true });

                setConversations(prev => {
                    const updated = prev.map(c => {
                        if (c.id !== targetId) return c;
                        const msgs = c.messages.map((m, i) =>
                            i === c.messages.length - 1 && m.role === 'assistant' ? { ...m, content: fullText } : m);
                        return { ...c, messages: msgs };
                    });
                    saveConversations(updated);
                    return updated;
                });
            }

        } catch {
            setConversations(prev => {
                const updated = prev.map(c => {
                    if (c.id !== targetId) return c;
                    const msgs = c.messages.map((m, i) =>
                        i === c.messages.length - 1 && m.role === 'assistant'
                            ? { ...m, content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại!' } : m);
                    return { ...c, messages: msgs };
                });
                saveConversations(updated);
                return updated;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const isImage = file.type.startsWith('image/');
        const isText = file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt');

        const reader = new FileReader();
        if (isImage) {
            reader.onload = ev => {
                const dataUrl = ev.target?.result as string;
                const base64 = dataUrl.split(',')[1];
                setAttachment({ dataUrl, base64, mimeType: file.type, name: file.name });
            };
            reader.readAsDataURL(file);
        } else if (isText) {
            reader.onload = ev => {
                const text = ev.target?.result as string;
                setAttachment({ dataUrl: '', base64: '', mimeType: file.type, name: file.name, isFile: true, fileText: text });
            };
            reader.readAsText(file, 'UTF-8');
        }
        e.target.value = '';
    };

    const handleVoice = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return alert('Trình duyệt không hỗ trợ nhận dạng giọng nói.');
        if (isRecording) { recognitionRef.current?.stop(); return; }
        const recognition = new SR();
        recognition.lang = 'vi-VN';
        recognition.continuous = false;
        recognition.onresult = (e: any) => { setInput(prev => prev + e.results[0][0].transcript); };
        recognition.onend = () => setIsRecording(false);
        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);
    };

    const exportChat = () => {
        if (!messages.length) return;
        const text = messages.map(m => `[${m.role === 'user' ? 'Bạn' : 'AI'}] ${m.content}`).join('\n\n');
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `chat_${Date.now()}.txt`; a.click();
        URL.revokeObjectURL(url);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); }
    };

    const autoResize = () => {
        const ta = textareaRef.current;
        if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'; }
    };

    const renderContent = (content: string) => {
        if (content.includes('```mermaid')) {
            return content.split(/```mermaid|```/).map((chunk, i) => {
                if (i % 2 === 1) return <Mermaid key={i} chart={chunk.trim()} />;
                const html = parseMarkdown(chunk);
                return <div key={i} className={styles.markdownContent} dangerouslySetInnerHTML={{ __html: html }} />;
            });
        }
        const html = parseMarkdown(content);
        return <div className={styles.markdownContent} dangerouslySetInnerHTML={{ __html: html }} />;
    };

    return (
        <div className={styles.appContainer}>
            {/* ── Sidebar ── */}
            <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.collapsed : ''}`}>
                <div className={styles.sidebarHeader}>
                    <span className={styles.sidebarTitle}>✨ AI Chat</span>
                    <button className={styles.newChatBtn} onClick={newChat}>+ Cuộc trò chuyện mới</button>
                </div>
                <div className={styles.conversationList}>
                    {conversations.length === 0 && (
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>
                            Chưa có cuộc trò chuyện nào.
                        </p>
                    )}
                    {conversations.map(c => (
                        <div
                            key={c.id}
                            className={`${styles.convItem} ${c.id === activeId ? styles.active : ''}`}
                            onClick={() => setActiveId(c.id)}
                        >
                            <span className={styles.convTitle}>💬 {c.title || 'Cuộc trò chuyện mới'}</span>
                            <button className={styles.convDelete} onClick={e => deleteConv(c.id, e)} title="Xóa">✕</button>
                        </div>
                    ))}
                </div>
            </aside>

            {/* ── Main ── */}
            <div className={styles.chatArea}>
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <button className={styles.menuBtn} onClick={() => setSidebarOpen(p => !p)} title="Sidebar">☰</button>
                        <div>
                            <div className={styles.headerTitle}>✨ AI Chat</div>
                            <div className={styles.headerSubtitle}>Powered by Gemini</div>
                        </div>
                    </div>
                    <div className={styles.headerRight}>
                        <button className={`${styles.iconBtn} ${isDebateMode ? styles.active : ''}`} onClick={() => setIsDebateMode(p => !p)}>
                            ⚖️ Debate
                        </button>
                        <select className={styles.levelSelect} value={level} onChange={e => setLevel(e.target.value as ExpertiseLevel)}>
                            <option value="Newbie">🎓 Đơn giản</option>
                            <option value="Intermediate">🚀 Bình thường</option>
                            <option value="Expert">🧠 Chuyên sâu</option>
                        </select>
                        <select className={styles.modelSelect} value={model} onChange={e => setModel(e.target.value as ModelId)}>
                            <option value="gemini-2.5-flash">⚡ 2.5 Flash (Nhanh)</option>
                            <option value="gemini-2.5-pro">🧠 2.5 Pro (Thông minh)</option>
                            <option value="gemini-2.0-flash">🔥 2.0 Flash</option>
                        </select>
                        <button className={styles.iconBtn} onClick={exportChat} title="Xuất chat">📤 Xuất</button>
                        <button className={styles.iconBtn} onClick={toggleDark} title="Đổi giao diện">
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                        <button className={styles.iconBtn} onClick={async () => {
                            await fetch('/api/auth', { method: 'DELETE' });
                            window.location.href = '/login';
                        }} title="Đăng xuất" style={{ color: '#ef4444', borderColor: '#fca5a5' }}>
                            🚪 Thoát
                        </button>
                    </div>
                </header>

                {/* Messages */}
                <div className={styles.messageList}>
                    {messages.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>✨</div>
                            <div className={styles.emptyTitle}>Xin chào! Tôi là AI</div>
                            <div className={styles.emptySubtitle}>Tôi có thể trả lời mọi câu hỏi, phân tích hình ảnh, đọc file, viết code và nhiều hơn nữa.</div>
                            <div className={styles.suggestionGrid}>
                                {SUGGESTIONS.map((s, i) => (
                                    <button key={i} className={styles.suggestionCard} onClick={() => handleSend(s.label)}>
                                        {s.icon} {s.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`${styles.messageRow} ${msg.role === 'user' ? styles.user : ''}`}>
                                <div className={`${styles.avatar} ${msg.role === 'user' ? styles.avatarUser : styles.avatarAI}`}>
                                    {msg.role === 'user' ? '👤' : '✨'}
                                </div>
                                <div className={styles.bubbleWrapper}>
                                    <div className={`${styles.bubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI}`}>
                                        {msg.attachment && (
                                            msg.attachment.isFile ? (
                                                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '0.4rem 0.7rem', marginBottom: '0.5rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    📄 {msg.attachment.name}
                                                </div>
                                            ) : (
                                                <img src={msg.attachment.dataUrl} alt="attachment" className={styles.msgImage} />
                                            )
                                        )}
                                        {msg.content ? renderContent(msg.content) : (
                                            msg.role === 'assistant' && isLoading && idx === messages.length - 1
                                                ? <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Đang gõ...</span>
                                                : null
                                        )}
                                    </div>
                                    <div className={styles.msgMeta}>{formatTime(msg.timestamp)}</div>
                                    {msg.role === 'assistant' && msg.content && (
                                        <div className={styles.msgActions}>
                                            <button className={styles.actionBtn} onClick={() => navigator.clipboard.writeText(msg.content)}>📋 Copy</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                        <div className={styles.typingRow}>
                            <div className={`${styles.avatar} ${styles.avatarAI}`}>✨</div>
                            <div className={styles.typingBubble}>
                                <div className={styles.dot} /><div className={styles.dot} /><div className={styles.dot} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className={styles.inputArea}>
                    {attachment && (
                        <div className={styles.attachPreview}>
                            {attachment.isFile ? (
                                <span>📄 {attachment.name}</span>
                            ) : (
                                <img src={attachment.dataUrl} alt="preview" />
                            )}
                            <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {attachment.name}
                            </span>
                            <button className={styles.removeAttach} onClick={() => setAttachment(null)}>✕</button>
                        </div>
                    )}
                    <div className={styles.inputRow}>
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={e => { setInput(e.target.value); autoResize(); }}
                            onKeyDown={handleKeyDown}
                            placeholder="Nhắn tin với AI... (Shift+Enter để xuống dòng)"
                            className={styles.textInput}
                            rows={1}
                            disabled={isLoading}
                        />
                        <div className={styles.inputActions}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*,.txt,.md,.csv"
                                onChange={handleFileAttach}
                                style={{ display: 'none' }}
                            />
                            <button
                                className={styles.inputIconBtn}
                                onClick={() => fileInputRef.current?.click()}
                                title="Đính kèm ảnh hoặc file"
                            >📎</button>
                            <button
                                className={`${styles.inputIconBtn} ${isRecording ? styles.recording : ''}`}
                                onClick={handleVoice}
                                title={isRecording ? 'Đang ghi âm... (click để dừng)' : 'Nhập bằng giọng nói'}
                            >🎤</button>
                            <button
                                className={styles.sendBtn}
                                onClick={() => handleSend(input)}
                                disabled={isLoading || (!input.trim() && !attachment)}
                                title="Gửi"
                            >➤</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
