import { NextResponse } from 'next/server';
import { addTextToKnowledgeBase, initKnowledgeBase } from '@/lib/rag';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Only allow text/markdown files for MVP
        if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
            return NextResponse.json({ error: 'Only .txt and .md files are supported for now.' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const textContext = new TextDecoder('utf-8').decode(buffer);

        console.log(`Received file: ${file.name}, size: ${textContext.length} chars`);

        // Ensure RAG is initialized before appending
        await initKnowledgeBase();

        // Push the file content into the vectorStore with the filename as the source
        await addTextToKnowledgeBase(textContext, file.name);

        return NextResponse.json({
            success: true,
            message: `Tài liệu "${file.name}" đã được nạp thành công vào Vector Store! Cứ tự nhiên hỏi AI nhé.`
        });
    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
