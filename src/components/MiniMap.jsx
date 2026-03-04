import React, { useState, useEffect } from 'react';

const Icons = {
  Map: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Position: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <circle cx="12" cy="11" r="3" fill="currentColor" />
    </svg>
  )
};

function MiniMap({ 
  panoramas, 
  selectedPanorama, 
  onSelectPanorama,
  hotspots 
}) {
  const [floorPlan, setFloorPlan] = useState(null);
  const [roomPositions, setRoomPositions] = useState({});
  const [isSettingPositions, setIsSettingPositions] = useState(false);
  const [draggedRoom, setDraggedRoom] = useState(null);

  // Initialize room positions from panoramas
  useEffect(() => {
    const positions = {};
    panoramas.forEach((pano, index) => {
      if (!roomPositions[pano.id]) {
        // Arrange in a grid initially
        const col = index % 3;
        const row = Math.floor(index / 3);
        positions[pano.id] = {
          x: 100 + col * 120,
          y: 100 + row * 100,
          name: pano.name.replace(/\.[^/.]+$/, '')
        };
      }
    });
    if (Object.keys(positions).length > 0) {
      setRoomPositions(prev => ({ ...prev, ...positions }));
    }
  }, [panoramas]);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFloorPlan(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRoomDrag = (panoId, newX, newY) => {
    setRoomPositions(prev => ({
      ...prev,
      [panoId]: { ...prev[panoId], x: newX, y: newY }
    }));
  };

  const getConnectedRooms = (panoId) => {
    const connected = new Set();
    hotspots.forEach(h => {
      if (h.panoramaId === panoId && h.targetPanoramaId) {
        connected.add(h.targetPanoramaId);
      }
      if (h.targetPanoramaId === panoId) {
        connected.add(h.panoramaId);
      }
    });
    return Array.from(connected);
  };

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Icons.Map />
          План этажа
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            id="floor-plan-input"
            className="hidden"
          />
          <label
            htmlFor="floor-plan-input"
            className="cursor-pointer px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-lg text-sm transition-colors"
          >
            {floorPlan ? 'Сменить план' : 'Загрузить план'}
          </label>
          
          {panoramas.length > 0 && (
            <button
              onClick={() => setIsSettingPositions(!isSettingPositions)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isSettingPositions
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              {isSettingPositions ? 'Готово' : 'Расположить'}
            </button>
          )}
        </div>
      </div>

      {panoramas.length === 0 ? (
        <div className="text-center py-8 text-zinc-500 text-sm">
          Загрузите панорамы чтобы отобразить план
        </div>
      ) : (
        <div 
          className="relative bg-zinc-950 rounded-lg overflow-hidden"
          style={{ height: '300px' }}
        >
          {floorPlan ? (
            <img
              src={floorPlan}
              alt="План этажа"
              className="absolute inset-0 w-full h-full object-contain opacity-50"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm"
            >
              Нет плана этажа
            </div>
          )}

          {/* Connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {panoramas.map(pano => {
              const pos = roomPositions[pano.id];
              if (!pos) return null;
              
              const connected = getConnectedRooms(pano.id);
              return connected.map(targetId => {
                const targetPos = roomPositions[targetId];
                if (!targetPos) return null;
                
                return (
                  <line
                    key={`${pano.id}-${targetId}`}
                    x1={pos.x}
                    y1={pos.y}
                    x2={targetPos.x}
                    y2={targetPos.y}
                    stroke="rgba(59, 130, 246, 0.3)"
                    strokeWidth="2"
                  />
                );
              });
            })}
          </svg>

          {/* Room markers */}
          {panoramas.map((pano, index) => {
            const pos = roomPositions[pano.id];
            if (!pos) return null;
            
            const isSelected = selectedPanorama?.id === pano.id;
            const roomNumber = index + 1;
            
            return (
              <div
                key={pano.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${
                  isSettingPositions ? 'cursor-move' : ''
                }`}
                style={{ left: pos.x, top: pos.y }}
                onClick={() => !isSettingPositions && onSelectPanorama(pano)}
                onMouseDown={(e) => {
                  if (isSettingPositions) {
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const initialX = pos.x;
                    const initialY = pos.y;
                    
                    const handleMouseMove = (e) => {
                      const container = e.currentTarget.closest('.relative');
                      if (!container) return;
                      const rect = container.getBoundingClientRect();
                      const newX = initialX + (e.clientX - startX);
                      const newY = initialY + (e.clientY - startY);
                      handleRoomDrag(pano.id, 
                        Math.max(20, Math.min(rect.width - 20, newX)),
                        Math.max(20, Math.min(rect.height - 20, newY))
                      );
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }
                }}
              >
                <div className={`flex flex-col items-center gap-1 ${
                  isSelected ? 'scale-110' : ''
                }`}>
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    font-semibold text-sm shadow-lg transition-all
                    ${isSelected 
                      ? 'bg-blue-500 text-white shadow-blue-500/50' 
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/10'}
                  `}>
                    {roomNumber}
                  </div>
                  <div className={`
                    px-2 py-0.5 rounded text-xs whitespace-nowrap
                    ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-black/50 text-zinc-400'}
                  `}>
                    {pos.name.length > 12 ? pos.name.substring(0, 12) + '...' : pos.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isSettingPositions && (
        <p className="text-xs text-zinc-500 mt-2 text-center">
          Перетаскивайте комнаты чтобы расположить их на плане
        </p>
      )}
    </div>
  );
}

export default MiniMap;