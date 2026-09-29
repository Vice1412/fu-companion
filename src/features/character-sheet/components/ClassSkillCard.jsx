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
import SkillSuboptionModal from './SkillSuboptionModal';
import {
  getSkillSuboptionConfig,
  calculateSkillSuboptionMax
} from '../data/skillSuboptionsData';
import { getClassInfo } from '../data/sourcebookConfig';
import rulesData from '../data/rulesData.json';

/**
 * 子項目狀態與配置條 (SkillSuboptionBar)
 */
function SkillSuboptionBar({
  className,
  skillName,
  sl,
  selectedOptions = [],
  onOpenModal
}) {
  const config = getSkillSuboptionConfig(className, skillName);
  if (!config || sl <= 0) return null;

  const maxQuota = calculateSkillSuboptionMax(className, skillName, sl);

  // 整理顯示清單
  let selectedList = [];
  let selectedCount = 0;
  if (Array.isArray(selectedOptions)) {
    selectedList = selectedOptions;
    selectedCount = selectedOptions.length;
  } else if (selectedOptions && typeof selectedOptions === 'object') {
    const keys = selectedOptions.keys || [];
    const tones = selectedOptions.tones || [];
    selectedList = [
      ...keys.map(k => `音調: ${k}`),
      ...tones.map(t => `曲風: ${t}`)
    ];
    selectedCount = keys.length + tones.length;
  }

  const isComplete = selectedCount === maxQuota;
  const isOver = selectedCount > maxQuota;
  const isUnder = selectedCount < maxQuota;

  return (
    <div className="mt-2 pt-2 border-t border-slate-200/80 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* 配額狀態指示徽章 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {selectedCount === 0 ? (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-dashed border-slate-300 font-bold">
              尚未配置任何項目
            </span>
          ) : isComplete ? (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1">
              <GiCheckMark className="w-3 h-3 text-emerald-700" />
              <span>已掌握 {selectedCount} / {maxQuota}（已完成構築）</span>
            </span>
          ) : isOver ? (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 font-bold flex items-center gap-1">
              <GiHazardSign className="w-3 h-3 text-rose-700" />
              <span>已掌握 {selectedCount} / {maxQuota}（超出 {selectedCount - maxQuota} 個，請刪減）</span>
            </span>
          ) : (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold flex items-center gap-1">
              <GiSparkles className="w-3 h-3 text-amber-600" />
              <span>已掌握 {selectedCount} / {maxQuota}（尚餘 {maxQuota - selectedCount} 個名額）</span>
            </span>
          )}
        </div>

        {/* 觸發彈窗按鈕 */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal();
          }}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
            selectedCount === 0
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-2xs'
              : 'bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs'
          }`}
        >
          <GiQuillInk className="w-3.5 h-3.5" />
          <span>{selectedCount === 0 ? `配置${config.itemTypeTitle}` : `調整${config.itemTypeTitle}`}</span>
        </button>
      </div>

      {/* 已選標籤列 */}
      {selectedCount > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {selectedList.map((item, idx) => (
            <span
              key={idx}
              className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-950 border border-amber-200 font-bold flex items-center gap-1 shadow-2xs"
            >
              <span className="text-amber-500">✦</span>
              <span>{item}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-slate-500 italic">
          尚未選擇任何項目。請點擊上方按鈕展開清單完成角色構築。
        </p>
      )}
    </div>
  );
}

/**
 * 職業特技管理卡片 (ClassSkillCard)
 * 滿足需求 1, 2, 3 與子項目挑選構築：
 * 1. 中英文名、專屬圖標並存，附帶一目了然的一句話風格描述。
 * 2. 展開點選模式：列出所有特技，Max SL 星星視覺化，點擊變色；點選儲存後恢復簡潔，僅顯示已點亮特技。
 * 3. 動態公式求值：未點時顯示計算公式，點亮後自動算好精準數值。
 * 4. 子項目專屬挑選：為 9 大技能提供即時配額標籤與構建抽屜。
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

  // 子項目構築彈窗目標特技 { skillName, sl, selectedOptions }
  const [suboptionModalSkill, setSuboptionModalSkill] = useState(null);

  // 暫存的特技配置字典 (用於編輯模式，保存點選狀態)
  const [draftSkills, setDraftSkills] = useState(() => {
    const map = {};
    allAvailableSkills.forEach(sk => {
      const existing = (classItem.skills || []).find(s => s.name === sk.name);
      map[sk.name] = existing ? existing.sl : 0;
    });
    return map;
  });

  // 暫存的子項目配置字典 (用於編輯模式，保存各特技的子項目選項)
  const [draftSuboptions, setDraftSuboptions] = useState(() => {
    const map = {};
    allAvailableSkills.forEach(sk => {
      const existing = (classItem.skills || []).find(s => s.name === sk.name);
      map[sk.name] = existing?.selectedOptions || [];
    });
    return map;
  });

  // 當切換到編輯模式時，同步最新的 classItem.skills
  const handleStartEdit = () => {
    const map = {};
    const subMap = {};
    allAvailableSkills.forEach(sk => {
      const existing = (classItem.skills || []).find(s => s.name === sk.name);
      map[sk.name] = existing ? existing.sl : 0;
      subMap[sk.name] = existing?.selectedOptions || [];
    });
    setDraftSkills(map);
    setDraftSuboptions(subMap);
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
          sl: Math.min(sk.maxSL || 5, sl),
          selectedOptions: draftSuboptions[sk.name] || []
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

  // 開啟子項目彈窗
  const handleOpenSuboptionModal = (skillName, currentSL, currentSelected) => {
    setSuboptionModalSkill({
      skillName,
      sl: currentSL,
      selectedOptions: currentSelected
    });
  };

  // 儲存子項目彈窗選擇結果
  const handleSaveSuboptions = (newOptions) => {
    if (!suboptionModalSkill) return;
    const targetSkillName = suboptionModalSkill.skillName;

    if (isEditing) {
      setDraftSuboptions(prev => ({
        ...prev,
        [targetSkillName]: newOptions
      }));
    } else {
      const curSkills = JSON.parse(JSON.stringify(classItem.skills || []));
      const target = curSkills.find(s => s.name === targetSkillName);
      if (target) {
        target.selectedOptions = newOptions;
        onUpdateSkills(classIndex, curSkills);
      }
    }
    setSuboptionModalSkill(null);
  };

  return (
    <div
      className="rounded-xl border transition-all duration-200 overflow-hidden shadow-sm"
      style={{
        backgroundColor: theme.panelBg,
        borderColor: isEditing ? theme.accent : theme.border
      }}
    >
      {/* ================= 卡片頂部標題區 ================= */}
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

        {/* 風格/戰鬥畫風敘述 */}
        <p className="text-xs text-slate-600 italic leading-relaxed pl-2 border-l-2" style={{ borderColor: theme.accent }}>
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

                    {/* 自動算好數值的動態公式 */}
                    <div className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-sans pt-0.5">
                      <SkillDescription desc={skillDef?.desc || ''} sl={sk.sl} />
                    </div>

                    {/* 子項目狀態與配置條 */}
                    <SkillSuboptionBar
                      className={className}
                      skillName={sk.name}
                      sl={sk.sl}
                      selectedOptions={sk.selectedOptions || []}
                      onOpenModal={() => handleOpenSuboptionModal(sk.name, sk.sl, sk.selectedOptions || [])}
                    />
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
              const currentSuboptions = draftSuboptions[sk.name] || [];

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

                  {/* 動態公式求值 (未點時展示公式，點亮後展示精算結果) */}
                  <div className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-sans pl-4 border-l border-slate-200">
                    <SkillDescription desc={sk.desc} sl={currentSL} />
                  </div>

                  {/* 子項目狀態與配置條 */}
                  <div onClick={e => e.stopPropagation()}>
                    <SkillSuboptionBar
                      className={className}
                      skillName={sk.name}
                      sl={currentSL}
                      selectedOptions={currentSuboptions}
                      onOpenModal={() => handleOpenSuboptionModal(sk.name, currentSL, currentSuboptions)}
                    />
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

      {/* ================= 子項目構築彈窗 ================= */}
      {suboptionModalSkill && (
        <SkillSuboptionModal
          isOpen={true}
          onClose={() => setSuboptionModalSkill(null)}
          className={className}
          skillName={suboptionModalSkill.skillName}
          sl={suboptionModalSkill.sl}
          selectedOptions={suboptionModalSkill.selectedOptions}
          onSave={handleSaveSuboptions}
          theme={theme}
        />
      )}
    </div>
  );
}
