export const dynamic = 'force-dynamic';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

const GEMINI_STREAM_URL = (model: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            messages,
            expertiseLevel = 'Intermediate',
            isDebateMode = false,
            model = 'gemini-2.5-flash',
            temperature = 0.7,
            imageBase64 = null,
            imageMime = null,
            fileText = null,
        } = body;

        const latestMessage = messages[messages.length - 1].content;

        let personaInstructions = '';
        if (expertiseLevel === 'Newbie') {
            personaInstructions = 'Giải thích thật đơn giản, dùng từ ngữ dễ hiểu và ví dụ thực tế cho người mới.';
        } else if (expertiseLevel === 'Expert') {
            personaInstructions = 'Đi thẳng vào trọng tâm, dùng thuật ngữ chuyên sâu, phân tích sắc bén. Không giải thích định nghĩa cơ bản.';
        } else {
            personaInstructions = 'Giải thích rõ ràng, cân bằng giữa lý thuyết và thực hành.';
        }

        const systemInstruction = isDebateMode
            ? `Bạn là một Hội đồng Chuyên gia đa chiều.
NGUYÊN TẮC: Đóng 2 vai đối lập để tranh luận về câu hỏi người dùng.
- VAI 1 (🟢 Ủng hộ): Bảo vệ ý tưởng, nhấn mạnh lợi ích, cơ hội.
- VAI 2 (🔴 Phản biện): Nêu rủi ro, chỉ trích, bảo vệ sự an toàn.
- ⚖️ KẾT LUẬN: Tổng hợp khách quan, đưa ra gợi ý thực tế.
CÁ NHÂN HÓA: ${personaInstructions}
Dùng Markdown với heading ### 🟢, ### 🔴, ### ⚖️.`
            : `Bạn là một trợ lý AI toàn năng, thông minh và thân thiện.
- Trả lời chính xác, chi tiết và hữu ích mọi câu hỏi.
- Dùng Markdown (tiêu đề, code block, bảng, danh sách...) khi phù hợp.
- Nếu được yêu cầu vẽ sơ đồ, dùng code block \`\`\`mermaid.
- CÁ NHÂN HÓA: ${personaInstructions}
- Trả lời tiếng Việt trừ khi được yêu cầu ngôn ngữ khác.`;

        // Build conversation history
        const history = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        // Build current user parts
        const userParts: any[] = [];

        if (imageBase64 && imageMime) {
            userParts.push({ inlineData: { data: imageBase64, mimeType: imageMime } });
        }

        if (fileText) {
            userParts.push({ text: `[Nội dung file được đính kèm]\n\n${fileText}\n\n[Câu hỏi]: ${latestMessage}` });
        } else {
            userParts.push({ text: latestMessage });
        }

        const requestBody = {
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [
                ...history,
                { role: 'user', parts: userParts }
            ],
            generationConfig: {
                temperature: temperature,
            }
        };

        const geminiResponse = await fetch(GEMINI_STREAM_URL(model), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!geminiResponse.ok) {
            const errText = await geminiResponse.text();
            console.error('Gemini API error:', errText);
            return new Response(JSON.stringify({ error: 'Gemini API error' }), { status: 500 });
        }

        // Parse SSE stream and forward as plain text
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                const reader = geminiResponse.body!.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            if (!line.startsWith('data: ')) continue;
                            const jsonStr = line.slice(6).trim();
                            if (!jsonStr || jsonStr === '[DONE]') continue;
                            try {
                                const chunk = JSON.parse(jsonStr);
                                const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (text) controller.enqueue(encoder.encode(text));
                            } catch { /* skip malformed chunks */ }
                        }
                    }
                } catch (e) {
                    console.error('Stream error:', e);
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(readable, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Accel-Buffering': 'no',
                'Cache-Control': 'no-cache',
            }
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
