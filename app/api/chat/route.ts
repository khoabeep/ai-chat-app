export const dynamic = 'force-dynamic';

import { searchWeb } from '@/lib/search';

const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            messages,
            expertiseLevel = 'Intermediate',
            isDebateMode = false,
            model = 'llama-3.3-70b-versatile',
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

        // Inject ngày/giờ thực tế vào system prompt
        const now = new Date();
        const currentDateTimeVN = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        let systemInstruction = isDebateMode
            ? `You are a Multi-dimensional Expert Council.
YOUR STRICT TASK: You MUST play TWO opposing roles to debate the user's prompt. You must NEVER give a standard single-viewpoint answer.
- ROLE 1 (🟢 Pros): Defend the idea, highlight benefits, opportunities, and positive aspects.
- ROLE 2 (🔴 Cons): Point out risks, criticize, and highlight negative aspects and safety concerns.
- ⚖️ CONCLUSION: Provide an objective summary and practical advice.
FORMAT REQUIREMENT: You MUST use Markdown with headings: ### 🟢 Ủng hộ, ### 🔴 Phản biện, ### ⚖️ Kết luận.
LANGUAGE REQUIREMENT: You MUST reply entirely in Vietnamese.
PERSONALIZATION: ${personaInstructions}`
            : `Bạn là một trợ lý AI toàn năng, thông minh và thân thiện.
- Trả lời chính xác, chi tiết và hữu ích mọi câu hỏi.
- Dùng Markdown (tiêu đề, code block, bảng, danh sách...) khi phù hợp.
- Nếu được yêu cầu vẽ sơ đồ, dùng code block \`\`\`mermaid.
- CÁ NHÂN HÓA: ${personaInstructions}
- Trả lời tiếng Việt trừ khi được yêu cầu ngôn ngữ khác.
- THỜI GIAN HIỆN TẠI (Múi giờ Việt Nam): ${currentDateTimeVN}. Luôn dùng thông tin này khi người dùng hỏi về ngày/giờ hôm nay.`;

        // Check xem có cần web search không
        let searchData = '';
        if (!isDebateMode) {
            const { generateSearchQuery } = await import('@/lib/search');
            const searchQuery = await generateSearchQuery(messages);
            if (searchQuery) {
                console.log("[Chat Route] LLM generated search query:", searchQuery);
                searchData = await searchWeb(searchQuery);
            }
        }

        if (searchData) {
            systemInstruction += `\n\n[QUAN TRỌNG: DỮ LIỆU TÌM KIẾM THỰC TẾ]\nBạn vừa được cung cấp dữ liệu tìm kiếm mới nhất từ Google. DỰA VÀO ĐÂY ĐỂ TRẢ LỜI, KHÔNG ĐƯỢC BỊA ĐẶT THÔNG TIN.\n\nDỮ LIỆU TỪ GOOGLE:\n${searchData}`;
        }

        // OpenAI/Groq messages format
        const chatMessages: any[] = [
            { role: 'system', content: systemInstruction }
        ];

        // Add history
        for (let i = 0; i < messages.length - 1; i++) {
            chatMessages.push({
                role: messages[i].role === 'user' ? 'user' : 'assistant',
                content: messages[i].content
            });
        }

        // Build current user message
        let userContent: any = [];
        let promptText = latestMessage;

        if (fileText) {
            promptText = `[Nội dung file được đính kèm]\n\n${fileText}\n\n[Câu hỏi]: ${latestMessage}`;
        }

        // If there's an image, we MUST use the vision model
        const actualModel = (imageBase64 && imageMime) ? 'meta-llama/llama-4-scout-17b-16e-instruct' : model;

        if (imageBase64 && imageMime) {
            // Multimodal format for Groq Vision
            userContent.push({ type: 'text', text: promptText });
            userContent.push({
                type: 'image_url',
                image_url: {
                    url: `data:${imageMime};base64,${imageBase64}`
                }
            });
        } else {
            // Text only format
            userContent = promptText;
        }

        chatMessages.push({
            role: 'user',
            content: userContent
        });

        const requestBody = {
            model: actualModel,
            messages: chatMessages,
            temperature: temperature,
            stream: true,
        };

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Groq API error:', errText);
            return new Response(JSON.stringify({ error: 'Groq API error' }), { status: response.status });
        }

        // Parse SSE stream from OpenAI/Groq format
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                const reader = response.body!.getReader();
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
                            const trimmed = line.trim();
                            if (!trimmed.startsWith('data: ')) continue;
                            const jsonStr = trimmed.slice(6).trim();

                            if (!jsonStr || jsonStr === '[DONE]') continue;

                            try {
                                const chunk = JSON.parse(jsonStr);
                                const content = chunk.choices?.[0]?.delta?.content;
                                if (content) {
                                    controller.enqueue(encoder.encode(content));
                                }
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
