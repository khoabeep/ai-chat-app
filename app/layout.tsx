import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Chat — Powered by Gemini',
    description: 'Trợ lý AI thông minh, trả lời mọi câu hỏi của bạn',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
