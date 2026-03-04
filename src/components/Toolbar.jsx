import React, { useState } from 'react';

function Toolbar({ 
  isPreviewMode, 
  onTogglePreview,
  onSave,
  onLoad,
  onExport,
  projectName,
  onProjectNameChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}) {
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleSave = async () => {
    const result = await onSave();
    if (result.success) {
      setShowSaveConfirm(true);
      setTimeout(() => setShowSaveConfirm(false), 2000);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    const result = await onExport();
    setIsExporting(false);
    if (result.success) {
      setShowExportConfirm(true);
      setTimeout(() => setShowExportConfirm(false), 3000);
    }
  };

  return (
    <div className="h-16 bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6">
      {/* Left: Project name */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
            </svg>
          </div>
          
          <div>
            <input
              type="text"
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-blue-500 focus:outline-none text-lg font-semibold text-zinc-100 w-64 transition-colors"
              placeholder="My Virtual Tour"
            />
            <div className="text-xs text-zinc-500">
              Virtual Tour Creator
            </div>
          </div>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 ml-4 pl-4 border-l border-white/10">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`p-2 rounded-lg transition-colors ${
              canUndo 
                ? 'hover:bg-white/10 text-zinc-400 hover:text-zinc-200' 
                : 'text-zinc-600 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className={`p-2 rounded-lg transition-colors ${
              canRedo 
                ? 'hover:bg-white/10 text-zinc-400 hover:text-zinc-200' 
                : 'text-zinc-600 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onLoad}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Load
        </button>

        <button
          onClick={handleSave}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Save
        </button>

        <div className="w-px h-6 bg-white/10 mx-2"></div>

        <button
          onClick={onTogglePreview}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isPreviewMode
              ? 'bg-green-500/20 text-green-400 border border-green-500/50 shadow-lg shadow-green-500/10'
              : 'btn-secondary'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {isPreviewMode ? 'Preview On' : 'Preview'}
        </button>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Exporting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Export Tour
            </>
          )}
        </button>
      </div>

      {/* Notifications */}
      {showSaveConfirm && (
        <div className="fixed top-20 right-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/50 text-green-400 shadow-lg animate-slide-in"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Project saved successfully
        </div>
      )}

      {showExportConfirm && (
        <div className="fixed top-20 right-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/50 text-blue-400 shadow-lg animate-slide-in"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Tour exported successfully
        </div>
      )}
    </div>
  );
}

export default Toolbar;