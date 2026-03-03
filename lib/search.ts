// lib/search.ts
// Web search utility using Serper.dev API with smart in-memory cache

export type SearchSource = {
    title: string;
    url: string;
    snippet: string;
};

export type SearchResult = {
    text: string;
    sources: SearchSource[];
};

const SERPER_API_KEY = (process.env.SERPER_API_KEY || '').trim();
const SERPER_API_URL = 'https://google.serper.dev/search';

// ─── Smart Cache (in-memory, 30 phút TTL) ────────────────────────────────────
interface CacheEntry {
    result: SearchResult;
    expiry: number;
}
const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 phút

function getCached(key: string): SearchResult | null {
    const entry = searchCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
        searchCache.delete(key);
        return null;
    }
    return entry.result;
}

function setCache(key: string, result: SearchResult): void {
    if (searchCache.size >= 200) {
        const firstKey = searchCache.keys().next().value;
        if (firstKey) searchCache.delete(firstKey);
    }
    searchCache.set(key, { result, expiry: Date.now() + CACHE_TTL_MS });
}

// ─── Keyword patterns that ALWAYS require a web search ──────────────────────
const SEARCH_PATTERNS = [
    // Sports
    /bxh|bảng xếp hạng|đứng thứ|đứng hạng|tỷ số|kết quả.*trận|lịch thi đấu|vô địch|danh sách.*cầu thủ|transfer|chuyển nhượng|standings?|premier league|epl|la liga|serie a|bundesliga|champions league|europa league|man (utd?|united|city)|liverpool|chelsea|arsenal|barcelona|real madrid|juventus|psg|inter milan|ac milan/i,
    // News & current events
    /tin tức|mới nhất|hiện tại|hiện nay|gần đây|vừa xảy ra|breaking|latest news|hôm nay.*xảy ra|hôm nay.*gì/i,
    // Prices, markets, stocks
    /giá (vàng|xăng|dầu|usd|bitcoin|btc|eth|cổ phiếu|nhà đất|chứng khoán)|tỷ giá|exchange rate|stock price|crypto/i,
    // Weather
    /thời tiết|dự báo|nhiệt độ|weather|forecast/i,
    // Time/date queries (fallback even though datetime is injected)
    /hôm nay (là ngày|thứ)|bây giờ (là|mấy) giờ|ngày (mấy|bao nhiêu) tháng/i,
    // People - current role/position
    /(ai|người nào).*(tổng thống|thủ tướng|giám đốc|CEO|chủ tịch).*(hiện|đang|bây giờ)|(tổng thống|thủ tướng|giám đốc|CEO).*(hiện tại|bây giờ|hiện nay)/i,
];

function detectSearchByKeyword(text: string): boolean {
    return SEARCH_PATTERNS.some(p => p.test(text));
}

// ─── Query Generation ─────────────────────────────────────────────────────────
// Step 1: keyword detection (fast, reliable)
// Step 2: LLM fallback for ambiguous cases
export async function generateSearchQuery(messages: any[]): Promise<string | null> {
    const latestMessage = messages[messages.length - 1];
    const latestText = typeof latestMessage?.content === 'string'
        ? latestMessage.content
        : JSON.stringify(latestMessage?.content ?? '');

    // ── Keyword fast-path: skip LLM entirely ─────────────────────────────────
    if (detectSearchByKeyword(latestText)) {
        console.log('[Search] Keyword match — directly searching:', latestText);
        return latestText.trim();
    }

    // ── LLM fallback for ambiguous queries ────────────────────────────────────
    try {
        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        if (!GROQ_API_KEY) return null;

        const systemPrompt = `You are a web search query generator.
Determine if the user's latest message requires a real-time web search.
Search is needed for: news, current events, sports, prices, real-world facts that change over time.
Search is NOT needed for: coding, math, explanations, opinions, general knowledge, greetings.

If NO search needed: reply ONLY "NO".
If search needed: reply with a concise Google search query (max 6 words). No quotes, no extra text.
Examples:
"ai phát minh ra bóng đèn?" -> NO
"tổng thống mỹ hiện tại?" -> tổng thống mỹ 2026
"man utd BXH EPL" -> man utd standings premier league 2026
"cảm ơn" -> NO`;

        const chatMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
            }))
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: chatMessages,
                temperature: 0.1,
                max_tokens: 25,
            })
        });

        if (!response.ok) return null;
        const data = await response.json();
        const trimmed = data.choices?.[0]?.message?.content?.trim();

        if (!trimmed || trimmed.toUpperCase() === 'NO') return null;
        return trimmed;
    } catch (e) {
        console.error('generateSearchQuery Error:', e);
        return null;
    }
}

