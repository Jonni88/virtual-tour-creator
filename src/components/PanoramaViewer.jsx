import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function PanoramaViewer({ 
  panorama, 
  hotspots, 
  isPreviewMode,
  onAddHotspot,
  onNavigate,
  onHotspotHover 
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const sphereRef = useRef(null);
  const hotspotsRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const isPlacingHotspotRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [placingHotspot, setPlacingHotspot] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.rotateSpeed = -0.3;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    controlsRef.current = controls;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
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
        // Remove old sphere
        if (sphereRef.current) {
          sceneRef.current.remove(sphereRef.current);
          sphereRef.current.geometry.dispose();
          sphereRef.current.material.dispose();
        }

        // Create new sphere with panorama
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1); // Invert for interior view
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const sphere = new THREE.Mesh(geometry, material);
        sceneRef.current.add(sphere);
        sphereRef.current = sphere;

        // Reset camera
        if (cameraRef.current && controlsRef.current) {
          cameraRef.current.position.set(0, 0, 0.1);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }

        setIsLoading(false);
      });
    });
  }, [panorama]);

  // Update hotspots visualization
  useEffect(() => {
    if (!sceneRef.current) return;

    // Remove old hotspots
    hotspotsRef.current.forEach((h) => {
      sceneRef.current.remove(h.mesh);
      h.mesh.geometry.dispose();
      h.mesh.material.dispose();
    });
    hotspotsRef.current = [];

    // Add new hotspots
    hotspots.forEach((hotspot) => {
      const geometry = new THREE.SphereGeometry(3, 16, 16);
      const material = new THREE.MeshBasicMaterial({ 
        color: isPreviewMode ? 0x00ff00 : 0xff6600,
        transparent: true,
        opacity: 0.8
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(hotspot.position.x, hotspot.position.y, hotspot.position.z);
      mesh.userData = { hotspot };
      sceneRef.current.add(mesh);
      hotspotsRef.current.push({ mesh, data: hotspot });
    });
  }, [hotspots, isPreviewMode]);

  // Handle click for hotspot placement or navigation
  const handleClick = useCallback((event) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    if (isPreviewMode) {
      // Navigate on hotspot click
      const intersects = raycasterRef.current.intersectObjects(
        hotspotsRef.current.map((h) => h.mesh)
      );
      if (intersects.length > 0) {
        const targetId = intersects[0].object.userData.hotspot.targetPanoramaId;
        onNavigate?.(targetId);
      }
    } else if (placingHotspot && sphereRef.current) {
      // Place hotspot on sphere
      const intersects = raycasterRef.current.intersectObject(sphereRef.current);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        onAddHotspot?.({
          x: point.x,
          y: point.y,
          z: point.z
        });
        setPlacingHotspot(false);
      }
    }
  }, [isPreviewMode, placingHotspot, onAddHotspot, onNavigate]);

  // Handle mouse move for hover effects
  const handleMouseMove = useCallback((event) => {
    if (!containerRef.current || !cameraRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    if (isPreviewMode) {
      const intersects = raycasterRef.current.intersectObjects(
        hotspotsRef.current.map((h) => h.mesh)
      );
      
      hotspotsRef.current.forEach((h) => {
        h.mesh.material.opacity = intersects.length > 0 && intersects[0].object === h.mesh ? 1 : 0.6;
        h.mesh.scale.setScalar(intersects.length > 0 && intersects[0].object === h.mesh ? 1.3 : 1);
      });

      if (intersects.length > 0) {
        onHotspotHover?.(intersects[0].object.userData.hotspot);
      } else {
        onHotspotHover?.(null);
      }
    }
  }, [isPreviewMode, onHotspotHover]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className={`w-full h-full ${placingHotspot ? 'cursor-crosshair' : 'cursor-move'}`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950 bg-opacity-80">
          <div className="text-white text-lg">Loading panorama...</div>
        </div>
      )}

      {!isPreviewMode && (
        <button
          onClick={() => setPlacingHotspot(!placingHotspot)}
          className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg font-medium transition-colors ${
            placingHotspot
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {placingHotspot ? 'Click on panorama to place hotspot' : 'Add Hotspot'}
        </button>
      )}

      {isPreviewMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-green-600 text-white text-sm rounded-full">
          Preview Mode - Click hotspots to navigate
        </div>
      )}
    </div>
  );
}

export default PanoramaViewer;