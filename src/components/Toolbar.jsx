import React, { useState } from 'react';

function Toolbar({ 
  isPreviewMode, 
  onTogglePreview,
  onSave,
  onLoad,
  onExport,
  projectName,
  onProjectNameChange 
}) {
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);

  const handleSave = async () => {
    const result = await onSave();
    if (result.success) {
      setShowSaveConfirm(true);
      setTimeout(() => setShowSaveConfirm(false), 2000);
    }
  };

  const handleExport = async () => {
    const result = await onExport();
    if (result.success) {
      setShowExportConfirm(true);
      setTimeout(() => setShowExportConfirm(false), 3000);
    }
  };

  return (
    <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Название тура:</span>
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm w-48 focus:outline-none focus:border-blue-500"
            placeholder="Мой виртуальный тур"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onLoad}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
        >
          📂 Открыть
        </button>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
        >
          💾 Сохранить
        </button>

        <div className="w-px h-6 bg-gray-700 mx-2"></div>

        <button
          onClick={onTogglePreview}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isPreviewMode
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        >
          {isPreviewMode ? '✓ Просмотр' : '👁️ Просмотр'}
        </button>

        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          🚀 Экспорт
        </button>
      </div>

      {showSaveConfirm && (
        <div className="absolute top-16 right-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm shadow-lg">
          ✅ Проект сохранён!
        </div>
      )}

      {showExportConfirm && (
        <div className="absolute top-16 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm shadow-lg">
          ✅ Тур экспортирован!
        </div>
      )}
    </div>
  );
}

export default Toolbar;