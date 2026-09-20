import { DAMAGE_TYPES, TYPE_STYLES, ACTION_TYPES, STATUS_AND_POISON, CATEGORIES, getCommonMilestones } from './constants';
import { SPELLS_DATA } from './spells';
import { BOSS_SKILLS_DATA } from './bossSkillsData';

export const deduplicateText = (text) => {
  if (!text) return text;
  const lines = text.split('\n');
  const seen = new Set();
  const result = [];
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed) {
      if (!seen.has(trimmed)) {
        seen.add(trimmed);
        result.push(line);
      }
    } else {
      result.push(line);
    }
  });
  return result.join('\n');
};

export const appendIfNotExists = (existing, text) => {
  if (!text) return existing || "";
  if (!existing || existing.trim() === "") return text;
  
  const cleanExisting = deduplicateText(existing);
  const cleanText = text.trim();

  if (cleanExisting.includes(cleanText)) return cleanExisting;
  
  if (cleanText.includes("被此攻擊命中的目標受到") && cleanExisting.includes("被此攻擊命中的目標受到")) return cleanExisting;
  if (cleanText.includes("目標改為【魔防】而非【物防】") && cleanExisting.includes("目標改為【魔防】而非【物防】")) return cleanExisting;
  if (cleanText.includes("此攻擊具有多重") && cleanExisting.includes("此攻擊具有多重")) return cleanExisting;
  if (cleanText.includes("此攻擊造成的傷害無視抗性") && cleanExisting.includes("此攻擊造成的傷害無視抗性")) return cleanExisting;
  if (cleanText.includes("不再受到任何持續時間為「場景」且正在影響他們的咒語影響") && cleanExisting.includes("不再受到任何持續時間為「場景」且正在影響他們的咒語影響")) return cleanExisting;
  if (cleanText.includes("被此攻擊命中的生物將被包覆") && cleanExisting.includes("被此攻擊命中的生物將被包覆")) return cleanExisting;
  if (cleanText.includes("當此攻擊命中一個或多個目標時，此 NPC 恢復") && cleanExisting.includes("當此攻擊命中一個或多個目標時，此 NPC 恢復")) return cleanExisting;
  if (cleanText.includes("當此攻擊導致一個或多個敵人失去 HP 時，這些敵人變得不穩定") && cleanExisting.includes("當此攻擊導致一個或多個敵人失去 HP 時，這些敵人變得不穩定")) return cleanExisting;

  return cleanExisting + "\n" + cleanText;
};

