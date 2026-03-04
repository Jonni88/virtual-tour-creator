import type { TourConfig, Scene, QualityMode, ProcessingOptions } from '../types';

const QUALITY_SETTINGS: Record<QualityMode, ProcessingOptions> = {
  fast: { quality: 'fast', maxWidth: 6000, jpegQuality: 0.8 },
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
      
      // Оптимизируем и копируем панорамы
      const settings = QUALITY_SETTINGS[quality];
      const processedScenes = await this.processScenes(scenes, exportPath, settings);
      
      // Создаем config.json
      const exportConfig: TourConfig = {
        ...config,
        scenes: processedScenes
      };
      
      await window.electronAPI.writeFile(
        `${exportPath}/config.json`,
        JSON.stringify(exportConfig, null, 2)
      );
      
      // Копируем viewer
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
        // Оптимизируем через sharp если доступен, иначе canvas
        await window.electronAPI.processImage({
          source: scene.fileName,
          target: targetPath,
          maxWidth: settings.maxWidth,
          quality: settings.jpegQuality
        });
      }
      
      processed.push({
        ...scene,
        fileName: `pano/${processedFileName}`
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${this.getViewerStyles(config.ui)}</style>
</head>
<body>
  <div id="viewer"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r160/three.min.js"></script>
  <script>${this.getViewerScript()}</script>
  <script>
    window.tourConfig = ${JSON.stringify(config)};
    window.tourViewer = new TourViewer('viewer', window.tourConfig);
  </script>
</body>
</html>`;
  }
  
  private static getViewerStyles(ui: TourConfig['ui']): string {
    return `
      :root {
        --accent: ${ui.accent};
        --bg: ${ui.theme === 'dark' ? '#0a0a0f' : '#ffffff'};
        --surface: ${ui.theme === 'dark' ? 'rgba(20,20,28,0.9)' : 'rgba(255,255,255,0.9)'};
        --text: ${ui.theme === 'dark' ? '#ffffff' : '#1a1a1a'};
        --text-muted: ${ui.theme === 'dark' ? '#94a3b8' : '#64748b'};
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); overflow: hidden; }
      #viewer { width: 100vw; height: 100vh; }
      .ui-panel { position: fixed; background: var(--surface); backdrop-filter: blur(20px); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.1); }
      .info-panel { top: 20px; left: 20px; max-width: 360px; }
      .contacts-panel { bottom: 20px; left: 20px; display: flex; gap: 12px; }
      .btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; background: var(--accent); color: white; border-radius: 12px; text-decoration: none; font-weight: 500; transition: all 0.2s; }
      .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    `;
  }
  
  private static getViewerScript(): string {
    // Минимальный viewer код
    return `
      class TourViewer {
        constructor(containerId, config) {
          this.container = document.getElementById(containerId);
          this.config = config;
          this.currentScene = 0;
          this.init();
        }
        init() {
          this.scene = new THREE.Scene();
          this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
          this.renderer = new THREE.WebGLRenderer({ antialias: true });
          this.renderer.setSize(window.innerWidth, window.innerHeight);
          this.container.appendChild(this.renderer.domElement);
          this.loadScene(0);
          this.animate();
        }
        loadScene(index) {
          // Загрузка сцены
          const scene = this.config.scenes[index];
          // ... реализация загрузки панорамы
        }
        animate() {
          requestAnimationFrame(() => this.animate());
          this.renderer.render(this.scene, this.camera);
        }
      }
    `;
  }
  
  private static generateReadme(config: TourConfig): string {
    return `ВИРТУАЛЬНЫЙ ТУР
================

Объект: ${config.meta.title}
Адрес: ${config.meta.address}
Цена: ${config.meta.price}

КОНТАКТЫ
--------
Агент: ${config.meta.agentName}
Телефон: ${config.meta.phone}
WhatsApp: ${config.meta.whatsapp}
Telegram: ${config.meta.telegram}

УСТАНОВКА
---------
1. Загрузите все файлы на хостинг
2. Откройте index.html
3. Или откройте локально двойным кликом

Технологии: Three.js, работает на всех устройствах
`;
  }
  
  private static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50);
  }
}
