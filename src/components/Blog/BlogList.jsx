import React from 'react';
import { Link } from 'react-router-dom';
import { getPosts } from '../../services/BlogService';
import './Blog.css';

const BlogList = () => {
    const posts = getPosts();

    return (
        <div className="blog-list-container">
            <header className="blog-header">
                <h1 className="blog-title">Gravity Insights</h1>
                <p className="blog-subtitle">Guides on privacy, creation, and the future of video.</p>
            </header>

            <div className="blog-grid">
                {posts.map((post) => (
                    <Link to={`/blog/${post.slug}`} key={post.slug} className="blog-card">
                        {post.image && (
                            <div className="blog-card-image">
                                <img src={post.image} alt={post.title} />
                            </div>
                        )}
                        <div className="blog-card-content">
                            <span className="blog-card-date">{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            <h2 className="blog-card-title">{post.title}</h2>
                            <p className="blog-card-excerpt">{post.excerpt}</p>
                            <span className="blog-card-link">Read Article →</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default BlogList;
