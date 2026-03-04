import React, { useState } from 'react';
import { useTourProject } from './hooks/useTourProject';
import PanoramaList from './components/PanoramaList';
import PanoramaViewer from './components/PanoramaViewer';
import HotspotEditor from './components/HotspotEditor';
import Toolbar from './components/Toolbar';

function App() {
  const {
    project,
    selectedPanorama,
    isPreviewMode,
    loadFolder,
    selectPanorama,
    addHotspot,
    removeHotspot,
    getPanoramaHotspots,
    saveProject,
    loadProject,
    exportTour,
    togglePreviewMode
  } = useTourProject();

  const [showTargetSelector, setShowTargetSelector] = useState(false);
  const [pendingHotspotPosition, setPendingHotspotPosition] = useState(null);
  const [hoveredHotspot, setHoveredHotspot] = useState(null);

  const handleLoadFolder = async () => {
    const folderPath = await window.electronAPI.openFolder();
    if (folderPath) {
      const result = await loadFolder(folderPath);
      if (!result.success) {
        alert('Error loading folder: ' + result.error);
      }
    }
  };

  const handleAddHotspot = (position) => {
    setPendingHotspotPosition(position);
    setShowTargetSelector(true);
  };

  const confirmHotspot = (targetPanoramaId, label) => {
    if (selectedPanorama && pendingHotspotPosition) {
      addHotspot(selectedPanorama.id, pendingHotspotPosition, targetPanoramaId, label);
    }
    setShowTargetSelector(false);
    setPendingHotspotPosition(null);
  };

  const handleNavigate = (targetPanoramaId) => {
    const target = project.panoramas.find(p => p.id === targetPanoramaId);
    if (target) {
      selectPanorama(target);
    }
  };

  const updateProjectName = (name) => {
    // Note: In a real implementation, you'd add setProjectName to the hook
    console.log('Project name:', name);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <Toolbar
        projectName={project.name}
        onProjectNameChange={updateProjectName}
        isPreviewMode={isPreviewMode}
        onTogglePreview={togglePreviewMode}
        onSave={saveProject}
        onLoad={loadProject}
        onExport={exportTour}
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
            onAddHotspot={handleAddHotspot}
            onNavigate={handleNavigate}
            onHotspotHover={setHoveredHotspot}
          />

          {hoveredHotspot && isPreviewMode && (
            <div className="absolute bottom-4 left-4 px-3 py-2 bg-gray-900 bg-opacity-90 text-white text-sm rounded-lg">
              <div className="font-medium">{hoveredHotspot.label || 'Go to'}</div>
              <div className="text-gray-400 text-xs">
                Click to navigate
              </div>
            </div>
          )}
        </div>

        <HotspotEditor
          hotspots={project.hotspots}
          panoramas={project.panoramas}
          currentPanorama={selectedPanorama}
          onRemoveHotspot={removeHotspot}
        />
      </div>

      {showTargetSelector && (
        <TargetSelectorModal
          panoramas={project.panoramas}
          currentPanorama={selectedPanorama}
          onConfirm={confirmHotspot}
          onCancel={() => {
            setShowTargetSelector(false);
            setPendingHotspotPosition(null);
          }}
        />
      )}
    </div>
  );
}

function TargetSelectorModal({ panoramas, currentPanorama, onConfirm, onCancel }) {
  const [selectedTarget, setSelectedTarget] = useState('');
  const [label, setLabel] = useState('');

  const availablePanoramas = panoramas.filter(p => p.id !== currentPanorama?.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold text-white mb-4">
          Configure Hotspot
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Target Panorama *
            </label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
            >
              <option value="">Select destination...</option>
              {availablePanoramas.map((pano) => (
                <option key={pano.id} value={pano.id}>
                  {pano.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Label (optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Go to Kitchen"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedTarget, label)}
            disabled={!selectedTarget}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium"
          >
            Create Hotspot
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;