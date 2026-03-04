type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
};

export class KeyboardService {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private enabled = true;
  
  constructor(private callbacks: {
    onSave: () => void;
    onExport: () => void;
    onDeleteHotspot: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onPreview: () => void;
  }) {
    this.setupShortcuts();
    this.bindEvents();
  }
  
  private setupShortcuts() {
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 's',
        ctrl: true,
        action: this.callbacks.onSave,
        description: 'Сохранить проект (Ctrl+S)'
      },
      {
        key: 'e',
        ctrl: true,
        action: this.callbacks.onExport,
        description: 'Экспортировать тур (Ctrl+E)'
      },
      {
        key: 'Delete',
        action: this.callbacks.onDeleteHotspot,
        description: 'Удалить выбранный хотспот (Del)'
      },
      {
        key: 'z',
        ctrl: true,
        action: this.callbacks.onUndo,
        description: 'Отменить (Ctrl+Z)'
      },
      {
        key: 'y',
        ctrl: true,
        action: this.callbacks.onRedo,
        description: 'Повторить (Ctrl+Y)'
      },
      {
        key: 'p',
        ctrl: true,
        action: this.callbacks.onPreview,
        description: 'Предпросмотр (Ctrl+P)'
      },
      {
        key: 'p',
        action: this.callbacks.onPreview,
        description: 'Предпросмотр (P)'
      }
    ];
    
    shortcuts.forEach(s => {
      const key = this.getShortcutKey(s);
      this.shortcuts.set(key, s);
    });
  }
  
  private bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      
      // Игнорируем если фокус в input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      
      const key = this.getEventKey(e);
      const shortcut = this.shortcuts.get(key);
      
      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    });
  }
  
  private getShortcutKey(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }
  
  private getEventKey(e: KeyboardEvent): string {
    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    parts.push(e.key.toLowerCase());
    return parts.join('+');
  }
  
  enable() {
    this.enabled = true;
  }
  
  disable() {
    this.enabled = false;
  }
  
  getShortcutsList(): { key: string; description: string }[] {
    return Array.from(this.shortcuts.values()).map(s => ({
      key: s.description.match(/\(([^)]+)\)$/)?.[1] || s.key,
      description: s.description.replace(/\s*\([^)]+\)$/, '')
    }));
  }
}
