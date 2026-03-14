import React, { useState } from 'react';

const WebsiteTranslationWizardSimple = ({ projectId, projectName, onClose, onComplete }) => {
    const [url, setUrl] = useState('');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">🧙‍♂️ NEW Website Translation Wizard</h2>
                        <p className="text-gray-400">This is the NEW wizard interface!</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Test Content */}
                <div className="p-8 bg-green-600 rounded-lg text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-4">
                        ✅ NEW WIZARD IS WORKING!
                    </h3>
                    <p className="text-white">
                        If you see this green box, the new wizard component is loading correctly.
                        The old interface should be completely replaced.
                    </p>
                </div>

                {/* Simple URL Input */}
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
                            alert('🎉 New wizard is working! URL: ' + url);
                            onComplete({ segmentCount: 1, websiteType: 'test' });
                        }}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        Test Complete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WebsiteTranslationWizardSimple;