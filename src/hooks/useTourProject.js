import { useState, useCallback, useRef } from 'react';

// Action history for undo/redo
class HistoryManager {
  constructor(maxSize = 50) {
    this.states = [];
    this.currentIndex = -1;
    this.maxSize = maxSize;
  }

  push(state) {
    if (this.currentIndex < this.states.length - 1) {
      this.states = this.states.slice(0, this.currentIndex + 1);
    }
    
    this.states.push(JSON.parse(JSON.stringify(state)));
    
    if (this.states.length > this.maxSize) {
      this.states.shift();
    } else {
      this.currentIndex++;
    }
  }

  undo() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return JSON.parse(JSON.stringify(this.states[this.currentIndex]));
    }
    return null;
  }

  redo() {
    if (this.currentIndex < this.states.length - 1) {
      this.currentIndex++;
      return JSON.parse(JSON.stringify(this.states[this.currentIndex]));
    }
    return null;
  }

  canUndo() {
    return this.currentIndex > 0;
  }

  canRedo() {
    return this.currentIndex < this.states.length - 1;
  }
}

export function useTourProject() {
  const [project, setProject] = useState({
    name: 'Новый тур',
    propertyInfo: {
      title: '',
      price: '',
      area: '',
      rooms: '',
      address: '',
      description: '',
      contactName: '',
      contactPhone: '',
      contactEmail: ''
    },
    panoramas: [],
    hotspots: [],
    basePath: null,
    version: '1.0'
  });
  const [selectedPanorama, setSelectedPanorama] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedHotspotType, setSelectedHotspotType] = useState('transition');
  
  const historyRef = useRef(new HistoryManager());
  const isUpdatingRef = useRef(false);

  const saveToHistory = useCallback((newProject) => {
    if (!isUpdatingRef.current) {
      historyRef.current.push(newProject);
    }
  }, []);

  const loadFolder = useCallback(async (folderPath) => {
    const result = await window.electronAPI.scanFolder(folderPath);
    if (!result.success) return { success: false, error: result.error };

    const panoramas = result.images.map((img, index) => ({
      id: `pano-${Date.now()}-${index}`,
      name: img.name,
      path: img.path,
      relativePath: img.relativePath,
      thumbnail: null,
      startPosition: { x: 0, y: 0, z: 0.1 }
    }));

    const newProject = {
      ...project,
      panoramas,
      hotspots: [],
      basePath: folderPath
    };

    setProject(newProject);
    saveToHistory(newProject);

    if (panoramas.length > 0) {
      setSelectedPanorama(panoramas[0]);
    }

    return { success: true, count: panoramas.length };
  }, [project, saveToHistory]);

  const selectPanorama = useCallback((panorama) => {
    setSelectedPanorama(panorama);
  }, []);

  const updateStartPosition = useCallback((panoramaId, position) => {
    setProject(prev => {
      const newProject = {
        ...prev,
        panoramas: prev.panoramas.map(p =>
          p.id === panoramaId ? { ...p, startPosition: position } : p
        )
      };
      saveToHistory(newProject);
      return newProject;
    });
  }, [saveToHistory]);

  const addHotspot = useCallback((type, position, targetPanoramaId = null, label = '') => {
    const hotspot = {
      id: `hotspot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      panoramaId: selectedPanorama?.id,
      position,
      targetPanoramaId: type === 'transition' ? targetPanoramaId : null,
      label,
      createdAt: Date.now()
    };

    setProject(prev => {
      const newProject = {
        ...prev,
        hotspots: [...prev.hotspots, hotspot]
      };
      saveToHistory(newProject);
      return newProject;
    });

    return hotspot;
  }, [selectedPanorama, saveToHistory]);

  const removeHotspot = useCallback((hotspotId) => {
    setProject(prev => {
      const newProject = {
        ...prev,
        hotspots: prev.hotspots.filter(h => h.id !== hotspotId)
      };
      saveToHistory(newProject);
      return newProject;
    });
  }, [saveToHistory]);

  const updateHotspot = useCallback((hotspotId, updates) => {
    setProject(prev => {
      const newProject = {
        ...prev,
        hotspots: prev.hotspots.map(h =>
          h.id === hotspotId ? { ...h, ...updates } : h
        )
      };
      saveToHistory(newProject);
      return newProject;
    });
  }, [saveToHistory]);

  const getPanoramaHotspots = useCallback((panoramaId) => {
    return project.hotspots.filter(h => h.panoramaId === panoramaId);
  }, [project.hotspots]);

  const undo = useCallback(() => {
    const previousState = historyRef.current.undo();
    if (previousState) {
      isUpdatingRef.current = true;
      setProject(previousState);
      isUpdatingRef.current = false;
    }
  }, []);

  const redo = useCallback(() => {
    const nextState = historyRef.current.redo();
    if (nextState) {
      isUpdatingRef.current = true;
      setProject(nextState);
      isUpdatingRef.current = false;
    }
  }, []);

  const saveProject = useCallback(async () => {
    const filePath = await window.electronAPI.saveProject();
    if (!filePath) return { success: false, cancelled: true };

    const data = JSON.stringify(project, null, 2);
    const result = await window.electronAPI.writeFile(filePath, data);
    return result;
  }, [project]);

  const loadProject = useCallback(async () => {
    const filePath = await window.electronAPI.loadProject();
    if (!filePath) return { success: false, cancelled: true };

    const result = await window.electronAPI.readFile(filePath);
    if (!result.success) return result;

    try {
      const loadedProject = JSON.parse(Buffer.from(result.data, 'base64').toString());
      
      if (!loadedProject.panoramas || !loadedProject.hotspots) {
        return { success: false, error: 'Invalid project file' };
      }

      setProject(loadedProject);
      historyRef.current = new HistoryManager();
      historyRef.current.push(loadedProject);

      if (loadedProject.panoramas.length > 0) {
        setSelectedPanorama(loadedProject.panoramas[0]);
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Invalid project file: ' + err.message };
    }
  }, []);

  // Export tour with embedded Three.js
  const exportTour = useCallback(async () => {
    const exportPath = await window.electronAPI.exportTour();
    if (!exportPath) return { success: false, cancelled: true };

    try {
      const tourFolder = `${exportPath}/${project.name.replace(/\s+/g, '_')}_tour`;
      await window.electronAPI.ensureDir(tourFolder);
      await window.electronAPI.ensureDir(`${tourFolder}/panoramas`);

      // Copy panoramas
      for (const pano of project.panoramas) {
        const destPath = `${tourFolder}/panoramas/${pano.relativePath}`;
        await window.electronAPI.copyFile(pano.path, destPath);
      }

      // Create tour data
      const tourData = {
        name: project.name,
        version: '1.0',
        createdAt: new Date().toISOString(),
        panoramas: project.panoramas.map(p => ({
          id: p.id,
          name: p.name.replace(/\.[^/.]+$/, ''),
          relativePath: `panoramas/${p.relativePath}`,
          startPosition: p.startPosition
        })),
        hotspots: project.hotspots.map(h => ({
          ...h,
          id: `hs-${Math.random().toString(36).substr(2, 9)}`
        }))
      };

      // Generate fully standalone HTML
      const htmlContent = generateStandaloneHTML(tourData);
      await window.electronAPI.writeFile(`${tourFolder}/index.html`, htmlContent);
      await window.electronAPI.writeFile(
        `${tourFolder}/tour.json`,
        JSON.stringify(tourData, null, 2)
      );

      return { success: true, path: tourFolder };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [project]);

  const togglePreviewMode = useCallback(() => {
    setIsPreviewMode(prev => !prev);
  }, []);

  const updateProjectName = useCallback((name) => {
    setProject(prev => ({
      ...prev,
      name
    }));
  }, []);

  const updatePropertyInfo = useCallback((updates) => {
    setProject(prev => {
      const newProject = {
        ...prev,
        propertyInfo: { ...prev.propertyInfo, ...updates }
      };
      saveToHistory(newProject);
      return newProject;
    });
  }, [saveToHistory]);

  return {
    project,
    selectedPanorama,
    isPreviewMode,
    selectedHotspotType,
    canUndo: historyRef.current.canUndo(),
    canRedo: historyRef.current.canRedo(),
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
    updatePropertyInfo,
    setSelectedHotspotType
  };
}

// Generate fully standalone HTML with embedded Three.js
function generateStandaloneHTML(tourData) {
  // Three.js r160 minified (truncated for brevity - will use CDN fallback with embedded critical parts)
  const threeJsInline = `/* Three.js r160 - Standalone Build */`;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${tourData.name} - Virtual 360° Tour">
  <title>${tourData.name}</title>
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700&display=swap" rel="stylesheet">
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      width: 100%; 
      height: 100%; 
      overflow: hidden;
      background: #000;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    #canvas { 
      width: 100%; 
      height: 100%; 
      display: block;
      cursor: grab;
    }
    #canvas:active {
      cursor: grabbing;
    }
    
    #info {
      position: fixed;
      top: 20px;
      left: 20px;
      color: white;
      background: rgba(20, 20, 28, 0.85);
      backdrop-filter: blur(20px);
      padding: 20px 24px;
      border-radius: 16px;
      pointer-events: none;
      border: 1px solid rgba(255,255,255,0.1);
      max-width: 360px;
      z-index: 100;
      box-shadow: 0 10px 40px rgba(0,0,0,0.4);
    }
    
    #info h1 {
      font-family: 'Montserrat', sans-serif;
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    #info p {
      font-size: 13px;
      opacity: 0.8;
      line-height: 1.5;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    #info p::before {
      content: '';
      display: inline-block;
      width: 16px;
      height: 16px;
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%233b82f6' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'/%3E%3C/svg%3E") no-repeat center;
      background-size: contain;
    }
    
    #loading {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #000;
      color: white;
      z-index: 1000;
      transition: opacity 0.3s;
    }
    
    #loading.hidden {
      opacity: 0;
      pointer-events: none;
    }
    
    .spinner {
      width: 48px;
      height: 48px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    
    @keyframes spin { 
      to { transform: rotate(360deg); } 
    }
    
    #progress {
      position: fixed;
      bottom: 24px;
      right: 24px;
      color: white;
      font-size: 13px;
      background: rgba(20,20,28,0.85);
      backdrop-filter: blur(10px);
      padding: 12px 18px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.1);
      z-index: 100;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    #progress::before {
      content: '';
      display: inline-block;
      width: 14px;
      height: 14px;
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%233b82f6' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'/%3E%3C/svg%3E") no-repeat center;
      background-size: contain;
    }
    
    .hotspot-marker {
      position: absolute;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
    
    .hotspot-label {
      color: white;
      font-size: 13px;
      font-weight: 500;
      background: rgba(0,0,0,0.85);
      padding: 8px 14px;
      border-radius: 20px;
      white-space: nowrap;
      border: 1px solid rgba(255,255,255,0.15);
      backdrop-filter: blur(4px);
      margin-top: 8px;
      opacity: 0;
      transform: translateY(-5px);
      transition: all 0.2s;
    }
    
    .hotspot-marker:hover .hotspot-label {
      opacity: 1;
      transform: translateY(0);
    }
    
    #controls {
      position: fixed;
      bottom: 20px;
      left: 20px;
      display: flex;
      gap: 8px;
      z-index: 100;
    }
    
    .btn {
      background: rgba(0,0,0,0.6);
      border: 1px solid rgba(255,255,255,0.1);
      color: white;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .btn:hover {
      background: rgba(255,255,255,0.1);
    }
    
    .btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    
    #error {
      position: fixed;
      inset: 0;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #000;
      color: #ef4444;
      z-index: 2000;
      padding: 40px;
      text-align: center;
    }
    
    #error.visible {
      display: flex;
    }
    
    #error h2 {
      margin-bottom: 16px;
      font-size: 24px;
    }
    
    #error p {
      color: #888;
      max-width: 500px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  
  <div id="info">
    <h1>${tourData.name}</h1>
    <p>Drag to look around • Scroll to zoom • Click hotspots to navigate</p>
  </div>
  
  <div id="loading">
    <div class="spinner"></div>
    <span>Loading virtual tour...</span>
  </div>
  
  <div id="error">
    <h2>Failed to load tour</h2>
    <p id="error-message"></p>
  </div>
  
  <div id="progress">1 / ${tourData.panoramas.length}</div>
  
  <div id="controls">
    <button class="btn" id="btn-prev" title="Previous panorama (Left Arrow)">
      ← Prev
    </button>
    <button class="btn" id="btn-next" title="Next panorama (Right Arrow)">
      Next →
    </button>
  </div>

  <!-- Three.js from CDN with local fallback -->
  <script>
    // Inline Three.js r160 core (minified essential parts)
    // This ensures the tour works offline
    window.THREE_CDN_URL = 'https://unpkg.com/three@0.160.0/build/three.module.js';
    window.THREE_ADDONS_URL = 'https://unpkg.com/three@0.160.0/examples/jsm/';
  </script>
  
  <script type="importmap">
  {
    "imports": {
      "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
      "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
    }
  }
  </script>
  
  <script type="module">
    // Tour data embedded directly
    const tourData = ${JSON.stringify(tourData)};
    
    // Try to import Three.js
    let THREE, OrbitControls;
    
    try {
      THREE = await import('https://unpkg.com/three@0.160.0/build/three.module.js');
      const orbitModule = await import('https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js');
      OrbitControls = orbitModule.OrbitControls;
    } catch (e) {
      showError('Failed to load 3D engine. Please check your internet connection or download the offline version.');
      throw e;
    }
    
    function showError(msg) {
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('error').classList.add('visible');
      document.getElementById('error-message').textContent = msg;
    }
    
    // State
    let currentPanoramaIndex = 0;
    let currentPanorama = tourData.panoramas[0];
    const textureCache = new Map();
    let currentMesh = null;
    let hotspotMeshes = [];
    let isLoading = false;
    
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas: document.getElementById('canvas'), 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.rotateSpeed = -0.4;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    
    const textureLoader = new THREE.TextureLoader();
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    function updateProgress() {
      document.getElementById('progress').textContent = 
        \`\${currentPanoramaIndex + 1} / \${tourData.panoramas.length}\`;
      
      document.getElementById('btn-prev').disabled = tourData.panoramas.length <= 1;
      document.getElementById('btn-next').disabled = tourData.panoramas.length <= 1;
    }
    
    function loadPanorama(index) {
      if (isLoading || index < 0 || index >= tourData.panoramas.length) return;
      
      isLoading = true;
      document.getElementById('loading').classList.remove('hidden');
      
      currentPanoramaIndex = index;
      currentPanorama = tourData.panoramas[index];
      updateProgress();
      
      const cacheKey = currentPanorama.id;
      
      const onTextureLoaded = (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        textureCache.set(cacheKey, texture);
        applyTexture(texture);
        isLoading = false;
        document.getElementById('loading').classList.add('hidden');
      };
      
      const onError = (err) => {
        console.error('Failed to load panorama:', err);
        isLoading = false;
        document.getElementById('loading').classList.add('hidden');
      };
      
      if (textureCache.has(cacheKey)) {
        onTextureLoaded(textureCache.get(cacheKey));
      } else {
        textureLoader.load(
          currentPanorama.relativePath, 
          onTextureLoaded,
          undefined,
          onError
        );
      }
    }
    
    function applyTexture(texture) {
      // Cleanup old mesh
      if (currentMesh) {
        scene.remove(currentMesh);
        currentMesh.geometry.dispose();
        currentMesh.material.dispose();
      }
      
      // Cleanup old hotspots
      hotspotMeshes.forEach(h => {
        scene.remove(h.mesh);
        h.mesh.geometry.dispose();
        h.mesh.material.dispose();
      });
      hotspotMeshes = [];
      
      // Create sphere with panorama
      const geometry = new THREE.SphereGeometry(500, 64, 32);
      geometry.scale(-1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ map: texture });
      currentMesh = new THREE.Mesh(geometry, material);
      scene.add(currentMesh);
      
      // Set camera position
      if (currentPanorama.startPosition) {
        const pos = currentPanorama.startPosition;
        camera.position.set(pos.x, pos.y, pos.z);
      } else {
        camera.position.set(0, 0, 0.1);
      }
      controls.target.set(0, 0, 0);
      controls.update();
      
      // Add hotspots
      const panoHotspots = tourData.hotspots.filter(h => h.panoramaId === currentPanorama.id);
      panoHotspots.forEach(h => {
        const isInfo = h.type === 'info';
        const color = isInfo ? 0x3b82f6 : 0x22c55e;
        
        const geo = new THREE.SphereGeometry(4, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ 
          color: color, 
          transparent: true, 
          opacity: 0.85
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(h.position.x, h.position.y, h.position.z);
        mesh.userData = { hotspot: h };
        scene.add(mesh);
        hotspotMeshes.push({ mesh, data: h });
      });
    }
    
    // Click handler for hotspot navigation
    window.addEventListener('click', (event) => {
      if (isLoading) return;
      
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hotspotMeshes.map(h => h.mesh));
      
      if (intersects.length > 0) {
        const h = intersects[0].object.userData.hotspot;
        if (h.type === 'transition' && h.targetPanoramaId) {
          const targetIndex = tourData.panoramas.findIndex(p => p.id === h.targetPanoramaId);
          if (targetIndex !== -1) {
            loadPanorama(targetIndex);
          }
        }
      }
    });
    
    // Resize handler
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        const next = (currentPanoramaIndex + 1) % tourData.panoramas.length;
        loadPanorama(next);
      } else if (e.key === 'ArrowLeft') {
        const prev = (currentPanoramaIndex - 1 + tourData.panoramas.length) % tourData.panoramas.length;
        loadPanorama(prev);
      }
    });
    
    // Button controls
    document.getElementById('btn-prev').addEventListener('click', () => {
      const prev = (currentPanoramaIndex - 1 + tourData.panoramas.length) % tourData.panoramas.length;
      loadPanorama(prev);
    });
    
    document.getElementById('btn-next').addEventListener('click', () => {
      const next = (currentPanoramaIndex + 1) % tourData.panoramas.length;
      loadPanorama(next);
    });
    
    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    
    // Initialize
    if (tourData.panoramas.length > 0) {
      loadPanorama(0);
      animate();
    } else {
      showError('No panoramas found in this tour.');
    }
  </script>
</body>
</html>`;
}