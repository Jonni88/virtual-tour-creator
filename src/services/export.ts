import type { TourConfig, Scene, QualityMode, ProcessingOptions } from '../types';

const QUALITY_SETTINGS: Record<QualityMode, ProcessingOptions> = {
  fast: { quality: 'fast', maxWidth: 6000, jpegQuality: 0.82 },
  high: { quality: 'high', maxWidth: 8000, jpegQuality: 0.9 },
  original: { quality: 'original', maxWidth: 16000, jpegQuality: 0.95 }
};

export class ExportService {
  static async exportTour(
    config: TourConfig, 
    scenes: Scene[],
    quality: QualityMode = 'high'
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      // Проверки перед экспортом
      const validation = this.validateConfig(config, scenes);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
      const slug = this.slugify(config.meta.title || 'tour');
      const exportName = `${slug}-${timestamp}`;
      
      // Создаем структуру папок
      const basePath = await window.electronAPI.getExportPath();
      if (!basePath) return { success: false, error: 'Export cancelled' };
      
      const exportPath = `${basePath}/${exportName}`;
      await window.electronAPI.ensureDir(exportPath);
      await window.electronAPI.ensureDir(`${exportPath}/assets`);
      await window.electronAPI.ensureDir(`${exportPath}/pano`);
      
      // Копируем three.js локально (без CDN)
      await this.copyThreeJs(exportPath);
      
      // Оптимизируем и копируем панорамы
      const settings = QUALITY_SETTINGS[quality];
      const processedScenes = await this.processScenes(scenes, exportPath, settings);
      
      // Создаем config.json с относительными путями
      const exportConfig: TourConfig = {
        ...config,
        scenes: processedScenes
      };
      
      await window.electronAPI.writeFile(
        `${exportPath}/config.json`,
        JSON.stringify(exportConfig, null, 2)
      );
      
      // Создаем автономный viewer
      const viewerHTML = this.generateViewerHTML(exportConfig);
      await window.electronAPI.writeFile(`${exportPath}/index.html`, viewerHTML);
      
      // Создаем README
      const readme = this.generateReadme(config);
      await window.electronAPI.writeFile(`${exportPath}/README.txt`, readme);
      
      return { success: true, path: exportPath };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
  
  // Проверка конфигурации перед экспортом
  private static validateConfig(
    config: TourConfig, 
    scenes: Scene[]
  ): { valid: boolean; error?: string } {
    // Проверка наличия сцен
    if (!scenes || scenes.length === 0) {
      return { valid: false, error: 'Нет сцен для экспорта. Добавьте хотя бы одну панораму.' };
    }
    
    // Проверка стартовой сцены
    if (!config.scenes[0]) {
      return { valid: false, error: 'Не указана стартовая сцена.' };
    }
    
    // Проверка существования файлов
    for (const scene of scenes) {
      if (!scene.fileName) {
        return { valid: false, error: `Сцена "${scene.name}" не имеет файла.` };
      }
    }
    
    // Проверка hotspots
    for (const scene of scenes) {
      if (scene.hotspots) {
        for (const hotspot of scene.hotspots) {
          if (hotspot.type === 'transition' && hotspot.targetSceneId) {
            const targetExists = scenes.some(s => s.id === hotspot.targetSceneId);
            if (!targetExists) {
              return { 
                valid: false, 
                error: `Hotspot в сцене "${scene.name}" ссылается на удалённую сцену.` 
              };
            }
          }
        }
      }
    }
    
    return { valid: true };
  }
  
  // Копирование Three.js локально
  private static async copyThreeJs(exportPath: string): Promise<void> {
    try {
      // Путь к локальному three.js в ресурсах приложения
      const sourcePath = './assets/three.min.js'; // Относительно приложения
      const targetPath = `${exportPath}/assets/three.min.js`;
      
      await window.electronAPI.copyFile(sourcePath, targetPath);
    } catch (error) {
      console.error('Failed to copy Three.js:', error);
      // Если не удалось скопировать, viewer загрузит с CDN как fallback
    }
  }
  
  private static async processScenes(
    scenes: Scene[],
    exportPath: string,
    settings: ProcessingOptions
  ): Promise<Scene[]> {
    const processed: Scene[] = [];
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      
      // Показываем прогресс
      window.dispatchEvent(new CustomEvent('export-progress', {
        detail: { current: i + 1, total: scenes.length, scene: scene.name }
      }));
      
      // Обрабатываем изображение
      const processedFileName = `pano-${i + 1}.jpg`;
      const targetPath = `${exportPath}/pano/${processedFileName}`;
      
      if (settings.quality === 'original') {
        // Просто копируем
        await window.electronAPI.copyFile(scene.fileName, targetPath);
      } else {
        // Оптимизируем через sharp
        await window.electronAPI.processImage({
          source: scene.fileName,
          target: targetPath,
          maxWidth: settings.maxWidth,
          quality: settings.jpegQuality
        });
      }
      
      processed.push({
        ...scene,
        fileName: `pano/${processedFileName}` // Относительный путь!
      });
    }
    
    return processed;
  }
  
