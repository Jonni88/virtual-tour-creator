import { useState, useCallback, useRef } from 'react';

// Action history for undo/redo
class HistoryManager {
  constructor(maxSize = 50) {
    this.states = [];
    this.currentIndex = -1;
    this.maxSize = maxSize;
  }

  push(state) {
    // Remove future states if we're not at the end
    if (this.currentIndex < this.states.length - 1) {
      this.states = this.states.slice(0, this.currentIndex + 1);
    }
    
    this.states.push(JSON.parse(JSON.stringify(state)));
    
    // Keep only maxSize states
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
    name: 'New Tour',
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

  // Save state to history
  const saveToHistory = useCallback((newProject) => {
    if (!isUpdatingRef.current) {
      historyRef.current.push(newProject);
    }
  }, []);

  // Load folder with panoramas
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

  // Select panorama
  const selectPanorama = useCallback((panorama) => {
    setSelectedPanorama(panorama);
  }, []);

  // Update panorama start position
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

  // Add hotspot
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

  // Remove hotspot
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

  // Update hotspot
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

  // Get hotspots for current panorama
  const getPanoramaHotspots = useCallback((panoramaId) => {
    return project.hotspots.filter(h => h.panoramaId === panoramaId);
  }, [project.hotspots]);

  // Undo
  const undo = useCallback(() => {
    const previousState = historyRef.current.undo();
    if (previousState) {
      isUpdatingRef.current = true;
      setProject(previousState);
      isUpdatingRef.current = false;
    }
  }, []);

  // Redo
  const redo = useCallback(() => {
    const nextState = historyRef.current.redo();
    if (nextState) {
      isUpdatingRef.current = true;
      setProject(nextState);
      isUpdatingRef.current = false;
    }
  }, []);

  // Save project
  const saveProject = useCallback(async () => {
    const filePath = await window.electronAPI.saveProject();
    if (!filePath) return { success: false, cancelled: true };

    const data = JSON.stringify(project, null, 2);
    const result = await window.electronAPI.writeFile(filePath, data);
    return result;
  }, [project]);

  // Load project
  const loadProject = useCallback(async () => {
    const filePath = await window.electronAPI.loadProject();
    if (!filePath) return { success: false, cancelled: true };

    const result = await window.electronAPI.readFile(filePath);
    if (!result.success) return result;

    try {
      const loadedProject = JSON.parse(Buffer.from(result.data, 'base64').toString());
      
      // Validate project structure
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

  // Export tour
  const exportTour = useCallback(async () => {
    const exportPath = await window.electronAPI.exportTour();
    if (!exportPath) return { success: false, cancelled: true };

    try {
      // Create tour folder
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
          // Remove internal IDs for cleaner export
          id: `hs-${Math.random().toString(36).substr(2, 9)}`
        }))
      };

      // Generate HTML viewer
      const htmlContent = generateViewerHTML(tourData);
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

  // Toggle preview mode
  const togglePreviewMode = useCallback(() => {
    setIsPreviewMode(prev => !prev);
  }, []);

  // Update project name
  const updateProjectName = useCallback((name) => {
    setProject(prev => ({
      ...prev,
      name
    }));
  }, []);

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
    setSelectedHotspotType
  };
}

// Generate standalone HTML viewer
function generateViewerHTML(tourData) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tourData.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: #000; 
      overflow: hidden; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #canvas { width: 100vw; height: 100vh; display: block; }
    
    #info {
      position: fixed;
      top: 20px;
      left: 20px;
      color: white;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(10px);
      padding: 12px 16px;
      border-radius: 12px;
      pointer-events: none;
      border: 1px solid rgba(255,255,255,0.1);
    }
    
    #info h1 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    #info p {
      font-size: 12px;
      opacity: 0.7;
    }
    
    #loading {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.2);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .hotspot-label {
      color: white;
      font-size: 12px;
      font-weight: 500;
      background: rgba(0,0,0,0.8);
      padding: 6px 12px;
      border-radius: 20px;
      pointer-events: none;
      white-space: nowrap;
      border: 1px solid rgba(255,255,255,0.2);
      backdrop-filter: blur(4px);
    }
    
    #progress {
      position: fixed;
      bottom: 20px;
      right: 20px;
      color: white;
      font-size: 12px;
      opacity: 0.6;
      background: rgba(0,0,0,0.5);
      padding: 8px 12px;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <div id="info">
    <h1>${tourData.name}</h1>
    <p>Drag to look • Scroll to zoom • Click hotspots</p>
  </div>
  <div id="loading">
    <div class="spinner"></div>
    <span>Loading tour...</span>
  </div>
  <div id="progress"></div>
  
  <script type="importmap">
  {
    "imports": {
      "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
      "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
    }
  }
  </script>
  
  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    
    const tourData = ${JSON.stringify(tourData)};
    let currentPanoramaIndex = 0;
    let currentPanorama = tourData.panoramas[0];
    let loadedCount = 0;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.rotateSpeed = -0.4;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    
    const textureLoader = new THREE.TextureLoader();
    const textureCache = {};
    let currentMesh = null;
    let hotspots = [];
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    function updateProgress() {
      document.getElementById('progress').textContent = 
        \`\${currentPanoramaIndex + 1} / \${tourData.panoramas.length}\`;
    }
    
    function loadPanorama(index) {
      document.getElementById('loading').style.display = 'flex';
      currentPanoramaIndex = index;
      currentPanorama = tourData.panoramas[index];
      updateProgress();
      
      const cacheKey = currentPanorama.id;
      
      if (textureCache[cacheKey]) {
        applyTexture(textureCache[cacheKey]);
      } else {
        textureLoader.load(currentPanorama.relativePath, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          textureCache[cacheKey] = texture;
          applyTexture(texture);
        });
      }
    }
    
    function applyTexture(texture) {
      if (currentMesh) {
        scene.remove(currentMesh);
        currentMesh.geometry.dispose();
        currentMesh.material.dispose();
      }
      
      hotspots.forEach(h => scene.remove(h.mesh));
      hotspots = [];
      
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
        
        const geo = new THREE.SphereGeometry(3, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ 
          color: color, 
          transparent: true, 
          opacity: 0.8 
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(h.position.x, h.position.y, h.position.z);
        mesh.userData = { hotspot: h };
        scene.add(mesh);
        hotspots.push({ mesh, data: h });
        
        // Add label
        if (h.label) {
          const div = document.createElement('div');
          div.className = 'hotspot-label';
          div.textContent = h.label;
          const label = new CSS2DObject(div);
          label.position.set(h.position.x, h.position.y + 5, h.position.z);
          scene.add(label);
        }
      });
      
      document.getElementById('loading').style.display = 'none';
    }
    
    window.addEventListener('click', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hotspots.map(h => h.mesh));
      
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
    
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    
    loadPanorama(0);
    animate();
  </script>
</body>
</html>`;
}