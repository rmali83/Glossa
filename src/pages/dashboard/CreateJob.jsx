import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import SimpleUploadModal from '../../components/SimpleUploadModal';
import simpleUploadManager from '../../services/simpleUploadManager';

const CreateJob = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    source_language: 'English',
    target_language: 'Spanish',
    pay_rate_per_word: 0.05,
    deadline: '',
    job_description: '',
    specialization: 'General',
    difficulty_level: 'standard'
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [totalWords, setTotalWords] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [projectId, setProjectId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateDraft = async () => {
    try {
      // Create draft project first
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          name: formData.name || 'Untitled Job',
          source_language: formData.source_language,
          target_language: formData.target_language,
          pay_rate_per_word: parseFloat(formData.pay_rate_per_word),
          deadline: formData.deadline || null,
          job_description: formData.job_description,
          specialization: formData.specialization,
          difficulty_level: formData.difficulty_level,
          job_status: 'draft',
          status: 'draft',
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setProjectId(project.id);
      alert('Draft project created! Now upload files.');
    } catch (error) {
      console.error('Error creating draft:', error);
      alert('Failed to create draft: ' + error.message);
    }
  };

  const handleUploadComplete = async () => {
    setShowUploadModal(false);
    
    // Fetch uploaded files
    const result = await simpleUploadManager.getProjectFiles(projectId);
    if (result.success) {
      setUploadedFiles(result.files);
      
      // Calculate total words from segments
      const { data: segments } = await supabase
        .from('segments')
        .select('source_text')
        .eq('project_id', projectId);
      
      if (segments) {
        const words = segments.reduce((sum, seg) => {
          return sum + seg.source_text.split(/\s+/).filter(w => w.length > 0).length;
        }, 0);
        setTotalWords(words);
      }
    }
  };

  const handlePostJob = async () => {
    if (!projectId) {
      alert('Please create a draft project first');
      return;
    }

    if (uploadedFiles.length === 0) {
      alert('Please upload at least one file');
      return;
    }

    setCreating(true);

    try {
      const totalPayment = totalWords * parseFloat(formData.pay_rate_per_word);

      // Update project to posted status
      const { error } = await supabase
        .from('projects')
        .update({
          total_words: totalWords,
          total_payment: totalPayment,
          job_status: 'posted',
          status: 'pending'
        })
        .eq('id', projectId);

      if (error) throw error;

      alert('Job posted successfully!');
      navigate('/dashboard/admin');
    } catch (error) {
      console.error('Error posting job:', error);
      alert('Failed to post job: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Create Translation Job
          </h1>
          <button
            onClick={() => navigate('/dashboard/admin')}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            ← Back
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 space-y-6">
          {/* Job Details Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="e.g., Website Translation - English to Spanish"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Source Language *
                </label>
                <select
                  name="source_language"
                  value={formData.source_language}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Chinese</option>
                  <option>Japanese</option>
                  <option>Arabic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Target Language *
                </label>
                <select
                  name="target_language"
                  value={formData.target_language}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option>Spanish</option>
                  <option>English</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Chinese</option>
                  <option>Japanese</option>
                  <option>Arabic</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Pay Rate (per word) *
                </label>
                <input
                  type="number"
                  name="pay_rate_per_word"
                  value={formData.pay_rate_per_word}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder="0.05"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Deadline *
                </label>
                <input
                  type="datetime-local"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Specialization
                </label>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option>General</option>
                  <option>Legal</option>
                  <option>Medical</option>
                  <option>Technical</option>
                  <option>Marketing</option>
                  <option>Literary</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Difficulty Level
                </label>
                <select
                  name="difficulty_level"
                  value={formData.difficulty_level}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="easy">Easy</option>
                  <option value="standard">Standard</option>
                  <option value="complex">Complex</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Job Description / Instructions
              </label>
              <textarea
                name="job_description"
                value={formData.job_description}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none"
                placeholder="Provide any special instructions or context for translators..."
              />
            </div>
          </div>

          {/* Create Draft Button */}
          {!projectId && (
            <button
              onClick={handleCreateDraft}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
            >
              Create Draft & Upload Files
            </button>
          )}

          {/* File Upload Section */}
          {projectId && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Upload Files
                </h3>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all"
                >
                  + Upload Files
                </button>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {uploadedFiles.length} file(s) uploaded • {totalWords.toLocaleString()} words
                  </p>
                  <div className="space-y-2">
                    {uploadedFiles.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <span className="text-sm text-slate-700 dark:text-slate-300">{file.filename}</span>
                        <span className="text-xs text-slate-500">{(file.file_size / 1024).toFixed(2)} KB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              {totalWords > 0 && (
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Words:</span>
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">{totalWords.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rate per Word:</span>
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">${formData.pay_rate_per_word}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-primary-200 dark:border-primary-800">
                    <span className="text-base font-bold text-slate-900 dark:text-slate-100">Total Payment:</span>
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      ${(totalWords * parseFloat(formData.pay_rate_per_word)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Post Job Button */}
              <button
                onClick={handlePostJob}
                disabled={creating || uploadedFiles.length === 0}
                className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30"
              >
                {creating ? 'Posting Job...' : 'Post Job'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && projectId && (
        <SimpleUploadModal
          projectId={projectId}
          projectName={formData.name}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
};

export default CreateJob;
