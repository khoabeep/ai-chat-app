'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PLAN_CONFIG, type Plan } from '@/lib/plans';

const CHECK = '✓';
const CROSS = '✗';

const ALL_FEATURES: { key: string; label: string }[] = [
    { key: 'messagesPerDay', label: 'Tin nhắn mỗi ngày' },
    { key: 'standardModel', label: 'KhoaAI Standard' },
    { key: 'turboModel', label: 'KhoaAI Turbo (nhanh hơn)' },
    { key: 'visionModel', label: 'KhoaAI Vision (nhận diện ảnh)' },
    { key: 'fileAttach', label: 'Đính kèm file (txt, csv, md)' },
    { key: 'pdfUpload', label: 'Upload & đọc PDF' },
    { key: 'voice', label: 'Nhập liệu bằng giọng nói' },
    { key: 'debate', label: 'Chế độ Debate (2 quan điểm)' },
    { key: 'temperature', label: 'Điều chỉnh độ sáng tạo' },
    { key: 'summarize', label: 'Tóm tắt hội thoại' },
    { key: 'export', label: 'Xuất lịch sử chat' },
    { key: 'share', label: 'Chia sẻ hội thoại' },
];

export default function PricingPage() {
    const [currentPlan, setCurrentPlan] = useState<Plan>('guest');
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        const email = localStorage.getItem('user_email');
        const plan = localStorage.getItem('user_plan') as Plan | null;
        if (email) { setUserEmail(email); setCurrentPlan(plan || 'free'); }
    }, []);

    const plans: Plan[] = ['guest', 'free', 'pro'];

    function getFeatureValue(plan: Plan, key: string): string {
        if (key === 'messagesPerDay') {
            const limit = PLAN_CONFIG[plan].messagesPerDay;
            return isFinite(limit) ? `${limit}/ngày` : '∞ Không giới hạn';
        }
        const f = PLAN_CONFIG[plan].features as any;
        return f[key] ? CHECK : CROSS;
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#f1f5f9',
            padding: '2rem 1rem',
        }}>
            {/* Glow blobs */}
            <div style={{ position: 'fixed', top: '10%', left: '10%', width: 400, height: 400, background: 'rgba(99,102,241,0.12)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '10%', right: '10%', width: 350, height: 350, background: 'rgba(124,58,237,0.1)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />

            <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative' }}>
                {/* Back */}
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#94a3b8', textDecoration: 'none', fontSize: '0.88rem', marginBottom: '2rem' }}>
                    ← Quay lại KhoaAI
                </Link>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>⭐</div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 0.6rem', background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Bảng giá KhoaAI
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>
                        Chọn gói phù hợp với nhu cầu của bạn
                    </p>
                    {userEmail && (
                        <div style={{ marginTop: '0.8rem', fontSize: '0.88rem', color: '#a5b4fc' }}>
                            Bạn đang dùng: <strong style={{ color: PLAN_CONFIG[currentPlan].color }}>{PLAN_CONFIG[currentPlan].badge}</strong>
                        </div>
                    )}
                </div>

                {/* Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.2rem', marginBottom: '3rem' }}>
                    {plans.map(plan => {
                        const cfg = PLAN_CONFIG[plan];
                        const isCurrent = plan === currentPlan;
                        const isPro = plan === 'pro';
                        return (
                            <div key={plan} style={{
                                background: isPro ? 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(139,92,246,0.12))' : 'rgba(30,41,59,0.8)',
                                border: `1.5px solid ${isCurrent ? cfg.color : isPro ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                borderRadius: 20,
                                padding: '1.8rem 1.5rem',
                                position: 'relative',
                                backdropFilter: 'blur(12px)',
                                transition: 'transform 0.2s',
                            }}>
                                {isPro && (
                                    <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: '#fff', padding: '3px 16px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                        ✨ PHỔ BIẾN NHẤT
                                    </div>
                                )}
                                {isCurrent && !isPro && (
                                    <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: cfg.color, color: '#fff', padding: '3px 16px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                        GÓI HIỆN TẠI
                                    </div>
                                )}
                                {isCurrent && isPro && (
                                    <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: '#fff', padding: '3px 16px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                        GÓI HIỆN TẠI
                                    </div>
                                )}

                                <div style={{ marginBottom: '1.2rem' }}>
                                    <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>
                                        {plan === 'guest' ? '👤' : plan === 'free' ? '✨' : '⭐'}
                                    </div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: plan === 'pro' ? '1.8rem' : '1.4rem', fontWeight: 800, color: '#f1f5f9' }}>{cfg.price}</div>
                                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 2 }}>{cfg.priceNote}</div>
                                </div>

                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {cfg.highlight.map((h, i) => (
                                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: '0.85rem', color: '#cbd5e1' }}>
                                            <span style={{ color: '#4ade80', flexShrink: 0, marginTop: 1 }}>✓</span>
                                            {h}
                                        </li>
                                    ))}
                                </ul>

                                {plan === 'guest' && !userEmail && (
                                    <Link href="/register" style={{ display: 'block', textAlign: 'center', padding: '0.65rem', borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: '#94a3b8', textDecoration: 'none', fontSize: '0.88rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        Đang dùng
                                    </Link>
                                )}
                                {plan === 'free' && !userEmail && (
                                    <Link href="/register" style={{ display: 'block', textAlign: 'center', padding: '0.65rem', borderRadius: 10, background: 'rgba(37,99,235,0.2)', color: '#93c5fd', textDecoration: 'none', fontSize: '0.88rem', border: '1px solid rgba(37,99,235,0.4)', fontWeight: 600 }}>
                                        Đăng ký miễn phí →
                                    </Link>
                                )}
                                {plan === 'free' && userEmail && plan !== currentPlan && (
                                    <div style={{ textAlign: 'center', padding: '0.65rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#64748b', fontSize: '0.85rem' }}>Đã đăng nhập</div>
                                )}
                                {plan === currentPlan && (
                                    <div style={{ textAlign: 'center', padding: '0.65rem', borderRadius: 10, background: cfg.bgColor, color: cfg.color, fontSize: '0.85rem', fontWeight: 600, border: `1px solid ${cfg.color}40` }}>
                                        {cfg.badge} — Gói hiện tại
                                    </div>
                                )}
                                {plan === 'pro' && currentPlan !== 'pro' && (
                                    <a href="mailto:khoabeep@gmail.com?subject=Nâng cấp Pro KhoaAI" style={{ display: 'block', textAlign: 'center', padding: '0.65rem', borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: '#fff', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 700, boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>
                                        Nâng cấp Pro →
                                    </a>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Feature comparison table */}
                <div style={{ background: 'rgba(30,41,59,0.7)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', backdropFilter: 'blur(12px)' }}>
                    <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>So sánh chi tiết</h2>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <th style={{ padding: '0.8rem 1.5rem', textAlign: 'left', color: '#64748b', fontWeight: 500 }}>Tính năng</th>
                                    {plans.map(p => (
                                        <th key={p} style={{ padding: '0.8rem 1rem', textAlign: 'center', color: PLAN_CONFIG[p].color, fontWeight: 700 }}>
                                            {PLAN_CONFIG[p].badge}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {ALL_FEATURES.map((feat, i) => (
                                    <tr key={feat.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                        <td style={{ padding: '0.7rem 1.5rem', color: '#cbd5e1' }}>{feat.label}</td>
                                        {plans.map(p => {
                                            const val = getFeatureValue(p, feat.key);
                                            const isCheck = val === CHECK;
                                            const isCross = val === CROSS;
                                            return (
                                                <td key={p} style={{ padding: '0.7rem 1rem', textAlign: 'center', color: isCheck ? '#4ade80' : isCross ? '#f87171' : '#f1f5f9', fontWeight: isCheck || isCross ? 700 : 400 }}>
                                                    {val}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Contact */}
                <div style={{ textAlign: 'center', marginTop: '2.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                    Muốn nâng cấp Pro? Liên hệ:{' '}
                    <a href="mailto:khoabeep@gmail.com" style={{ color: '#a78bfa', textDecoration: 'none' }}>khoabeep@gmail.com</a>
                </div>
            </div>
        </div>
    );
}
