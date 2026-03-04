import React, { useState, useCallback } from 'react';
import { useTourProject } from './hooks/useTourProject';
import PanoramaList from './components/PanoramaList';
import PanoramaViewer from './components/PanoramaViewer';
import HotspotEditor from './components/HotspotEditor';
import Toolbar from './components/Toolbar';

// Hotspot type definitions
const HOTSPOT_TYPES = [
  {
    id: 'transition',
    label: 'Transition',
    icon: () => (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    ),
    activeClass: 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
  },
  {
    id: 'info',
    label: 'Info',
    icon: () => (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    activeClass: 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
  }
];

function App() {
  const {
    project,
    selectedPanorama,
    isPreviewMode,
    selectedHotspotType,
    canUndo,
    canRedo,
    loadFolder,
    selectPanorama,
    updateStartPosition,
    addHotspot,
    removeHotspot,
    updateHotspot,
    getPanoramaHotspots,
    undo,
    redo,
    saveProject,
    loadProject,
    exportTour,
    togglePreviewMode,
    updateProjectName,
    setSelectedHotspotType
  } = useTourProject();

  const [showTargetSelector, setShowTargetSelector] = useState(false);
  const [pendingHotspot, setPendingHotspot] = useState(null);
  const [hoveredHotspot, setHoveredHotspot] = useState(null);
  const [notification, setNotification] = useState(null);

  // Show notification helper
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Handle load folder
  const handleLoadFolder = useCallback(async (folderPath) => {
    const result = await loadFolder(folderPath);
    if (result.success) {
      showNotification(`Loaded ${result.count} panoramas`);
    } else {
      showNotification(result.error, 'error');
    }
    return result;
  }, [loadFolder, showNotification]);

  // Handle add hotspot
  const handleAddHotspot = useCallback((type, position) => {
    if (type === 'transition') {
      // For transitions, we need to select target
      setPendingHotspot({ type, position });
      setShowTargetSelector(true);
    } else {
      // For info hotspots, add immediately
      addHotspot(type, position, null, 'Info Point');
      showNotification('Info point added');
    }
  }, [addHotspot, showNotification]);

  // Confirm transition hotspot
  const confirmTransitionHotspot = useCallback((targetPanoramaId, label) => {
    if (pendingHotspot) {
      addHotspot(
        pendingHotspot.type,
        pendingHotspot.position,
        targetPanoramaId,
        label
      );
      showNotification('Transition hotspot added');
    }
    setShowTargetSelector(false);
    setPendingHotspot(null);
  }, [pendingHotspot, addHotspot, showNotification]);

  // Handle navigate
  const handleNavigate = useCallback((targetPanoramaId) => {
    const target = project.panoramas.find(p => p.id === targetPanoramaId);
    if (target) {
      selectPanorama(target);
    }
  }, [project.panoramas, selectPanorama]);

  // Handle save
  const handleSave = useCallback(async () => {
    const result = await saveProject();
    if (result.success) {
      showNotification('Project saved successfully');
    } else if (!result.cancelled) {
      showNotification(result.error, 'error');
    }
    return result;
  }, [saveProject, showNotification]);

  // Handle export
  const handleExport = useCallback(async () => {
    const result = await exportTour();
    if (result.success) {
      showNotification(`Tour exported to: ${result.path}`);
    } else if (!result.cancelled) {
      showNotification(result.error, 'error');
    }
    return result;
  }, [exportTour, showNotification]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'o':
            e.preventDefault();
            loadProject();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, handleSave, loadProject]);

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      <Toolbar
        projectName={project.name}
        onProjectNameChange={updateProjectName}
        isPreviewMode={isPreviewMode}
        onTogglePreview={togglePreviewMode}
        onSave={handleSave}
        onLoad={loadProject}
        onExport={handleExport}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />

      <div className="flex flex-1 overflow-hidden">
        <PanoramaList
          panoramas={project.panoramas}
          selectedPanorama={selectedPanorama}
          onSelect={selectPanorama}
          onLoadFolder={handleLoadFolder}
        />

        <div className="flex-1 relative">
          <PanoramaViewer
            panorama={selectedPanorama}
            hotspots={getPanoramaHotspots(selectedPanorama?.id)}
            isPreviewMode={isPreviewMode}
            selectedHotspotType={selectedHotspotType}
            onAddHotspot={handleAddHotspot}
            onNavigate={handleNavigate}
            onHotspotHover={setHoveredHotspot}
            onUpdateStartPosition={updateStartPosition}
          />

          {hoveredHotspot && isPreviewMode && hoveredHotspot.label && (
            <div className="absolute bottom-6 left-6 glass-panel px-4 py-3">
              <div className="text-sm font-medium text-zinc-200">{hoveredHotspot.label}</div>
              <div className="text-xs text-zinc-500 mt-0.5">
                Click to {hoveredHotspot.type === 'transition' ? 'navigate' : 'view info'}
              </div>
            </div>
          )}
        </div>

        <HotspotEditor
          hotspots={project.hotspots}
          panoramas={project.panoramas}
          currentPanorama={selectedPanorama}
          onRemoveHotspot={removeHotspot}
          onUpdateHotspot={updateHotspot}
          hotspotTypes={HOTSPOT_TYPES}
          selectedHotspotType={selectedHotspotType}
          onSelectHotspotType={setSelectedHotspotType}
        />
      </div>

      {/* Target Selector Modal */}
      {showTargetSelector && (
        <TargetSelectorModal
          panoramas={project.panoramas}
          currentPanorama={selectedPanorama}
          onConfirm={confirmTransitionHotspot}
          onCancel={() => {
            setShowTargetSelector(false);
            setPendingHotspot(null);
          }}
        />
      )}

      {/* Notification */}
      {notification && (
        <div 
          className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg animate-fade-in z-50 ${
            notification.type === 'error' 
              ? 'bg-red-500/10 border border-red-500/50 text-red-400' 
              : 'bg-green-500/10 border border-green-500/50 text-green-400'
          }`}
        >
          {notification.type === 'error' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {notification.message}
        </div>
      )}
    </div>
  );
}

// Target Selector Modal Component
function TargetSelectorModal({ panoramas, currentPanorama, onConfirm, onCancel }) {
  const [selectedTarget, setSelectedTarget] = useState('');
  const [label, setLabel] = useState('');
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(true);
  const [thumbnails, setThumbnails] = useState({});

  const availablePanoramas = panoramas.filter(p => p.id !== currentPanorama?.id);

  // Load thumbnails
  React.useEffect(() => {
    const loadThumbnails = async () => {
      const thumbs = {};
      for (const pano of availablePanoramas) {
        try {
          const result = await window.electronAPI.readFile(pano.path);
          if (result.success) {
            thumbs[pano.id] = `data:image/jpeg;base64,${result.data}`;
          }
        } catch (err) {
          console.error('Failed to load thumbnail:', err);
        }
      }
      setThumbnails(thumbs);
      setIsLoadingThumbnails(false);
    };
    loadThumbnails();
  }, [availablePanoramas]);

  // Close on escape
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-[500px] max-w-[90vw] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Create Transition
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Select Target Panorama *
            </label>
            
            {isLoadingThumbnails ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-zinc-600 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {availablePanoramas.map((pano) => (
                  <button
                    key={pano.id}
                    onClick={() => setSelectedTarget(pano.id)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selectedTarget === pano.id
                        ? 'border-blue-500 ring-2 ring-blue-500/30'
                        : 'border-transparent hover:border-white/20'
                    }`}
                  >
                    {thumbnails[pano.id] ? (
                      <img
                        src={thumbnails[pano.id]}
                        alt={pano.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center"
                      >
                        <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent"
                    >
                      <div className="text-xs text-white truncate">
                        {pano.name.replace(/\.[^/.]+$/, '')}
                      </div>
                    </div>
                    
                    {selectedTarget === pano.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Label (optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Go to Kitchen"
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedTarget, label)}
            disabled={!selectedTarget}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:text-zinc-500 text-white rounded-xl font-medium transition-all disabled:cursor-not-allowed"
          >
            Create Hotspot
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;