import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './WebDevelopmentService.css';

const servicesData = {
    'custom-web': {
        title: 'Custom Web Development',
        description: 'We build high-performance, scalable, and secure websites tailored to your unique business requirements. Using the latest technologies, we ensure your online presence is powerful and effective.',
        features: [
            { title: 'Responsive Design', desc: 'Looks great on all devices, from desktops to smartphones.' },
            { title: 'Modern Frameworks', desc: 'Built with React, Vue, or Next.js for blazing fast performance.' },
            { title: 'SEO Optimized', desc: 'Structured to rank higher in search engine results.' },
            { title: 'Secure & Scalable', desc: 'Enterprise-grade security practices and scalable architecture.' }
        ]
    },
    'mobile-app': {
        title: 'Mobile App Development',
        description: 'Transform your ideas into powerful mobile applications. We develop native and cross-platform apps that provide seamless user experiences on iOS and Android.',
        features: [
            { title: 'iOS & Android', desc: 'Reach all your users across major mobile platforms.' },
            { title: 'React Native / Flutter', desc: 'Cost-effective cross-platform development without compromising quality.' },
            { title: 'Intuitive UI/UX', desc: 'Engaging interfaces that keep users coming back.' },
            { title: 'Offline Capabilities', desc: 'Functional apps even with limited internet connectivity.' }
        ]
    },
    'ecommerce': {
        title: 'E-Commerce Solutions',
        description: 'Empower your business with a robust online store. We create secure, user-friendly e-commerce platforms that drive sales and simplify management.',
        features: [
            { title: 'Custom Storefronts', desc: 'Unique designs that reflect your brand identity.' },
            { title: 'Secure Payments', desc: 'Integration with Stripe, PayPal, and other major gateways.' },
            { title: 'Inventory Management', desc: 'Tools to easily track and manage your stock.' },
            { title: 'Analytics Dashboard', desc: 'Insights into sales and customer behavior.' }
        ]
    },
    'ui-ux': {
        title: 'UI/UX Design',
        description: 'Design is not just how it looks, but how it works. We create intuitive and visually stunning interfaces that enhance user satisfaction and conversion rates.',
        features: [
            { title: 'User Research', desc: 'Understanding your audience to design effective solutions.' },
            { title: 'Wireframing', desc: 'Blueprints of your product to visualize structure.' },
            { title: 'Prototyping', desc: 'Interactive mockups to test flows before development.' },
            { title: 'Visual Design', desc: 'Pixel-perfect UI with modern aesthetics.' }
        ]
    },
    'maintenance': {
        title: 'Maintenance & Support',
        description: 'Your digital product needs care to stay peak performance. We provide ongoing support, updates, and optimization.',
        features: [
            { title: '24/7 Monitoring', desc: 'Proactive monitoring to prevent downtime.' },
            { title: 'Security Updates', desc: 'Regular patches to protect against vulnerabilities.' },
            { title: 'Performance Tuning', desc: 'Optimizing speed and resource usage.' },
            { title: 'Content Updates', desc: 'Assistance with keeping your site content fresh.' }
        ]
    },
    'api-integration': {
        title: 'API Integration',
        description: 'Connect your systems for a seamless workflow. We integrate third-party APIs to extend the functionality of your applications.',
        features: [
            { title: 'Custom API Development', desc: 'Building robust APIs for your internal or external use.' },
            { title: 'Third-Party Connections', desc: 'Integrate CRM, ERP, and payment systems.' },
            { title: 'Real-time Data', desc: 'Synchronize data across platforms instantly.' },
            { title: 'Documentation', desc: 'Clear guides for your API consumers.' }
        ]
    }
};

const WebDevelopmentService = () => {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    const service = servicesData[serviceId];

    useEffect(() => {
        if (!service) {
            navigate('/web-development');
        }
        window.scrollTo(0, 0);
    }, [serviceId, service, navigate]);

    if (!service) return null;

    return (
        <div className="service-detail-container">
            <div className="service-header">
                <h1 className="text-neon-cyan section-title">{service.title}</h1>
            </div>

            <div className="service-content">
                <div className="service-description">
                    <p>{service.description}</p>
                </div>

                <div className="service-features">
                    {service.features.map((feature, index) => (
                        <div key={index} className="feature-box" style={{ animationDelay: `${index * 0.1}s` }}>
                            <h3>{feature.title}</h3>
                            <p>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            <Link to="/web-development" className="back-link">
                &larr; Back to Services
            </Link>
        </div>
    );
};

export default WebDevelopmentService;
