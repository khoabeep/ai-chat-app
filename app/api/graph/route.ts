import { NextResponse } from 'next/server';
import { initKnowledgeBase } from '@/lib/rag';

// A hack to access the local vectorStore from lib/rag.ts
// Usually this is done via a DB query.
import * as ragModule from '@/lib/rag';

export async function GET() {
    try {
        await initKnowledgeBase();

        // Access the internal vectorStore (assuming we export it or read it)
        // Since vectorStore is not exported, we'll build a helper in lib/rag.ts
        // But for now, let's export it from rag.ts first.
        const store = ragModule.getVectorStore();

        // Build Nodes
        const nodes = store.map((chunk, index) => ({
            id: `node-${index}`,
            name: chunk.metadata.title,
            val: 1, // Size of node
        }));

        // Build Links based on similarity > 0.65
        const links: { source: string, target: string }[] = [];

        for (let i = 0; i < store.length; i++) {
            for (let j = i + 1; j < store.length; j++) {
                const score = ragModule.cosineSimilarity(store[i].embedding, store[j].embedding);
                if (score > 0.65) {
                    links.push({
                        source: `node-${i}`,
                        target: `node-${j}`
                    });
                }
            }
        }

        return NextResponse.json({ nodes, links });
    } catch (error) {
        console.error('Graph API Error:', error);
        return NextResponse.json({ error: 'Failed to load graph data' }, { status: 500 });
    }
}
