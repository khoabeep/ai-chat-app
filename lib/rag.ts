import { GoogleGenAI } from '@google/genai';
import { startupKnowledge } from './data';

// Init SDK (Requires process.env.GEMINI_API_KEY)
export const ai = new GoogleGenAI({});

export type ChunkMetadata = {
    title: string;
    content: string;
};

export type Chunk = {
    metadata: ChunkMetadata;
    embedding: number[]; // kept for API compatibility with graph route
};

// In-memory store for prototype
let vectorStore: Chunk[] = [];
let isInitialized = false;

export function getVectorStore() {
    return vectorStore;
}

// ── TF-IDF keyword similarity (no embedding API needed) ──────────────────────

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\u00C0-\u024F\u1E00-\u1EFF\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 1);
}

function buildTF(tokens: string[]): Record<string, number> {
    const tf: Record<string, number> = {};
    for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
    const total = tokens.length || 1;
    for (const t in tf) tf[t] /= total;
    return tf;
}

// Simple dot-product similarity between two TF maps (shared vocabulary)
function tfSimilarity(a: Record<string, number>, b: Record<string, number>): number {
    let score = 0;
    for (const term in a) {
        if (b[term]) score += a[term] * b[term];
    }
    return score;
}

// Fake embedding: sparse vector over top-N terms (for graph cosine compat)
function sparseEmbed(text: string, vocab: string[]): number[] {
    const tf = buildTF(tokenize(text));
    return vocab.map(w => tf[w] || 0);
}

// Chunk text, build TF maps, store
export function chunkTextWithMetadata(text: string): ChunkMetadata[] {
    const rawChunks = text
        .split('\n\n')
        .map(t => t.trim())
        .filter(t => t.length > 50);

    return rawChunks.map(chunk => {
        const firstNewLine = chunk.indexOf('\n');
        if (firstNewLine > -1) {
            const title = chunk.substring(0, firstNewLine).trim();
            return { title, content: chunk };
        }
        return { title: 'Unknown Source', content: chunk };
    });
}

// Vocab built from all stored chunks (for sparse vectors used in graph)
let globalVocab: string[] = [];

function rebuildVocab() {
    const freq: Record<string, number> = {};
    for (const chunk of vectorStore) {
        for (const t of tokenize(chunk.metadata.content)) {
            freq[t] = (freq[t] || 0) + 1;
        }
    }
    // Keep top 512 terms
    globalVocab = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 512)
        .map(e => e[0]);

    // Rebuild sparse embeddings
    for (const chunk of vectorStore) {
        chunk.embedding = sparseEmbed(chunk.metadata.content, globalVocab);
    }
}

// Store TF maps alongside chunks for fast similarity
const chunkTFs: Record<string, Record<string, number>> = {};

export async function addTextToKnowledgeBase(text: string, sourceName?: string) {
    const metadataChunks = chunkTextWithMetadata(text);

    for (const meta of metadataChunks) {
        const title = sourceName && meta.title === 'Unknown Source' ? sourceName : meta.title;
        const finalMeta = { ...meta, title };
        const id = `chunk-${vectorStore.length}`;
        chunkTFs[id] = buildTF(tokenize(meta.content));
        vectorStore.push({ metadata: finalMeta, embedding: [] });
    }

    rebuildVocab();
}

export async function initKnowledgeBase() {
    if (isInitialized) return;
    console.log('Initializing knowledge base (TF-IDF mode)...');
    await addTextToKnowledgeBase(startupKnowledge, 'Sổ tay Khởi Nghiệp (Mặc định)');
    isInitialized = true;
    console.log(`Initialized ${vectorStore.length} chunks.`);
}

export type SearchResult = {
    metadata: ChunkMetadata;
    score: number;
};

export type RAGResponse = {
    chunks: SearchResult[];
    confidence: 'Cao' | 'Trung Bình' | 'Thấp' | 'Từ chối';
};

const SIMILARITY_THRESHOLD = 0.0005; // TF-IDF scores are much smaller than cosine

export async function searchContext(query: string, topK: number = 2): Promise<RAGResponse> {
    await initKnowledgeBase();

    const queryTF = buildTF(tokenize(query));

    const scored: SearchResult[] = vectorStore.map((chunk, i) => ({
        metadata: chunk.metadata,
        score: tfSimilarity(queryTF, chunkTFs[`chunk-${i}`] || {}),
    }));

    scored.sort((a, b) => b.score - a.score);

    const relevantChunks = scored.filter(c => c.score >= SIMILARITY_THRESHOLD).slice(0, topK);

    let confidence: RAGResponse['confidence'] = 'Từ chối';

    if (relevantChunks.length > 0) {
        const topScore = relevantChunks[0].score;
        if (topScore > 0.01) confidence = 'Cao';
        else if (topScore > 0.003) confidence = 'Trung Bình';
        else confidence = 'Thấp';
    }

    return { chunks: relevantChunks, confidence };
}

// For graph cosine compatibility
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA.length || !vecB.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
}
