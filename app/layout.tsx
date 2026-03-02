import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
    title: 'KhoaAI — Trợ lý AI thông minh',
    description: 'KhoaAI - Trợ lý AI thông minh, trả lời mọi câu hỏi của bạn. Powered by KhoaAI.',
    keywords: ['KhoaAI', 'AI chat', 'chatbot', 'trí tuệ nhân tạo'],
    authors: [{ name: 'Nguyễn Vũ Đăng Khoa' }],
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#6366f1' },
        { media: '(prefers-color-scheme: dark)', color: '#818cf8' },
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi">
            <body>{children}</body>
        </html>
    );
}
