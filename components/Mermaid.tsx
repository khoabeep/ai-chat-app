'use client';
import React, { useEffect, useRef, useState } from 'react';

interface MermaidProps { chart: string; }

let mermaidLoaded = false;

function loadMermaidFromCDN(): Promise<void> {
    if (mermaidLoaded) return Promise.resolve();
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') return resolve();
        if ((window as any).mermaid) { mermaidLoaded = true; return resolve(); }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
        script.onload = () => {
            (window as any).mermaid.initialize({
                startOnLoad: false,
                theme: 'default',
                securityLevel: 'loose',
                fontFamily: 'Inter, sans-serif',
            });
            mermaidLoaded = true;
            resolve();
        };
        script.onerror = () => reject(new Error('Không tải được Mermaid'));
        document.head.appendChild(script);
    });
}

// Wrap node labels containing special/Unicode characters in quotes
function preprocessChart(chart: string): string {
    return chart
        // Normalize line endings
        .replace(/\r\n/g, '\n')
        // Remove leading/trailing blank lines
        .trim()
        // Wrap [] node labels containing non-ASCII or special chars (but not already quoted)
        .replace(/\[([^\]"\[]+)\]/g, (match, label) => {
            if (/[^\x00-\x7F!-~\s]/.test(label) || /[(){}|<>]/.test(label)) {
                return `["${label.replace(/"/g, "'")}"]`;
            }
            return match;
        })
        // Wrap () node labels (skip double-parens circle nodes and already quoted)
        .replace(/(?<!\()\(([^()"]+)\)(?!\))/g, (match, label) => {
            if (/[^\x00-\x7F]/.test(label)) return `("${label.replace(/"/g, "'")}`;
            return match;
        })
        // Wrap subgraph titles containing non-ASCII
        .replace(/^(\s*subgraph\s+)([^[\n"]+)$/gm, (match, prefix, title) => {
            if (/[^\x00-\x7F]/.test(title)) return `${prefix}"${title.trim().replace(/"/g, "'")}"`;
            return match;
        });
}

export default function Mermaid({ chart }: MermaidProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState(true);

    useEffect(() => {
        if (!chart || !containerRef.current) return;
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        setIsRendering(true);
        setError(null);

        loadMermaidFromCDN()
            .then(() => {
                const m = (window as any).mermaid;
                const processedChart = preprocessChart(chart.trim());
                return m.render(id, processedChart);
            })
            .then(({ svg }: { svg: string }) => {
                if (containerRef.current) containerRef.current.innerHTML = svg;
                setIsRendering(false);
            })
            .catch((err: Error) => {
                setError(err.message);
                setIsRendering(false);
            });
    }, [chart]);

    if (error) {
        return (
            <div style={{ margin: '0.5rem 0' }}>
                <details>
                    <summary style={{ color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer', padding: '0.4rem 0' }}>
                        ⚠️ Không thể vẽ sơ đồ — xem code
                    </summary>
                    <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', overflowX: 'auto', marginTop: '0.5rem' }}>
                        {chart}
                    </pre>
                </details>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', margin: '1rem 0' }}>
            {isRendering && (
                <div style={{ padding: '1rem', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    ⏳ Đang vẽ sơ đồ...
                </div>
            )}
            <div
                ref={containerRef}
                style={{
                    background: '#fff',
                    borderRadius: '10px',
                    padding: '1rem',
                    border: '1px solid #e2e8f0',
                    overflowX: 'auto',
                    display: isRendering ? 'none' : 'block'
                }}
            />
        </div>
    );
}
