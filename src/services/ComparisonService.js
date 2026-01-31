const competitors = {
    'loom': {
        name: 'Loom',
        tagline: 'The #1 Private, Local-First Loom Alternative.',
        description: 'Stop paying for your own productivity. Gravity gives you the same professional recording experience with 100% privacy and zero monthly fees.',
        comparison: [
            { feature: 'Price', competitor: '$12 - $15 / mo', gravity: 'FREE ($0)', highlight: true },
            { feature: 'Privacy', competitor: 'Cloud Servers', gravity: 'Local-First', highlight: true },
            { feature: 'Recording Limit', competitor: '5 Minutes (Free)', gravity: 'Unlimited', highlight: true },
            { feature: 'Login Required', competitor: 'Mandatory', gravity: 'Zero Login', highlight: true },
            { feature: 'Setup', competitor: 'Managed SaaS', gravity: 'Zero Setup', highlight: false },
        ]
    },
    'tella': {
        name: 'Tella',
        tagline: 'Aesthetic Recording, without the Aesthetic Price Tag.',
        description: 'Love the Tella look but hate the subscription? Gravity offers studio-grade backgrounds, webcam masks, and HSL themes for free.',
        comparison: [
            { feature: 'Price', competitor: '$15+ / mo', gravity: 'FREE ($0)', highlight: true },
            { feature: 'Studio Effects', competitor: 'Paid Add-on', gravity: 'Included Free', highlight: true },
            { feature: 'Data Privacy', competitor: 'Stored on Cloud', gravity: '100% Private', highlight: true },
            { feature: 'Speed', competitor: 'Upload Latency', gravity: 'Zero Lag', highlight: false },
        ]
    },
    'screenity': {
        name: 'Screenity',
        tagline: 'The Powerful Browser Extension Alternative.',
        description: 'Skip the extension installs. Gravity is a full-featured web studio that runs directly in your browser with advanced file system access.',
        comparison: [
            { feature: 'Installation', competitor: 'Extension Required', gravity: 'Zero Install', highlight: true },
            { feature: 'Studio UI', competitor: 'Minimal', gravity: 'Ultra-Premium', highlight: true },
            { feature: 'File Handling', competitor: 'Download to Disk', gravity: 'Direct-to-Disk', highlight: true },
        ]
    }
};

export const getCompetitorData = (slug) => {
    return competitors[slug.toLowerCase()] || null;
};
