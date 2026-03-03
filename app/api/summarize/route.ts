// #16: Auto-summarize conversations
export const dynamic = 'force-dynamic';

const GROQ_API_KEY = process.env.GROQ_API_KEY!;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();
        if (!messages?.length) {
            return Response.json({ error: 'No messages' }, { status: 400 });
        }

        const transcript = messages
            .map((m: any) => `${m.role === 'user' ? '👤 Người dùng' : '🤖 AI'}: ${typeof m.content === 'string' ? m.content : ''}`).join('\n\n');

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    {
                        role: 'system',
                        content: 'Tóm tắt cuộc trò chuyện sau thành các điểm chính bằng tiếng Việt. Dùng bullet points. Ngắn gọn, tối đa 150 từ.',
                    },
                    { role: 'user', content: transcript },
                ],
                temperature: 0.3,
                max_tokens: 300,
            }),
        });

        if (!response.ok) {
            return Response.json({ error: 'Groq error' }, { status: 500 });
        }

        const data = await response.json();
        const summary = data.choices?.[0]?.message?.content || '';
        return Response.json({ summary });
    } catch (e) {
        console.error('Summarize error:', e);
        return Response.json({ error: 'Internal error' }, { status: 500 });
    }
}
