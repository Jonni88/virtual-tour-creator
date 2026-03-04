import React, { useState } from 'react';

const Icons = {
  Building: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" />
    </svg>
  ),
  Money: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Area: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  ),
  Rooms: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Location: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Phone: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  Email: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Save: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Info: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

function PropertyInfo({ propertyInfo, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(propertyInfo);

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const formatPrice = (price) => {
    if (!price) return '';
    const num = parseInt(price.replace(/\s/g, ''));
    if (isNaN(num)) return price;
    return num.toLocaleString('ru-RU') + ' ₽';
  };

  if (isEditing) {
    return (
      <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            Информация об объекте
          </h3>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition-colors"
          >
            <Icons.Save />
            Сохранить
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Название объекта</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="например, 2-комнатная квартира"
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Цена</label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="5000000"
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Площадь (м²)</label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="65"
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Комнат</label>
              <input
                type="text"
                value={formData.rooms}
                onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                placeholder="2"
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Адрес</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="ул. Ленина, 1"
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Описание объекта..."
              rows={3}
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>

          <div className="border-t border-white/10 pt-3">
            <p className="text-xs text-zinc-500 mb-2">Контакты агента</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="Имя агента"
                className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              />
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+7 (999) 999-99-99"
                className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="email@example.com"
              className="w-full mt-3 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Icons.Info />
          Информация об объекте
        </h3>
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-lg text-sm transition-colors"
        >
          <Icons.Edit />
          Редактировать
        </button>
      </div>

      {propertyInfo.title && (
        <h2 className="text-xl font-semibold text-white mb-3">{propertyInfo.title}</h2>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        {propertyInfo.price && (
          <div className="flex items-center gap-2 text-zinc-300">
            <Icons.Money />
            <span className="text-lg font-semibold text-green-400">{formatPrice(propertyInfo.price)}</span>
          </div>
        )}
        {propertyInfo.area && (
          <div className="flex items-center gap-2 text-zinc-300">
            <Icons.Area />
            <span>{propertyInfo.area} м²</span>
          </div>
        )}
        {propertyInfo.rooms && (
          <div className="flex items-center gap-2 text-zinc-300">
            <Icons.Rooms />
            <span>{propertyInfo.rooms} {parseInt(propertyInfo.rooms) === 1 ? 'комната' : parseInt(propertyInfo.rooms) < 5 ? 'комнаты' : 'комнат'}</span>
          </div>
        )}
        {propertyInfo.address && (
          <div className="flex items-center gap-2 text-zinc-300">
            <Icons.Location />
            <span className="truncate">{propertyInfo.address}</span>
          </div>
        )}
      </div>

      {propertyInfo.description && (
        <p className="text-sm text-zinc-400 mb-4 leading-relaxed">{propertyInfo.description}</p>
      )}

      {(propertyInfo.contactName || propertyInfo.contactPhone) && (
        <div className="border-t border-white/10 pt-3">
          <p className="text-xs text-zinc-500 mb-2">Контакты</p>
          <div className="space-y-2">
            {propertyInfo.contactName && (
              <div className="flex items-center gap-2 text-zinc-300 text-sm">
                <Icons.User />
                {propertyInfo.contactName}
              </div>
            )}
            {propertyInfo.contactPhone && (
              <div className="flex items-center gap-2 text-zinc-300 text-sm">
                <Icons.Phone />
                <a href={`tel:${propertyInfo.contactPhone}`} className="hover:text-blue-400 transition-colors">
                  {propertyInfo.contactPhone}
                </a>
              </div>
            )}
            {propertyInfo.contactEmail && (
              <div className="flex items-center gap-2 text-zinc-300 text-sm">
                <Icons.Email />
                <a href={`mailto:${propertyInfo.contactEmail}`} className="hover:text-blue-400 transition-colors">
                  {propertyInfo.contactEmail}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyInfo;