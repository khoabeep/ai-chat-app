'use client';
import { useEffect, useRef, useState } from 'react';

type Node = { id: string; name: string; x: number; y: number; vx: number; vy: number; };
type Link = { source: string; target: string; };

export default function KnowledgeGraph() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<'loading' | 'ok' | 'empty' | 'error'>('loading');
    const animRef = useRef<number>(0);

    useEffect(() => {
        let nodes: Node[] = [];
        let links: Link[] = [];

        fetch('/api/graph')
            .then(r => r.json())
            .then(data => {
                if (!data.nodes || data.nodes.length === 0) { setStatus('empty'); return; }
                setStatus('ok');

                const canvas = canvasRef.current;
                if (!canvas) return;
                const W = canvas.width = canvas.offsetWidth || 800;
                const H = canvas.height = canvas.offsetHeight || 400;
                const cx = canvas.getContext('2d')!;

                // Place nodes in a circle initially
                nodes = data.nodes.map((n: any, i: number) => {
                    const angle = (i / data.nodes.length) * 2 * Math.PI;
                    const r = Math.min(W, H) * 0.35;
                    return { id: n.id, name: n.name, x: W / 2 + r * Math.cos(angle), y: H / 2 + r * Math.sin(angle), vx: 0, vy: 0 };
                });
                links = data.links as Link[];

                const nodeMap: Record<string, Node> = {};
                nodes.forEach(n => nodeMap[n.id] = n);

                const REPEL = 3000, ATTRACT = 0.005, DAMP = 0.85, CENTER = 0.002;

                const tick = () => {
                    // Forces
                    for (let i = 0; i < nodes.length; i++) {
                        const a = nodes[i];
                        // Center pull
                        a.vx += (W / 2 - a.x) * CENTER;
                        a.vy += (H / 2 - a.y) * CENTER;

                        for (let j = i + 1; j < nodes.length; j++) {
                            const b = nodes[j];
                            const dx = a.x - b.x, dy = a.y - b.y;
                            const dist2 = dx * dx + dy * dy || 1;
                            const force = REPEL / dist2;
                            a.vx += dx * force; a.vy += dy * force;
                            b.vx -= dx * force; b.vy -= dy * force;
                        }
                    }
                    // Link attraction
                    links.forEach(l => {
                        const a = nodeMap[l.source], b = nodeMap[l.target];
                        if (!a || !b) return;
                        const dx = b.x - a.x, dy = b.y - a.y;
                        a.vx += dx * ATTRACT; a.vy += dy * ATTRACT;
                        b.vx -= dx * ATTRACT; b.vy -= dy * ATTRACT;
                    });

                    // Integrate + dampen + clamp
                    nodes.forEach(n => {
                        n.vx *= DAMP; n.vy *= DAMP;
                        n.x = Math.max(40, Math.min(W - 40, n.x + n.vx));
                        n.y = Math.max(40, Math.min(H - 40, n.y + n.vy));
                    });

                    // Draw
                    cx.clearRect(0, 0, W, H);

                    // Links
                    cx.strokeStyle = '#334155';
                    cx.lineWidth = 1;
                    links.forEach(l => {
                        const a = nodeMap[l.source], b = nodeMap[l.target];
                        if (!a || !b) return;
                        cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
                    });

                    // Nodes
                    nodes.forEach(n => {
                        // Glow
                        const grd = cx.createRadialGradient(n.x, n.y, 2, n.x, n.y, 16);
                        grd.addColorStop(0, '#7dd3fc'); grd.addColorStop(1, 'rgba(56,189,248,0)');
                        cx.fillStyle = grd;
                        cx.beginPath(); cx.arc(n.x, n.y, 16, 0, Math.PI * 2); cx.fill();

                        // Node dot
                        cx.fillStyle = '#38bdf8';
                        cx.beginPath(); cx.arc(n.x, n.y, 6, 0, Math.PI * 2); cx.fill();

                        // Label
                        cx.fillStyle = '#e2e8f0';
                        cx.font = '11px Inter, sans-serif';
                        cx.textAlign = 'center';
                        const label = n.name.length > 20 ? n.name.slice(0, 18) + '…' : n.name;
                        cx.fillText(label, n.x, n.y + 22);
                    });

                    animRef.current = requestAnimationFrame(tick);
                };

                animRef.current = requestAnimationFrame(tick);
            })
            .catch(() => setStatus('error'));

        return () => cancelAnimationFrame(animRef.current);
    }, []);

    if (status === 'loading') return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>🔭 Đang vẽ Không Gian Tri Thức...</div>;
    if (status === 'error') return <div style={{ padding: '2rem', textAlign: 'center', color: '#f87171' }}>❌ Không thể tải Knowledge Graph.</div>;
    if (status === 'empty') return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu để hiển thị.</div>;

    return (
        <div style={{ width: '100%', height: '400px', background: '#0f172a', borderRadius: '12px', overflow: 'hidden' }}>
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', display: 'block' }}
            />
        </div>
    );
}
