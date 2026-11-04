import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Bike,
  ParkingSquare,
  Search,
  MapPin,
  RefreshCw,
  Sun,
  Moon,
  X,
  Compass,
} from "lucide-react";
import { DISTRICTS } from "../utils/constants.js";
import { searchStations } from "../utils/dataTransform.js";

export function CommuterNavbar({
  commuterIntent = "borrow", // 'borrow' | 'return'
  onIntentChange = () => {},
  allStations = [],
  selectedDistrict = "全部行政區",
  onDistrictSelect = () => {},
  onStationSelect = () => {},
  onLocateMe = () => {},
  isLocating = false,
  onRefresh = () => {},
  isLoading = false,
  lastUpdated = "",
  refreshCountdown = 60,
  isLiveSource = true,
  basemapTheme = "dark",
  onThemeToggle = () => {},
  onResetView = () => {},
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // 模糊檢索建議清單
  const searchResults = useMemo(() => {
    return searchStations(allStations, searchQuery, 6);
  }, [allStations, searchQuery]);

  // 點擊外部自動收起搜尋選單
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (station) => {
    onStationSelect(station);
    setSearchQuery(station.name);
    setIsSearchOpen(false);
  };

  return (
    <header className="absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 z-40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pointer-events-none">
      {/* 左側：品牌標籤 + 借還意圖雙膠囊切換 */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* 品牌徽章 */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/70 shadow-xl text-white">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm border border-amber-400/30">
            2.0
          </div>
          <div>
            <div className="font-extrabold text-xs tracking-tight text-slate-100">
              YouBike 即時出行
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              台北市生活導航
            </div>
          </div>
        </div>

        {/* 核心用車意圖切換 (我要借車 ⇄ 我要還車) */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl">
          <button
            type="button"
            onClick={() => onIntentChange("borrow")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              commuterIntent === "borrow"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Bike size={16} />
            <span>我要借車</span>
          </button>
          <button
            type="button"
            onClick={() => onIntentChange("return")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              commuterIntent === "return"
                ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/30 scale-[1.02]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <ParkingSquare size={16} />
            <span>我要還車</span>
          </button>
        </div>
      </div>

      {/* 中間：站點關鍵字即時搜尋列 + 智能下拉建議 */}
      <div
        ref={searchContainerRef}
        className="relative flex-1 max-w-lg pointer-events-auto"
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-500/30 transition-all">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder={
              commuterIntent === "borrow"
                ? "搜尋站點、路名 (例如: 科技大樓、台大、台北車站)..."
                : "搜尋目的地站點 (例如: 象山、市府、松山)..."
            }
            className="w-full bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setIsSearchOpen(false);
              }}
              className="text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* 搜尋候選建議列表 */}
        {isSearchOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-slate-900/98 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto">
            {searchResults.map((station) => {
              const count =
                commuterIntent === "borrow"
                  ? station.availableBikes
                  : station.emptySpaces;
              const isShortage = count === 0;

              return (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(station)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-start gap-2 min-w-0 pr-2">
                    <MapPin
                      size={15}
                      className="text-sky-400 shrink-0 mt-0.5"
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-100 group-hover:text-sky-400 truncate">
                        {station.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {station.district} · {station.address}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div
                      className={`text-xs font-black ${
                        isShortage
                          ? "text-rose-400"
                          : count < 3
                            ? "text-amber-400"
                            : "text-emerald-400"
                      }`}
                    >
                      {count}{" "}
                      <span className="text-[10px] font-normal text-slate-400">
                        {commuterIntent === "borrow" ? "台可借" : "位可還"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 右側：行政區快篩 + 我的位置 + 刷新同步 + 視角/外觀工具 */}
      <div className="flex items-center gap-1.5 md:gap-2 pointer-events-auto">
        {/* 行政區下拉快篩 */}
        <select
          value={selectedDistrict}
          onChange={(e) => onDistrictSelect(e.target.value)}
          className="px-2.5 py-2 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-xs text-slate-200 font-medium focus:outline-none focus:border-sky-400 cursor-pointer shadow-lg"
        >
          {DISTRICTS.map((d) => (
            <option key={d} value={d} className="bg-slate-900 text-slate-200">
              {d}
            </option>
          ))}
        </select>

        {/* 📍 定位我的位置 */}
        <button
          type="button"
          onClick={onLocateMe}
          title="定位我的周邊站點"
          className={`p-2 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-slate-300 hover:text-sky-400 hover:border-sky-500/50 transition-all cursor-pointer shadow-lg ${
            isLocating ? "animate-pulse text-sky-400 border-sky-400" : ""
          }`}
        >
          <MapPin size={16} />
        </button>

        {/* 🔄 資料同步狀態與手動整理 */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title={`即時同步：${lastUpdated || "最新"} (${refreshCountdown}s 後自動刷新)`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-slate-200 hover:border-emerald-500/50 transition-all cursor-pointer shadow-lg group"
        >
          <RefreshCw
            size={14}
            className={`text-emerald-400 ${
              isLoading ? "animate-spin text-emerald-300" : ""
            }`}
          />
          <span className="hidden xl:inline text-[11px] font-mono text-slate-300">
            {refreshCountdown}s
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isLiveSource ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
        </button>

        {/* 視角重置 */}
        <button
          type="button"
          onClick={onResetView}
          title="重設台北市中心視角"
          className="p-2 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-slate-300 hover:text-slate-100 transition-all cursor-pointer shadow-lg"
        >
          <Compass size={16} />
        </button>

        {/* 暗 / 亮主題 */}
        <button
          type="button"
          onClick={onThemeToggle}
          title="切換底圖主題"
          className="p-2 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-slate-300 hover:text-amber-400 transition-all cursor-pointer shadow-lg"
        >
          {basemapTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