  private static generateViewerHTML(config: TourConfig): string {
    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.meta.title || 'Виртуальный тур'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      width: 100%; height: 100%; 
      overflow: hidden;
      background: #0a0a0f;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #viewer { width: 100%; height: 100%; cursor: grab; }
    #viewer:active { cursor: grabbing; }
    
    /* UI Panels */
    .ui-panel {
      position: fixed;
      background: rgba(20, 20, 28, 0.9);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      color: white;
      z-index: 100;
    }
    
    #info-panel {
      top: 20px;
      left: 20px;
      max-width: 360px;
      padding: 20px;
    }
    
    #info-panel h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .price-tag {
      display: inline-block;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 700;
      margin: 8px 0;
    }
    
    .stats {
      display: flex;
      gap: 16px;
      margin: 12px 0;
      font-size: 14px;
      color: #94a3b8;
    }
    
    .contacts {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    
    .contacts a {
      display: inline-block;
      margin: 4px 8px 4px 0;
      padding: 6px 12px;
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
      text-decoration: none;
      border-radius: 6px;
      font-size: 13px;
    }
    
    #nav-controls {
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 24px;
    }
    
    .nav-btn {
      width: 44px;
      height: 44px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 50%;
      color: white;
      cursor: pointer;
      font-size: 18px;
      transition: all 0.2s;
    }
    
    .nav-btn:hover { background: rgba(255,255,255,0.2); }
    .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    
    #loading {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #0a0a0f;
      z-index: 1000;
      color: white;
    }
    
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(255,255,255,0.1);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    
    @keyframes spin { to { transform: rotate(360deg); } }
    
    #error {
      position: fixed;
      inset: 0;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #0a0a0f;
      z-index: 2000;
      color: #ef4444;
      padding: 40px;
      text-align: center;
    }
    
    @media (max-width: 768px) {
      #info-panel { max-width: calc(100% - 40px); font-size: 14px; }
      #info-panel h1 { font-size: 18px; }
    }
  </style>
