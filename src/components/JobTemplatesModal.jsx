import React from 'react';
import { useNavigate } from 'react-router-dom';

const JobTemplatesModal = ({ onClose }) => {
  const navigate = useNavigate();

  const templates = [
    {
      id: 'website',
      name: 'Website Translation',
      icon: '🌐',
      description: 'Translate entire websites including SEO, meta tags, and all content',
      color: 'purple',
      route: '/dashboard/admin/create-job?template=website'
    },
    {
      id: 'legal',
      name: 'Legal Translation',
      icon: '⚖️',
      description: 'Translate legal documents with specialized terminology',
      color: 'blue',
      route: '/dashboard/admin/create-job?template=legal'
    },
    {
      id: 'technical',
      name: 'Technical Translation',
      icon: '⚙️',
      description: 'Translate technical documentation, manuals, and specifications',
      color: 'green',
      route: '/dashboard/admin/create-job?template=technical'
    },
    {
      id: 'marketing',
      name: 'Marketing Translation',
      icon: '📢',
      description: 'Translate marketing materials, ads, and promotional content',
      color: 'orange',
      route: '/dashboard/admin/create-job?template=marketing'
    },
    {
      id: 'medical',
      name: 'Medical Translation',
      icon: '🏥',
      description: 'Translate medical documents, reports, and pharmaceutical content',
      color: 'red',
      route: '/dashboard/admin/create-job?template=medical'
    },
    {
      id: 'ecommerce',
      name: 'E-commerce Translation',
      icon: '🛒',
      description: 'Translate product descriptions, categories, and store content',
      color: 'pink',
      route: '/dashboard/admin/create-job?template=ecommerce'
    }
  ];

  const handleTemplateSelect = (template) => {
    navigate(template.route);
    onClose();
  };

  const getColorClasses = (color) => {
    const colors = {
      purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30',
      blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30',
      green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30',
      orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30',
      red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30',
      pink: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 hover:bg-pink-100 dark:hover:bg-pink-900/30'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              📋 Job Templates
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Choose a template to quickly create specialized translation jobs
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`text-left p-6 border-2 rounded-xl transition-all ${getColorClasses(template.color)}`}
              >
                <div className="flex items-start space-x-4">
                  <div className="text-4xl">{template.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                      {template.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {template.description}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          {/* Custom Template */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                navigate('/dashboard/admin/create-job');
                onClose();
              }}
              className="w-full p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-slate-600 dark:text-slate-400 font-semibold">
                  Create Custom Job (No Template)
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobTemplatesModal;
