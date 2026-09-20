import React from 'react';
import { Shield, Sparkles, Zap, Heart, Swords, Backpack, Star, Clock } from 'lucide-react';
import { calculateCharacterStats } from '../utils/characterEngine';
import StatBadge from '../../../components/ui/StatBadge';
import JRPGBadge from '../../../components/ui/JRPGBadge';
import ClockTracker from '../../../components/ui/ClockTracker';
import rulesData from '../data/rulesData.json';

export default function CharacterCard({
  character,
  onEdit = null,
  onUpdateClock = null,
  className = ''
}) {
  if (!character) return null;

  const stats = calculateCharacterStats(character);
  const curHp = character.currentHp !== null && character.currentHp !== undefined ? character.currentHp : stats.maxHp;
  const curMp = character.currentMp !== null && character.currentMp !== undefined ? character.currentMp : stats.maxMp;
  const isCrisis = curHp <= stats.crisisThreshold;

  return (
    <div className={`bg-[#fffdf9] rounded-xl border-2 border-[#d6c7ab] shadow-md overflow-hidden text-[#2c221e] flex flex-col relative ${isCrisis ? 'crisis-pulse-active border-red-500' : ''} ${className}`}>
      {/* Top Banner */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700" />

      {/* Header Profile */}
      <div className="p-4 sm:p-5 border-b border-[#d6c7ab] bg-[#f4ebd9] flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-xl bg-white border border-[#d6c7ab] overflow-hidden shrink-0 flex items-center justify-center font-serif text-2xl text-amber-800 font-bold shadow-inner">
          {character.avatar ? (
            <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
          ) : (
            character.name?.[0] || '勇'
          )}
        </div>

        {/* Identity & Origin */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif font-black text-xl text-[#3c2415] tracking-wide truncate">
              {character.name || '無名冒險者'}
            </h3>
            <JRPGBadge variant="gold" size="xs">
              Lv {character.level || 5}
            </JRPGBadge>
            {isCrisis && (
              <JRPGBadge variant="rose" size="xs">
                ⚠️ CRISIS 危機狀態
              </JRPGBadge>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#6b5a4b] mt-1 font-mono flex-wrap">
            <span>身份: <strong className="text-[#2c221e] font-sans font-bold">{character.identity}</strong></span>
            <span>·</span>
            <span>主題: <strong className="text-amber-800 font-sans font-bold">{character.theme}</strong></span>
            <span>·</span>
            <span>故鄉: <strong className="text-blue-800 font-sans font-bold">{character.origin}</strong></span>
          </div>

          {/* Classes pill tags */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {(character.classes || []).map((cl, idx) => (
              <span key={idx} className="text-[11px] px-2 py-0.5 rounded-md bg-[#fbf3de] border border-amber-400/60 text-amber-900 font-mono font-bold">
                {cl.className} (Lv {cl.level})
              </span>
            ))}
          </div>
        </div>

        {onEdit && (
          <button
            onClick={onEdit}
            className="p-1.5 text-[#6b5a4b] hover:text-amber-800 hover:bg-[#e4d9c0] rounded-lg transition-colors shrink-0"
            title="編輯角色卡"
          >
            ✏️
          </button>
        )}
      </div>

      {/* Core Resources Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-[#fbf7ee] border-b border-[#d6c7ab]">
        {/* HP */}
        <div className="bg-[#fee2e2] rounded-lg p-2.5 border border-[#fca5a5]">
          <div className="text-[10px] text-red-800 font-mono uppercase font-bold flex items-center gap-1">
            <Heart className="w-3 h-3 text-red-600 fill-red-500/20" /> HP 生命值
          </div>
          <div className="text-base font-mono font-black text-red-900 mt-0.5">
            {curHp} <span className="text-xs text-stone-500 font-normal">/ {stats.maxHp}</span>
          </div>
        </div>

        {/* MP */}
        <div className="bg-[#dbeafe] rounded-lg p-2.5 border border-[#93c5fd]">
          <div className="text-[10px] text-blue-800 font-mono uppercase font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-600" /> MP 魔力值
          </div>
          <div className="text-base font-mono font-black text-blue-900 mt-0.5">
            {curMp} <span className="text-xs text-stone-500 font-normal">/ {stats.maxMp}</span>
          </div>
        </div>

        {/* IP */}
        <div className="bg-[#d1fae5] rounded-lg p-2.5 border border-[#6ee7b7]">
          <div className="text-[10px] text-emerald-800 font-mono uppercase font-bold flex items-center gap-1">
            <Backpack className="w-3 h-3 text-emerald-600" /> IP 庫存點
          </div>
          <div className="text-base font-mono font-black text-emerald-950 mt-0.5">
            {character.currentIp ?? stats.maxIp} <span className="text-xs text-stone-500 font-normal">/ {stats.maxIp}</span>
          </div>
        </div>

        {/* FP */}
        <div className="bg-[#fef3c7] rounded-lg p-2.5 border border-[#fcd34d]">
          <div className="text-[10px] text-amber-900 font-mono uppercase font-bold flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-700" /> 物語點 (FP)
          </div>
          <div className="text-base font-mono font-black text-amber-950 mt-0.5">
            {character.fabulaPoints || 3}
          </div>
        </div>
      </div>

      {/* Attributes & Defenses */}
      <div className="p-3.5 border-b border-[#d6c7ab] bg-[#f8f3e8] flex flex-wrap items-center justify-between gap-4">
        {/* Dice */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatBadge stat="dex" value={stats.dex} size="sm" />
          <StatBadge stat="ins" value={stats.ins} size="sm" />
          <StatBadge stat="mig" value={stats.mig} size="sm" />
          <StatBadge stat="wlp" value={stats.wlp} size="sm" />
        </div>

        {/* Def & MDef & Init */}
        <div className="flex items-center gap-3 font-mono text-xs text-[#2c221e]">
          <div className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-amber-700" />
            <span>物防: <strong className="text-amber-900 font-bold">{stats.def}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-blue-700" />
            <span>魔防: <strong className="text-blue-900 font-bold">{stats.mdef}</strong></span>
          </div>
          <div>
            <span>先攻: <strong className="text-[#3c2415]">+{stats.init}</strong></span>
          </div>
        </div>
      </div>

      {/* Equipment List */}
      <div className="p-4 border-b border-[#d6c7ab] bg-[#fffdf9] text-xs">
        <h4 className="text-[11px] font-mono font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-[#d6c7ab]/60 pb-1">
          <Swords className="w-3.5 h-3.5 text-amber-700" /> 裝備配置
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#2c221e] font-mono">
          <div className="bg-[#fbf7ee] p-2 rounded-lg border border-[#d6c7ab]">
            <span className="text-[#8c7b6c]">主手: </span>
            <span className="text-[#3c2415] font-bold font-sans">{character.equipment?.mainHand || '無'}</span>
          </div>
          <div className="bg-[#fbf7ee] p-2 rounded-lg border border-[#d6c7ab]">
            <span className="text-[#8c7b6c]">副手/盾: </span>
            <span className="text-[#3c2415] font-bold font-sans">{character.equipment?.offHand || '無'}</span>
          </div>
          <div className="bg-[#fbf7ee] p-2 rounded-lg border border-[#d6c7ab]">
            <span className="text-[#8c7b6c]">防具: </span>
            <span className="text-[#3c2415] font-bold font-sans">{character.equipment?.armor || '無'}</span>
          </div>
          <div className="bg-[#fbf7ee] p-2 rounded-lg border border-[#d6c7ab]">
            <span className="text-[#8c7b6c]">飾品: </span>
            <span className="text-[#3c2415] font-bold font-sans">{character.equipment?.accessory || '無'}</span>
          </div>
        </div>
      </div>

      {/* Classes & Skills Details */}
      <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto bg-[#fffdf9]">
        <div>
          <h4 className="text-xs font-mono font-bold text-amber-900 uppercase tracking-wider mb-2 border-b border-[#d6c7ab]/60 pb-1">
            職業特技清單 (Class Skills)
          </h4>
          <div className="space-y-2">
            {(character.classes || []).map((cl, cIdx) => (
              <div key={cIdx} className="space-y-1.5">
                {(cl.skills || []).map((sk, sIdx) => {
                  const classDef = rulesData.classes[cl.className];
                  const skillDef = classDef?.skills?.find(s => s.name === sk.name);
                  return (
                    <div key={sIdx} className="bg-[#fbf7ee] rounded-lg p-2.5 border border-[#d6c7ab] text-xs">
                      <div className="flex items-center justify-between font-bold text-[#3c2415] mb-1">
                        <span>✦ {sk.name}</span>
                        <span className="font-mono text-stone-600 text-[11px]">
                          SL {sk.sl} / {skillDef?.maxSL || 5}
                        </span>
                      </div>
                      <p className="text-[#6b5a4b] leading-relaxed font-sans text-[11px]">
                        {skillDef?.desc || '暫無說明'}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Heroic Skills */}
        {character.heroicSkills && character.heroicSkills.length > 0 && (
          <div>
            <h4 className="text-xs font-mono font-bold text-blue-900 uppercase tracking-wider mb-2 border-b border-[#d6c7ab]/60 pb-1">
              英雄技能 (Heroic Skills)
            </h4>
            <div className="space-y-2">
              {character.heroicSkills.map((hs, idx) => (
                <div key={idx} className="bg-[#fbf7ee] rounded-lg p-2.5 border border-[#d6c7ab] text-xs">
                  <div className="font-bold text-blue-900 mb-1">👑 {hs.name}</div>
                  <p className="text-[#6b5a4b] leading-relaxed font-sans text-[11px]">{hs.effect}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personal Clocks */}
        {character.clocks && character.clocks.length > 0 && (
          <div>
            <h4 className="text-xs font-mono font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-[#d6c7ab]/60 pb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-700" /> 個人命刻 (Personal Clocks)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {character.clocks.map((clock, idx) => (
                <ClockTracker
                  key={clock.id || idx}
                  title={clock.title}
                  totalSegments={clock.totalSegments || 6}
                  filledSegments={clock.filledSegments || 0}
                  theme={clock.theme || 'amber'}
                  type={clock.type || 'circle'}
                  size={100}
                  onChange={onUpdateClock ? (newVal => onUpdateClock(clock.id, newVal)) : null}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
