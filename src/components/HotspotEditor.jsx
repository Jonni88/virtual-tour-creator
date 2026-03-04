import React, { useState } from 'react';

const Icons = {
  Link: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  Info: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Image: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Navigation: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  X: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
};

function HotspotEditor({ 
  hotspots, 
  panoramas, 
  currentPanorama, 
  onRemoveHotspot,
  onUpdateHotspot,
  hotspotTypes,
  selectedHotspotType,
  onSelectHotspotType
}) {
  const [editingHotspot, setEditingHotspot] = useState(null);
  const [editForm, setEditForm] = useState({ label: '', targetPanoramaId: '' });

  const currentHotspots = hotspots.filter(h => h.panoramaId === currentPanorama?.id);
  
  const transitionHotspots = currentHotspots.filter(h => h.type === 'transition');
  const infoHotspots = currentHotspots.filter(h => h.type === 'info');

  const getTargetPanoramaName = (targetId) => {
    const target = panoramas.find(p => p.id === targetId);
    return target?.name?.replace(/\.[^/.]+$/, '') || 'Unknown';
  };

  const formatPosition = (pos) => {
    return `${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}, ${pos.z.toFixed(0)}`;
  };

  const startEditing = (hotspot) => {
    setEditingHotspot(hotspot.id);
    setEditForm({
      label: hotspot.label || '',
      targetPanoramaId: hotspot.targetPanoramaId || ''
    });
  };

  const saveEdit = () => {
    if (editingHotspot) {
      onUpdateHotspot(editingHotspot, editForm);
      setEditingHotspot(null);
    }
  };

  const cancelEdit = () => {
    setEditingHotspot(null);
    setEditForm({ label: '', targetPanoramaId: '' });
  };

  const HotspotCard = ({ hotspot, icon: Icon, colorClass }) => (
    <div className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-3 transition-all duration-200">
      {editingHotspot === hotspot.id ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editForm.label}
            onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
            placeholder="Hotspot label..."
            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
            autoFocus
          />
          
          {hotspot.type === 'transition' && (
            <select
              value={editForm.targetPanoramaId}
              onChange={(e) => setEditForm({ ...editForm, targetPanoramaId: e.target.value })}
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
            >
              <option value="">Select target...</option>
              {panoramas.filter(p => p.id !== currentPanorama?.id).map(p => (
                <option key={p.id} value={p.id}>{p.name.replace(/\.[^/.]+$/, '')}</option>
              ))}
            </select>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              className="flex-1 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors"
            >
              <Icons.Check /> Save
            </button>
            <button
              onClick={cancelEdit}
              className="flex-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors"
            >
              <Icons.X /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}
            >
              <Icon />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-zinc-200 truncate">
                {hotspot.label || (hotspot.type === 'transition' ? 'Transition' : 'Info Point')}
              </div>
              
              {hotspot.type === 'transition' && hotspot.targetPanoramaId && (
                <div className="flex items-center gap-1 text-xs text-green-400 mt-0.5"
                >
                  <Icons.Navigation />
                  <span className="truncate">{getTargetPanoramaName(hotspot.targetPanoramaId)}</span>
                </div>
              )}
              
              <div className="text-xs text-zinc-600 font-mono mt-1">
                {formatPosition(hotspot.position)}
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <button
                onClick={() => startEditing(hotspot)}
                className="p-1.5 hover:bg-white/10 text-zinc-500 hover:text-zinc-300 rounded-lg transition-colors"
                title="Edit"
              >
                <Icons.Edit />
              </button>
              <button
                onClick={() => onRemoveHotspot(hotspot.id)}
                className="p-1.5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-lg transition-colors"
                title="Delete"
              >
                <Icons.Trash />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="w-80 bg-zinc-950/50 backdrop-blur-xl border-l border-white/10 flex flex-col">
      {/* Header with hotspot type selector */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">
          Hotspots
        </h2>
        
        <div className="grid grid-cols-2 gap-2">
          {hotspotTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => onSelectHotspotType(type.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedHotspotType === type.id
                  ? type.activeClass
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
              }`}
            >
              <type.icon />
              {type.label}
            </button>
          ))}
        </div>
        
        <p className="text-xs text-zinc-500 mt-3">
          Click "Add Hotspot" then click on panorama to place
        </p>
      </div>

      {/* Hotspot lists */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {currentHotspots.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-zinc-800/50 flex items-center justify-center"
            >
              <Icons.Link />
            </div>
            <p className="text-zinc-500 text-sm">
              No hotspots yet
            </p>
            <p className="text-zinc-600 text-xs mt-1">
              Add transitions between panoramas
            </p>
          </div>
        ) : (
          <>
            {transitionHotspots.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-xs font-medium text-zinc-400 uppercase">Transitions ({transitionHotspots.length})</span>
                </div>
                <div className="space-y-2">
                  {transitionHotspots.map((hotspot) => (
                    <HotspotCard
                      key={hotspot.id}
                      hotspot={hotspot}
                      icon={Icons.Link}
                      colorClass="bg-orange-500/20 text-orange-400"
                    />
                  ))}
                </div>
              </div>
            )}
            
            {infoHotspots.length > 0 && (
              <div className={transitionHotspots.length > 0 ? 'mt-4' : ''}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs font-medium text-zinc-400 uppercase">Info Points ({infoHotspots.length})</span>
                </div>
                <div className="space-y-2">
                  {infoHotspots.map((hotspot) => (
                    <HotspotCard
                      key={hotspot.id}
                      hotspot={hotspot}
                      icon={Icons.Info}
                      colorClass="bg-blue-500/20 text-blue-400"
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer stats */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Total hotspots</span>
          <span className="text-zinc-300 font-medium">{currentHotspots.length}</span>
        </div>
      </div>
    </div>
  );
}

export default HotspotEditor;