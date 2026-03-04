import React, { useState } from 'react';
import type { QualityMode } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onExport: (quality: QualityMode) => Promise<void>;
  progress: { current: number; total: number; scene: string } | null;
}

const QUALITY_OPTIONS: { value: QualityMode; label: string; description: string }[] = [
  {
    value: 'fast',
    label: 'Быстрый',
    description: '6000px, JPEG 80%. Для быстрого просмотра.'
  },
  {
    value: 'high',
    label: 'Высокое качество',
    description: '8000px, JPEG 90%. Рекомендуемый режим.'
  },
  {
    value: 'original',
    label: 'Оригинал',
    description: 'Без изменений. Большой размер файлов.'
  }
];

export const ExportDialog: React.FC<Props> = ({ isOpen, onClose, onExport, progress }) => {
  const [selectedQuality, setSelectedQuality] = useState<QualityMode>('high');
  const [isExporting, setIsExporting] = useState(false);
  
  if (!isOpen) return null;
  
  const handleExport = async () => {
    setIsExporting(true);
    await onExport(selectedQuality);
    setIsExporting(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-[480px] max-w-[90vw]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Экспорт тура</h2>
          {!isExporting && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        
        {progress ? (
          <div className="py-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 border-4 border-zinc-700 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            
            <p className="text-center text-zinc-300 mb-2">
              Обработка панорам... {progress.current} / {progress.total}
            </p>
            
            <p className="text-center text-sm text-zinc-500">
              {progress.scene}
            </p>
            
            <div className="mt-6 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-400 mb-4">
              Выберите качество для экспорта. Рекомендуется «Высокое качество» для большинства случаев.
            </p>
            
            <div className="space-y-3 mb-6">
              {QUALITY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedQuality === option.value
                      ? 'bg-blue-500/10 border-blue-500/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="quality"
                    value={option.value}
                    checked={selectedQuality === option.value}
                    onChange={() => setSelectedQuality(option.value)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-white">{option.label}</p>
                    <p className="text-sm text-zinc-500">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleExport}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                Экспортировать
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
