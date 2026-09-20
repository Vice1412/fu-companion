import {
  GiBrute,
  GiCrossbow,
  GiWizardStaff,
  GiTimeBomb,
  GiShieldReflect,
  GiHealing
} from 'react-icons/gi';

// --- DATA ---
export const SPONSOR_CONFIG = {
  kofiUrl: "https://ko-fi.com/scarletvice",
  authorName: "ScarletVice",
};

export const DAMAGE_TYPES = ['物理', '風', '電', '暗', '土', '火', '冰', '光', '毒'];
export const DAMAGE_TYPES_NO_PHYS = ['風', '電', '暗', '土', '火', '冰', '光', '毒'];
export const AFFINITY_STATES = { normal: { label: '一般', bg: 'bg-stone-100', border: 'border-stone-300', text: 'text-stone-700' }, vul: { label: '弱點', bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-900 font-bold' }, res: { label: '抗性', bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-950 font-bold' }, imm: { label: '免疫', bg: 'bg-sky-100', border: 'border-sky-400', text: 'text-sky-900 font-bold' }, abs: { label: '吸收', bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-900 font-bold' } };
export const LEVELS = [5, 10, 20, 30, 40, 50, 60];
export const PARTY_LEVELS = [5, 20, 40];
export const RANKS = ["士兵", "精英", "冠位"];
export const CATEGORIES = [{ id: 'attack', name: '基本攻擊', icon: '⚔️', fuIcon: 'm' }, { id: 'spell', name: '咒語', icon: '🔮', fuIcon: 'c' }, { id: 'action', name: '其餘行動', icon: '⚡', fuIcon: 's' }, { id: 'rule', name: '特殊規則', icon: '📜' }, { id: 'boss', name: 'Boss', icon: '👑' }];
export const TYPE_STYLES = { '物理': { emoji: '⚔️', fuIcon: 'p', color: 'text-stone-700 font-bold' }, '風': { emoji: '🌪️', fuIcon: 'a', color: 'text-cyan-700 font-bold' }, '電': { emoji: '⚡', fuIcon: 'b', color: 'text-amber-600 font-bold' }, '暗': { emoji: '🌑', fuIcon: 'd', color: 'text-indigo-950 font-bold' }, '土': { emoji: '🏔️', fuIcon: 'e', color: 'text-amber-800 font-bold' }, '火': { emoji: '🔥', fuIcon: 'f', color: 'text-red-700 font-bold' }, '冰': { emoji: '❄️', fuIcon: 'i', color: 'text-blue-700 font-bold' }, '光': { emoji: '☀️', fuIcon: 'l', color: 'text-amber-600 font-bold' }, '毒': { emoji: '☠️', fuIcon: 't', color: 'text-fuchsia-800 font-bold' }, '攻擊性咒語': { emoji: '💥', fuIcon: 'o', color: 'text-red-700 font-bold' } };
export const STATUS_OPTIONS = ["眩暈", "動搖", "緩慢", "虛弱"]; export const STATUS_AND_POISON = ["眩暈", "動搖", "緩慢", "虛弱", "中毒", "憤怒"]; export const ACTION_TYPES = ["攻擊", "裝備", "防禦", "阻礙", "使用庫存", "推進目標", "咒語", "研究", "技能"];

export const ROLE_ICONS = {
  "暴徒": GiBrute,
  "獵人": GiCrossbow,
  "法師": GiWizardStaff,
  "破壞者": GiTimeBomb,
  "衛士": GiShieldReflect,
  "輔助": GiHealing
};

export const ROLE_DESCRIPTIONS = {
  "暴徒": { Icon: GiBrute, icon: "🩸", subtitle: "「越戰越勇的肉搏戰車」", desc: "擁有極高的 HP 與強大的原始攻擊力，但防禦較低且弱點多。非常適合做為高壓消耗戰的 Boss，或掩護其他複雜敵人的強力肉盾。" },
  "獵人": { Icon: GiCrossbow, icon: "🏹", subtitle: "「致命的高速刺客」", desc: "擁有極高的命中與先攻，專精單體爆發與趁虛而入。擅長利用敵人的破綻與異常狀態造成毀滅性的打擊，是能瞬間撕裂防線的殺手。" },
  "法師": { Icon: GiWizardStaff, icon: "🔮", subtitle: "「掌控元素的移動砲台」", desc: "擁有最高的群體傷害潛力與 MP 儲備，精通各種屬性魔法。極度依賴 MP，HP 較低，通常需要隊友保護才能發揮最大破壞力。" },
  "破壞者": { Icon: GiTimeBomb, icon: "💣", subtitle: "「折磨心智的極惡干擾者」", desc: "不以直接傷害見長，精通各種強大的 Debuff、封鎖動作與抽取 MP。能透過異常狀態瓦解玩家戰術，是最陰險的控場大師。" },
  "衛士": { Icon: GiShieldReflect, icon: "🛡️", subtitle: "「堅不可摧的鐵壁守護者」", desc: "擁有最強的雙防禦加成。擅長保護盟友、提供抗性，並在隊友受擊時發動無情的反擊。通常伴隨著需要保護的高威脅目標出現。" },
  "輔助": { Icon: GiHealing, icon: "🌿", subtitle: "「扭轉戰局的幕後推手」", desc: "缺乏直接攻擊力，但能提供強大增益、治癒並充當 MP 電池。能讓團隊威脅成倍增加，是玩家必須優先集火擊殺的戰術樞紐。" }
};
export const VILLAIN_TIERS = { 
  "none": { up: 0, label: "非反派", color: "text-stone-600", border: "border-stone-300", bg: "bg-stone-100/60" }, 
  "minor": { up: 5, label: "次要反派", color: "text-purple-800", border: "border-purple-400", bg: "bg-purple-50" }, 
  "major": { up: 10, label: "主要反派", color: "text-red-800", border: "border-red-400", bg: "bg-red-50" }, 
  "supreme": { up: 15, label: "最終反派", color: "text-fuchsia-800", border: "border-fuchsia-400", bg: "bg-fuchsia-50" } 
};

// --- SHARED UTILS FOR ROLES ---
export const getCommonMilestones = (level) => { const ms = []; if (level >= 20) ms.push({ id: 'sys_role_20', unlockLevel: 20, originalName: "解鎖定位技能額度", originalDesc: "你獲得了 1 點額外的定位技能配置額度。請前往【步驟 3：能力】區塊進行挑選。", isSystem: true }); if (level >= 40) ms.push({ id: 'sys_role_40', unlockLevel: 40, originalName: "解鎖定位技能額度", originalDesc: "你獲得了 1 點額外的定位技能配置額度。請前往【步驟 3：能力】區塊進行挑選。", isSystem: true }); if (level >= 60) ms.push({ id: 'sys_role_60', unlockLevel: 60, originalName: "解鎖定位技能額度", originalDesc: "你獲得了 1 點額外的定位技能配置額度。請前往【步驟 3：能力】區塊進行挑選。", isSystem: true }); return ms; };
