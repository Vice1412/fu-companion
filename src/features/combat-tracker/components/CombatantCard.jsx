import React from 'react';
import {
  Heart,
  Sparkles,
  Shield,
  Zap,
  Swords,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  FileText,
  AlertTriangle
} from 'lucide-react';
import JRPGBadge from '../../../components/ui/JRPGBadge';

const STATUS_EFFECTS = [
  { key: 'slow', name: '遲緩', en: 'Slow', desc: '敏捷降階', color: 'border-amber-400 text-amber-800 bg-amber-50' },
  { key: 'dazed', name: '眩暈', en: 'Dazed', desc: '洞察降階', color: 'border-sky-400 text-sky-800 bg-sky-50' },
  { key: 'weak', name: '虛弱', en: 'Weak', desc: '力量降階', color: 'border-rose-400 text-rose-800 bg-rose-50' },
  { key: 'shaken', name: '動搖', en: 'Shaken', desc: '意志降階', color: 'border-purple-400 text-purple-800 bg-purple-50' },
  { key: 'enraged', name: '狂怒', en: 'Enraged', desc: '敏洞降階·限普攻', color: 'border-red-400 text-red-800 bg-red-50' },
  { key: 'poisoned', name: '中毒', en: 'Poison', desc: '回合結束受到5毒傷', color: 'border-emerald-400 text-emerald-800 bg-emerald-50' }
];

