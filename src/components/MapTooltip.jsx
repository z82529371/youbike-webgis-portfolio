import React from 'react';
import { Bike, Navigation, Layers } from 'lucide-react';

export function MapTooltip({ hoverInfo }) {
  if (!hoverInfo || !hoverInfo.object) return null;

  const { object, layer, x, y } = hoverInfo;

  return (
    <div
      className="fixed pointer-events-none z-50 p-3 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl text-slate-100 text-xs transition-opacity duration-100"
      style={{
        left: x + 12,
        top: y + 12,
        transform: 'translate(0, 0)'
      }}
    >
      {/* 1. 即時站點 Tooltip */}
      {layer?.id === 'layer-stations-scatterplot' && (
        <div>
          <div className="font-bold text-sky-400 text-sm mb-1.5 flex items-center gap-1.5">
            <Bike size={14} className="text-sky-400" />
            <span>{object.name}</span>
          </div>
          <div className="text-slate-300 mb-1 flex items-center gap-2">
            <span className="text-slate-400">行政區：</span>
            <span className="font-semibold text-white">{object.district}</span>
          </div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-slate-400">可借車輛：</span>
            <span
              className={`font-bold ${
                object.availableBikes === 0
                  ? 'text-rose-500'
                  : object.availableBikes < 3
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {object.availableBikes} 輛
            </span>
          </div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-slate-400">可還空位：</span>
            <span className="font-semibold text-white">{object.emptySpaces} 格</span>
          </div>
          <div className="text-[10px] text-slate-500 pt-1.5 border-t border-slate-800">
            更新時間：{object.updateTime}
          </div>
        </div>
      )}

      {/* 2. 3D 蜂巢聚合 Tooltip */}
      {layer?.id === 'layer-density-hexagon' && (
        <div>
          <div className="font-bold text-amber-400 text-sm mb-1.5 flex items-center gap-1.5">
            <Layers size={14} className="text-amber-400" />
            <span>3D 空間蜂巢聚合</span>
          </div>
          <div className="text-slate-300 mb-1 flex items-center gap-2">
            <span className="text-slate-400">網格涵蓋站點：</span>
            <span className="font-bold text-white">{object.points?.length || 0} 站</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">網格總車輛數：</span>
            <span className="font-bold text-amber-300">{object.elevationValue || 0} 輛</span>
          </div>
        </div>
      )}

      {/* 3. 跨區起訖流向 Tooltip */}
      {layer?.id === 'layer-od-flows-arc' && (
        <div>
          <div className="font-bold text-pink-400 text-sm mb-1.5 flex items-center gap-1.5">
            <Navigation size={14} className="text-pink-400" />
            <span>跨區借還移動流向</span>
          </div>
          <div className="text-slate-300 mb-1">
            <span className="text-slate-400">起點：</span>
            <span className="font-semibold text-white">{object.fromName}</span>
          </div>
          <div className="text-slate-300 mb-1">
            <span className="text-slate-400">迄點：</span>
            <span className="font-semibold text-white">{object.toName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">預估即時流向：</span>
            <span className="font-bold text-sky-400">{object.tripCount} 旅次/時</span>
          </div>
        </div>
      )}
    </div>
  );
}
