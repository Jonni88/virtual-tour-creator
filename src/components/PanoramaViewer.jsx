import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// SVG Icons as components
const HotspotIcon = ({ type }) => {
  if (type === 'info') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
};

function PanoramaViewer({ 
  panorama, 
  hotspots, 
  isPreviewMode,
  selectedHotspotType,
  onAddHotspot,
  onNavigate,
  onHotspotHover,
  onUpdateStartPosition
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const labelRendererRef = useRef(null);
  const controlsRef = useRef(null);
  const sphereRef = useRef(null);
  const hotspotsRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const [isLoading, setIsLoading] = useState(false);
  const [placingHotspot, setPlacingHotspot] = useState(false);
  const [hoveredHotspotId, setHoveredHotspotId] = useState(null);
  const [showPositionDialog, setShowPositionDialog] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // CSS2D Renderer for labels
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    containerRef.current.appendChild(labelRenderer.domElement);
    labelRendererRef.current = labelRenderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.rotateSpeed = -0.4;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      labelRenderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      labelRenderer.domElement.remove();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  // Load panorama texture
  useEffect(() => {
    if (!panorama || !sceneRef.current) return;

    setIsLoading(true);
    const textureLoader = new THREE.TextureLoader();

    window.electronAPI.readFile(panorama.path).then((result) => {
      if (!result.success) {
        setIsLoading(false);
        return;
      }

      const imageUrl = `data:image/jpeg;base64,${result.data}`;
      textureLoader.load(imageUrl, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        
        if (sphereRef.current) {
          sceneRef.current.remove(sphereRef.current);
          sphereRef.current.geometry.dispose();
          sphereRef.current.material.dispose();
        }

        const geometry = new THREE.SphereGeometry(500, 64, 32);
        geometry.scale(-1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ 
          map: texture,
          side: THREE.BackSide
        });
        const sphere = new THREE.Mesh(geometry, material);
        sceneRef.current.add(sphere);
        sphereRef.current = sphere;

        // Restore camera position if exists
        if (panorama.startPosition && cameraRef.current && controlsRef.current) {
          const pos = panorama.startPosition;
          cameraRef.current.position.set(pos.x, pos.y, pos.z);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        } else {
          if (cameraRef.current && controlsRef.current) {
            cameraRef.current.position.set(0, 0, 0.1);
            controlsRef.current.target.set(0, 0, 0);
            controlsRef.current.update();
          }
        }

        setIsLoading(false);
      });
    });
  }, [panorama]);

  // Update hotspots visualization
  useEffect(() => {
    if (!sceneRef.current || !labelRendererRef.current) return;

    // Remove old hotspots
    hotspotsRef.current.forEach((h) => {
      sceneRef.current.remove(h.mesh);
      if (h.label) sceneRef.current.remove(h.label);
    });
    hotspotsRef.current = [];

    // Add new hotspots
    hotspots.forEach((hotspot) => {
      const isInfo = hotspot.type === 'info';
      const color = isInfo ? 0x3b82f6 : 0xf97316;
      
      // 3D Marker
      const geometry = new THREE.SphereGeometry(3, 16, 16);
      const material = new THREE.MeshBasicMaterial({ 
        color: color,
        transparent: true,
        opacity: isPreviewMode ? 0.9 : 0.7
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(hotspot.position.x, hotspot.position.y, hotspot.position.z);
      mesh.userData = { hotspot };
      sceneRef.current.add(mesh);

      // HTML Label
      const labelDiv = document.createElement('div');
      labelDiv.className = 'pointer-events-auto';
      labelDiv.innerHTML = `
        <div class="flex flex-col items-center group cursor-pointer">
          <div class="${isInfo ? 'info-hotspot-marker' : 'hotspot-marker'} transform transition-transform group-hover:scale-110">
            <div class="${isInfo ? 'info-hotspot-marker-inner' : 'hotspot-marker-inner'}">
              ${isInfo ? 
                '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' :
                '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>'
              }
            </div>
          </div>
          ${hotspot.label ? `
            <div class="mt-2 px-3 py-1.5 rounded-lg backdrop-blur-md bg-black/70 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              ${hotspot.label}
            </div>
          ` : ''}
        </div>
      `;
      
      labelDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isPreviewMode && hotspot.targetPanoramaId) {
          onNavigate?.(hotspot.targetPanoramaId);
        }
      });

      const label = new CSS2DObject(labelDiv);
      label.position.set(hotspot.position.x, hotspot.position.y, hotspot.position.z);
      sceneRef.current.add(label);

      hotspotsRef.current.push({ mesh, label, data: hotspot });
    });
  }, [hotspots, isPreviewMode, onNavigate]);

  // Handle click
  const handleClick = useCallback((event) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    if (isPreviewMode) {
      // Navigate on hotspot click
      const hotspotMeshes = hotspotsRef.current.map((h) => h.mesh);
      const intersects = raycasterRef.current.intersectObjects(hotspotMeshes);
      if (intersects.length > 0) {
        const hotspot = intersects[0].object.userData.hotspot;
        if (hotspot.targetPanoramaId) {
          // Save current position before navigating
          if (panorama && cameraRef.current) {
            const pos = cameraRef.current.position;
            onUpdateStartPosition?.(panorama.id, { x: pos.x, y: pos.y, z: pos.z });
          }
          onNavigate?.(hotspot.targetPanoramaId);
        }
      }
    } else if (placingHotspot && sphereRef.current) {
      // Place hotspot on sphere
      const intersects = raycasterRef.current.intersectObject(sphereRef.current);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        onAddHotspot?.(selectedHotspotType, {
          x: point.x,
          y: point.y,
          z: point.z
        });
        setPlacingHotspot(false);
      }
    }
  }, [isPreviewMode, placingHotspot, selectedHotspotType, onAddHotspot, onNavigate, onUpdateStartPosition, panorama]);

  // Handle mouse move for hover effects
  const handleMouseMove = useCallback((event) => {
    if (!containerRef.current || !cameraRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    if (isPreviewMode) {
      const hotspotMeshes = hotspotsRef.current.map((h) => h.mesh);
      const intersects = raycasterRef.current.intersectObjects(hotspotMeshes);
      
      const newHoveredId = intersects.length > 0 ? intersects[0].object.userData.hotspot.id : null;
      
      if (newHoveredId !== hoveredHotspotId) {
        setHoveredHotspotId(newHoveredId);
        onHotspotHover?.(newHoveredId ? intersects[0].object.userData.hotspot : null);
      }

      document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
    }
  }, [isPreviewMode, hoveredHotspotId, onHotspotHover]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setPlacingHotspot(prev => !prev);
      }
      if (e.code === 'KeyP') {
        e.preventDefault();
        // Toggle preview mode would be handled by parent
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
      <div
        ref={containerRef}
        className={`w-full h-full ${placingHotspot ? 'cursor-crosshair' : 'cursor-move'}`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm z-20">
          <div className="w-12 h-12 border-3 border-zinc-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <div className="text-zinc-400 text-sm">Loading panorama...</div>
        </div>
      )}

      {/* Empty state */}
      {!panorama && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6"
          >
            <svg className="w-10 h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 22V12h6v10" />
            </svg>
          </div>
          <div className="text-xl font-semibold text-zinc-300 mb-2">No Panorama Selected</div>
          <div className="text-sm text-zinc-500">Load a folder to start creating your tour</div>
        </div>
      )}

      {/* Controls overlay */}
      {panorama && !isPreviewMode && (
        <>
          <button
            onClick={() => setPlacingHotspot(!placingHotspot)}
            className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-lg ${
              placingHotspot
                ? 'bg-orange-500 text-white shadow-orange-500/30'
                : 'bg-zinc-800/90 backdrop-blur text-zinc-200 hover:bg-zinc-700 border border-white/10'
            }`}
          >
            {placingHotspot ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Click on panorama to place
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Hotspot (Space)
              </>
            )}
          </button>

          {/* Instructions */}
          <div className="absolute bottom-6 left-6 flex flex-col gap-2">
            <div className="glass-panel px-3 py-2 text-xs text-zinc-400">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-1.5 py-0.5 bg-zinc-700 rounded text-zinc-300">Drag</span>
                <span>Rotate view</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-zinc-700 rounded text-zinc-300">Scroll</span>
                <span>Zoom</span>
              </div>
            </div>
          </div>

          {/* Set start position button */}
          <button
            onClick={() => {
              if (cameraRef.current && panorama) {
                const pos = cameraRef.current.position;
                onUpdateStartPosition?.(panorama.id, { x: pos.x, y: pos.y, z: pos.z });
              }
            }}
            className="absolute bottom-6 right-6 btn-secondary text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Set Start View
          </button>
        </>
      )}

      {/* Preview mode indicator */}
      {isPreviewMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/50 text-green-400 text-sm font-medium flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Preview Mode - Click hotspots to navigate
        </div>
      )}

      {/* Hotspot hover info */}
      {hoveredHotspotId && isPreviewMode && (
        <div className="absolute bottom-6 left-6 glass-panel px-4 py-3">
          <div className="text-sm font-medium text-zinc-200">Click to navigate</div>
          <div className="text-xs text-zinc-500 mt-0.5">Transition hotspot</div>
        </div>
      )}

      {/* Hotspot type indicator */}
      {!isPreviewMode && placingHotspot && (
        <div className="absolute top-6 right-6 glass-panel px-4 py-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${selectedHotspotType === 'info' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
            <span className="text-sm text-zinc-300">
              Placing: {selectedHotspotType === 'info' ? 'Info Point' : 'Transition'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PanoramaViewer;