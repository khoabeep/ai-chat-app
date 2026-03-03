'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { marked } from 'marked'; // #3: npm package thay CDN
import {
    Menu, Plus, MessageSquare, X, Sparkles, Scale, Thermometer,
    Download, Moon, Sun, LogOut, User, FileText, Paperclip, Mic,
    MicOff, Send, Copy, Globe, Code, Brain, TrendingUp, BookOpen,
    Languages, Pencil, Search, Share2, AlignLeft, CheckCheck, History,
    type LucideIcon,
} from 'lucide-react';
import Mermaid from '../components/Mermaid';
import styles from './page.module.css';

// #3: Configure marked (no CDN)
marked.setOptions({ breaks: true, gfm: true } as any);

declare global {
    interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; pdfjsLib: any; }
}

export type SearchSource = { title: string; url: string; snippet: string };

type Attachment = {
    dataUrl: string; base64: string; mimeType: string; name: string;
    isFile?: boolean; fileText?: string;
};

type Message = {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    attachment?: Attachment;
    sources?: SearchSource[]; // #8: search sources
    isStreaming?: boolean;    // #17: streaming cursor flag
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

// ── #18: Debounced localStorage (không save mỗi token) ───────────────────────
let _saveTimer: ReturnType<typeof setTimeout> | null = null;
function loadConversations(): Conversation[] {
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveLS(convs: Conversation[]) {
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(convs)); } catch { }
    }, 300);
}

function generateId() { return Math.random().toString(36).slice(2, 10); }
function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// #3: Render markdown with npm marked
function parseMarkdown(text: string): string {
    try { return marked.parse(text) as string; } catch { return text.replace(/\n/g, '<br />'); }
}

function getErrorMessage(resp?: Response, err?: unknown): string {
    if (!resp) {
        if (err instanceof TypeError && (err as TypeError).message.includes('fetch'))
            return '🌐 Không có kết nối. Kiểm tra internet và thử lại!';
        return '❌ Có lỗi xảy ra. Vui lòng thử lại!';
    }
    if (resp.status === 429) return '⏱️ Đã vượt giới hạn 20 tin nhắn/phút. Vui lòng thử lại sau!';
    if (resp.status === 503) return '🔧 Dịch vụ tạm thời không khả dụng. Thử lại sau!';
    if (resp.status === 401 || resp.status === 403) return '🔑 Lỗi xác thực. Vui lòng đăng nhập lại!';
    if (resp.status >= 500) return '💥 Lỗi máy chủ. Vui lòng thử lại!';
    return '❌ Có lỗi xảy ra. Vui lòng thử lại!';
}

const SUGGESTIONS: { icon: LucideIcon; text: string; label: string }[] = [
    { icon: Globe, text: 'Biến đổi khí hậu', label: 'Giải thích biến đổi khí hậu là gì và tác động của nó' },
    { icon: Code, text: 'Viết code', label: 'Viết hàm Python đọc file CSV và tính trung bình cột' },
    { icon: Brain, text: 'Tâm lý học', label: 'Tại sao con người hay trì hoãn công việc quan trọng?' },
    { icon: TrendingUp, text: 'Đầu tư', label: 'Hướng dẫn đầu tư an toàn cho người mới bắt đầu' },
];

// #14: Enhanced preset gallery
const PRESETS: { icon: LucideIcon; label: string; prompt: string }[] = [
    { icon: BookOpen, label: 'Học tập', prompt: 'Giải thích khái niệm này một cách dễ hiểu: ' },
    { icon: Code, label: 'Code', prompt: 'Viết code để giải quyết bài toán: ' },
    { icon: Languages, label: 'Dịch', prompt: 'Dịch sang tiếng Anh tự nhiên: ' },
    { icon: Pencil, label: 'Sáng tạo', prompt: 'Viết một đoạn văn sáng tạo về chủ đề: ' },
    { icon: Search, label: 'Phân tích', prompt: 'Phân tích ưu và nhược điểm của: ' },
    { icon: AlignLeft, label: 'Tóm tắt', prompt: 'Tóm tắt ngắn gọn nội dung sau: ' },
];

