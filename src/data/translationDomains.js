// Translation Domains and Subdomains for Glossa Platform
// Used in: TranslatorOnboarding, Annotation, Job Creation

export const translationDomains = {
    'Legal': {
        icon: '⚖️',
        subdomains: [
            'Contracts & Agreements',
            'Court Documents',
            'Immigration Documents',
            'Patents & IP',
            'Terms & Conditions',
            'Certificates',
            'Legal Correspondence',
            'Litigation Documents'
        ]
    },
    'Medical': {
        icon: '🏥',
        subdomains: [
            'Clinical Trials',
            'Medical Reports',
            'Pharmaceutical Documentation',
            'Patient Information Leaflets',
            'Medical Devices',
            'Hospital Records',
            'Prescription Labels',
            'Healthcare Software'
        ]
    },
    'Technical': {
        icon: '⚙️',
        subdomains: [
            'Engineering Manuals',
            'Product Documentation',
            'Machinery Manuals',
            'Technical Specifications',
            'Safety Instructions',
            'Installation Guides',
            'Maintenance Manuals'
        ]
    },
    'IT & Software': {
        icon: '💻',
        subdomains: [
            'Software UI/UX',
            'Mobile Apps',
            'Websites',
            'SaaS Platforms',
            'Software Documentation',
            'API Documentation',
            'Error Messages',
            'Help Files'
        ]
    },
    'Marketing': {
        icon: '🌍',
        subdomains: [
            'Ad Campaigns',
            'Brand Messaging',
            'Slogans',
            'Social Media Content',
            'Product Descriptions',
            'Email Marketing',
            'Landing Pages',
            'Brochures'
        ]
    },
    'Financial': {
        icon: '💰',
        subdomains: [
            'Bank Statements',
            'Financial Reports',
            'Annual Reports',
            'Investment Documents',
            'Insurance Policies',
            'Tax Documents',
            'Audit Reports',
            'Stock Market Documents'
        ]
    },
    'Business': {
        icon: '🏢',
        subdomains: [
            'Corporate Communications',
            'HR Documents',
            'Business Proposals',
            'Company Policies',
            'Internal Communications',
            'Meeting Minutes',
            'Presentations',
            'Business Correspondence'
        ]
    },
    'Gaming': {
        icon: '🎮',
        subdomains: [
            'Game UI',
            'Dialogues & Storylines',
            'In-game Instructions',
            'Game Marketing',
            'Character Names',
            'Achievement Descriptions',
            'Tutorial Content'
        ]
    },
    'Audiovisual': {
        icon: '🎬',
        subdomains: [
            'Subtitling',
            'Dubbing Scripts',
            'Voice-over Scripts',
            'Film & TV Translation',
            'Documentary Translation',
            'Video Game Cutscenes',
            'YouTube Content'
        ]
    },
    'E-commerce': {
        icon: '🛒',
        subdomains: [
            'Product Listings',
            'Online Store Content',
            'Customer Reviews',
            'Shopping Platforms',
            'Product Categories',
            'Checkout Pages',
            'Return Policies'
        ]
    },
    'Scientific': {
        icon: '🔬',
        subdomains: [
            'Research Papers',
            'Scientific Journals',
            'Academic Studies',
            'Laboratory Documentation',
            'Scientific Reports',
            'Conference Papers',
            'Abstracts'
        ]
    },
    'Educational': {
        icon: '🎓',
        subdomains: [
            'Diplomas & Transcripts',
            'Academic Papers',
            'Course Materials',
            'University Documents',
            'Textbooks',
            'E-learning Content',
            'Curriculum Documents'
        ]
    },
    'Government': {
        icon: '🏛️',
        subdomains: [
            'Public Policies',
            'Government Reports',
            'Official Announcements',
            'Regulatory Documents',
            'Public Notices',
            'Legislative Documents',
            'Census Documents'
        ]
    },
    'Travel': {
        icon: '✈️',
        subdomains: [
            'Travel Guides',
            'Hotel Websites',
            'Tourism Brochures',
            'Booking Platforms',
            'Restaurant Menus',
            'Tourist Attractions',
            'Travel Apps'
        ]
    },
    'Media': {
        icon: '📰',
        subdomains: [
            'News Articles',
            'Press Releases',
            'Editorial Content',
            'Interviews',
            'Magazine Articles',
            'Blog Posts',
            'Opinion Pieces'
        ]
    },
    'Religious': {
        icon: '⛪',
        subdomains: [
            'Religious Texts',
            'Sermons',
            'Theology Materials',
            'Prayer Books',
            'Religious Websites',
            'Spiritual Content'
        ]
    },
    'Literary': {
        icon: '📚',
        subdomains: [
            'Books',
            'Novels',
            'Poetry',
            'Short Stories',
            'Essays',
            'Plays',
            'Children\'s Books'
        ]
    },
    'Automotive': {
        icon: '🚗',
        subdomains: [
            'Vehicle Manuals',
            'Automotive Software',
            'Parts Catalogs',
            'Service Manuals',
            'Warranty Documents',
            'Dealership Materials'
        ]
    },
    'Manufacturing': {
        icon: '🏭',
        subdomains: [
            'Industrial Manuals',
            'Production Documentation',
            'Factory Safety Documents',
            'Quality Control Documents',
            'Supply Chain Documents',
            'Equipment Manuals'
        ]
    },
    'Energy': {
        icon: '🌱',
        subdomains: [
            'Oil & Gas Documentation',
            'Renewable Energy Reports',
            'Environmental Studies',
            'Sustainability Reports',
            'Climate Change Documents',
            'Energy Regulations'
        ]
    },
    'Life Sciences': {
        icon: '🧬',
        subdomains: [
            'Biotechnology Documents',
            'Genetics Research',
            'Pharmaceutical Research',
            'Clinical Studies',
            'Regulatory Submissions',
            'Drug Labels'
        ]
    },
    'Telecom': {
        icon: '📡',
        subdomains: [
            'Telecom Equipment Manuals',
            'Network Documentation',
            'Mobile Technology',
            'Telecom Software',
            'Service Agreements',
            'Technical Specifications'
        ]
    },
    'General': {
        icon: '📄',
        subdomains: [
            'General Correspondence',
            'Personal Documents',
            'Miscellaneous Content',
            'Non-specialized Text'
        ]
    }
};

// Get all domain names
export const getDomainNames = () => Object.keys(translationDomains);

// Get subdomains for a specific domain
export const getSubdomains = (domain) => translationDomains[domain]?.subdomains || [];

// Get icon for a domain
export const getDomainIcon = (domain) => translationDomains[domain]?.icon || '📄';

// Format domain with icon
export const formatDomain = (domain) => {
    const icon = getDomainIcon(domain);
    return `${icon} ${domain}`;
};
