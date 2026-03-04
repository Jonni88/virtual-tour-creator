export {};

declare global {
  interface Window {
    electronAPI: {
      // Dialogs
      openFolder: () => Promise<string | undefined>;
      saveProjectDialog: () => Promise<string | undefined>;
      loadProjectDialog: () => Promise<string | undefined>;
      getExportPath: () => Promise<string | undefined>;
      
      // File system
      readFile: (path: string) => Promise<{ success: boolean; data?: string; error?: string }>;
      writeFile: (path: string, data: string) => Promise<{ success: boolean; error?: string }>;
      copyFile: (src: string, dest: string) => Promise<{ success: boolean; error?: string }>;
      ensureDir: (path: string) => Promise<{ success: boolean; error?: string }>;
      processImage: (options: {
        source: string;
        target: string;
        maxWidth: number;
        quality: number;
      }) => Promise<{ success: boolean; error?: string }>;
      
      // Store
      getStoreValue: (key: string) => Promise<any>;
      setStoreValue: (key: string, value: any) => Promise<void>;
    };
  }
}
