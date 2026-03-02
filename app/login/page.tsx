'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('user_email', data.email || email);
                router.push('/');
                router.refresh();
            }
            else setError(data.error || 'Đăng nhập thất bại');
        } catch { setError('Không thể kết nối máy chủ'); }
        finally { setLoading(false); }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', background: 'rgba(15,23,42,0.6)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
        padding: '0.75rem 1rem', color: '#f1f5f9', fontSize: '0.95rem',
        outline: 'none', boxSizing: 'border-box',
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', fontFamily: 'Inter, sans-serif', padding: '1rem' }}>
            <div style={{ position: 'fixed', top: '20%', left: '15%', width: 300, height: 300, background: 'rgba(99,102,241,0.15)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '20%', right: '15%', width: 250, height: 250, background: 'rgba(139,92,246,0.12)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: 420, background: 'rgba(30,41,59,0.85)', backdropFilter: 'blur(20px)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', padding: '2.5rem', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: '1rem', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>✨</div>
                    <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.4rem' }}>Chào mừng trở lại</h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Đăng nhập để tiếp tục với AI Chat</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem' }}>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" required autoFocus style={inputStyle}
                            onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem' }}>Mật khẩu</label>
                        <div style={{ position: 'relative' }}>
                            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Nhập mật khẩu" required style={{ ...inputStyle, paddingRight: '2.8rem' }}
                                onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                            <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }}>{showPass ? '🙈' : '👁️'}</button>
                        </div>
                    </div>

                    {error && (
                        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.6rem 0.9rem', color: '#fca5a5', fontSize: '0.85rem' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#4b5563' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 12, padding: '0.85rem', color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 16px rgba(99,102,241,0.4)', marginTop: '0.25rem' }}>
                        {loading ? '⏳ Đang đăng nhập...' : '🚀 Đăng nhập'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.88rem', marginTop: '1.5rem' }}>
                    Chưa có tài khoản?{' '}
                    <Link href="/register" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>Đăng ký miễn phí</Link>
                </p>
            </div>
        </div>
    );
}
