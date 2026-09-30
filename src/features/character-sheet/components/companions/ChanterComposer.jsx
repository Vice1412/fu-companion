import React, { useState, useMemo } from 'react';
import { GiMusicalNotes, GiCheckMark, GiSparkles, GiHazardSign } from 'react-icons/gi';
import { renderTextWithAffinities } from '../../../../components/ui/FUIcon';
import { CHANTER_DATA, composeChanterSong } from '../../data/skillSuboptionsData';

/**
 * 魔奏者魔法演奏即時合成器 (ChanterComposer)
 *
 * 專為跑團實戰打造：
 * 讓玩家在 HUD 中任意切換「音量 + 音調 + 曲風」，系統自動置換曲風變量，
 * 合成出最終的歌曲名稱、MP 消耗、目標與完整效果，並提供一鍵發動演奏（扣除 MP）與複製。
 */
export default function ChanterComposer({
  character,
  selectedOptions = {},
  onConsumeMp,
  showToast
}) {
  // 提取已掌握的音調與曲風
  const { availableKeys, availableTones } = useMemo(() => {
    let keys = [];
    let tones = [];

    if (Array.isArray(selectedOptions)) {
      selectedOptions.forEach(opt => {
        if (typeof opt === 'string') {
          if (opt.startsWith('音調:')) keys.push(opt.replace('音調:', '').trim());
          else if (opt.startsWith('曲風:')) tones.push(opt.replace('曲風:', '').trim());
          else {
            // 自動比對
            if (CHANTER_DATA.keys.some(k => k.name === opt)) keys.push(opt);
            else if (CHANTER_DATA.tones.some(t => t.name === opt)) tones.push(opt);
          }
        }
      });
    } else if (selectedOptions && typeof selectedOptions === 'object') {
      keys = selectedOptions.keys || [];
      tones = selectedOptions.tones || [];
    }

    return {
      availableKeys: keys.length > 0 ? keys : CHANTER_DATA.keys.map(k => k.name).slice(0, 2),
      availableTones: tones.length > 0 ? tones : CHANTER_DATA.tones.map(t => t.name).slice(0, 2)
    };
  }, [selectedOptions]);

  // 選中狀態
  const [selectedVolId, setSelectedVolId] = useState('vol_med'); // 預設中音 20 MP
  const [selectedKeyName, setSelectedKeyName] = useState(() => availableKeys[0] || '熾熱');
  const [selectedToneName, setSelectedToneName] = useState(() => availableTones[0] || '冷靜');
  const [copied, setCopied] = useState(false);

  // 合成當前歌曲
  const currentSong = useMemo(() => {
    return composeChanterSong(selectedVolId, selectedKeyName, selectedToneName);
  }, [selectedVolId, selectedKeyName, selectedToneName]);

  // 當前 MP
  const currentMp = character?.currentMp ?? 0;
  const isMpSufficient = currentMp >= (currentSong?.mp || 0);

  // 發動演奏
  const handlePerformSong = () => {
    if (!currentSong) return;

    if (!isMpSufficient) {
      if (showToast) showToast(`目前 MP (${currentMp}) 不足以支付該歌曲 (${currentSong.mp} MP)！`, 'warning');
      return;
    }

    if (onConsumeMp) {
      onConsumeMp(currentSong.mp);
      if (showToast) {
        showToast(`已成功演奏「${currentSong.songTitle}」，扣除 ${currentSong.mp} MP！`, 'success');
      }
    }
  };

  // 複製歌曲描述
  const handleCopySong = async () => {
    if (!currentSong) return;
    const textToCopy = `【${currentSong.songTitle}】\n消耗：${currentSong.mp} MP | 目標：${currentSong.target}\n效果：${currentSong.composedEffect}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (showToast) showToast('已複製歌曲效果到剪貼簿！', 'info');
    } catch {
      // fallback
    }
  };

  return (
    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50/95 via-white to-amber-50/80 border border-purple-200/90 shadow-xs space-y-3">
      {/* 頂部標題列 */}
      <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-2xs">
            <GiMusicalNotes className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold text-xs text-purple-950 tracking-wide font-serif">
              魔法演奏即時合成器
            </div>
            <div className="text-[10px] text-purple-700/80">
              選擇音量、音調與曲風，實時動態合成歌曲與消耗
            </div>
          </div>
        </div>

        <div className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-purple-100 text-purple-900 border border-purple-200">
          當前 MP: {currentMp}
        </div>
      </div>

      {/* 選擇欄位 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        {/* ① 選擇音量 */}
        <div className="space-y-1.5 bg-white/80 p-2 rounded-xl border border-purple-100 shadow-2xs">
          <div className="font-bold text-[11px] text-purple-900 flex items-center justify-between">
            <span>① 選擇音量</span>
            <span className="text-[10px] text-slate-400">消耗與目標</span>
          </div>
          <div className="flex flex-col gap-1">
            {CHANTER_DATA.volumes.map(vol => {
              const isSelected = selectedVolId === vol.id;
              return (
                <button
                  key={vol.id}
                  type="button"
                  onClick={() => setSelectedVolId(vol.id)}
                  className={`px-2 py-1.5 rounded-lg text-left transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white font-bold shadow-xs'
                      : 'bg-purple-50/60 hover:bg-purple-100/80 text-purple-950 border border-purple-100'
                  }`}
                >
                  <span className="font-serif">{vol.name}</span>
                  <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${isSelected ? 'bg-purple-700/90 text-white' : 'bg-white text-purple-800'}`}>
                    {vol.mp} MP
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ② 選擇音調 */}
        <div className="space-y-1.5 bg-white/80 p-2 rounded-xl border border-purple-100 shadow-2xs">
          <div className="font-bold text-[11px] text-amber-900 flex items-center justify-between">
            <span>② 選擇音調</span>
            <span className="text-[10px] text-slate-400">已掌握</span>
          </div>
          <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto pr-0.5">
            {availableKeys.map(kName => {
              const isSelected = selectedKeyName === kName;
              const keyData = CHANTER_DATA.keys.find(k => k.name === kName);
              return (
                <button
                  key={kName}
                  type="button"
                  onClick={() => setSelectedKeyName(kName)}
                  className={`px-2 py-1.5 rounded-lg text-left transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white font-bold shadow-xs'
                      : 'bg-amber-50/60 hover:bg-amber-100/80 text-amber-950 border border-amber-100'
                  }`}
                >
                  <span className="font-serif truncate">{kName}</span>
                  {keyData && (
                    <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-amber-700/90 text-white' : 'bg-white text-amber-900'}`}>
                      {keyData.damageType}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ③ 選擇曲風 */}
        <div className="space-y-1.5 bg-white/80 p-2 rounded-xl border border-purple-100 shadow-2xs">
          <div className="font-bold text-[11px] text-purple-900 flex items-center justify-between">
            <span>③ 選擇曲風</span>
            <span className="text-[10px] text-slate-400">已掌握</span>
          </div>
          <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto pr-0.5">
            {availableTones.map(tName => {
              const isSelected = selectedToneName === tName;
              return (
                <button
                  key={tName}
                  type="button"
                  onClick={() => setSelectedToneName(tName)}
                  className={`px-2 py-1.5 rounded-lg text-left transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-purple-700 text-white font-bold shadow-xs'
                      : 'bg-purple-50/60 hover:bg-purple-100/80 text-purple-950 border border-purple-100'
                  }`}
                >
                  <span className="font-serif truncate">{tName}</span>
                  {isSelected && <GiCheckMark className="w-2.5 h-2.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 合成結果預覽展示卡 */}
      {currentSong && (
        <div className="p-3 bg-white rounded-xl border-2 border-purple-300 shadow-xs space-y-2">
          {/* 歌名與數據標籤 */}
          <div className="flex items-center justify-between gap-2 flex-wrap border-b border-purple-100 pb-2">
            <div className="flex items-center gap-1.5">
              <GiSparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="font-bold text-sm text-purple-950 font-serif tracking-wide">
                {currentSong.songTitle}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-bold border border-indigo-200">
                消耗：{currentSong.mp} MP
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-sans">
                目標：{currentSong.target}
              </span>
            </div>
          </div>

          {/* 音調特性輔助標籤 */}
          {currentSong.key && (
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200">
                傷害【{currentSong.key.damageType}】
              </span>
              <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-900 border border-rose-200">
                狀態【{currentSong.key.status}】
              </span>
              <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-900 border border-blue-200 font-mono">
                屬性【{currentSong.key.attribute}】
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                恢復【{currentSong.key.recovery}】
              </span>
            </div>
          )}

          {/* 置換後的完整機制效果文本（透過 renderTextWithAffinities 帶官方字型符號高亮） */}
          <div className="text-xs text-slate-800 leading-relaxed font-sans bg-purple-50/40 p-2.5 rounded-lg border border-purple-100/80">
            {renderTextWithAffinities(currentSong.composedEffect)}
          </div>

          {/* 操作按鈕 */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopySong}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copied ? <GiCheckMark className="w-3.5 h-3.5 text-emerald-600" /> : null}
              <span>{copied ? '已複製！' : '複製歌曲效果'}</span>
            </button>

            <button
              type="button"
              onClick={handlePerformSong}
              disabled={!isMpSufficient}
              className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                isMpSufficient
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/30'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <GiMusicalNotes className="w-3.5 h-3.5" />
              <span>發動演奏（消耗 {currentSong.mp} MP）</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
