import React from 'react';
import { Layers, Map, Filter, RefreshCw, Compass, Bike, AlertCircle } from 'lucide-react';
import { DISTRICTS } from '../utils/constants.js';

export function ControlDock({
  stats = { total: 0, emptyCount: 0, totalBikes: 0, lastUpdated: '' },
  visibility = { scatterplot: true, hexagon: true, arc: true },
  onToggleLayer = () => {},
  basemapTheme = 'dark',
  onToggleBasemap = () => {},
  filterCriteria = { district: 'all', status: 'all' },
  onFilterChange = () => {},
  selectedStation = null,
  onCloseSelectedStation = () => {},
  onResetView = () => {},
  onRefreshData = () => {},
  isLoading = false
}) {
  return (
    <aside className="absolute top-5 left-5 z-10 w-92 max-h-[calc(100vh-40px)] overflow-y-auto bg-slate-900/85 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-5 text-slate-100 shadow-2xl transition-all duration-300">
      {/* 標題與即時刷新 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🚲</span>
            <h1 className="text-base font-bold tracking-tight text-white">
              WebGIS 3D 空間動態
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            MapLibre GL + deck.gl 混合雙引擎
          </p>
        </div>

        <button
          onClick={onRefreshData}
          disabled={isLoading}
          title="重新抓取即時 API 資料"
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-sky-400 hover:text-sky-300 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* 核心指標卡片 */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 mb-5">
        <div>
          <div className="text-[11px] text-slate-400">在線站點</div>
          <div className="text-lg font-bold text-sky-400">{stats.total}</div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">總車輛數</div>
          <div className="text-lg font-bold text-emerald-400">{stats.totalBikes}</div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">無車警示</div>
          <div className="text-lg font-bold text-rose-500">{stats.emptyCount}</div>
        </div>
      </div>

      {/* 區塊 1：deck.gl 圖層控制器 */}
      <section className="mb-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
          <Layers size={14} className="text-sky-400" />
          <span>視覺化圖層 (deck.gl)</span>
        </div>

        <div className="space-y-2">
          {/* 即時站點 */}
          <label className="flex items-center justify-between p-2.5 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/40 rounded-xl cursor-pointer transition-colors text-sm">
            <span className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
              <span>即時站點 (Scatterplot)</span>
            </span>
            <input
              type="checkbox"
              checked={visibility.scatterplot}
              onChange={() => onToggleLayer('scatterplot')}
              className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 accent-sky-500 cursor-pointer"
            />
          </label>

          {/* 3D 蜂巢聚合 */}
          <label className="flex items-center justify-between p-2.5 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/40 rounded-xl cursor-pointer transition-colors text-sm">
            <span className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]" />
              <span>3D 蜂巢密度 (Hexagon)</span>
            </span>
            <input
              type="checkbox"
              checked={visibility.hexagon}
              onChange={() => onToggleLayer('hexagon')}
              className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 accent-sky-500 cursor-pointer"
            />
          </label>

          {/* 跨區弧線流向 */}
          <label className="flex items-center justify-between p-2.5 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/40 rounded-xl cursor-pointer transition-colors text-sm">
            <span className="flex items-center gap-2.5">
              <span className="w-3.5 h-1 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.7)]" />
              <span>跨區起訖流向 (Arc)</span>
            </span>
            <input
              type="checkbox"
              checked={visibility.arc}
              onChange={() => onToggleLayer('arc')}
              className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 accent-sky-500 cursor-pointer"
            />
          </label>
        </div>
      </section>

      {/* 區塊 2：空間篩選器 */}
      <section className="mb-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
          <Filter size={14} className="text-sky-400" />
          <span>空間與狀態過濾</span>
        </div>

        {/* 行政區下拉選單 */}
        <div className="mb-3">
          <label className="text-[11px] text-slate-400 block mb-1">行政區劃：</label>
          <select
            value={filterCriteria.district}
            onChange={e => onFilterChange({ ...filterCriteria, district: e.target.value })}
            className="w-full bg-slate-950/80 text-slate-200 border border-slate-700/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/60 cursor-pointer"
          >
            {DISTRICTS.map(d => (
              <option key={d} value={d === '全部行政區' ? 'all' : d} className="bg-slate-900 text-slate-200">
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* 車況狀態篩選按鈕 */}
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">借還車狀態：</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'all', label: '全部' },
              { id: 'availableOnly', label: '可借車' },
              { id: 'emptyOnly', label: '缺車中' }
            ].map(item => {
              const active = filterCriteria.status === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onFilterChange({ ...filterCriteria, status: item.id })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-sky-600 text-white shadow-[0_0_12px_rgba(2,132,199,0.5)] border border-sky-400/50'
                      : 'bg-slate-800/40 hover:bg-slate-800/80 text-slate-300 border border-slate-700/40'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 區塊 3：底圖風格與視角控制 */}
      <section className="mb-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
          <Map size={14} className="text-sky-400" />
          <span>向量底圖與視角</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onToggleBasemap(basemapTheme === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl text-xs text-slate-200 transition-colors cursor-pointer"
          >
            <span>{basemapTheme === 'dark' ? '🌙 暗黑底圖' : '☀️ 明亮底圖'}</span>
          </button>

          <button
            onClick={onResetView}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-sky-500/50 text-sky-400 hover:text-sky-300 rounded-xl text-xs transition-colors cursor-pointer"
          >
            <Compass size={14} />
            <span>3D 視角重置</span>
          </button>
        </div>
      </section>

      {/* 點擊選中站點卡片 */}
      {selectedStation && (
        <div className="mt-4 p-3.5 bg-slate-800/90 border border-sky-500/40 rounded-xl relative shadow-lg">
          <button
            onClick={onCloseSelectedStation}
            className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-200 text-sm leading-none cursor-pointer"
          >
            ✕
          </button>
          <div className="text-xs font-bold text-sky-400 mb-1 flex items-center gap-1.5">
            <Bike size={14} />
            <span>{selectedStation.name}</span>
          </div>
          <div className="text-[11px] text-slate-300 mb-2">
            {selectedStation.district} ({selectedStation.address})
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-emerald-400 font-semibold">
              可借: {selectedStation.availableBikes} 輛
            </span>
            <span className="text-slate-300">
              空位: {selectedStation.emptySpaces} 格
            </span>
            <span className="text-slate-400">
              總格數: {selectedStation.totalBikes}
            </span>
          </div>
        </div>
      )}

      {/* 底部時間 */}
      <footer className="mt-4 text-[11px] text-slate-500 text-center border-t border-slate-800/80 pt-3">
        最後更新時間：{stats.lastUpdated || '載入中...'}
      </footer>
    </aside>
  );
}
