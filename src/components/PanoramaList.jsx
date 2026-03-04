import React, { useState, useRef } from 'react';

// Icon components
const Icons = {
  Folder: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  Image: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Upload: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  )
};

function PanoramaList({ panoramas, selectedPanorama, onSelect, onLoadFolder }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [thumbnails, setThumbnails] = useState({});
  const fileInputRef = useRef(null);

  // Generate thumbnails for panoramas
  React.useEffect(() => {
    panoramas.forEach(async (pano) => {
      if (thumbnails[pano.id]) return;
      
      try {
        const result = await window.electronAPI.readFile(pano.path);
        if (result.success) {
          setThumbnails(prev => ({
            ...prev,
            [pano.id]: `data:image/jpeg;base64,${result.data}`
          }));
        }
      } catch (err) {
        console.error('Failed to load thumbnail:', err);
      }
    });
  }, [panoramas, thumbnails]);

  const filteredPanoramas = panoramas.filter(pano =>
    pano.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const items = e.dataTransfer.items;
    if (items && items[0]) {
      const entry = items[0].webkitGetAsEntry();
      if (entry && entry.isDirectory) {
        // Get folder path from Electron
        const folderPath = await window.electronAPI.openFolder();
        if (folderPath) {
          onLoadFolder(folderPath);
        }
      }
    }
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Get directory from first file
      const file = files[0];
      const path = file.path.substring(0, file.path.lastIndexOf('\\') > -1 ? file.path.lastIndexOf('\\') : file.path.lastIndexOf('/'));
      if (path) {
        onLoadFolder(path);
      }
    }
  };

  return (
    <div 
      className={`w-72 bg-zinc-950/50 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300 ${
        isDragging ? 'drag-over' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            Panoramas
          </h2>
          <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full">
            {panoramas.length}
          </span>
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <Icons.Search />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <Icons.Search />
          </div>
        </div>
        
        {/* Load button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full btn-primary flex items-center justify-center gap-2 text-sm"
        >
          <Icons.Upload />
          Load Folder
        </button>
        <input
          ref={fileInputRef}
          type="file"
          webkitdirectory=""
          directory=""
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Panorama list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredPanoramas.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800/50 flex items-center justify-center">
              <Icons.Image />
            </div>
            <p className="text-zinc-500 text-sm">
              {searchQuery ? 'No panoramas found' : 'Drop folder here or click Load'}
            </p>
          </div>
        ) : (
          filteredPanoramas.map((pano, index) => (
            <button
              key={pano.id}
              onClick={() => onSelect(pano)}
              className={`w-full group flex items-center gap-3 p-2 rounded-xl transition-all duration-200 ${
                selectedPanorama?.id === pano.id
                  ? 'bg-blue-500/20 border border-blue-500/50 shadow-lg shadow-blue-500/10'
                  : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10'
              }`}
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                {thumbnails[pano.id] ? (
                  <img
                    src={thumbnails[pano.id]}
                    alt={pano.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600"
                  >
                    <Icons.Image />
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0 text-left">
                <div className={`text-sm font-medium truncate ${
                  selectedPanorama?.id === pano.id ? 'text-blue-400' : 'text-zinc-300 group-hover:text-zinc-100'
                }`}>
                  {pano.name.replace(/\.[^/.]+$/, '')}
                </div>
                <div className="text-xs text-zinc-500">
                  #{String(index + 1).padStart(2, '0')}
                </div>
              </div>
              
              {/* Selected indicator */}
              {selectedPanorama?.id === pano.id && (
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              )}
            </button>
          ))
        )}
      </div>

      {/* Drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center">
            <Icons.Upload />
            <p className="text-blue-400 font-medium mt-2">Drop folder here</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PanoramaList;