export default function Home() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false); // #7
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [level, setLevel] = useState<ExpertiseLevel>('Intermediate');
    const [model, setModel] = useState<ModelId>('llama-3.3-70b-versatile');
    const [temperature, setTemperature] = useState(0.7);
    const [isDebateMode, setIsDebateMode] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [attachment, setAttachment] = useState<Attachment | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [editingIdx, setEditingIdx] = useState<number | null>(null); // #9
    const [editText, setEditText] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);          // #16
    const [summaryText, setSummaryText] = useState<string | null>(null); // #16

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const editTextareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const lastSentRef = useRef<number>(0);
    const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const firestoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activeConv = conversations.find(c => c.id === activeId);
    const messages = activeConv?.messages || [];

    // #18: Central state + debounced save + #2/#12 async Firestore
    const updateConvs = useCallback((updater: (prev: Conversation[]) => Conversation[]) => {
        setConversations(prev => {
            const next = updater(prev);
            saveLS(next); // #18 debounced localStorage

            // #2/#12: Fire-and-forget Firestore sync
            if (firestoreTimer.current) clearTimeout(firestoreTimer.current);
            firestoreTimer.current = setTimeout(() => {
                fetch('/api/conversations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ conversations: next }),
                }).catch(() => { });
            }, 2000);

            return next;
        });
    }, []);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 768);
        check(); window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        const saved = loadConversations();
        setConversations(saved);
        if (saved.length > 0) setActiveId(saved[0].id);
        const theme = localStorage.getItem('theme') || 'light';
        if (theme === 'dark') { setDarkMode(true); document.documentElement.setAttribute('data-theme', 'dark'); }
        const savedTemp = localStorage.getItem('temperature');
        if (savedTemp) setTemperature(parseFloat(savedTemp));
        const savedEmail = localStorage.getItem('user_email');
        if (savedEmail) {
            setUserEmail(savedEmail);
            // #2/#12: Load from Firestore
            fetch('/api/conversations').then(r => r.json()).then(data => {
                if (data.conversations?.length > 0) {
                    setConversations(data.conversations);
                    setActiveId(data.conversations[0]?.id || null);
                    saveLS(data.conversations);
                }
            }).catch(() => { });
        }
        if (window.innerWidth <= 768) setSidebarOpen(false);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    useEffect(() => {
        if (editingIdx !== null) setTimeout(() => editTextareaRef.current?.focus(), 50);
    }, [editingIdx]);

    const showError = (msg: string) => {
        setErrorMsg(msg);
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
        errorTimerRef.current = setTimeout(() => setErrorMsg(null), 4000);
    };
    const showToast = (msg: string) => {
        setToastMsg(msg);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToastMsg(null), 3000);
    };

    const toggleDark = () => {
        const next = !darkMode;
        setDarkMode(next);
        document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
        localStorage.setItem('theme', next ? 'dark' : 'light');
    };
    const closeSidebarOnMobile = () => { if (isMobile) setSidebarOpen(false); };

    const newChat = () => {
        const conv: Conversation = { id: generateId(), title: 'Cuộc trò chuyện mới', messages: [], createdAt: Date.now() };
        updateConvs(prev => [conv, ...prev]);
        setActiveId(conv.id);
        setInput(''); setAttachment(null); setSummaryText(null);
        closeSidebarOnMobile();
    };

    const deleteConv = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        updateConvs(prev => prev.filter(c => c.id !== id));
        if (activeId === id) {
            const remaining = conversations.filter(c => c.id !== id);
            setActiveId(remaining[0]?.id || null);
        }
    };

    const handleSend = async (textToSend: string) => {
        const now = Date.now();
        if (now - lastSentRef.current < THROTTLE_MS) return;
        if (!textToSend.trim() && !attachment) return;
        if (isLoading) return;
        lastSentRef.current = now;
        setSummaryText(null); setEditingIdx(null);

        let targetId = activeId;
        if (!targetId) {
            const conv: Conversation = { id: generateId(), title: textToSend.slice(0, 40), messages: [], createdAt: Date.now() };
            updateConvs(prev => [conv, ...prev]);
            setActiveId(conv.id);
            targetId = conv.id;
        }

        const userMsg: Message = { role: 'user', content: textToSend, timestamp: Date.now(), attachment: attachment || undefined };
        const currentMsgs = conversations.find(c => c.id === targetId)?.messages || [];
        const newMessages = [...currentMsgs, userMsg];

        updateConvs(prev => prev.map(c => c.id === targetId
            ? { ...c, messages: newMessages, title: c.title === 'Cuộc trò chuyện mới' ? textToSend.slice(0, 40) : c.title }
            : c));

        setInput(''); setAttachment(null); setIsLoading(true);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        // Add empty AI placeholder with streaming flag (#17)
        const aiMsg: Message = { role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true };
        const aiIdx = newMessages.length;
        updateConvs(prev => prev.map(c => c.id === targetId ? { ...c, messages: [...newMessages, aiMsg] } : c));

        let lastResp: Response | undefined;
        try {
            setIsSearching(true); // #7: show indicator

            // #1: Build API messages with file text context
            const apiMessages = newMessages.map(m => ({
                role: m.role,
                content: m.attachment?.fileText
                    ? `[File: ${m.attachment.name}]\n${m.attachment.fileText}\n\n${m.content}`
                    : m.content,
            }));

            const resp = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: apiMessages,
                    expertiseLevel: level, isDebateMode, model, temperature,
                    imageBase64: attachment?.base64 || null,
                    imageMime: attachment?.mimeType || null,
                    fileText: attachment?.fileText || null,
                }),
            });

            lastResp = resp;

            // #7/#8: Read search headers immediately
            const searchDone = resp.headers.get('X-Search-Done') === 'true';
            setIsSearching(false);
            let sources: SearchSource[] = [];
            if (searchDone) {
                try {
                    const b64 = resp.headers.get('X-Search-Sources') || '';
                    if (b64) {
                        // atob() trả về Latin-1, phải dùng TextDecoder để đọc UTF-8 đúng
                        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
                        sources = JSON.parse(new TextDecoder('utf-8').decode(bytes));
                    }
                } catch { }
            }

            if (!resp.ok || !resp.body) throw new Error(getErrorMessage(resp));

            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fullText += decoder.decode(value, { stream: true });

                // #18: Update state without saving to localStorage during stream
                setConversations(prev => prev.map(c => {
                    if (c.id !== targetId) return c;
                    const msgs = c.messages.map((m, i) => i === aiIdx ? { ...m, content: fullText } : m);
                    return { ...c, messages: msgs };
                }));
            }

            // Stream done: finalize message, save (#18 debounced)
            updateConvs(prev => prev.map(c => {
                if (c.id !== targetId) return c;
                const msgs = c.messages.map((m, i) =>
                    i === aiIdx ? { ...m, content: fullText, sources: sources.length ? sources : undefined, isStreaming: false } : m);
                return { ...c, messages: msgs };
            }));

        } catch (err) {
            setIsSearching(false);
            const msg = err instanceof Error ? err.message : getErrorMessage(lastResp, err);
            showError(msg);
            updateConvs(prev => prev.map(c => {
                if (c.id !== targetId) return c;
                const msgs = c.messages.map((m, i) => i === aiIdx ? { ...m, content: msg, isStreaming: false } : m);
                return { ...c, messages: msgs };
            }));
        } finally {
            setIsLoading(false); setIsSearching(false);
        }
    };

    // #9: Edit and resend
    const startEdit = (idx: number, content: string) => { setEditingIdx(idx); setEditText(content); };
    const confirmEdit = async () => {
        if (editingIdx === null || !editText.trim()) return;
        const trimmed = editText.trim();
        updateConvs(prev => prev.map(c => {
            if (c.id !== activeId) return c;
            return { ...c, messages: c.messages.slice(0, editingIdx) };
        }));
        setEditingIdx(null); setEditText('');
        await handleSend(trimmed);
    };

    // #15: File attach with PDF support
    const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const isImage = file.type.startsWith('image/');
        const isText = file.type.startsWith('text/') || /\.(md|txt|csv)$/i.test(file.name);
        const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

        const reader = new FileReader();
        if (isImage) {
            reader.onload = ev => {
                const dataUrl = ev.target?.result as string;
                setAttachment({ dataUrl, base64: dataUrl.split(',')[1], mimeType: file.type, name: file.name });
            };
            reader.readAsDataURL(file);
        } else if (isText) {
            reader.onload = ev => {
                setAttachment({ dataUrl: '', base64: '', mimeType: file.type, name: file.name, isFile: true, fileText: ev.target?.result as string });
            };
            reader.readAsText(file, 'UTF-8');
        } else if (isPdf) {
            reader.onload = async ev => {
                try {
                    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
                    GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;
                    const pdf = await getDocument({ data: ev.target?.result as ArrayBuffer }).promise;
                    let text = '';
                    for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        text += (content.items as any[]).map(item => item.str).join(' ') + '\n';
                    }
                    setAttachment({ dataUrl: '', base64: '', mimeType: 'application/pdf', name: file.name, isFile: true, fileText: text.trim() });
                    showToast(`📄 Đọc thành công ${Math.min(pdf.numPages, 20)} trang PDF`);
                } catch {
                    showError('Không đọc được PDF. Thử convert sang .txt trước!');
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            showError('Chỉ hỗ trợ: ảnh, .txt, .md, .csv, .pdf');
        }
        e.target.value = '';
    };

    const handleVoice = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return showError('Trình duyệt không hỗ trợ nhận dạng giọng nói.');
        if (isRecording) { recognitionRef.current?.stop(); return; }
        const recognition = new SR();
        recognition.lang = 'vi-VN'; recognition.continuous = false;
        recognition.onresult = (e: any) => setInput(prev => prev + e.results[0][0].transcript);
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

    // #13: Share - copy as markdown
    const shareConversation = async () => {
        if (!messages.length) return;
        const text = messages.map(m => `**${m.role === 'user' ? '👤 Bạn' : '🤖 KhoaAI'}:** ${m.content}`).join('\n\n---\n\n');
        try {
            await navigator.clipboard.writeText(text);
            showToast('✅ Đã copy toàn bộ hội thoại!');
        } catch { showError('Không thể copy. Thử lại!'); }
    };

    // #16: Summarize
    const handleSummarize = async () => {
        if (!messages.length || isSummarizing) return;
        setIsSummarizing(true); setSummaryText(null);
        try {
            const resp = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: messages.slice(-20) }),
            });
            const data = await resp.json();
            setSummaryText(data.summary || 'Không thể tóm tắt.');
        } catch { showError('Không thể tóm tắt. Thử lại!'); }
        finally { setIsSummarizing(false); }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); }
    };
    const autoResize = () => {
        const ta = textareaRef.current;
        if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'; }
    };
    const handlePreset = (prompt: string) => {
        setInput(prompt); textareaRef.current?.focus(); autoResize();
    };
    const handleTempChange = (val: number) => {
        setTemperature(val); localStorage.setItem('temperature', String(val));
    };

    const renderContent = (content: string) => {
        if (!content.includes('```mermaid')) {
            return <div className={styles.markdownContent} dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />;
        }
        const parts: React.ReactNode[] = [];
        const regex = /```mermaid\n([\s\S]*?)```/g;
        let lastIndex = 0, match, key = 0;
        while ((match = regex.exec(content)) !== null) {
            if (match.index > lastIndex)
                parts.push(<div key={key++} className={styles.markdownContent} dangerouslySetInnerHTML={{ __html: parseMarkdown(content.slice(lastIndex, match.index)) }} />);
            parts.push(<Mermaid key={key++} chart={match[1].trim()} />);
            lastIndex = match.index + match[0].length;
        }
        if (lastIndex < content.length)
            parts.push(<div key={key++} className={styles.markdownContent} dangerouslySetInnerHTML={{ __html: parseMarkdown(content.slice(lastIndex)) }} />);
        return parts;
    };

    const charCount = input.length;
    const showCharCounter = charCount > 3000;

    return (
        <div className={styles.appContainer}>
            {isMobile && sidebarOpen && <div className={styles.sidebarBackdrop} onClick={() => setSidebarOpen(false)} />}

            {/* ── Sidebar ── */}
            <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.collapsed : ''}`}>
                <div className={styles.sidebarHeader}>
                    <span className={styles.sidebarTitle}><Sparkles size={15} strokeWidth={2.5} /> KhoaAI</span>
                    <button className={styles.newChatBtn} onClick={newChat}><Plus size={15} strokeWidth={2.5} /> Cuộc trò chuyện mới</button>
                </div>
                <div className={styles.conversationList}>
                    {conversations.length === 0 && (
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>
                            Chưa có cuộc trò chuyện nào.
                        </p>
                    )}
                    {conversations.map(c => (
                        <div key={c.id} className={`${styles.convItem} ${c.id === activeId ? styles.active : ''}`}
                            onClick={() => { setActiveId(c.id); setSummaryText(null); closeSidebarOnMobile(); }}>
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
                        <button className={styles.menuBtn} onClick={() => setSidebarOpen(p => !p)} title="Sidebar"><Menu size={20} /></button>
                        <div>
                            <div className={styles.headerTitle}><Sparkles size={16} strokeWidth={2.5} className={styles.headerSpark} /> KhoaAI</div>
                            <div className={styles.headerSubtitle}>Powered by Groq AI</div>
                        </div>
                    </div>
                    <div className={styles.headerRight}>
                        {!userEmail && (
                            <a href="/login" className={styles.guestBadge} title="Đăng nhập để mở khóa tính năng">👤 Guest</a>
                        )}
                        <button className={`${styles.iconBtn} ${isDebateMode ? styles.active : ''} ${!userEmail ? styles.locked : ''}`}
                            onClick={() => userEmail ? setIsDebateMode(p => !p) : window.location.href = '/login'}
                            title={userEmail ? 'Chế độ tranh luận' : '🔒 Đăng nhập để dùng Debate'}>
                            <Scale size={15} /><span className={styles.labelText}> Debate{!userEmail && ' 🔒'}</span>
                        </button>
                        <select className={styles.levelSelect} value={level} onChange={e => setLevel(e.target.value as ExpertiseLevel)}>
                            <option value="Newbie">Đơn giản</option>
                            <option value="Intermediate">Bình thường</option>
                            <option value="Expert">Chuyên sâu</option>
                        </select>
                        <select className={styles.modelSelect}
                            value={userEmail ? model : 'llama-3.3-70b-versatile'}
                            onChange={e => { if (userEmail) setModel(e.target.value as ModelId); else window.location.href = '/login'; }}
                            style={!userEmail ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
                            <option value="llama-3.3-70b-versatile">KhoaAI Standard</option>
                            {userEmail && <option value="mixtral-8x7b-32768">KhoaAI Turbo</option>}
                            {userEmail && <option value="meta-llama/llama-4-scout-17b-16e-instruct">KhoaAI Vision 🔓</option>}
                            {!userEmail && <option disabled>⭐ Đăng nhập để xem thêm...</option>}
                        </select>
                        <div className={styles.tempControl}
                            title={userEmail ? `Độ sáng tạo: ${temperature}` : '🔒 Đăng nhập để điều chỉnh'}
                            style={!userEmail ? { opacity: 0.4, pointerEvents: 'none' } : {}}>
                            <Thermometer size={14} />
                            <input type="range" className={styles.tempSlider} min={0.1} max={1.0} step={0.1}
                                value={temperature} onChange={e => handleTempChange(parseFloat(e.target.value))} disabled={!userEmail} />
                            <span className={styles.tempValue}>{temperature.toFixed(1)}</span>
                        </div>
                        {messages.length > 0 && (
                            <button className={styles.iconBtn} onClick={shareConversation} title="Copy hội thoại">
                                <Share2 size={15} /><span className={styles.labelText}> Share</span>
                            </button>
                        )}
                        {messages.length > 2 && (
                            <button className={styles.iconBtn} onClick={handleSummarize} disabled={isSummarizing} title="Tóm tắt hội thoại">
                                <AlignLeft size={15} /><span className={styles.labelText}>{isSummarizing ? ' ...' : ' Tóm tắt'}</span>
                            </button>
                        )}
                        <button className={styles.iconBtn}
                            onClick={() => userEmail ? exportChat() : window.location.href = '/login'}
                            title={userEmail ? 'Xuất chat' : '🔒 Đăng nhập để xuất chat'}
                            style={!userEmail ? { opacity: 0.45 } : {}}>
                            <Download size={15} /><span className={styles.labelText}> Xuất</span>
                        </button>
                        <button className={styles.iconBtn} onClick={toggleDark} title="Đổi giao diện">
                            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                        </button>
                        {userEmail && (
                            <div className={styles.userBadge}>
                                <div className={styles.userAvatar}>{userEmail[0].toUpperCase()}</div>
                                <span className={`${styles.userEmail} ${styles.labelText}`}>{userEmail.split('@')[0]}</span>
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

                {/* #16: Summary panel */}
                {summaryText && (
                    <div className={styles.summaryPanel}>
                        <div className={styles.summaryHeader}>
                            <AlignLeft size={14} /> <strong>Tóm tắt hội thoại</strong>
                            <button className={styles.summaryClose} onClick={() => setSummaryText(null)}><X size={14} /></button>
                        </div>
                        <div className={styles.summaryBody} dangerouslySetInnerHTML={{ __html: parseMarkdown(summaryText) }} />
                    </div>
                )}

                {/* Messages */}
                <div className={styles.messageList}>
                    {messages.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                {isDebateMode ? <Scale size={48} strokeWidth={1.5} /> : <Sparkles size={48} strokeWidth={1.5} />}
                            </div>
                            <div className={styles.emptyTitle}>
                                {isDebateMode ? 'Chế độ Tranh luận' : 'Xin chào! Tôi là KhoaAI'}
                            </div>
                            <div className={styles.emptySubtitle}>
                                {isDebateMode
                                    ? 'Tôi sẽ đóng 2 vai đối lập để phân tích đa chiều về câu hỏi của bạn.'
                                    : `Tôi có thể trả lời mọi câu hỏi ở mức độ ${level === 'Newbie' ? 'Đơn giản' : level === 'Expert' ? 'Chuyên sâu' : 'Bình thường'}.`}
                                <br />
                                <span style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '4px', display: 'inline-block' }}>
                                    Đang dùng: {model === 'llama-3.3-70b-versatile' ? 'KhoaAI Standard' : model === 'mixtral-8x7b-32768' ? 'KhoaAI Turbo' : 'KhoaAI Vision'}
                                </span>
                            </div>
                            <div className={styles.suggestionGrid}>
                                {SUGGESTIONS.map((s, i) => (
                                    <button key={i} className={styles.suggestionCard} onClick={() => handleSend(s.label)}>
                                        <s.icon size={16} className={styles.suggestionIcon} /> {s.text}
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
                                    {/* #9: Edit mode */}
                                    {editingIdx === idx ? (
                                        <div className={styles.editContainer}>
                                            <textarea ref={editTextareaRef} className={styles.editTextarea} value={editText}
                                                onChange={e => setEditText(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); confirmEdit(); }
                                                    if (e.key === 'Escape') setEditingIdx(null);
                                                }} rows={3} />
                                            <div className={styles.editActions}>
                                                <button className={styles.editConfirmBtn} onClick={confirmEdit}><CheckCheck size={14} /> Gửi lại</button>
                                                <button className={styles.editCancelBtn} onClick={() => setEditingIdx(null)}><X size={14} /> Hủy</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`${styles.bubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI} ${msg.isStreaming ? styles.streaming : ''}`}>
                                            {msg.attachment && (
                                                msg.attachment.isFile
                                                    ? <div className={styles.fileChip}><FileText size={13} /> {msg.attachment.name}</div>
                                                    : <img src={msg.attachment.dataUrl} alt="attachment" className={styles.msgImage} />
                                            )}
                                            {msg.content
                                                ? renderContent(msg.content)
                                                : (msg.role === 'assistant' && isLoading && idx === messages.length - 1
                                                    // #11: Loading skeleton
                                                    ? (isSearching
                                                        ? <div className={styles.searchingIndicator}><Globe size={13} className={styles.searchingIcon} /> Đang tìm kiếm web...</div>
                                                        : <div className={styles.skeleton}><div /><div /><div style={{ width: '60%' }} /></div>)
                                                    : null)
                                            }
                                        </div>
                                    )}
                                    <div className={styles.msgMeta}>{formatTime(msg.timestamp)}</div>

                                    {/* Actions */}
                                    <div className={styles.msgActions}>
                                        {msg.role === 'assistant' && msg.content && (
                                            <button className={styles.actionBtn} onClick={() => navigator.clipboard.writeText(msg.content)}>
                                                <Copy size={12} /> Copy
                                            </button>
                                        )}
                                        {/* #9: Edit button */}
                                        {msg.role === 'user' && !isLoading && editingIdx !== idx && (
                                            <button className={styles.actionBtn} onClick={() => startEdit(idx, msg.content)}>
                                                <Pencil size={12} /> Sửa
                                            </button>
                                        )}
                                    </div>

                                    {/* #8: Search sources */}
                                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                                        <div className={styles.sourcesBox}>
                                            <div className={styles.sourcesTitle}><Globe size={12} /> Nguồn tham khảo</div>
                                            {msg.sources.slice(0, 3).map((src, i) => (
                                                <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" className={styles.sourceItem}>
                                                    <span className={styles.sourceNum}>{i + 1}</span>
                                                    <span className={styles.sourceTitle}>{src.title}</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}

                    {/* Typing indicator */}
                    {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                        <div className={styles.typingRow}>
                            <div className={`${styles.avatar} ${styles.avatarAI}`}><Sparkles size={16} strokeWidth={2} /></div>
                            {isSearching
                                ? <div className={styles.searchingBubble}><Globe size={14} className={styles.searchingIcon} /> Đang tìm kiếm web...</div>
                                : <div className={styles.typingBubble}><div className={styles.dot} /><div className={styles.dot} /><div className={styles.dot} /></div>
                            }
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className={styles.inputArea}>
                    {/* #14: Preset chips */}
                    <div className={styles.presetChips}>
                        {PRESETS.map((p, i) => (
                            <button key={i} className={styles.presetChip} onClick={() => handlePreset(p.prompt)}>
                                <p.icon size={12} />{p.label}
                            </button>
                        ))}
                    </div>

                    {attachment && (
                        <div className={styles.attachPreview}>
                            {attachment.isFile ? <span><FileText size={14} /> {attachment.name}</span> : <img src={attachment.dataUrl} alt="preview" />}
                            <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachment.name}</span>
                            <button className={styles.removeAttach} onClick={() => setAttachment(null)}><X size={14} /></button>
                        </div>
                    )}

                    <div className={styles.inputRow}>
                        <textarea ref={textareaRef} value={input} onChange={e => { setInput(e.target.value); autoResize(); }}
                            onKeyDown={handleKeyDown} placeholder="Nhắn tin với AI... (Shift+Enter để xuống dòng)"
                            className={styles.textInput} rows={1} disabled={isLoading} maxLength={MAX_INPUT_LENGTH} />
                        <div className={styles.inputActions}>
                            {/* #15: Accept PDF */}
                            <input type="file" ref={fileInputRef} accept="image/*,.txt,.md,.csv,.pdf" onChange={handleFileAttach} style={{ display: 'none' }} />
                            <button className={styles.inputIconBtn}
                                onClick={() => userEmail ? fileInputRef.current?.click() : window.location.href = '/login'}
                                title={userEmail ? 'Đính kèm ảnh, file hoặc PDF' : '🔒 Đăng nhập để đính kèm'}
                                disabled={isLoading} style={!userEmail ? { opacity: 0.4 } : {}}>
                                <Paperclip size={18} />
                            </button>
                            <button className={`${styles.inputIconBtn} ${isRecording ? styles.recording : ''}`}
                                onClick={() => userEmail ? handleVoice() : window.location.href = '/login'}
                                title={userEmail ? (isRecording ? 'Đang ghi âm...' : 'Nhập bằng giọng nói') : '🔒 Đăng nhập để dùng giọng nói'}
                                disabled={isLoading} style={!userEmail ? { opacity: 0.4 } : {}}>
                                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>
                            <button className={styles.sendBtn} onClick={() => handleSend(input)}
                                disabled={isLoading || (!input.trim() && !attachment)} title="Gửi">
                                <Send size={17} strokeWidth={2} />
                            </button>
                        </div>
                    </div>
                    {showCharCounter && (
                        <div className={`${styles.charCounter} ${charCount > 3800 ? styles.danger : styles.warn}`}>
                            {charCount}/{MAX_INPUT_LENGTH}
                        </div>
                    )}
                </div>
            </div>

            {/* #10: Mobile floating history button */}
            {isMobile && !sidebarOpen && (
                <button className={styles.mobileHistoryBtn} onClick={() => setSidebarOpen(true)} title="Lịch sử chat">
                    <History size={20} />
                </button>
            )}

            {/* Error Toast */}
            {errorMsg && <div className={styles.errorToast} onClick={() => setErrorMsg(null)}>{errorMsg}</div>}

            {/* Success Toast (#13, #15, #16) */}
            {toastMsg && <div className={styles.successToast} onClick={() => setToastMsg(null)}>{toastMsg}</div>}
        </div>
    );
}
