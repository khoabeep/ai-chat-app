// lib/search.ts
// Web search utility using Serper.dev API with smart in-memory cache

const SERPER_API_KEY = process.env.SERPER_API_KEY!;
const SERPER_API_URL = 'https://google.serper.dev/search';

// ─── Smart Cache (in-memory, 30 phút TTL) ────────────────────────────────────
interface CacheEntry {
    result: string;
    expiry: number;
}
const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 phút

function getCached(key: string): string | null {
    const entry = searchCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
        searchCache.delete(key);
        return null;
    }
    return entry.result;
}

function setCache(key: string, result: string): void {
    // Giới hạn cache tối đa 200 entries để tránh memory leak
    if (searchCache.size >= 200) {
        const firstKey = searchCache.keys().next().value;
        if (firstKey) searchCache.delete(firstKey);
    }
    searchCache.set(key, { result, expiry: Date.now() + CACHE_TTL_MS });
}

// ─── Query Generation (sử dụng LLM nhỏ để biết có nên search không) ────────────
export async function generateSearchQuery(messages: any[]): Promise<string | null> {
    try {
        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        if (!GROQ_API_KEY) return null;

        const systemPrompt = `You are a web search query generator.
Your task is to determine if the user's latest message requires a real-time web search.
You MUST generate a search query if the user asks about:
- Current Date & Time (e.g., "hôm nay là ngày mấy", "bây giờ là mấy giờ", "hôm nay thứ mấy")
- News & Real-world facts that change over time
- Sports scores, matches, standings
- Prices, weather, events

If it DOES NOT need a search, reply ONLY with "NO".
If it DOES need a search, generate a very concise and effective Google search query keywords (under 5 words if possible) based on the latest message AND the conversation context.
DO NOT wrap the search query in quotes. DO NOT add any other text.
Examples: 
User: "hôm nay là ngày mấy?" -> "hôm nay là ngày mấy"
User: "ai là tổng thống nam phi hiện tại?" -> "tổng thống nam phi"
User: "man utd đứng thứ mấy" -> "thứ hạng man utd epl"
User: "năm 2026 thì sao" (context: discussing epl) -> "bảng xếp hạng epl 2026"
User: "cảm ơn bạn" -> "NO"`;

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
                max_tokens: 30,
            })
        });

        if (!response.ok) return null;
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();

        const trimmed = content.trim();
        if (!trimmed || trimmed.toUpperCase() === 'NO') {
            return null;
        }
        return trimmed;
    } catch (e) {
        console.error('generateSearchQuery Error:', e);
        return null;
    }
}

// ─── Main Search Function ─────────────────────────────────────────────────────
export async function searchWeb(query: string): Promise<string> {
    // Normalize cache key
    const cacheKey = query.toLowerCase().trim();

    // Check cache trước
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
                gl: 'vn',      // Ưu tiên kết quả từ Việt Nam
                hl: 'vi',      // Ngôn ngữ tiếng Việt
                num: 5,        // Lấy 5 kết quả
            }),
        });

        if (!response.ok) {
            console.error('[Search] Serper API error:', response.status);
            return '';
        }

        const data = await response.json();
        const result = formatSearchResults(data);

        // Lưu vào cache
        setCache(cacheKey, result);

        return result;
    } catch (error) {
        console.error('[Search] Error:', error);
        return '';
    }
}

// ─── Format kết quả search thành text cho AI ─────────────────────────────────
function formatSearchResults(data: any): string {
    const parts: string[] = [];
    const today = new Date().toLocaleDateString('vi-VN');

    parts.push(`[Kết quả tìm kiếm Google - Ngày ${today}]`);

    // Answer box (Google's featured snippet)
    if (data.answerBox) {
        const ab = data.answerBox;
        if (ab.answer) parts.push(`📌 Câu trả lời nhanh: ${ab.answer}`);
        if (ab.snippet) parts.push(`📌 Tóm tắt: ${ab.snippet}`);
        if (ab.snippetHighlighted?.length) {
            parts.push(`Điểm nổi bật: ${ab.snippetHighlighted.join(', ')}`);
        }
    }

    // Sports results (bảng xếp hạng, tỷ số)
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

    return parts.join('\n');
}