// ─── Main Search Function ─────────────────────────────────────────────────────
export async function searchWeb(query: string): Promise<SearchResult> {
    const empty: SearchResult = { text: '', sources: [] };

    if (!SERPER_API_KEY) {
        console.error('[Search] SERPER_API_KEY is not configured');
        return empty;
    }

    const cacheKey = query.toLowerCase().trim();
    const cached = getCached(cacheKey);
    if (cached) {
        console.log(`[Search] Cache hit: "${query}"`);
        return cached;
    }

    console.log(`[Search] Searching: "${query}"`);

    try {
        const response = await fetch(SERPER_API_URL, {
            method: 'POST',
            headers: {
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: query,
                gl: 'vn',
                hl: 'vi',
                num: 5,
            }),
        });

        if (!response.ok) {
            console.error('[Search] Serper API error:', response.status);
            return empty;
        }

        const data = await response.json();
        const result = formatSearchResults(data);
        setCache(cacheKey, result);
        return result;
    } catch (error) {
        console.error('[Search] Error:', error);
        return empty;
    }
}

// ─── Format kết quả search thành text + sources cho AI ──────────────────────
function formatSearchResults(data: any): SearchResult {
    const parts: string[] = [];
    const sources: SearchSource[] = [];
    const today = new Date().toLocaleDateString('vi-VN');

    parts.push(`[Kết quả tìm kiếm Google - Ngày ${today}]`);

    // Answer box
    if (data.answerBox) {
        const ab = data.answerBox;
        if (ab.answer) parts.push(`📌 Câu trả lời nhanh: ${ab.answer}`);
        if (ab.snippet) parts.push(`📌 Tóm tắt: ${ab.snippet}`);
        if (ab.snippetHighlighted?.length) {
            parts.push(`Điểm nổi bật: ${ab.snippetHighlighted.join(', ')}`);
        }
        if (ab.link) sources.push({ title: ab.title || 'Answer Box', url: ab.link, snippet: ab.answer || ab.snippet || '' });
    }

    // Sports results
    if (data.sportsResults) {
        const sr = data.sportsResults;
        if (sr.title) parts.push(`\n⚽ ${sr.title}`);
        if (sr.standings?.length) {
            parts.push('Bảng xếp hạng:');
            sr.standings.slice(0, 10).forEach((team: any) => {
                parts.push(`  ${team.rank ?? ''} ${team.name ?? ''} - ${team.points ?? ''} điểm (${team.played ?? ''} trận)`);
            });
        }
        if (sr.games?.length) {
            parts.push('Kết quả/Lịch thi đấu:');
            sr.games.slice(0, 5).forEach((g: any) => {
                parts.push(`  ${g.homeTeam ?? ''} ${g.homeScore ?? ''} - ${g.awayScore ?? ''} ${g.awayTeam ?? ''} (${g.date ?? ''})`);
            });
        }
    }

    // Organic results
    if (data.organic?.length) {
        parts.push('\nKết quả tìm kiếm:');
        data.organic.slice(0, 4).forEach((item: any, i: number) => {
            parts.push(`${i + 1}. ${item.title}`);
            if (item.snippet) parts.push(`   ${item.snippet}`);
            if (item.link) sources.push({ title: item.title || `Kết quả ${i + 1}`, url: item.link, snippet: item.snippet || '' });
        });
    }

    // Knowledge Graph
    if (data.knowledgeGraph) {
        const kg = data.knowledgeGraph;
        if (kg.title && kg.description) {
            parts.push(`\n📖 ${kg.title}: ${kg.description}`);
        }
        if (kg.attributes) {
            Object.entries(kg.attributes).slice(0, 5).forEach(([k, v]) => {
                parts.push(`  - ${k}: ${v}`);
            });
        }
    }

    return { text: parts.join('\n'), sources };
}
