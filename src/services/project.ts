import type { TourConfig, ProjectFile } from '../types';

const AUTOSAVE_INTERVAL = 30000; // 30 секунд
const MAX_RECENT_PROJECTS = 10;

export class ProjectService {
  private static autosaveTimer: ReturnType<typeof setInterval> | null = null;
  private static currentProjectPath: string | null = null;
  
  static async saveProject(
    config: TourConfig,
    path?: string
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const filePath = path || await window.electronAPI.saveProjectDialog();
      if (!filePath) return { success: false, error: 'Save cancelled' };
      
      const projectFile: ProjectFile = {
        config,
        originalFiles: config.scenes.map(s => s.fileName),
        exportedAt: new Date().toISOString()
      };
      
      await window.electronAPI.writeFile(filePath as string, JSON.stringify(projectFile, null, 2));
      
      this.currentProjectPath = filePath as string;
      await this.addToRecent(filePath as string);
      
      return { success: true, path: filePath };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
  
  static async loadProject(): Promise<{ success: boolean; config?: TourConfig; error?: string }> {
    try {
      const filePath = await window.electronAPI.loadProjectDialog();
      if (!filePath) return { success: false, error: 'Load cancelled' };
      
      const result = await window.electronAPI.readFile(filePath as string);
      if (!result.success) return { success: false, error: result.error };
      
      const projectFile: ProjectFile = JSON.parse(result.data!);
      
      // Проверяем версию и мигрируем если нужно
      const config = this.migrateConfig(projectFile.config);
      
      this.currentProjectPath = filePath as string;
      await this.addToRecent(filePath as string);
      
      return { success: true, config };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
  
  static async loadRecentProject(path: string): Promise<{ success: boolean; config?: TourConfig; error?: string }> {
    this.currentProjectPath = path;
    const result = await window.electronAPI.readFile(path);
    if (!result.success) return { success: false, error: result.error };
    
    try {
      const projectFile: ProjectFile = JSON.parse(result.data!);
      return { success: true, config: this.migrateConfig(projectFile.config) };
    } catch (error) {
      return { success: false, error: 'Invalid project file' };
    }
  }
  
  static startAutosave(getConfig: () => TourConfig) {
    this.stopAutosave();
    
    this.autosaveTimer = setInterval(async () => {
      if (this.currentProjectPath) {
        await this.saveProject(getConfig(), this.currentProjectPath);
        console.log('Autosaved at', new Date().toLocaleTimeString());
      }
    }, AUTOSAVE_INTERVAL);
  }
  
  static stopAutosave() {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
    }
  }
  
  static async getRecentProjects(): Promise<string[]> {
    try {
      const recent = await window.electronAPI.getStoreValue('recentProjects');
      return recent || [];
    } catch {
      return [];
    }
  }
  
  private static async addToRecent(path: string) {
    const recent = await this.getRecentProjects();
    const filtered = recent.filter(p => p !== path);
    filtered.unshift(path);
    
    await window.electronAPI.setStoreValue(
      'recentProjects',
      filtered.slice(0, MAX_RECENT_PROJECTS)
    );
  }
  
  private static migrateConfig(config: TourConfig): TourConfig {
    // Миграция старых конфигов в новый формат
    if (!config.version) {
      return {
        ...config,
        version: '1.0',
        ui: config.ui || {
          theme: 'dark',
          accent: '#d4af37',
          showContacts: true,
          showMinimap: true,
          showHotspotLabels: true
        }
      };
    }
    return config;
  }
  
  static getCurrentProjectPath(): string | null {
    return this.currentProjectPath;
  }
  
  static hasUnsavedChanges(original: TourConfig, current: TourConfig): boolean {
    return JSON.stringify(original) !== JSON.stringify(current);
  }
}