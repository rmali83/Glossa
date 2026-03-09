import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import SimpleUploadModal from '../../components/SimpleUploadModal';
import simpleUploadManager from '../../services/simpleUploadManager';
import LANGUAGES from '../../data/languages';

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
    difficulty_level: 'standard',
    translator_id: '',
    reviewer_id: ''
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [totalWords, setTotalWords] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [translators, setTranslators] = useState([]);
  const [reviewers, setReviewers] = useState([]);

  // Fetch translators and reviewers
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, user_type, email');
        
        if (profiles) {
          setTranslators(profiles.filter(p => 
            p.user_type === 'Translator' || 
            p.user_type === 'Freelance Translator'
          ));
          setReviewers(profiles.filter(p => p.user_type === 'Reviewer'));
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

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

    if (!formData.translator_id) {
      alert('Please assign a translator');
      return;
    }

    setCreating(true);

    try {
      const totalPayment = totalWords * parseFloat(formData.pay_rate_per_word);

      // Update project to posted status with translator and reviewer
      const { error } = await supabase
        .from('projects')
        .update({
          total_words: totalWords,
          total_payment: totalPayment,
          job_status: 'posted',
          status: 'pending',
          translator_id: formData.translator_id,
          reviewer_id: formData.reviewer_id || null
        })
        .eq('id', projectId);

      if (error) throw error;

      // Send email notification to translator
      const translator = translators.find(t => t.id === formData.translator_id);
      if (translator && translator.email) {
        try {
          // Create notification in database
          await supabase.from('notifications').insert({
            user_id: formData.translator_id,
            title: 'New Translation Job Assigned',
            message: `You have been assigned to "${formData.name}". ${totalWords} words, ${formData.source_language} → ${formData.target_language}. Payment: $${totalPayment.toFixed(2)}`,
            type: 'job_assigned',
            link: `/dashboard/cat/${projectId}`
          }).select().single().then(({ data: notificationData, error: notifError }) => {
            if (notifError) {
              console.error('Error creating notification:', notifError);
            } else if (notificationData) {
              // Send email via Edge Function
              supabase.functions.invoke('send-email', {
                body: { notificationId: notificationData.id }
              }).then(({ data: emailData, error: emailError }) => {
                if (emailError) {
                  console.error('Error sending email:', emailError);
                } else {
                  console.log('Email sent successfully:', emailData);
                }
              }).catch(emailError => {
                console.error('Failed to send email:', emailError);
              });
            }
          });
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }
      }

      // Send notification to reviewer if assigned
      if (formData.reviewer_id) {
        const reviewer = reviewers.find(r => r.id === formData.reviewer_id);
        if (reviewer) {
          await supabase.from('notifications').insert({
            user_id: formData.reviewer_id,
            title: 'New Review Job Assigned',
            message: `You have been assigned to review "${formData.name}". ${totalWords} words, ${formData.source_language} → ${formData.target_language}.`,
            type: 'review_assigned',
            link: `/dashboard/cat/${projectId}`
          });
        }
      }

      alert('Job posted successfully! Translator has been notified.');
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
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
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
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
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

            {/* Translator and Reviewer Assignment */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Assign Translator *
                </label>
                <select
                  name="translator_id"
                  value={formData.translator_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select Translator</option>
                  {translators.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Translator will receive email notification
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Assign Reviewer (Optional)
                </label>
                <select
                  name="reviewer_id"
                  value={formData.reviewer_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select Reviewer</option>
                  {reviewers.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.full_name} ({r.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Reviewer will be notified after translation
                </p>
              </div>
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
