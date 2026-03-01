import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            messages,
            expertiseLevel = 'Intermediate',
            isDebateMode = false,
            model = 'gemini-2.5-flash',
            imageBase64 = null,
            imageMime = null,
            fileText = null,
        } = body;

        const latestMessage = messages[messages.length - 1].content;

        let personaInstructions = '';
        if (expertiseLevel === 'Newbie') {
            personaInstructions = 'Giải thích thật đơn giản, dùng từ ngữ dễ hiểu và ví dụ thực tế cho người mới.';
        } else if (expertiseLevel === 'Expert') {
            personaInstructions = 'Đi thẳng vào trọng tâm, dùng thuật ngữ chuyên sâu, tập trung vào phân tích sắc bén. Không giải thích định nghĩa cơ bản.';
        } else {
            personaInstructions = 'Giải thích rõ ràng, cân bằng giữa lý thuyết và thực hành.';
        }

        let systemInstruction = '';

        if (isDebateMode) {
            systemInstruction = `Bạn là một Hội đồng Chuyên gia đa chiều.
NGUYÊN TẮC: Đóng 2 vai trò đối lập để tranh luận về câu hỏi người dùng.
- VAI 1 (🟢 Ủng hộ): Lập luận bảo vệ ý tưởng, nhấn mạnh lợi ích, cơ hội.
- VAI 2 (🔴 Phản biện): Nêu rủi ro, chỉ trích, bảo vệ sự an toàn.
- ⚖️ KẾT LUẬN: Tổng hợp góc nhìn khách quan, đưa ra gợi ý thực tế.
CÁ NHÂN HÓA: ${personaInstructions}
Viết rõ ràng bằng Markdown với các heading: ### 🟢, ### 🔴, ### ⚖️.`;
        } else {
            systemInstruction = `Bạn là một trợ lý AI toàn năng, thông minh và thân thiện.
- Trả lời chính xác, chi tiết và hữu ích mọi câu hỏi.
- Luôn sử dụng Markdown để trình bày rõ ràng (tiêu đề, code block, bảng, danh sách...).
- Nếu được yêu cầu vẽ sơ đồ, dùng code block \`\`\`mermaid.
- CÁ NHÂN HÓA: ${personaInstructions}
- Trả lời bằng tiếng Việt trừ khi được yêu cầu ngôn ngữ khác.`;
        }

        // Build conversation history
        const history = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        // Build current user parts (may include image or file text)
        const userParts: any[] = [];

        if (imageBase64 && imageMime) {
            userParts.push({
                inlineData: {
                    data: imageBase64,
                    mimeType: imageMime
                }
            });
        }

        if (fileText) {
            userParts.push({ text: `[Nội dung file được đính kèm]\n\n${fileText}\n\n[Câu hỏi của người dùng]: ${latestMessage}` });
        } else {
            userParts.push({ text: latestMessage });
        }

        // Set up streaming
        const streamResult = await ai.models.generateContentStream({
            model,
            contents: [
                ...history,
                { role: 'user', parts: userParts }
            ],
            config: {
                systemInstruction,
                temperature: isDebateMode ? 0.8 : 0.7,
            }
        });

        // Stream the response back
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of streamResult) {
                        const text = chunk.text;
                        if (text) {
                            controller.enqueue(encoder.encode(text));
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
