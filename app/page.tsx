'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Menu, Plus, MessageSquare, X, Sparkles, Scale, Thermometer,
    Download, Moon, Sun, LogOut, User, FileText, Paperclip, Mic,
    MicOff, Send, Copy, Globe, Code, Brain, TrendingUp, BookOpen,
    Languages, Pencil, Search, type LucideIcon,
} from 'lucide-react';
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
type ModelId = 'llama-3.3-70b-versatile' | 'mixtral-8x7b-32768' | 'meta-llama/llama-4-scout-17b-16e-instruct';

const STORAGE_KEY = 'ai_chat_conversations';
const MAX_INPUT_LENGTH = 4000;
const THROTTLE_MS = 800;

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

function getErrorMessage(resp?: Response, err?: unknown): string {
    if (!resp) {
        if (err instanceof TypeError && (err as TypeError).message.includes('fetch')) {
            return '🌐 Không có kết nối. Kiểm tra internet và thử lại!';
        }
        return '❌ Có lỗi xảy ra. Vui lòng thử lại!';
    }
    if (resp.status === 429) return '⏱️ Đã vượt giới hạn API. Vui lòng thử lại sau ít phút!';
    if (resp.status === 503) return '🔧 Dịch vụ tạm thời không khả dụng. Thử lại sau!';
    if (resp.status === 401 || resp.status === 403) return '🔑 API key không hợp lệ. Liên hệ quản trị viên!';
    if (resp.status >= 500) return '💥 Lỗi máy chủ. Vui lòng thử lại!';
    return '❌ Có lỗi xảy ra. Vui lòng thử lại!';
}

const SUGGESTIONS: { icon: LucideIcon; text: string; label: string }[] = [
    { icon: Globe, text: 'Biến đổi khí hậu', label: 'Giải thích biến đổi khí hậu là gì và tác động của nó' },
    { icon: Code, text: 'Viết code', label: 'Viết hàm Python đọc file CSV và tính trung bình cột' },
    { icon: Brain, text: 'Tâm lý học', label: 'Tại sao con người hay trì hoãn công việc quan trọng?' },
    { icon: TrendingUp, text: 'Đầu tư', label: 'Hướng dẫn đầu tư an toàn cho người mới bắt đầu' },
];

const PRESETS: { icon: LucideIcon; label: string; prompt: string }[] = [
    { icon: BookOpen, label: 'Học tập', prompt: 'Giải thích khái niệm này một cách dễ hiểu: ' },
    { icon: Code, label: 'Code', prompt: 'Viết code để giải quyết bài toán: ' },
    { icon: Languages, label: 'Dịch thuật', prompt: 'Dịch sang tiếng Anh tự nhiên: ' },
    { icon: Pencil, label: 'Sáng tạo', prompt: 'Viết một đoạn văn sáng tạo về chủ đề: ' },
    { icon: Search, label: 'Phân tích', prompt: 'Phân tích ưu và nhược điểm của: ' },
];

