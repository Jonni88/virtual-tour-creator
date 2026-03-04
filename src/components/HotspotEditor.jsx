import React, { useState } from 'react';

function HotspotEditor({ hotspots, panoramas, currentPanorama, onRemoveHotspot }) {
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  const currentHotspots = hotspots.filter(h => h.panoramaId === currentPanorama?.id);

  const getTargetPanoramaName = (targetId) => {
    const target = panoramas.find(p => p.id === targetId);
    return target?.name || 'Unknown';
  };

  const formatPosition = (pos) => {
    return `x:${pos.x.toFixed(1)}, y:${pos.y.toFixed(1)}, z:${pos.z.toFixed(1)}`;
  };

  return (
    <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">Hotspots</h2>
        <p className="text-sm text-gray-500 mt-1">
          Click "Add Hotspot" then click on panorama to place transition points.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {currentHotspots.length === 0 ? (
          <div className="text-gray-500 text-sm text-center p-4">
            No hotspots on this panorama.
            <br />
            Add hotspots to create navigation.
          </div>
        ) : (
          <div className="space-y-2">
            {currentHotspots.map((hotspot) => (
              <div
                key={hotspot.id}
                onClick={() => setSelectedHotspot(hotspot.id)}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  selectedHotspot === hotspot.id
                    ? 'bg-gray-800 border-blue-500'
                    : 'bg-gray-850 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-500">🏷️</span>
                      <span className="text-sm font-medium text-white truncate">
                        {hotspot.label || 'Untitled'}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-gray-400 space-y-1">
                      <div className="flex items-center gap-1">
                        <span>→</span>
                        <span className="text-green-400 truncate">
                          {getTargetPanoramaName(hotspot.targetPanoramaId)}
                        </span>
                      </div>
                      
                      <div className="text-gray-600 font-mono truncate">
                        {formatPosition(hotspot.position)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveHotspot(hotspot.id);
                      if (selectedHotspot === hotspot.id) {
                        setSelectedHotspot(null);
                      }
                    }}
                    className="ml-2 p-1 text-gray-500 hover:text-red-400 transition-colors"
                    title="Remove hotspot"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-800 text-xs text-gray-500">
        {currentHotspots.length} hotspot{currentHotspots.length !== 1 ? 's' : ''} on this panorama
      </div>
    </div>
  );
}

export default HotspotEditor;