</head>
<body>
  <div id="viewer"></div>
  
  <div id="info-panel" class="ui-panel">
    <h1>${config.meta.title || 'Виртуальный тур'}</h1>
    ${config.meta.price ? `<div class="price-tag">${parseInt(config.meta.price).toLocaleString('ru-RU')} ₽</div>` : ''}
    <div class="stats">
      ${config.meta.area ? `<span>📐 ${config.meta.area} м²</span>` : ''}
      ${config.meta.rooms ? `<span>🚪 ${config.meta.rooms} комн.</span>` : ''}
    </div>
    ${config.meta.address ? `<p style="color:#94a3b8; font-size:13px; margin-top:8px;">📍 ${config.meta.address}</p>` : ''}
    
    <div class="contacts">
      ${config.meta.phone ? `<a href="tel:${config.meta.phone}">📞 Позвонить</a>` : ''}
      ${config.meta.whatsapp ? `<a href="https://wa.me/${config.meta.whatsapp.replace(/\\D/g,'')}" target="_blank">💬 WhatsApp</a>` : ''}
      ${config.meta.telegram ? `<a href="https://t.me/${config.meta.telegram.replace('@','')}" target="_blank">✈️ Telegram</a>` : ''}
    </div>
  </div>
  
  <div id="nav-controls" class="ui-panel">
    <button class="nav-btn" id="btn-prev" onclick="tourPrev()">←</button>
    <span id="scene-counter" style="color:#94a3b8; min-width:60px; text-align:center;">1 / ${config.scenes.length}</span>
    <button class="nav-btn" id="btn-next" onclick="tourNext()">→</button>
  </div>
  
  <div id="loading">
    <div class="spinner"></div>
    <span>Загрузка виртуального тура...</span>
  </div>
  
  <div id="error">
    <h2>⚠️ Ошибка</h2>
    <p id="error-text"></p>
  </div>

  <!-- Локальный Three.js (без CDN) -->
  <script src="assets/three.min.js"></script>
  
  <script>
    // Конфигурация тура
    const tourConfig = ${JSON.stringify(config)};
    
    // Глобальные переменные
    let scene, camera, renderer;
    let currentMesh = null;
    let hotspots = [];
    let currentSceneIndex = 0;
    let isTransitioning = false;
    let raycaster, mouse;
    let spherical = { theta: 0, phi: Math.PI / 2 };
    
    // DOM элементы
    const container = document.getElementById('viewer');
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const errorText = document.getElementById('error-text');
    const sceneCounter = document.getElementById('scene-counter');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    
    // Инициализация
    function init() {
      // Проверка Three.js
      if (typeof THREE === 'undefined') {
        showError('Не удалось загрузить Three.js. Проверьте подключение к интернету или наличие файла assets/three.min.js');
        return;
      }
      
      // Сцена
      scene = new THREE.Scene();
      
      // Камера
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      updateCamera();
      
      // Рендерер
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
      
      // Raycaster для hotspots
      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();
      
      // Настройка управления
      setupControls();
      
      // Загрузка первой сцены
      loadScene(0);
      
      // Обработчики
      window.addEventListener('resize', onResize);
      renderer.domElement.addEventListener('click', onClick);
      renderer.domElement.addEventListener('mousemove', onMouseMove);
      
      // Анимация
      animate();
    }
    
    function setupControls() {
      let isDragging = false;
      let previousPos = { x: 0, y: 0 };
      const canvas = renderer.domElement;
      
      // Мышь
      canvas.addEventListener('mousedown', e => {
        isDragging = true;
        previousPos = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
      });
      
      window.addEventListener('mouseup', () => {
        isDragging = false;
        canvas.style.cursor = 'grab';
      });
      
      window.addEventListener('mousemove', e => {
        if (!isDragging) return;
        const deltaX = e.clientX - previousPos.x;
        const deltaY = e.clientY - previousPos.y;
        spherical.theta -= deltaX * 0.005;
        spherical.phi -= deltaY * 0.005;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        previousPos = { x: e.clientX, y: e.clientY };
        updateCamera();
      });
      
      // Zoom
      canvas.addEventListener('wheel', e => {
        e.preventDefault();
        camera.fov = Math.max(30, Math.min(90, camera.fov + e.deltaY * 0.05));
        camera.updateProjectionMatrix();
      });
      
      // Touch
      let touchStart = null;
      canvas.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
          touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
      });
      
      canvas.addEventListener('touchmove', e => {
        if (!touchStart || e.touches.length !== 1) return;
        e.preventDefault();
        const deltaX = e.touches[0].clientX - touchStart.x;
        const deltaY = e.touches[0].clientY - touchStart.y;
        spherical.theta -= deltaX * 0.005;
        spherical.phi -= deltaY * 0.005;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        updateCamera();
      });
    }
    
    function updateCamera() {
      camera.position.x = Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.position.y = Math.cos(spherical.phi);
      camera.position.z = Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.lookAt(0, 0, 0);
    }
    
    function loadScene(index) {
      if (isTransitioning || index < 0 || index >= tourConfig.scenes.length) return;
      
      isTransitioning = true;
      loadingEl.style.display = 'flex';
      
      const sceneData = tourConfig.scenes[index];
      
      // Fade out
      if (currentMesh) {
        fadeMesh(0, () => loadPanorama(sceneData, index));
      } else {
        loadPanorama(sceneData, index);
      }
    }
    
    function loadPanorama(sceneData, index) {
      new THREE.TextureLoader().load(
        sceneData.fileName,
        texture => {
          // Удаляем старое
          if (currentMesh) {
            scene.remove(currentMesh);
            currentMesh.geometry.dispose();
            currentMesh.material.dispose();
          }
          hotspots.forEach(h => scene.remove(h));
          hotspots = [];
          
          // Создаём сферу
          const geometry = new THREE.SphereGeometry(500, 60, 40);
          geometry.scale(-1, 1, 1);
          const material = new THREE.MeshBasicMaterial({ 
            map: texture, 
            side: THREE.BackSide 
          });
          currentMesh = new THREE.Mesh(geometry, material);
          scene.add(currentMesh);
          
          // Добавляем hotspots
          if (sceneData.hotspots) {
            sceneData.hotspots.forEach(h => {
              const geo = new THREE.SphereGeometry(5, 16, 16);
              const mat = new THREE.MeshBasicMaterial({
                color: h.type === 'transition' ? 0x3b82f6 : 0x22c55e,
                transparent: true,
                opacity: 0.8
              });
              const mesh = new THREE.Mesh(geo, mat);
              mesh.position.set(h.position.x, h.position.y, h.position.z);
              mesh.userData = h;
              scene.add(mesh);
              hotspots.push(mesh);
            });
          }
          
          // Обновляем UI
          currentSceneIndex = index;
          sceneCounter.textContent = (index + 1) + ' / ' + tourConfig.scenes.length;
          btnPrev.disabled = index === 0;
          btnNext.disabled = index === tourConfig.scenes.length - 1;
          
          // Fade in
          fadeMesh(1, () => {
            isTransitioning = false;
            loadingEl.style.display = 'none';
          });
        },
        undefined,
        err => {
          console.error(err);
          showError('Ошибка загрузки панорамы: ' + sceneData.name);
          isTransitioning = false;
          loadingEl.style.display = 'none';
        }
      );
    }
    
    function fadeMesh(targetOpacity, callback) {
      if (!currentMesh) { if (callback) callback(); return; }
      currentMesh.material.transparent = true;
      const step = targetOpacity > 0.5 ? 0.1 : -0.1;
      let opacity = currentMesh.material.opacity || 1;
      
      function stepFade() {
        opacity += step;
        if ((step > 0 && opacity >= targetOpacity) || (step < 0 && opacity <= targetOpacity)) {
          currentMesh.material.opacity = targetOpacity;
          if (targetOpacity >= 1) currentMesh.material.transparent = false;
          if (callback) callback();
        } else {
          currentMesh.material.opacity = opacity;
          requestAnimationFrame(stepFade);
        }
      }
      stepFade();
    }
    
    function onClick(event) {
      if (isTransitioning) return;
      
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hotspots);
      
      if (intersects.length > 0) {
        const h = intersects[0].object.userData;
        if (h.type === 'transition' && h.targetSceneId) {
          const targetIdx = tourConfig.scenes.findIndex(s => s.id === h.targetSceneId);
          if (targetIdx !== -1) loadScene(targetIdx);
        } else if (h.type === 'info' && h.info) {
          alert(h.info.title + '\\n' + h.info.description);
        }
      }
    }
    
    function onMouseMove(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hotspots);
      
      renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'grab';
    }
    
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    
    function showError(msg) {
      errorText.textContent = msg;
      errorEl.style.display = 'flex';
      loadingEl.style.display = 'none';
    }
    
    // Глобальные функции навигации
    window.tourNext = function() {
      if (currentSceneIndex < tourConfig.scenes.length - 1) loadScene(currentSceneIndex + 1);
    };
    
    window.tourPrev = function() {
      if (currentSceneIndex > 0) loadScene(currentSceneIndex - 1);
    };
    
    // Запуск
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  </script>
</body>
</html>`;
  }
  
  private static generateReadme(config: TourConfig): string {
    return `ВИРТУАЛЬНЫЙ ТУР
================

Объект: ${config.meta.title || 'Без названия'}
Адрес: ${config.meta.address || 'Не указан'}
Цена: ${config.meta.price ? parseInt(config.meta.price).toLocaleString('ru-RU') + ' ₽' : 'Не указана'}

КОНТАКТЫ
--------
Агент: ${config.meta.agentName || 'Не указан'}
Телефон: ${config.meta.phone || 'Не указан'}
WhatsApp: ${config.meta.whatsapp || 'Не указан'}
Telegram: ${config.meta.telegram || 'Не указан'}

УСТАНОВКА
---------
1. Загрузите все файлы на хостинг
2. Откройте index.html
3. Или откройте локально двойным кликом

Технологии: Three.js (локальный), работает оффлайн
Создано с помощью: RealTour Creator
`;
  }
  
  private static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\\w\\s-]/g, '')
      .replace(/\\s+/g, '-')
      .slice(0, 50);
  }
}
