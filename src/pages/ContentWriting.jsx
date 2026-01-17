import React from 'react';
import './ContentWriting.css';

const ContentWriting = () => {
    return (
        <div className="content-container page-container">
            <h1 className="text-neon-pink section-title">Content Writing</h1>
            <p className="intro-text">
                Words that captivate, convince, and convert.
            </p>

            <div className="services-grid">
                <div className="service-card glass-panel">
                    <h3>Blog Posts</h3>
                    <p>
                        Engaging articles that drive traffic and build authority.
                        SEO-optimized and tailored to your brand voice.
                    </p>
                </div>
                <div className="service-card glass-panel">
                    <h3>Technical Writing</h3>
                    <p>
                        Clear, concise documentation for complex products.
                        Manuals, whitepapers, and API docs.
                    </p>
                </div>
                <div className="service-card glass-panel">
                    <h3>Creative Copy</h3>
                    <p>
                        Ad copy, social media posts, and landing page content
                        that grabs attention and refuses to let go.
                    </p>
                </div>
                <div className="service-card glass-panel">
                    <h3>Localization</h3>
                    <p>
                        Adapting your content for different cultures,
                        ensuring your message lands perfectly everywhere.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ContentWriting;
