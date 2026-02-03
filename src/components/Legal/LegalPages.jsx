import React from 'react';
import SEO from '../SEO/SEO';

const LegalLayout = ({ children, title }) => (
    <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8rem 2rem 4rem',
        background: 'var(--bg-dark)',
        color: 'var(--text-main)',
        lineHeight: '1.6'
    }}>
        <SEO
            title={`${title} - Gravity Recorder`}
            description={`${title} for Gravity Recorder, the premium screen studio.`}
        />
        <div style={{ maxWidth: '800px', width: '100%' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: 'var(--primary)' }}>{title}</h1>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                {children}
            </div>
        </div>
    </div>
);

export const PrivacyPolicy = () => (
    <LegalLayout title="Privacy Policy">
        <section>
            <p>Last Updated: February 4, 2026</p>
            <p>Your privacy is important to us. This Privacy Policy explains how Gravity Recorder collects, uses, and protects your information.</p>

            <h3>1. Information We Collect</h3>
            <p>Gravity Recorder is designed as a local-first application. Most of your recording data never leaves your computer.</p>
            <ul>
                <li><strong>Local Data:</strong> Videos, thumbnails, and metadata are stored locally on your device via the File System Access API.</li>
                <li><strong>Google Account Data:</strong> If you enable Cloud Sync, we access your Google profile (email, name, picture) and create files in your Google Drive. We only access files created by this application.</li>
            </ul>

            <h3>2. How We Use Data</h3>
            <p>We use your Google Account information solely to facilitate video uploads to your own Google Drive and to provide a personalized sync experience.</p>

            <h3>3. Data Retention</h3>
            <p>We do not operate a centralized backend that stores your videos. Your data remains in your control on your local machine and your personal Google Drive.</p>

            <h3>4. Security</h3>
            <p>We use industry-standard authentication (Supabase & Google OAuth) to ensure your cloud connection is secure.</p>
        </section>
    </LegalLayout>
);

export const TermsOfService = () => (
    <LegalLayout title="Terms of Service">
        <section>
            <p>Last Updated: February 4, 2026</p>
            <p>By using Gravity Recorder, you agree to these terms.</p>

            <h3>1. License</h3>
            <p>Gravity Recorder is provided as-is for personal and commercial use in creating screen recordings and screen captures.</p>

            <h3>2. Content Ownership</h3>
            <p>You own 100% of the content you create. We claim no ownership over your recordings.</p>

            <h3>3. Prohibited Use</h3>
            <p>You agree not to use Gravity Recorder for any illegal activities or to infringe upon the intellectual property rights of others.</p>

            <h3>4. Limitation of Liability</h3>
            <p>Gravity Recorder is not responsible for data loss due to local hardware failure or account access issues. We recommend maintaining regular backups of your recordings.</p>
        </section>
    </LegalLayout>
);
