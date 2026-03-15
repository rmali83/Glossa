import React, { useState } from 'react';

const WebsiteTranslationWizard = ({ projectId, projectName, onClose, onComplete }) => {
    console.log('🧙‍♂️ WebsiteTranslationWizard v2.0 Loading...'); // Debug log
    const [url, setUrl] = useState('');
    
    // Simple test to see if this component is actually being called
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">🧙‍♂️ Advanced Website Translation Wizard v2.0</h2>
                        <p className="text-gray-400">Step 1 of 5 • Weglot-Style Experience</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Test Content */}
                <div className="p-8 bg-blue-600 rounded-lg text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-4">
                        🚀 FULL WIZARD COMPONENT IS LOADING!
                    </h3>
                    <p className="text-white">
                        This is the WebsiteTranslationWizard component (not the test component).
                        If you see this BLUE box, the full wizard is being called correctly.
                    </p>
                </div>

                {/* Simple form */}
                <div className="mb-6">
                    <label className="block text-white font-medium mb-2">Website URL</label>
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => {
                            alert('🎉 Full WebsiteTranslationWizard is working! URL: ' + url);
                            onComplete({ segmentCount: 1, websiteType: 'test' });
                        }}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Test Full Wizard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WebsiteTranslationWizard;