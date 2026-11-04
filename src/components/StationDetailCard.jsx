import React, { useMemo } from "react";
import {
  Bike,
  ParkingSquare,
  MapPin,
  X,
  AlertTriangle,
  ArrowRight,
  Footprints,
  Clock,
} from "lucide-react";
import { findAlternativeStations } from "../utils/dataTransform.js";

export function StationDetailCard({
  station,
  allStations = [],
  commuterIntent = "borrow", // 'borrow' | 'return'
  onClose = () => {},
  onSelectAlternative = () => {},
}) {
  if (!station) return null;

  const currentCount =
    commuterIntent === "borrow" ? station.availableBikes : station.emptySpaces;
  const isEmergency = currentCount === 0;

  // 智能救援：若當前站點缺車或滿位，自動計算步行 800m 內備援替代站
  const alternativeStations = useMemo(() => {
    if (!isEmergency) return [];
    return findAlternativeStations(
      station,
      allStations,
      commuterIntent,
      2,
      800
    );
  }, [station, allStations, commuterIntent, isEmergency]);

  // 飽和度比例 (0 ~ 100%)
  const saturationPercent = station.totalBikes
    ? Math.round((station.availableBikes / station.totalBikes) * 100)
    : 0;

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 z-40 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      {/* 頂部標題列與關閉鈕 */}
      <div className="flex items-start justify-between p-4 pb-3 border-b border-slate-800">
        <div className="flex items-start gap-2.5 min-w-0 pr-2">
          <div
            className={`p-2 rounded-2xl shrink-0 mt-0.5 ${
              isEmergency
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : commuterIntent === "borrow"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
            }`}
          >
            {commuterIntent === "borrow" ? (
              <Bike size={20} />
            ) : (
              <ParkingSquare size={20} />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-sm md:text-base text-slate-100 truncate">
              {station.name}
            </h3>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate mt-0.5">
              <MapPin size={12} className="shrink-0 text-slate-500" />
              <span className="truncate">
                {station.district} · {station.address}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {/* 核心數據看板 */}
      <div className="p-4 pt-3.5 space-y-3">
        {/* 雙核心指標：可借車輛 vs 可還空位 */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* 🚲 可借車輛 */}
          <div
            className={`p-3 rounded-2xl border transition-all ${
              commuterIntent === "borrow"
                ? "bg-emerald-950/40 border-emerald-500/40 shadow-inner"
                : "bg-slate-800/40 border-slate-800"
            }`}
          >
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-1">
              <Bike size={13} className="text-emerald-400" />
              <span>可借車輛</span>
            </div>
            <div
              className={`text-2xl font-black ${
                station.availableBikes === 0
                  ? "text-rose-400"
                  : station.availableBikes < 3
                    ? "text-amber-400"
                    : "text-emerald-400"
              }`}
            >
              {station.availableBikes}
              <span className="text-xs font-normal text-slate-400 ml-1">
                台
              </span>
            </div>
          </div>

          {/* 🅿️ 可還空位 */}
          <div
            className={`p-3 rounded-2xl border transition-all ${
              commuterIntent === "return"
                ? "bg-sky-950/40 border-sky-500/40 shadow-inner"
                : "bg-slate-800/40 border-slate-800"
            }`}
          >
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-1">
              <ParkingSquare size={13} className="text-sky-400" />
              <span>可還空位</span>
            </div>
            <div
              className={`text-2xl font-black ${
                station.emptySpaces === 0
                  ? "text-rose-400"
                  : station.emptySpaces < 3
                    ? "text-amber-400"
                    : "text-sky-400"
              }`}
            >
              {station.emptySpaces}
              <span className="text-xs font-normal text-slate-400 ml-1">
                格
              </span>
            </div>
          </div>
        </div>

        {/* 飽和度進度條 */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>站點容積飽和度</span>
            <span className="font-mono text-slate-300">
              {saturationPercent}%（總車位 {station.totalBikes} 格）
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                saturationPercent === 0
                  ? "bg-rose-500"
                  : saturationPercent > 85
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, saturationPercent)}%` }}
            />
          </div>
        </div>

        {/* 🚨 智能救援：備援替代站模組 (當無車可借或無位可還時觸發) */}
        {isEmergency && (
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
              <AlertTriangle size={15} />
              <span>
                {commuterIntent === "borrow"
                  ? "本站目前已無車可借！"
                  : "本站目前已無空位可還！"}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium">
              為您推薦步行範圍內有車的最近備援站點：
            </div>

            {alternativeStations.length > 0 ? (
              <div className="space-y-1.5">
                {alternativeStations.map((alt) => {
                  const altCount =
                    commuterIntent === "borrow"
                      ? alt.availableBikes
                      : alt.emptySpaces;
                  return (
                    <button
                      key={alt.id}
                      type="button"
                      onClick={() => onSelectAlternative(alt)}
                      className="w-full p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-sky-400/50 flex items-center justify-between text-left transition-all group cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-100 group-hover:text-sky-400 truncate">
                          {alt.name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-0.5 text-sky-300">
                            <Footprints size={11} />約 {alt.distance}m
                          </span>
                          <span className="flex items-center gap-0.5 text-slate-400">
                            <Clock size={11} />
                            步行 {alt.walkMinutes} 分鐘
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-black text-emerald-400">
                            {altCount}{" "}
                            <span className="text-[10px] font-normal text-slate-400">
                              {commuterIntent === "borrow" ? "台" : "格"}
                            </span>
                          </div>
                        </div>
                        <div className="p-1 rounded-lg bg-sky-500/20 text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                          <ArrowRight size={13} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 p-2 bg-slate-800/40 rounded-xl">
                周邊 800 公尺內暫無充足備援站點，建議擴大搜尋。
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部時間時戳 */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 text-[10px] text-slate-500 flex justify-between items-center">
        <span>站點編號：{station.id}</span>
        <span>資料更新：{station.updateTime || "即時"}</span>
      </div>
    </div>
  );
}
