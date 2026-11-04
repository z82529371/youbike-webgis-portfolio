import React from "react";
import { Bike, ParkingSquare, Zap } from "lucide-react";

export function MapTooltip({ hoverInfo, commuterIntent = "borrow" }) {
  if (!hoverInfo || !hoverInfo.object) return null;

  const { object, x, y } = hoverInfo;

  return (
    <div
      className="fixed pointer-events-none z-50 p-3 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 text-xs transition-opacity duration-100 min-w-44"
      style={{
        left: x + 14,
        top: y + 14,
        transform: "translate(0, 0)",
      }}
    >
      <div className="font-extrabold text-sky-400 text-sm mb-1 flex items-center gap-1.5">
        <Bike size={14} className="text-sky-400 shrink-0" />
        <span className="truncate">{object.name}</span>
      </div>
      <div className="text-[11px] text-slate-400 mb-2 truncate">
        {object.district} · {object.address}
      </div>

      <div className="space-y-1 pt-1.5 border-t border-slate-800">
        <div
          className={`flex items-center justify-between gap-3 px-1.5 py-0.5 rounded-lg ${
            commuterIntent === "borrow" ? "bg-emerald-950/50" : ""
          }`}
        >
          <span className="text-slate-400 flex items-center gap-1">
            <Bike size={12} className="text-emerald-400" />
            可借車輛
          </span>
          <span
            className={`font-black ${
              object.availableBikes === 0
                ? "text-rose-400"
                : object.availableBikes < 3
                  ? "text-amber-400"
                  : "text-emerald-400"
            }`}
          >
            {object.availableBikes} 台
          </span>
        </div>

        {object.electricBikes > 0 && (
          <div className="flex items-center justify-between gap-3 px-1.5 py-0.5 rounded-lg bg-amber-950/40 text-amber-300">
            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400">
              <Zap size={11} className="fill-amber-400" />
              2.0E 電輔車
            </span>
            <span className="font-bold text-amber-300">
              {object.electricBikes} 台
            </span>
          </div>
        )}

        <div
          className={`flex items-center justify-between gap-3 px-1.5 py-0.5 rounded-lg ${
            commuterIntent === "return" ? "bg-sky-950/50" : ""
          }`}
        >
          <span className="text-slate-400 flex items-center gap-1">
            <ParkingSquare size={12} className="text-sky-400" />
            可還空位
          </span>
          <span
            className={`font-black ${
              object.emptySpaces === 0
                ? "text-rose-400"
                : object.emptySpaces < 3
                  ? "text-amber-400"
                  : "text-sky-400"
            }`}
          >
            {object.emptySpaces} 格
          </span>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 pt-1.5 mt-1 border-t border-slate-800/80 flex justify-between items-center">
        <span>總車位：{object.totalBikes}</span>
        <span className="text-sky-400/80">點擊看詳情</span>
      </div>
    </div>
  );
}