export default function CombatantCard({
  combatant,
  onUpdate,
  onRemove,
  onOpenDrawer
}) {
  if (!combatant) return null;

  const isPlayer = combatant.sourceType === 'character' || combatant.faction === '玩家隊伍';
  const curHp = combatant.hp?.current ?? 50;
  const maxHp = combatant.hp?.max ?? 50;
  const crisisThreshold = combatant.hp?.crisisThreshold ?? Math.floor(maxHp / 2);
  const isCrisis = curHp <= crisisThreshold;
  const hpPercent = Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)));

  const curMp = combatant.mp?.current ?? 30;
  const maxMp = combatant.mp?.max ?? 30;
  const mpPercent = Math.max(0, Math.min(100, Math.round((curMp / maxMp) * 100)));

  const handleAdjustHp = (delta) => {
    const next = Math.max(0, Math.min(maxHp, curHp + delta));
    onUpdate({
      ...combatant,
      hp: { ...combatant.hp, current: next }
    });
  };

  const handleAdjustMp = (delta) => {
    const next = Math.max(0, Math.min(maxMp, curMp + delta));
    onUpdate({
      ...combatant,
      mp: { ...combatant.mp, current: next }
    });
  };

  const handleToggleActed = () => {
    onUpdate({
      ...combatant,
      hasActed: !combatant.hasActed
    });
  };

  const handleToggleStatus = (statusKey) => {
    const currentStatuses = combatant.statusEffects || {};
    onUpdate({
      ...combatant,
      statusEffects: {
        ...currentStatuses,
        [statusKey]: !currentStatuses[statusKey]
      }
    });
  };

  const handleToggleRevealSkill = (skillId) => {
    const updatedSkills = (combatant.skills || []).map(sk =>
      sk.id === skillId ? { ...sk, isRevealed: !sk.isRevealed } : sk
    );
    onUpdate({
      ...combatant,
      skills: updatedSkills
    });
  };

  return (
    <div
      className={`bg-[#fffdf9] rounded-xl border transition-all duration-200 shadow-sm overflow-hidden flex flex-col relative ${
        combatant.hasActed
          ? 'opacity-60 border-[#d6c7ab] bg-[#f5efdf]'
          : isCrisis
            ? 'crisis-pulse-active border-rose-500 bg-rose-50/40'
            : isPlayer
              ? 'border-sky-300 hover:border-sky-500'
              : 'border-[#d6c7ab] hover:border-amber-600'
      }`}
    >
      {/* Top Border Indicator */}
      <div className={`h-1.5 w-full ${isPlayer ? 'bg-gradient-to-r from-sky-600 to-cyan-500' : 'bg-gradient-to-r from-amber-600 to-rose-600'}`} />

      {/* Header Profile */}
      <div className="p-3.5 border-b border-[#d6c7ab]/80 bg-[#f4ebd9]/40 flex items-start gap-3">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-lg bg-[#f5efdf] border border-[#d6c7ab] overflow-hidden shrink-0 flex items-center justify-center font-serif text-base text-amber-800 font-bold shadow-inner">
          {combatant.avatar ? (
            <img src={combatant.avatar} alt={combatant.name} className="w-full h-full object-cover" />
          ) : (
            combatant.name?.[0] || '戰'
          )}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-serif font-bold text-base text-[#2c221e] truncate">
              {combatant.name}
            </h4>
            <JRPGBadge variant={isPlayer ? 'cyan' : 'gold'} size="xs">
              Lv {combatant.level}
            </JRPGBadge>
            {combatant.rank && (
              <JRPGBadge variant={combatant.rank === '冠位' ? 'rose' : combatant.rank === '精英' ? 'cyan' : 'slate'} size="xs">
                {combatant.rank}
              </JRPGBadge>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#6b5a4b] mt-0.5 font-mono">
            <span>{combatant.species || combatant.role}</span>
            <span>·</span>
            <span>物防 {combatant.defense}</span>
            <span>·</span>
            <span>魔防 {combatant.magicDefense}</span>
            <span>·</span>
            <span>先攻 +{combatant.initiative}</span>
          </div>
        </div>

        {/* Has Acted Checkbox Button */}
        <button
          onClick={handleToggleActed}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            combatant.hasActed
              ? 'bg-[#eee6d3] text-[#6b5a4b] border border-[#d6c7ab]'
              : 'bg-amber-700 text-white shadow-sm hover:bg-amber-800 animate-pulse'
          }`}
          title="切換本輪是否已行動"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {combatant.hasActed ? '已行動' : '待行動'}
        </button>
      </div>

      {/* HP Bar & Stepper */}
      <div className="px-3.5 py-2.5 border-b border-[#d6c7ab]/80 bg-[#fbf7ee] space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 font-bold text-red-700 font-sans">
            <Heart className="w-3.5 h-3.5 text-red-600 fill-red-600/30" />
            <span>HP</span>
            {isCrisis && (
              <span className="text-[10px] text-rose-700 font-sans font-bold flex items-center gap-0.5 animate-bounce">
                <AlertTriangle className="w-3 h-3" /> 危機!
              </span>
            )}
          </div>
          <div className="text-[#2c221e]">
            <strong className="text-sm text-red-800 font-bold">{curHp}</strong>
            <span className="text-[#8c7b6c]"> / {maxHp}</span>
          </div>
        </div>

        {/* Progress Track */}
        <div className="w-full h-2 rounded-full bg-[#eee6d3] overflow-hidden border border-[#d6c7ab]">
          <div
            className={`h-full transition-all duration-200 ${isCrisis ? 'bg-gradient-to-r from-red-600 to-rose-500' : 'bg-gradient-to-r from-red-500 to-amber-500'}`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>

        {/* Stepper Buttons */}
        <div className="flex items-center justify-between gap-1 pt-1">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleAdjustHp(-5)}
              className="px-2 py-0.5 rounded bg-[#fffdf9] border border-[#d6c7ab] hover:border-red-400 text-[11px] font-mono text-[#2c221e] hover:text-red-700 transition-colors"
            >
              -5
            </button>
            <button
              onClick={() => handleAdjustHp(-1)}
              className="px-2 py-0.5 rounded bg-[#fffdf9] border border-[#d6c7ab] hover:border-red-400 text-[11px] font-mono text-[#2c221e] hover:text-red-700 transition-colors"
            >
              -1
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleAdjustHp(1)}
              className="px-2 py-0.5 rounded bg-[#fffdf9] border border-[#d6c7ab] hover:border-emerald-500 text-[11px] font-mono text-[#2c221e] hover:text-emerald-700 transition-colors"
            >
              +1
            </button>
            <button
              onClick={() => handleAdjustHp(5)}
              className="px-2 py-0.5 rounded bg-[#fffdf9] border border-[#d6c7ab] hover:border-emerald-500 text-[11px] font-mono text-[#2c221e] hover:text-emerald-700 transition-colors"
            >
              +5
            </button>
          </div>
        </div>
      </div>

      {/* MP Bar & Stepper */}
      <div className="px-3.5 py-2.5 border-b border-[#d6c7ab]/80 bg-[#fbf7ee]/60 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 font-bold text-sky-800 font-sans">
            <Sparkles className="w-3.5 h-3.5 text-sky-600 fill-sky-600/30" />
            <span>MP</span>
          </div>
          <div className="text-[#2c221e]">
            <strong className="text-sm text-sky-900 font-bold">{curMp}</strong>
            <span className="text-[#8c7b6c]"> / {maxMp}</span>
          </div>
        </div>

        {/* Progress Track */}
        <div className="w-full h-1.5 rounded-full bg-[#eee6d3] overflow-hidden border border-[#d6c7ab]">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-200"
            style={{ width: `${mpPercent}%` }}
          />
        </div>

        {/* Stepper Buttons */}
        <div className="flex items-center justify-between gap-1 pt-0.5">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleAdjustMp(-5)}
              className="px-2 py-0.5 rounded bg-[#fffdf9] border border-[#d6c7ab] hover:border-sky-400 text-[11px] font-mono text-[#2c221e] hover:text-sky-700 transition-colors"
            >
              -5
            </button>
            <button
              onClick={() => handleAdjustMp(-1)}
              className="px-2 py-0.5 rounded bg-[#fffdf9] border border-[#d6c7ab] hover:border-sky-400 text-[11px] font-mono text-[#2c221e] hover:text-sky-700 transition-colors"
            >
              -1
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleAdjustMp(1)}
              className="px-2 py-0.5 rounded bg-[#fffdf9] border border-[#d6c7ab] hover:border-sky-400 text-[11px] font-mono text-[#2c221e] hover:text-sky-700 transition-colors"
            >
              +1
            </button>
            <button
              onClick={() => handleAdjustMp(5)}
              className="px-2 py-0.5 rounded bg-[#fffdf9] border border-[#d6c7ab] hover:border-sky-400 text-[11px] font-mono text-[#2c221e] hover:text-sky-700 transition-colors"
            >
              +5
            </button>
          </div>
        </div>
      </div>

      {/* 6 Status Effects Toggles */}
      <div className="p-3 border-b border-[#d6c7ab]/80 bg-[#f5efdf]/40">
        <div className="text-[10px] font-mono text-[#8c7b6c] uppercase tracking-wider mb-1.5 font-bold">
          狀態異常 (Status Effects)
        </div>
        <div className="grid grid-cols-3 gap-1">
          {STATUS_EFFECTS.map(st => {
            const isActive = combatant.statusEffects?.[st.key] || false;
            return (
              <button
                key={st.key}
                type="button"
                onClick={() => handleToggleStatus(st.key)}
                className={`px-1.5 py-1 rounded-md text-[11px] font-mono border transition-all text-center flex flex-col items-center ${
                  isActive
                    ? `${st.color} font-bold ring-1 ring-amber-500/50 shadow-sm`
                    : 'border-[#d6c7ab] bg-[#fffdf9] text-[#6b5a4b] hover:border-amber-600'
                }`}
                title={st.desc}
              >
                <span className="font-bold">{st.name}</span>
                <span className="text-[9px] opacity-80">{st.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gradual Skill Reveal (NPC Only) */}
      {!isPlayer && combatant.skills && combatant.skills.length > 0 && (
        <div className="p-3 border-b border-[#d6c7ab]/80 bg-[#f5efdf]/60 space-y-1.5">
          <div className="text-[10px] font-mono text-[#6b5a4b] flex items-center justify-between font-bold">
            <span>技能組 (點擊 👁️ 向全員揭露)</span>
            <span className="text-amber-800 text-[10px]">
              已揭露: {combatant.skills.filter(s => s.isRevealed).length} / {combatant.skills.length}
            </span>
          </div>

          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {combatant.skills.map(sk => (
              <div
                key={sk.id}
                className={`p-1.5 rounded-md border text-xs flex items-center justify-between gap-2 transition-colors ${
                  sk.isRevealed
                    ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-sm'
                    : 'border-[#d6c7ab] bg-[#fffdf9] text-[#8c7b6c]'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold flex items-center gap-1.5 truncate">
                    <span>{sk.name}</span>
                    {!sk.isRevealed && <span className="text-[10px] text-[#8c7b6c] font-mono">(未公開)</span>}
                  </div>
                  {sk.desc && sk.isRevealed && (
                    <p className="text-[10px] text-[#6b5a4b] font-sans line-clamp-1 mt-0.5">{sk.desc}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleRevealSkill(sk.id)}
                  className={`p-1 rounded transition-colors ${
                    sk.isRevealed
                      ? 'text-amber-700 hover:text-amber-800'
                      : 'text-[#8c7b6c] hover:text-[#2c221e]'
                  }`}
                  title={sk.isRevealed ? "收回隱藏" : "向所有人公開此技能"}
                >
                  {sk.isRevealed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card Actions Footer */}
      <div className="p-2.5 bg-[#f4ebd9]/30 flex items-center justify-between gap-2 mt-auto border-t border-[#d6c7ab]/80">
        <button
          type="button"
          onClick={() => onOpenDrawer(combatant)}
          className="text-xs text-amber-800 hover:text-amber-900 flex items-center gap-1 font-bold transition-colors"
        >
          <FileText className="w-3.5 h-3.5" /> 查看完整資訊
        </button>

        <button
          type="button"
          onClick={() => onRemove(combatant.instanceId)}
          className="text-[#8c7b6c] hover:text-rose-700 p-1 transition-colors"
          title="從戰鬥移除"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
