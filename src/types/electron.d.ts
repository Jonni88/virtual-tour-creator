export {};

declare global {
  interface Window {
    electronAPI: {
      // Dialogs (legacy)
      openFolder: () => Promise<string | undefined>;
      saveProject: () => Promise<string | undefined>;
      loadProject: () => Promise<string | undefined>;
      exportTour: () => Promise<string | undefined>;
      
      // Dialogs (v2.0)
      saveProjectDialog: () => Promise<string | undefined>;
      loadProjectDialog: () => Promise<string | undefined>;
      getExportPath: () => Promise<string | undefined>;
      
      // File system
      readFile: (path: string) => Promise<{ success: boolean; data?: string; error?: string }>;
      writeFile: (path: string, data: string) => Promise<{ success: boolean; error?: string }>;
      copyFile: (src: string, dest: string) => Promise<{ success: boolean; error?: string }>;
      scanFolder: (path: string) => Promise<{ success: boolean; images?: any[]; error?: string }>;
      ensureDir: (path: string) => Promise<{ success: boolean; error?: string }>;
      processImage: (options: {
        source: string;
        target: string;
        maxWidth: number;
        quality: number;
      }) => Promise<{ success: boolean; error?: string }>;
      
      // Shell
      openPath: (path: string) => Promise<{ success: boolean; error?: string }>;
      
      // Store
      getStoreValue: (key: string) => Promise<any>;
      setStoreValue: (key: string, value: any) => Promise<void>;
      
      // Platform
      platform: string;
    };
  }
}