export const ROLES_DATA = {
  "暴徒": {
    base: { DEX: "d8", INS: "d6", MIG: "d10", WLP: "d8", initBase: 7, def: 0, mdef: 0 },
    levels: { 5: { hp: 70, mp: 45, acc: 0, dmg: 0 }, 10: { hp: 80, mp: 50, acc: 1, dmg: 0 }, 20: { ins: "d8", hp: 100, mp: 60, acc: 2, dmg: 5 }, 30: { ins: "d8", hp: 120, mp: 70, acc: 3, dmg: 5 }, 40: { ins: "d8", mig: "d12", hp: 150, mp: 80, acc: 4, dmg: 10 }, 50: { ins: "d8", mig: "d12", hp: 180, mp: 90, acc: 5, dmg: 10 }, 60: { ins: "d8", mig: "d12", wlp: "d10", hp: 200, mp: 110, acc: 6, dmg: 15 } },
    defaultSkills: [{ id: "b1", isDefault: true, category: "attack", originalName: "普通攻擊", attack: { distance: "{distance}", formula: "[DEX + MIG]", baseDmg: 5, type: "{type}", extra: "此攻擊具有多重（2）。" }, selectionsConfig: [{ key: "distance", label: "距離", options: ["近戰", "遠程"] }, { key: "type", label: "屬性", options: DAMAGE_TYPES }] }, { id: "b2", isDefault: true, category: "attack", originalName: "強力攻擊", attack: { distance: "近戰", formula: "[MIG + MIG]", baseDmg: 10, type: "{type}" }, selectionsConfig: [{ key: "type", label: "屬性", options: DAMAGE_TYPES }] }],
    levelPassives: [],
    availableSkills: [
      { id: "brute_cust_0", source: "customization", category: "rule", originalName: "提升最大生命", originalDesc: "最大 HP 增加 10。(已自動計算至面板)", modifiers: { hp: 10 }, hideInPreview: true },
      { id: "brute_cust_1", source: "customization", category: "rule", originalName: "壞脾氣（特殊規則）", originalDesc: "只要此 NPC 處於危機狀態，他們{effect}。", selectionsConfig: [{ key: "effect", label: "效果", options: ["免疫除憤怒之外的所有狀態效果", "普通攻擊造成 5 點額外傷害"] }] },
      { id: "brute_cust_2", source: "customization", category: "rule", originalName: "附帶傷害（特殊規則）", originalDesc: "當此 NPC 成功執行阻礙動作時，他們也可以對目標造成 10 點{type}傷害。如果此 NPC 為 30 級或更高，此效果會造成 10 點額外傷害。", selectionsConfig: [{ key: "type", label: "屬性", options: DAMAGE_TYPES }] },
      { id: "brute_cust_3", source: "customization", category: "rule", originalName: "頑強（特殊規則）", originalDesc: "當此 NPC 在一個場景中第一次 HP 降至 0 點時，他們的 HP 改為精確降至 1 點。" },
      { id: "brute_cust_4", source: "customization", category: "rule", originalName: "特殊裝甲（特殊規則）", originalDesc: "只要此 NPC 未處於危機狀態，他們將受到的所有{source}傷害減少 5 點（在應用屬性相性之前）。", selectionsConfig: [{ key: "source", label: "來源", options: ["攻擊", "咒語", "技能"] }] },
      { id: "brute_cust_5", source: "customization", category: "rule", originalName: "復仇攻擊（特殊規則）", originalDesc: "當敵人將此 NPC 的 HP 降至 0 點時，此 NPC 立即以自由攻擊的形式對該敵人執行強力攻擊。在決定此攻擊造成的傷害時，將命中檢定的 HR 視為 0。" },
      { id: "brute_skill_1", source: "roleSkill", category: "rule", originalName: "技能：添加異常免疫", originalDesc: "添加對{imm1}和{imm2}的免疫。", selectionsConfig: [{ key: "imm1", label: "免疫1", options: ["中毒", "動搖", "緩慢"] }, { key: "imm2", label: "免疫2", options: ["無", "中毒", "動搖", "緩慢"] }], hideInPreview: true },
      { id: "brute_skill_2", source: "roleSkill", category: "rule", originalName: "技能：魔防打擊", originalDesc: "普通攻擊目標改為魔防而非物防。" },
      { id: "brute_skill_3", source: "roleSkill", category: "rule", originalName: "技能：遠程強力攻擊", originalDesc: "強力攻擊變為遠程並使用 [DEX + MIG] 進行命中檢定。被此攻擊命中的目標受到{status}。", selectionsConfig: [{ key: "status", label: "異常狀態", options: ["眩暈", "動搖", "緩慢", "虛弱"] }] },
      { id: "brute_skill_4", source: "roleSkill", category: "rule", originalName: "技能：崩塌 (精英/冠位)", originalDesc: "當強力攻擊未命中所有目標時，填充一個名為「崩塌」的六格命刻的 1 個區塊。然後，如果「崩塌」命刻已滿，此 NPC 失去此技能，且場景中的每個生物都受到[少量]的{type}傷害。", reqRank: ["精英", "冠位"], selectionsConfig: [{ key: "type", label: "屬性", options: DAMAGE_TYPES }] },
      { id: "brute_skill_5", source: "roleSkill", category: "rule", originalName: "能力：學習暴徒咒語", originalDesc: "解鎖暴徒咒語書，可從中學習 2 個法術。", reqRank: ["精英", "冠位"], spellConfig: { capacity: 2, options: ["群體狀態", "大詛咒⚡", "詛咒之息⚡", "激怒⚡", "舔舐傷口", "生命偷取⚡", "毒藥⚡", "加強"] }, hideInPreview: true },
      { id: "brute_skill_6", source: "roleSkill", category: "action", originalName: "技能：碾壓（獨特動作）", originalDesc: "此 NPC 可以使用一個動作，讓所有目前被他們包覆的敵人失去 [碾壓傷害] HP。如果你選擇此技能，強力攻擊將獲得「被此攻擊命中的生物將被包覆，直到此 NPC 再次使用強力攻擊，或直到此 NPC 受到其具有弱點的傷害類型的傷害」。" },
      { id: "brute_skill_7", source: "roleSkill", category: "rule", originalName: "技能：強化防禦（特殊規則）", originalDesc: "在此 NPC 執行防禦動作後，他們將在下一回合的第一個可用動作中執行{attack}，但該攻擊將造成 5 點額外傷害，且其傷害將無視抗性。", selectionsConfig: [{ key: "attack", label: "攻擊選擇", options: ["普通攻擊", "強力攻擊"] }] },
      { id: "brute_skill_8", source: "roleSkill", category: "rule", originalName: "技能：輸不起（特殊規則）", originalDesc: "在此 NPC 於敵人回合對抗檢定失敗後，如果該敵人透過此檢定填滿或擦除了 2 個或更多命刻區塊，該敵人受到{status}。", selectionsConfig: [{ key: "status", label: "異常狀態", options: ["眩暈", "動搖", "緩慢", "虛弱"] }] },
      { id: "brute_skill_9", source: "roleSkill", category: "rule", originalName: "技能：穩定恢復（特殊規則）", originalDesc: "在此 NPC 每個回合結束時，如果他們正受到三種或更多狀態效果的影響，他們將恢復所有狀態效果。" }
    ],
    getAffinityBudgets: (level, skills = []) => { let b = { vul: 2, res: 0, imm: 0, abs: 0 }; if (level >= 10) b.res += 2; if (level >= 30) b.imm += 1; return b; },
    getSystemMilestones: (level) => {
      let m = getCommonMilestones(level);
      if (level >= 10) m.push({ id: 'sys_res_10', unlockLevel: 10, originalName: "解鎖屬性抗性額度", originalDesc: "你的抗性 (RES) 屬性配置額度增加了 2 點。請前往【步驟 3：能力】的屬性面板進行配置。", isSystem: true });
      if (level >= 30) m.push({ id: 'sys_imm_30', unlockLevel: 30, originalName: "解鎖屬性免疫額度", originalDesc: "你的免疫 (IMM) 屬性配置額度增加了 1 點。請前往【步驟 3：能力】的屬性面板進行配置。", isSystem: true });
      if (level >= 50) m.push({ id: 'sys_stat_50_brute', unlockLevel: 50, originalName: "被動：提升最大生命", originalDesc: "最大 HP 增加 10（系統已包含在屬性數值表中，無需額外配置）。", isSystem: true });
      return m;
    },
    onSkillIntegrate: (skills) => {
      const hasMagicStrike = skills.find(s => s.originalName && s.originalName.includes("魔防打擊")); const hasRangedHeavy = skills.find(s => s.originalName && s.originalName.includes("遠程強力攻擊")); const hasCrush = skills.find(s => s.originalName && s.originalName.includes("碾壓"));
      return skills.map(skill => {
        const isBasicAttack = skill.originalName && skill.originalName.includes("普通攻擊"); const isHeavyAttack = skill.originalName && skill.originalName.includes("強力攻擊");
        if (isBasicAttack && hasMagicStrike && skill.attack) skill.attack.extra = appendIfNotExists(skill.attack.extra, "此攻擊的目標改為【魔防】而非【物防】。");
        if (isHeavyAttack && skill.attack) {
          if (hasRangedHeavy) { skill.attack.distance = "遠程"; skill.attack.formula = "[DEX + MIG]"; skill.attack.extra = appendIfNotExists(skill.attack.extra, "被此攻擊命中的目標受到{heavy_status}。"); skill.selections = { ...skill.selections, heavy_status: hasRangedHeavy.selections?.status || "" }; }
          if (hasCrush) { skill.attack.extra = appendIfNotExists(skill.attack.extra, "被此攻擊命中的生物將被包覆，直到此 NPC 再次使用強力攻擊，或直到此 NPC 受到其具有弱點的傷害類型的傷害。"); }
        }
        if (skill.attack && skill.attack.extra) skill.attack.extra = deduplicateText(skill.attack.extra);
        if (skill.originalName && (skill.originalName.includes("魔防打擊") || skill.originalName.includes("遠程強力攻擊"))) skill.hideInPreview = true;
        return skill;
      });
    }
  },

  "獵人": {
    base: { DEX: "d10", INS: "d8", MIG: "d8", WLP: "d6", initBase: 9, def: 0, mdef: 0 },
    levels: { 5: { hp: 50, mp: 35, acc: 0, dmg: 0 }, 10: { hp: 60, mp: 40, acc: 1, dmg: 0 }, 20: { wlp: "d8", hp: 80, mp: 60, acc: 2, dmg: 5 }, 30: { wlp: "d8", hp: 100, mp: 70, acc: 3, dmg: 5 }, 40: { dex: "d12", wlp: "d8", hp: 120, mp: 80, acc: 4, dmg: 10 }, 50: { dex: "d12", wlp: "d8", hp: 140, mp: 90, acc: 5, dmg: 10 }, 60: { dex: "d12", ins: "d10", wlp: "d8", hp: 160, mp: 100, acc: 6, dmg: 15 } },
    defaultSkills: [
      {
        id: "h1", isDefault: true, category: "attack", originalName: "普通攻擊",
        attack: { distance: "{distance}", formula: "{formula}", baseDmg: 10, type: "{type}", extra: "{extra}" },
        selectionsConfig: [
          { key: "distance", label: "距離", options: ["近戰", "遠程"] }, { key: "formula", label: "公式", options: ["[DEX + INS]", "[DEX + MIG]"] }, { key: "type", label: "屬性", options: DAMAGE_TYPES },
          { key: "extra", label: "附加效果", options: ["如果它導致一個或多個敵人失去 HP，此 NPC 將恢復等於以此方式失去的總 HP 一半的 HP。", "對受到{特定狀態效果}影響的敵人造成 5 點額外傷害。", "對受到兩種或多種狀態效果影響的敵人造成 5 點額外傷害。", "對未處於危機狀態的敵人造成 5 點額外傷害。", "對處於危機狀態的敵人造成 5 點額外傷害。", "對在本輪次中已經行動過的敵人造成 5 點額外傷害。", "對受到一個或多個持續時間為「場景」的咒語影響的敵人造成 5 點額外傷害。", "對裝備了職業防具的敵人造成 5 點額外傷害。", "對未裝備職業防具的敵人造成 5 點額外傷害。"] },
          { key: "特定狀態效果", label: "特定狀態效果", options: STATUS_AND_POISON, showIfKey: "extra", showIfValue: "{特定狀態效果}" }
        ]
      }
    ],
    levelPassives: [{ unlockLevel: 10, id: "hun_p10", category: "rule", originalName: "Lv.10 解鎖天賦：精確瞄準", originalDesc: "命中檢定獲得 +3 加成。(已自動計算至面板)", hideInPreview: true }, { unlockLevel: 30, id: "hun_p30", category: "rule", originalName: "Lv.30 解鎖天賦：致命一擊", originalDesc: "只要此 NPC 處於危機狀態，普通攻擊造成的傷害無視抗性。" }],
    availableSkills: [
      { id: "hunter_cust_0", source: "customization", category: "rule", originalName: "額外定位技能", originalDesc: "將此客製化額度轉換為 1 個額外的定位技能。(系統已自動為你增加下方的定位技能可用額度)", modifiers: { extraRoleSkill: 1 }, hideInPreview: true },
      { id: "hunter_cust_1", source: "customization", category: "rule", originalName: "緊急偽裝（特殊規則）", originalDesc: "在此 NPC 於場景中首次進入危機狀態後，他們對所有敵人隱形，直到他們的下一回合開始。" },
      { id: "hunter_cust_2", source: "customization", category: "rule", originalName: "虛假的安全感（特殊規則）", originalDesc: "當盟友對抗檢定失敗，或者攻擊或攻擊性咒語未命中所有目標時，此 NPC 在該場景中執行的下一次檢定獲得 +3 加成。此增益不可疊加。" },
      { id: "hunter_cust_3", source: "customization", category: "rule", originalName: "閃電般迅速（特殊規則）", originalDesc: "當此 NPC 在另一個生物的回合造成傷害時，除非受到一種或多種狀態效果影響，否則他們造成 5 點額外傷害。" },
      { id: "hunter_cust_4", source: "customization", category: "rule", originalName: "特殊抗性（特殊規則）", originalDesc: "此 NPC 對精確地對{target_count}造成傷害的來源所造成的所有類型的傷害獲得抗性。", selectionsConfig: [{ key: "target_count", label: "目標數量", options: ["一個生物", "兩個或多個生物"] }] },
      { id: "hunter_skill_1", source: "roleSkill", category: "rule", originalName: "技能：魔防打擊", originalDesc: "普通攻擊目標改為魔防而非物防。", hideInPreview: true },
      { id: "hunter_skill_2", source: "roleSkill", category: "attack", originalName: "技能：強力攻擊", originalDesc: "獲得強力的毀滅性打擊能力。", attack: { distance: "{distance}", formula: "{formula}", baseDmg: 15, type: "{type}", extra: "此攻擊具有多重（2）。在此攻擊結算後，無論是否成功，此 NPC 都無法執行任何動作或自由攻擊，直到他們的下一回合結束。" }, selectionsConfig: [{ key: "distance", label: "距離", options: ["近戰", "遠程"] }, { key: "formula", label: "公式", options: ["[DEX + INS]", "[DEX + MIG]"] }, { key: "type", label: "屬性", options: DAMAGE_TYPES }] },
      { id: "hunter_skill_3", source: "roleSkill", category: "rule", originalName: "技能：強擊改魔防", originalDesc: "強力攻擊（如果有的話）目標改為魔防而非物防。", hideInPreview: true, requires: ["hunter_skill_2"] },
      { id: "hunter_skill_4", source: "roleSkill", category: "rule", originalName: "能力：學習獵人咒語", originalDesc: "解鎖獵人咒語書，可從中學習 2 個法術。", spellConfig: { capacity: 2, options: ["吐息⚡", "詛咒之息⚡", "舔舐傷口", "生命偷取⚡", "魔鏡"] }, hideInPreview: true },
      { id: "hunter_skill_5", source: "roleSkill", category: "rule", originalName: "技能：伏擊（特殊規則）", originalDesc: "在每次衝突的第一個輪次中，此 NPC 將他們的{stat}視為大一個骰子等級（最大 d12）。", selectionsConfig: [{ key: "stat", label: "屬性", options: ["DEX", "INS", "WLP"] }] },
      { id: "hunter_skill_6", source: "roleSkill", category: "rule", originalName: "技能：難以捉摸（特殊規則）", originalDesc: "只要此 NPC 沒有受到任何狀態效果影響，所有傷害來源都將對他們不造成傷害。" },
      { id: "hunter_skill_7", source: "roleSkill", category: "rule", originalName: "技能：獵人的誘餌（特殊規則）", originalDesc: "在敵人用{trigger}命中或未命中此 NPC 後，如果命中檢定或施法檢定的結果是偶數，此 NPC 以普通攻擊對該敵人執行一次自由攻擊（在攻擊或咒語結算後）。在決定此攻擊造成的傷害時，將命中檢定的 HR 視為 0。", selectionsConfig: [{ key: "trigger", label: "觸發條件", options: ["近戰攻擊", "遠程攻擊", "攻擊性咒語"] }] },
      { id: "hunter_skill_8", source: "roleSkill", category: "rule", originalName: "技能：機會主義者（特殊規則）", originalDesc: "當此 NPC 對處於眩暈和/或緩慢狀態的生物執行對抗檢定時，如果兩顆骰子顯示相同的數字（且結果不是大失敗），該檢定將觸發大成功。" },
      { id: "hunter_skill_9", source: "roleSkill", category: "rule", originalName: "技能：鎖定目標（特殊規則）", originalDesc: "當此 NPC 執行防禦動作時，他們會鎖定一個他們能看見的隨機敵人，直到此 NPC 的下一回合結束。當此 NPC 在鎖定敵人的情況下執行普通攻擊時，如果可以，他們必須以該敵人為目標。如果他們這樣做，攻擊造成 10 點額外傷害，且目標鎖定結束（即使攻擊未命中）。" }
    ],
    getAffinityBudgets: (level, skills = []) => { let b = { vul: 1, res: 0, imm: 0, abs: 0 }; if (level >= 50) b.res += 2; return b; },
    getSystemMilestones: (level) => { let m = getCommonMilestones(level); if (level >= 50) m.push({ id: 'sys_res_50', unlockLevel: 50, originalName: "解鎖屬性抗性額度", originalDesc: "你的抗性 (RES) 屬性配置額度增加了 2 點。請前往【步驟 3：能力】的屬性面板進行配置。", isSystem: true }); return m; },
    onSkillIntegrate: (skills) => {
      const hasMagicStrike1 = skills.find(s => s.originalName && s.originalName.includes("魔防打擊")); const hasMagicStrike2 = skills.find(s => s.originalName && s.originalName.includes("強擊改魔防"));
      return skills.map(skill => {
        const isBasicAttack = skill.originalName && skill.originalName.includes("普通攻擊"); const isHeavyAttack = skill.originalName && skill.originalName.includes("強力攻擊");
        if (isBasicAttack && hasMagicStrike1 && skill.attack) skill.attack.extra = appendIfNotExists(skill.attack.extra, "此攻擊的目標改為【魔防】而非【物防】。");
        if (isHeavyAttack && hasMagicStrike2 && skill.attack) skill.attack.extra = appendIfNotExists(skill.attack.extra, "此攻擊的目標改為【魔防】而非【物防】。");
        if (skill.attack && skill.attack.extra) skill.attack.extra = deduplicateText(skill.attack.extra);
        if (skill.originalName && (skill.originalName.includes("魔防打擊") || skill.originalName.includes("強擊改魔防"))) skill.hideInPreview = true;
        return skill;
      });
    }
  },

  "法師": {
    base: { DEX: "d8", INS: "d8", MIG: "d6", WLP: "d10", initBase: 8, def: 1, mdef: 2 },
    levels: {
      5: { hp: 40, mp: 55, acc: 0, dmg: 0 },
      10: { hp: 50, mp: 60, acc: 1, dmg: 0 },
      20: { ins: "d10", hp: 70, mp: 70, acc: 2, dmg: 5 },
      30: { ins: "d10", hp: 90, mp: 80, acc: 3, dmg: 5 },
      40: { ins: "d10", wlp: "d12", hp: 110, mp: 100, acc: 4, dmg: 10 },
      50: { ins: "d10", wlp: "d12", hp: 130, mp: 110, acc: 5, dmg: 10 },
      60: { ins: "d10", mig: "d8", wlp: "d12", hp: 160, mp: 120, acc: 6, dmg: 15 }
    },
    defaultSkills: [
      { id: "m1", isDefault: true, category: "attack", originalName: "普通攻擊", attack: { distance: "{distance}", formula: "{formula}", baseDmg: 5, type: "{type}" }, selectionsConfig: [{ key: "distance", label: "距離", options: ["近戰", "遠程"] }, { key: "formula", label: "公式", options: ["[DEX + INS]", "[INS + WLP]"] }, { key: "type", label: "屬性", options: DAMAGE_TYPES }] },
      { id: "m_base_spell", isDefault: true, source: "baseAbility", category: "spell", originalName: "法師咒語書", originalDesc: "身為法師，你可以在此咒語書中預先選擇 2 個咒語（或將咒語轉換為 +10 MP）。", spellConfig: { capacity: 2, options: ["最大 MP +10", "吐息⚡", "詛咒之息⚡", "照明烈焰⚡(Lv30+)", "電流術⚡", "冰川覆裂⚡", "冰凍堡壘⚡(Lv30+)", "伊格尼斯之火⚡", "光照射線⚡", "歐米茄終結⚡", "大地震擊⚡", "雷霆⚡(Lv30+)", "半影⚡", "烈風⚡"] }, hideInPreview: true }
    ],
    levelPassives: [{ unlockLevel: 10, id: "mag_p10", category: "rule", originalName: "Lv.10 解鎖天賦：魔法打擊", originalDesc: "普通攻擊目標改為魔防而非物防。", hideInPreview: true }, { unlockLevel: 50, id: "mag_p50", category: "rule", originalName: "Lv.50 解鎖天賦：精確施法", originalDesc: "施法檢定獲得 +3 加成。(已自動計算至面板)", modifiers: { magicAcc: 3 }, hideInPreview: true }],
    availableSkills: [
      { id: "m_cust_0b", source: "customization", category: "rule", originalName: "額外傷害免疫", originalDesc: "將此客製化額度轉換為對一種傷害類型的免疫。(系統已自動為你增加上方屬性面板的免疫額度)", modifiers: { extraImmunity: 1 }, hideInPreview: true },
      { id: "m_cust_2", source: "customization", category: "rule", originalName: "附帶傷害（特殊規則）", originalDesc: "當此 NPC 成功執行阻礙動作時，他們也可以對目標造成 10 點{type}傷害。如果此 NPC 為 30 級或更高，此效果會造成 10 點額外傷害。", selectionsConfig: [{ key: "type", label: "屬性", options: DAMAGE_TYPES }] },
      { id: "m_cust_3", source: "customization", category: "rule", originalName: "壓倒（特殊規則）", originalDesc: "當此 NPC 對處於動搖和/或虛弱狀態的生物執行對抗檢定時，如果兩顆骰子顯示相同的數字（且結果不是大失敗），該檢定將觸發大成功。" },
      { id: "m_cust_4", source: "customization", category: "rule", originalName: "靈魂爆發（特殊規則）", originalDesc: "當此 NPC 投降或被迫離開場景時，場景中在場的每一個其他生物都恢復[大量]的 MP。" },
      { id: "m_skill_1", source: "roleSkill", category: "rule", originalName: "技能：添加異常免疫", originalDesc: "添加對兩種異常狀態的免疫。", selectionsConfig: [{ key: "imm1", label: "免疫1", options: ["眩暈", "憤怒", "中毒", "動搖"] }, { key: "imm2", label: "免疫2", options: ["無", "眩暈", "憤怒", "中毒", "動搖"] }] },
      { id: "m_skill_2", source: "roleSkill", category: "rule", originalName: "技能：額外抗性", originalDesc: "添加對兩種傷害類型（<物理>除外）的抗性。(系統已自動為你增加上方屬性面板的抗性額度)", modifiers: { extraResistance: 2 }, hideInPreview: true },
      { id: "m_skill_3", source: "roleSkill", category: "rule", originalName: "技能：普攻回魔", originalDesc: "當普通攻擊命中一個或多個目標時，此 NPC 恢復 10 點 MP，如果此 NPC 為 30 級或更高則恢復 20 點 MP。" },
      { id: "m_skill_4", source: "roleSkill", category: "rule", originalName: "技能：普攻不穩定", originalDesc: "當普通攻擊導致一個或多個敵人失去 HP 時，這些敵人變得不穩定。對不穩定生物造成的傷害無視抗性。當生物恢復任何數量的 HP 或在場景結束時，他們將不再處於不穩定狀態。" },
      { id: "m_skill_5", source: "roleSkill", category: "rule", originalName: "能力：學習法師咒語 (定位技能)", originalDesc: "進一步研讀法師咒語書，獲得額外的 2 個咒語額度。", spellConfig: { capacity: 2, options: ["最大 MP +10", "詛咒之息⚡", "毀盪(Lv30+)", "抽取精魂⚡", "照明烈焰⚡(Lv30+)", "冰凍堡裂⚡(Lv30+)", "生命偷取⚡", "心靈偷取⚡", "歐米茄終結⚡", "雷霆⚡(Lv30+)"] }, hideInPreview: true },
      { id: "m_skill_6", source: "roleSkill", category: "rule", originalName: "技能：元素吸收（特殊規則）", originalDesc: "當此 NPC 受到傷害時，如果該傷害具有類型且該類型不是<物理>或<毒>，他們將恢復等於所受傷害量一半的 MP。" },
      { id: "m_skill_7", source: "roleSkill", category: "rule", originalName: "技能：元素轉換（特殊規則）", originalDesc: "當此 NPC 施放造成<風>、<電>、<暗>、<土>、<火>、<冰>或<光>屬性傷害的咒語時，他們開始吸收該傷害類型，並對直覺上對其有效的另一種類型產生弱點。這些屬性相性取代了 NPC 原本對這些傷害類型的屬性相性，並持續到場景結束或此 NPC 再次觸發此特殊規則。" },
      { id: "m_skill_8", source: "roleSkill", category: "rule", originalName: "技能：魔法精通（特殊規則）", originalDesc: "當此 NPC 在與魔法或超自然力量相關的對抗檢定中取得成功時，如果該檢定允許他們填滿或擦除命刻區塊，他們可以填滿或擦除該命刻額外 1 個區塊。" }
    ],
    // --- 法師專屬策略 Hooks ---
    getAffinityBudgets: (level, skills = []) => { let b = { vul: 1, res: 0, imm: 0, abs: 0 }; if (level >= 30) b.imm += 1; skills.forEach(s => { if (s.modifiers?.extraResistance) b.res += s.modifiers.extraResistance; if (s.modifiers?.extraImmunity) b.imm += s.modifiers.extraImmunity; }); return b; },
    getSystemMilestones: (level) => { let m = getCommonMilestones(level); if (level >= 30) m.push({ id: 'sys_imm_30', unlockLevel: 30, originalName: "解鎖屬性免疫額度", originalDesc: "你的免疫 (IMM) 屬性配置額度增加了 1 點。請前往【步驟 3：能力】的屬性面板進行配置。", isSystem: true }); return m; },
    onSkillIntegrate: (skills) => {
      const hasMagicStrike = skills.find(s => s.libId === "mag_p10" || (s.originalName && s.originalName.includes("魔法打擊"))); const hasMpRecover = skills.find(s => s.originalName && s.originalName.includes("普攻回魔")); const hasUnstable = skills.find(s => s.originalName && s.originalName.includes("普攻不穩定"));
      return skills.map(skill => {
        if (skill.libId === "m_skill_1") {
          const imm1 = skill.selections?.imm1;
          const imm2 = skill.selections?.imm2;
          skill.modifiers = skill.modifiers || {};
          skill.modifiers.statusImmunities = [imm1, imm2].filter(i => i && i !== '無');
          skill.hideInPreview = true;
        }
        const isBasicAttack = skill.originalName && skill.originalName.includes("普通攻擊");
        if (isBasicAttack && skill.attack) {
          if (hasMagicStrike) skill.attack.extra = appendIfNotExists(skill.attack.extra, "此攻擊的目標改為【魔防】而非【物防】。");
          if (hasMpRecover) skill.attack.extra = appendIfNotExists(skill.attack.extra, "當此攻擊命中一個或多個目標時，此 NPC 恢復 10 點 MP，如果此 NPC 為 30 級或更高則恢復 20 點 MP。");
          if (hasUnstable) skill.attack.extra = appendIfNotExists(skill.attack.extra, "當此攻擊導致一個或多個敵人失去 HP 時，這些敵人變得不穩定。對不穩定生物造成的傷害無視抗性。當生物恢復任何數量的 HP 或在場景結束時，他們將不再處於不穩定狀態。");
        }
        if (skill.attack && skill.attack.extra) skill.attack.extra = deduplicateText(skill.attack.extra);
        if (skill.originalName && (skill.originalName.includes("魔法打擊") || skill.originalName.includes("普攻回魔") || skill.originalName.includes("普攻不穩定"))) skill.hideInPreview = true;
        return skill;
      });
    }
  },

  "破壞者": {
    base: { DEX: "d8", INS: "d8", MIG: "d8", WLP: "d8", initBase: 8, def: 2, mdef: 1 },
    levels: { 5: { hp: 50, mp: 45, acc: 0, dmg: 0 }, 10: { hp: 60, mp: 50, acc: 1, dmg: 0 }, 20: { wlp: "d10", hp: 80, mp: 70, acc: 2, dmg: 5 }, 30: { wlp: "d10", hp: 100, mp: 80, acc: 3, dmg: 5 }, 40: { ins: "d10", wlp: "d10", hp: 120, mp: 90, acc: 4, dmg: 10 }, 50: { ins: "d10", wlp: "d10", hp: 140, mp: 100, acc: 5, dmg: 10 }, 60: { dex: "d10", ins: "d10", wlp: "d10", hp: 160, mp: 110, acc: 6, dmg: 15 } },
    defaultSkills: [
      { id: "s1", isDefault: true, category: "attack", originalName: "普通攻擊", attack: { distance: "{distance}", formula: "{formula}", baseDmg: 5, type: "{type}", extra: "被此攻擊命中的每個目標{effect}。", builderHint: "*(如果你選擇了憤怒或中毒，系統已為此 NPC 自動增加了一個額外的屬性弱點。)*" }, selectionsConfig: [{ key: "distance", label: "距離", options: ["近戰", "遠程"] }, { key: "formula", label: "公式", options: ["[DEX + INS]", "[DEX + WLP]"] }, { key: "type", label: "屬性", options: DAMAGE_TYPES }, { key: "effect", label: "附加效果", options: ["失去[少量]的 MP", "失去 1 點 IP", "受到眩暈", "受到憤怒", "受到中毒", "受到動搖", "受到緩慢", "受到虛弱"] }] }
    ],
    levelPassives: [{ unlockLevel: 10, id: "sab_p10", category: "rule", originalName: "Lv.10 解鎖天賦：精準打擊", originalDesc: "你專精於特定攻擊方式，使你的{bonus}獲得 +3 加成。", selectionsConfig: [{ key: "bonus", label: "加成選擇", options: ["命中檢定", "施法檢定"] }], hideInPreview: true }, { unlockLevel: 30, id: "sab_p30", category: "rule", originalName: "Lv.30 解鎖天賦：無情攻勢", originalDesc: "只要此 NPC 未處於危機狀態，普通攻擊造成的傷害無視抗性。" }],
    availableSkills: [
      { id: "s_cust_0", source: "customization", category: "rule", originalName: "額外定位技能", originalDesc: "將此客製化額度轉換為 1 個額外的定位技能。(系統已自動為你增加下方的定位技能可用額度)", modifiers: { extraRoleSkill: 1 }, hideInPreview: true },
      { id: "s_cust_1", source: "customization", category: "rule", originalName: "不安光環（特殊規則）", originalDesc: "只要此 NPC 在場景中，敵人就無法從{imm1}和{imm2}中恢復。", selectionsConfig: [{ key: "imm1", label: "狀態1", options: ["眩暈", "憤怒", "中毒", "動搖", "緩慢", "虛弱"] }, { key: "imm2", label: "狀態2", options: ["眩暈", "憤怒", "中毒", "動搖", "緩慢", "虛弱", "無"] }] },
      { id: "s_cust_2", source: "customization", category: "rule", originalName: "糾纏（特殊規則）", originalDesc: "只要此 NPC 在場景中，受到兩種或多種狀態效果影響的敵人就無法執行自由攻擊。" },
      { id: "s_cust_3", source: "customization", category: "rule", originalName: "令人疲憊的妥協（特殊規則）", originalDesc: "在此 NPC 於敵人回合對抗檢定失敗後，如果該敵人受到兩種或多種狀態效果影響，此 NPC 可以花費 20 點 MP 來填滿或擦除他們選擇的命刻的 1 個區塊。" },
      { id: "s_cust_4", source: "customization", category: "rule", originalName: "阻礙專家（特殊規則）", originalDesc: "每回合一次，在此 NPC 成功完成阻礙動作的檢定後，他們可以立即免費執行另一次阻礙動作。" },
      { id: "s_cust_5", source: "customization", category: "rule", originalName: "汲取心智（特殊規則）", originalDesc: "只要此 NPC 在場景中，所有敵人的 MP 消耗增加 5 點。" },
      { id: "s_skill_1", source: "roleSkill", category: "rule", originalName: "技能：多重攻擊", originalDesc: "普通攻擊獲得多重（2）。", hideInPreview: true },
      { id: "s_skill_2", source: "roleSkill", category: "rule", originalName: "技能：魔防打擊", originalDesc: "普通攻擊目標改為魔防而非物防。", hideInPreview: true },
      { id: "s_skill_3", source: "roleSkill", category: "attack", originalName: "技能：強力攻擊", originalDesc: "獲得強力的減益打擊能力。", attack: { distance: "{distance}", formula: "[DEX + INS]", baseDmg: 5, type: "{type}", extra: "目標{_displayEff1}，且{_displayEff2}，直到他們的下一回合結束。" }, selectionsConfig: [{ key: "distance", label: "距離", options: ["近戰", "遠程"] }, { key: "type", label: "屬性", options: DAMAGE_TYPES }, { key: "effect1", label: "效果1", options: ["無法恢復 HP", "無法恢復 MP", "無法執行一種你選擇的動作類型", "無法執行自由攻擊", "無法看見此 NPC", "無法看見此 NPC 的盟友", "失去所有抗性和免疫且無法獲得它們"] }, { key: "action1", label: "▶ 指定動作", options: ACTION_TYPES, showIfKey: "effect1", showIfValue: "無法執行一種你選擇的動作類型", isLinked: true }, { key: "effect2", label: "效果2", options: ["無", "無法恢復 HP", "無法恢復 MP", "無法執行一種你選擇的動作類型", "無法執行自由攻擊", "無法看見此 NPC", "無法看見此 NPC 的盟友", "失去所有抗性和免疫且無法獲得它們"] }, { key: "action2", label: "▶ 指定動作", options: ACTION_TYPES, showIfKey: "effect2", showIfValue: "無法執行一種你選擇的動作類型", isLinked: true }] },
      { id: "s_skill_4", source: "roleSkill", category: "rule", originalName: "技能：強擊改魔防", originalDesc: "強力攻擊（如果有的話）目標改為魔防而非物防。", requires: ["s_skill_3"], hideInPreview: true },
      { id: "s_skill_5", source: "roleSkill", category: "rule", originalName: "能力：學習破壞者咒語", originalDesc: "解鎖破壞者咒語書，可從中學習 1 個法術，並增加 10 最大 MP。", modifiers: { mp: 10 }, spellConfig: { capacity: 1, options: ["最大 MP +10", "群體狀態", "大詛咒⚡", "驅散", "抽取精魂⚡", "毒藥⚡", "狂暴⚡", "停止⚡", "弱化⚡"] }, hideInPreview: true },
      { id: "s_skill_6", source: "roleSkill", category: "action", originalName: "技能：殘酷催眠（獨特動作）", originalDesc: "此 NPC 可以使用一個動作並花費 20 點 MP 來選擇一個他們能看見且受到{status}影響的敵人。如果他們這樣做，該敵人必須立即使用裝備的武器或基礎攻擊，對此 NPC 選擇的目標執行一次自由攻擊。", reqRank: ["精英", "冠位"], selectionsConfig: [{ key: "status", label: "觸發狀態", options: ["眩暈", "憤怒", "動搖"] }] },
      { id: "s_skill_7", source: "roleSkill", category: "rule", originalName: "技能：祕技（特殊規則）", originalDesc: "選擇此 NPC 的一項基礎攻擊或咒語。此 NPC 可以執行所選的攻擊或咒語，而除了目標之外沒有人會意識到那是什麼（通常隱藏在尖酸刻薄的話語、精心設計的動作或無傷大雅的戲法中）。", hideInPreview: true },
      { id: "s_skill_8", source: "roleSkill", category: "rule", originalName: "技能：臨別禮物（特殊規則）", originalDesc: "在此 NPC 的 HP 降至 0 點或被迫離開場景後，每個受此 NPC 施放的弱化⚡咒語影響的敵人失去[少量]的 HP。", reqRank: ["士兵", "精英"] },
      { id: "s_skill_9", source: "roleSkill", category: "rule", originalName: "技能：懷疑的陰影（特殊規則）", originalDesc: "只要此 NPC 在場景中，任何受到兩種或多種狀態效果影響的玩家角色都無法喚起特質和羈絆。" }
    ],
    // --- 破壞者專屬策略 Hooks ---
    getAffinityBudgets: (level, skills = []) => {
      let b = { vul: 1, res: 0, imm: 0, abs: 0 }; if (level >= 50) b.imm += 1;
      skills.forEach(s => { if (s.libId === 's1' || s.id === 's1') { if (s.selections?.effect === '受到憤怒' || s.selections?.effect === '受到中毒') b.vul += 1; } });
      return b;
    },
    getSystemMilestones: (level) => { let m = getCommonMilestones(level); if (level >= 50) m.push({ id: 'sys_imm_50', unlockLevel: 50, originalName: "解鎖屬性免疫額度", originalDesc: "你的免疫 (IMM) 屬性配置額度增加了 1 點。請前往【步驟 3：能力】的屬性面板進行配置。", isSystem: true }); return m; },
    onSkillIntegrate: (skills) => {
      const hasMultiAttack = skills.find(s => s.originalName && s.originalName.includes("多重攻擊")); const hasMagicStrike1 = skills.find(s => s.originalName && s.originalName.includes("魔防打擊")); const hasMagicStrike2 = skills.find(s => s.originalName && s.originalName.includes("強擊改魔防")); const secretSkill = skills.find(s => s.libId === 's_skill_7' || s.id === 's_skill_7');
      const secretArtTarget = secretSkill?.selections?.secretArtTarget;
      return skills.map(skill => {
        const isBasicAttack = skill.originalName && skill.originalName.includes("普通攻擊"); const isHeavyAttack = skill.originalName && skill.originalName.includes("強力攻擊");
        const skillName = skill.customName || skill.originalName;
        const cleanName = skillName ? skillName.replace(/^(技能|能力)：/, '').replace(/\(定位技能\)/, '').trim() : '';
        if (secretArtTarget && (secretArtTarget === skillName || secretArtTarget === cleanName || secretArtTarget === skill.originalName || secretArtTarget === skill.customName)) skill.isSecretArt = true;
        if (isBasicAttack && skill.attack) {
          if (hasMultiAttack) skill.attack.extra = appendIfNotExists(skill.attack.extra, "此攻擊具有多重（2）。");
          if (hasMagicStrike1) skill.attack.extra = appendIfNotExists(skill.attack.extra, "此攻擊的目標改為【魔防】而非【物防】。");
        }
        if (isHeavyAttack && skill.libId === 's_skill_3' && skill.attack) {
          skill.selections = skill.selections || {};
          let eff1 = skill.selections.effect1 || "____"; if (eff1 === "無法執行一種你選擇的動作類型") eff1 = `無法執行【${skill.selections.action1 || "____"}】動作`;
          let eff2 = skill.selections.effect2 || "無"; if (eff2 === "無法執行一種你選擇的動作類型") eff2 = `無法執行【${skill.selections.action2 || "____"}】動作`;
          skill.selections._displayEff1 = eff1; skill.selections._displayEff2 = eff2;
          let baseExtra = "目標{_displayEff1}"; if (eff2 && eff2 !== "無") baseExtra += "，且{_displayEff2}"; baseExtra += "，直到他們的下一回合結束。";
          if (hasMagicStrike2) baseExtra = appendIfNotExists(baseExtra, "此攻擊的目標改為【魔防】而非【物防】。"); skill.attack.extra = baseExtra;
        }
        if (skill.attack && skill.attack.extra) skill.attack.extra = deduplicateText(skill.attack.extra);
        if (skill.originalName && (skill.originalName.includes("多重攻擊") || skill.originalName.includes("魔防打擊") || skill.originalName.includes("強擊改魔防"))) skill.hideInPreview = true;
        return skill;
      });
    }
  },

  "衛士": {
    base: { DEX: "d8", INS: "d8", MIG: "d8", WLP: "d8", initBase: 8, def: 2, mdef: 1 },
    levels: { 5: { hp: 50, mp: 45, acc: 0, dmg: 0 }, 10: { hp: 60, mp: 50, acc: 1, dmg: 0 }, 20: { mig: "d10", hp: 90, mp: 60, acc: 2, dmg: 5 }, 30: { mig: "d10", hp: 110, mp: 70, acc: 3, dmg: 5 }, 40: { mig: "d10", wlp: "d10", hp: 130, mp: 90, acc: 4, dmg: 10 }, 50: { mig: "d10", wlp: "d10", hp: 150, mp: 100, acc: 5, dmg: 10 }, 60: { dex: "d10", mig: "d10", wlp: "d10", hp: 170, mp: 110, acc: 6, dmg: 15 } },
    defaultSkills: [{ id: "gu1", isDefault: true, category: "attack", originalName: "普通攻擊", attack: { distance: "{distance}", formula: "[DEX + MIG]", baseDmg: 5, type: "{type}", extra: "命中目標受到{status}狀態。" }, selectionsConfig: [{ key: "distance", label: "距離", options: ["近戰", "遠程"] }, { key: "type", label: "屬性", options: DAMAGE_TYPES }, { key: "status", label: "狀態", options: ["眩暈", "動搖", "緩慢", "虛弱"] }] }, { id: "gu2", isDefault: true, category: "attack", originalName: "強力攻擊", attack: { distance: "近戰", formula: "[MIG + MIG]", baseDmg: 10, type: "{type}" }, selectionsConfig: [{ key: "distance", label: "距離", options: ["近戰", "遠程"] }, { key: "type", label: "屬性", options: DAMAGE_TYPES }] }],
    levelPassives: [{ unlockLevel: 10, id: "gu_p10", category: "rule", originalName: "Lv.10 解鎖天賦：額外抗性", originalDesc: "添加對兩種傷害類型（<物理>除外）的抗性。*(系統已自動為你增加上方屬性面板的抗性額度)*", modifiers: { extraResistance: 2 }, hideInPreview: true }, { unlockLevel: 30, id: "gu_p30", category: "rule", originalName: "Lv.30 解鎖天賦：雙重防禦提升", originalDesc: "物防獲得 +2 加成，魔防獲得 +1 加成。(已自動計算至面板)", modifiers: { def: 2, mdef: 1 }, hideInPreview: true }, { unlockLevel: 50, id: "gu_p50", category: "rule", originalName: "Lv.50 解鎖天賦：異常免疫", originalDesc: "添加對{imm1}和{imm2}的免疫。", selectionsConfig: [{ key: "imm1", label: "免疫1", options: ["中毒", "動搖", "虛弱"] }, { key: "imm2", label: "免疫2", options: ["無", "中毒", "動搖", "虛弱"] }], hideInPreview: true }],
    availableSkills: [
      { id: "gu_cust_0", source: "customization", category: "rule", originalName: "額外定位技能", originalDesc: "將此客製化額度轉換為 1 個額外的定位技能。(系統已自動為你增加下方的定位技能可用額度)", modifiers: { extraRoleSkill: 1 }, reqRank: ["士兵", "精英"], hideInPreview: true },
      { id: "gu_cust_1", source: "customization", category: "rule", originalName: "攔截（特殊規則）", originalDesc: "這與守護者的「保護」技能相同，但使用次數無限制，且只能保護此 NPC 在衝突場景開始時選擇的特定盟友。" },
      { id: "gu_cust_2", source: "customization", category: "rule", originalName: "威脅（特殊規則）", originalDesc: "如果可以，敵人必須將此 NPC 包含在他們的攻擊和攻擊性咒語的目標之中。當此 NPC 受到其具有弱點的類型的傷害時，他們將失去此特殊規則，直到他們的下一回合開始。" },
      { id: "gu_cust_3", source: "customization", category: "rule", originalName: "弱點阻擋（特殊規則）", originalDesc: "選擇一個精英或冠位盟友的一個弱點：只要此 NPC 在場景中，該弱點就會被替換為抗性。" },
      { id: "gu_cust_4", source: "customization", category: "rule", originalName: "堅定不移的支援（特殊規則）", originalDesc: "反派盟友可以花費終結點來喚起此 NPC 的一個特質，以重骰他們自己的檢定。當反派這樣做時，如果兩顆骰子顯示相同的數字（且不是大失敗），他們的檢定將觸發大成功。" },
      { id: "gu_skill_1", source: "roleSkill", category: "rule", originalName: "技能：額外抗性", originalDesc: "添加對兩種傷害類型的抗性。*(系統已自動為你增加上方屬性面板的抗性額度)*", modifiers: { extraResistance: 2 }, hideInPreview: true },
      { id: "gu_skill_2", source: "roleSkill", category: "rule", originalName: "技能：多重攻擊", originalDesc: "普通攻擊獲得多重（2）。此選項僅適用於精英和冠位。", reqRank: ["精英", "冠位"], hideInPreview: true },
      { id: "gu_skill_3", source: "roleSkill", category: "rule", originalName: "技能：無視抗性", originalDesc: "普通攻擊造成的傷害無視抗性。", hideInPreview: true },
      { id: "gu_skill_4", source: "roleSkill", category: "rule", originalName: "技能：淨化強擊", originalDesc: "當敵人被強力攻擊命中時，如果該敵人受到{status}影響，他們將不再受到任何持續時間為「場景」且正在影響他們的咒語影響。", selectionsConfig: [{ key: "status", label: "異常狀態", options: ["眩暈", "動搖", "緩慢", "虛弱"] }], hideInPreview: true },
      { id: "gu_skill_5", source: "roleSkill", category: "rule", originalName: "能力：學習衛士咒語", originalDesc: "此 NPC 從衛士咒語書中學習 1 個法術，並增加 10 最大 MP。", modifiers: { mp: 10 }, spellConfig: { capacity: 1, options: ["最大 MP +10", "吐息⚡", "舔舐傷口", "護罩", "戰吼"] }, hideInPreview: true },
      { id: "gu_skill_6", source: "roleSkill", category: "action", originalName: "技能：路障（獨特動作）", originalDesc: "此 NPC 可以使用一個動作並花費 10 點 MP，讓自己及其所有盟友獲得對{_displayType}傷害的抗性。此增益持續到場景結束，或直到此 NPC 受到其具有弱點的類型的傷害。", selectionsConfig: [{ key: "type1", label: "抗性1", options: DAMAGE_TYPES }, { key: "type2", label: "抗性2", options: ["無", ...DAMAGE_TYPES] }] },
      { id: "gu_skill_7", source: "roleSkill", category: "rule", originalName: "技能：復仇（特殊規則）", originalDesc: "在敵人用{_displayTrigger}命中你和/或一個或多個盟友後，此 NPC 以強力攻擊對該敵人執行一次自由攻擊（在攻擊或咒語結算後）。在決定此攻擊造成的傷害時，將命中檢定的 HR 視為 0。", reqRank: ["精英", "冠位"], selectionsConfig: [{ key: "trigger1", label: "觸發條件1", options: ["近戰攻擊", "遠程攻擊", "攻擊性咒語"] }, { key: "trigger2", label: "觸發條件2", options: ["無", "近戰攻擊", "遠程攻擊", "攻擊性咒語"] }] },
      { id: "gu_skill_8", source: "roleSkill", category: "rule", originalName: "技能：令人安心的光環（特殊規則）", originalDesc: "能夠看見和/或聽見此 NPC 的盟友免疫{status}。", selectionsConfig: [{ key: "status", label: "免疫狀態", options: ["眩暈", "動搖", "緩慢", "虛弱"] }] },
      { id: "gu_skill_9", source: "roleSkill", category: "rule", originalName: "技能：減少進度（特殊規則）", originalDesc: "當此 NPC 的敵人填滿或擦除命刻的 2 個或更多區塊時，如果此 NPC 沒有受到{_displayStatus}狀態效果影響，則該敵人分別少填滿或少擦除該命刻 1 個區塊（最少為 1）。", selectionsConfig: [{ key: "status1", label: "狀態1", options: ["眩暈", "憤怒", "中毒", "動搖", "緩慢", "虛弱"] }, { key: "status2", label: "狀態2", options: ["無", "眩暈", "憤怒", "中毒", "動搖", "緩慢", "虛弱"] }] }
    ],
    // --- 衛士專屬策略 Hooks ---
    getAffinityBudgets: (level, skills = []) => { let b = { vul: 2, res: 0, imm: 0, abs: 0 }; skills.forEach(s => { if (s.modifiers?.extraResistance) b.res += s.modifiers.extraResistance; if (s.modifiers?.extraImmunity) b.imm += s.modifiers.extraImmunity; }); return b; },
    getSystemMilestones: (level) => { return getCommonMilestones(level); },
    onSkillIntegrate: (skills) => {
      const hasMulti = skills.find(s => s.libId === "gu_skill_2"); const hasIgnoreRes = skills.find(s => s.libId === "gu_skill_3"); const hasPurgeHeavy = skills.find(s => s.libId === "gu_skill_4");
      return skills.map(skill => {
        const isBasicAttack = skill.originalName && skill.originalName.includes("普通攻擊"); const isHeavyAttack = skill.originalName && skill.originalName.includes("強力攻擊");
        if (isBasicAttack && skill.attack) {
          if (hasMulti) skill.attack.extra = appendIfNotExists(skill.attack.extra, "此攻擊具有多重（2）。");
          if (hasIgnoreRes) skill.attack.extra = appendIfNotExists(skill.attack.extra, "此攻擊造成的傷害無視抗性。");
        }
        if (isHeavyAttack && hasPurgeHeavy && skill.attack) {
          const status = hasPurgeHeavy.selections?.status || "____";
          skill.attack.extra = appendIfNotExists(skill.attack.extra, `當敵人被此攻擊命中時，如果該敵人受到【${status}】影響，他們將不再受到任何持續時間為「場景」且正在影響他們的咒語影響。`);
        }
        if (skill.attack && skill.attack.extra) skill.attack.extra = deduplicateText(skill.attack.extra);
        if (skill.libId === 'gu_skill_6') { skill.selections = skill.selections || {}; const t2 = skill.selections.type2 || "無"; skill.selections._displayType = (t2 !== "無" && t2) ? `{type1}與{type2}` : `{type1}`; }
        if (skill.libId === 'gu_skill_7') { skill.selections = skill.selections || {}; const t2 = skill.selections.trigger2 || "無"; skill.selections._displayTrigger = (t2 !== "無" && t2) ? `【{trigger1}】或【{trigger2}】` : `【{trigger1}】`; }
        if (skill.libId === 'gu_skill_9') { skill.selections = skill.selections || {}; const s2 = skill.selections.status2 || "無"; skill.selections._displayStatus = (s2 !== "無" && s2) ? `【{status1}】或【{status2}】` : `【{status1}】`; }
        if (skill.libId === 'gu_skill_2' || skill.libId === 'gu_skill_3' || skill.libId === 'gu_skill_4') skill.hideInPreview = true;
        return skill;
      });
    }
  },

  "輔助": {
    base: { DEX: "d8", INS: "d8", MIG: "d6", WLP: "d10", initBase: 8, def: 0, mdef: 0 },
    levels: { 5: { hp: 50, mp: 55, acc: 0, dmg: 0 }, 10: { hp: 60, mp: 60, acc: 1, dmg: 0 }, 20: { ins: "d10", hp: 80, mp: 70, acc: 2, dmg: 5 }, 30: { ins: "d10", hp: 100, mp: 80, acc: 3, dmg: 5 }, 40: { ins: "d10", mig: "d8", hp: 130, mp: 90, acc: 4, dmg: 10 }, 50: { ins: "d10", mig: "d8", hp: 150, mp: 100, acc: 5, dmg: 10 }, 60: { ins: "d12", mig: "d8", hp: 170, mp: 110, acc: 6, dmg: 15 } },
    defaultSkills: [
      { id: "su1", isDefault: true, category: "attack", originalName: "普通攻擊", attack: { distance: "{distance}", formula: "{formula}", baseDmg: 5, type: "{type}" }, selectionsConfig: [{ key: "distance", label: "距離", options: ["近戰", "遠程"] }, { key: "formula", label: "公式", options: ["[DEX + WLP]", "[INS + WLP]"] }, { key: "type", label: "屬性", options: DAMAGE_TYPES }] },
      { id: "su_spell", isDefault: true, source: "baseAbility", category: "spell", originalName: "輔助咒語書", originalDesc: "從列表中學習 2 個咒語；或學習 1 個咒語，並將最大 MP 增加 10 點。", spellConfig: { capacity: 2, options: ["最大 MP +10", "光環", "覺醒", "屏障", "淨化", "預測", "元素防護罩", "治癒", "魔鏡", "加速", "加強", "魂之帷幕", "戰吼"] }, hideInPreview: true }
    ],
    levelPassives: [
      { unlockLevel: 10, id: "su_p10", category: "rule", originalName: "Lv.10 解鎖天賦：額外抗性", originalDesc: "添加對兩種傷害類型（<物理>除外）的抗性。*(請至上方屬性面板配置)*", modifiers: { extraResistance: 2 }, hideInPreview: true },
      { unlockLevel: 30, id: "su_p30", category: "rule", originalName: "Lv.30 解鎖天賦：雙重防禦提升", originalDesc: "物防獲得 +1 加成，魔防獲得 +2 加成。(已自動計算至面板)", modifiers: { def: 1, mdef: 2 }, hideInPreview: true },
      { unlockLevel: 50, id: "su_p50", category: "rule", originalName: "Lv.50 解鎖天賦：額外免疫", originalDesc: "添加對一種傷害類型（<物理>除外）的免疫。*(請至上方屬性面板配置)*", modifiers: { extraImmunity: 1 }, hideInPreview: true }
    ],
    availableSkills: [
      { id: "su_cust_0", source: "customization", category: "rule", originalName: "額外定位技能", originalDesc: "將此客製化額度轉換為 1 個額外的定位技能。(系統已自動為你增加下方的定位技能可用額度)", modifiers: { extraRoleSkill: 1 }, reqRank: ["士兵", "精英"], hideInPreview: true },
      { id: "su_cust_1", source: "customization", category: "action", originalName: "建議（獨特動作）", originalDesc: "此 NPC 可以使用一個動作並花費 10 點 MP 來選擇一個能聽見他們聲音的盟友。該盟友從眩暈和動搖中恢復，並且在他們於此 NPC 的下一回合開始前執行的第一次檢定中獲得 +3 加成。" },
      { id: "su_cust_2", source: "customization", category: "action", originalName: "鼓舞（獨特動作）", originalDesc: "此 NPC 可以使用一個動作並花費 10 點 MP 來選擇一個能聽見他們聲音的盟友。該盟友恢復[少量]的{encRes}，並且將他們的{encStat}視為大一個骰子等級，直到此 NPC 的下一回合開始（最大為 d12）。", selectionsConfig: [{ key: "encRes", label: "恢復屬性", options: ["HP", "MP"] }, { key: "encStat", label: "提升屬性", options: ["DEX", "INS", "MIG", "WLP"] }] },
      { id: "su_cust_3", source: "customization", category: "rule", originalName: "弱點阻擋（特殊規則）", originalDesc: "選擇一個精英或冠位盟友的一個弱點：只要此 NPC 在場景中，該弱點就會被替換為抗性。" },

      { id: "su_skill_1", source: "roleSkill", category: "rule", originalName: "技能：多重攻擊", originalDesc: "普通攻擊獲得多重（2）。", hideInPreview: true },
      { id: "su_skill_2", source: "roleSkill", category: "rule", originalName: "技能：魔防打擊", originalDesc: "普通攻擊目標改為魔防而非物防。", hideInPreview: true },
      { id: "su_skill_3", source: "roleSkill", category: "rule", originalName: "技能：附帶異常", originalDesc: "被普通攻擊命中的生物受到{status}。", selectionsConfig: [{ key: "status", label: "異常狀態", options: ["眩暈", "動搖", "緩慢", "虛弱"] }], hideInPreview: true },
      { id: "su_skill_4", source: "roleSkill", category: "rule", originalName: "技能：普攻回魔", originalDesc: "當普通攻擊命中一個或多個目標時，此 NPC 恢復 10 點 MP，如果此 NPC 為 30 級或更高則恢復 20 點 MP。", hideInPreview: true },
      { id: "su_skill_5", source: "roleSkill", category: "rule", originalName: "能力：冠位輔助", originalDesc: "此 NPC 同時獲得「建議」和「鼓舞」技能，但對一種額外的傷害類型具有弱點。此選項僅適用於冠位。\n*(選擇此技能後，建議與鼓舞將無須消耗客製化額度，系統將自動整合至面板中)*", reqRank: ["冠位"], selectionsConfig: [{ key: "encRes", label: "鼓舞-恢復", options: ["HP", "MP"], isLinked: true }, { key: "encStat", label: "鼓舞-提升", options: ["DEX", "INS", "MIG", "WLP"], isLinked: true }], hideInPreview: true },
      { id: "su_skill_6", source: "roleSkill", category: "rule", originalName: "技能：強化建議", originalDesc: "建議技能現在允許所選盟友恢復所有狀態效果。", hideInPreview: true },
      { id: "su_skill_7", source: "roleSkill", category: "action", originalName: "技能：戰略指揮（獨特動作）", originalDesc: "此 NPC 可以使用一個動作並花費 10 點 MP 來選擇一個能聽見他們聲音且在該輪次中仍有一個或多個回合要執行的盟友。該盟友將在此 NPC 的回合結束後立即執行他們的下一回合；該盟友在該回合中第一次造成傷害時，他們造成 10 點額外傷害。" },
      { id: "su_skill_8", source: "roleSkill", category: "rule", originalName: "技能：追擊（特殊規則）", originalDesc: "每回合一次，在盟友用攻擊命中一個或多個敵人後，如果該盟友受到此 NPC 施放且持續時間為「場景」的咒語影響，此 NPC 以普通攻擊對其中一個隨機選擇的敵人執行一次自由攻擊（在攻擊結算後）。在決定傷害時，將 HR 視為 0。" },
      { id: "su_skill_9", source: "roleSkill", category: "rule", originalName: "技能：治癒光環（特殊規則）", originalDesc: "在此 NPC 每個回合結束時，場景中在場的每個盟友恢復[少量]的 HP。" },
      { id: "su_skill_10", source: "roleSkill", category: "rule", originalName: "技能：MP 電池（特殊規則）", originalDesc: "當盟友花費 MP 時，此 NPC 可以代替該盟友花費 MP（前提是他們有足夠的 MP 來支付全部費用）。" },
      { id: "su_skill_11", source: "roleSkill", category: "rule", originalName: "技能：最後的命令（特殊規則）", originalDesc: "在此 NPC 的 HP 降至 0 點或被迫離開場景後，如果他們已經獲得了建議、鼓舞和/或戰略指揮技能，他們可以立即免費執行其中一個，無視其 MP 消耗。" }
    ],
    // --- 輔助專屬策略 Hooks ---
    getAffinityBudgets: (level, skills = []) => {
      let b = { vul: 1, res: 0, imm: 0, abs: 0 };
      skills.forEach(s => { if (s.modifiers?.extraResistance) b.res += s.modifiers.extraResistance; if (s.modifiers?.extraImmunity) b.imm += s.modifiers.extraImmunity; if (s.libId === 'su_skill_5') b.vul += 1; });
      return b;
    },
    getSystemMilestones: (level) => getCommonMilestones(level),
    onSkillIntegrate: (skills) => {
      const hasMulti = skills.find(s => s.libId === "su_skill_1"); const hasMagicStrike = skills.find(s => s.libId === "su_skill_2"); const hasStatus = skills.find(s => s.libId === "su_skill_3"); const hasMpRec = skills.find(s => s.libId === "su_skill_4"); const hasUpgradedSuggest = skills.find(s => s.libId === "su_skill_6"); const hasChampSupport = skills.find(s => s.libId === "su_skill_5");
      let result = [];
      skills.forEach(skill => {
        const isBasicAttack = skill.originalName && skill.originalName.includes("普通攻擊");
        if (isBasicAttack && skill.attack) {
          if (hasMulti) skill.attack.extra = appendIfNotExists(skill.attack.extra, "此攻擊具有多重（2）。");
          if (hasMagicStrike) skill.attack.extra = appendIfNotExists(skill.attack.extra, "此攻擊的目標改為【魔防】而非【物防】。");
          if (hasStatus) { const stat = hasStatus.selections?.status || "____"; skill.attack.extra = appendIfNotExists(skill.attack.extra, `被此攻擊命中的生物受到【${stat}】狀態。`); }
          if (hasMpRec) skill.attack.extra = appendIfNotExists(skill.attack.extra, "當此攻擊命中一個或多個目標時，此 NPC 恢復 10 點 MP，如果此 NPC 為 30 級或更高則恢復 20 點 MP。");
        }
        if (skill.attack && skill.attack.extra) skill.attack.extra = deduplicateText(skill.attack.extra);

        // Apply 建議升級 to all instances of 建議
        if (hasUpgradedSuggest && (skill.libId === 'su_cust_1' || skill.libId === 'su_skill_11')) {
          if (skill.originalDesc) skill.originalDesc = skill.originalDesc.replace(/從眩暈和動搖中恢復/g, "從所有狀態效果中恢復");
        }

        // 避免冠位輔助產生重複的獨立技能
        if (hasChampSupport && (skill.libId === 'su_cust_1' || skill.libId === 'su_cust_2')) { skill.hideInPreview = true; }

        // Handle su_skill_5 (冠位輔助) dynamic rendering
        if (skill.libId === 'su_skill_5') {
          const suggestText = hasUpgradedSuggest ? "該盟友從所有狀態效果中恢復，並且在他們於此 NPC 的下一回合開始前執行的第一次檢定中獲得 +3 加成。" : "該盟友從眩眩暈和動搖中恢復，並且在他們於此 NPC 的下一回合開始前執行的第一次檢定中獲得 +3 加成。";
          const encRes = skill.selections?.encRes || "____"; const encStat = skill.selections?.encStat || "____";
          skill.originalDesc = `此 NPC 獲得 1 個額外弱點(已反映至上方)。\n*(系統已將「建議」與「鼓舞」自動加入【其餘行動】欄位)*`;
          skill.hideInPreview = true;

          result.push(skill);
          result.push({ id: `dyn_suggest_${skill.id}`, libId: 'dyn_suggest', category: 'action', originalName: "建議（獨特動作）", originalDesc: `此 NPC 可以使用一個動作並花費 10 點 MP 來選擇一個能聽見他們聲音的盟友。${suggestText}`, hideInPreview: false });
          result.push({ id: `dyn_encourage_${skill.id}`, libId: 'dyn_encourage', category: 'action', originalName: "鼓舞（獨特動作）", originalDesc: `此 NPC 可以使用一個動作並花費 10 點 MP 來選擇一個能聽見他們聲音的盟友。該盟友恢復[少量]的【${encRes}】，並且將他們的【${encStat}】視為大一個骰子等級，直到此 NPC 的下一回合開始（最大為 d12）。`, hideInPreview: false });
          return;
        }

        if (skill.originalName && (skill.originalName.includes("魔法打擊") || skill.originalName.includes("普攻回魔") || skill.originalName.includes("普攻不穩定"))) skill.hideInPreview = true;
        result.push(skill);
      });
      return result;
    }
  }
};

export const syncLevelPassives = (roleName, level, currentSkills) => {
  const roleData = ROLES_DATA[roleName]; if (!roleData) return currentSkills;
  const requiredPassives = (roleData.levelPassives || []).filter(p => level >= p.unlockLevel);
  let nextSkills = currentSkills.filter(s => { if (s.source === 'levelPassive') return requiredPassives.some(rp => rp.id === s.libId); return true; });
  requiredPassives.forEach(rp => { if (!nextSkills.some(s => s.libId === rp.id)) nextSkills.push({ ...rp, id: `passive_${rp.id}_${Date.now()}`, libId: rp.id, isDefault: true, source: 'levelPassive' }); });
  return nextSkills;
};
