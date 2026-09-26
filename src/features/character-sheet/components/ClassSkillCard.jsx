import React, { useState } from 'react';
import {
  GiSparkles,
  GiCheckMark,
  GiHazardSign,
  GiTrashCan,
  GiUpgrade,
  GiSaveArrow,
  GiQuillInk
} from 'react-icons/gi';
import GameIcon from '../../../components/ui/GameIcon';
import JRPGBadge from '../../../components/ui/JRPGBadge';
import JRPGButton from '../../../components/ui/JRPGButton';
import SkillStarPips from './SkillStarPips';
import SkillDescription from '../utils/skillFormulaEvaluator';
import { getClassInfo } from '../data/sourcebookConfig';
import rulesData from '../data/rulesData.json';

/**
 * 職業特技管理卡片 (ClassSkillCard)
 * 滿足需求 1, 2, 3：
 * 1. 中英文名、專屬圖標並存，附帶一目了然的一句話風格描述。
 * 2. 展開點選模式：列出所有特技，Max SL 星星視覺化，點擊變色；點選儲存後恢復簡潔，僅顯示已點亮特技。
 * 3. 動態公式求值：未點時顯示計算公式，點亮後自動算好精準數值。
 */
export default function ClassSkillCard({
  classItem,
  classIndex,
  theme,
  isInitialEdit = false,
  onUpdateSkills,
  onRemoveClass
}) {
  const [isEditing, setIsEditing] = useState(isInitialEdit);

  const className = classItem.className;
  const classInfo = getClassInfo(className);
  const classDef = rulesData.classes[className] || {};
  const allAvailableSkills = classDef.skills || [];

  // 暫存的特技配置字典 (用於編輯模式，保存點選狀態)
  const [draftSkills, setDraftSkills] = useState(() => {
    const map = {};
    allAvailableSkills.forEach(sk => {
      const existing = (classItem.skills || []).find(s => s.name === sk.name);
      map[sk.name] = existing ? existing.sl : 0;
    });
    return map;
  });

  // 當切換到編輯模式時，同步最新的 classItem.skills
  const handleStartEdit = () => {
    const map = {};
    allAvailableSkills.forEach(sk => {
      const existing = (classItem.skills || []).find(s => s.name === sk.name);
      map[sk.name] = existing ? existing.sl : 0;
    });
    setDraftSkills(map);
    setIsEditing(true);
  };

  // 調整特技點數
  const handleSetSkillSL = (skillName, newSL) => {
    setDraftSkills(prev => ({
      ...prev,
      [skillName]: Math.max(0, newSL)
    }));
  };

  // 計算暫存總 SL
  const draftTotalSL = Object.values(draftSkills).reduce((sum, sl) => sum + sl, 0);

  // 儲存配置：僅保留 SL >= 1 的特技，恢復簡潔模式
  const handleSave = () => {
    const activeSkills = [];
    allAvailableSkills.forEach(sk => {
      const sl = draftSkills[sk.name] || 0;
      if (sl > 0) {
        activeSkills.push({
          name: sk.name,
          sl: Math.min(sk.maxSL || 5, sl)
        });
      }
    });

    onUpdateSkills(classIndex, activeSkills);
    setIsEditing(false);
  };

  // 取消編輯
  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div
      className="rounded-xl border transition-all duration-200 overflow-hidden shadow-sm"
      style={{
        backgroundColor: theme.panelBg,
        borderColor: isEditing ? theme.accent : theme.border
      }}
    >
      {/* ================= 卡片頂部標題區 (需求 1：中英文名 + 專屬圖標 + 一言風格) ================= */}
      <div
        className="p-3.5 sm:p-4 border-b flex flex-col gap-2 transition-colors"
        style={{
          backgroundColor: isEditing ? theme.subpanelBg : theme.panelBg,
          borderColor: theme.border
        }}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* 中英文名 + 圖標 */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-lg border flex items-center justify-center shadow-xs shrink-0"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                color: theme.accent
              }}
            >
              <GameIcon name={classInfo.icon || className} size={22} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-serif font-black text-base tracking-wide" style={{ color: theme.textDark }}>
                  {classInfo.name}
                </h4>
                <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wider">
                  / {classInfo.en}
                </span>
                <JRPGBadge variant={theme.badgeVariant} size="xs">
                  Lv {isEditing ? draftTotalSL : classItem.level}
                </JRPGBadge>
              </div>

              {/* 免費職業福利 */}
              {classDef.freeBonus && (
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className="text-xs font-mono font-bold text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded border border-amber-300 shadow-2xs">
                    <SkillDescription desc={classDef.freeBonus} />
                  </span>
                  {classDef.freeBenefits && (
                    <span className="text-xs text-slate-600 line-clamp-1" title={classDef.freeBenefits}>
                      <SkillDescription desc={classDef.freeBenefits} />
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 右側按鈕區 */}
          <div className="flex items-center gap-1.5 ml-auto">
            {!isEditing ? (
              <JRPGButton
                variant={theme.buttonVariant || 'primary'}
                size="xs"
                icon={GiQuillInk}
                onClick={handleStartEdit}
                title="點擊展開此職業的所有技能進行加點或調整"
              >
                配置技能
              </JRPGButton>
            ) : (
              <button
                type="button"
                onClick={handleCancel}
                className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 rounded font-medium cursor-pointer"
              >
                取消
              </button>
            )}

            <button
              type="button"
              onClick={() => onRemoveClass(className)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
              title={`移除職業【${className}】`}
            >
              <GiTrashCan className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 需求 1：一小句風格/戰鬥畫風敘述（杜絕長篇大論） */}
        <p className="text-xs text-slate-600 italic leading-relaxed pl-0.5 border-l-2 pl-2" style={{ borderColor: theme.accent }}>
          {classInfo.tagline}
        </p>
      </div>

      {/* ================= 模式 A：簡潔檢視模式 (Compact / Saved Mode) ================= */}
      {!isEditing && (
        <div className="p-3.5 sm:p-4 space-y-2.5">
          {(!classItem.skills || classItem.skills.length === 0) ? (
            <div
              className="p-4 rounded-xl border border-dashed text-center text-xs space-y-1.5"
              style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
            >
              <div className="font-bold text-slate-700">尚未分配技能點數</div>
              <p className="text-slate-500 text-[11px]">
                點擊「配置技能」展開查看全部特技，投入點數。
              </p>
              <JRPGButton
                variant={theme.buttonVariant || 'primary'}
                size="xs"
                icon={GiSparkles}
                onClick={handleStartEdit}
                className="mt-1"
              >
                配置技能
              </JRPGButton>
            </div>
          ) : (
            <div className="space-y-2">
              {classItem.skills.map((sk, sIdx) => {
                const skillDef = allAvailableSkills.find(s => s.name === sk.name);
                const maxSL = skillDef?.maxSL || 5;

                return (
                  <div
                    key={sIdx}
                    className="p-3 rounded-xl border text-xs space-y-1.5 transition-colors shadow-2xs"
                    style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold flex items-center gap-1.5 text-sm sm:text-base" style={{ color: theme.textDark }}>
                        <span style={{ color: theme.accent }}>✦</span>
                        {sk.name}
                      </span>

                      {/* 視覺化星芒 */}
                      <SkillStarPips
                        maxSL={maxSL}
                        currentSL={sk.sl}
                        disabled={true}
                        size={18}
                      />
                    </div>

                    {/* 需求 3：自動算好數值的動態公式 */}
                    <div className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-sans pt-0.5">
                      <SkillDescription desc={skillDef?.desc || ''} sl={sk.sl} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= 模式 B：展開點選模式 (Full Allocation / Edit Mode) ================= */}
      {isEditing && (
        <div className="p-3.5 sm:p-4 space-y-3.5 bg-amber-50/20">
          <div className="flex items-center justify-between text-xs text-slate-600 border-b pb-2" style={{ borderColor: theme.border }}>
            <span className="font-bold flex items-center gap-1">
              <GiSparkles className="w-3.5 h-3.5" style={{ color: theme.accent }} />
              點擊星星或卡片分配技能等級 (SL)，再次點擊已亮星星可降級：
            </span>
            <span className="font-mono font-bold" style={{ color: theme.textDark }}>
              本職等級合計：<strong className="text-amber-800 text-sm">Lv {draftTotalSL}</strong>
            </span>
          </div>

          {/* 列出該職業的所有技能 */}
          <div className="space-y-2.5">
            {allAvailableSkills.map((sk) => {
              const currentSL = draftSkills[sk.name] || 0;
              const maxSL = sk.maxSL || 5;
              const isLearned = currentSL > 0;

              return (
                <div
                  key={sk.name}
                  onClick={() => {
                    // 點擊卡片若未習得則設為 1，若已習得且小於上限則加 1，若滿了則循環為 0
                    if (currentSL < maxSL) {
                      handleSetSkillSL(sk.name, currentSL + 1);
                    } else {
                      handleSetSkillSL(sk.name, 0);
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all duration-200 cursor-pointer select-none ${
                    isLearned
                      ? 'bg-amber-50/80 border-amber-400 shadow-xs ring-1 ring-amber-400/40'
                      : 'bg-white/60 border-slate-200/90 hover:bg-white hover:border-slate-300 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          isLearned ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-slate-300'
                        }`}
                      />
                      <span
                        className={`text-sm sm:text-base tracking-wide font-black ${
                          isLearned ? 'text-amber-950 font-serif' : 'text-slate-700'
                        }`}
                      >
                        {sk.name}
                      </span>
                      {isLearned && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-mono">
                          已點亮
                        </span>
                      )}
                    </div>

                    {/* 星星指示器 + 加減快捷鍵 */}
                    <div className="flex items-center gap-2">
                      <SkillStarPips
                        maxSL={maxSL}
                        currentSL={currentSL}
                        onChange={(newSL) => handleSetSkillSL(sk.name, newSL)}
                        size={18}
                      />

                      <div className="flex items-center gap-1 border-l pl-2 border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleSetSkillSL(sk.name, currentSL - 1)}
                          disabled={currentSL <= 0}
                          className="w-6 h-6 rounded border flex items-center justify-center font-bold text-xs disabled:opacity-20 hover:bg-white active:scale-95 transition-all cursor-pointer"
                          style={{ borderColor: theme.border, color: theme.textDark }}
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetSkillSL(sk.name, currentSL + 1)}
                          disabled={currentSL >= maxSL}
                          className="w-6 h-6 rounded border flex items-center justify-center font-bold text-xs disabled:opacity-20 hover:bg-white active:scale-95 transition-all cursor-pointer"
                          style={{ borderColor: theme.border, color: theme.textDark }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 需求 3：動態公式求值 (未點時展示公式，點亮後展示精算結果) */}
                  <div className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-sans pl-4 border-l border-slate-200">
                    <SkillDescription desc={sk.desc} sl={currentSL} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 底部儲存確認列 */}
          <div className="pt-2 border-t flex items-center justify-between gap-3" style={{ borderColor: theme.border }}>
            <div className="text-xs text-slate-500 font-mono">
              已選技能：<strong className="text-slate-800">{Object.values(draftSkills).filter(sl => sl > 0).length}</strong> / {allAvailableSkills.length} 個
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-lg border text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
              >
                取消變更
              </button>

              <JRPGButton
                variant={theme.buttonVariant || 'primary'}
                size="sm"
                icon={GiSaveArrow}
                onClick={handleSave}
                title="儲存配置並恢復簡潔顯示"
              >
                儲存技能配置
              </JRPGButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
