import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getPostBySlug } from '../../services/BlogService';
import './Blog.css';

const BlogPost = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const post = getPostBySlug(slug);

    useEffect(() => {
        if (post) {
            document.title = `${post.title} | Gravity Recorder`;

            // Dynamic SEO Meta Tags
            let metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', post.excerpt || post.title);
            } else {
                const meta = document.createElement('meta');
                meta.name = 'description';
                meta.content = post.excerpt || post.title;
                document.head.appendChild(meta);
            }
        }
    }, [post]);

    if (!post) {
        return <div className="blog-list-container">Post Not Found</div>;
    }

    return (
        <article className="blog-post">
            <Link to="/blog" className="back-link">
                ← Back to Insights
            </Link>

            <header className="post-header">
                <span className="post-category">Pillar Content</span>
                <div className="post-title">
                    <h1>{post.title}</h1>
                </div>
                <div className="post-meta">
                    <div className="post-author">
                        <div className="author-img"></div>
                        <span>by {post.author}</span>
                    </div>
                    <div className="post-date">
                        {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                </div>
            </header>

            {post.image && (
                <div className="post-featured-image">
                    <img src={post.image} alt={`${post.title} - Gravity Recorder Loom Alternative`} />
                </div>
            )}

            <div className="post-content">
                <ReactMarkdown>{post.body}</ReactMarkdown>
            </div>

            <div className="post-cta">
                <h3>Ready to escape the cloud?</h3>
                <p>Start recording studio-grade demos with 100% privacy today.</p>
                <button className="btn btn-primary" onClick={() => navigate('/recorder')}>Launch Gravity Studio</button>
            </div>
        </article>
    );
};

export default BlogPost;
