import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getPostBySlug } from '../../services/BlogService';
import './Blog.css';

const BlogPost = () => {
    const { slug } = useParams();
    const post = getPostBySlug(slug);

    useEffect(() => {
        if (post) {
            document.title = `${post.title} | Gravity Recorder`;
            // In a real production app, we would use react-helmet for meta tags
        }
    }, [post]);

    if (!post) {
        return (
            <div className="blog-not-found">
                <h1>Post Not Found</h1>
                <Link to="/blog">Back to Blog</Link>
            </div>
        );
    }

    return (
        <article className="blog-post">
            <header className="post-header">
                <Link to="/blog" className="back-link">← Back to Blog</Link>
                <div className="post-meta">
                    <time>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
                    <span className="author">By {post.author}</span>
                </div>
                <h1 className="post-title">{post.title}</h1>
                {post.image && <img src={post.image} alt={post.title} className="post-hero-image" />}
            </header>

            <div className="post-content">
                <ReactMarkdown>{post.body}</ReactMarkdown>
            </div>

            <footer className="post-footer">
                <h3>Ready to take control of your recordings?</h3>
                <p>Join thousands of creators using the most private screen recorder on the web.</p>
                <Link to="/recorder" className="post-cta-button">Launch Gravity Studio</Link>
            </footer>
        </article>
    );
};

export default BlogPost;
