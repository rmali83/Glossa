import React, { useState } from 'react';
import simpleUploadManager from '../services/simpleUploadManager';

const SimpleUploadModal = ({ projectId, projectName, onClose, onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files || []);
    setSelectedFiles(files);
  };

    const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }

    setUploading(true);
    setUploadProgress([]);

    const results = await simpleUploadManager.uploadFiles(
      selectedFiles,
      projectId,
      (progress) => {
        setUploadProgress(prev => {
          const newProgress = [...prev];
          newProgress[progress.fileIndex] = progress;
          return newProgress;
        });
      }
    );

    setUploading(false);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (successCount > 0) {
      // Call onUploadComplete to refresh segments
      if (onUploadComplete) onUploadComplete();
      
      if (failCount === 0) {
        // All succeeded - modal will close via onUploadComplete
        console.log(`Successfully uploaded ${successCount} file(s)!`);
      } else {
        alert(`Upload completed: ${successCount} succeeded, ${failCount} failed`);
      }
    } else {
      alert(`All uploads failed`);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Upload Files
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Project: {projectName}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-primary-400'
            }`}
          >
            <svg className="w-12 h-12 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Supported: 80+ formats including Documents (TXT, DOCX, PDF, ODT, RTF, MD), Spreadsheets (XLSX, XLS, CSV, ODS, TSV), Presentations (PPTX, ODP), CAT Tools (XLIFF, SDLXLIFF, TTX, ITD, TMX, MXF, MQXLIFF, TXLF, IDML), Subtitles (SRT, VTT, SUB, SSA, ASS, SBV, TTML), Localization (PO, PROPERTIES, RESX, STRINGS, YAML, INI, JSON, ARB, PLIST, RC, RESW, RESJSON, QT_TS), Programming (JS, TS, JSX, TSX, VUE, PHP, PY, RB, GO, JAVA, CS, CPP, SWIFT, KT, RS), Templates (EJS, HBS, PUG, TWIG, LIQUID), Markup (HTML, XML, RST, ADOC, TEX, ORG, WIKI, TEXTILE, BBCODE, CREOLE), Technical Docs (DITA, DOCBOOK), E-books (EPUB), Apple iWork (PAGES, NUMBERS, KEY), Scripts (SH, BAT, PS1), Data (SQL, GRAPHQL), and more (max 50 MB)
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
              accept=".txt,.json,.csv,.docx,.pdf,.xlsx,.xls,.pptx,.odt,.rtf,.html,.htm,.xml,.xliff,.xlf,.sdlxliff,.ttx,.itd,.sdlppx,.sdlrpx,.tmx,.mxf,.srt,.vtt,.sub,.ssa,.ass,.sbv,.ttml,.dfxp,.po,.properties,.resx,.strings,.yaml,.yml,.ini,.md,.markdown,.js,.jsx,.ts,.tsx,.vue,.php,.toml,.arb,.py,.python,.rb,.ruby,.go,.java,.cs,.csharp,.cpp,.cc,.cxx,.swift,.kt,.kotlin,.rs,.rust,.rst,.adoc,.asciidoc,.tex,.latex,.org,.conf,.config,.env,.editorconfig,.json5,.hjson,.rc,.resw,.resjson,.plist,.ejs,.hbs,.handlebars,.pug,.jade,.twig,.liquid,.sql,.graphql,.gql,.mqxliff,.mqxlz,.txlf,.idml,.epub,.pages,.numbers,.key,.wiki,.mediawiki,.textile,.bbcode,.creole,.dita,.docbook,.tsv,.ods,.odp,.odf,.stringsdict,.log,.bat,.cmd,.sh,.bash,.zsh,.ps1,.psm1"
            />
            <label
              htmlFor="file-input"
              className="inline-block px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold cursor-pointer transition-colors"
            >
              Select Files
            </label>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Selected Files ({selectedFiles.length})
              </h3>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    {!uploading && (
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-2 p-1 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Upload Progress
              </h3>
              <div className="space-y-2">
                {uploadProgress.map((progress, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-300 truncate">
                        {progress.filename}
                      </span>
                      <span className={`font-semibold ${
                        progress.status === 'completed' ? 'text-green-600' :
                        progress.status === 'failed' ? 'text-red-600' :
                        progress.status === 'parsing' ? 'text-blue-600' :
                        progress.status === 'segmenting' ? 'text-purple-600' :
                        'text-primary-600'
                      }`}>
                        {progress.status === 'completed' ? '✓ Done' :
                         progress.status === 'failed' ? '✗ Failed' :
                         progress.status === 'parsing' ? '📄 Parsing...' :
                         progress.status === 'segmenting' ? '✂️ Segmenting...' :
                         progress.status === 'uploading' ? '⬆️ Uploading...' :
                         `${progress.percentage}%`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          progress.status === 'completed' ? 'bg-green-600' :
                          progress.status === 'failed' ? 'bg-red-600' :
                          'bg-primary-600'
                        }`}
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    {progress.error && (
                      <p className="text-xs text-red-600">{progress.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-6 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Cancel'}
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
            className="px-8 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleUploadModal;
