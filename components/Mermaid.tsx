'use client';
import React, { useEffect, useRef, useState } from 'react';

interface MermaidProps {
    chart: string;
}

let mermaidLoaded = false;

function loadMermaidFromCDN(): Promise<void> {
    if (mermaidLoaded) return Promise.resolve();
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') return resolve();
        if ((window as any).mermaid) { mermaidLoaded = true; return resolve(); }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
        script.onload = () => {
            (window as any).mermaid.initialize({ startOnLoad: false, theme: 'default' });
            mermaidLoaded = true;
            resolve();
        };
        script.onerror = () => reject(new Error('Failed to load Mermaid from CDN'));
        document.head.appendChild(script);
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
                return m.render(id, chart);
            })
            .then(({ svg }: { svg: string }) => {
                if (containerRef.current) {
                    containerRef.current.innerHTML = svg;
                }
                setIsRendering(false);
            })
            .catch((err: Error) => {
                setError('Không thể render sơ đồ: ' + err.message);
                setIsRendering(false);
            });
    }, [chart]);

    if (error) {
        return (
            <pre style={{
                background: '#fef2f2',
                color: '#dc2626',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                whiteSpace: 'pre-wrap'
            }}>
                {error}{'\n\n'}{chart}
            </pre>
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
