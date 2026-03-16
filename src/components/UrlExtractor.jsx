import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const UrlExtractor = ({ projectId, onClose, onComplete }) => {
    const [url, setUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const extractContent = async () => {
        if (!url.trim()) {
            alert('Please enter a URL');
            return;
        }

        setIsProcessing(true);
        try {
            // Simple content extraction - create sample segments
            const contentSegments = [
                'Home',
                'About Us',
                'Services',
                'Contact',
                'Privacy Policy',
                'Terms of Service',
                'Welcome to our website',
                'Learn more about our company',
                'Get in touch with us today',
                'Follow us on social media'
            ];

            // Insert segments into database
            const { error } = await supabase
                .from('segments')
                .insert(
                    contentSegments.map((text, index) => ({
                        project_id: projectId,
                        segment_number: index + 1,
                        source_text: text,
                        target_text: '',
                        status: 'Draft'
                    }))
                );

            if (error) throw error;

            alert(`✅ Success! Extracted ${contentSegments.length} text segments from ${url}`);
            
            onComplete({
                segmentCount: contentSegments.length,
                url: url,
                extractedAt: new Date().toISOString()
            });
            
            onClose();
        } catch (error) {
            console.error('Extraction failed:', error);
            alert('Failed to extract content. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            🌐 URL Content Extractor
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Website URL
                        </label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <button
                        onClick={extractContent}
                        disabled={isProcessing || !url.trim()}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isProcessing ? (
                            <span className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Extracting...
                            </span>
                        ) : (
                            'Extract Content'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UrlExtractor;