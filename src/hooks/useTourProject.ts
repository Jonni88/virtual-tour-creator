import { useState, useCallback, useRef, useEffect } from 'react';
import type { TourConfig, Scene, Hotspot, QualityMode } from '../types';
import { DEFAULT_CONFIG } from '../types';
import { ProjectService } from '../services/project';
import { ExportService } from '../services/export';
import { KeyboardService } from '../services/keyboard';

// History для undo/redo
class HistoryManager<T> {
  private states: T[] = [];
  private index = -1;
  private maxSize = 50;
  
  push(state: T) {
    if (this.index < this.states.length - 1) {
      this.states = this.states.slice(0, this.index + 1);
    }
    this.states.push(JSON.parse(JSON.stringify(state)));
    if (this.states.length > this.maxSize) {
      this.states.shift();
    } else {
      this.index++;
    }
  }
  
  undo(): T | null {
    if (this.index > 0) {
      this.index--;
      return JSON.parse(JSON.stringify(this.states[this.index]));
    }
    return null;
  }
  
  redo(): T | null {
    if (this.index < this.states.length - 1) {
      this.index++;
      return JSON.parse(JSON.stringify(this.states[this.index]));
    }
    return null;
  }
  
  canUndo() { return this.index > 0; }
  canRedo() { return this.index < this.states.length - 1; }
}

export function useTourProject() {
  const [config, setConfig] = useState<TourConfig>(DEFAULT_CONFIG);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentProjects, setRecentProjects] = useState<string[]>([]);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number; scene: string } | null>(null);
  
  const historyRef = useRef(new HistoryManager<TourConfig>());
  const keyboardRef = useRef<KeyboardService | null>(null);
  const isUpdatingRef = useRef(false);
  
  const selectedScene = config.scenes.find(s => s.id === selectedSceneId) || null;
  
  // Загрузка recent projects
  useEffect(() => {
    ProjectService.getRecentProjects().then(setRecentProjects);
  }, []);
  
  // Инициализация клавиатуры
  useEffect(() => {
    keyboardRef.current = new KeyboardService({
      onSave: () => handleSave(),
      onExport: () => handleExport(),
      onDeleteHotspot: () => {
        // Реализовать удаление выбранного хотспота
      },
      onUndo: undo,
      onRedo: redo,
      onPreview: () => setIsPreviewMode(prev => !prev)
    });
    
    return () => keyboardRef.current?.disable();
  }, []);
  
  // Autosave
  useEffect(() => {
    ProjectService.startAutosave(() => config);
    return () => ProjectService.stopAutosave();
  }, [config]);
  
  const saveToHistory = useCallback((newConfig: TourConfig) => {
    if (!isUpdatingRef.current) {
      historyRef.current.push(newConfig);
    }
  }, []);
  
  // Создание нового проекта
  const createNewProject = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setSelectedSceneId(null);
    historyRef.current = new HistoryManager();
    historyRef.current.push(DEFAULT_CONFIG);
  }, []);
  
  // Добавление сцен (панорам)
  const addScenes = useCallback(async (files: (File & { path?: string })[]) => {
    setIsLoading(true);
    
    const newScenes: Scene[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const scene: Scene = {
        id: `scene-${Date.now()}-${i}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        fileName: file.path || file.name,
        thumbnail: '', // Генерируется позже
        position: { x: 0, y: 0, z: 0.1 },
        hotspots: []
      };
      newScenes.push(scene);
    }
    
    setConfig(prev => {
      const updated = {
        ...prev,
        scenes: [...prev.scenes, ...newScenes]
      };
      saveToHistory(updated);
      return updated;
    });
    
    if (!selectedSceneId && newScenes.length > 0) {
      setSelectedSceneId(newScenes[0].id);
    }
    
    setIsLoading(false);
  }, [saveToHistory, selectedSceneId]);
  
  // Обновление мета-информации
  const updateMeta = useCallback((updates: Partial<TourConfig['meta']>) => {
    setConfig(prev => {
      const updated = {
        ...prev,
        meta: { ...prev.meta, ...updates }
      };
      saveToHistory(updated);
      return updated;
    });
  }, [saveToHistory]);
  
  // Добавление хотспота
  const addHotspot = useCallback((sceneId: string, hotspot: Omit<Hotspot, 'id'>) => {
    const newHotspot: Hotspot = {
      ...hotspot,
      id: `hs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    setConfig(prev => {
      const updated = {
        ...prev,
        scenes: prev.scenes.map(s =>
          s.id === sceneId
            ? { ...s, hotspots: [...s.hotspots, newHotspot] }
            : s
        )
      };
      saveToHistory(updated);
      return updated;
    });
  }, [saveToHistory]);
  
  // Удаление хотспота
  const removeHotspot = useCallback((sceneId: string, hotspotId: string) => {
    setConfig(prev => {
      const updated = {
        ...prev,
        scenes: prev.scenes.map(s =>
          s.id === sceneId
            ? { ...s, hotspots: s.hotspots.filter(h => h.id !== hotspotId) }
            : s
        )
      };
      saveToHistory(updated);
      return updated;
    });
  }, [saveToHistory]);
  
  // Undo/Redo
  const undo = useCallback(() => {
    const prev = historyRef.current.undo();
    if (prev) {
      isUpdatingRef.current = true;
      setConfig(prev);
      isUpdatingRef.current = false;
    }
  }, []);
  
  const redo = useCallback(() => {
    const next = historyRef.current.redo();
    if (next) {
      isUpdatingRef.current = true;
      setConfig(next);
      isUpdatingRef.current = false;
    }
  }, []);
  
  // Сохранение проекта
  const handleSave = useCallback(async () => {
    const result = await ProjectService.saveProject(config);
    if (result.success) {
      // Показать уведомление
    }
    return result;
  }, [config]);
  
  // Загрузка проекта
  const handleLoad = useCallback(async () => {
    const result = await ProjectService.loadProject();
    if (result.success && result.config) {
      setConfig(result.config);
      setSelectedSceneId(result.config.scenes[0]?.id || null);
      historyRef.current = new HistoryManager();
      historyRef.current.push(result.config);
    }
    return result;
  }, []);
  
  // Экспорт
  const handleExport = useCallback(async (quality: QualityMode = 'high') => {
    setExportProgress({ current: 0, total: config.scenes.length, scene: '' });
    
    // Слушаем прогресс
    const progressHandler = (e: CustomEvent) => {
      setExportProgress(e.detail);
    };
    window.addEventListener('export-progress', progressHandler as EventListener);
    
    const result = await ExportService.exportTour(config, config.scenes, quality);
    
    window.removeEventListener('export-progress', progressHandler as EventListener);
    setExportProgress(null);
    
    return result;
  }, [config]);
  
  return {
    config,
    selectedScene,
    selectedSceneId,
    isPreviewMode,
    isLoading,
    recentProjects,
    exportProgress,
    canUndo: historyRef.current.canUndo(),
    canRedo: historyRef.current.canRedo(),
    
    // Actions
    createNewProject,
    addScenes,
    updateMeta,
    addHotspot,
    removeHotspot,
    selectScene: setSelectedSceneId,
    setIsPreviewMode,
    undo,
    redo,
    saveProject: handleSave,
    loadProject: handleLoad,
    exportTour: handleExport
  };
}
