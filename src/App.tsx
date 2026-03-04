import React, { useState, useCallback } from 'react';
import { useTourProject } from './hooks/useTourProject';
import { MetaEditor } from './components/editor/MetaEditor';
import { ExportDialog } from './components/editor/ExportDialog';
import type { QualityMode } from './types';

function App() {
  const {
    config,
    selectedScene,
    selectedSceneId,
    isPreviewMode,
    exportProgress,
    canUndo,
    canRedo,
    
    addScenes,
    updateMeta,
    selectScene,
    setIsPreviewMode,
    undo,
    redo,
    saveProject,
    loadProject,
    exportTour
  } = useTourProject();

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [_showShortcuts, _setShowShortcuts] = useState(false);

  // Обработка загрузки файлов
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => 
      f.type.startsWith('image/') || f.name.match(/\.(jpg|jpeg|png)$/i)
    );
    if (files.length > 0) {
      addScenes(files);
    }
  }, [addScenes]);

  const handleExport = async (quality: QualityMode) => {
    const result = await exportTour(quality);
    if (result.success) {
      setShowExportDialog(false);
      // Показать уведомление об успехе
    }
  };

  return (
    <div 
      className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
    >
      {/* Header */}
      <header className="h-14 bg-zinc-900/80 backdrop-blur border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
          </div>
          <div>
            <input
              type="text"
              value={config.meta.title || 'Новый проект'}
              onChange={(e) => updateMeta({ title: e.target.value })}
              className="bg-transparent text-lg font-medium text-white focus:outline-none border-b border-transparent focus:border-blue-500/50 w-64"
              placeholder="Название проекта"
            />
            <p className="text-xs text-zinc-500">{config.scenes.length} сцен | {config.scenes.reduce((acc, s) => acc + s.hotspots.length, 0)} точек перехода</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Отменить (Ctrl+Z)"
          >
            ↩️
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Повторить (Ctrl+Y)"
          >
            ↪️
          </button>
          
          <div className="w-px h-6 bg-white/10 mx-2"></div>
          
          <button
            onClick={() => loadProject()}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
          >
            Открыть
          </button>
          
          <button
            onClick={() => saveProject()}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
          >
            Сохранить
          </button>
          
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              isPreviewMode 
                ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            {isPreviewMode ? '✓ Просмотр' : '👁 Просмотр'}
          </button>
          
          <button
            onClick={() => setShowExportDialog(true)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            🚀 Экспорт
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Editor */}
        <div className="w-96 bg-zinc-900/50 border-r border-white/10 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <MetaEditor meta={config.meta} onUpdate={updateMeta} />
            
            {/* Scene List */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">
                Сцены ({config.scenes.length})
              </h3>
              
              {config.scenes.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-lg">
                  <p className="text-zinc-500 text-sm">Перетащите панорамы сюда</p>
                  <p className="text-zinc-600 text-xs mt-1">JPG, PNG до 16MB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {config.scenes.map((scene, index) => (
                    <button
                      key={scene.id}
                      onClick={() => selectScene(scene.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        selectedSceneId === scene.id
                          ? 'bg-blue-500/10 border-blue-500/50'
                          : 'bg-white/5 border-transparent hover:border-white/10'
                      }`}
                    >
                      <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm text-zinc-200 truncate">{scene.name}</p>
                        <p className="text-xs text-zinc-500">{scene.hotspots.length} точек</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center - Viewer */}
        <div className="flex-1 bg-black relative">
          {selectedScene ? (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
              <p>Viewer (реализовать Three.js)</p>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
              <div className="w-24 h-24 mb-4 border-2 border-dashed border-zinc-700 rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-lg">Выберите сцену для редактирования</p>
              <p className="text-sm mt-2">или перетащите панорамы в левую панель</p>
            </div>
          )}
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        progress={exportProgress}
      />
    </div>
  );
}

export default App;
