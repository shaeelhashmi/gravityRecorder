import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import SEO from '../SEO/SEO';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const [stars, setStars] = useState(() => {
        const cached = localStorage.getItem('gh_stars');
        return cached ? parseInt(cached) : null;
    });

    const [activeFaq, setActiveFaq] = useState(null);

    useEffect(() => {
        const fetchStars = async () => {
            try {
                const response = await fetch('https://api.github.com/repos/uzairkath/gravityRecorder');
                if (response.ok) {
                    const data = await response.json();
                    setStars(data.stargazers_count);
                    localStorage.setItem('gh_stars', data.stargazers_count);
                    localStorage.setItem('gh_stars_time', Date.now());
                }
            } catch (error) {
                console.error('Error fetching GitHub stars:', error);
            }
        };

        const cachedTime = localStorage.getItem('gh_stars_time');
        const isExpired = !cachedTime || (Date.now() - parseInt(cachedTime)) > 3600000 * 6; // 6 hours

        if (!stars || isExpired) {
            fetchStars();
        }
    }, [stars]);

    const faqs = [
        {
            q: "Is Gravity Recorder really free?",
            a: "Yes, 100%. Gravity is a fully open-source project with no paywalls, no 'Pro' plans, and no hidden subscriptions. Everything—from 2K recording to cloud sync—is available for free from the moment you launch the studio."
        },
        {
            q: "Is there a recording limit?",
            a: "No. You can record as long as you want and as many videos as you want. There are no artificial limits on recording duration, file count, or storage capacity. Your local disk space is your only limit."
        },
        {
            q: "Do I need to install any software?",
            a: "None. Gravity works directly in your web browser using modern web APIs. You don't need to download an .exe file or install a browser extension—making it the most secure and instant recording experience possible."
        },
        {
            q: "What video qualities and formats are supported?",
            a: "You can record in different qualities including 720p, 1080p, and even professional 2K (1440p) video quality. You can also customize your file extension to MKV, WebM, or even export as high-bitrate MP3 for podcasts."
        },
        {
            q: "How does the local privacy work?",
            a: "Unlike Loom or Tella, Gravity saves your videos directly to your local workspace using the File System Access API. This gives you absolute privacy and control over your data; your videos never leave your machine unless you choose to upload them to Google Drive."
        }
    ];

    return (
        <div className="landing-container">
            <SEO
                title="Gravity Recorder | Best Free 2K Screen Recorder with Camera Bubble"
                description="Professional free screen recorder with webcam bubble, 2K quality, and no recording limits. Open source alternative to Loom and Tella. Record in MKV or WebM."
            />
            {/* Mesh Gradient Background */}
            <div className="mesh-gradient"></div>

            {/* Navigation Bar */}
            <nav className="landing-nav">
                <div className="nav-logo">
                    <div className="logo-icon" style={{ color: 'white' }}>G</div>
                    <span>Gravity Recorder</span>
                </div>
                <div className="nav-links">
                    <a href="#features">Features</a>
                    <a href="#comparison">Compare</a>
                    <a href="#faq">FAQ</a>
                    <a href="/blog" onClick={(e) => { e.preventDefault(); navigate('/blog'); }}>Blog</a>
                    <button className="btn btn-primary btn-sm" style={{ color: 'white' }} onClick={() => navigate('/recorder')}>Launch Studio</button>
                    <ThemeToggle />
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="pulse"></span>
                        Privacy-First Browser Studio
                    </div>
                    <h1 className="hero-title">
                        The Best <span className="text-gradient">Free Screen Recorder</span> with Camera Bubble & 2K Quality.
                    </h1>
                    <p className="hero-subtitle">
                        A free and open source tool with premium features like gradient canvas backgrounds, camera bubble PIP, mic enablement, and pause/play control. Record in 720p, 1080p, or 2K quality with zero lag.
                    </p>
                    <div className="hero-actions">
                        <button className="btn btn-primary btn-glow btn-xl" onClick={() => navigate('/recorder')}>
                            Launch Studio — It's Free
                        </button>
                        <button className="btn btn-outline btn-xl btn-with-icon" onClick={() => window.open('https://github.com/uzairkath/gravityRecorder', '_blank')}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                            <span>Open Source</span>
                        </button>
                    </div>
                    <div className="hero-social">
                        <div className="github-stars-badge" onClick={() => window.open('https://github.com/uzairkath/gravityRecorder', '_blank')}>
                            <div className="gh-avatars">
                                <span className="gh-icon">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                </span>
                                <div className="stars-count">
                                    <span className="star-symbol">★</span>
                                    {stars || '...'}
                                </div>
                            </div>
                            <span className="badge-text">Join the developers switchting to local-first</span>
                        </div>
                    </div>
                </div>

                <div className="hero-visual-container">
                    <div className="floating-ui recorder-mockup">
                        <div className="mockup-header">
                            <div className="mac-controls"><span></span><span></span><span></span></div>
                            <div className="mockup-title">gravity-studio.app</div>
                        </div>
                        <div className="mockup-body">
                            <div className="mockup-canvas">
                                <div className="mockup-webcam"></div>
                                <div className="mockup-screen-layer"></div>
                            </div>
                            <div className="mockup-controls">
                                <div className="mockup-btn red"></div>
                                <div className="mockup-btn"></div>
                                <div className="mockup-btn"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Showcase */}
            <section id="features" className="features-grid-section">
                <div className="section-header">
                    <h2 className="section-title">Why Settle for <span className="text-gradient">Less?</span></h2>
                    <p className="section-subtitle">Get the studio experience directly in your browser with absolute data control.</p>
                </div>

                <div className="features-container">
                    <div className="feature-card-premium glass">
                        <div className="feature-icon-wrapper">🎥</div>
                        <h3>Pro Recording Tools</h3>
                        <p>Camera bubble PIP, mic enablement, and real-time pause/play/continue controls are standard here. Craft professional videos without the clunky interface of traditional software.</p>
                    </div>
                    <div className="feature-card-premium glass">
                        <div className="feature-icon-wrapper">🖥️</div>
                        <h3>Crystal Clear 2K Quality</h3>
                        <p>Record in different qualities: 720p, 1080p, or high-fidelity 2K for professional demos. Our engine ensures high-frame-rate capture that looks sharp on any display.</p>
                    </div>
                    <div className="feature-card-premium glass">
                        <div className="feature-icon-wrapper">💾</div>
                        <h3>Flexible File Formats</h3>
                        <p>Set your file extension as you like: MKV, WebM, or even export directly to high-quality MP3. Perfect for sharing on YouTube, LinkedIn, or internal Slack channels.</p>
                    </div>
                    <div className="feature-card-premium glass">
                        <div className="feature-icon-wrapper">🛡️</div>
                        <h3>Local Workspace Privacy</h3>
                        <p>Your data belongs to you. Videos are written directly to your local workspace, meaning no third-party cloud is storing your sensitive internal demos or confidential meetings.</p>
                    </div>
                    <div className="feature-card-premium glass">
                        <div className="feature-icon-wrapper">⚡</div>
                        <h3>Zero-Setup Studio</h3>
                        <p>No app installs required, no browser extensions to manage. Just go to the studio and click on the start button. It's the fastest way to record and share your ideas.</p>
                    </div>
                    <div className="feature-card-premium glass">
                        <div className="feature-icon-wrapper">💎</div>
                        <h3>Premium Features Free</h3>
                        <p>Why pay for Loom or Tella? Get gradient backgrounds, studio effects, and unlimited recordings for $0. No hidden pro plans, no paywalls, just pure productivity.</p>
                    </div>
                </div>
            </section>

            {/* Comparison Table */}
            <section id="comparison" className="comparison-section">
                <div className="section-header">
                    <h2 className="section-title">Why pay when you can <span className="text-gradient">get it for free?</span></h2>
                    <p className="section-subtitle">Gravity is the best Loom and Tella alternative with matching quality and zero costs.</p>
                </div>

                <div className="comparison-table-wrapper glass">
                    <table className="comparison-table">
                        <thead>
                            <tr>
                                <th>Feature</th>
                                <th>Loom / Tella</th>
                                <th className="highlight">Gravity Recorder</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Monthly Cost</td>
                                <td>$12 - $15</td>
                                <td className="highlight">$0 (Forever)</td>
                            </tr>
                            <tr>
                                <td>Recording Limit</td>
                                <td>5-25 Mins (Free)</td>
                                <td className="highlight">Unlimited</td>
                            </tr>
                            <tr>
                                <td>Privacy</td>
                                <td>Cloud-First</td>
                                <td className="highlight">Local-First</td>
                            </tr>
                            <tr>
                                <td>Max Quality</td>
                                <td>Paid for 4K/2K</td>
                                <td className="highlight">Free 2K/4K</td>
                            </tr>
                            <tr>
                                <td>Installation</td>
                                <td>Required / Plugin</td>
                                <td className="highlight">No Install</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="faq-section">
                <div className="section-header">
                    <h2 className="section-title">Frequently Asked <span className="text-gradient">Questions</span></h2>
                </div>
                <div className="faq-accordion">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`faq-item glass ${activeFaq === index ? 'active' : ''}`}
                            onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                        >
                            <div className="faq-question">
                                <h3>{faq.q}</h3>
                                <span className="faq-icon">{activeFaq === index ? '−' : '+'}</span>
                            </div>
                            <div className="faq-answer">
                                <p>{faq.a}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Middle CTA */}
            <section className="oss-manifesto">
                <div className="manifesto-card glass">
                    <h2>No App Installs Required</h2>
                    <p>Just go to the studio and click on the start button and you are good to go. Record as many videos as you want, as long as you want.</p>
                    <div className="oss-actions">
                        <button className="btn btn-primary btn-xl" onClick={() => navigate('/recorder')}>Start Recording — It's Free</button>
                    </div>
                </div>
            </section>

            <footer className="studio-footer">
                <div className="footer-content">
                    <div className="footer-logo" style={{ color: 'var(--text-main)', background: 'var(--glass)' }}>G</div>
                    <p>© 2026 Gravity Labs. 100% Free & Open Source.</p>
                    <div className="footer-links">
                        <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate('/privacy'); }}>Privacy Policy</a>
                        <a href="/terms" onClick={(e) => { e.preventDefault(); navigate('/terms'); }}>Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
