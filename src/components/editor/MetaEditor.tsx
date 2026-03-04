import React, { useState } from 'react';
import type { TourConfig } from '../../types';

interface Props {
  meta: TourConfig['meta'];
  onUpdate: (updates: Partial<TourConfig['meta']>) => void;
}

export const MetaEditor: React.FC<Props> = ({ meta, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'contacts'>('general');
  
  const formatPrice = (value: string) => {
    const num = value.replace(/\D/g, '');
    if (!num) return '';
    return parseInt(num).toLocaleString('ru-RU');
  };
  
  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'general'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
              : 'bg-white/5 text-zinc-400 hover:bg-white/10'
          }`}
        >
          Общая информация
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'contacts'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
              : 'bg-white/5 text-zinc-400 hover:bg-white/10'
          }`}
        >
          Контакты
        </button>
      </div>
      
      {activeTab === 'general' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Название объекта *</label>
            <input
              type="text"
              value={meta.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="например, 2-комнатная квартира"
              className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Цена</label>
              <input
                type="text"
                value={meta.price ? formatPrice(meta.price) : ''}
                onChange={(e) => onUpdate({ price: e.target.value.replace(/\s/g, '') })}
                placeholder="5 000 000"
                className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Площадь (м²)</label>
              <input
                type="text"
                value={meta.area}
                onChange={(e) => onUpdate({ area: e.target.value })}
                placeholder="65"
                className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Адрес</label>
            <input
              type="text"
              value={meta.address}
              onChange={(e) => onUpdate({ address: e.target.value })}
              placeholder="ул. Ленина, д. 1"
              className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Описание</label>
            <textarea
              value={meta.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Описание объекта..."
              rows={3}
              className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Имя агента</label>
            <input
              type="text"
              value={meta.agentName}
              onChange={(e) => onUpdate({ agentName: e.target.value })}
              placeholder="Иван Иванов"
              className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Телефон</label>
              <input
                type="tel"
                value={meta.phone}
                onChange={(e) => onUpdate({ phone: e.target.value })}
                placeholder="+7 (999) 999-99-99"
                className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Email</label>
              <input
                type="email"
                value={meta.email}
                onChange={(e) => onUpdate({ email: e.target.value })}
                placeholder="agent@example.com"
                className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">WhatsApp</label>
              <input
                type="text"
                value={meta.whatsapp}
                onChange={(e) => onUpdate({ whatsapp: e.target.value })}
                placeholder="+79999999999"
                className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Telegram</label>
              <input
                type="text"
                value={meta.telegram}
                onChange={(e) => onUpdate({ telegram: e.target.value })}
                placeholder="@username"
                className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
          
          <div className="pt-2 border-t border-white/10">
            <p className="text-xs text-zinc-500 mb-3">Быстрые ссылки</p>
            <div className="flex gap-2">
              {meta.phone && (
                <a
                  href={`tel:${meta.phone}`}
                  className="flex-1 py-2 px-3 bg-green-500/20 text-green-400 rounded-lg text-sm text-center hover:bg-green-500/30 transition-colors"
                >
                  Позвонить
                </a>
              )}
              {meta.whatsapp && (
                <a
                  href={`https://wa.me/${meta.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 bg-green-500/20 text-green-400 rounded-lg text-sm text-center hover:bg-green-500/30 transition-colors"
                >
                  WhatsApp
                </a>
              )}
              {meta.telegram && (
                <a
                  href={`https://t.me/${meta.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 bg-blue-500/20 text-blue-400 rounded-lg text-sm text-center hover:bg-blue-500/30 transition-colors"
                >
                  Telegram
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
