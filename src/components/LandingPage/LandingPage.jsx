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

    return (
        <div className="landing-container">
            <SEO
                title="Gravity Recorder | The #1 Free Loom Alternative for 2026"
                description="Professional, local-first screen studio for creators. Record high-quality videos with webcam overlays and studio effects. 100% Private, 100% Free."
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
                    <a href="#showcase">Showcase</a>
                    <a href="/blog" onClick={(e) => { e.preventDefault(); navigate('/blog'); }}>Blog</a>
                    <button className="btn btn-primary btn-sm" style={{ color: 'white' }} onClick={() => navigate('/recorder')}>Launch App</button>
                    <ThemeToggle />
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="pulse"></span>
                        Version 1.2 Now Open Source
                    </div>
                    <h1 className="hero-title">
                        The Best <span className="text-gradient">Free Loom Alternative</span> <br />
                        for Professional Creators.
                    </h1>
                    <p className="hero-subtitle">
                        A premium, local-first screen studio designed for creators who value privacy and high-end design. 100% Free. 100% Open Source.
                    </p>
                    <div className="hero-actions">
                        <button className="btn btn-primary btn-glow btn-xl" onClick={() => navigate('/recorder')}>
                            Start Recording — Free
                        </button>
                        <button className="btn btn-outline btn-xl btn-with-icon" onClick={() => window.open('https://github.com/uzairkath/gravityRecorder', '_blank')}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                            <span>View Source on GitHub</span>
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
                            <span className="badge-text">Join {stars ? `the ${stars}` : 'over 1,000'} developers growing with us</span>
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
                    <div className="floating-ui sidebar-mockup">
                        <div className="mockup-item"></div>
                        <div className="mockup-item"></div>
                        <div className="mockup-item active"></div>
                    </div>
                </div>
            </section>

            {/* Feature Showcase */}
            <section id="features" className="features-grid-section">
                <div className="section-header">
                    <h2 className="section-title">Professional Tools, <span className="text-gradient">Zero Cost.</span></h2>
                    <p className="section-subtitle">We've modularized everything so you get performance without the bloat.</p>
                </div>

                <div className="features-container">
                    <div className="feature-card-premium glass">
                        <div className="feature-icon-wrapper">🚀</div>
                        <h3>Direct hardware capture</h3>
                        <p>Skip the middleman. We record directly to your disk for ultra-low CPU usage and zero lag.</p>
                    </div>
                    <div className="feature-card-premium glass">
                        <div className="feature-icon-wrapper">🎨</div>
                        <h3>Studio-grade effects</h3>
                        <p>Customize your webcam shape, background gradients, and screen scaling in real-time.</p>
                    </div>
                    <div className="feature-card-premium glass">
                        <div className="feature-icon-wrapper">☁️</div>
                        <h3>Hybrid Cloud Sync</h3>
                        <p>Keep your files local but share links in a second via our Google Drive integration.</p>
                    </div>
                    <div className="feature-card-premium glass">
                        <div className="feature-icon-wrapper">🤝</div>
                        <h3>Community Powered</h3>
                        <p>Open source means transparency. No hidden tracking, no paywalls, just great code.</p>
                    </div>
                </div>
            </section>

            {/* Tutorial Video Section */}
            <section id="showcase" className="showcase-section-premium">
                <div className="showcase-content">
                    <h2 className="section-title">See it in <span className="text-gradient">Action</span></h2>
                    <div className="video-player-frame glass">
                        <div className="player-inner">
                            <iframe
                                width="100%"
                                height="100%"
                                src="https://www.youtube.com/embed/Rkdov0z35K8?modestbranding=1&rel=0&showinfo=0"
                                title="Gravity Recorder Demo"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="showcase-video"
                            ></iframe>
                        </div>
                    </div>
                </div>
            </section>

            {/* OSS Section */}
            <section className="oss-manifesto">
                <div className="manifesto-card glass">
                    <div className="github-logo">
                        <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                    </div>
                    <h2>Join the Gravity Community</h2>
                    <p>We're building the future of screen recording in the open. No paywalls, no proprietary formats, just code.</p>
                    <div className="oss-actions">
                        <button className="btn btn-primary" onClick={() => window.open('https://github.com/uzairkath/gravityRecorder', '_blank')}>Contribute on GitHub</button>
                        <button className="btn btn-outline" onClick={() => window.open('https://github.com/uzairkath/gravityRecorder/stargazers', '_blank')}>Star the Project</button>
                    </div>
                </div>
            </section>

            <footer className="studio-footer">
                <div className="footer-content">
                    <div className="footer-logo" style={{ color: 'var(--text-main)', background: 'var(--glass)' }}>G</div>
                    <p>© 2026 Gravity Labs. Built with ❤️ for the community.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
