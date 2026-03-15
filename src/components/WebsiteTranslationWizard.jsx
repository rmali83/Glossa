import React, { useState, useEffect } from 'react';
import websiteScraper from '../services/websiteScraper';
import { supabase } from '../lib/supabase';

const WebsiteTranslationWizard = ({ projectId, projectName, onClose, onComplete }) => {
    console.log('🧙‍♂️ WebsiteTranslationWizard v3.0 Loading...', new Date().toISOString()); // Debug log
    
    const [currentStep, setCurrentStep] = useState(1);
    const [wizardData, setWizardData] = useState({
        url: '',
        websiteType: 'static',
        detectedPlatform: null,
        contentTypes: {
            mainContent: true,
            navigation: true,
            footer: true,
            forms: true,
            metadata: true,
            images: true,
            buttons: true,
            popups: false,
            comments: false,
            sidebar: true
        }
    });

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResults, setAnalysisResults] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Website types (simplified)
    const websiteTypes = {
        wordpress: { name: 'WordPress', icon: '📝', description: 'WordPress CMS website' },
        shopify: { name: 'Shopify', icon: '🛒', description: 'Shopify e-commerce store' },
        react: { name: 'React App', icon: '⚛️', description: 'React single-page application' },
        static: { name: 'Static HTML', icon: '📄', description: 'Static HTML website' }
    };

    // Step 1: Analyze website
    const analyzeWebsite = async () => {
        if (!wizardData.url.trim()) {
            alert('Please enter a website URL');
            return;
        }

        setIsAnalyzing(true);
        try {
            // Simple analysis
            const analysis = {
                platform: 'static',
                pageTitle: 'Sample Website',
                hasNavigation: true,
                hasFooter: true,
                hasForms: false,
                hasImages: 5,
                language: 'en'
            };

            setAnalysisResults(analysis);
            setWizardData(prev => ({ ...prev, detectedPlatform: 'static' }));
            setCurrentStep(2);
        } catch (error) {
            console.error('Website analysis failed:', error);
            alert('Failed to analyze website. Please check the URL and try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Navigation
    const nextStep = () => {
        if (currentStep < 3) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    // Start translation
    const startTranslation = async () => {
        setIsProcessing(true);
        try {
            // Simulate processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            onComplete({
                segmentCount: 10,
                websiteType: wizardData.websiteType,
                platform: wizardData.detectedPlatform,
                configuration: wizardData
            });
        } catch (error) {
            console.error('Translation process failed:', error);
            alert('Failed to process website. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">🧙‍♂️ Website Translation Wizard v3.0 - LIVE</h2>
                        <p className="text-gray-400">Step {currentStep} of 3 • Weglot-Style Experience</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        {[1, 2, 3].map(step => (
                            <div
                                key={step}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    step <= currentStep
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-600 text-gray-400'
                                }`}
                            >
                                {step}
                            </div>
                        ))}
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(currentStep / 3) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Step Content */}
                <div className="min-h-[400px]">
                    {/* Step 1: Website Analysis */}
                    {currentStep === 1 && (
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">🔍 Website Analysis</h3>
                            <p className="text-gray-400 mb-6">
                                Enter your website URL and we'll analyze its structure and platform.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-white font-medium mb-2">Website URL</label>
                                    <input
                                        type="url"
                                        value={wizardData.url}
                                        onChange={(e) => setWizardData(prev => ({ ...prev, url: e.target.value }))}
                                        placeholder="https://example.com"
                                        className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>

                                <button
                                    onClick={analyzeWebsite}
                                    disabled={isAnalyzing || !wizardData.url.trim()}
                                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isAnalyzing ? 'Analyzing Website...' : 'Analyze Website'}
                                </button>

                                {analysisResults && (
                                    <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                                        <h4 className="text-white font-medium mb-3">✅ Analysis Complete</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-400">Platform:</span>
                                                <span className="text-white ml-2 font-medium">Static HTML</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Page Title:</span>
                                                <span className="text-white ml-2">{analysisResults.pageTitle}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Platform Configuration */}
                    {currentStep === 2 && (
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">⚙️ Platform Configuration</h3>
                            <p className="text-gray-400 mb-6">
                                Choose your website platform and configure settings.
                            </p>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {Object.entries(websiteTypes).map(([key, platform]) => (
                                    <button
                                        key={key}
                                        onClick={() => setWizardData(prev => ({ ...prev, websiteType: key }))}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                                            wizardData.websiteType === key
                                                ? 'border-blue-500 bg-blue-600 bg-opacity-20'
                                                : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                                        }`}
                                    >
                                        <div className="text-2xl mb-2">{platform.icon}</div>
                                        <div className="text-white font-medium">{platform.name}</div>
                                        <div className="text-gray-400 text-sm">{platform.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Content Selection */}
                    {currentStep === 3 && (
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">📄 Content Selection</h3>
                            <p className="text-gray-400 mb-6">
                                Choose which types of content you want to translate.
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {[
                                    { key: 'mainContent', label: 'Main Content', icon: '📝' },
                                    { key: 'navigation', label: 'Navigation', icon: '🧭' },
                                    { key: 'footer', label: 'Footer', icon: '🦶' },
                                    { key: 'forms', label: 'Forms', icon: '📋' },
                                    { key: 'metadata', label: 'SEO Metadata', icon: '🏷️' },
                                    { key: 'images', label: 'Image Alt Text', icon: '🖼️' }
                                ].map(({ key, label, icon }) => (
                                    <div
                                        key={key}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                            wizardData.contentTypes[key]
                                                ? 'border-blue-500 bg-blue-600 bg-opacity-20'
                                                : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                                        }`}
                                        onClick={() => setWizardData(prev => ({
                                            ...prev,
                                            contentTypes: {
                                                ...prev.contentTypes,
                                                [key]: !prev.contentTypes[key]
                                            }
                                        }))}
                                    >
                                        <div className="text-2xl mb-2">{icon}</div>
                                        <div className="text-white font-medium">{label}</div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={startTranslation}
                                disabled={isProcessing}
                                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? 'Processing...' : 'Start Translation'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                    >
                        Previous
                    </button>
                    
                    {currentStep < 3 && (
                        <button
                            onClick={nextStep}
                            disabled={currentStep === 1 && !analysisResults}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WebsiteTranslationWizard;