export default function Home() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [level, setLevel] = useState<ExpertiseLevel>('Intermediate');
    const [model, setModel] = useState<ModelId>('llama-3.3-70b-versatile');
    const [temperature, setTemperature] = useState(0.7);
    const [isDebateMode, setIsDebateMode] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [attachment, setAttachment] = useState<Attachment | null>(null);
    const [markedReady, setMarkedReady] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const lastSentRef = useRef<number>(0);
    const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activeConv = conversations.find(c => c.id === activeId);
    const messages = activeConv?.messages || [];

    // Detect mobile
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Load data
    useEffect(() => {
        const saved = loadConversations();
        setConversations(saved);
        if (saved.length > 0) setActiveId(saved[0].id);
        const theme = localStorage.getItem('theme') || 'light';
        if (theme === 'dark') { setDarkMode(true); document.documentElement.setAttribute('data-theme', 'dark'); }
        const savedTemp = localStorage.getItem('temperature');
        if (savedTemp) setTemperature(parseFloat(savedTemp));
        // Load saved user email
        const savedEmail = localStorage.getItem('user_email');
        if (savedEmail) setUserEmail(savedEmail);
        // On mobile, start with sidebar closed
        if (window.innerWidth <= 768) setSidebarOpen(false);
        loadMarked().then(() => setMarkedReady(true));
    }, []);

    useEffect(() => {
        if (markedReady) setMarkedReady(true);
    }, [markedReady]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Auto-clear error after 4s
    const showError = (msg: string) => {
        setErrorMsg(msg);
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
        errorTimerRef.current = setTimeout(() => setErrorMsg(null), 4000);
    };

    const toggleDark = () => {
        const next = !darkMode;
        setDarkMode(next);
        document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
        localStorage.setItem('theme', next ? 'dark' : 'light');
    };

    const handleSidebarToggle = () => {
        setSidebarOpen(p => !p);
    };

    const closeSidebarOnMobile = () => {
        if (isMobile) setSidebarOpen(false);
    };

    const newChat = () => {
        const conv: Conversation = { id: generateId(), title: 'Cuộc trò chuyện mới', messages: [], createdAt: Date.now() };
        const updated = [conv, ...conversations];
        setConversations(updated);
        saveConversations(updated);
        setActiveId(conv.id);
        setInput('');
        setAttachment(null);
        closeSidebarOnMobile();
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
        // Throttle: prevent sending too fast
        const now = Date.now();
        if (now - lastSentRef.current < THROTTLE_MS) return;
        if (!textToSend.trim() && !attachment) return;
        if (isLoading) return;

        lastSentRef.current = now;

        let targetId = activeId;

        if (!targetId) {
            const conv: Conversation = { id: generateId(), title: textToSend.slice(0, 40), messages: [], createdAt: Date.now() };
            const updated = [conv, ...conversations];
            setConversations(updated);
            saveConversations(updated);
            setActiveId(conv.id);
            targetId = conv.id;
        }

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
        if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }

        const aiMsg: Message = { role: 'assistant', content: '', timestamp: Date.now() };
        const messagesWithAI = [...newMessages, aiMsg];

        setConversations(prev => {
            const updated = prev.map(c => c.id === targetId ? { ...c, messages: messagesWithAI } : c);
            saveConversations(updated);
            return updated;
        });

        let lastResp: Response | undefined;
        try {
            const resp = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages.map(m => ({ role: m.role, content: m.content })),
                    expertiseLevel: level,
                    isDebateMode,
                    model,
                    temperature,
                    imageBase64: attachment?.base64 || null,
                    imageMime: attachment?.mimeType || null,
                    fileText: attachment?.fileText || null,
                }),
            });

            lastResp = resp;

            if (!resp.ok || !resp.body) {
                const errMsg = getErrorMessage(resp);
                throw new Error(errMsg);
            }

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

        } catch (err) {
            const msg = err instanceof Error ? err.message : getErrorMessage(lastResp, err);
            showError(msg);
            setConversations(prev => {
                const updated = prev.map(c => {
                    if (c.id !== targetId) return c;
                    const msgs = c.messages.map((m, i) =>
                        i === c.messages.length - 1 && m.role === 'assistant'
                            ? { ...m, content: msg } : m);
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

    const handlePreset = (prompt: string) => {
        setInput(prompt);
        textareaRef.current?.focus();
        autoResize();
    };

    const handleTempChange = (val: number) => {
        setTemperature(val);
        localStorage.setItem('temperature', String(val));
    };

    const renderContent = (content: string) => {
        if (!content.includes('```mermaid')) {
            const html = parseMarkdown(content);
            return <div className={styles.markdownContent} dangerouslySetInnerHTML={{ __html: html }} />;
        }
        // Use precise regex to extract only mermaid blocks, leave other code blocks intact
        const parts: React.ReactNode[] = [];
        const regex = /```mermaid\n([\s\S]*?)```/g;
        let lastIndex = 0;
        let match;
        let key = 0;
        while ((match = regex.exec(content)) !== null) {
            if (match.index > lastIndex) {
                const html = parseMarkdown(content.slice(lastIndex, match.index));
                parts.push(<div key={key++} className={styles.markdownContent} dangerouslySetInnerHTML={{ __html: html }} />);
            }
            parts.push(<Mermaid key={key++} chart={match[1].trim()} />);
            lastIndex = match.index + match[0].length;
        }
        if (lastIndex < content.length) {
            const html = parseMarkdown(content.slice(lastIndex));
            parts.push(<div key={key++} className={styles.markdownContent} dangerouslySetInnerHTML={{ __html: html }} />);
        }
        return parts;
    };

    const charCount = input.length;
    const showCharCounter = charCount > 3000;

    return (
        <div className={styles.appContainer}>
            {/* ── Sidebar Backdrop (mobile) ── */}
            {isMobile && sidebarOpen && (
                <div className={styles.sidebarBackdrop} onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── Sidebar ── */}
            <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.collapsed : ''}`}>
                <div className={styles.sidebarHeader}>
                    <span className={styles.sidebarTitle}><Sparkles size={15} strokeWidth={2.5} /> AI Chat</span>
                    <button className={styles.newChatBtn} onClick={newChat}><Plus size={15} strokeWidth={2.5} /> Cuộc trò chuyện mới</button>
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
                            onClick={() => { setActiveId(c.id); closeSidebarOnMobile(); }}
                        >
                            <MessageSquare size={13} className={styles.convIcon} />
                            <span className={styles.convTitle}>{c.title || 'Cuộc trò chuyện mới'}</span>
                            <button className={styles.convDelete} onClick={e => deleteConv(c.id, e)} title="Xóa"><X size={13} /></button>
                        </div>
                    ))}
                </div>
            </aside>

            {/* ── Main ── */}
            <div className={styles.chatArea}>
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <button className={styles.menuBtn} onClick={handleSidebarToggle} title="Sidebar"><Menu size={20} /></button>
                        <div>
                            <div className={styles.headerTitle}><Sparkles size={16} strokeWidth={2.5} className={styles.headerSpark} /> AI Chat</div>
                            <div className={styles.headerSubtitle}>Powered by Groq & Llama</div>
                        </div>
                    </div>
                    <div className={styles.headerRight}>
                        <button className={`${styles.iconBtn} ${isDebateMode ? styles.active : ''}`} onClick={() => setIsDebateMode(p => !p)}>
                            <Scale size={15} /><span className={styles.labelText}> Debate</span>
                        </button>
                        <select className={styles.levelSelect} value={level} onChange={e => setLevel(e.target.value as ExpertiseLevel)}>
                            <option value="Newbie">Đơn giản</option>
                            <option value="Intermediate">Bình thường</option>
                            <option value="Expert">Chuyên sâu</option>
                        </select>
                        <select className={styles.modelSelect} value={model} onChange={e => setModel(e.target.value as ModelId)}>
                            <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                            <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                            <option value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Vision</option>
                        </select>
                        {/* Temperature slider – hidden on mobile via CSS */}
                        <div className={styles.tempControl} title={`Độ sáng tạo: ${temperature}`}>
                            <Thermometer size={14} />
                            <input
                                type="range"
                                className={styles.tempSlider}
                                min={0.1}
                                max={1.0}
                                step={0.1}
                                value={temperature}
                                onChange={e => handleTempChange(parseFloat(e.target.value))}
                            />
                            <span className={styles.tempValue}>{temperature.toFixed(1)}</span>
                        </div>
                        <button className={styles.iconBtn} onClick={exportChat} title="Xuất chat">
                            <Download size={15} /><span className={styles.labelText}> Xuất</span>
                        </button>
                        <button className={styles.iconBtn} onClick={toggleDark} title="Đổi giao diện">
                            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                        </button>
                        {userEmail && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.5rem', borderRadius: 20, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                                    {userEmail[0].toUpperCase()}
                                </div>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className={styles.labelText}>
                                    {userEmail.split('@')[0]}
                                </span>
                            </div>
                        )}
                        <button className={styles.iconBtn} onClick={async () => {
                            await fetch('/api/auth', { method: 'DELETE' });
                            localStorage.removeItem('user_email');
                            window.location.href = '/login';
                        }} title="Đăng xuất" style={{ color: '#ef4444', borderColor: '#fca5a5' }}>
                            <LogOut size={15} /><span className={styles.labelText}> Thoát</span>
                        </button>
                    </div>
                </header>

                {/* Messages */}
                <div className={styles.messageList}>
                    {messages.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                {isDebateMode ? <Scale size={48} strokeWidth={1.5} /> : <Sparkles size={48} strokeWidth={1.5} />}
                            </div>
                            <div className={styles.emptyTitle}>
                                {isDebateMode ? 'Chế độ Tranh luận' : 'Xin chào! Tôi là AI'}
                            </div>
                            <div className={styles.emptySubtitle}>
                                {isDebateMode
                                    ? 'Tôi sẽ đóng 2 vai đối lập để phân tích đa chiều về câu hỏi của bạn.'
                                    : `Tôi có thể trả lời mọi câu hỏi ở mức độ ${level === 'Newbie' ? 'Đơn giản' : level === 'Expert' ? 'Chuyên sâu' : 'Bình thường'}.`}
                                <br />
                                <span style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '4px', display: 'inline-block' }}>
                                    Đang dùng: {model === 'llama-3.3-70b-versatile' ? 'Llama 3.3 70B' : model === 'mixtral-8x7b-32768' ? 'Mixtral 8x7B' : 'Llama 4 Vision (Scout 17B)'}
                                </span>
                            </div>
                            <div className={styles.suggestionGrid}>
                                {SUGGESTIONS.map((s, i) => (
                                    <button key={i} className={styles.suggestionCard} onClick={() => handleSend(s.label)}>
                                        <s.icon size={16} className={styles.suggestionIcon} />
                                        {s.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`${styles.messageRow} ${msg.role === 'user' ? styles.user : ''}`}>
                                <div className={`${styles.avatar} ${msg.role === 'user' ? styles.avatarUser : styles.avatarAI}`}>
                                    {msg.role === 'user' ? <User size={16} strokeWidth={2} /> : <Sparkles size={16} strokeWidth={2} />}
                                </div>
                                <div className={styles.bubbleWrapper}>
                                    <div className={`${styles.bubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI}`}>
                                        {msg.attachment && (
                                            msg.attachment.isFile ? (
                                                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '0.4rem 0.7rem', marginBottom: '0.5rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <FileText size={13} /> {msg.attachment.name}
                                                </div>
                                            ) : (
                                                <img src={msg.attachment.dataUrl} alt="attachment" className={styles.msgImage} />
                                            )
                                        )}
                                        {msg.content ? renderContent(msg.content) : (
                                            msg.role === 'assistant' && isLoading && idx === messages.length - 1
                                                ? <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Đang soạn...</span>
                                                : null
                                        )}
                                    </div>
                                    <div className={styles.msgMeta}>{formatTime(msg.timestamp)}</div>
                                    {msg.role === 'assistant' && msg.content && (
                                        <div className={styles.msgActions}>
                                            <button className={styles.actionBtn} onClick={() => navigator.clipboard.writeText(msg.content)}><Copy size={12} /> Copy</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                        <div className={styles.typingRow}>
                            <div className={`${styles.avatar} ${styles.avatarAI}`}><Sparkles size={16} strokeWidth={2} /></div>
                            <div className={styles.typingBubble}>
                                <div className={styles.dot} /><div className={styles.dot} /><div className={styles.dot} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className={styles.inputArea}>
                    {/* Preset prompt chips */}
                    <div className={styles.presetChips}>
                        {PRESETS.map((p, i) => (
                            <button key={i} className={styles.presetChip} onClick={() => handlePreset(p.prompt)}>
                                <p.icon size={12} />{p.label}
                            </button>
                        ))}
                    </div>

                    {attachment && (
                        <div className={styles.attachPreview}>
                            {attachment.isFile ? (
                                <span><FileText size={14} /> {attachment.name}</span>
                            ) : (
                                <img src={attachment.dataUrl} alt="preview" />
                            )}
                            <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {attachment.name}
                            </span>
                            <button className={styles.removeAttach} onClick={() => setAttachment(null)}><X size={14} /></button>
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
                            maxLength={MAX_INPUT_LENGTH}
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
                                disabled={isLoading}
                            ><Paperclip size={18} /></button>
                            <button
                                className={`${styles.inputIconBtn} ${isRecording ? styles.recording : ''}`}
                                onClick={handleVoice}
                                title={isRecording ? 'Đang ghi âm... (click để dừng)' : 'Nhập bằng giọng nói'}
                                disabled={isLoading}
                            >{isRecording ? <MicOff size={18} /> : <Mic size={18} />}</button>
                            <button
                                className={styles.sendBtn}
                                onClick={() => handleSend(input)}
                                disabled={isLoading || (!input.trim() && !attachment)}
                                title="Gửi"
                            ><Send size={17} strokeWidth={2} /></button>
                        </div>
                    </div>
                    {showCharCounter && (
                        <div className={`${styles.charCounter} ${charCount > 3800 ? styles.danger : styles.warn}`}>
                            {charCount}/{MAX_INPUT_LENGTH}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Error Toast ── */}
            {errorMsg && (
                <div className={styles.errorToast} onClick={() => setErrorMsg(null)}>
                    {errorMsg}
                </div>
            )}
        </div>
    );
}
