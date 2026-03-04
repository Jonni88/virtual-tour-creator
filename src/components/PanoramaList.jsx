import React from 'react';

function PanoramaList({ panoramas, selectedPanorama, onSelect, onLoadFolder }) {
  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-3">Panoramas</h2>
        <button
          onClick={onLoadFolder}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Load Folder
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {panoramas.length === 0 ? (
          <div className="text-gray-500 text-sm text-center p-4">
            No panoramas loaded.
            <br />
            Click "Load Folder" to add 360° photos.
          </div>
        ) : (
          <div className="space-y-2">
            {panoramas.map((pano, index) => (
              <button
                key={pano.id}
                onClick={() => onSelect(pano)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedPanorama?.id === pano.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 hover:bg-gray-750 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center text-lg">
                    🏞️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {pano.name}
                    </div>
                    <div className="text-xs opacity-70">
                      #{index + 1}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-800 text-xs text-gray-500">
        {panoramas.length} panorama{panoramas.length !== 1 ? 's' : ''} loaded
      </div>
    </div>
  );
}

export default PanoramaList;