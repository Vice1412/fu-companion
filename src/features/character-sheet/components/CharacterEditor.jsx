import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import JRPGButton from '../../../components/ui/JRPGButton';
import JRPGBadge from '../../../components/ui/JRPGBadge';
import { JRPGInput, JRPGSelect } from '../../../components/ui/JRPGInput';
import StatBadge from '../../../components/ui/StatBadge';
import CharacterCard from './CharacterCard';
import rulesData from '../data/rulesData.json';

export default function CharacterEditor({
  character,
  onChange,
  onBackToRoster
}) {
  const [activeTab, setActiveTab] = useState(1);
  const [selectedClassToAdd, setSelectedClassToAdd] = useState('');
  const [selectedHeroicToAdd, setSelectedHeroicToAdd] = useState('');

  if (!character) return null;

  const updateField = (field, value) => {
    onChange({
      ...character,
      [field]: value,
      updatedAt: new Date().toISOString()
    });
  };

  const updateAttribute = (attr, val) => {
    onChange({
      ...character,
      attributes: {
        ...(character.attributes || {}),
        [attr]: val
      },
      updatedAt: new Date().toISOString()
    });
  };

  // Class & Skill handlers
  const handleAddClass = () => {
    if (!selectedClassToAdd || !rulesData.classes[selectedClassToAdd]) return;
    const curClasses = character.classes || [];
    if (curClasses.some(c => c.className === selectedClassToAdd)) return;

    const classDef = rulesData.classes[selectedClassToAdd];
    const initialSkill = classDef.skills?.[0] ? [{ name: classDef.skills[0].name, sl: 1 }] : [];

    updateField('classes', [
      ...curClasses,
      {
        className: selectedClassToAdd,
        level: 1,
        skills: initialSkill
      }
    ]);
    setSelectedClassToAdd('');
  };

  const handleRemoveClass = (classNameToRemove) => {
    updateField('classes', (character.classes || []).filter(c => c.className !== classNameToRemove));
  };

  const handleAddSkillToClass = (classIdx, skillName) => {
    const curClasses = [...character.classes];
    const targetClass = curClasses[classIdx];
    if (targetClass.skills.some(s => s.name === skillName)) return;

    targetClass.skills.push({ name: skillName, sl: 1 });
    updateField('classes', curClasses);
  };

  const handleUpdateSkillSL = (classIdx, skillIdx, delta) => {
    const curClasses = [...character.classes];
    const targetClass = curClasses[classIdx];
    const targetSkill = targetClass.skills[skillIdx];
    const classDef = rulesData.classes[targetClass.className];
    const skillDef = classDef?.skills?.find(s => s.name === targetSkill.name);
    const maxSL = skillDef?.maxSL || 5;

    const newSL = Math.max(1, Math.min(maxSL, targetSkill.sl + delta));
    targetSkill.sl = newSL;
    targetClass.level = targetClass.skills.reduce((sum, s) => sum + s.sl, 0);

    updateField('classes', curClasses);
  };

  const handleRemoveSkillFromClass = (classIdx, skillIdx) => {
    const curClasses = [...character.classes];
    curClasses[classIdx].skills.splice(skillIdx, 1);
    curClasses[classIdx].level = curClasses[classIdx].skills.reduce((sum, s) => sum + s.sl, 0);
    updateField('classes', curClasses);
  };

  // Clocks
  const handleAddClock = () => {
    const newClock = {
      id: `clk_${Date.now()}`,
      title: '新命刻目標',
      totalSegments: 6,
      filledSegments: 0,
      theme: 'amber',
      type: 'circle'
    };
    updateField('clocks', [...(character.clocks || []), newClock]);
  };

  const handleRemoveClock = (clkId) => {
    updateField('clocks', (character.clocks || []).filter(c => c.id !== clkId));
  };

  const handleUpdateClockProgress = (clkId, newVal) => {
    const updated = (character.clocks || []).map(c => c.id === clkId ? { ...c, filledSegments: newVal } : c);
    updateField('clocks', updated);
  };

  const TABS = [
    { id: 1, label: '基礎身世' },
    { id: 2, label: '四維屬性' },
    { id: 3, label: '職業與特技' },
    { id: 4, label: '裝備配置' },
    { id: 5, label: '英雄技能與金手指' },
    { id: 6, label: '個人命刻' }
  ];

  return (
    <div className="space-y-4">
      {/* Top Editor Header */}
      <div className="bg-[#fffdf9] border border-[#d6c7ab] rounded-xl px-5 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <JRPGButton
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={onBackToRoster}
          >
            返回名冊
          </JRPGButton>
          <div className="h-4 w-[1px] bg-[#d6c7ab]" />
          <h3 className="font-serif font-black text-base text-[#3c2415] truncate max-w-xs">
            {character.name || '新冒險者'}
          </h3>
          <span className="text-xs text-[#6b5a4b] font-mono hidden sm:inline">
            (角色構建中 · 即時自動保存)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <JRPGButton
            variant="secondary"
            size="xs"
            disabled={activeTab <= 1}
            onClick={() => setActiveTab(prev => Math.max(1, prev - 1))}
          >
            上一步
          </JRPGButton>
          <span className="font-mono text-xs text-[#6b5a4b] font-bold">
            {activeTab} / {TABS.length}
          </span>
          <JRPGButton
            variant="primary"
            size="xs"
            disabled={activeTab >= TABS.length}
            onClick={() => setActiveTab(prev => Math.min(TABS.length, prev + 1))}
          >
            下一步
          </JRPGButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#d6c7ab]">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === t.id
                ? 'bg-amber-700 text-white shadow-sm'
                : 'bg-[#eee6d3] text-[#3c2f21] hover:bg-[#e4d9c0] border border-[#d6c7ab]'
            }`}
          >
            <span className="font-mono text-[10px] opacity-75">{t.id}.</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Split Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Editor Form */}
        <div className="lg:col-span-7 bg-[#fffdf9] rounded-xl border border-[#d6c7ab] p-6 shadow-sm space-y-6 text-[#2c221e]">
          {/* TAB 1: 基礎身世 */}
          {activeTab === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
                  <span className="text-amber-800">1.</span> 角色核心身份 (Identity & Themes)
                </h4>
                <p className="text-xs text-[#6b5a4b] mt-1">
                  在《FU》中，身份、主題與故鄉不僅是背景，更可透過物語點直接影響關鍵檢定！
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <JRPGInput
                  label="角色姓名"
                  value={character.name || ''}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder="例：雷恩 (Rain)"
                />
                <JRPGInput
                  label="角色等級 (Level: 5 ~ 50)"
                  type="number"
                  value={character.level || 5}
                  onChange={e => updateField('level', parseInt(e.target.value, 10) || 5)}
                />
              </div>

              <div className="space-y-3">
                <JRPGInput
                  label="身份 (Identity - 誰是你？包含職業、頭銜或宿命)"
                  value={character.identity || ''}
                  onChange={e => updateField('identity', e.target.value)}
                  placeholder="例：失去記憶的原帝國騎士、被神明驅逐的聖樂使"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <JRPGInput
                    label="主題 (Theme - 指引你前行的信念)"
                    value={character.theme || ''}
                    onChange={e => updateField('theme', e.target.value)}
                    placeholder="例：希望、救贖、復仇、野心、正義"
                  />
                  <JRPGInput
                    label="故鄉 (Origin - 你的發源地)"
                    value={character.origin || ''}
                    onChange={e => updateField('origin', e.target.value)}
                    placeholder="例：浮空島王國、邊陲的荒野廢墟"
                  />
                </div>

                <JRPGInput
                  label="持有金幣 (Zenit)"
                  type="number"
                  value={character.zenit || 500}
                  onChange={e => updateField('zenit', parseInt(e.target.value, 10) || 0)}
                />
              </div>
            </div>
          )}

          {/* TAB 2: 四維屬性 */}
          {activeTab === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
                  <span className="text-amber-800">2.</span> 四維基礎屬性骰 (Attribute Dice)
                </h4>
                <p className="text-xs text-[#6b5a4b] mt-1">
                  官方標準推薦起始陣列：
                  <span className="text-amber-900 font-mono ml-1 font-bold">d10, d8, d8, d6</span> 或
                  <span className="text-amber-900 font-mono ml-1 font-bold">d8, d8, d8, d8</span> 或
                  <span className="text-amber-900 font-mono ml-1 font-bold">d10, d10, d6, d6</span>。
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { key: 'dex', name: '敏捷 (DEX)', desc: '速度、靈巧、物理迴避' },
                  { key: 'ins', name: '洞察 (INS)', desc: '感知、智力、魔法防禦' },
                  { key: 'mig', name: '力量 (MIG)', desc: '肉體強韌、近戰打擊、生命值' },
                  { key: 'wlp', name: '意志 (WLP)', desc: '心靈剛毅、魔力儲備、魅力' }
                ].map(stat => (
                  <div key={stat.key} className="bg-[#fbf7ee] border border-[#d6c7ab] rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm">
                    <span className="font-bold text-xs text-[#3c2415]">{stat.name}</span>
                    <StatBadge
                      stat={stat.key}
                      value={character.attributes?.[stat.key] || 8}
                      onChange={newVal => updateAttribute(stat.key, newVal)}
                      size="lg"
                    />
                    <span className="text-[10px] text-[#6b5a4b] text-center mt-1">{stat.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 職業與特技 */}
          {activeTab === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
                  <span className="text-amber-800">3.</span> 職業與特技 (Classes & Skills)
                </h4>
                <p className="text-xs text-[#6b5a4b] mt-1">
                  內建全套 28 種官方繁中職業資料庫。起始 5 級可在 2~3 個職業中分配技能點數。
                </p>
              </div>

              {/* Add Class */}
              <div className="flex items-center gap-2 p-3.5 bg-[#f5efdf] rounded-xl border border-[#d6c7ab]">
                <select
                  value={selectedClassToAdd}
                  onChange={e => setSelectedClassToAdd(e.target.value)}
                  className="flex-1 bg-[#fffdf9] border border-[#d6c7ab] rounded-lg px-3 py-2 text-xs text-[#2c221e] outline-none focus:border-amber-700 shadow-sm"
                >
                  <option value="">-- 挑選欲修習的職業 --</option>
                  {Object.keys(rulesData.classes).map(cName => {
                    const cl = rulesData.classes[cName];
                    const isAlready = (character.classes || []).some(c => c.className === cName);
                    return (
                      <option key={cName} value={cName} disabled={isAlready}>
                        {cName} {cl.freeBonus ? `(${cl.freeBonus})` : ''} {isAlready ? '(已修習)' : ''}
                      </option>
                    );
                  })}
                </select>

                <JRPGButton
                  variant="primary"
                  size="xs"
                  icon={Plus}
                  onClick={handleAddClass}
                  disabled={!selectedClassToAdd}
                >
                  修習新職業
                </JRPGButton>
              </div>

              {/* Configured Classes */}
              <div className="space-y-4">
                {(character.classes || []).map((cl, cIdx) => {
                  const classDef = rulesData.classes[cl.className] || {};
                  return (
                    <div key={cl.className} className="bg-[#fbf7ee] rounded-xl p-4 border border-[#d6c7ab] space-y-3 shadow-sm">
                      {/* Class Header */}
                      <div className="flex items-center justify-between border-b border-[#d6c7ab] pb-2">
                        <div className="flex items-center gap-2">
                          <h5 className="font-serif font-black text-base text-[#3c2415]">
                            {cl.className}
                          </h5>
                          <JRPGBadge variant="gold" size="xs">
                            Lv {cl.level}
                          </JRPGBadge>
                          {classDef.freeBonus && (
                            <span className="text-[11px] text-emerald-800 font-mono font-bold">
                              增益: {classDef.freeBonus}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveClass(cl.className)}
                          className="text-[#8c7b6c] hover:text-red-700 p-1 transition-colors"
                          title="移除職業"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Skills in Class */}
                      <div className="space-y-2">
                        {(cl.skills || []).map((sk, sIdx) => {
                          const skillDef = classDef.skills?.find(s => s.name === sk.name);
                          const maxSL = skillDef?.maxSL || 5;

                          return (
                            <div key={sk.name} className="bg-[#fffdf9] rounded-lg p-3 border border-[#d6c7ab] text-xs flex flex-col gap-1.5 shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#3c2415] flex items-center gap-1.5">
                                  <span className="text-amber-700">✦</span> {sk.name}
                                </span>

                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[#6b5a4b] font-bold">
                                    SL {sk.sl} / {maxSL}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSkillSL(cIdx, sIdx, -1)}
                                      disabled={sk.sl <= 1}
                                      className="px-1.5 py-0.5 rounded bg-[#eee6d3] hover:bg-[#e4d9c0] text-[#3c2f21] border border-[#d6c7ab] disabled:opacity-30"
                                    >
                                      -
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSkillSL(cIdx, sIdx, 1)}
                                      disabled={sk.sl >= maxSL}
                                      className="px-1.5 py-0.5 rounded bg-[#eee6d3] hover:bg-[#e4d9c0] text-[#3c2f21] border border-[#d6c7ab] disabled:opacity-30"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSkillFromClass(cIdx, sIdx)}
                                    className="text-[#8c7b6c] hover:text-red-700 ml-1 font-bold"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>

                              <p className="text-[11px] text-[#6b5a4b] leading-relaxed">
                                {skillDef?.desc || ''}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add another skill */}
                      {classDef.skills && (
                        <div className="pt-1">
                          <select
                            onChange={e => {
                              if (e.target.value) {
                                handleAddSkillToClass(cIdx, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            defaultValue=""
                            className="w-full bg-[#fffdf9] border border-[#d6c7ab] rounded-lg px-3 py-1.5 text-xs text-[#6b5a4b] focus:outline-none shadow-sm"
                          >
                            <option value="" disabled>+ 添加此職業的其他技能...</option>
                            {classDef.skills.map(sk => (
                              <option key={sk.name} value={sk.name} disabled={(cl.skills || []).some(s => s.name === sk.name)}>
                                {sk.name} (Max SL: {sk.maxSL})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: 裝備配置 */}
          {activeTab === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
                  <span className="text-amber-800">4.</span> 裝備庫與數值聯動
                </h4>
                <p className="text-xs text-[#6b5a4b] mt-1">
                  裝備會即時自動計算物理防禦、魔法防禦與先攻修正。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <JRPGSelect
                  label="主手武器 (Main Hand)"
                  value={character.equipment?.mainHand || ''}
                  onChange={e => updateField('equipment', { ...character.equipment, mainHand: e.target.value })}
                  options={rulesData.equipment.weapons.map(w => ({
                    value: w.name,
                    label: `${w.name} [${w.range}] (${w.damage})`
                  }))}
                />

                <JRPGSelect
                  label="副手裝備 / 盾牌 (Off Hand)"
                  value={character.equipment?.offHand || ''}
                  onChange={e => updateField('equipment', { ...character.equipment, offHand: e.target.value })}
                  options={rulesData.equipment.shields.map(s => ({
                    value: s.name,
                    label: `${s.name} ${s.desc ? `(${s.desc})` : ''}`
                  }))}
                />

                <JRPGSelect
                  label="身體防具 (Armor)"
                  value={character.equipment?.armor || ''}
                  onChange={e => updateField('equipment', { ...character.equipment, armor: e.target.value })}
                  options={rulesData.equipment.armors.map(a => ({
                    value: a.name,
                    label: `${a.name} (${a.desc})`
                  }))}
                />

                <JRPGSelect
                  label="佩戴飾品 (Accessory)"
                  value={character.equipment?.accessory || ''}
                  onChange={e => updateField('equipment', { ...character.equipment, accessory: e.target.value })}
                  options={rulesData.equipment.accessories.map(acc => ({
                    value: acc.name,
                    label: `${acc.name} (${acc.desc})`
                  }))}
                />
              </div>
            </div>
          )}

          {/* TAB 5: 英雄技能與金手指 */}
          {activeTab === 5 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
                  <span className="text-amber-800">5.</span> 英雄技能與金手指特質
                </h4>
                <p className="text-xs text-[#6b5a4b] mt-1">
                  當職業完全精通（達到 10 級）或特殊劇情節點時解鎖。
                </p>
              </div>

              {/* Quirk Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#3c2f21]">
                  金手指特質 (Quirk)
                </label>
                <select
                  value={character.quirk || '無'}
                  onChange={e => updateField('quirk', e.target.value)}
                  className="w-full bg-[#fffdf9] border border-[#d6c7ab] rounded-lg px-3.5 py-2 text-xs text-[#2c221e] outline-none shadow-sm"
                >
                  <option value="無">無特殊金手指</option>
                  {rulesData.quirks.map(q => (
                    <option key={q.name} value={q.name}>
                      {q.name}
                    </option>
                  ))}
                </select>
                {character.quirk && character.quirk !== '無' && (
                  <p className="text-[11px] text-[#6b5a4b] italic p-2.5 bg-[#f5efdf] rounded-lg border border-[#d6c7ab]">
                    {rulesData.quirks.find(q => q.name === character.quirk)?.desc}
                  </p>
                )}
              </div>

              {/* Heroic Skills */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-[#3c2f21]">
                  已掌握英雄技能 (Heroic Skills)
                </label>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedHeroicToAdd}
                    onChange={e => setSelectedHeroicToAdd(e.target.value)}
                    className="flex-1 bg-[#fffdf9] border border-[#d6c7ab] rounded-lg px-3 py-1.5 text-xs text-[#2c221e] outline-none shadow-sm"
                  >
                    <option value="">-- 選擇英雄技能 --</option>
                    {rulesData.heroicSkills.map(h => (
                      <option key={h.name} value={h.name}>
                        {h.name} [{h.requirement}]
                      </option>
                    ))}
                  </select>
                  <JRPGButton
                    variant="primary"
                    size="xs"
                    onClick={() => {
                      if (!selectedHeroicToAdd) return;
                      const hObj = rulesData.heroicSkills.find(h => h.name === selectedHeroicToAdd);
                      if (hObj && !(character.heroicSkills || []).some(h => h.name === hObj.name)) {
                        updateField('heroicSkills', [...(character.heroicSkills || []), hObj]);
                      }
                      setSelectedHeroicToAdd('');
                    }}
                    disabled={!selectedHeroicToAdd}
                  >
                    添加
                  </JRPGButton>
                </div>

                <div className="space-y-2">
                  {(character.heroicSkills || []).map((hs, idx) => (
                    <div key={idx} className="bg-[#fbf7ee] rounded-lg p-3 border border-[#d6c7ab] text-xs flex items-start justify-between gap-3 shadow-sm">
                      <div>
                        <div className="font-bold text-blue-900">👑 {hs.name}</div>
                        <p className="text-[11px] text-[#6b5a4b] mt-0.5">{hs.effect}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateField('heroicSkills', character.heroicSkills.filter((_, i) => i !== idx));
                        }}
                        className="text-[#8c7b6c] hover:text-red-700 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: 個人命刻 */}
          {activeTab === 6 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
                    <span className="text-amber-800">6.</span> 個人命刻目標 (Personal Clocks)
                  </h4>
                  <p className="text-xs text-[#6b5a4b] mt-1">
                    記錄角色的個人追求、深層誓約、特殊試煉或魔晶石充能。
                  </p>
                </div>

                <JRPGButton
                  variant="primary"
                  size="xs"
                  icon={Plus}
                  onClick={handleAddClock}
                >
                  新增命刻
                </JRPGButton>
              </div>

              <div className="space-y-3">
                {(character.clocks || []).map(clk => (
                  <div key={clk.id} className="bg-[#fbf7ee] rounded-xl p-3.5 border border-[#d6c7ab] flex items-center justify-between gap-4 shadow-sm">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={clk.title || ''}
                        onChange={e => {
                          const updated = character.clocks.map(c => c.id === clk.id ? { ...c, title: e.target.value } : c);
                          updateField('clocks', updated);
                        }}
                        placeholder="命刻名稱..."
                        className="bg-transparent font-bold text-sm text-[#2c221e] outline-none w-full border-b border-transparent focus:border-amber-700"
                      />
                      <div className="flex items-center gap-3 text-xs text-[#6b5a4b] mt-1 font-mono">
                        <span>格數: {clk.totalSegments || 6}</span>
                        <span>進度: {clk.filledSegments || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={clk.totalSegments || 6}
                        onChange={e => {
                          const updated = character.clocks.map(c => c.id === clk.id ? { ...c, totalSegments: parseInt(e.target.value, 10) } : c);
                          updateField('clocks', updated);
                        }}
                        className="bg-[#fffdf9] border border-[#d6c7ab] rounded px-2 py-1 text-xs text-[#2c221e]"
                      >
                        <option value={4}>4 格</option>
                        <option value={6}>6 格</option>
                        <option value={8}>8 格</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveClock(clk.id)}
                        className="p-1 text-[#8c7b6c] hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Card Preview */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="text-xs font-mono text-[#6b5a4b] mb-2 flex items-center justify-between font-bold">
            <span>即時玩家角色卡 (Live Card)</span>
            <span className="text-amber-800">實時同步</span>
          </div>
          <CharacterCard
            character={character}
            onUpdateClock={handleUpdateClockProgress}
          />
        </div>
      </div>
    </div>
  );
}
