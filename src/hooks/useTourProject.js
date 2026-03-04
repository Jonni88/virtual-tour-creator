import { useState, useCallback } from 'react';

export function useTourProject() {
  const [project, setProject] = useState({
    name: 'New Tour',
    panoramas: [],
    hotspots: [],
    basePath: null
  });
  const [selectedPanorama, setSelectedPanorama] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

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
      startPosition: { x: 0, y: 0, z: 0 }
    }));

    setProject(prev => ({
      ...prev,
      panoramas,
      basePath: folderPath
    }));

    if (panoramas.length > 0) {
      setSelectedPanorama(panoramas[0]);
    }

    return { success: true, count: panoramas.length };
  }, []);

  // Select panorama
  const selectPanorama = useCallback((panorama) => {
    setSelectedPanorama(panorama);
  }, []);

  // Add hotspot
  const addHotspot = useCallback((panoramaId, position, targetPanoramaId, label = '') => {
    const hotspot = {
      id: `hotspot-${Date.now()}`,
      panoramaId,
      position,
      targetPanoramaId,
      label,
      createdAt: Date.now()
    };

    setProject(prev => ({
      ...prev,
      hotspots: [...prev.hotspots, hotspot]
    }));

    return hotspot;
  }, []);

  // Remove hotspot
  const removeHotspot = useCallback((hotspotId) => {
    setProject(prev => ({
      ...prev,
      hotspots: prev.hotspots.filter(h => h.id !== hotspotId)
    }));
  }, []);

  // Get hotspots for current panorama
  const getPanoramaHotspots = useCallback((panoramaId) => {
    return project.hotspots.filter(h => h.panoramaId === panoramaId);
  }, [project.hotspots]);

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
      setProject(loadedProject);
      if (loadedProject.panoramas.length > 0) {
        setSelectedPanorama(loadedProject.panoramas[0]);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Invalid project file' };
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
        panoramas: project.panoramas.map(p => ({
          id: p.id,
          name: p.name,
          relativePath: `panoramas/${p.relativePath}`,
          startPosition: p.startPosition
        })),
        hotspots: project.hotspots
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

  return {
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
    body { background: #000; overflow: hidden; font-family: sans-serif; }
    #canvas { width: 100vw; height: 100vh; }
    #info {
      position: fixed;
      top: 10px;
      left: 10px;
      color: white;
      background: rgba(0,0,0,0.5);
      padding: 10px;
      border-radius: 5px;
      pointer-events: none;
    }
    .loading {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 24px;
    }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <div id="info">${tourData.name} - Drag to look around, click hotspots to navigate</div>
  <div id="loading" class="loading">Loading...</div>
  
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
    let currentPanorama = tourData.panoramas[0];
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.rotateSpeed = -0.3;
    
    const textureLoader = new THREE.TextureLoader();
    let currentMesh = null;
    let hotspots = [];
    
    function loadPanorama(pano) {
      document.getElementById('loading').style.display = 'block';
      
      textureLoader.load(pano.relativePath, (texture) => {
        if (currentMesh) {
          scene.remove(currentMesh);
          currentMesh.geometry.dispose();
          currentMesh.material.dispose();
        }
        
        hotspots.forEach(h => scene.remove(h.mesh));
        hotspots = [];
        
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ map: texture });
        currentMesh = new THREE.Mesh(geometry, material);
        scene.add(currentMesh);
        
        // Add hotspots
        const panoHotspots = tourData.hotspots.filter(h => h.panoramaId === pano.id);
        panoHotspots.forEach(h => {
          const markerGeo = new THREE.SphereGeometry(2, 16, 16);
          const markerMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
          const marker = new THREE.Mesh(markerGeo, markerMat);
          marker.position.set(h.position.x, h.position.y, h.position.z);
          marker.userData = { hotspot: h };
          scene.add(marker);
          hotspots.push({ mesh: marker, data: h });
        });
        
        currentPanorama = pano;
        document.getElementById('loading').style.display = 'none';
      });
    }
    
    // Raycaster for hotspot clicking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    window.addEventListener('click', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hotspots.map(h => h.mesh));
      
      if (intersects.length > 0) {
        const targetId = intersects[0].object.userData.hotspot.targetPanoramaId;
        const targetPano = tourData.panoramas.find(p => p.id === targetId);
        if (targetPano) loadPanorama(targetPano);
      }
    });
    
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    loadPanorama(currentPanorama);
    
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
  </script>
</body>
</html>`;
}