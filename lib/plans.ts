// Tier system: guest → free → pro
export type Plan = 'guest' | 'free' | 'pro';

export type PlanFeatures = {
    standardModel: boolean;
    turboModel: boolean;
    visionModel: boolean;
    fileAttach: boolean;
    pdfUpload: boolean;
    voice: boolean;
    export: boolean;
    debate: boolean;
    temperature: boolean;
    share: boolean;
    summarize: boolean;
};

export type PlanConfig = {
    label: string;
    badge: string;
    color: string;
    bgColor: string;
    messagesPerDay: number;
    price: string;
    priceNote: string;
    highlight: string[];
    features: PlanFeatures;
};

export const PLAN_CONFIG: Record<Plan, PlanConfig> = {
    guest: {
        label: 'Guest',
        badge: '👤 Guest',
        color: '#64748b',
        bgColor: 'rgba(100,116,139,0.12)',
        messagesPerDay: 15,
        price: 'Miễn phí',
        priceNote: 'Không cần đăng ký',
        highlight: [
            '15 tin nhắn mỗi ngày',
            'Chỉ KhoaAI Standard',
            'Tìm kiếm web cơ bản',
        ],
        features: {
            standardModel: true,
            turboModel: false,
            visionModel: false,
            fileAttach: false,
            pdfUpload: false,
            voice: false,
            export: false,
            debate: false,
            temperature: false,
            share: false,
            summarize: false,
        },
    },
    free: {
        label: 'Free',
        badge: '✨ Free',
        color: '#2563eb',
        bgColor: 'rgba(37,99,235,0.12)',
        messagesPerDay: 50,
        price: 'Miễn phí',
        priceNote: 'Đăng ký tài khoản',
        highlight: [
            '50 tin nhắn mỗi ngày',
            'KhoaAI Standard + Turbo',
            'Đính kèm file, giọng nói',
            'Xuất chat, Debate, Tóm tắt',
        ],
        features: {
            standardModel: true,
            turboModel: true,
            visionModel: false,
            fileAttach: true,
            pdfUpload: false,
            voice: true,
            export: true,
            debate: true,
            temperature: true,
            share: true,
            summarize: true,
        },
    },
    pro: {
        label: 'Pro',
        badge: '⭐ Pro',
        color: '#7c3aed',
        bgColor: 'rgba(124,58,237,0.12)',
        messagesPerDay: Infinity,
        price: '99.000 ₫',
        priceNote: 'mỗi tháng',
        highlight: [
            'Tin nhắn không giới hạn',
            'Tất cả model + Vision AI',
            'Upload PDF (đọc tài liệu)',
            'Ưu tiên tốc độ phản hồi',
        ],
        features: {
            standardModel: true,
            turboModel: true,
            visionModel: true,
            fileAttach: true,
            pdfUpload: true,
            voice: true,
            export: true,
            debate: true,
            temperature: true,
            share: true,
            summarize: true,
        },
    },
};

export function canUseFeature(plan: Plan, feature: keyof PlanFeatures): boolean {
    return PLAN_CONFIG[plan].features[feature];
}

export function getDailyLimit(plan: Plan): number {
    return PLAN_CONFIG[plan].messagesPerDay;
}
