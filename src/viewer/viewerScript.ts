// Полноценный viewer для экспортируемых туров
// Встраивается напрямую в index.html без CDN

export const VIEWER_SCRIPT = `
(function() {
  'use strict';
  
  // Three.js минимальный набор (inline для автономности)
  const THREE_JS = \`${getThreeJsCode()}\`;
  
  // Загружаем Three.js
  const script = document.createElement('script');
  script.textContent = THREE_JS;
  document.head.appendChild(script);
  
  // Инициализация после загрузки Three.js
  script.onload = function() {
    initViewer();
  };
  
  function initViewer() {
    const config = window.tourConfig;
    if (!config || !config.scenes || config.scenes.length === 0) {
      showError('Нет данных для отображения тура');
      return;
    }
    
    // Состояние
    let currentSceneIndex = 0;
    let isTransitioning = false;
    let scene, camera, renderer, controls;
    let currentMesh = null;
    let hotspots = [];
    let raycaster, mouse;
    
    // DOM элементы
    const container = document.getElementById('viewer');
    const loadingEl = document.getElementById('loading');
    const sceneInfoEl = document.getElementById('scene-info');
    const progressEl = document.getElementById('progress');
    
    // Инициализация Three.js
    function init() {
      // Сцена
      scene = new THREE.Scene();
      
      // Камера
      camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      
      // Рендерер
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
      
      // Орбит контролы (упрощённые)
      setupControls();
      
      // Raycaster для hotspots
      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();
      
      // Загружаем первую сцену
      loadScene(0);
      
      // Обработчики событий
      window.addEventListener('resize', onWindowResize);
      renderer.domElement.addEventListener('click', onClick);
      renderer.domElement.addEventListener('mousemove', onMouseMove);
      
      // Анимация
      animate();
    }
    
    function setupControls() {
      // Упрощённая реализация orbit controls
      let isDragging = false;
      let previousMousePosition = { x: 0, y: 0 };
      let spherical = new THREE.Spherical(1, Math.PI / 2, 0);
      
      const canvas = renderer.domElement;
      
      canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
      });
      
      window.addEventListener('mouseup', () => {
        isDragging = false;
        canvas.style.cursor = 'grab';
      });
      
      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaMove = {
          x: e.clientX - previousMousePosition.x,
          y: e.clientY - previousMousePosition.y
        };
        
        spherical.theta -= deltaMove.x * 0.005;
        spherical.phi -= deltaMove.y * 0.005;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        
        previousMousePosition = { x: e.clientX, y: e.clientY };
        
        updateCamera();
      });
      
      // Zoom колесом мыши
      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const fov = camera.fov + e.deltaY * 0.05;
        camera.fov = Math.max(30, Math.min(90, fov));
        camera.updateProjectionMatrix();
      });
      
      // Touch для мобильных
      let touchStart = null;
      canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
      });
      
      canvas.addEventListener('touchmove', (e) => {
        if (!touchStart || e.touches.length !== 1) return;
        e.preventDefault();
        
        const deltaMove = {
          x: e.touches[0].clientX - touchStart.x,
          y: e.touches[0].clientY - touchStart.y
        };
        
        spherical.theta -= deltaMove.x * 0.005;
        spherical.phi -= deltaMove.y * 0.005;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        
        updateCamera();
      });
      
      function updateCamera() {
        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);
      }
      
      // Начальная позиция
      updateCamera();
      
      // Сохраняем для использования в других функциях
      controls = { spherical };
    }
    
    function loadScene(index) {
      if (isTransitioning || index < 0 || index >= config.scenes.length) return;
      
      isTransitioning = true;
      loadingEl.style.display = 'flex';
      
      const sceneData = config.scenes[index];
      
      // Fade out
      if (currentMesh) {
        fadeOut(() => {
          loadPanorama(sceneData, index);
        });
      } else {
        loadPanorama(sceneData, index);
      }
    }
    
    function loadPanorama(sceneData, index) {
      const loader = new THREE.TextureLoader();
      
      loader.load(
        sceneData.fileName,
        function(texture) {
          // Удаляем старую сферу
          if (currentMesh) {
            scene.remove(currentMesh);
            currentMesh.geometry.dispose();
            currentMesh.material.dispose();
          }
          
          // Удаляем старые hotspots
          hotspots.forEach(h => scene.remove(h.mesh));
          hotspots = [];
          
          // Создаём новую сферу
          const geometry = new THREE.SphereGeometry(500, 60, 40);
          geometry.scale(-1, 1, 1); // Инвертируем для внутреннего вида
          
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide
          });
          
          currentMesh = new THREE.Mesh(geometry, material);
          scene.add(currentMesh);
          
          // Добавляем hotspots
          if (sceneData.hotspots) {
            sceneData.hotspots.forEach(hotspotData => {
              addHotspot(hotspotData);
            });
          }
          
          // Обновляем UI
          currentSceneIndex = index;
          updateUI(sceneData);
          
          // Fade in
          fadeIn(() => {
            isTransitioning = false;
            loadingEl.style.display = 'none';
          });
        },
        undefined,
        function(error) {
          console.error('Ошибка загрузки панорамы:', error);
          showError('Не удалось загрузить панораму: ' + sceneData.name);
          isTransitioning = false;
          loadingEl.style.display = 'none';
        }
      );
    }
    
    function addHotspot(data) {
      const geometry = new THREE.SphereGeometry(5, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: data.type === 'transition' ? 0x3b82f6 : 0x22c55e,
        transparent: true,
        opacity: 0.8
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(data.position.x, data.position.y, data.position.z);
      mesh.userData = data;
      
      scene.add(mesh);
      hotspots.push({ mesh, data });
    }
    
    function fadeOut(callback) {
      let opacity = 1;
      const fade = setInterval(() => {
        opacity -= 0.1;
        if (currentMesh) currentMesh.material.opacity = opacity;
        if (opacity <= 0) {
          clearInterval(fade);
          if (callback) callback();
        }
      }, 30);
    }
    
    function fadeIn(callback) {
      let opacity = 0;
      if (currentMesh) currentMesh.material.transparent = true;
      const fade = setInterval(() => {
        opacity += 0.1;
        if (currentMesh) currentMesh.material.opacity = opacity;
        if (opacity >= 1) {
          clearInterval(fade);
          if (currentMesh) currentMesh.material.transparent = false;
          if (callback) callback();
        }
      }, 30);
    }
    
    function onClick(event) {
      if (isTransitioning) return;
      
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hotspots.map(h => h.mesh));
      
      if (intersects.length > 0) {
        const hotspot = intersects[0].object.userData;
        
        if (hotspot.type === 'transition' && hotspot.targetSceneId) {
          const targetIndex = config.scenes.findIndex(s => s.id === hotspot.targetSceneId);
          if (targetIndex !== -1) {
            loadScene(targetIndex);
          }
        } else if (hotspot.type === 'info' && hotspot.info) {
          showInfoCard(hotspot.info);
        }
      }
    }
    
    function onMouseMove(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hotspots.map(h => h.mesh));
      
      // Меняем курсор
      renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'grab';
      
      // Подсвечиваем hotspots
      hotspots.forEach(h => {
        h.mesh.scale.setScalar(1);
        h.mesh.material.opacity = 0.8;
      });
      
      if (intersects.length > 0) {
        const hotspot = intersects[0].object;
        hotspot.scale.setScalar(1.2);
        hotspot.material.opacity = 1;
        
        // Показываем tooltip
        if (hotspot.userData.label) {
          showTooltip(hotspot.userData.label, event.clientX, event.clientY);
        }
      } else {
        hideTooltip();
      }
    }
    
    function showTooltip(text, x, y) {
      let tooltip = document.getElementById('tooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'tooltip';
        tooltip.style.cssText = \`
          position: fixed;
          background: rgba(0,0,0,0.9);
          color: white;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          pointer-events: none;
          z-index: 1000;
          white-space: nowrap;
        \`;
        document.body.appendChild(tooltip);
      }
      tooltip.textContent = text;
      tooltip.style.left = x + 10 + 'px';
      tooltip.style.top = y - 30 + 'px';
      tooltip.style.display = 'block';
    }
    
    function hideTooltip() {
      const tooltip = document.getElementById('tooltip');
      if (tooltip) tooltip.style.display = 'none';
    }
    
    function showInfoCard(info) {
      // Простая реализация info карточки
      alert(info.title + '\\n\\n' + info.description);
    }
    
    function updateUI(sceneData) {
      // Обновляем счётчик
      if (progressEl) {
        progressEl.textContent = (currentSceneIndex + 1) + ' / ' + config.scenes.length;
      }
      
      // Обновляем информацию о сцене
      if (sceneInfoEl) {
        sceneInfoEl.textContent = sceneData.name;
      }
      
      // Обновляем кнопки навигации
      updateNavButtons();
    }
    
    function updateNavButtons() {
      const prevBtn = document.getElementById('btn-prev');
      const nextBtn = document.getElementById('btn-next');
      
      if (prevBtn) prevBtn.disabled = currentSceneIndex === 0;
      if (nextBtn) nextBtn.disabled = currentSceneIndex === config.scenes.length - 1;
    }
    
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    
    function showError(message) {
      const errorEl = document.getElementById('error');
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
      }
    }
    
    // Глобальные функции для навигации
    window.tourNext = function() {
      if (currentSceneIndex < config.scenes.length - 1) {
        loadScene(currentSceneIndex + 1);
      }
    };
    
    window.tourPrev = function() {
      if (currentSceneIndex > 0) {
        loadScene(currentSceneIndex - 1);
      }
    };
    
    // Запускаем
    init();
    updateNavButtons();
  }
  
  // Запускаем viewer
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initViewer);
  } else {
    initViewer();
  }
})();
`;

// Функция для получения кода Three.js (будет заменена на inline версию)
function getThreeJsCode(): string {
  // В реальном экспорте сюда вставляется минимизированный Three.js
  // Пока возвращаем placeholder - в реальном коде нужно встроить Three.js
  return '/* THREE.JS CODE PLACEHOLDER - REPLACE WITH ACTUAL THREE.JS BUILD */';
}
