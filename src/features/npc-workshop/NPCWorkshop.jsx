import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as htmlToImage from 'html-to-image';
import { Copy, RefreshCw, Edit3, Save, Upload, Image as ImageIcon, FileText, Trash2, BookOpen, PlusCircle, LayoutPanelLeft, UserSquare2, X, ChevronRight, ChevronLeft, ShieldAlert, Eye, Settings, Download, Sword, Swords, CheckCircle2, Lock, Unlock, AlertCircle, ChevronDown, ChevronUp, Star, Users, Crown, Link, Zap, Sparkles, Target, Shield, Map, Bomb, AlertTriangle, PawPrint, Cpu, Flame, Dna, Leaf, Ghost, User, Search, Check, ZoomIn, ZoomOut, Move, Crop, RotateCcw, Palette, Coffee, Heart } from 'lucide-react';
import modLogo from '../../assets/Fabula Ultima Mod Logo - White Background.png';
import appIcon from '../../assets/app-icon.png';

import {
  DAMAGE_TYPES,
  DAMAGE_TYPES_NO_PHYS,
  AFFINITY_STATES,
  LEVELS,
  PARTY_LEVELS,
  RANKS,
  CATEGORIES,
  TYPE_STYLES,
  STATUS_OPTIONS,
  STATUS_AND_POISON,
  ACTION_TYPES,
  ROLE_DESCRIPTIONS,
  ROLE_ICONS,
  VILLAIN_TIERS,
  getCommonMilestones,
  BOSS_SKILLS_DATA,
  NEGATIVE_SKILLS_DATA,
  SPELLS_DATA,
  ROLES_DATA,
  SPECIES_DATA,
  syncLevelPassives,
  SPONSOR_CONFIG
} from './data';

// --- COMPONENTS ---

const getDynamicValues = (npcLevel, partyLevel = 5) => {
  const pl = parseInt(partyLevel) || 5;
  const nl = parseInt(npcLevel) || 5;

  let tier = 0;
  if (pl >= 40) tier = 2;
  else if (pl >= 20) tier = 1;

  let small, large, massive;
  if (tier === 0) { small = 10; large = 30; massive = 40; }
  else if (tier === 1) { small = 20; large = 40; massive = 60; }
  else { small = 30; large = 50; massive = 80; }

  const conditionLarge = nl >= 30 ? large : small;
  const attritionHp = nl >= 30 ? 10 : 5;
  const attritionMp = nl >= 30 ? 20 : 10;
  const tempDef = 12 + Math.floor(nl / 20);

  return {
    '[少量]': small,
    '[大量]': large,
    '[巨量]': massive,
    '[條件大量]': conditionLarge,
    '[消耗戰HP]': attritionHp,
    '[消耗戰MP]': attritionMp,
    '[臨時防禦]': tempDef,
    '[碾壓傷害]': nl >= 30 ? 30 : 20
  };
};

const SPECIES_THEMES = {
  sp_beast: { color: 'amber', icon: <PawPrint size={24} />, label: 'BEAST', bg: 'bg-amber-50/80', border: 'border-amber-400/60', text: 'text-amber-900 font-bold' },
  sp_construct: { color: 'stone', icon: <Cpu size={24} />, label: 'CONSTRUCT', bg: 'bg-stone-100/80', border: 'border-stone-400/60', text: 'text-stone-800 font-bold' },
  sp_demon: { color: 'red', icon: <Flame size={24} />, label: 'DEMON', bg: 'bg-red-50/80', border: 'border-red-400/60', text: 'text-red-900 font-bold' },
  sp_element: { color: 'cyan', icon: <Zap size={24} />, label: 'ELEMENTAL', bg: 'bg-cyan-50/80', border: 'border-cyan-400/60', text: 'text-cyan-900 font-bold' },
  sp_humanoid: { color: 'blue', icon: <User size={24} />, label: 'HUMANOID', bg: 'bg-blue-50/80', border: 'border-blue-400/60', text: 'text-blue-900 font-bold' },
  sp_monster: { color: 'purple', icon: <Dna size={24} />, label: 'MONSTER', bg: 'bg-purple-50/80', border: 'border-purple-400/60', text: 'text-purple-900 font-bold' },
  sp_plant: { color: 'emerald', icon: <Leaf size={24} />, label: 'PLANT', bg: 'bg-emerald-50/80', border: 'border-emerald-400/60', text: 'text-emerald-900 font-bold' },
  sp_undead: { color: 'indigo', icon: <Ghost size={24} />, label: 'UNDEAD', bg: 'bg-indigo-50/80', border: 'border-indigo-400/60', text: 'text-indigo-900 font-bold' },
};

const TEMPLATE_KEY_TRANSLATIONS = {
  distance: "距離",
  type: "屬性",
  type1: "抗性1",
  type2: "抗性2",
  formula: "命中公式",
  attackFormula: "命中公式",
  extra: "附加效果",
  status: "異常狀態",
  status1: "狀態1",
  status2: "狀態2",
  heavy_status: "異常狀態",
  effect: "效果",
  effect1: "效果1",
  effect2: "效果2",
  imm1: "免疫1",
  imm2: "免疫2",
  statusEffect: "狀態效果",
  spell_breath_type: "吐息屬性",
  spell_curse_breath_type: "詛咒屬性",
  spell_curse_breath_status: "詛咒狀態",
  spell_mass_status_status: "群體狀態",
  spell_great_curse_status1: "大詛咒狀態1",
  spell_great_curse_status2: "大詛咒狀態2",
  spell_life_steal_type: "偷取屬性",
  spell_mind_steal_type: "偷取屬性",
  spell_weaken_type: "弱化屬性",
  spell_reinforce_status: "防護狀態",
  spell_devastation_type: "毀盪屬性",
  spell_awaken_stat: "提升屬性",
  spell_elemental_shield_type: "元素抗性屬性",
  spell_soul_veil_type: "魂之帷幕屬性",
  stat: "屬性骰",
  encStat: "提升屬性",
  source: "傷害來源",
  attack: "指定攻擊",
  trigger: "觸發條件",
  trigger1: "觸發條件1",
  trigger2: "觸發條件2",
  target: "目標",
  target_count: "目標數量",
  bonus: "加成項目",
  action1: "指定動作1",
  action2: "指定動作2",
  encRes: "恢復資源",
  sp_humanoid_bg: "背景領域",
  customName: "名稱",
  name: "名稱",
  skillName: "技能名稱",
  spellName: "咒語名稱",
  customDesc: "說明",
  desc: "說明",
  rank: "階級",
  level: "等級",
};

const getChineseKeyLabel = (key) => {
  if (!key) return "項目";
  if (TEMPLATE_KEY_TRANSLATIONS[key]) return TEMPLATE_KEY_TRANSLATIONS[key];
  if (key.includes('distance')) return "距離";
  if (key.includes('formula')) return "命中公式";
  if (key.includes('type')) return "屬性";
  if (key.includes('status')) return "狀態";
  if (key.includes('stat')) return "屬性";
  if (key.includes('effect')) return "效果";
  if (key.includes('trigger')) return "觸發條件";
  if (key.includes('target')) return "目標";
  if (key.includes('action')) return "動作";
  if (key.includes('bonus')) return "加成";
  if (key.includes('name')) return "名稱";
  if (key.includes('desc')) return "說明";
  if (key.includes('bg')) return "領域";
  if (key.includes('imm')) return "免疫";
  return key;
};

const resolveTemplateVariables = (text, selections, options = {}) => {
  if (!text) return "";
  const {
    npcLevel = 5,
    partyLevel = 5,
    hideMeta = false,
    damageEmojis = false,
    recursionLimit = 3
  } = options;

  let resolved = text;
  let loopCount = 0;

  while (resolved.includes('{') && loopCount < recursionLimit) {
    resolved = resolved.replace(/\{([^}]+)\}/g, (match, key) => {
      let val = selections?.[key];
      if (val === undefined || val === "" || (Array.isArray(val) && val.length === 0)) return `[ ___ ]`;

      if (Array.isArray(val)) {
        return '\n' + val.map(v => `● ${v}`).join('\n');
      }

      if (damageEmojis && DAMAGE_TYPES.includes(val)) {
        return `${TYPE_STYLES[val].emoji}${val}`;
      }

      return val;
    });
    loopCount++;
  }
  return resolved;
};

const getPlainText = (text, selections, npcLevel = 5, partyLevel = 5, hideMeta = false) => {
  if (!text) return "";
  let plain = text;

  if (hideMeta) {
    plain = plain.replace(/<(meta|status)>[\s\S]*?<\/\1>/gi, "");
  } else {
    plain = plain.replace(/<\/?(?:meta|status)[^>]*>/gi, "");
  }

  // Handle level-based visibility tags: <lv30+>...<lv30+> or <lv30->...<lv30->
  plain = plain.replace(/<lv(\d+)\+>([\s\S]*?)<\/lv\d+\+>/g, (match, lv, content) => npcLevel >= parseInt(lv) ? content : "");
  plain = plain.replace(/<lv(\d+)\->([\s\S]*?)<\/lv\d+\->/g, (match, lv, content) => npcLevel < parseInt(lv) ? content : "");

  const dynVals = getDynamicValues(npcLevel, partyLevel);
  Object.keys(dynVals).forEach(key => {
    plain = plain.replace(new RegExp(key.replace(/\[/g, '\\[').replace(/\]/g, '\\]'), 'g'), `${dynVals[key]} 點`);
  });

  plain = resolveTemplateVariables(plain, selections, {
    npcLevel,
    partyLevel,
    hideMeta,
    damageEmojis: true
  });
  plain = plain.replace(/<([^>]+)>/g, (match, p1) => {
    if (/^\/?(?:meta|status)/i.test(p1)) return "";
    return DAMAGE_TYPES.includes(p1) ? `${TYPE_STYLES[p1].emoji}${p1}` : p1;
  });
  plain = plain.replace(/__NPC_NAME__(.*?)__NPC_END__/g, "**$1**");
  return plain;
};

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; textArea.style.left = "-999999px"; textArea.style.top = "-999999px";
    document.body.appendChild(textArea); textArea.focus(); textArea.select();
    try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch (err) { console.error('複製失敗:', err); }
    finally { document.body.removeChild(textArea); }
  };
  return (
    <button onClick={handleCopy} className="ml-auto text-[#6b5a4b] hover:text-amber-800 transition-colors flex items-center gap-1 bg-[#f4ebd9] px-2 py-0.5 rounded border border-[#d6c7ab] hover:border-amber-600 hide-on-export" title="複製為 Markdown">
      {copied ? <CheckCircle2 size={14} className="text-green-600" /> : <Copy size={14} />}
      {copied ? <span className="text-[10px] text-green-700">已複製</span> : <span className="text-[10px]">複製文本</span>}
    </button>
  );
};

const renderFormattedText = (text, selections, npcLevel = 5, partyLevel = 5, hideMeta = false) => {
  if (!text) return "";
  let processedText = text;

  if (hideMeta) {
    processedText = processedText.replace(/<(meta|status)>[\s\S]*?<\/\1>/gi, "");
  } else {
    processedText = processedText.replace(/<\/?(?:meta|status)[^>]*>/gi, "");
  }

  // Handle level-based visibility tags: <lv30+>...<lv30+> or <lv30->...<lv30->
  processedText = processedText.replace(/<lv(\d+)\+>([\s\S]*?)<\/lv\d+\+>/g, (match, lv, content) => npcLevel >= parseInt(lv) ? content : "");
  processedText = processedText.replace(/<lv(\d+)\->([\s\S]*?)<\/lv\d+\->/g, (match, lv, content) => npcLevel < parseInt(lv) ? content : "");

  const dynVals = getDynamicValues(npcLevel, partyLevel);
  Object.keys(dynVals).forEach(key => {
    processedText = processedText.replace(new RegExp(key.replace(/\[/g, '\\[').replace(/\]/g, '\\]'), 'g'), `__DYN_VALUE__${dynVals[key]} 點__DYN_END__`);
  });

  const parts = processedText.split(/(__DYN_VALUE__.*?__DYN_END__|__NPC_NAME__.*?__NPC_END__|\{[^}]+\}|<[^>]+>)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('__DYN_VALUE__')) {
      const val = part.replace('__DYN_VALUE__', '').replace('__DYN_END__', '');
      return <span key={i} className="font-black text-pink-400 drop-shadow-[0_0_5px_rgba(244,114,182,0.6)] px-1">{val}</span>;
    }
    if (part.startsWith('__NPC_NAME__')) {
      const name = part.replace('__NPC_NAME__', '').replace('__NPC_END__', '');
      return <span key={i} className="font-black text-[#2c221e] drop-shadow-sm">{name}</span>;
    }
    if (part.startsWith('{') && part.endsWith('}')) {
      const key = part.slice(1, -1);
      const val = selections?.[key];
      if (!val || (Array.isArray(val) && val.length === 0)) {
        return (
          <span
            key={i}
            className="inline-flex items-center justify-center min-w-[50px] h-[22px] px-2 bg-[#f4ebd9]/90 border-2 border-dashed border-amber-600/70 rounded-md shadow-inner align-middle mx-1 animate-pulse hover:border-amber-700 transition-all select-none group/blankSlot"
            title={`待配置項目：${getChineseKeyLabel(key)}`}
          >
            <span className="w-full h-0.5 bg-amber-400/50 rounded-full"></span>
          </span>
        );
      }
      if (Array.isArray(val)) return <span key={i} className="font-bold text-[#2c221e]">{val.map((v, vi) => <span key={vi} className="block ml-2">● {v}</span>)}</span>;
      if (typeof val === 'string' && (val.includes('{') || val.includes('['))) return <React.Fragment key={i}>{renderFormattedText(val, selections, npcLevel, partyLevel, hideMeta)}</React.Fragment>;
      if (DAMAGE_TYPES.includes(val)) return <span key={i} className={`inline-flex items-center gap-0.5 font-extrabold ${TYPE_STYLES[val].color} tracking-wide mx-0.5 drop-shadow-sm`}>{TYPE_STYLES[val].fuIcon ? <span className="fu-icon text-lg translate-y-[1px]">{TYPE_STYLES[val].fuIcon}</span> : TYPE_STYLES[val].emoji}<span>{val}</span></span>;
      return <span key={i} className="font-extrabold text-[#2c221e] mx-0.5">{val}</span>;
    }
    if (part.startsWith('<') && part.endsWith('>')) {
      const type = part.slice(1, -1);
      if (/^\/?(?:meta|status)/i.test(type)) return null;
      if (DAMAGE_TYPES.includes(type)) return <span key={i} className={`inline-flex items-center gap-0.5 font-extrabold ${TYPE_STYLES[type].color} tracking-wide mx-0.5 drop-shadow-sm`}>{TYPE_STYLES[type].fuIcon ? <span className="fu-icon text-lg translate-y-[1px]">{TYPE_STYLES[type].fuIcon}</span> : TYPE_STYLES[type].emoji}<span>{type}</span></span>;
      return part;
    }
    return part;
  });
};

const SectionAccordion = ({ title, icon, current, max, hideIfZeroMax = false, defaultExpanded = false, alwaysComplete = false, forceOverflow = false, children, titleColor = "text-[#2c221e]", borderColor = "border-[#d6c7ab]", isExpanded: propExpanded, onToggle, stickyTop = "top-0", isFreeMode = false }) => {
  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);
  const isExpanded = propExpanded !== undefined ? propExpanded : localExpanded;

  const handleToggle = () => {
    if (onToggle) onToggle(!isExpanded);
    else setLocalExpanded(!isExpanded);
  };

  if (hideIfZeroMax && max === 0 && !forceOverflow && !isFreeMode) return null;
  const isOverflow = isFreeMode ? false : (forceOverflow || (max > 0 && current > max)); const isComplete = alwaysComplete || (current >= max) || isFreeMode;
  let statusBadge = null;
  if (isFreeMode) {
    statusBadge = <span className="flex items-center gap-1 text-[10px] text-fuchsia-800 bg-fuchsia-100 border border-fuchsia-300 px-2 py-0.5 rounded-full ml-1 md:ml-2 font-bold"><Sparkles size={12} /> <span className="hidden md:inline">解鎖限制</span> ({current}/∞)</span>;
  } else if (!alwaysComplete) {
    if (isOverflow) statusBadge = <span className="flex items-center gap-1 text-[10px] text-red-800 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full ml-1 md:ml-2 animate-pulse font-bold"><AlertCircle size={12} /> <span className="hidden md:inline">超額失效</span> ({current}/{max})</span>;
    else if (isComplete) statusBadge = <span className="flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full ml-1 md:ml-2 font-bold"><CheckCircle2 size={12} /> <span className="hidden md:inline">已完成</span> ({current}/{max})</span>;
    else statusBadge = <span className="flex items-center gap-1 text-[10px] text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full ml-1 md:ml-2 animate-pulse font-bold"><AlertCircle size={12} /> <span className="hidden md:inline">待配置</span> ({current}/{max})</span>;
  } else statusBadge = <span className="flex items-center gap-1 text-[10px] text-[#574c43] bg-[#e8dec8] border border-[#d6c7ab] px-2 py-0.5 rounded-full ml-1 md:ml-2 font-bold"><CheckCircle2 size={12} /> 已配置</span>;

  return (
    <div className={`bg-[#fffdf9] border ${isOverflow ? 'border-red-400' : 'border-[#d6c7ab]'} rounded-lg shadow-sm mb-4 transition-all duration-300 relative ${!isComplete && !alwaysComplete && !isOverflow ? 'ring-1 ring-amber-500/50 shadow-md' : isOverflow ? 'ring-1 ring-red-500/50 shadow-md' : ''}`}>
      <button className={`w-full flex justify-between items-center p-4 hover:bg-[#f4ebd9] transition-colors outline-none sticky ${stickyTop} z-20 bg-[#fffdf9]/95 backdrop-blur shadow-sm ${isExpanded ? 'border-b border-[#d6c7ab] rounded-t-lg' : 'rounded-lg'}`} onClick={handleToggle}>
        <div className="flex items-center gap-3"><span className={isOverflow ? 'text-red-700' : titleColor}>{icon}</span><h2 className={`text-sm font-bold ${isOverflow ? 'text-red-900' : titleColor} text-left`}>{title}</h2>{statusBadge}</div>
        <div className="flex items-center gap-2">{!isExpanded && !isComplete && !alwaysComplete && <span className="text-[10px] text-amber-700 font-bold animate-bounce hidden md:block">點擊展開</span>}{isExpanded ? <ChevronUp size={18} className="text-[#6b5a4b]" /> : <ChevronDown size={18} className="text-[#6b5a4b]" />}</div>
      </button>
      {isExpanded && (
        <div className="p-4 bg-[#fbf7ee]/60 animate-in slide-in-from-top-2 rounded-b-lg">
          {isOverflow && <div className="mb-4 bg-red-50 border border-red-300 p-3 rounded flex items-start gap-2 text-red-900 text-xs shadow-sm"><AlertCircle size={16} className="shrink-0 mt-0.5 text-red-700" /><div><strong className="block text-red-800 mb-0.5">⚠️ 額度溢出警告</strong>您目前的選擇已超過系統允許的上限或缺少前置技能。所有標記為紅色的技能將<strong>強制失效</strong>。</div></div>}
          {children}
        </div>
      )}
    </div>
  );
};

const SkillCard = ({ skill, isActive, isDisabled, isOverBudget, lockedMsg, onToggle, onSelectionChange, onUpdateSkill, npcLevel, partyLevel }) => {
  const isClickableTag = (tag) => ['select', 'input', 'textarea', 'button'].includes(tag);
  const textareaRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);

  // Reset editing mode if card is deselected
  useEffect(() => {
    if (!isActive) setIsEditing(false);
  }, [isActive]);

  let effectiveDesc = skill.originalDesc;
  if (!effectiveDesc && skill.category === 'attack' && skill.attack?.extra) {
    effectiveDesc = skill.attack.extra;
  }
  if (skill.selectionsConfig) {
    skill.selectionsConfig.forEach(cfg => {
      if (cfg.type === 'checkbox' && cfg.enhancedDesc && skill.selections?.[cfg.key]) effectiveDesc = cfg.enhancedDesc;
    });
  }
  const getCleanTextForEditor = (text) => {
    if (!text) return "";
    return text.replace(/<\/?(?:meta|status)[^>]*>/gi, '');
  };

  const currentDesc = skill.customDesc ?? effectiveDesc;

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (isActive) {
      adjustHeight();
    }
  }, [isActive, currentDesc]);

  return (
    <div className={`relative flex flex-col p-4 rounded-xl border-2 transition-all duration-200 text-left overflow-hidden group ${lockedMsg ? 'bg-stone-100/70 border-stone-300 opacity-60 grayscale cursor-not-allowed select-none' : isOverBudget && isActive ? 'bg-red-50 border-red-400 opacity-90 shadow-md transform scale-[1.01] z-10' : isActive ? 'bg-amber-50/80 border-amber-600 shadow-md transform scale-[1.02] z-10' : isDisabled ? 'bg-stone-100/50 border-stone-300 opacity-60 grayscale cursor-not-allowed' : 'bg-[#fffdf9] border-[#d6c7ab] hover:border-amber-600 hover:bg-[#fbf7ee] cursor-pointer'}`} onClick={(e) => { if (isClickableTag(e.target.tagName.toLowerCase())) return; if (lockedMsg && !isActive) return; if (!isDisabled || isActive) onToggle(); }}>
      <div className="absolute top-3 right-3 transition-transform flex flex-col items-end gap-2 z-10">
        {!isActive && <div className="w-5 h-5 rounded-full border-2 border-[#d6c7ab] group-hover:border-amber-600"></div>}
        {isActive && (
          <div className="flex flex-col items-end gap-2">
            {!isOverBudget && <CheckCircle2 className="text-amber-700 drop-shadow-sm" size={24} />}
            {!isEditing ? (
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                className="p-1.5 bg-[#eee6d3] text-amber-900 border border-[#d6c7ab] rounded-lg hover:bg-amber-100 transition-all shadow-sm group/edit hide-on-export"
                title="編輯技能文字"
              >
                <Edit3 size={16} className="group-hover/edit:scale-110 transition-transform" />
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}
                className="p-1.5 bg-amber-700 text-white rounded-lg hover:bg-amber-600 transition-all shadow-sm animate-pulse hide-on-export"
                title="完成編輯"
              >
                <Save size={16} />
              </button>
            )}
          </div>
        )}
      </div>
      <div className={`font-bold text-[15px] mb-2 pr-6 leading-tight flex flex-col sm:flex-row sm:items-center gap-2 ${lockedMsg ? 'text-stone-600' : isOverBudget && isActive ? 'text-red-900' : isActive ? 'text-[#2c221e]' : 'text-[#3c2f21]'}`}>
        {isEditing ? (
          <div className="flex-1 relative group/input">
            <input
              type="text"
              className={`bg-transparent border border-transparent rounded px-1 -mx-1 outline-none w-full transition-colors hover:border-[#d6c7ab] hover:bg-[#fbf7ee] focus:border-amber-600 focus:bg-[#fffdf9] ${isOverBudget ? 'text-red-900' : skill.customName !== undefined ? 'text-amber-900 font-bold' : 'text-[#2c221e]'}`}
              value={skill.customName !== undefined ? skill.customName : skill.originalName}
              onChange={(e) => onUpdateSkill(skill.id, { customName: e.target.value })}
              onBlur={(e) => { if (!e.target.value.trim()) onUpdateSkill(skill.id, { customName: undefined }); }}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute -bottom-4 left-0 text-[10px] text-amber-700 font-bold opacity-0 group-focus-within/input:opacity-100 transition-opacity pointer-events-none">正在編輯自定義名稱</div>
          </div>
        ) : (
          <span className={skill.customName !== undefined ? 'text-amber-900 font-bold' : ''}>{skill.customName || skill.originalName}</span>
        )}
        {lockedMsg ? (
          <span className="text-[10px] bg-stone-200 text-stone-800 border border-stone-400 px-2 py-0.5 rounded flex items-center gap-1 shrink-0 w-fit font-bold"><Lock size={10} /> {lockedMsg}</span>
        ) : (
          isOverBudget && isActive && <span className="text-[10px] bg-red-100 text-red-800 border border-red-400 px-2 py-0.5 rounded flex items-center gap-1 shrink-0 w-fit animate-pulse"><AlertCircle size={10} /> 額度溢出失效</span>
        )}
      </div>
      {skill.flavorText && (
        <div className="mb-2">
          <div className={`text-xs italic ${isOverBudget && isActive ? 'text-red-700' : 'text-[#6b5a4b]'}`}>{skill.flavorText}</div>
          <div className={`border-b mt-2 ${isOverBudget && isActive ? 'border-red-200' : 'border-[#d6c7ab]/50'}`}></div>
        </div>
      )}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          className={`text-sm leading-relaxed w-full bg-transparent border border-transparent rounded px-1 -mx-1 outline-none resize-none overflow-hidden transition-colors hover:border-[#b4a383] hover:bg-[#f5efdf] focus:border-[#b45309] focus:bg-[#fffdf9] min-h-[3rem] ${isOverBudget ? 'text-red-700/80' : skill.customDesc !== undefined ? 'text-amber-800' : 'text-[#3c2415]'}`}
          value={resolveTemplateVariables(getCleanTextForEditor(skill.customDesc !== undefined ? skill.customDesc : effectiveDesc), skill.selections, { damageEmojis: true })}
          placeholder={resolveTemplateVariables(getCleanTextForEditor(effectiveDesc), skill.selections, { damageEmojis: true })}
          onChange={(e) => {
            onUpdateSkill(skill.id, { customDesc: e.target.value });
            adjustHeight();
          }}
          onBlur={(e) => {
            if (!e.target.value.trim()) {
              onUpdateSkill(skill.id, { customDesc: undefined });
              setTimeout(adjustHeight, 0);
            }
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div className={`text-sm leading-relaxed ${isOverBudget && isActive ? 'text-red-700/80' : skill.customDesc !== undefined ? 'text-amber-900 font-medium' : 'text-[#574c43]'}`}>{renderFormattedText(currentDesc, skill.selections, npcLevel, partyLevel)}</div>
      )}
      {isActive && skill.selectionsConfig && skill.category !== 'attack' && (
        <div className={`mt-4 pt-3 border-t flex flex-col gap-2 animate-in slide-in-from-top-2 ${isOverBudget ? 'border-red-300' : 'border-[#d6c7ab]/60'}`}>
          {skill.selectionsConfig
            .filter(cfg => (!cfg.showIfKey || (skill.selections?.[cfg.showIfKey] || "").includes(cfg.showIfValue)) && (!cfg.reqLevel || npcLevel >= cfg.reqLevel))
            .map(cfg => {
              if (cfg.type === 'multiselect') {
                const selected = Array.isArray(skill.selections?.[cfg.key]) ? skill.selections[cfg.key] : [];
                const maxReached = selected.length >= (cfg.max || Infinity);
                return (
                  <div key={cfg.key} className={`p-2 rounded border ${isOverBudget ? 'bg-red-50/50 border-red-300' : 'bg-[#f5efdf]/60 border-[#d6c7ab]'}`} onClick={e => e.stopPropagation()}>
                    <div className={`flex justify-between items-center mb-2 text-xs font-bold ${isOverBudget ? 'text-red-800' : 'text-[#3c2415]'}`}>
                      <span>{cfg.label}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${selected.length < (cfg.min || 0) ? 'bg-red-100 text-red-800 border border-red-300' : maxReached ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-[#fffdf9] text-[#3c2415] border border-[#d6c7ab]'}`}>已選: {selected.length}/{cfg.max || '∞'}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {cfg.options.map(opt => {
                        const isChecked = selected.includes(opt);
                        const isDisabledOpt = !isChecked && maxReached;
                        return (
                          <label key={opt} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all cursor-pointer select-none ${isDisabledOpt ? 'opacity-40 cursor-not-allowed' : isChecked ? 'bg-amber-100 text-amber-900 border border-amber-400' : 'hover:bg-[#e8dec8]/50 text-[#3c2415] border border-transparent'}`}>
                            <input type="checkbox" className="accent-amber-700 w-3.5 h-3.5 shrink-0" checked={isChecked} disabled={isDisabledOpt} onChange={() => {
                              const newVal = isChecked ? selected.filter(v => v !== opt) : [...selected, opt];
                              onSelectionChange(skill.id, cfg.key, newVal);
                            }} />
                            <span className="font-bold">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              if (cfg.type === 'input') {
                return (
                  <label key={cfg.key} className={`flex flex-col gap-1.5 p-2 rounded border bg-[#f5efdf]/60 ${isOverBudget ? 'text-red-800 border-red-300' : 'text-[#3c2415] border-[#d6c7ab]'}`} onClick={e => e.stopPropagation()}>
                    <span className="text-xs font-bold">{cfg.label}</span>
                    <input
                      type="text"
                      className={`bg-[#fffdf9] text-[#2c221e] border p-1.5 rounded text-xs outline-none transition-colors border-[#d6c7ab] focus:border-amber-600`}
                      placeholder={cfg.placeholder || "在此輸入..."}
                      value={skill.selections?.[cfg.key] || ''}
                      onChange={(e) => onSelectionChange(skill.id, cfg.key, e.target.value)}
                    />
                  </label>
                );
              }
              if (cfg.type === 'checkbox') {
                const isChecked = !!skill.selections?.[cfg.key];
                return (
                  <label key={cfg.key} className={`flex items-center gap-2 p-2 rounded border bg-[#f5efdf]/60 cursor-pointer select-none transition-all ${isChecked ? (isOverBudget ? 'text-red-800 border-red-400 bg-red-100/50' : 'text-amber-900 border-amber-500 bg-amber-100/60') : (isOverBudget ? 'text-red-800 border-red-300' : 'text-[#3c2415] border-[#d6c7ab] hover:border-[#b4a383]')}`} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" className="accent-amber-700 w-3.5 h-3.5 shrink-0" checked={isChecked} onChange={() => onSelectionChange(skill.id, cfg.key, !isChecked)} />
                    <span className="text-xs font-bold">{cfg.label}</span>
                    {isChecked && <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded ml-auto">已啟用</span>}
                  </label>
                );
              }
              let finalOptions = cfg.options;
              if (skill.libId === 'bs_obj_1' && cfg.key === 'repeat_penalty') {
                const failureStatus = skill.selections?.failure_status;
                const statusPool = ['緩慢', '眩暈', '虛弱', '動搖'];
                const filteredStatuses = statusPool.filter(s => s !== failureStatus);
                finalOptions = [
                  '失去 [消耗戰HP] HP',
                  '失去 [消耗戰MP] MP',
                  ...filteredStatuses.map(s => `受到${s}狀態`)
                ];
              } else if (skill.id === 'ns_8' || skill.originalName === '狀態束縛') {
                const usedValues = Object.values(skill.selections || {});
                finalOptions = cfg.options.filter(opt => !usedValues.includes(opt) || opt === skill.selections?.[cfg.key]);
              }
              return (
                <label key={cfg.key} className={`flex justify-between items-center text-xs font-bold p-2 rounded border ${isOverBudget ? 'bg-red-50/50 text-red-800 border-red-300' : cfg.isLinked ? 'bg-indigo-50/80 text-indigo-900 border-indigo-300 ml-4 -mt-1' : 'bg-[#f5efdf]/60 text-[#3c2415] border-[#d6c7ab]'}`}>
                  {cfg.label}
                  <select className={`bg-[#fffdf9] text-[#2c221e] border p-1 rounded outline-none w-32 transition-colors ${isOverBudget ? 'border-red-400 focus:border-red-600' : cfg.isLinked ? 'border-indigo-400 focus:border-indigo-600' : 'border-[#d6c7ab] focus:border-amber-600'}`} value={skill.selections?.[cfg.key] || ''} onChange={(e) => onSelectionChange(skill.id, cfg.key, e.target.value)} onClick={e => e.stopPropagation()} >
                    <option value="">選擇...</option>{finalOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </label>
              );
            })}
        </div>
      )}
      {isActive && skill.category === 'attack' && <div className={`mt-3 pt-2 border-t text-[11px] font-bold flex items-center gap-1 ${isOverBudget ? 'border-red-300 text-red-700' : 'border-[#d6c7ab]/50 text-amber-800'}`}><Sword size={12} /> {isOverBudget ? '因額度溢出，此技能已從上方【基礎攻擊與核心能力】中移除。' : '已加入上方【基礎攻擊與核心能力】，請至該區塊配置詳細數值。'}</div>}
    </div>
  );
};

const SpellCard = ({ skillId, spellName, isActive, isDisabled, isOverBudget, isClaimedElsewhere, onToggle, selections, selectionsConfig, onSelectionChange, isSecretArt, npcLevel, partyLevel }) => {
  const isClickableTag = (tag) => ['select', 'input', 'textarea', 'button'].includes(tag);
  const textareaRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isActive) setIsEditing(false);
  }, [isActive]);

  const isOffensive = spellName.includes('⚡');
  const isMaxMp = spellName === "最大 MP +10";
  const cleanSpellName = spellName.replace(/\(Lv30\+\)/g, '').trim();
  const spellData = SPELLS_DATA[cleanSpellName];

  const getCleanTextForEditor = (text) => {
    if (!text) return "";
    return text.replace(/<\/?(?:meta|status)[^>]*>/gi, '');
  };

  const effectiveDesc = spellData?.effect || "無詳細資料。";
  const currentDesc = selections?.customDesc !== undefined ? selections.customDesc : effectiveDesc;

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (isActive) {
      adjustHeight();
    }
  }, [isActive, currentDesc]);

  return (
    <div className={`relative flex flex-col p-4 rounded-xl border-2 transition-all duration-200 text-left overflow-hidden group ${isClaimedElsewhere ? 'bg-stone-100/50 border-stone-300 opacity-60 cursor-not-allowed' : isOverBudget && isActive ? 'bg-red-50 border-red-400 opacity-90 shadow-md transform scale-[1.01] z-10' : isSecretArt && isActive ? 'bg-fuchsia-50/90 border-fuchsia-500 shadow-md transform scale-[1.02] z-10' : isActive ? 'bg-purple-50/90 border-purple-500 shadow-md transform scale-[1.02] z-10' : isDisabled ? 'bg-stone-100/50 border-stone-300 opacity-60 grayscale cursor-not-allowed' : 'bg-[#fffdf9] border-[#d6c7ab] hover:border-purple-500 hover:bg-[#fbf7ee] cursor-pointer'}`} onClick={(e) => { if (isClickableTag(e.target.tagName.toLowerCase())) return; if (isClaimedElsewhere) return; if (!isDisabled || isActive) onToggle(); }}>
      {isClaimedElsewhere ? <div className="absolute top-3 right-3 text-[10px] bg-[#eee6d3] text-[#6b5a4b] px-2 py-0.5 rounded border border-[#d6c7ab] font-bold flex items-center gap-1"><Lock size={10} /> 已學習</div> : <div className="absolute top-3 right-3 transition-transform flex flex-col items-end gap-1 z-10">
        {!isActive && <div className="w-5 h-5 rounded-full border-2 border-[#d6c7ab] group-hover:border-purple-400"></div>}
        {isActive && (
          <div className="flex flex-col items-end gap-2">
            {!isOverBudget && <CheckCircle2 className={`drop-shadow-sm ${isSecretArt ? 'text-fuchsia-700' : 'text-purple-700'}`} size={24} />}
            {!isMaxMp && (
              !isEditing ? (
                <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className={`p-1.5 bg-[#eee6d3] border rounded-lg transition-all shadow-sm group/edit hide-on-export ${isSecretArt ? 'text-fuchsia-900 border-fuchsia-300 hover:bg-fuchsia-100' : 'text-purple-900 border-purple-300 hover:bg-purple-100'}`} title="編輯咒語文字"><Edit3 size={16} className="group-hover/edit:scale-110 transition-transform" /></button>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} className={`p-1.5 text-white rounded-lg transition-all animate-pulse hide-on-export ${isSecretArt ? 'bg-fuchsia-700 hover:bg-fuchsia-600 shadow-sm' : 'bg-purple-700 hover:bg-purple-600 shadow-sm'}`} title="完成編輯"><Save size={16} /></button>
              )
            )}
          </div>
        )}
      </div>}
      <div className={`font-bold text-[16px] mb-2 pr-6 flex flex-col sm:flex-row sm:items-center gap-1 ${isOverBudget && isActive ? 'text-red-900' : isActive ? (isSecretArt ? 'text-fuchsia-950' : 'text-purple-950') : 'text-[#3c2f21]'}`}>
        <div className="flex items-center gap-1 w-full">
          {isMaxMp ? '🔵' : <span className="fu-icon text-xl text-purple-700 drop-shadow-sm shrink-0">{CATEGORIES.find(c => c.id === 'spell')?.fuIcon || 'c'}</span>}
          {isEditing ? (
            <div className="flex-1 relative group/input">
              <input type="text" className={`bg-transparent border border-transparent rounded px-1 -mx-1 outline-none w-full transition-colors hover:border-[#d6c7ab] hover:bg-[#fbf7ee] focus:border-purple-500 focus:bg-[#fffdf9] ${isOverBudget ? 'text-red-900' : selections?.customName !== undefined ? 'text-amber-900 font-bold' : (isSecretArt ? 'text-fuchsia-950' : 'text-purple-950')}`} value={selections?.customName !== undefined ? selections.customName : cleanSpellName} onChange={(e) => onSelectionChange(skillId, spellName, 'customName', e.target.value)} onBlur={(e) => { if (!e.target.value.trim()) onSelectionChange(skillId, spellName, 'customName', undefined); }} onClick={(e) => e.stopPropagation()} />
              <div className="absolute -bottom-4 left-0 text-[10px] text-amber-700 font-bold opacity-0 group-focus-within/input:opacity-100 transition-opacity pointer-events-none">正在編輯自定義名稱</div>
            </div>
          ) : (
            <span className={selections?.customName !== undefined ? 'text-amber-900 font-bold' : ''}>{renderFormattedText((selections?.customName !== undefined ? selections.customName : cleanSpellName).replace('⚡', ''), selections, npcLevel, partyLevel)}</span>
          )}
          {isOffensive && <span className="fu-icon text-xl text-red-700 drop-shadow-sm ml-1 shrink-0">{TYPE_STYLES['攻擊性咒語']?.fuIcon || 'o'}</span>}
          {isOverBudget && isActive && <span className="text-[10px] bg-red-100 text-red-800 border border-red-400 px-2 py-0.5 rounded flex items-center gap-1 shrink-0 w-fit animate-pulse ml-2"><AlertCircle size={10} /> 失效</span>}
        </div>
      </div>
      {isMaxMp ? <div className={`text-sm font-bold mt-1 ${isOverBudget && isActive ? 'text-red-800' : 'text-blue-800'}`}>增加 10 點最大 MP</div> : <>
        <div className={`flex flex-wrap gap-2 text-[11px] font-bold mb-2 bg-[#fffdf9] p-1.5 rounded w-fit border ${isOverBudget && isActive ? 'text-red-800 border-red-300' : 'text-[#6b5a4b] border-[#d6c7ab]'}`}><span>MP: <span className={isOverBudget && isActive ? 'text-red-800' : 'text-blue-800 font-bold'}>{spellData?.mp || '?'}</span></span><span className="text-[#d6c7ab]">|</span><span>目標: <span className={isOverBudget && isActive ? 'text-red-800' : 'text-[#2c221e]'}>{spellData ? renderFormattedText(spellData.target, selections, npcLevel, partyLevel) : '?'}</span></span><span className="text-[#d6c7ab]">|</span><span>持續: <span className={isOverBudget && isActive ? 'text-red-800' : 'text-[#2c221e]'}>{spellData?.duration || '?'}</span></span></div>
        {isEditing ? (
          <textarea ref={textareaRef} className={`text-sm leading-relaxed w-full bg-transparent border border-transparent rounded px-1 -mx-1 outline-none resize-none overflow-hidden transition-colors hover:border-[#d6c7ab] hover:bg-[#fbf7ee] focus:border-purple-500 focus:bg-[#fffdf9] min-h-[3rem] ${isOverBudget ? 'text-red-800' : selections?.customDesc !== undefined ? 'text-amber-900 font-medium' : 'text-[#574c43]'}`} value={resolveTemplateVariables(getCleanTextForEditor(selections?.customDesc !== undefined ? selections.customDesc : effectiveDesc), selections, { damageEmojis: true })} placeholder={resolveTemplateVariables(getCleanTextForEditor(effectiveDesc), selections, { damageEmojis: true })} onChange={(e) => { onSelectionChange(skillId, spellName, 'customDesc', e.target.value); adjustHeight(); }} onBlur={(e) => { if (!e.target.value.trim()) { onSelectionChange(skillId, spellName, 'customDesc', undefined); setTimeout(adjustHeight, 0); } }} onClick={(e) => e.stopPropagation()} />
        ) : (
          <div className={`text-xs leading-relaxed ${isOverBudget && isActive ? 'text-red-800' : selections?.customDesc !== undefined ? 'text-amber-900 font-medium' : 'text-[#574c43]'}`}>{renderFormattedText(currentDesc, selections, npcLevel, partyLevel)}{isSecretArt && isActive && !isOverBudget && <div className="text-fuchsia-900 mt-1 text-[11px] font-bold">*(此咒語為祕技，除了目標之外沒有人會意識到那是什麼。)*</div>}</div>
        )}
      </>}
      {isActive && selectionsConfig && <div className={`mt-4 pt-3 border-t flex flex-col gap-2 animate-in slide-in-from-top-2 ${isOverBudget ? 'border-red-300' : 'border-[#d6c7ab]'}`}>
        {selectionsConfig.filter(cfg => !cfg.showIfKey || (selections?.[cfg.showIfKey] || "").includes(cfg.showIfValue)).map(cfg => (
          <label key={cfg.key} className={`flex justify-between items-center text-xs font-bold bg-[#fffdf9] p-2 rounded border ${isOverBudget ? 'text-red-900 border-red-300' : 'text-purple-950 border-[#d6c7ab]'}`}>{cfg.label}
            <select className={`bg-[#fbf7ee] text-[#2c221e] border p-1 rounded outline-none w-32 transition-colors ${isOverBudget ? 'border-red-400 focus:border-red-600' : 'border-[#d6c7ab] focus:border-purple-600'}`} value={selections?.[cfg.key] || ''} onChange={(e) => onSelectionChange(skillId, spellName, cfg.key, e.target.value)} onClick={e => e.stopPropagation()} >
              <option value="">選擇...</option>{cfg.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </label>
        ))}
      </div>
      }
    </div>
  );
};

const EditableSkill = ({ skill, rawSkill, onUpdate, onDelete, onUpdateSelection, finalStats, npcLevel, partyLevel }) => {
  const baseSkill = rawSkill || skill;
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(skill.customName || skill.originalName);
  const [editDesc, setEditDesc] = useState(
    skill.customDesc !== undefined ? skill.customDesc :
    (skill.originalDesc || (baseSkill.category === 'attack' ? baseSkill.attack?.extra || "" : ""))
  );
  const [editAttack, setEditAttack] = useState(baseSkill.attack || { distance: '近戰', formula: '【靈】+【靈】', baseDmg: 5, type: '物理' });

  const initialTargetType = skill.spellData?.targetType || (skill.spellData?.target?.includes('至多') ? '至多 X 個生物' : skill.spellData?.target || '一個生物');
  const initialMaxTargets = skill.spellData?.maxTargets || (skill.spellData?.target?.match(/\d+/) ? skill.spellData.target.match(/\d+/)[0] : '3');
  const initialBaseMp = skill.spellData?.baseMp || (skill.spellData?.mp ? skill.spellData.mp.replace(/×\s*T/gi, '').trim() : '10');

  const [editSpellData, setEditSpellData] = useState({
    baseMp: initialBaseMp,
    targetType: initialTargetType,
    maxTargets: initialMaxTargets,
    duration: skill.spellData?.duration || '瞬發',
    isOffensive: skill.spellData?.isOffensive || (skill.customName || skill.originalName)?.includes('⚡') || false,
    formula: skill.spellData?.formula || '[INS + WLP]'
  });

  const isDefault = skill.isDefault || (!skill.source && skill.category === 'attack' && !skill.id.startsWith('custom_')) || skill.source === 'levelPassive';

  useEffect(() => {
    if (!isEditing) {
      setEditName(skill.customName || skill.originalName);
      setEditDesc(
        skill.customDesc !== undefined ? skill.customDesc :
        (skill.originalDesc || (baseSkill.category === 'attack' ? baseSkill.attack?.extra || "" : ""))
      );
      setEditAttack(baseSkill.attack || { distance: '近戰', formula: '【靈】+【靈】', baseDmg: 5, type: '物理' });
      
      const tType = skill.spellData?.targetType || (skill.spellData?.target?.includes('至多') ? '至多 X 個生物' : skill.spellData?.target || '一個生物');
      const mTargets = skill.spellData?.maxTargets || (skill.spellData?.target?.match(/\d+/) ? skill.spellData.target.match(/\d+/)[0] : '3');
      const bMp = skill.spellData?.baseMp || (skill.spellData?.mp ? skill.spellData.mp.replace(/×\s*T/gi, '').trim() : '10');
      
      setEditSpellData({
        baseMp: bMp,
        targetType: tType,
        maxTargets: mTargets,
        duration: skill.spellData?.duration || '瞬發',
        isOffensive: skill.spellData?.isOffensive || (skill.customName || skill.originalName)?.includes('⚡') || false,
        formula: skill.spellData?.formula || '[INS + WLP]'
      });
    }
  }, [isEditing, skill, baseSkill]);

  const handleSave = () => {
    let computedTarget = editSpellData.targetType;
    if (editSpellData.targetType === '至多 X 個生物') {
      computedTarget = `至多 ${editSpellData.maxTargets.trim() || '3'} 個生物`;
    }
    let cleanBaseMp = editSpellData.baseMp.replace(/×\s*T/gi, '').trim() || '10';
    let computedMp = editSpellData.targetType === '至多 X 個生物' ? `${cleanBaseMp} × T` : cleanBaseMp;

    let finalName = editName.trim();
    if (skill.category === 'spell' && editSpellData.isOffensive && !finalName.includes('⚡')) {
      finalName += ' ⚡';
    }

    onUpdate(skill.id, {
      customName: finalName === (skill.originalName || '') ? undefined : finalName,
      customDesc: editDesc,
      attack: skill.category === 'attack' ? editAttack : undefined,
      spellData: skill.category === 'spell' ? {
        mp: computedMp,
        baseMp: cleanBaseMp,
        targetType: editSpellData.targetType,
        maxTargets: editSpellData.maxTargets,
        target: computedTarget,
        duration: editSpellData.duration?.trim() || '瞬發',
        isOffensive: editSpellData.isOffensive,
        formula: editSpellData.isOffensive ? (editSpellData.formula || '[INS + WLP]') : undefined
      } : undefined
    });
    setIsEditing(false);
  };
  const handleCategoryChange = (e) => onUpdate(skill.id, { category: e.target.value });

  if (isEditing) {
    return (
      <div className="border-2 border-dashed border-[#b45309] p-3 mb-3 bg-[#fffdf9] rounded-lg shadow-sm text-[#2c221e]">
        <div className="flex items-center gap-2 mb-2"><span className="text-xs font-bold text-[#6b5a4b]">編輯名稱：</span><input type="text" className="flex-1 bg-[#fbf7ee] border border-[#d6c7ab] p-1.5 rounded text-sm text-[#2c221e] font-bold outline-none focus:border-amber-600" value={editName} onChange={(e) => setEditName(e.target.value)} /></div>

        {skill.category === 'attack' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 bg-[#f8f3e6] p-2 rounded border border-[#e2d6c1] text-xs">
            <div><label className="block text-[#6b5a4b] mb-1 font-bold">距離</label><select className="w-full bg-[#fffdf9] border border-[#d6c7ab] p-1 rounded text-[#2c221e]" value={editAttack.distance} onChange={e => setEditAttack({ ...editAttack, distance: e.target.value })}><option value="近戰">近戰</option><option value="遠程">遠程</option></select></div>
            <div><label className="block text-[#6b5a4b] mb-1 font-bold">檢定公式</label><input type="text" className="w-full bg-[#fffdf9] border border-[#d6c7ab] p-1 rounded text-[#2c221e]" value={editAttack.formula} onChange={e => setEditAttack({ ...editAttack, formula: e.target.value })} /></div>
            <div><label className="block text-[#6b5a4b] mb-1 font-bold font-mono">基礎傷害 HR+</label><input type="number" className="w-full bg-[#fffdf9] border border-[#d6c7ab] p-1 rounded text-[#2c221e]" value={editAttack.baseDmg} onChange={e => setEditAttack({ ...editAttack, baseDmg: parseInt(e.target.value) || 0 })} /></div>
            <div><label className="block text-[#6b5a4b] mb-1 font-bold">屬性</label><select className="w-full bg-[#fffdf9] border border-[#d6c7ab] p-1 rounded text-[#2c221e]" value={editAttack.type} onChange={e => setEditAttack({ ...editAttack, type: e.target.value })}>{DAMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          </div>
        )}

        {skill.category === 'spell' && (
          <div className="flex flex-col gap-3 w-full bg-[#f8f3e6] p-2.5 rounded border border-[#e2d6c1] text-xs mb-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[#6b5a4b] mb-1 font-bold">目標 (Target)</label>
                <select
                  className="w-full bg-[#fffdf9] border border-[#d6c7ab] p-1 rounded text-[#2c221e] font-bold"
                  value={editSpellData.targetType}
                  onChange={e => setEditSpellData({ ...editSpellData, targetType: e.target.value })}
                >
                  <option value="一個生物">一個生物</option>
                  <option value="自身">自身</option>
                  <option value="至多 X 個生物">至多 X 個生物</option>
                  <option value="特殊">特殊</option>
                </select>
              </div>

              {editSpellData.targetType === '至多 X 個生物' ? (
                <div>
                  <label className="block text-[#6b5a4b] mb-1 font-bold">目標數量 (X)</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    className="w-full bg-[#fffdf9] border border-[#d6c7ab] p-1 rounded text-[#2c221e] font-bold"
                    placeholder="例: 3"
                    value={editSpellData.maxTargets}
                    onChange={e => setEditSpellData({ ...editSpellData, maxTargets: e.target.value })}
                  />
                </div>
              ) : (
                <div className="hidden sm:block"></div>
              )}

              <div>
                <label className="block text-[#6b5a4b] mb-1 font-bold">
                  MP 消耗 {editSpellData.targetType === '至多 X 個生物' && <span className="text-amber-800 font-normal">(自動填寫 × T)</span>}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    className="w-full bg-[#fffdf9] border border-[#d6c7ab] p-1 rounded text-[#2c221e] font-bold"
                    placeholder="例: 10"
                    value={editSpellData.baseMp}
                    onChange={e => setEditSpellData({ ...editSpellData, baseMp: e.target.value })}
                  />
                  {editSpellData.targetType === '至多 X 個生物' && (
                    <span className="text-[#2c221e] font-extrabold text-sm shrink-0">× T</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[#6b5a4b] mb-1 font-bold">持續時間 (Duration)</label>
                <select
                  className="w-full bg-[#fffdf9] border border-[#d6c7ab] p-1 rounded text-[#2c221e] font-bold"
                  value={editSpellData.duration}
                  onChange={e => setEditSpellData({ ...editSpellData, duration: e.target.value })}
                >
                  <option value="瞬發">瞬發</option>
                  <option value="場景">場景</option>
                  <option value="特別">特別</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-[#d6c7ab]">
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-indigo-900">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-indigo-700"
                  checked={editSpellData.isOffensive}
                  onChange={e => setEditSpellData({ ...editSpellData, isOffensive: e.target.checked })}
                />
                <span>⚡ 攻擊性咒語 (包含魔法檢定)</span>
              </label>

              {editSpellData.isOffensive && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#6b5a4b]">魔法檢定公式:</span>
                  <select
                    className="bg-[#fffdf9] text-[#2c221e] text-xs font-bold border border-[#d6c7ab] p-1 rounded outline-none"
                    value={editSpellData.formula}
                    onChange={e => setEditSpellData({ ...editSpellData, formula: e.target.value })}
                  >
                    <option value="[INS + WLP]">【INS + WLP】(洞察 + 意志)</option>
                    <option value="[MIG + WLP]">【MIG + WLP】(體格 + 意志)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        <textarea className="w-full bg-[#fbf7ee] text-[#2c221e] p-2 border border-[#d6c7ab] outline-none h-24 resize-none rounded leading-relaxed text-sm focus:border-amber-600" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder={skill.category === 'attack' ? "輸入自訂的額外效果..." : "技能效果與敘述..."} />
        <div className="flex justify-end gap-2 mt-3"><button onClick={() => setIsEditing(false)} className="text-sm px-3 py-1 bg-[#eee6d3] hover:bg-[#e4d9c0] text-[#3c2f21] rounded transition-colors border border-[#d6c7ab]">取消</button><button onClick={handleSave} className="text-sm px-3 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded flex items-center gap-1 transition-colors shadow-sm"><Save size={14} /> 保存</button></div>
      </div>
    );
  }

  return (
    <div className={`group relative border-l-4 ${skill.source === 'levelPassive' ? 'border-amber-500 bg-amber-50/50' : 'border-stone-400 bg-[#fffdf9]'} hover:bg-[#fbf7ee] transition-colors rounded-r py-2.5 pl-3 mb-3 border border-stone-200 shadow-sm ${skill.isSecretArt ? 'ring-2 ring-fuchsia-400 bg-fuchsia-50/40' : ''}`}>
      <div className="absolute right-1 top-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#fffdf9] p-1 rounded shadow border border-[#d6c7ab] z-10"><button onClick={() => setIsEditing(true)} className="p-1 hover:text-amber-700" title="編輯"><Edit3 size={14} /></button>{!isDefault && <button onClick={() => onDelete(skill.id)} className="p-1 hover:text-red-700" title="刪除"><Trash2 size={14} /></button>}</div>
      <div className={`font-bold text-[15px] mb-1 flex items-center gap-2 ${skill.isSecretArt ? 'text-fuchsia-900' : 'text-amber-900'}`}><span className="text-[#6b5a4b] text-xs bg-[#f4ebd9] px-1.5 py-0.5 rounded border border-[#d6c7ab]">{CATEGORIES.find(c => c.id === skill.category)?.name || '未分類'}</span>{(skill.customName || skill.originalName)?.replace('⚡', '')}{typeof (skill.customName || skill.originalName) === 'string' && (skill.customName || skill.originalName).includes('⚡') && <span className="fu-icon text-red-700 drop-shadow-sm text-lg ml-0.5">{TYPE_STYLES['攻擊性咒語']?.fuIcon || 'o'}</span>}{!isDefault && <span className="text-[10px] text-red-700 border border-red-300 bg-red-50 px-1 rounded">自訂</span>}{skill.source === 'levelPassive' && <span className="text-[10px] text-amber-800 border border-amber-300 bg-amber-100 px-1 rounded"><Lock size={10} className="inline mr-1 mb-0.5" />等級解鎖</span>}</div>
      {skill.selectionsConfig && (
        <div className={`mt-2 flex flex-col gap-2 p-2 bg-[#f8f3e6] border border-[#e2d6c1] rounded text-xs border-l-2 ${skill.source === 'levelPassive' ? 'border-amber-500' : 'border-red-600'} mb-2`}>
          {skill.selectionsConfig
            .filter(cfg => (!cfg.showIfKey || (skill.selections?.[cfg.showIfKey] || "").includes(cfg.showIfValue)) && (!cfg.reqLevel || npcLevel >= cfg.reqLevel))
            .map(cfg => (
              <label key={cfg.key} className={`flex items-center gap-2 font-bold p-1.5 rounded border ${cfg.isLinked ? 'bg-indigo-50 text-indigo-900 border-indigo-200 ml-4 -mt-1' : 'text-[#3c2f21] border-transparent'}`}>{cfg.label}:
                <select className={`bg-[#fffdf9] text-[#2c221e] border border-[#d6c7ab] p-1 rounded outline-none max-w-[200px] truncate transition-colors ${cfg.isLinked ? 'focus:border-indigo-500' : skill.source === 'levelPassive' ? 'focus:border-amber-600' : 'focus:border-red-600'}`} value={skill.selections?.[cfg.key] || ''} onChange={(e) => onUpdateSelection(skill.id, cfg.key, e.target.value)}>
                  <option value="">選擇</option>{cfg.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </label>
            ))}
        </div>
      )}

      {(skill.category === 'spell' || skill.spellData) && (
        <div className="bg-[#f8f3e6] border border-[#e2d6c1] p-1.5 my-1 rounded text-xs text-[#6b5a4b] font-bold flex flex-wrap gap-2 items-center w-fit">
          <span>MP: <span className="text-blue-800">{skill.spellData?.mp || '10'}</span></span>
          <span className="text-[#d6c7ab]">|</span>
          <span>目標: <span className="text-[#2c221e]">{skill.spellData?.target || '一個生物'}</span></span>
          <span className="text-[#d6c7ab]">|</span>
          <span>持續: <span className="text-[#2c221e]">{skill.spellData?.duration || '瞬發'}</span></span>
        </div>
      )}

      {(() => {
        const hasCustomDesc = skill.customDesc !== undefined && skill.customDesc.trim() !== '';
        let displayDesc = skill.originalDesc || "";
        let displayExtra = skill.attack?.extra;

        if (skill.category === 'attack' && !skill.originalDesc) {
          if (hasCustomDesc) {
            displayDesc = "";
            displayExtra = skill.customDesc;
          }
        } else if (hasCustomDesc) {
          displayDesc = skill.customDesc;
        }

        return (
          <>
            {skill.attack && (
              <div className="bg-[#f8f3e6] border border-[#e2d6c1] p-2 my-1 rounded text-sm">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                  <span className="text-blue-900 font-bold"><span className="text-[#3c2f21] bg-[#e8dec8] px-1 rounded mr-1">[{renderFormattedText(skill.attack.distance, skill.selections, npcLevel, partyLevel)}]</span>{renderFormattedText(skill.attack.formula, skill.selections, npcLevel, partyLevel)}</span><span className="text-stone-400 text-xs">✦</span><span className="text-red-800 font-bold">[HR + {skill.attack.baseDmg}] {renderFormattedText(skill.attack.type, skill.selections, npcLevel, partyLevel)}傷害</span>
                </div>
                {displayExtra && <div className="text-[#574c43] mt-1 text-xs border-t border-[#d6c7ab]/60 pt-1 whitespace-pre-wrap">{renderFormattedText(displayExtra, skill.selections, npcLevel, partyLevel)}</div>}
              </div>
            )}
            {displayDesc && (
              <div className="text-sm text-[#3c2415] leading-relaxed whitespace-pre-wrap mt-1">{renderFormattedText(displayDesc, skill.selections, npcLevel, partyLevel)}</div>
            )}
            {skill.isSecretArt && (
              <div className="text-fuchsia-900 mt-1.5 text-xs font-bold">
                *(此{skill.attack ? '攻擊' : skill.category === 'spell' ? '咒語' : '技能'}為祕技，除了目標之外沒有人會意識到那是什麼。)*
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
};

const ReadOnlySkill = ({ skill, finalStats, npcName, npcLevel, partyLevel, onInspectorClick }) => {
  let nameState = { used: false };
  const replaceNPC = (text) => {
    if (typeof text !== 'string' || !npcName) return text;
    return text.replace(/此\s?NPC\s?/g, () => {
      if (!nameState.used) { nameState.used = true; return `__NPC_NAME__${npcName}__NPC_END__`; }
      return "它";
    });
  };

  const replacedDist = replaceNPC(skill.attack?.distance); const replacedForm = replaceNPC(skill.attack?.formula); const replacedType = replaceNPC(skill.attack?.type);
  let effectiveOrigDesc = skill.originalDesc || "";
  if (skill.selectionsConfig) {
    const libSkill = BOSS_SKILLS_DATA.find(bs => bs.id === skill.libId);
    const cfgSource = libSkill?.selectionsConfig || skill.selectionsConfig;
    cfgSource?.forEach(cfg => {
      if (cfg.type === 'checkbox' && cfg.enhancedDesc && skill.selections?.[cfg.key]) effectiveOrigDesc = cfg.enhancedDesc;
    });
  }

  const hasCustomDesc = skill.customDesc !== undefined && skill.customDesc.trim() !== '';
  let displayDesc = effectiveOrigDesc;
  let displayExtra = skill.attack?.extra;

  if (skill.category === 'attack' && !effectiveOrigDesc) {
    if (hasCustomDesc) {
      displayDesc = "";
      displayExtra = skill.customDesc;
    }
  } else if (hasCustomDesc) {
    displayDesc = skill.customDesc;
  }

  const replacedDesc = replaceNPC(displayDesc);
  const replacedExtra = replaceNPC(displayExtra);

  let textToCopy = "";
  let displaySkillName = skill.customName?.trim() ? skill.customName : skill.originalName;
  displaySkillName = displaySkillName.replace(/Lv\.\d+\s解鎖天賦：/, '').replace(/^(技能|能力)：/, '').replace(/（(獨特動作|特殊規則)）/, '').replace(/\(定位技能\)/, '').trim();

  const icon = skill.category === 'attack' ? '⚔️' : skill.category === 'action' ? '⚡' : skill.category === 'boss' ? '👑' : skill.category === 'negative' ? '⛓️' : skill.category === 'spell' ? '🔮' : '📜';
  
  const isSpellCategory = skill.category === 'spell' || skill.spellData;
  const isOffensiveSpell = isSpellCategory && (skill.spellData?.isOffensive || displaySkillName.includes('⚡'));
  const totalMagicAcc = (finalStats.Acc || 0) + (finalStats.MagicAccModifier || 0);

  if (isSpellCategory) {
    const spMp = skill.spellData?.mp || '10';
    const spTarget = getPlainText(replaceNPC(skill.spellData?.target || '一個生物'), skill.selections, npcLevel, partyLevel, true);
    const spDuration = skill.spellData?.duration || '瞬發';
    textToCopy += `> ${isOffensiveSpell ? '⚡' : '🔮'} ${displaySkillName.replace('⚡', '')} (MP: ${spMp} | 目標: ${spTarget} | 持續: ${spDuration})\n`;
    if (isOffensiveSpell) {
      const accStr = totalMagicAcc > 0 ? ` +${totalMagicAcc}` : (totalMagicAcc < 0 ? ` - ${Math.abs(totalMagicAcc)}` : '');
      const formulaDisplay = finalStats.magicFormula || '[INS + WLP]';
      textToCopy += `> ${formulaDisplay}${accStr} ✦ 魔法攻擊\n`;
    }
    if (replacedDesc) textToCopy += `> ${getPlainText(replacedDesc, skill.selections, npcLevel, partyLevel, true).split('\n').join('\n> ')}\n`;
  } else {
    textToCopy += `> ${icon} ${displaySkillName}\n`;
    if (skill.attack) {
      const dist = getPlainText(replacedDist, skill.selections, npcLevel, partyLevel, true); const form = getPlainText(replacedForm, skill.selections, npcLevel, partyLevel, true); const accStr = finalStats.Acc > 0 ? ` +${finalStats.Acc}` : (finalStats.Acc < 0 ? ` - ${Math.abs(finalStats.Acc)}` : ''); const dmg = skill.attack.baseDmg + finalStats.Dmg; const type = getPlainText(replacedType, skill.selections, npcLevel, partyLevel, true);
      textToCopy += `> [${dist}] ${form}${accStr} ✦ [HR + ${dmg}] ${type}傷害\n`;
      if (replacedExtra) textToCopy += `> ${getPlainText(replacedExtra, skill.selections, npcLevel, partyLevel, true).split('\n').join('\n> ')}\n`;
    }
    if (replacedDesc) textToCopy += `> ${getPlainText(replacedDesc, skill.selections, npcLevel, partyLevel, true).split('\n').join('\n> ')}\n`;
    if (skill.isSecretArt) {
      const label = skill.attack ? '攻擊' : isSpellCategory ? '咒語' : '技能';
      textToCopy += `> *(此${label}為祕技，除了目標之外沒有人會意識到那是什麼。)*\n`;
    }
  }
  textToCopy = textToCopy.trim();

  if (npcName) {
    let mdUsed = false;
    textToCopy = textToCopy.replace(/此\s?NPC\s?/g, () => { if (!mdUsed) { mdUsed = true; return `**${npcName}**`; } return "它"; });
  }

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return;
    if (onInspectorClick && (skill.id || skill.libId)) {
      onInspectorClick(skill.id || skill.libId, skill.source === 'bossSkill' ? 'boss' : skill.category === 'spell' ? 'spells' : 'skills');
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`mb-4 break-inside-avoid p-2.5 rounded-lg border transition-all ${onInspectorClick ? 'cursor-pointer hover:border-amber-500 hover:shadow-md hover:ring-1 hover:ring-amber-500/50 group/inspector' : ''} ${skill.isSecretArt ? 'border-fuchsia-300 bg-fuchsia-50/80 shadow-sm' : skill.category === 'boss' ? 'border-amber-300 bg-amber-50/80 shadow-sm' : isSpellCategory ? 'border-purple-200 bg-purple-50/40 shadow-sm' : 'border-stone-200 bg-[#fbf7ee]/40'}`}
      title={onInspectorClick ? "點擊反向定位至編輯表單" : ""}
    >
      <div className={`font-bold text-[15px] mb-1 flex flex-wrap items-center gap-2 ${skill.isSecretArt ? 'text-fuchsia-900' : skill.category === 'boss' ? 'text-amber-900' : isSpellCategory ? 'text-purple-950' : 'text-stone-900'}`}>
        <span className={`w-2 h-2 rounded-full inline-block shrink-0 ${skill.isSecretArt ? 'bg-fuchsia-600 shadow-sm' : skill.category === 'boss' ? 'bg-amber-600 shadow-sm' : isSpellCategory ? 'bg-purple-600 shadow-sm' : 'bg-amber-700 shadow-sm'}`}></span>{displaySkillName.replace('⚡', '')}{isOffensiveSpell && <span className="fu-icon text-xl text-red-700 drop-shadow-sm ml-0.5">{TYPE_STYLES['攻擊性咒語']?.fuIcon || 'o'}</span>}<CopyButton text={textToCopy} />
      </div>

      {isSpellCategory && (
        <div className="flex flex-wrap items-center gap-2 text-[#6b5a4b] text-xs font-bold tracking-wider bg-[#fffdf9] px-2 py-1 my-1 ml-2 md:ml-4 rounded border border-[#d6c7ab] shadow-sm w-fit">
          <span>MP: <span className="text-blue-700 font-bold">{skill.spellData?.mp || '10'}</span></span>
          <span className="text-[#d6c7ab] hidden sm:inline">|</span>
          <span>目標: <span className="text-[#2c221e]">{renderFormattedText(replaceNPC(skill.spellData?.target || '一個生物'), skill.selections, npcLevel, partyLevel, true)}</span></span>
          <span className="text-[#d6c7ab] hidden sm:inline">|</span>
          <span>持續: <span className="text-[#2c221e]">{skill.spellData?.duration || '瞬發'}</span></span>
        </div>
      )}

      {isOffensiveSpell && (
        <div className="text-blue-900 text-[13px] font-bold mb-1.5 ml-2 md:ml-4 flex items-center gap-1.5">
          <span className="text-[#2c221e] tracking-widest">{finalStats.magicFormula || '[INS + WLP]'}</span> {totalMagicAcc !== 0 && <span className="text-amber-700">{totalMagicAcc > 0 ? `+ ${totalMagicAcc}` : `- ${Math.abs(totalMagicAcc)}`}</span>} ✦ 魔法攻擊
        </div>
      )}

      {skill.attack && (
        <div className={`bg-[#fffdf9] border-l-4 p-2.5 my-1 text-sm ml-2 md:ml-4 rounded-r border border-stone-200 shadow-sm ${skill.isSecretArt ? 'border-l-fuchsia-600' : skill.category === 'boss' ? 'border-l-amber-600' : 'border-l-red-700'}`}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-blue-900 font-bold"><span className="text-stone-900">[{renderFormattedText(replacedDist, skill.selections, npcLevel, partyLevel, true)}]</span> {renderFormattedText(replacedForm, skill.selections, npcLevel, partyLevel, true)} {finalStats.Acc !== 0 && <span className="text-amber-700 font-bold">{finalStats.Acc > 0 ? `+ ${finalStats.Acc}` : `- ${Math.abs(finalStats.Acc)}`}</span>}</span>
            <span className="text-stone-400 text-xs">✦</span><span className="text-red-900 font-bold">[HR + <span className="font-extrabold">{skill.attack.baseDmg + finalStats.Dmg}</span>] {renderFormattedText(replacedType, skill.selections, npcLevel, partyLevel, true)}傷害</span>
          </div>
          {replacedExtra && <div className="text-stone-700 mt-1.5 pt-1.5 border-t border-stone-200 leading-relaxed text-xs whitespace-pre-wrap">{renderFormattedText(replacedExtra, skill.selections, npcLevel, partyLevel, true)}</div>}
        </div>
      )}
      {(!skill.attack || replacedDesc) && <div className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap ml-2 md:ml-4">{renderFormattedText(replacedDesc, skill.selections, npcLevel, partyLevel, true)}</div>}
      {skill.isSecretArt && (
        <div className="text-fuchsia-900 mt-1.5 ml-2 md:ml-4 text-xs font-bold">
          *(此{skill.attack ? '攻擊' : isSpellCategory ? '咒語' : '技能'}為祕技，除了目標之外沒有人會意識到那是什麼。)*
        </div>
      )}
    </div>
  );
};

// --- MAIN APP ---
const THEMES = {
  amber: {
    name: '📜 琥珀棕',
    accent: '#b45309',
    accentHover: '#92400e',
    accentDark: '#8b5e34',
    accentLight: '#fef3c7',
    badgeBg: '#fbf3de',
    border: '#d6c7ab',
    appBg: '#fbf7ee',
    cardBg: '#fffdf9',
    sheetBg: '#fbf7ee',
    panelBg: '#f5efdf',
    subpanelBg: '#f4ebd9',
    headerBg: '#f4ebd9',
    exportBg: '#fbf7ee',
    textDark: '#3c2415'
  },
  blue: {
    name: '✒️ 經典藍',
    accent: '#1d4ed8',
    accentHover: '#1e40af',
    accentDark: '#1e3a8a',
    accentLight: '#dbeafe',
    badgeBg: '#eff6ff',
    border: '#b0d0ff',
    appBg: '#f0f5ff',
    cardBg: '#ffffff',
    sheetBg: '#f4f8ff',
    panelBg: '#e6f0ff',
    subpanelBg: '#dbeafe',
    headerBg: '#e0ecff',
    exportBg: '#f4f8ff',
    textDark: '#1e293b'
  },
  crimson: {
    name: '🩸 硃砂紅',
    accent: '#b91c1c',
    accentHover: '#991b1b',
    accentDark: '#7f1d1d',
    accentLight: '#fee2e2',
    badgeBg: '#fef2f2',
    border: '#fca5a5',
    appBg: '#fff5f5',
    cardBg: '#ffffff',
    sheetBg: '#fff8f8',
    panelBg: '#ffebeb',
    subpanelBg: '#fee2e2',
    headerBg: '#fde2e2',
    exportBg: '#fff8f8',
    textDark: '#3b1c1c'
  },
  emerald: {
    name: '🌲 森林綠',
    accent: '#15803d',
    accentHover: '#166534',
    accentDark: '#14532d',
    accentLight: '#dcfce7',
    badgeBg: '#f0fdf4',
    border: '#86efac',
    appBg: '#f0fdf4',
    cardBg: '#ffffff',
    sheetBg: '#f4fcf6',
    panelBg: '#e6f7ec',
    subpanelBg: '#dcfce7',
    headerBg: '#dcfce7',
    exportBg: '#f4fcf6',
    textDark: '#143823'
  },
  purple: {
    name: '🔮 經典紫',
    accent: '#7e22ce',
    accentHover: '#6b21a8',
    accentDark: '#581c87',
    accentLight: '#f3e8ff',
    badgeBg: '#faf5ff',
    border: '#d8b4fe',
    appBg: '#fbf5ff',
    cardBg: '#ffffff',
    sheetBg: '#faf5ff',
    panelBg: '#f3e8ff',
    subpanelBg: '#ede9fe',
    headerBg: '#ede9fe',
    exportBg: '#faf5ff',
    textDark: '#2e104d'
  },
  slate: {
    name: '🌑 鐵石灰',
    accent: '#374151',
    accentHover: '#1f2937',
    accentDark: '#111827',
    accentLight: '#e5e7eb',
    badgeBg: '#f3f4f6',
    border: '#9ca3af',
    appBg: '#f8fafc',
    cardBg: '#ffffff',
    sheetBg: '#f8fafc',
    panelBg: '#f1f5f9',
    subpanelBg: '#e2e8f0',
    headerBg: '#e2e8f0',
    exportBg: '#f8fafc',
    textDark: '#1e293b'
  }
};

const getInitialAffinities = () => { const init = {}; DAMAGE_TYPES.forEach(type => init[type] = 'normal'); return init; };

const migrateNpcState = (npc) => {
  if (!npc) return npc;
  const migrated = { ...npc };
  if (!migrated.affinities) migrated.affinities = getInitialAffinities();
  else if (typeof migrated.affinities.vulnerabilities === 'string') migrated.affinities = getInitialAffinities();

  if (!migrated.villainTier) migrated.villainTier = "none";
  if (migrated.avatarScale === undefined) migrated.avatarScale = 1;
  if (!migrated.avatarFit) migrated.avatarFit = 'cover';
  if (migrated.avatarOffsetX === undefined) migrated.avatarOffsetX = 0;
  if (migrated.avatarOffsetY === undefined) migrated.avatarOffsetY = 0;
  if (!migrated.customDice) migrated.customDice = {};

  if (migrated.role && migrated.skills && ROLES_DATA[migrated.role]) {
    // 1. Repair: Ensure skills that look like defaults (legacy) have libId and isDefault
    migrated.skills = migrated.skills.map(s => {
      // Legacy skills might have id 'b1', 'b2' but no libId or isDefault flag
      if (!s.libId && s.id && /^[bhmu][1-9]$/.test(s.id)) {
        return { ...s, libId: s.id, isDefault: true };
      }
      return s;
    });

    // 2. Sync level passives
    migrated.skills = syncLevelPassives(migrated.role, migrated.level || 5, migrated.skills);

    // 3. Ensure all default skills for current role exist
    ROLES_DATA[migrated.role].defaultSkills.forEach(ds => {
      if (!migrated.skills.some(s => s.libId === ds.id)) {
        migrated.skills.push({ ...ds, id: `${ds.id}_${Date.now()}`, libId: ds.id, isDefault: true });
      }
    });

    // 4. Final safety: Deduplicate default skills by libId (keep the first one found)
    const seenLibIds = new Set();
    migrated.skills = migrated.skills.filter(s => {
      if (s.libId && /^[bhmu][1-9]$/.test(s.libId)) {
        if (seenLibIds.has(s.libId)) return false;
        seenLibIds.add(s.libId);
      }
      return true;
    });
  }

  return migrated;
};

// --- Species & Affinity Integration Engine ---
const getSpeciesAffinities = (sid, sCfg) => {
  const affs = {};
  if (!sid || !sCfg) return affs;
  const sBenefits = sCfg.selectedBenefits || [];

  if (sid === 'sp_construct') {
    affs['土'] = 'res';
    affs['毒'] = 'imm';
    if (sCfg.sp_construct_extra_vul && sCfg.sp_construct_extra_vul !== '無') affs[sCfg.sp_construct_extra_vul] = 'vul';
  }

  if (sid === 'sp_demon') {
    const res = Array.isArray(sCfg.sp_demon_resists) ? sCfg.sp_demon_resists : (sCfg.sp_demon_resists ? [sCfg.sp_demon_resists] : []);
    res.forEach(t => affs[t] = 'res');
    // b1: Replace a resist with absorption.
    if (sBenefits.includes('b1') && sCfg.sp_demon_abs_choice) {
      affs[sCfg.sp_demon_abs_choice] = 'abs';
    }
  }

  if (sid === 'sp_element') {
    affs['毒'] = 'imm';
    if (sCfg.sp_element_immune) affs[sCfg.sp_element_immune] = 'imm';
    if (sCfg.sp_element_extra_vul && sCfg.sp_element_extra_vul !== '無') affs[sCfg.sp_element_extra_vul] = 'vul';
    if (sBenefits.includes('b1') && sCfg.sp_element_abs_choice) {
      if (sCfg.sp_element_abs_choice === '連結於免疫') {
        if (sCfg.sp_element_immune) affs[sCfg.sp_element_immune] = 'abs';
      } else {
        affs[sCfg.sp_element_abs_choice] = 'abs';
      }
    }
  }

  if (sid === 'sp_humanoid') {
    if (sCfg.sp_humanoid_weakness) affs[sCfg.sp_humanoid_weakness] = 'vul';
    if (sBenefits.includes('b1')) {
      const res = sCfg.sp_humanoid_resists || [];
      res.forEach(t => affs[t] = 'res');
    }
  }

  if (sid === 'sp_monster') {
    if (sBenefits.includes('b1')) {
      const res = sCfg.sp_monster_resists || [];
      res.forEach(t => affs[t] = 'res');
    }
  }

  if (sid === 'sp_plant') {
    if (sCfg.sp_plant_weakness) affs[sCfg.sp_plant_weakness] = 'vul';
    if (sBenefits.includes('b2')) {
      const res = sCfg.sp_plant_resists || [];
      res.forEach(t => affs[t] = 'res');
    }
  }

  if (sid === 'sp_undead') {
    affs['光'] = 'vul';
    affs['暗'] = 'imm';
    affs['毒'] = 'imm';
    if (sCfg.sp_undead_extra_vul && sCfg.sp_undead_extra_vul !== '無') affs[sCfg.sp_undead_extra_vul] = 'vul';
    if (sBenefits.includes('b1')) affs['暗'] = 'abs';
  }

  return affs;
};

function FreeModeConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#fffdf9] border-2 border-fuchsia-600 rounded-2xl max-w-md w-full p-6 shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-[#2c221e]">
        <div className="absolute top-0 right-0 p-6 opacity-[0.06] text-9xl pointer-events-none select-none text-fuchsia-900">
          🔓
        </div>

        <div className="flex items-center gap-3 text-fuchsia-900 font-black text-lg mb-4">
          <div className="p-2.5 bg-fuchsia-100 rounded-xl border border-fuchsia-300 shadow-inner">
            <Unlock size={24} className="animate-bounce text-fuchsia-800" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black tracking-widest text-fuchsia-900">開啟自定義模式</h3>
            <p className="text-[11px] text-fuchsia-700 font-bold uppercase tracking-wider">Free Edit Mode</p>
          </div>
        </div>

        <div className="text-xs md:text-sm text-[#3c2f21] space-y-3 leading-relaxed mb-6">
          <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl text-amber-900 text-xs flex items-start gap-2.5 shadow-sm">
            <AlertTriangle size={18} className="shrink-0 text-amber-700 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900">警示：</span>
              <span>開啟自定義模式將解除官方平衡規則限制。</span>
            </div>
          </div>

          <p className="text-[#3c2f21]">
            解鎖後，您將獲得以下權限：
          </p>

          <ul className="list-disc list-inside text-xs text-[#574c43] space-y-1.5 pl-1 bg-[#f4ebd9] p-3 rounded-xl border border-[#d6c7ab]">
            <li>自由調整 NPC 的 <strong className="text-fuchsia-900">體質骰子大小 (DEX / INS / MIG / WLP)</strong>。</li>
            <li><strong className="text-amber-800">HP, MP, 物防, 魔防</strong> 將依據 Fabula Ultima 體質公式自動連動重算。</li>
            <li>無視等級、職能與技能額度上限限制，自由組合技能與能力。</li>
          </ul>

          <p className="text-[11px] text-[#8c7b6c] italic">
            此模式適合設計獨特遭遇、強大 Boss 或測試家規。您可隨時點擊右上角按鈕恢復嚴謹模式。
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#d6c7ab]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-bold text-xs md:text-sm bg-[#eee6d3] hover:bg-[#e4d9c0] text-[#3c2f21] border border-[#d6c7ab] transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 rounded-lg font-bold text-xs md:text-sm bg-fuchsia-700 hover:bg-fuchsia-600 text-white shadow-md transition-all hover:scale-105 flex items-center gap-1.5"
          >
            <Check size={16} /> 確認開啟自定義
          </button>
        </div>
      </div>
    </div>
  );
}

function AvatarCropperModal({ isOpen, imageSrc, onClose, onConfirm }) {
  const [zoom, setZoom] = useState(1.0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
  const imgRef = useRef(null);

  const VIEWPORT_SIZE = 280;

  useEffect(() => {
    if (imageSrc && isOpen) {
      setZoom(1.0);
      setOffset({ x: 0, y: 0 });
      const img = new Image();
      img.onload = () => {
        setNaturalSize({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height });
      };
      img.src = imageSrc;
    }
  }, [imageSrc, isOpen]);

  if (!isOpen || !imageSrc) return null;

  const baseScale = naturalSize.w && naturalSize.h
    ? Math.max(VIEWPORT_SIZE / naturalSize.w, VIEWPORT_SIZE / naturalSize.h)
    : 1;

  const currentScale = baseScale * zoom;
  const renderedW = (naturalSize.w || VIEWPORT_SIZE) * currentScale;
  const renderedH = (naturalSize.h || VIEWPORT_SIZE) * currentScale;

  const left = VIEWPORT_SIZE / 2 + offset.x - renderedW / 2;
  const top = VIEWPORT_SIZE / 2 + offset.y - renderedH / 2;

  const handlePointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: offset.x,
      startY: offset.y
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffset({
      x: Math.round(dragStartRef.current.startX + dx),
      y: Math.round(dragStartRef.current.startY + dy)
    });
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
      setIsDragging(false);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const step = -e.deltaY * 0.002;
    setZoom(prev => Math.min(5.0, Math.max(0.2, Math.round((prev + step) * 100) / 100)));
  };

  const handleApply = () => {
    if (!imgRef.current) return;
    try {
      const OUTPUT_SIZE = 500;
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';

      const ratio = OUTPUT_SIZE / VIEWPORT_SIZE;
      const drawX = left * ratio;
      const drawY = top * ratio;
      const drawW = renderedW * ratio;
      const drawH = renderedH * ratio;

      ctx.drawImage(imgRef.current, drawX, drawY, drawW, drawH);
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onConfirm(croppedDataUrl);
    } catch (err) {
      console.warn("Canvas crop export failed (likely CORS tainted), using raw image source directly:", err);
      onConfirm(imageSrc);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#fbf7ee] border border-[#d6c7ab] rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 text-[#2c221e]">
        <div className="flex items-center justify-between pb-2 border-b border-[#d6c7ab]">
          <div>
            <h3 className="font-bold text-base text-[#3c2415] flex items-center gap-2">
              <ImageIcon size={18} className="text-amber-700" /> 調整頭像大小與位置
            </h3>
            <p className="text-xs text-[#6b5a4b] mt-0.5">
              按住圖片可自由拖曳位置，滑動滑桿或滾動滾輪可放大縮小
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#6b5a4b] hover:text-[#2c221e] rounded-lg hover:bg-[#eee6d3] transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-center py-1">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
            className={`relative rounded-xl overflow-hidden border-2 border-amber-600/80 bg-[#f5efdf] shadow-md select-none touch-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            title="按住滑鼠拖曳移動，滾動滑鼠滾輪縮放"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop Target"
              draggable={false}
              className="absolute max-w-none select-none pointer-events-none pixelated"
              style={{
                width: `${renderedW}px`,
                height: `${renderedH}px`,
                left: `${left}px`,
                top: `${top}px`,
                imageRendering: 'pixelated'
              }}
            />

            <div className="absolute inset-0 pointer-events-none border border-amber-600/20 grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-black/10"></div>
              <div className="border-r border-b border-black/10"></div>
              <div className="border-b border-black/10"></div>
              <div className="border-r border-b border-black/10"></div>
              <div className="border-r border-b border-black/10"></div>
              <div className="border-b border-black/10"></div>
              <div className="border-r border-black/10"></div>
              <div className="border-r border-black/10"></div>
              <div></div>
            </div>

            <div className="absolute top-2 left-2 bg-[#fffdf9]/90 backdrop-blur-sm border border-[#d6c7ab] rounded px-2 py-0.5 text-[10px] text-amber-900 font-bold flex items-center gap-1 pointer-events-none">
              <Move size={11} /> 拖曳移動
            </div>
          </div>
        </div>

        <div className="space-y-3 bg-[#fffdf9] border border-[#d6c7ab] p-3 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[#3c2f21] font-bold">
              <ZoomIn size={15} className="text-amber-700" />
              <span>縮放大小：</span>
              <span className="text-amber-800 font-mono text-sm">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <button
              type="button"
              onClick={() => { setZoom(1.0); setOffset({ x: 0, y: 0 }); }}
              className="text-[11px] text-[#6b5a4b] hover:text-[#2c221e] flex items-center gap-1 transition"
            >
              <RefreshCw size={12} /> 居中重設
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#8c7b6c] font-mono">20%</span>
            <input
              type="range"
              min="0.2"
              max="5.0"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-[#d6c7ab] rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <span className="text-[10px] text-[#8c7b6c] font-mono">500%</span>
          </div>

          <div className="flex items-center justify-between gap-1 pt-1">
            <span className="text-[10px] text-[#8c7b6c]">快速倍率：</span>
            <div className="flex gap-1 flex-wrap">
              {[0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0].map((sVal) => (
                <button
                  key={sVal}
                  type="button"
                  onClick={() => setZoom(sVal)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                    Math.abs(zoom - sVal) < 0.05
                      ? 'bg-amber-700 text-white font-bold'
                      : 'bg-[#eee6d3] text-[#6b5a4b] hover:text-[#2c221e] hover:bg-[#e4d9c0]'
                  }`}
                >
                  {Math.round(sVal * 100)}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d6c7ab]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#eee6d3] hover:bg-[#e4d9c0] text-[#3c2f21] rounded-lg text-xs font-bold transition border border-[#d6c7ab]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition shadow flex items-center gap-1.5"
          >
            <Check size={14} /> 完成裁切並套用
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const sheetRef = useRef(null);

  const [library, setLibrary] = useState(() => {
    const saved = localStorage.getItem('fabula-npc-library-v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.map(migrateNpcState) : [];
      } catch (e) { }
    }
    return [];
  });

  useEffect(() => { localStorage.setItem('fabula-npc-library-v2', JSON.stringify(library)); }, [library]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [activeMainTab, setActiveMainTab] = useState('library');
  const [state, setState] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0); 
  const dragStartXRef = useRef(0);
  const [visualIndex, setVisualIndex] = useState(0);
  const [activeAffinityTab, setActiveAffinityTab] = useState('vul');
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const avatarDragCounter = useRef(0);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSource, setCropImageSource] = useState(null);
  const [pendingRawSource, setPendingRawSource] = useState(null);
  const [isFreeModeConfirmOpen, setIsFreeModeConfirmOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [step4SubTab, setStep4SubTab] = useState('stats'); // 'stats' | 'skills' | 'spells'
  const [roleSkillSearch, setRoleSkillSearch] = useState('');
  const [spellSearch, setSpellSearch] = useState('');
  const [copyFormatDropdownOpen, setCopyFormatDropdownOpen] = useState(false);
  const [highlightedSkillId, setHighlightedSkillId] = useState(null);
  const [isWindowDraggingFile, setIsWindowDraggingFile] = useState(false);
  const bottomSheetRef = useRef(null);
  const bsDragStartY = useRef(0);
  const bsDragOffset = useRef(0);

  const handleFreeModeToggleClick = () => {
    if (!state) return;
    if (!state.isFreeModeEnabled) {
      setIsFreeModeConfirmOpen(true);
    } else {
      setState(prev => ({ ...prev, isFreeModeEnabled: false }));
      showToast('🔒 已恢復嚴謹模式：重新計算技能額度與規則限制。', 'success');
    }
  };

  const handleConfirmFreeMode = () => {
    setIsFreeModeConfirmOpen(false);
    if (!state) return;
    setState(prev => ({ ...prev, isFreeModeEnabled: true }));
    showToast('✨ 已解除規則限制：現在可以自由編輯體質骰子與技能額度！', 'success');
  };

  const [toast, setToast] = useState(null);
  const handleSendToCombat = (npc) => {
    try {
      const combatant = exportNpcToCombatant(npc);
      const activeCombat = JSON.parse(localStorage.getItem('fu_companion_active_combat') || '{}');
      const combatants = activeCombat.combatants || [];
      combatants.push(combatant);
      activeCombat.combatants = combatants;
      localStorage.setItem('fu_companion_active_combat', JSON.stringify(activeCombat));
      showToast(`⚔️ 已將【${npc.name || 'NPC'}】推入戰鬥房間！`, 'success');
    } catch (e) {
      console.error('Failed to send to combat:', e);
      showToast('❌ 入戰失敗，請確認怪物數據完整。', 'error');
    }
  };

  const [expandedBossGroups, setExpandedBossGroups] = useState({});
  const [activeBossTab, setActiveBossTab] = useState(null);
  const [revealLevel, setRevealLevel] = useState('full'); // 'full', '7', '10', '13'
  const [roleDrafts, setRoleDrafts] = useState({});
  const [appTheme, setAppTheme] = useState(() => {
    const saved = localStorage.getItem('fabula-npc-theme');
    return saved && THEMES[saved] ? saved : 'amber';
  });
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-codex-theme', appTheme);
  }, [appTheme]);

  const currentTheme = THEMES[appTheme] || THEMES.amber;

  // --- Task 3.1: Global Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag);

      // Ctrl+S / Cmd+S: Save NPC
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (state && activeMainTab !== 'library') {
          handleSaveToLibrary();
        }
        return;
      }

      // Escape: Close modals/dropdowns/cropper
      if (e.key === 'Escape') {
        if (isCropModalOpen) { setIsCropModalOpen(false); return; }
        if (isFreeModeConfirmOpen) { setIsFreeModeConfirmOpen(false); return; }
        if (copyFormatDropdownOpen) { setCopyFormatDropdownOpen(false); return; }
        if (isBottomSheetOpen) { setIsBottomSheetOpen(false); return; }
      }

      // Alt+Left / Alt+Right: Step navigation
      if (!isTyping && e.altKey) {
        if (e.key === 'ArrowLeft' && activeMainTab === 'build' && currentStep > 1) {
          e.preventDefault();
          setCurrentStep(p => Math.max(1, p - 1));
        } else if (e.key === 'ArrowRight' && activeMainTab === 'build' && currentStep < 8) {
          e.preventDefault();
          setCurrentStep(p => Math.min(8, p + 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, activeMainTab, currentStep, isCropModalOpen, isFreeModeConfirmOpen, copyFormatDropdownOpen, isBottomSheetOpen]);

  // --- Task 3.2: Window Drag and Drop JSON Import ---
  useEffect(() => {
    const handleWindowDragOver = (e) => {
      e.preventDefault();
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsWindowDraggingFile(true);
      }
    };

    const handleWindowDragLeave = (e) => {
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setIsWindowDraggingFile(false);
      }
    };

    const handleWindowDrop = (e) => {
      e.preventDefault();
      setIsWindowDraggingFile(false);
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!file.name.toLowerCase().endsWith('.json')) {
        showToast("⚠️ 請拖曳 .json 格式的 NPC 檔案", "warning");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (Array.isArray(parsed)) {
            setLibrary(prev => {
              const newLib = [...prev];
              parsed.forEach(item => {
                if (item.id && !newLib.some(existing => existing.id === item.id)) {
                  newLib.push(migrateNpcState(item));
                }
              });
              localStorage.setItem('fu_npc_library', JSON.stringify(newLib));
              return newLib;
            });
            showToast(`✅ 成功備份/匯入 ${parsed.length} 個 NPC 至檔案庫！`, "success");
            setActiveMainTab('library');
          } else if (parsed && typeof parsed === 'object') {
            const migrated = migrateNpcState(parsed);
            setState(migrated);
            setActiveMainTab('build');
            showToast(`✅ 成功讀取「${migrated.name || 'NPC'}」的檔案！`, "success");
          }
        } catch (err) {
          showToast("❌ JSON 格式解析失敗，請確認檔案內容是否正確！", "error");
        }
      };
      reader.readAsText(file);
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  // --- Task 3.2: Backup All NPCs ---
  const handleBackupAllNPCs = () => {
    if (!library || library.length === 0) {
      showToast("⚠️ 檔案庫目前為空，無可備份的 NPC", "warning");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(library, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `fu_npc_library_backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`✅ 已成功備份包含 ${library.length} 個 NPC 的全庫檔案！`, "success");
  };

  // --- Task 3.3: Reverse Card Inspector Click Handler ---
  const handleInspectorClick = (skillId, subTabHint = 'skills') => {
    if (!skillId) return;
    if (activeMainTab !== 'build') {
      setActiveMainTab('build');
    }
    if (subTabHint === 'boss') {
      setCurrentStep(5);
    } else {
      setCurrentStep(4);
      setStep4SubTab(subTabHint);
    }
    setHighlightedSkillId(skillId);
    showToast("📍 已反向定位至該技能配置卡片", "info");

    setTimeout(() => {
      const el = document.getElementById(`skill-card-${skillId}`) || document.getElementById(`boss-skill-${skillId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    setTimeout(() => {
      setHighlightedSkillId(null);
    }, 2500);
  };

  const [newCustomSkill, setNewCustomSkill] = useState({
    name: '',
    desc: '',
    category: 'action',
    isOffensiveSpell: false,
    baseMp: '10',
    targetType: '一個生物',
    maxTargets: '3',
    duration: '瞬發',
    formula: '[INS + WLP]'
  });

  const handleAddCustomSkill = () => {
    if (!newCustomSkill.name.trim() || !newCustomSkill.desc.trim()) {
      showToast('⚠️ 名稱與效果敘述不可為空！', 'error');
      return;
    }

    let finalName = newCustomSkill.name.trim();
    if (newCustomSkill.category === 'spell' && newCustomSkill.isOffensiveSpell && !finalName.includes('⚡')) {
      finalName += ' ⚡';
    }

    let computedTarget = newCustomSkill.targetType;
    if (newCustomSkill.targetType === '至多 X 個生物') {
      computedTarget = `至多 ${newCustomSkill.maxTargets.trim() || '3'} 個生物`;
    }

    let cleanBaseMp = newCustomSkill.baseMp.replace(/×\s*T/gi, '').trim() || '10';
    let computedMp = newCustomSkill.targetType === '至多 X 個生物' ? `${cleanBaseMp} × T` : cleanBaseMp;

    const newSkill = {
      id: `custom_${Date.now()}`,
      category: newCustomSkill.category,
      originalName: finalName,
      originalDesc: newCustomSkill.desc.trim(),
      customName: finalName,
      customDesc: newCustomSkill.desc.trim(),
      isModified: true,
      source: 'custom',
      ...(newCustomSkill.category === 'spell' ? {
        spellData: {
          mp: computedMp,
          baseMp: cleanBaseMp,
          targetType: newCustomSkill.targetType,
          maxTargets: newCustomSkill.maxTargets || '3',
          target: computedTarget,
          duration: newCustomSkill.duration?.trim() || '瞬發',
          isOffensive: newCustomSkill.isOffensiveSpell,
          formula: newCustomSkill.isOffensiveSpell ? (newCustomSkill.formula || '[INS + WLP]') : undefined
        }
      } : {})
    };

    setState(prev => ({ ...prev, skills: [...prev.skills, newSkill] }));
    setNewCustomSkill({
      name: '',
      desc: '',
      category: 'action',
      isOffensiveSpell: false,
      baseMp: '10',
      targetType: '一個生物',
      maxTargets: '3',
      duration: '瞬發',
      formula: '[INS + WLP]'
    });
    showToast(`✨ 成功新增自訂技能：「${finalName}」`, 'success');
  };

  const speciesAffinities = useMemo(() => getSpeciesAffinities(state?.selectedSpeciesId, state?.speciesConfig), [state?.selectedSpeciesId, state?.speciesConfig]);

  const mergedAffinities = useMemo(() => {
    if (!state) return getInitialAffinities();
    const affs = { ...state.affinities };
    Object.entries(speciesAffinities).forEach(([type, value]) => {
      affs[type] = value;
    });
    return affs;
  }, [state?.affinities, speciesAffinities]);

  const allLearnedSpells = useMemo(() => {
    if (!state) return [];
    const spells = [];
    // From Species
    if (state.speciesConfig?.spell) spells.push(state.speciesConfig.spell);
    // From Skills (Role, Boss, etc)
    (state.skills || []).forEach(s => {
      if (s.selectedSpells) {
        s.selectedSpells.forEach(sp => {
          const name = typeof sp === 'string' ? sp : sp.name;
          if (name && name !== "最大 MP +10") spells.push(name);
        });
      }
    });
    return [...new Set(spells)];
  }, [state?.speciesConfig?.spell, state?.skills]);

  useEffect(() => {
    if (!window.html2canvas) {
      const script = document.createElement('script'); script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"; document.head.appendChild(script);
    }
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const createNewNPC = () => {
    let initialSkills = ROLES_DATA["暴徒"].defaultSkills.map(s => ({ ...s, id: `${s.id}_${Date.now()}`, libId: s.id, isDefault: true }));
    initialSkills = syncLevelPassives("暴徒", 5, initialSkills);
    const newNpc = {
      id: `npc_${Date.now()}`,
      name: "未知實體", traits: "", story: "", tactics: "", role: "暴徒", level: 5, rank: "士兵", championMultiplier: 1, partyLevel: 5,
      villainTier: "none",
      avatarBase64: null, avatarScale: 1, avatarFit: 'cover', avatarOffsetX: 0, avatarOffsetY: 0, skills: initialSkills,
      selectedSpeciesId: null,
      speciesConfig: { selectedBenefits: [] },
      overrideEnabled: false, overrides: { hp: 0, mp: 0, init: 0, def: 0, mdef: 0 }, affinities: getInitialAffinities(),
      customDice: {},
      isFreeModeEnabled: false
    };
    setState(newNpc);
    const roles = Object.keys(ROLES_DATA);
    setVisualIndex(roles.indexOf("暴徒") + 100 * roles.length);
    setActiveMainTab('build');
    setCurrentStep(1);
  };

  const getReconciledLibrary = (currentState, currentLibrary) => {
    let newLib = [...currentLibrary];
    const idx = newLib.findIndex(n => n.id === currentState.id);
    if (idx >= 0) newLib[idx] = currentState;
    else newLib.unshift(currentState);

    const currentGroup = [currentState.id, ...(currentState.linkedNpcs || [])];

    return newLib.map(npc => {
      if (npc.id === currentState.id) return npc;

      const npcLinks = npc.linkedNpcs || [];
      const wasInGroup = npcLinks.includes(currentState.id);
      const isNowInGroup = currentGroup.includes(npc.id);

      if (isNowInGroup) {
        // Force sync the entire group to this NPC
        return { ...npc, linkedNpcs: currentGroup.filter(id => id !== npc.id) };
      } else if (wasInGroup && !isNowInGroup) {
        // NPC was kicked out of the group by currentState.
        // It loses connections to everyone in the currentGroup.
        return { ...npc, linkedNpcs: npcLinks.filter(id => !currentGroup.includes(id) && id !== currentState.id) };
      }

      // Clean up stray links to currentState if it's no longer in the group
      if (npcLinks.includes(currentState.id)) {
        return { ...npc, linkedNpcs: npcLinks.filter(id => id !== currentState.id) };
      }

      return npc;
    });
  };

  const handleSaveToLibrary = () => {
    if (!state) return;
    setRoleDrafts({});
    setLibrary(prevLib => getReconciledLibrary(state, prevLib));
    showToast(`💾 已成功儲存「${state.name || "未知實體"}」！`, 'success');
  };

  const handleToggleNPCLink = (targetId) => {
    setState(prev => {
      const currentLinks = prev.linkedNpcs || [];
      const isLinked = currentLinks.includes(targetId);

      if (isLinked) {
        return { ...prev, linkedNpcs: currentLinks.filter(id => id !== targetId) };
      } else {
        const targetNpc = library.find(n => n.id === targetId);
        const targetLinks = targetNpc?.linkedNpcs || [];
        const newLinks = Array.from(new Set([...currentLinks, targetId, ...targetLinks]));
        return { ...prev, linkedNpcs: newLinks };
      }
    });
  };

  const handleJumpToNPC = (targetId) => {
    if (!state) return;
    // Auto-save before jumping
    const updatedLibrary = getReconciledLibrary(state, library);
    setLibrary(updatedLibrary);

    const targetNPC = updatedLibrary.find(n => n.id === targetId);
    if (targetNPC) {
      setState(targetNPC);
      showToast(`🔗 已切換至「${targetNPC.name || "未知實體"}」`);
    }
  };

  const processSkillBudgets = () => {
    if (!state) return { processedSkills: [], maxCustomizations: 0, maxRoleSkills: 0, maxBossSkills: 0, maxAllowedBossSkills: 0, hasChampSupport: false, isRoleSlotOccupiedByBoss: false, bonusSkillFromNegative: 0 };
    let processedSkills = state.skills.map(s => ({ ...s, isOverBudget: false }));
    const maxCustomizations = (state.rank === "士兵" || state.rank === "精英") ? 1 : 0;

    let currentCust = 0;
    const hasChampSupport = processedSkills.some(s => s.libId === 'su_skill_5' && !s.isOverBudget);
    processedSkills.filter(s => s.source === 'customization').forEach(s => {
      if (hasChampSupport && (s.libId === 'su_cust_1' || s.libId === 'su_cust_2')) { } else { currentCust++; }
      if (currentCust > maxCustomizations) s.isOverBudget = true;
    });

    let extraRoleSkills = 0;
    processedSkills.forEach(s => { if (s.source === 'customization' && !s.isOverBudget && s.modifiers?.extraRoleSkill) extraRoleSkills += s.modifiers.extraRoleSkill; });

    const baseRoleSkills = (state.level >= 20 ? 1 : 0) + (state.level >= 40 ? 1 : 0) + (state.level >= 60 ? 1 : 0) + (state.rank === "精英" ? 1 : (state.rank === "冠位" ? state.championMultiplier : 0));
    const bonusSkillFromNegative = (state.selectedNegativeSkills || []).length;

    // Calculate Species Bonus Skills
    let bonusSkillsFromSpecies = 0;
    if (state.selectedSpeciesId && state.speciesConfig.selectedBenefits) {
      const bonusIds = {
        sp_beast: 'b5', sp_construct: 'b4', sp_demon: 'b4', sp_element: 'b4',
        sp_humanoid: 'b5', sp_monster: 'b4', sp_plant: 'b6', sp_undead: 'b4'
      };
      const targetId = bonusIds[state.selectedSpeciesId];
      if (targetId) {
        bonusSkillsFromSpecies = state.speciesConfig.selectedBenefits.filter(b => b === targetId).length;
      }
    }

    let availableRoleSkillsBudget = baseRoleSkills + extraRoleSkills + bonusSkillFromNegative + bonusSkillsFromSpecies;

    const baseBossSkills = state.rank === "冠位" ? 1 : 0;
    let currentBossSkills = 0;
    let usedRoleSkillForBoss = 0;
    let bossSubCategories = new Set();
    let hasDuplicateBossSubCategory = false;

    processedSkills.filter(s => s.source === 'bossSkill').forEach(s => {
      // Check subcategory duplication
      const dbSkill = BOSS_SKILLS_DATA.find(db => db.id === s.libId);
      if (dbSkill) {
        if (bossSubCategories.has(dbSkill.subCategory)) hasDuplicateBossSubCategory = true;
        bossSubCategories.add(dbSkill.subCategory);
      }

      currentBossSkills++;
      if (currentBossSkills <= baseBossSkills) {
        // Free Boss Skill slot
      } else {
        // Check if we can use a role skill slot
        if (availableRoleSkillsBudget - usedRoleSkillForBoss > 0) {
          usedRoleSkillForBoss++;
        } else {
          s.isOverBudget = true;
        }
      }
    });

    const isMoreThanTwoBossSkills = currentBossSkills > 2;
    const maxRoleSkills = Math.max(0, availableRoleSkillsBudget - usedRoleSkillForBoss);
    const maxBossSkills = baseBossSkills + usedRoleSkillForBoss;
    const maxAllowedBossSkills = baseBossSkills + availableRoleSkillsBudget;
    const isRoleSlotOccupiedByBoss = usedRoleSkillForBoss > 0;

    // Result will be returned at the end of function

    let currentRole = 0;
    processedSkills.filter(s => s.source === 'roleSkill').forEach(s => {
      currentRole++;
      if (currentRole > maxRoleSkills) s.isOverBudget = true;
    });

    let changed = true;
    while (changed) {
      changed = false;
      processedSkills.forEach(s => {
        if (!s.isOverBudget && s.libId) {
          let dbSkill = ROLES_DATA[state.role].availableSkills.find(db => db.id === s.libId);
          if (!dbSkill) dbSkill = BOSS_SKILLS_DATA.find(db => db.id === s.libId);

          if (dbSkill?.requires) {
            const hasValidReq = dbSkill.requires.every(reqId => processedSkills.some(ps => ps.libId === reqId && !ps.isOverBudget));
            if (!hasValidReq) { s.isOverBudget = true; changed = true; }
          }
          if (dbSkill?.reqRank && !dbSkill.reqRank.includes(state.rank)) { s.isOverBudget = true; changed = true; }
          if (dbSkill?.reqLevel && state.level < dbSkill.reqLevel) { s.isOverBudget = true; changed = true; }
        }
      });
    }

    const secretSkill = processedSkills.find(s => s.libId === 's_skill_7');
    if (secretSkill && !secretSkill.isOverBudget) {
      let availableTargets = [];
      processedSkills.forEach(s => {
        if (!s.isOverBudget) {
          if (s.source !== 'levelPassive' && (s.isDefault || s.category === 'attack')) { if (s.customName || s.originalName) availableTargets.push(s.customName || s.originalName); }
          if (s.spellConfig && s.selectedSpells) {
            s.selectedSpells.slice(0, s.spellConfig.capacity).forEach(sp => {
              const spName = typeof sp === 'string' ? sp : sp.name;
              if (spName !== "最大 MP +10") availableTargets.push(spName);
            });
          }
        }
      });
      availableTargets = [...new Set(availableTargets)].filter(Boolean);
      secretSkill.selectionsConfig = [{ key: "secretArtTarget", label: "▶ 指定祕技目標", options: availableTargets, isLinked: true }];
    }
    if (state.isFreeModeEnabled) {
      processedSkills.forEach(s => {
        s.isOverBudget = false;
      });
    }

    return { processedSkills, maxCustomizations, maxRoleSkills, maxBossSkills, maxAllowedBossSkills, hasChampSupport, isRoleSlotOccupiedByBoss, bonusSkillFromNegative, isMoreThanTwoBossSkills, hasDuplicateBossSubCategory, usedRoleSkillForBoss };
  };

  const { processedSkills, maxCustomizations, maxRoleSkills, maxBossSkills, maxAllowedBossSkills, hasChampSupport, isRoleSlotOccupiedByBoss, bonusSkillFromNegative, isMoreThanTwoBossSkills, hasDuplicateBossSubCategory, usedRoleSkillForBoss } = processSkillBudgets();
  const validSkills = processedSkills.filter(s => !s.isOverBudget);

  const affinityBudgets = state ? (ROLES_DATA[state.role]?.getAffinityBudgets ? ROLES_DATA[state.role].getAffinityBudgets(state.level, validSkills) : { vul: 1, res: 0, imm: 0, abs: 0 }) : { vul: 1, res: 0, imm: 0, abs: 0 };
  const currentAffinities = { vul: 0, res: 0, imm: 0, abs: 0 };
  if (state) {
    DAMAGE_TYPES.forEach(t => {
      const aff = state.affinities[t];
      // Count all manual player selections, even if they are currently locked/overridden by species benefits
      if (aff && aff !== 'normal') currentAffinities[aff]++;
    });
  }

  const handleAffinityClick = (type) => {
    if (!activeAffinityTab || speciesAffinities[type]) return;
    const currentState = state.affinities[type] || 'normal';
    if (currentState === activeAffinityTab) { setState(prev => ({ ...prev, affinities: { ...prev.affinities, [type]: 'normal' } })); return; }
    if (!state.isFreeModeEnabled && currentAffinities[activeAffinityTab] >= affinityBudgets[activeAffinityTab]) return;
    setState(prev => ({ ...prev, affinities: { ...prev.affinities, [type]: activeAffinityTab } }));
  };

  const handleNegativeSkillToggle = (skillId) => {
    setState(prev => {
      const selected = prev.selectedNegativeSkills || [];
      const isSelected = selected.some(s => s.id === skillId);
      let newSelected;
      if (isSelected) {
        newSelected = selected.filter(s => s.id !== skillId);
      } else {
        const skillData = NEGATIVE_SKILLS_DATA.find(s => s.id === skillId);
        if (!skillData) return prev;
        newSelected = [...selected, { id: skillId, selections: {} }];
      }
      return { ...prev, selectedNegativeSkills: newSelected };
    });
  };

  const handleNegativeSkillSelectionChange = (skillId, key, value) => {
    setState(prev => {
      const newSelected = (prev.selectedNegativeSkills || []).map(s =>
        s.id === skillId ? { ...s, selections: { ...s.selections, [key]: value } } : s
      );
      return { ...prev, selectedNegativeSkills: newSelected };
    });
  };

  const handleNegativeSkillUpdate = (skillId, updates) => {
    setState(prev => {
      const newSelected = (prev.selectedNegativeSkills || []).map(s =>
        s.id === skillId ? { ...s, ...updates } : s
      );
      return { ...prev, selectedNegativeSkills: newSelected };
    });
  };

  const handleSpeciesChange = (speciesId) => {
    setState(prev => ({
      ...prev,
      selectedSpeciesId: speciesId,
      speciesConfig: { selectedBenefits: [] },
      affinities: getInitialAffinities()
    }));
  };

  const handleSpeciesConfigChange = (key, value) => {
    setState(prev => ({
      ...prev,
      speciesConfig: { ...prev.speciesConfig, [key]: value }
    }));
  };

  const handleSpeciesSpellSelectionChange = (spellName, key, value) => {
    setState(prev => ({
      ...prev,
      speciesConfig: {
        ...prev.speciesConfig,
        spellSelections: {
          ...(prev.speciesConfig.spellSelections || {}),
          [spellName]: {
            ...((prev.speciesConfig.spellSelections && prev.speciesConfig.spellSelections[spellName]) || {}),
            [key]: value
          }
        }
      }
    }));
  };

  const handleSpeciesConfigMultiToggle = (key, value, maxPicks) => {
    setState(prev => {
      const current = prev.speciesConfig[key] || [];
      const isSelected = current.includes(value);
      let next;
      if (isSelected) {
        next = current.filter(item => item !== value);
      } else {
        if (maxPicks && current.length >= maxPicks) {
          next = [...current.slice(1), value];
        } else {
          next = [...current, value];
        }
      }
      return {
        ...prev,
        speciesConfig: { ...prev.speciesConfig, [key]: next }
      };
    });
  };

  const handleBenefitToggle = (benefitId, maxAllowed, isMulti = false) => {
    setState(prev => {
      const selected = prev.speciesConfig?.selectedBenefits || [];
      const currentCount = selected.filter(b => b === benefitId).length;
      let newSelected = [...selected];

      if (isMulti) {
        // Counter logic: 0 -> 1 -> 2 -> 0
        if (currentCount === 0) {
          if (selected.length < maxAllowed) newSelected.push(benefitId);
        } else if (currentCount === 1) {
          if (selected.length < maxAllowed) newSelected.push(benefitId);
          else newSelected = newSelected.filter(b => b !== benefitId);
        } else {
          newSelected = newSelected.filter(b => b !== benefitId);
        }
      } else {
        const isSelected = selected.includes(benefitId);
        if (isSelected) {
          newSelected = selected.filter(b => b !== benefitId);
        } else if (selected.length < maxAllowed) {
          newSelected.push(benefitId);
        }
      }

      // Auto-clear configuration if a benefit that needs selection is removed
      const newSpeciesConfig = { ...prev.speciesConfig, selectedBenefits: newSelected };
      const sp = SPECIES_DATA.find(s => s.id === prev.selectedSpeciesId);
      const isStillIn = newSelected.includes(benefitId);
      if (!isStillIn) {
        const opt = sp.benefitsConfig.options.find(o => o.id === benefitId);
        if (opt?.needsSelection && opt?.selectionConfig?.key) {
          delete newSpeciesConfig[opt.selectionConfig.key];
        }
      }

      return {
        ...prev,
        speciesConfig: newSpeciesConfig
      };
    });
  };

  const calculateStats = () => {
    if (!state) return {};
    const roleData = ROLES_DATA[state.role];
    const lvlData = roleData.levels[state.level];

    const defaultDEX = lvlData.dex || roleData.base.DEX;
    const defaultINS = lvlData.ins || roleData.base.INS;
    const defaultMIG = lvlData.mig || roleData.base.MIG;
    const defaultWLP = lvlData.wlp || roleData.base.WLP;

    const customDice = state.customDice || {};
    const isFree = state.isFreeModeEnabled;

    const finalDEX = (isFree && customDice.DEX) ? customDice.DEX : defaultDEX;
    const finalINS = (isFree && customDice.INS) ? customDice.INS : defaultINS;
    const finalMIG = (isFree && customDice.MIG) ? customDice.MIG : defaultMIG;
    const finalWLP = (isFree && customDice.WLP) ? customDice.WLP : defaultWLP;

    const parseDice = d => parseInt(String(d).replace('d', ''), 10) || 8;
    const defMIGVal = parseDice(defaultMIG);
    const effMIGVal = parseDice(finalMIG);
    const defWLPVal = parseDice(defaultWLP);
    const effWLPVal = parseDice(finalWLP);
    const effDEXVal = parseDice(finalDEX);
    const effINSVal = parseDice(finalINS);

    // HP & MP base formula adjustments based on MIG and WLP dice sizes (5 HP/MP per die size step)
    let baseHP = lvlData.hp + (effMIGVal - defMIGVal) * 5;
    let baseMP = lvlData.mp + (effWLPVal - defWLPVal) * 5;

    let stats = {
      DEX: finalDEX,
      INS: finalINS,
      MIG: finalMIG,
      WLP: finalWLP,
      HP: baseHP,
      MP: baseMP,
      Init: roleData.base.initBase,
      Def: effDEXVal + roleData.base.def,
      MDef: effINSVal + roleData.base.mdef,
      Acc: lvlData.acc,
      Dmg: lvlData.dmg,
      MagicAccModifier: 0,
      statusImmunities: [],
      spellList: []
    };

    if (state.rank === "精英") { stats.HP *= 2; stats.Init += 2; }
    else if (state.rank === "冠位") { stats.HP *= state.championMultiplier; stats.MP *= 2; stats.Init += state.championMultiplier; }

    // --- Species Stat & Status Bonuses ---
    if (state.selectedSpeciesId) {
      const sid = state.selectedSpeciesId;
      const sCfg = state.speciesConfig;
      const sBenefits = sCfg.selectedBenefits || [];

      // Fixed HP Bonuses (Removed for beast/monster as requested)

      // Benefit HP Bonuses
      if (sid === 'sp_beast' && sBenefits.includes('b1')) stats.HP += 10;
      if (sid === 'sp_monster' && sBenefits.includes('b5')) stats.HP += 10;
      if (sid === 'sp_plant' && sBenefits.includes('b1')) stats.HP += 10;

      // Benefit MP Bonuses (b1 for beast, b2/b3 for others)
      const mpBenefitIds = {
        sp_beast: ['b2'], sp_demon: ['b2'], sp_element: ['b2'],
        sp_humanoid: ['b2'], sp_monster: ['b2'], sp_plant: ['b3'], sp_undead: ['b2']
      };
      if (mpBenefitIds[sid]?.some(id => sBenefits.includes(id))) stats.MP += 10;

      // Fixed Status Immunities
      if (sid === 'sp_plant') stats.statusImmunities.push('眩暈', '動搖', '憤怒');
      if (['sp_construct', 'sp_element', 'sp_undead'].includes(sid)) stats.statusImmunities.push('中毒');

      // Selectable Status Immunities
      if (sid === 'sp_construct' && sBenefits.includes('b1')) {
        const chosen = sCfg.sp_construct_imm_status || [];
        chosen.forEach(s => { if (s && !stats.statusImmunities.includes(s)) stats.statusImmunities.push(s); });
      }

      // Benefit Spells
      if (sCfg.spell) {
        if (!stats.spellList.some(s => s.name === sCfg.spell)) {
          const sel = sCfg.spellSelections?.[sCfg.spell] || (sCfg.spellSelections?.customName !== undefined || sCfg.spellSelections?.customDesc !== undefined ? sCfg.spellSelections : {});
          stats.spellList.push({ name: sCfg.spell, selections: sel });
        }
      }
    }

    validSkills.forEach(skill => {
      if (skill.source === 'levelPassive') {
        if (skill.libId === "sab_p10" && skill.selections) { if (skill.selections.bonus === "命中檢定") stats.Acc += 3; if (skill.selections.bonus === "施法檢定") stats.MagicAccModifier += 3; }
        if (skill.libId === "hun_p10") stats.Acc += 3;
      }
      if (skill.modifiers) {
        if (skill.modifiers.hp) stats.HP += skill.modifiers.hp; if (skill.modifiers.mp) stats.MP += skill.modifiers.mp;
        if (skill.modifiers.def) stats.Def += skill.modifiers.def; if (skill.modifiers.mdef) stats.MDef += skill.modifiers.mdef;
        if (skill.modifiers.init) stats.Init += skill.modifiers.init; if (skill.modifiers.magicAcc) stats.MagicAccModifier += skill.modifiers.magicAcc;
      }
      if (skill.selectionsConfig && skill.selections) {
        skill.selectionsConfig.forEach(cfg => {
          const val = skill.selections[cfg.key]; if (!val) return;
          if (cfg.key.startsWith('imm')) { if (!stats.statusImmunities.includes(val) && val !== "無") stats.statusImmunities.push(val); }
        });
      }
      if (skill.spellConfig && skill.selectedSpells) {
        const safeSpells = skill.selectedSpells.slice(0, skill.spellConfig.capacity);
        safeSpells.forEach(sp => {
          const spellName = typeof sp === 'string' ? sp : sp.name;
          if (spellName === "最大 MP +10") stats.MP += 10;
          else if (!stats.spellList.some(s => s.name === spellName)) stats.spellList.push(typeof sp === 'string' ? { name: sp, selections: {} } : sp);
        });
      }
      if (skill.libId === 'bs_dest_4') {
        if (!stats.spellList.some(s => s.name === "毀盪")) stats.spellList.push({ name: "毀盪", selections: {} });
      }
    });

    if (state.overrideEnabled) {
      if (state.overrides.hp) stats.HP = state.overrides.hp; if (state.overrides.mp) stats.MP = state.overrides.mp;
      if (state.overrides.init) stats.Init = state.overrides.init; if (state.overrides.def) stats.Def = state.overrides.def; if (state.overrides.mdef) stats.MDef = state.overrides.mdef;
    }
    return stats;
  };

  const finalStats = calculateStats();

  const validSkillsClone = JSON.parse(JSON.stringify(validSkills));
  const integratedSkills = state && ROLES_DATA[state.role]?.onSkillIntegrate ? ROLES_DATA[state.role].onSkillIntegrate(validSkillsClone) : validSkillsClone;

  let usedRoleSkills = 0;
  if (state) state.skills.forEach(s => { if (s.source === 'roleSkill') usedRoleSkills++; });
  let usedCustomizations = 0;
  if (state) state.skills.forEach(s => { if (s.source === 'customization') { if (hasChampSupport && (s.libId === 'su_cust_1' || s.libId === 'su_cust_2')) return; usedCustomizations++; } });
  let usedBossSkills = 0;
  if (state) state.skills.forEach(s => { if (s.source === 'bossSkill') usedBossSkills++; });

  const groupedSkills = {
    attack: integratedSkills.filter(s => s.category === 'attack' && !s.hideInPreview),
    spell: integratedSkills.filter(s => s.category === 'spell' && !s.hideInPreview),
    action: integratedSkills.filter(s => s.category === 'action' && !s.hideInPreview),
    rule: [
      ...integratedSkills.filter(s => {
        if (s.category !== 'rule' && s.category !== 'boss' && s.category !== undefined) return false;
        if (s.hideInPreview) return false;
        return true;
      }),
      // Inject negative skills as rules
      ...(state?.selectedNegativeSkills || []).map(neg => {
        const skillData = NEGATIVE_SKILLS_DATA.find(s => s.id === neg.id);
        if (!skillData) return null;
        return { ...skillData, ...neg, category: 'rule', source: 'negative' };
      }).filter(Boolean),
      // Inject species special rules
      ...(state && state.selectedSpeciesId && state.speciesConfig.selectedBenefits ?
        (() => {
          const sp = SPECIES_DATA.find(s => s.id === state.selectedSpeciesId);
          if (!sp) return [];
          const rules = [];

          // 1. Scan Fixed Description for Mechanical Rules
          if (sp.fixedDesc.includes('受到恢復 HP 效果的傷害')) {
            rules.push({
              id: 'species_fixed_undead',
              originalName: "不死生物",
              originalDesc: "不死生物會受到恢復 HP 效果的傷害。",
              category: 'rule',
              source: 'species'
            });
          }

          // 2. Scan Benefits for Mechanical Rules
          sp.benefitsConfig.options
            .filter(o => state.speciesConfig.selectedBenefits.includes(o.id))
            .filter(o => o.text.includes('飛行技能') || o.text.includes('身體能力') || o.text.includes('獨特設計') || o.text.includes('sp_humanoid_bg') || o.text.includes('【荊棘】'))
            .forEach(o => {
              let name = "特殊規則";
              if (o.text.includes('飛行技能')) name = "飛行";
              else if (o.text.includes('身體能力') || o.text.includes('獨特設計')) name = "身體能力";
              else if (o.text.includes('sp_humanoid_bg')) name = "背景與訓練";
              else if (o.text.includes('【荊棘】')) name = "荊棘";

              let finalDesc = o.text;
              if (name === "飛行") finalDesc = o.text.replace(/^飛行技能。\s*/, '');
              else if (name === "荊棘") finalDesc = o.text.replace(/^添加特殊規則【荊棘】：\s*/, '');

              rules.push({
                id: `species_${o.id}`,
                originalName: name,
                originalDesc: finalDesc,
                selections: state.speciesConfig,
                category: 'rule',
                source: 'species'
              });
            });

          return rules;
        })() : [])
    ]
  };

  const globalUniqueSpells = new Set();
  validSkills.forEach(skill => {
    if (skill.spellConfig && skill.selectedSpells) {
      skill.selectedSpells.slice(0, skill.spellConfig.capacity).forEach(sp => {
        const spellName = typeof sp === 'string' ? sp : sp.name;
        if (spellName !== "最大 MP +10") globalUniqueSpells.add(spellName);
      });
    }
  });

  const secretArtSkill = validSkills.find(s => s.libId === 's_skill_7' || s.id === 's_skill_7');
  const secretArtTarget = secretArtSkill?.selections?.secretArtTarget;

  if (secretArtTarget) {
    integratedSkills.forEach(skill => {
      const skillName = skill.customName || skill.originalName;
      const cleanName = skillName ? skillName.replace(/^(技能|能力)：/, '').replace(/\(定位技能\)/, '').trim() : '';
      if (secretArtTarget === skillName || secretArtTarget === cleanName || secretArtTarget === skill.originalName || secretArtTarget === skill.customName) {
        skill.isSecretArt = true;
      }
    });
  }

  const isBasicCore = s => s.source !== 'levelPassive' && (s.isDefault || s.category === 'attack');
  const basicCoreSkillsForCount = validSkills.filter(s => isBasicCore(s) && !s.spellConfig && !s.id.startsWith('custom_'));
  let basicCoreMax = 0; let basicCoreCurrent = 0;
  basicCoreSkillsForCount.forEach(skill => {
    if (skill.selectionsConfig) {
      const visibleConfigs = skill.selectionsConfig.filter(cfg => !cfg.showIfKey || (skill.selections?.[cfg.showIfKey] || "").includes(cfg.showIfValue));
      basicCoreMax += visibleConfigs.length;
      visibleConfigs.forEach(cfg => { if (skill.selections && skill.selections[cfg.key] && skill.selections[cfg.key] !== "") basicCoreCurrent += 1; });
    }
  });

  const basicAttacksToRender = integratedSkills.filter(s => isBasicCore(s) && !s.spellConfig && !s.id.startsWith('custom_'));
  const allSpellbooksToRender = integratedSkills.filter(s => !!s.spellConfig);
  const levelPassivesToRender = integratedSkills.filter(s => s.source === 'levelPassive');

  const hasOffensiveSpells = (() => {
    if (!state) return false;
    const hasListSpell = finalStats.spellList?.some(s => s.name?.includes('⚡'));
    const hasSpellbookOption = allSpellbooksToRender?.some(s => s.spellConfig?.options?.some(opt => opt.includes('⚡')));
    const hasCustomOffensiveSpell = state.skills?.some(s => s.category === 'spell' && (s.customName || s.originalName || '').includes('⚡'));
    return hasListSpell || hasSpellbookOption || hasCustomOffensiveSpell;
  })();

  const unlockedPassives = state ? state.skills.filter(s => s.source === 'levelPassive') : [];
  const systemMilestones = state && ROLES_DATA[state.role]?.getSystemMilestones ? ROLES_DATA[state.role].getSystemMilestones(state.level) : [];
  const displayMilestones = [...unlockedPassives, ...systemMilestones].sort((a, b) => (a.unlockLevel || 0) - (b.unlockLevel || 0));

  // --- Handlers ---
  const handleRoleChange = (eOrString) => {
    const newRole = typeof eOrString === 'string' ? eOrString : eOrString.target.value;
    setState(prev => {
      if (prev.role === newRole) return prev;

      const prevRole = prev.role;
      const prevRoleData = ROLES_DATA[prevRole];

      // 定義哪些技能屬於「前一個定位專屬」
      const isRoleSpecific = (s) => {
        if (s.source === 'levelPassive') return true;
        if (!prevRoleData) return false;
        const isDefault = prevRoleData.defaultSkills.some(ds => ds.id === s.libId);
        const isAvailable = prevRoleData.availableSkills.some(as => as.id === s.libId);
        return isDefault || isAvailable;
      };

      // 提取當前定位專屬技能
      const roleSpecificSkills = prev.skills.filter(isRoleSpecific);
      // 提取非定位的共用技能 (Boss 技能, 自訂技能等)
      const genericSkills = prev.skills.filter(s => !isRoleSpecific(s));

      // 儲存當前草稿
      setRoleDrafts(drafts => ({ ...drafts, [prevRole]: roleSpecificSkills }));

      // 載入新草稿或重置
      let newRoleSkills = [];
      if (roleDrafts[newRole]) {
        newRoleSkills = roleDrafts[newRole];
      } else {
        newRoleSkills = ROLES_DATA[newRole].defaultSkills.map(s => ({ ...s, id: `${s.id}_${Date.now()}`, libId: s.id, isDefault: true }));
      }

      let newSkills = syncLevelPassives(newRole, prev.level, [...genericSkills, ...newRoleSkills]);
      return { ...prev, role: newRole, skills: newSkills };
    });
  };
  const handleLevelChange = (e) => { const newLevel = Number(e.target.value); setState(prev => ({ ...prev, level: newLevel, skills: syncLevelPassives(prev.role, newLevel, prev.skills) })); };

  const handleRankChange = (eOrString) => {
    const newRank = typeof eOrString === 'string' ? eOrString : eOrString.target.value;
    setState(prev => ({
      ...prev,
      rank: newRank,
      // 如果切換到非冠位，重置倍率為 1
      championMultiplier: newRank === "冠位" ? prev.championMultiplier : 1
    }));
  };

  const handleMultiplierChange = (val) => {
    setState(prev => ({ ...prev, championMultiplier: val }));
  };

  const updateSkill = (id, changes) => { setState(prev => ({ ...prev, skills: prev.skills.map(s => s.id === id ? { ...s, ...changes } : s) })); };

  const deleteSkill = (id) => {
    setState(prev => {
      const skillToDelete = prev.skills.find(s => s.id === id); if (!skillToDelete) return prev;

      let dbEntry = ROLES_DATA[state.role].availableSkills.find(db => db.id === skillToDelete.libId);
      if (!dbEntry) dbEntry = BOSS_SKILLS_DATA.find(db => db.id === skillToDelete.libId);

      const dependents = prev.skills.filter(s => {
        let depEntry = ROLES_DATA[state.role].availableSkills.find(db => db.id === s.libId);
        if (!depEntry) depEntry = BOSS_SKILLS_DATA.find(db => db.id === s.libId);
        return depEntry?.requires?.includes(skillToDelete.libId);
      });
      const dependentIds = dependents.map(d => d.id);
      return { ...prev, skills: prev.skills.filter(s => s.id !== id && !dependentIds.includes(s.id)) };
    });
  };
  const updateSelection = (id, key, value) => {
    setState(prev => {
      const updatedSkills = prev.skills.map(s => {
        if (s.id !== id) return s;
        let newSelections = { ...(s.selections || {}), [key]: value };
        if (s.libId === 'bs_obj_1' && key === 'failure_status') {
          if (newSelections.repeat_penalty && newSelections.repeat_penalty.includes(value)) {
            newSelections.repeat_penalty = '失去 [消耗戰HP] 點 HP';
          }
        }
        if (s.libId === 'bs_surv_1') {
          if (key === 'adaptive_30_abs' && value === true) {
            newSelections.adaptive_30_imm = false;
          } else if (key === 'adaptive_30_imm' && value === true) {
            newSelections.adaptive_30_abs = false;
          }
        }
        return { ...s, selections: newSelections };
      });
      return { ...prev, skills: updatedSkills };
    });
  };
  const addEmptySkill = () => { setState(prev => ({ ...prev, skills: [...prev.skills, { id: `custom_${Date.now()}`, category: "rule", originalName: "自訂技能", originalDesc: "請輸入效果敘述...", customName: "自訂技能", customDesc: "請輸入效果敘述...", isModified: true, source: 'custom' }] })); };

  const toggleLibrarySkill = (libSkill) => {
    const isAdded = state.skills.some(s => s.libId === libSkill.id);
    if (isAdded) {
      setState(prev => {
        const dependents = prev.skills.filter(s => {
          let dbEntry = ROLES_DATA[state.role].availableSkills.find(db => db.id === s.libId);
          if (!dbEntry) dbEntry = BOSS_SKILLS_DATA.find(db => db.id === s.libId);
          return dbEntry?.requires?.includes(libSkill.id);
        });
        const dependentIds = dependents.map(d => d.id);
        return { ...prev, skills: prev.skills.filter(s => s.libId !== libSkill.id && !dependentIds.includes(s.id)) };
      });
    } else {
      if (!state.isFreeModeEnabled) {
        if (libSkill.reqLevel && state.level < libSkill.reqLevel) return;
        if (libSkill.reqRank && Array.isArray(libSkill.reqRank) && !libSkill.reqRank.includes(state.rank)) return;
        if (libSkill.requires && !libSkill.requires.every(req => validSkills.some(s => s.libId === req))) return;
      }
      setState(prev => ({ ...prev, skills: [...prev.skills, { ...libSkill, id: `skill_${Date.now()}`, libId: libSkill.id, selectedSpells: [] }] }));
    }
  };

  const toggleSpell = (skillId, spellName, capacity) => {
    setState(prev => ({
      ...prev,
      skills: prev.skills.map(s => {
        if (s.id !== skillId) return s;
        // Check if spell is already claimed by species
        if (prev.speciesConfig?.spell === spellName) return s;

        const currentSpells = s.selectedSpells || []; const isSelected = currentSpells.some(sp => (typeof sp === 'string' ? sp : sp.name) === spellName);
        if (isSelected) return { ...s, selectedSpells: currentSpells.filter(sp => (typeof sp === 'string' ? sp : sp.name) !== spellName) };
        else { if (currentSpells.length >= capacity) return s; return { ...s, selectedSpells: [...currentSpells, { name: spellName, selections: {} }] }; }
      })
    }));
  };
  const updateSpellSelection = (skillId, spellName, key, value) => {
    setState(prev => ({
      ...prev,
      skills: prev.skills.map(s => {
        if (s.id !== skillId) return s;
        return {
          ...s, selectedSpells: (s.selectedSpells || []).map(sp => {
            const name = typeof sp === 'string' ? sp : sp.name;
            if (name !== spellName) return sp;
            const currentSelections = typeof sp === 'string' ? {} : (sp.selections || {});
            return { name, selections: { ...currentSelections, [key]: value } };
          })
        };
      })
    }));
  };

  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast("❌ 請選擇正確的圖片檔案 (JPG, PNG, GIF, WebP)", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target.result;
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1200;
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          } else {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setCropImageSource(compressedDataUrl);
          setPendingRawSource(compressedDataUrl);
        } else {
          setCropImageSource(rawDataUrl);
          setPendingRawSource(rawDataUrl);
        }
        setIsCropModalOpen(true);
      };
      img.onerror = () => {
        setCropImageSource(rawDataUrl);
        setPendingRawSource(rawDataUrl);
        setIsCropModalOpen(true);
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      showToast("❌ 讀取檔案失敗", "error");
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
    e.target.value = '';
  };

  const handleLoadImageUrl = (urlToLoad) => {
    const url = (urlToLoad || imageUrlInput || '').trim();
    if (!url) {
      showToast("⚠️ 請輸入有效的圖片網址", "warning");
      return;
    }
    setIsUrlLoading(true);
    showToast("⏳ 正在讀取網路圖片...", "info");

    if (url.startsWith('data:image/')) {
      setCropImageSource(url);
      setPendingRawSource(url);
      setImageUrlInput('');
      setIsUrlLoading(false);
      setIsCropModalOpen(true);
      return;
    }

    const tryLoadImage = (targetUrl, isProxy = false) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const MAX_DIM = 1200;
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          if (w > MAX_DIM || h > MAX_DIM) {
            if (w > h) {
              h = Math.round((h * MAX_DIM) / w);
              w = MAX_DIM;
            } else {
              w = Math.round((w * MAX_DIM) / h);
              h = MAX_DIM;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setCropImageSource(dataUrl);
          setPendingRawSource(dataUrl);
        } catch (canvasErr) {
          setCropImageSource(targetUrl);
          setPendingRawSource(targetUrl);
        }
        setImageUrlInput('');
        setIsUrlLoading(false);
        setIsCropModalOpen(true);
      };

      img.onerror = () => {
        if (!isProxy && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
          // Retry using CORS proxy fallback
          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
          tryLoadImage(proxyUrl, true);
        } else {
          setIsUrlLoading(false);
          showToast("❌ 無法載入該網址的圖片，請確認連結正確或下載後拖曳上傳", "error");
        }
      };

      img.src = targetUrl;
    };

    tryLoadImage(url, false);
  };

  const handleReCrop = () => {
    const src = state?.avatarRawBase64 || state?.avatarBase64;
    if (!src) return;
    setCropImageSource(src);
    setPendingRawSource(src);
    setIsCropModalOpen(true);
  };

  const handleConfirmCrop = (croppedDataUrl) => {
    setState(p => ({
      ...p,
      avatarBase64: croppedDataUrl,
      avatarRawBase64: pendingRawSource || p.avatarRawBase64 || croppedDataUrl
    }));
    setIsCropModalOpen(false);
    showToast("🖼️ 頭像裁切與調整完成！");
  };

  const handleAvatarDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    avatarDragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };

  const handleAvatarDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleAvatarDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    avatarDragCounter.current--;
    if (avatarDragCounter.current <= 0) {
      avatarDragCounter.current = 0;
      setIsDraggingOver(false);
    }
  };

  const handleAvatarDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    avatarDragCounter.current = 0;
    setIsDraggingOver(false);

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        processImageFile(file);
      } else {
        showToast("❌ 請拖曳圖片檔案 (JPG, PNG, GIF, WebP)", "error");
      }
      return;
    }

    const draggedUrl = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (draggedUrl && (draggedUrl.startsWith('http://') || draggedUrl.startsWith('https://') || draggedUrl.startsWith('data:image/'))) {
      handleLoadImageUrl(draggedUrl);
    }
  };


  const handleExportJPG = async () => {
    if (!sheetRef.current) return;

    setRoleDrafts({});
    showToast("🖼️ 正在處理並匯出高畫質 JPG，請稍候...");

    try {
      // 確保字體完全加載
      if (document.fonts) {
        await document.fonts.ready;
      }

      const dataUrl = await htmlToImage.toJpeg(sheetRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: currentTheme.exportBg || '#fbf7ee',
        filter: (node) => {
          if (node?.classList?.contains('hide-on-export')) {
            return false;
          }
          return true;
        },
        style: {
          textRendering: 'geometricPrecision',
          fontSmooth: 'always',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }
      });

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${state.name || 'NPC'}_Card.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast("✅ 角色卡已成功匯出！", "success");
    } catch (error) {
      console.error('Export failed:', error);
      showToast("❌ 匯出失敗，請重試或更換瀏覽器。", "error");
    }
  };

  const handleCopyJPG = async () => {
    if (!sheetRef.current) return;

    setRoleDrafts({});
    showToast("📋 正在處理圖片並複製到剪貼簿，請稍候...");

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }

      // 剪貼簿 API 在多數瀏覽器中僅支援寫入 image/png
      const blob = await htmlToImage.toBlob(sheetRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: currentTheme.exportBg || '#fbf7ee',
        filter: (node) => {
          if (node?.classList?.contains('hide-on-export')) {
            return false;
          }
          return true;
        },
        style: {
          textRendering: 'geometricPrecision',
          fontSmooth: 'always',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }
      });

      if (!blob) throw new Error("無法生成圖片資料");

      const item = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);

      showToast("✅ 圖片已成功複製到剪貼簿！", "success");
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      showToast("❌ 複製失敗，您的瀏覽器可能不支援直接複製圖片，請嘗試匯出。", "error");
    }
  };

  const handleExportJSON = () => {
    setRoleDrafts({});
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${state.name || 'npc'}_fabula_ultima.json`;
    a.click();
    showToast(`📁 成功匯出「${state.name || 'NPC'}」的存檔資料！`);
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let loadedState = JSON.parse(event.target.result);
        loadedState = migrateNpcState(loadedState);
        setState(loadedState);
        setActiveMainTab('build');
        showToast(`✅ 成功讀取「${loadedState.name || 'NPC'}」的檔案！`);
      } catch (err) {
        showToast("❌ 無效的 JSON 檔案！請確認格式是否正確。", 'error');
      }
    };
    reader.readAsText(file);
  };

  const nextStep = () => setCurrentStep(p => Math.min(p + 1, 8));
  const prevStep = () => setCurrentStep(p => Math.max(p - 1, 1));

  const steps = [
    { num: 1, title: "定位", icon: <UserSquare2 size={18} /> }, { num: 2, title: "等級", icon: <Copy size={18} /> }, { num: 3, title: "物種", icon: <ImageIcon size={18} /> },
    { num: 4, title: "能力", icon: <Sword size={18} /> }, { num: 5, title: "Boss", icon: <Crown size={18} /> }, { num: 6, title: "負面", icon: <Trash2 size={18} /> },
    { num: 7, title: "特質", icon: <FileText size={18} /> }, { num: 8, title: "戰術", icon: <Edit3 size={18} /> }
  ];

  const renderCharacterCard = () => {
    if (!state) return null;
    const validNpcName = state.name && state.name.trim() !== "" && state.name !== "未知實體" ? state.name.trim() : null;
    const validLinks = (state.linkedNpcs || []).map(id => library.find(n => n.id === id)).filter(Boolean);

    const isRevealed = (category) => {
      if (revealLevel === 'full') return true;
      const lv = parseInt(revealLevel);
      if (category === 'basic') return true; // Level, Species, HP, MP
      if (category === 'stats' && lv >= 10) return true; // Attributes, Def, MDef, Affinities, Traits
      if (category === 'combat' && lv >= 13) return true; // Attacks, Spells
      return false;
    };

    return (
      <div className="w-full max-w-4xl flex flex-col gap-2">
        {validLinks.length > 0 && (
          <div className="bg-[#f4ebd9] border border-[#d6c7ab] p-2.5 flex flex-wrap gap-2 items-center justify-center relative overflow-hidden rounded shadow-sm text-[#2c221e]">
            <span className="text-xs text-[#8b4513] font-bold mr-2 tracking-wider flex items-center z-10"><Link size={14} className="mr-1" />關聯實體快速跳轉：</span>
            {validLinks.map(link => (
              <button key={link.id} onClick={() => handleJumpToNPC(link.id)} className="bg-[#fffdf9] hover:bg-amber-50 text-[#8b4513] text-[11px] font-bold px-3 py-1 rounded-full border border-[#d6c7ab] hover:border-amber-600 transition-all shadow-sm flex items-center z-10">
                {link.name || "未知"}
              </button>
            ))}
          </div>
        )}
        <div ref={sheetRef} className="border-[6px] border-double p-1 w-full shadow-[6px_6px_20px_rgba(44,34,30,0.12)] transition-colors duration-300" style={{ backgroundColor: currentTheme.sheetBg, borderColor: currentTheme.accentDark, color: currentTheme.textDark, fontFamily: "system-ui, -apple-system, sans-serif" }}>
          <div className="border p-4 md:p-8 relative transition-colors duration-300" style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}>
            <div className="flex flex-col-reverse sm:flex-row justify-between items-center sm:items-start border-b-4 pb-5 mb-5 gap-4 sm:gap-0" style={{ borderColor: currentTheme.accentDark }}>
              <div className="flex-1 w-full text-center sm:text-left sm:pr-4 flex flex-col items-center sm:items-start">
                <div className="flex flex-wrap items-end justify-center sm:justify-start gap-3 mb-2">
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-widest leading-none drop-shadow-sm text-center sm:text-left" style={{ color: currentTheme.textDark }}>{state.name}</h2>
                  <span className="text-xl font-bold tracking-widest drop-shadow-sm" style={{ color: currentTheme.accent }}>Lv. {state.level}</span>
                  {state.villainTier !== 'none' && (
                    <span className={`sm:ml-auto text-xl font-bold ${VILLAIN_TIERS[state.villainTier].color} ${VILLAIN_TIERS[state.villainTier].bg} px-3 py-1 rounded border ${VILLAIN_TIERS[state.villainTier].border} tracking-wider shadow-inner`}>
                      UP {VILLAIN_TIERS[state.villainTier].up}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                  <div className="text-xs font-bold tracking-widest px-3 py-1 border shadow-inner flex flex-wrap justify-center sm:justify-start items-center gap-1 text-center sm:text-left transition-colors duration-300" style={{ backgroundColor: currentTheme.subpanelBg, borderColor: currentTheme.border, color: currentTheme.textDark }}>
                    {[
                      state.villainTier !== 'none' && revealLevel === 'full' ? `🔥 ${VILLAIN_TIERS[state.villainTier].label}` : null,
                      `Lv ${state.level}`,
                      state.rank === "冠位" ? `${state.rank} (${state.championMultiplier})` : state.rank,
                      SPECIES_DATA.find(s => s.id === state.selectedSpeciesId)?.name
                    ].filter(Boolean).join(' | ')}
                  </div>
                </div>

                {state.traits && isRevealed('stats') && <div className="text-sm font-bold italic mb-2" style={{ color: currentTheme.accentDark }}>特質: <span className="font-normal text-[#2c221e]">{state.traits}</span></div>}
                {state.story && revealLevel === 'full' && <div className="text-xs text-[#574c43] leading-relaxed border-l-2 pl-3 italic mb-2" style={{ borderLeftColor: currentTheme.accent }}>{state.story}</div>}
                {state.tactics && revealLevel === 'full' && <div className="text-xs text-[#1e3a8a] leading-relaxed bg-[#f0f4ff] border border-[#bfdbfe] p-2 rounded mt-2"><span className="font-bold">戰術：</span>{state.tactics}</div>}
              </div>
              <div
                onDragEnter={handleAvatarDragEnter}
                onDragOver={handleAvatarDragOver}
                onDragLeave={handleAvatarDragLeave}
                onDrop={handleAvatarDrop}
                className={`relative w-24 h-24 md:w-32 md:h-32 border-2 bg-[#f5efdf] flex-shrink-0 group overflow-hidden shadow-md select-none block transition-all duration-200 ${
                  isDraggingOver ? 'border-amber-600 ring-2 ring-amber-500/60 scale-105' : 'border-[#a8987e] hover:border-amber-600'
                }`}
                title={state.avatarBase64 ? "NPC 頭像" : "點擊上傳或拖曳圖片至此"}
              >
                {state.avatarBase64 ? (
                  <>
                    <img
                      src={state.avatarBase64}
                      alt="Avatar"
                      draggable={false}
                      className="w-full h-full object-cover pixelated select-none"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <div className="hide-on-export absolute inset-0 bg-[#2c221e]/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1 backdrop-blur-[1px]">
                      <button
                        type="button"
                        onClick={handleReCrop}
                        className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold transition flex items-center gap-1 shadow"
                      >
                        <Crop size={11} /> 調整大小
                      </button>
                      <label className="cursor-pointer px-2 py-1 bg-[#eee6d3] hover:bg-[#e4d9c0] text-[#3c2f21] rounded text-[10px] font-bold transition flex items-center gap-1 border border-[#d6c7ab]">
                        <Upload size={11} /> 更換
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full text-[#8c7b6c] cursor-pointer">
                    <ImageIcon size={32} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            {isRevealed('stats') && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-5">
                {[{ label: 'DEX', val: finalStats.DEX, c: 'text-blue-800' }, { label: 'INS', val: finalStats.INS, c: 'text-emerald-800' }, { label: 'MIG', val: finalStats.MIG, c: 'text-red-800' }, { label: 'WLP', val: finalStats.WLP, c: 'text-purple-800' }].map(s => (
                  <div key={s.label} className="border p-2 md:p-3 text-center shadow-sm rounded-lg transition-colors duration-300" style={{ backgroundColor: currentTheme.subpanelBg, borderColor: currentTheme.border }}><div className="text-xs font-bold tracking-widest" style={{ color: currentTheme.accentDark }}>{s.label}</div><div className={`text-2xl md:text-3xl font-bold ${s.c} drop-shadow-sm`}>{s.val}</div></div>
                ))}
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-4 mb-5 border p-4 justify-between lg:items-center shadow-sm rounded-lg transition-colors duration-300" style={{ backgroundColor: currentTheme.subpanelBg, borderColor: currentTheme.border }}>
              <div className="flex gap-6 justify-center lg:justify-start border-b lg:border-b-0 border-[#e2d6c1] pb-3 lg:pb-0">
                <div className="flex flex-col items-center"><span className="text-xs text-[#7c6a58] font-bold mb-1 tracking-widest">HP</span><span className="text-2xl font-bold text-red-700 drop-shadow-sm">{finalStats.HP}</span></div><div className="w-px bg-[#d6c7ab]"></div>
                <div className="flex flex-col items-center"><span className="text-xs text-[#7c6a58] font-bold mb-1 tracking-widest">MP</span><span className="text-2xl font-bold text-blue-700 drop-shadow-sm">{finalStats.MP}</span></div>
              </div>
              <div className="flex gap-4 sm:gap-6 justify-center lg:justify-end flex-wrap">
                <div className="flex flex-col items-center"><span className="text-xs text-[#7c6a58] font-bold mb-1 tracking-widest">先攻</span><span className="text-2xl font-bold text-amber-700 drop-shadow-sm">{isRevealed('stats') ? finalStats.Init : '??'}</span></div><div className="w-px bg-[#d6c7ab]"></div>
                <div className="flex flex-col items-center"><span className="text-xs text-[#7c6a58] font-bold mb-1 tracking-widest">物防</span><span className="text-xl sm:text-2xl font-bold text-[#2c221e] drop-shadow-sm mt-auto">{isRevealed('stats') ? finalStats.Def : '??'}</span></div><div className="w-px bg-[#d6c7ab]"></div>
                <div className="flex flex-col items-center"><span className="text-xs text-[#7c6a58] font-bold mb-1 tracking-widest">魔防</span><span className="text-xl sm:text-2xl font-bold text-purple-800 drop-shadow-sm mt-auto">{isRevealed('stats') ? finalStats.MDef : '??'}</span></div>
              </div>
            </div>

            {/* 屬性相性 (弱點 VUL / 抗性 RES / 免疫 IMM / 吸收 ABS 區塊化分類顯示) */}
            {(() => {
              const categories = [
                { key: 'vul', label: '弱點 VUL', color: 'text-red-900', border: 'border-red-200' },
                { key: 'res', label: '抗性 RES', color: 'text-amber-900', border: 'border-amber-200' },
                { key: 'imm', label: '免疫 IMM', color: 'text-sky-900', border: 'border-sky-200' },
                { key: 'abs', label: '吸收 ABS', color: 'text-emerald-900', border: 'border-emerald-200' }
              ];

              const groupedAffs = categories.map(cat => ({
                ...cat,
                types: DAMAGE_TYPES.filter(t => (mergedAffinities[t] || 'normal') === cat.key)
              })).filter(cat => cat.types.length > 0);

              if (groupedAffs.length === 0 && (!finalStats.statusImmunities || finalStats.statusImmunities.length === 0)) return null;

              return (
                <div
                  className="mb-5 border p-3.5 sm:p-4 rounded-xl shadow-xs transition-colors duration-300 space-y-3.5 overflow-hidden"
                  style={{ backgroundColor: currentTheme.subpanelBg, borderColor: currentTheme.border }}
                >
                  {groupedAffs.length > 0 && (
                    <div className="flex flex-wrap gap-x-6 gap-y-4 items-start">
                      {groupedAffs.map(cat => (
                        <div key={cat.key} className="flex flex-col gap-1.5 min-w-[140px] max-w-full flex-1 sm:flex-initial">
                          {/* 類別標題 (弱點 VUL / 抗性 RES / 免疫 IMM / 吸收 ABS) */}
                          <div className={`text-xs font-black tracking-wider ${cat.color} flex items-center gap-1 border-b border-[#d6c7ab]/70 pb-1.5 mb-1`}>
                            {cat.label}
                          </div>
                          {/* 該類別對應的屬性徽章列表 */}
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {cat.types.map(t => {
                              const styleInfo = TYPE_STYLES[t] || {};
                              return (
                                <div
                                  key={t}
                                  className="bg-[#fffdf9] border border-[#d6c7ab] px-2.5 py-1 rounded-md shadow-2xs flex items-center gap-1.5 text-xs font-bold transition-all hover:scale-105 shrink-0"
                                >
                                  <span className={`inline-flex items-center gap-1 ${styleInfo.color || 'text-stone-800'}`}>
                                    {styleInfo.fuIcon ? (
                                      <span className="fu-icon text-base leading-none translate-y-[0.5px]">{styleInfo.fuIcon}</span>
                                    ) : (
                                      <span>{styleInfo.emoji || ''}</span>
                                    )}
                                    <span>{t}</span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {finalStats.statusImmunities && finalStats.statusImmunities.length > 0 && (
                    <div className={`pt-2 flex flex-wrap items-center gap-2 text-xs font-bold ${groupedAffs.length > 0 ? 'border-t border-[#d6c7ab]/70' : ''}`}>
                      <span className="text-amber-900 font-black tracking-wider shrink-0 flex items-center gap-1">🛡️ 異常免疫：</span>
                      <div className="flex flex-wrap gap-1.5">
                        {finalStats.statusImmunities.map(status => (
                          <span key={status} className="bg-[#fffdf9] border border-[#d6c7ab] px-2.5 py-1 rounded-md text-xs font-bold text-stone-800 shadow-2xs">
                            {status}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {(() => {
              const sp = SPECIES_DATA.find(s => s.id === state.selectedSpeciesId);
              if (!sp) return null;

              const benefits = state.speciesConfig.selectedBenefits || [];
              const selectedTexts = sp.benefitsConfig.options
                .filter(o => benefits.includes(o.id))
                .filter(o => {
                  const text = o.text;
                  if (text.includes('飛行技能') || text.includes('身體能力') || text.includes('獨特設計') || text.includes('背景或訓練') || text.includes('【荊棘】')) return false;
                  if (text.includes('最大 HP 增加') || text.includes('最大 MP 增加')) return false;
                  if (text.includes('定位技能')) return false;
                  if (text.includes('狀態效果的免疫') || text.includes('狀態效果免疫')) return false;
                  if (text.includes('抗性') || text.includes('替換為吸收') || text.includes('免疫') || text.includes('吸收')) return false;
                  if (text.includes('學習一個咒語') && state.speciesConfig.spell) return false;
                  return true;
                })
                .map(o => o.text.replace(/，並將最大 MP 增加 10 點。/g, '').replace(/、/g, '、').trim());

              const isPureNumericalFixed = ['sp_construct', 'sp_demon', 'sp_element', 'sp_humanoid', 'sp_plant', 'sp_undead'].includes(state.selectedSpeciesId);
              const content = [isPureNumericalFixed ? null : sp.fixedDesc, ...selectedTexts].filter(Boolean).join(' ');

              if (!content) return null;

              return (
                <div className="bg-[#f4ebd9]/60 p-3.5 rounded-lg border border-[#d6c7ab]/80 text-xs text-[#5c4a38] leading-relaxed shadow-inner">
                  <div className="font-bold text-[#3c2415] mb-1 flex items-center gap-1.5 text-sm">
                    <span>📜 種族特質 / 背景說明</span>
                  </div>
                  <div>{renderFormattedText(content, state.speciesConfig, state.level, state.partyLevel)}</div>
                </div>
              );
            })()}

            {/* 技能與咒語列表 */}
            {isRevealed('combat') && (
              <>
                {groupedSkills.attack.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold border-b-2 mb-3 flex items-center gap-2 tracking-widest" style={{ borderBottomColor: currentTheme.accent, color: currentTheme.accentDark }}><span className="fu-icon text-[22px] drop-shadow-sm translate-y-[1px]">{CATEGORIES.find(c => c.id === 'attack')?.fuIcon || 'a'}</span> 基本攻擊與技能</h3>
                    <div className="flex flex-col gap-3 mb-4 ml-2">
                      {groupedSkills.attack.map(skill => (
                        <ReadOnlySkill key={skill.id} skill={skill} finalStats={finalStats} npcName={validNpcName} npcLevel={state.level} partyLevel={state.partyLevel} onInspectorClick={handleInspectorClick} />
                      ))}
                    </div>
                  </div>
                )}
                {(finalStats.spellList.length > 0 || groupedSkills.spell.length > 0) && (
                    <div>
                      <h3 className="text-lg font-bold border-b-2 mb-3 flex items-center gap-2 tracking-widest" style={{ borderBottomColor: currentTheme.accent, color: currentTheme.accentDark }}><span className="fu-icon text-[22px] drop-shadow-sm translate-y-[1px]">{CATEGORIES.find(c => c.id === 'spell')?.fuIcon || 'c'}</span> 咒語</h3>
                      {finalStats.spellList.length > 0 && (
                        <div className="flex flex-col gap-3 mb-4 ml-2">
                          {finalStats.spellList.map((spellObj, i) => {
                            const rawSpellName = spellObj.name;
                            const selections = spellObj.selections || {};
                            const cleanSpellName = rawSpellName.replace(/\(Lv30\+\)/g, '').trim();
                            const effectiveName = selections.customName !== undefined ? selections.customName : cleanSpellName;
                            const spellData = SPELLS_DATA[cleanSpellName];
                            const effectiveDesc = selections.customDesc !== undefined ? selections.customDesc : spellData?.effect || '';
                            const isOffensive = cleanSpellName.includes('⚡');
                            const isSecretArtForSpell = cleanSpellName === secretArtTarget || rawSpellName === secretArtTarget;
                            const totalMagicAcc = finalStats.Acc + finalStats.MagicAccModifier;

                            let nameState = { used: false };
                            const replaceNPC = (txt) => {
                              if (typeof txt !== 'string' || !validNpcName) return txt;
                              return txt.replace(/此\s?NPC\s?/g, () => {
                                if (!nameState.used) { nameState.used = true; return `__NPC_NAME__${validNpcName}__NPC_END__`; }
                                return "它";
                              });
                            };

                            const replacedTarget = replaceNPC(spellData?.target);
                            const rawEffectBase = effectiveDesc.replace(/【HR\+(\d+)】/g, (match, p1) => `[HR + ${parseInt(p1) + finalStats.Dmg}]`);
                            const replacedEffect = replaceNPC(rawEffectBase);

                            let spellTextToCopy = `> ${isOffensive ? '⚡' : '✨'} ${getPlainText(effectiveName.replace('⚡', ''), selections, state.level, state.partyLevel)}`;
                            if (spellData) {
                              spellTextToCopy += ` (MP: ${spellData.mp} | 目標: ${getPlainText(replacedTarget, selections, state.level, state.partyLevel)} | 持續: ${spellData.duration})\n`;
                              if (isOffensive) {
                                const accStr = totalMagicAcc > 0 ? ` +${totalMagicAcc}` : (totalMagicAcc < 0 ? ` - ${Math.abs(totalMagicAcc)}` : '');
                                const formulaDisplay = state.magicFormula || '[INS + WLP]';
                                spellTextToCopy += `> ${formulaDisplay}${accStr} ✦ 魔法攻擊\n`;
                              }
                              let effectText = effectiveDesc.replace(/【HR\+(\d+)】/g, (match, p1) => `[HR + ${parseInt(p1) + finalStats.Dmg}]`);
                              spellTextToCopy += `> ${getPlainText(effectText, selections, state.level, state.partyLevel).split('\n').join('\n> ')}`;
                              if (isSecretArtForSpell) {
                                spellTextToCopy += `
> *(此咒語為祕技，除了目標之外沒有人會意識到那是什麼。)*`;
                              }
                            }

                            if (validNpcName) {
                              let mdUsed = false;
                              spellTextToCopy = spellTextToCopy.replace(/此\s?NPC\s?/g, () => {
                                if (!mdUsed) { mdUsed = true; return `**${validNpcName}**`; }
                                return "它";
                              });
                            }

                            return (
                              <div key={i} className={`bg-[#f9f5eb] border-l-4 p-3 text-sm break-inside-avoid shadow-sm rounded-r-md border border-[#e2d6c1] ${isSecretArtForSpell ? 'border-l-fuchsia-600 bg-fuchsia-50/80 ring-1 ring-fuchsia-400' : 'border-l-purple-700'}`}>
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2d6c1] pb-2 mb-2">
                                  <span className={`font-bold text-[16px] flex flex-wrap items-center gap-1 ${isSecretArtForSpell ? 'text-fuchsia-900' : 'text-purple-900'}`}>
                                    <span className="fu-icon text-xl drop-shadow-sm shrink-0">{CATEGORIES.find(c => c.id === 'spell')?.fuIcon || 'c'}</span> <span className={selections.customName !== undefined ? 'text-amber-800 font-bold' : ''}>{renderFormattedText(effectiveName.replace('⚡', ''), selections, state.level, state.partyLevel)}</span> {isOffensive && <span className="fu-icon text-xl text-red-700 drop-shadow-sm ml-1 shrink-0">{TYPE_STYLES['攻擊性咒語']?.fuIcon || 'o'}</span>}
                                    <CopyButton text={spellTextToCopy} />
                                  </span>
                                </div>

                                {spellData && (
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#6b5a4b] font-bold tracking-wider bg-[#fffdf9] px-2.5 py-1 mb-2 rounded border border-[#d6c7ab] shadow-sm w-fit">
                                    <span>MP: <span className="text-blue-700 font-bold">{spellData.mp}</span></span>
                                    <span className="text-[#d6c7ab]">|</span>
                                    <span>目標: <span className="text-[#2c221e]">{renderFormattedText(replacedTarget, selections, state.level, state.partyLevel)}</span></span>
                                    <span className="text-[#d6c7ab]">|</span>
                                    <span>持續: <span className="text-[#2c221e]">{spellData.duration}</span></span>
                                  </div>
                                )}

                                {isOffensive && <div className="text-blue-900 text-[13px] font-bold mb-1.5 flex items-center gap-1.5"><span className="text-[#2c221e] tracking-widest">{state.magicFormula || '[INS + WLP]'}</span> {totalMagicAcc !== 0 && <span className="text-amber-700">{totalMagicAcc > 0 ? `+ ${totalMagicAcc}` : `- ${Math.abs(totalMagicAcc)}`}</span>} ✦ 魔法攻擊</div>}

                                <div className={`text-sm leading-relaxed ${selections.customDesc !== undefined ? 'text-amber-900 font-medium' : 'text-stone-800'}`}>
                                  {spellData ? renderFormattedText(replacedEffect, selections, state.level, state.partyLevel) : "無詳細資料。"}
                                  {isSecretArtForSpell && <div className="text-fuchsia-900 mt-1.5 text-xs font-bold">*(此咒語為祕技，除了目標之外沒有人會意識到那是什麼。)*</div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {groupedSkills.spell.map(skill => (
                        <ReadOnlySkill key={skill.id} skill={skill} finalStats={finalStats} npcName={validNpcName} npcLevel={state.level} partyLevel={state.partyLevel} onInspectorClick={handleInspectorClick} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {revealLevel === 'full' && (
                <>
                  {groupedSkills.action.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold border-b-2 mb-3 flex items-center gap-2 tracking-widest" style={{ borderBottomColor: currentTheme.accent, color: currentTheme.accentDark }}>⚡ 其餘行動</h3>
                      {groupedSkills.action.map(skill => (
                        <ReadOnlySkill key={skill.id} skill={skill} finalStats={finalStats} npcName={validNpcName} npcLevel={state.level} partyLevel={state.partyLevel} onInspectorClick={handleInspectorClick} />
                      ))}
                    </div>
                  )}
                  {groupedSkills.rule.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold border-b-2 mb-3 flex items-center gap-2 tracking-widest" style={{ borderBottomColor: currentTheme.accent, color: currentTheme.accentDark }}>📜 特殊規則</h3>
                      {groupedSkills.rule.map(skill => (
                        <ReadOnlySkill key={skill.id} skill={skill} finalStats={finalStats} npcName={validNpcName} npcLevel={state.level} partyLevel={state.partyLevel} onInspectorClick={handleInspectorClick} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
    );
  };

  const handleCopyFullNpc = (format = 'markdown') => {
    if (!state) return;
    const stats = calculateStats();

    const isRevealed = (category) => {
      if (revealLevel === 'full') return true;
      const lv = parseInt(revealLevel);
      if (category === 'basic') return true;
      if (category === 'stats' && lv >= 10) return true;
      if (category === 'combat' && lv >= 13) return true;
      return false;
    };

    let text = "";

    if (format === 'discord') {
      const rankDisplay = state.rank === "冠位" ? `${state.rank} (${state.championMultiplier})` : state.rank;
      text += "```yaml\n";
      text += `=== ${state.name || '未知實體'} (Lv.${state.level}) ===\n`;
      text += `【${rankDisplay}】${state.role}${state.villainTier !== 'none' && revealLevel === 'full' ? ` (${VILLAIN_TIERS[state.villainTier].label})` : ''}\n`;
      text += "```\n";
      if (isRevealed('stats')) {
        if (state.traits) text += `*特質: ${state.traits}*\n`;
        text += `\`DEX d${stats.DEX.replace('d','')} | INS d${stats.INS.replace('d','')} | MIG d${stats.MIG.replace('d','')} | WLP d${stats.WLP.replace('d','')}\`\n`;
        text += `\`HP ${stats.HP} | MP ${stats.MP} | 先攻 ${stats.Init} | 物防 ${stats.Def} | 魔防 ${stats.MDef}\`\n`;
        let affs = [];
        DAMAGE_TYPES.forEach(t => {
          const aff = mergedAffinities[t];
          if (aff && aff !== 'normal') {
            const label = aff === 'vul' ? '弱點' : aff === 'res' ? '抗性' : aff === 'imm' ? '免疫' : '吸收';
            affs.push(`${t}:${label}`);
          }
        });
        if (affs.length > 0) text += `*相性*: ${affs.join(', ')}\n`;
        if (stats.statusImmunities.length > 0) text += `*異常免疫*: ${stats.statusImmunities.join(', ')}\n`;
        text += `\n`;
      } else {
        text += `\`HP ${stats.HP} | MP ${stats.MP} | 先攻 ?? | 物防 ?? | 魔防 ??\`\n\n`;
      }

      if (isRevealed('combat')) {
        if (stats.spellList && stats.spellList.length > 0) {
          text += `**🔮 咒語**\n`;
          stats.spellList.forEach(spellObj => {
            const rawSpellName = spellObj.name;
            const selections = spellObj.selections || {};
            const cleanSpellName = rawSpellName.replace(/\(Lv30\+\)/g, '').trim();
            const effectiveName = selections.customName !== undefined ? selections.customName : cleanSpellName;
            const spellData = SPELLS_DATA[cleanSpellName];
            const effectiveDesc = selections.customDesc !== undefined ? selections.customDesc : spellData?.effect || '';
            const isOffensive = cleanSpellName.includes('⚡');
            const totalMagicAcc = stats.Acc + stats.MagicAccModifier;
            const replacedTarget = getPlainText(spellData?.target, selections, state.level, state.partyLevel);
            const replacedEffect = getPlainText(effectiveDesc ? effectiveDesc.replace(/【HR\+(\d+)】/g, (match, p1) => `[HR + ${parseInt(p1) + stats.Dmg}]`) : '', selections, state.level, state.partyLevel, true);

            text += `> **${effectiveName.replace('⚡', '')}** (MP: ${spellData?.mp || '?'} | 目標: ${replacedTarget} | 持續: ${spellData?.duration || '瞬發'})\n`;
            if (isOffensive) {
              const accStr = totalMagicAcc >= 0 ? `+${totalMagicAcc}` : `${totalMagicAcc}`;
              text += `> *精確: ${state.magicFormula || '[INS + WLP]'} ${accStr}*\n`;
            }
            text += `> ${replacedEffect.split('\n').join('\n> ')}\n\n`;
          });
        }

        text += `**⚔️ 技能與行動**\n`;
        processedSkills.filter(s => !s.isOverBudget).forEach(s => {
          if (revealLevel !== 'full' && (s.source === 'bossSkill' || s.category === 'rule' || s.category === 'action')) return;
          let skillName = (s.customName || s.originalName).replace(/^(技能|能力)：/, '').replace(/\(定位技能\)/, '').trim();
          text += `> **${skillName}**\n`;
          if (s.attack) {
            text += `> [${getPlainText(s.attack.distance, s.selections, state.level, state.partyLevel)}] [${getPlainText(s.attack.formula, s.selections, state.level, state.partyLevel)}] ${stats.Acc >= 0 ? '+' : '-'}${Math.abs(stats.Acc)} ✦ [HR + ${s.attack.baseDmg + stats.Dmg}] ${getPlainText(s.attack.type, s.selections, state.level, state.partyLevel)}傷害\n`;
          }
          text += `> ${getPlainText(s.customDesc || s.originalDesc, s.selections, state.level, state.partyLevel, true).split('\n').join('\n> ')}\n\n`;
        });
      }
      if (revealLevel === 'full' && state.tactics) {
        text += `**戰術慣例**:\n${state.tactics}\n`;
      }
    } else if (format === 'plain') {
      text += `${state.name} (Lv. ${state.level})\n`;
      const rankDisplay = state.rank === "冠位" ? `${state.rank} (${state.championMultiplier})` : state.rank;
      text += `【${rankDisplay}】${state.role}\n`;
      if (isRevealed('stats')) {
        if (state.traits) text += `特質: ${state.traits}\n`;
        text += `DEX d${stats.DEX.replace('d','')} | INS d${stats.INS.replace('d','')} | MIG d${stats.MIG.replace('d','')} | WLP d${stats.WLP.replace('d','')}\n`;
        text += `HP: ${stats.HP} | MP: ${stats.MP} | 先攻: ${stats.Init} | 物防: ${stats.Def} | 魔防: ${stats.MDef}\n`;
        DAMAGE_TYPES.forEach(t => {
          const aff = mergedAffinities[t];
          if (aff && aff !== 'normal') {
            const label = aff === 'vul' ? '弱點' : aff === 'res' ? '抗性' : aff === 'imm' ? '免疫' : '吸收';
            text += `${t}: ${label}\n`;
          }
        });
        if (stats.statusImmunities.length > 0) text += `異常免疫: ${stats.statusImmunities.join('、')}\n`;
        text += `\n`;
      }
      if (isRevealed('combat')) {
        if (stats.spellList && stats.spellList.length > 0) {
          text += `[ 咒語 ]\n`;
          stats.spellList.forEach(spellObj => {
            const rawSpellName = spellObj.name;
            const selections = spellObj.selections || {};
            const cleanSpellName = rawSpellName.replace(/\(Lv30\+\)/g, '').trim();
            const effectiveName = selections.customName !== undefined ? selections.customName : cleanSpellName;
            const spellData = SPELLS_DATA[cleanSpellName];
            const effectiveDesc = selections.customDesc !== undefined ? selections.customDesc : spellData?.effect || '';
            const replacedTarget = getPlainText(spellData?.target, selections, state.level, state.partyLevel);
            const replacedEffect = getPlainText(effectiveDesc ? effectiveDesc.replace(/【HR\+(\d+)】/g, (match, p1) => `[HR + ${parseInt(p1) + stats.Dmg}]`) : '', selections, state.level, state.partyLevel, true);
            text += `- ${effectiveName} (MP: ${spellData?.mp || '?'} | 目標: ${replacedTarget} | 持續: ${spellData?.duration || '瞬發'})\n  ${replacedEffect}\n`;
          });
          text += `\n`;
        }
        text += `[ 技能與行動 ]\n`;
        processedSkills.filter(s => !s.isOverBudget).forEach(s => {
          if (revealLevel !== 'full' && (s.source === 'bossSkill' || s.category === 'rule' || s.category === 'action')) return;
          let skillName = (s.customName || s.originalName).replace(/^(技能|能力)：/, '').replace(/\(定位技能\)/, '').trim();
          let atkStr = s.attack ? ` [${getPlainText(s.attack.distance, s.selections, state.level, state.partyLevel)}] [${getPlainText(s.attack.formula, s.selections, state.level, state.partyLevel)}] ${stats.Acc >= 0 ? '+' : '-'}${Math.abs(stats.Acc)} [HR + ${s.attack.baseDmg + stats.Dmg}] ${getPlainText(s.attack.type, s.selections, state.level, state.partyLevel)}傷害` : '';
          text += `- ${skillName}${atkStr}\n  ${getPlainText(s.customDesc || s.originalDesc, s.selections, state.level, state.partyLevel, true)}\n`;
        });
      }
      if (revealLevel === 'full' && state.tactics) {
        text += `\n戰術慣例:\n${state.tactics}\n`;
      }
    } else {
      let md = `### ${state.name} (Lv. ${state.level})\n`;
      const rankDisplay = state.rank === "冠位" ? `${state.rank} (${state.championMultiplier})` : state.rank;
      md += `**【${rankDisplay}】${state.role}** ${state.villainTier !== 'none' && revealLevel === 'full' ? `(${VILLAIN_TIERS[state.villainTier].label} - UP ${VILLAIN_TIERS[state.villainTier].up})` : ''}\n`;

      if (isRevealed('stats')) {
        if (state.traits) md += `*特質: ${state.traits}*\n`;
        md += `\n**DEX ${stats.DEX.startsWith('d') ? stats.DEX : 'd' + stats.DEX} | INS ${stats.INS.startsWith('d') ? stats.INS : 'd' + stats.INS} | MIG ${stats.MIG.startsWith('d') ? stats.MIG : 'd' + stats.MIG} | WLP ${stats.WLP.startsWith('d') ? stats.WLP : 'd' + stats.WLP}**\n`;
        md += `**HP: ${stats.HP} | MP: ${stats.MP} | 先攻: ${stats.Init} | 物防: ${stats.Def} | 魔防: ${stats.MDef}**\n\n`;

        let affStr = "";
        DAMAGE_TYPES.forEach(t => {
          const aff = mergedAffinities[t];
          if (aff && aff !== 'normal') {
            const label = aff === 'vul' ? '弱點' : aff === 'res' ? '抗性' : aff === 'imm' ? '免疫' : '吸收';
            affStr += `* ${t}: ${label}\n`;
          }
        });
        if (affStr) md += affStr;
        if (stats.statusImmunities.length > 0) md += `* 異常免疫: ${stats.statusImmunities.join('、')}\n`;
        md += `\n`;
      } else {
        md += `**HP: ${stats.HP} | MP: ${stats.MP} | 先攻: ?? | 物防: ?? | 魔防: ??**\n\n`;
      }

      if (revealLevel === 'full' && (state.selectedNegativeSkills || []).length > 0) {
        md += `#### ⛓️ 負面技能\n`;
        state.selectedNegativeSkills.forEach(neg => {
          const skill = NEGATIVE_SKILLS_DATA.find(s => s.id === neg.id);
          if (skill) {
            md += `> **${skill.originalName}**\n`;
            md += `> ${getPlainText(skill.originalDesc, neg.selections, state.level, state.partyLevel, true)}\n\n`;
          }
        });
      }

      if (isRevealed('combat')) {
        const validNpcName = state.name && state.name.trim() !== "" && state.name !== "未知實體" ? state.name.trim() : null;

        if (stats.spellList && stats.spellList.length > 0) {
          md += `#### 🔮 咒語\n`;
          stats.spellList.forEach(spellObj => {
            const rawSpellName = spellObj.name;
            const selections = spellObj.selections || {};
            const cleanSpellName = rawSpellName.replace(/\(Lv30\+\)/g, '').trim();
            const effectiveName = selections.customName !== undefined ? selections.customName : cleanSpellName;
            const spellData = SPELLS_DATA[cleanSpellName];
            const effectiveDesc = selections.customDesc !== undefined ? selections.customDesc : spellData?.effect || '';
            const isOffensive = cleanSpellName.includes('⚡');
            const isSecretArtForSpell = cleanSpellName === secretArtTarget || rawSpellName === secretArtTarget;
            const totalMagicAcc = stats.Acc + stats.MagicAccModifier;

            let nameState = { used: false };
            const replaceNPC = (txt) => {
              if (typeof txt !== 'string' || !validNpcName) return txt;
              return txt.replace(/此\s?NPC\s?/g, () => {
                if (!nameState.used) { nameState.used = true; return `__NPC_NAME__${validNpcName}__NPC_END__`; }
                return "它";
              });
            };

            const replacedTarget = replaceNPC(spellData?.target);
            const rawEffectBase = effectiveDesc ? effectiveDesc.replace(/【HR\+(\d+)】/g, (match, p1) => `[HR + ${parseInt(p1) + stats.Dmg}]`) : '';
            const replacedEffect = replaceNPC(rawEffectBase);

            md += `> **${isOffensive ? '⚡' : '✨'} ${effectiveName.replace('⚡', '')}** (MP: ${spellData?.mp || '?'} | 目標: ${getPlainText(replacedTarget, selections, state.level, state.partyLevel)} | 持續: ${spellData?.duration || '瞬發'})\n`;
            if (isOffensive) {
              const accStr = totalMagicAcc > 0 ? ` +${totalMagicAcc}` : (totalMagicAcc < 0 ? ` - ${Math.abs(totalMagicAcc)}` : '');
              const formulaDisplay = state.magicFormula || '[INS + WLP]';
              md += `> ${formulaDisplay}${accStr} ✦ 魔法攻擊\n`;
            }
            if (spellData) {
              md += `> ${getPlainText(replacedEffect, selections, state.level, state.partyLevel, true).split('\n').join('\n> ')}\n`;
            }
            if (isSecretArtForSpell) {
              md += `> *(此咒語為祕技，除了目標之外沒有人會意識到那是什麼。)*\n`;
            }
            md += `\n`;
          });
        }

        md += `#### ⚔️ 技能與行動\n`;
        processedSkills.filter(s => !s.isOverBudget).forEach(s => {
          if (revealLevel !== 'full' && (s.source === 'bossSkill' || s.category === 'rule' || s.category === 'action')) return;
          let rawName = s.customName || s.originalName;
          let skillName = rawName.replace(/^(技能|能力)：/, '').replace(/\(定位技能\)/, '').trim();
          md += `> **${skillName}**\n`;
          if (s.attack) {
            md += `> [${getPlainText(s.attack.distance, s.selections, state.level, state.partyLevel)}] [${getPlainText(s.attack.formula, s.selections, state.level, state.partyLevel)}] ${stats.Acc >= 0 ? '+' : '-'}${Math.abs(stats.Acc)} ✦ [HR + ${s.attack.baseDmg + stats.Dmg}] ${getPlainText(s.attack.type, s.selections, state.level, state.partyLevel)}傷害\n`;
          }
          if (s.customDesc || s.originalDesc) {
            md += `> ${getPlainText(s.customDesc || s.originalDesc, s.selections, state.level, state.partyLevel, true)}\n`;
          }
          const isSecret = s.isSecretArt || (secretArtTarget && (secretArtTarget === rawName || secretArtTarget === skillName || secretArtTarget === s.originalName || secretArtTarget === s.customName));
          if (isSecret) {
            const label = s.attack ? '攻擊' : s.category === 'spell' ? '咒語' : '技能';
            md += `> *(此${label}為祕技，除了目標之外沒有人會意識到那是什麼。)*\n`;
          }
          md += `\n`;
        });
      }

      if (revealLevel === 'full' && state.tactics) {
        md += `**戰術慣例**:\n${state.tactics}\n`;
      }
      text = md;
    }

    const trimmedText = text.trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(trimmedText).then(() => {
        const formatName = format === 'discord' ? 'Discord' : format === 'plain' ? '純文字筆記' : 'Markdown';
        showToast(`📋 已複製全文本角色卡 (${formatName})`, 'success');
      }).catch(() => {
        const textArea = document.createElement("textarea");
        textArea.value = trimmedText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        const formatName = format === 'discord' ? 'Discord' : format === 'plain' ? '純文字筆記' : 'Markdown';
        showToast(`📋 已複製全文本角色卡 (${formatName})`, 'success');
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = trimmedText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      const formatName = format === 'discord' ? 'Discord' : format === 'plain' ? '純文字筆記' : 'Markdown';
      showToast(`📋 已複製全文本角色卡 (${formatName})`, 'success');
    }
  };

  const renderStepContent = () => {
    if (!state) return null;
    switch (currentStep) {
      case 1:
        const roles = Object.keys(ROLES_DATA);

        const handleMove = (dir) => {
          const newIdx = visualIndex + dir;
          setVisualIndex(newIdx);
          const newRoleName = roles[((newIdx % roles.length) + roles.length) % roles.length];
          handleRoleChange(newRoleName);
        };

        const onMouseDown = (e) => {
          setIsDragging(true);
          dragStartX.current = e.clientX;
        };

        const onMouseMove = (e) => {
          if (!isDragging) return;
          setDragOffset(e.clientX - dragStartX.current);
        };

        const onMouseUp = () => {
          if (!isDragging) return;
          setIsDragging(false);
          if (dragOffset > 80) handleMove(-1);
          else if (dragOffset < -80) handleMove(1);
          setDragOffset(0);
        };

        const onTouchStart = (e) => {
          setIsDragging(true);
          dragStartX.current = e.touches[0].clientX;
        };

        const onTouchMove = (e) => {
          if (!isDragging) return;
          setDragOffset(e.touches[0].clientX - dragStartX.current);
        };

        const onTouchEnd = () => {
          if (!isDragging) return;
          setIsDragging(false);
          if (dragOffset > 50) handleMove(-1);
          else if (dragOffset < -50) handleMove(1);
          setDragOffset(0);
        };

        // 渲染範圍：visualIndex 前後各 3 個
        const renderRange = [];
        for (let i = visualIndex - 3; i <= visualIndex + 3; i++) {
          renderRange.push(i);
        }

        return (
          <div className="flex flex-col h-full space-y-8 animate-in fade-in zoom-in-95 duration-500 max-w-5xl mx-auto relative pb-10 select-none">
            <div className="bg-[#f5efdf] border-l-4 border-amber-700 p-4 rounded text-[#2c221e] border border-[#d6c7ab] shadow-sm">
              <h3 className="font-bold mb-1 text-[#3c2415] flex items-center gap-2"><Sparkles size={18} className="text-amber-700" /> 步驟 1：選擇NPC的定位</h3>
              <p className="text-sm text-[#574c43]">每個定位都擁有獨特的成長屬性。環狀捲軸已開啟，您可以無限滑動來挑選。</p>
            </div>

            {/* Carousel Outer Container */}
            <div
              className="relative py-12 px-4 flex items-center justify-center overflow-hidden h-[500px]"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'pan-y' }}
            >
              {/* Navigation Arrows */}
              <button onClick={(e) => { e.stopPropagation(); handleMove(-1); }} className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-[#fffdf9] border border-[#d6c7ab] text-[#3c2415] hover:bg-[#f4ebd9] hover:border-amber-700 hover:text-amber-800 transition-all hover:scale-110 active:scale-95 shadow-md">
                <ChevronLeft size={32} strokeWidth={3} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleMove(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-[#fffdf9] border border-[#d6c7ab] text-[#3c2415] hover:bg-[#f4ebd9] hover:border-amber-700 hover:text-amber-800 transition-all hover:scale-110 active:scale-95 shadow-md">
                <ChevronRight size={32} strokeWidth={3} />
              </button>

              {/* The Sliding Track */}
              <div
                className="relative flex items-center transition-all duration-500 ease-out w-0 h-full"
                style={{
                  transform: `translateX(calc(${isMobile ? '-7rem' : '-12rem'} - (${visualIndex} * ${isMobile ? '16rem' : '27rem'}) + ${dragOffset}px))`
                }}
              >
                {/* 我們渲染一個足夠大的範圍來涵蓋目前的視角 */}
                {/* 為了簡化，我們直接渲染 visualIndex 附近的卡片 */}
                {Array.from({ length: 201 }).map((_, idx) => {
                  const itemIndex = idx + visualIndex - 100;
                  const roleName = roles[((itemIndex % roles.length) + roles.length) % roles.length];
                  const isActive = itemIndex === visualIndex;
                  const distance = Math.abs(itemIndex - visualIndex);

                  // 只渲染視線範圍內的卡片以節省效能
                  if (distance > 4) return null;

                  return (
                    <div
                      key={itemIndex}
                      onClick={() => {
                        if (!isActive) {
                          setVisualIndex(itemIndex);
                          handleRoleChange(roleName);
                        }
                      }}
                      className={`flex-shrink-0 transition-all duration-500 cursor-pointer relative ${isMobile ? 'w-56' : 'w-96'}`}
                      style={{
                        transform: `scale(${isActive ? 1.05 : 0.8}) rotateY(${(itemIndex - visualIndex) * -15}deg)`,
                        opacity: isActive ? 1 : 0.2 / Math.max(1, distance),
                        filter: isActive ? 'none' : `blur(${distance * 1}px) grayscale(100%)`,
                        position: 'absolute',
                        left: `calc(${itemIndex} * ${isMobile ? '16rem' : '27rem'})`
                      }}
                    >
                      <div className={`bg-gradient-to-b from-[#fffdf9] to-[#f4ebd9] p-4 sm:p-8 rounded-2xl border-2 transition-all duration-300 ${isActive ? 'border-amber-600 shadow-xl' : 'border-[#d6c7ab]'} relative overflow-hidden group`}>
                        {/* Background Watermark Icon */}
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-[#8b4513] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                          {(() => {
                            const WatermarkIcon = ROLE_ICONS[roleName] || ROLE_DESCRIPTIONS[roleName]?.Icon;
                            return WatermarkIcon ? (
                              <WatermarkIcon className="w-48 h-48 sm:w-56 sm:h-56 -rotate-12 transform translate-x-8 -translate-y-8" />
                            ) : (
                              <span className="text-[10rem] leading-none transform translate-x-12 -translate-y-12 block">{ROLE_DESCRIPTIONS[roleName]?.icon}</span>
                            );
                          })()}
                        </div>

                        <div className="relative z-10 flex flex-col items-center text-center gap-4">
                          <div className={`w-28 h-28 rounded-full flex items-center justify-center border transition-all duration-500 ${isActive ? 'bg-amber-100/80 border-amber-600 shadow-md text-amber-900' : 'bg-[#f5efdf] border-[#d6c7ab] text-[#8b4513]'}`}>
                            {(() => {
                              const CardIcon = ROLE_ICONS[roleName] || ROLE_DESCRIPTIONS[roleName]?.Icon;
                              return CardIcon ? (
                                <CardIcon className="w-14 h-14" />
                              ) : (
                                <span className="text-6xl">{ROLE_DESCRIPTIONS[roleName]?.icon}</span>
                              );
                            })()}
                          </div>
                          <div>
                            <h2 className="text-3xl sm:text-4xl font-black text-[#3c2415] tracking-[0.15em] mb-1">{roleName}</h2>
                            <div className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase ${isActive ? 'bg-amber-200/80 text-amber-950 border border-amber-400' : 'bg-[#eee6d3] text-[#6b5a4b]'}`}>
                              {ROLE_DESCRIPTIONS[roleName].subtitle}
                            </div>
                          </div>
                          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#d6c7ab] to-transparent"></div>
                          <p className="text-[#574c43] leading-relaxed text-sm font-medium h-24 overflow-hidden line-clamp-4">
                            {ROLE_DESCRIPTIONS[roleName].desc}
                          </p>
                        </div>

                        {isActive && (
                          <>
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-amber-600 rounded-tl-lg opacity-80"></div>
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-600 rounded-tr-lg opacity-80"></div>
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-amber-600 rounded-bl-lg opacity-80"></div>
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-600 rounded-br-lg opacity-80"></div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Role Quick Select Bar */}
            <div className="grid grid-cols-3 sm:flex sm:justify-center gap-2 sm:gap-4 mt-2 px-4 w-full max-w-[280px] sm:max-w-none mx-auto">
              {roles.map((r) => {
                const isCurrent = roles[((visualIndex % roles.length) + roles.length) % roles.length] === r;
                const QuickIcon = ROLE_ICONS[r] || ROLE_DESCRIPTIONS[r]?.Icon;
                return (
                  <button
                    key={r}
                    onClick={() => {
                      const rolesArr = Object.keys(ROLES_DATA);
                      const targetBaseIdx = rolesArr.indexOf(r);
                      const currentBaseIdx = ((visualIndex % rolesArr.length) + rolesArr.length) % rolesArr.length;
                      let diff = targetBaseIdx - currentBaseIdx;
                      if (diff > rolesArr.length / 2) diff -= rolesArr.length;
                      if (diff < -rolesArr.length / 2) diff += rolesArr.length;
                      setVisualIndex(v => v + diff);
                      handleRoleChange(r);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 w-full aspect-square sm:w-20 sm:h-20 border-2 ${isCurrent ? 'bg-amber-100/90 border-amber-600 shadow-md scale-110 sm:scale-110 z-10' : 'bg-[#fffdf9] border-[#d6c7ab] hover:border-amber-600 hover:bg-[#fbf7ee] opacity-80 hover:opacity-100'}`}
                  >
                    <div className={`mb-1 drop-shadow-sm flex items-center justify-center ${isCurrent ? 'text-amber-800' : 'text-[#6b5a4b]'}`}>
                      {QuickIcon ? (
                        <QuickIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                      ) : (
                        <span className="text-xl sm:text-3xl">{ROLE_DESCRIPTIONS[r]?.icon}</span>
                      )}
                    </div>
                    <div className={`text-[9px] sm:text-[11px] font-black tracking-widest ${isCurrent ? 'text-[#3c2415]' : 'text-[#6b5a4b]'}`}>{r}</div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center mt-4">
              <button
                onClick={nextStep}
                style={{ backgroundColor: currentTheme.accent }}
                className="group relative px-10 py-4 text-white font-black tracking-[0.2em] rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-[-20deg]"></div>
                確認定位 <ChevronRight size={20} />
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-300 max-w-3xl relative">
            <div className="flex-1 overflow-y-auto pr-1 pb-16 space-y-6 custom-scrollbar">
              <div className="bg-amber-50 border-l-4 border-amber-600 p-4 rounded text-amber-900 shadow-sm border border-amber-200">
                <h3 className="font-bold mb-1">步驟 2：分配等級與階級</h3>
                <p className="text-sm">切換下方的等級與階級時，系統會自動為你結算基礎數值的成長，並解鎖對應的天賦里程碑！</p>
              </div>

              <div className="bg-[#fffdf9] p-5 rounded-xl border border-[#d6c7ab] shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[11px] font-bold text-amber-900 tracking-widest bg-amber-100 px-2 py-0.5 rounded border border-amber-300">即時體質監控</span>
                  <div className="h-px bg-[#d6c7ab] flex-1"></div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-4 gap-2">
                    {[{ label: 'DEX', val: finalStats.DEX, c: 'text-blue-800' }, { label: 'INS', val: finalStats.INS, c: 'text-emerald-800' }, { label: 'MIG', val: finalStats.MIG, c: 'text-red-800' }, { label: 'WLP', val: finalStats.WLP, c: 'text-purple-800' }].map(s => (
                      <div key={s.label} className="bg-[#f8f3e6] border border-[#e2d6c1] p-2 text-center rounded-lg shadow-sm"><div className="text-[10px] text-[#7c6a58] font-bold tracking-widest">{s.label}</div><div className={`text-lg md:text-xl font-bold ${s.c} drop-shadow-sm leading-none mt-1`}>{s.val}</div></div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center bg-[#f8f3e6] border border-[#e2d6c1] p-3 rounded-lg shadow-sm">
                    <div className="flex gap-4 md:gap-8 px-2 md:px-4">
                      <div className="flex flex-col items-center"><span className="text-[10px] text-[#7c6a58] font-bold tracking-widest">HP</span><span className="text-sm md:text-base font-bold text-red-700 leading-none mt-1">{finalStats.HP}</span></div>
                      <div className="w-px bg-[#d6c7ab]"></div>
                      <div className="flex flex-col items-center"><span className="text-[10px] text-[#7c6a58] font-bold tracking-widest">MP</span><span className="text-sm md:text-base font-bold text-blue-700 leading-none mt-1">{finalStats.MP}</span></div>
                    </div>
                    <div className="flex gap-4 md:gap-8 px-2 md:px-4">
                      <div className="flex flex-col items-center"><span className="text-[10px] text-[#7c6a58] font-bold tracking-widest">先攻</span><span className="text-sm md:text-base font-bold text-amber-700 leading-none mt-1">{finalStats.Init}</span></div>
                      <div className="w-px bg-[#d6c7ab]"></div>
                      <div className="flex flex-col items-center"><span className="text-[10px] text-[#7c6a58] font-bold tracking-widest">物防</span><span className="text-sm md:text-base font-bold text-[#2c221e] leading-none mt-1">{finalStats.Def}</span></div>
                      <div className="w-px bg-[#d6c7ab]"></div>
                      <div className="flex flex-col items-center"><span className="text-[10px] text-[#7c6a58] font-bold tracking-widest">魔防</span><span className="text-sm md:text-base font-bold text-purple-800 leading-none mt-1">{finalStats.MDef}</span></div>
                    </div>
                  </div>
                </div>

                {displayMilestones.length > 0 && (
                  <div className="mt-8 border-t border-[#d6c7ab] pt-6">
                    <h4 className="text-sm font-bold text-amber-900 mb-4 flex items-center gap-2"><Star size={18} className="fill-amber-500/20 text-amber-700" /> 達到等級解鎖的天賦里程碑</h4>
                    <div className="space-y-3">
                      {displayMilestones.map(skill => (
                        <div key={skill.id} className={`bg-[#f9f5eb] border ${skill.isSystem ? 'border-amber-300' : 'border-amber-400'} rounded-lg p-4 flex flex-col gap-2 relative overflow-hidden group hover:bg-[#f4ebd9] transition-colors shadow-sm`}>
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${skill.isSystem ? 'bg-amber-600' : 'bg-amber-700'}`}></div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pl-2">
                            <span className={`${skill.isSystem ? 'bg-amber-700 text-white' : 'bg-amber-800 text-white'} text-[11px] font-extrabold px-2 py-0.5 rounded shadow-sm w-fit shrink-0`}>Lv. {skill.unlockLevel}</span>
                            <span className="font-bold text-[#3c2415] text-[15px]">{skill.originalName.replace(/Lv\.\d+\s解鎖天賦：/, '')}</span>
                          </div>
                          <div className="text-sm text-[#3c2f21] leading-relaxed pl-2 mt-1">{renderFormattedText(skill.originalDesc, skill.selections, state.level, state.partyLevel)}</div>

                          {!skill.isSystem && skill.selectionsConfig && skill.selectionsConfig.length > 0 && (
                            <div className="mt-2 pl-2 pt-2 border-t border-[#d6c7ab] flex flex-wrap gap-3">
                              {skill.selectionsConfig.map(cfg => {
                                if (cfg.showIfKey && (!skill.selections || !skill.selections[cfg.showIfKey] || !skill.selections[cfg.showIfKey].includes(cfg.showIfValue))) return null;
                                return (
                                  <div key={cfg.key} className="flex items-center gap-2 bg-[#fffdf9] rounded-lg pr-2 border border-[#d6c7ab] overflow-hidden shadow-sm">
                                    <span className="text-[10px] font-bold text-amber-900 tracking-widest uppercase bg-amber-100 px-2 py-1.5 h-full flex items-center border-r border-amber-300">{cfg.label}</span>
                                    <select
                                      className="bg-transparent border-none text-xs text-[#2c221e] focus:outline-none cursor-pointer py-1"
                                      value={skill.selections?.[cfg.key] || ""}
                                      onChange={(e) => updateSelection(skill.id, cfg.key, e.target.value)}
                                    >
                                      <option value="" className="bg-[#fffdf9] text-[#6b5a4b]">選擇...</option>
                                      {cfg.options.map(opt => <option key={opt} value={opt} className="bg-[#fffdf9] text-[#2c221e]">{opt}</option>)}
                                    </select>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative mt-6 bg-[#f4ebd9]/95 backdrop-blur-md p-4 md:p-6 rounded-xl border border-[#d6c7ab] shadow-md">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-[#3c2415] mb-2 font-bold tracking-widest flex items-center gap-2">等級 (Level)</label>
                  <div className="relative">
                    <select className="w-full bg-[#fffdf9] border-2 border-[#d6c7ab] rounded-lg p-3 text-[#2c221e] outline-none focus:border-amber-600 transition-colors cursor-pointer appearance-none font-bold" value={state.level} onChange={handleLevelChange}>{LEVELS.map(l => <option key={l} value={l}>Lv. {l}</option>)}</select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-700 w-5 h-5 pointer-events-none" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-[#3c2415] mb-2 font-bold tracking-widest flex items-center gap-2">階級 (Rank)</label>
                  <div className="flex flex-col gap-3">
                    <div className="flex bg-[#fffdf9] border-2 border-[#d6c7ab] rounded-xl p-1 gap-1 shadow-inner relative overflow-hidden">
                      {RANKS.map(r => (
                        <button
                          key={r}
                          onClick={() => handleRankChange(r)}
                          className={`flex-1 py-3 px-2 rounded-lg text-[11px] font-black transition-all duration-300 tracking-widest relative z-10 ${state.rank === r
                            ? 'bg-amber-700 text-white shadow-md scale-[1.02]'
                            : 'text-[#6b5a4b] hover:text-[#2c221e] hover:bg-[#f5efdf]'
                            }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>

                    {state.rank === "冠位" && (
                      <div className="bg-[#f9f5eb] border border-[#d6c7ab] p-4 rounded-xl animate-in slide-in-from-top-4 fade-in duration-500 shadow-sm relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-10 rotate-12 pointer-events-none text-amber-800"><Crown size={80} /></div>

                        <div className="flex items-center justify-between mb-4 relative z-10">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-amber-900 tracking-[0.2em] uppercase">冠位等級 / Champion Level</span>
                            <span className="text-[9px] text-[#6b5a4b] font-bold mt-0.5">此級別將倍增 HP 並增加可配置技能數</span>
                          </div>
                          <div className="bg-[#fffdf9] px-3 py-1 rounded-full border border-[#d6c7ab] shadow-sm">
                            <span className="text-xs font-black text-amber-900 font-mono tracking-tighter">HP x{state.championMultiplier}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 relative z-10">
                          {[1, 2, 3, 4, 5, 6].map(num => (
                            <button
                              key={num}
                              onClick={() => handleMultiplierChange(num)}
                              className={`flex-1 h-12 rounded-lg font-black text-base transition-all duration-300 flex items-center justify-center border-2 ${state.championMultiplier === num
                                ? 'bg-amber-700 text-white border-amber-800 shadow-md scale-110'
                                : 'bg-[#fffdf9] text-[#6b5a4b] border-[#d6c7ab] hover:border-amber-600 hover:text-[#2c221e]'
                                }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>

                        <div className="mt-4 flex items-center gap-2 px-1">
                          <div className="h-px bg-cyan-900/50 flex-1"></div>
                          <p className="text-[10px] text-cyan-600/80 font-bold italic tracking-tight">冠位 ({state.championMultiplier})：當前可額外配置 {state.championMultiplier} 個定位技能</p>
                          <div className="h-px bg-cyan-900/50 flex-1"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 animate-in fade-in duration-300 max-w-3xl pb-10">
            <div className="bg-[#f5efdf] border-l-4 border-amber-700 p-4 rounded text-[#2c221e] border border-[#d6c7ab] shadow-sm">
              <h3 className="font-bold mb-1 text-[#3c2415]">步驟 3：設定物種 (Species)</h3>
              <p className="text-sm text-[#574c43]">物種決定了 NPC 的基本屬性、抗性加成以及獨特能力。</p>
            </div>

            <div className={`p-6 md:p-8 rounded-xl border transition-all duration-300 ${state.selectedSpeciesId ? 'bg-[#fffdf9] border-[#d6c7ab] shadow-md' : 'bg-[#fffdf9]/60 border-[#d6c7ab] opacity-70'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${state.selectedSpeciesId ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-[#eee6d3] text-[#6b5a4b]'}`}>
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#3c2415] tracking-widest">物種選擇</h3>
                  <p className="text-xs text-[#6b5a4b]">從 8 種大類中選擇 NPC 的起源。</p>
                </div>
              </div>

              {/* Species Selector Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {SPECIES_DATA.map(sp => {
                  const theme = SPECIES_THEMES[sp.id] || { color: 'gray', icon: <Users size={20} />, label: 'UNKNOWN' };
                  const isSelected = state.selectedSpeciesId === sp.id;

                  return (
                    <button
                      key={sp.id}
                      onClick={() => handleSpeciesChange(sp.id)}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 ${isSelected ? 'bg-amber-100/90 border-amber-600 shadow-md scale-[1.03] z-10' : 'bg-[#fffdf9] border-[#d6c7ab] hover:border-amber-600 hover:bg-[#fbf7ee]'}`}
                    >
                      <div className={`p-2.5 rounded-full mb-2 transition-all ${isSelected ? 'bg-amber-700 text-white' : 'bg-[#eee6d3] text-[#6b5a4b]'}`}>
                        {theme.icon}
                      </div>
                      <span className={`text-[12px] font-bold tracking-tight text-center leading-tight ${isSelected ? 'text-[#3c2415]' : 'text-[#6b5a4b]'}`}>
                        {sp.name.includes(' ') ? sp.name.split(' ')[0] : sp.name}
                      </span>
                      <span className={`text-[9px] font-black tracking-[1px] mt-0.5 ${isSelected ? 'text-amber-800' : 'text-[#8c7b6c]'}`}>
                        {theme.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {state.selectedSpeciesId && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
                  {(() => {
                    const sp = SPECIES_DATA.find(s => s.id === state.selectedSpeciesId);
                    if (!sp) return null;
                    const selectedTheme = SPECIES_THEMES[sp.id] || { color: 'gray', icon: <Users size={20} />, bg: 'bg-[#f5efdf]', border: 'border-[#d6c7ab]', text: 'text-[#3c2415]', label: 'UNKNOWN' };

                    return (
                      <>
                        <div className={`p-5 rounded-xl border-2 animate-in fade-in slide-in-from-top-2 duration-500 shadow-sm ${selectedTheme.bg} ${selectedTheme.border}`}>
                          <div className="flex items-center gap-4 mb-4">
                            <div className={`p-3 rounded-xl bg-[#fffdf9] ${selectedTheme.text} border border-[#d6c7ab] shadow-sm`}>
                              {selectedTheme.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className={`text-lg font-black tracking-[2px] ${selectedTheme.text}`}>{sp.name}</h4>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded bg-[#fffdf9] ${selectedTheme.text} border border-[#d6c7ab] tracking-[1px]`}>{selectedTheme.label}</span>
                              </div>
                              <p className="text-[10px] font-bold text-[#6b5a4b] tracking-widest uppercase mt-0.5">固定物種特性 FIXED TRAITS</p>
                            </div>
                          </div>
                          <p className="text-sm text-[#2c221e] leading-relaxed font-medium pl-3 border-l-2 border-amber-700 italic">
                            {sp.fixedDesc || "此物種無額外的固定特性。"}
                          </p>
                        </div>

                        {sp.mandatorySelections.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sp.mandatorySelections.map(cfg => (
                              <div key={cfg.key} className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold text-[#6b5a4b] tracking-wider flex items-center gap-1.5 uppercase">
                                  <Sparkles size={12} className="text-amber-700" /> {cfg.label}
                                </label>
                                {(cfg.type === 'multiselect_2' || cfg.type === 'multiselect') ? (
                                  <div className="flex flex-wrap gap-2">
                                    {cfg.options.map(option => {
                                      const selectedItems = state.speciesConfig[cfg.key] || [];
                                      const isSel = Array.isArray(selectedItems) ? selectedItems.includes(option) : selectedItems === option;
                                      const max = cfg.type === 'multiselect_2' ? 2 : 99;
                                      return (
                                        <button
                                          key={option}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2 ${isSel ? 'bg-amber-700 border-amber-800 text-white shadow-sm' : 'bg-[#fffdf9] border-[#d6c7ab] text-[#6b5a4b] hover:border-amber-600'}`}
                                          onClick={() => handleSpeciesConfigMultiToggle(cfg.key, option, max)}
                                        >
                                          {isSel && <span className="mr-1">✓</span>}
                                          {option}
                                        </button>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <select
                                    className="bg-[#fffdf9] border border-[#d6c7ab] p-2.5 rounded text-sm text-[#2c221e] focus:border-amber-600 outline-none font-bold"
                                    value={state.speciesConfig[cfg.key] || ''}
                                    onChange={(e) => handleSpeciesConfigChange(cfg.key, e.target.value)}
                                  >
                                    <option value="">選擇...</option>
                                    {cfg.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {sp.optionalDrawback && (
                          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                            <label className="text-[11px] font-bold text-red-800 tracking-wider flex items-center gap-1.5 uppercase mb-3 text-center">
                              ⚠️ 額外代償選項
                            </label>
                            <p className="text-xs text-[#574c43] mb-3 text-center italic">{sp.optionalDrawback.desc}</p>
                            <div className="flex justify-center">
                              <select
                                className="bg-[#fffdf9] border border-red-300 p-2 rounded text-sm text-red-900 focus:border-red-600 outline-none min-w-[200px] font-bold"
                                value={state.speciesConfig[sp.optionalDrawback.selectionConfig.key] || '無'}
                                onChange={(e) => handleSpeciesConfigChange(sp.optionalDrawback.selectionConfig.key, e.target.value)}
                              >
                                <option value="無">-- 不啟動代價 --</option>
                                {sp.optionalDrawback.selectionConfig.options.filter(o => o !== '無').map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            </div>
                          </div>
                        )}

                        {(() => {
                          const drawbackVal = state.speciesConfig[sp.benefitsConfig.conditionKey] || '無';
                          const isConditionMet = !sp.benefitsConfig.conditionKey || drawbackVal !== '無';

                          if (!isConditionMet) {
                            return (
                              <div className="bg-[#f5efdf] border border-dashed border-[#d6c7ab] p-8 rounded-lg text-center">
                                <Lock size={24} className="mx-auto mb-2 text-[#8c7b6c]" />
                                <p className="text-xs text-[#8c7b6c] font-bold uppercase tracking-widest">選取上方代價以解鎖物種增益</p>
                              </div>
                            );
                          }

                          const selectedCount = (state.speciesConfig.selectedBenefits || []).length;
                          const maxPicks = sp.benefitsConfig.maxPicks;

                          return (
                            <div className="space-y-4">
                              <div className="flex justify-between items-center border-b border-[#d6c7ab] pb-2">
                                <label className="text-[11px] font-black text-amber-900 tracking-widest uppercase flex items-center gap-2">
                                  <Star size={14} /> 物種增益選擇 (Pick {maxPicks})
                                </label>
                                <span className={`text-[11px] font-black tracking-widest px-2 py-0.5 rounded ${selectedCount >= maxPicks ? 'bg-amber-700 text-white' : 'bg-[#eee6d3] text-[#6b5a4b]'}`}>
                                  {selectedCount} / {maxPicks}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 gap-4">
                                {sp.benefitsConfig.options.map(opt => {
                                  const count = (state.speciesConfig.selectedBenefits || []).filter(b => b === opt.id).length;
                                  const isChecked = count > 0;
                                  const isFull = selectedCount >= maxPicks;
                                  const isDisabled = !isChecked && isFull;

                                  return (
                                    <div key={opt.id} className="space-y-3">
                                      <div
                                        className={`p-4 rounded-xl border-2 transition-all flex flex-col gap-3 relative overflow-hidden ${isChecked ? 'bg-amber-50/80 border-amber-600 shadow-md' : isDisabled ? 'bg-stone-100/50 border-stone-300 opacity-50 cursor-not-allowed' : 'bg-[#fffdf9] border-[#d6c7ab] hover:border-amber-600 hover:bg-[#fbf7ee] cursor-pointer'}`}
                                        onClick={() => !isDisabled && handleBenefitToggle(opt.id, maxPicks, opt.canPickTwice)}
                                      >
                                        <div className="flex items-center gap-4">
                                          {opt.canPickTwice ? (
                                            <div className="flex items-center gap-1.5 shrink-0">
                                              {[1, 2].map(i => (
                                                <div key={i} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${count >= i ? 'bg-amber-700 border-amber-800 text-white' : 'border-[#d6c7ab]'}`}>
                                                  {count >= i && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${isChecked ? 'bg-amber-700 border-amber-800 text-white' : 'border-[#d6c7ab]'}`}>
                                              {isChecked && <CheckCircle2 size={16} className="text-white" strokeWidth={3} />}
                                            </div>
                                          )}
                                          <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                              <p className={`text-[13px] font-bold leading-relaxed ${isChecked ? 'text-[#3c2415]' : 'text-[#574c43]'}`}>{renderFormattedText(opt.text, state.speciesConfig, state.level, state.partyLevel)}</p>
                                              {opt.canPickTwice && isChecked && (
                                                <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300 ml-2">累計: {count}/2</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Selection Area (Multiselect / Select / Text) */}
                                      {isChecked && opt.needsSelection && opt.selectionConfig?.type !== 'spellbook' && (
                                        <div className="pl-10 pb-2 space-y-3 animate-in slide-in-from-top-2 duration-300">
                                          {opt.selectionConfig.type === 'text' && (
                                            <div className="max-w-md mt-1">
                                              <input
                                                type="text"
                                                className="w-full bg-[#fffdf9] border border-[#d6c7ab] p-2 rounded text-sm text-[#2c221e] focus:border-amber-600 outline-none placeholder-[#8c7b6c] font-bold"
                                                placeholder={opt.selectionConfig.placeholder || ""}
                                                value={state.speciesConfig[opt.selectionConfig.key] || ''}
                                                onChange={(e) => handleSpeciesConfigChange(opt.selectionConfig.key, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                              />
                                            </div>
                                          )}
                                          {(opt.selectionConfig.type === 'multiselect_2' || opt.selectionConfig.type === 'multiselect') && (
                                            <div className="flex flex-wrap gap-2">
                                              {opt.selectionConfig.options.map(option => {
                                                const selectedItems = state.speciesConfig[opt.selectionConfig.key] || [];
                                                const isSel = selectedItems.includes(option);
                                                const max = opt.selectionConfig.type === 'multiselect_2' ? 2 : 99;
                                                return (
                                                  <button
                                                    key={option}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2 ${isSel ? 'bg-amber-700 border-amber-800 text-white shadow-sm' : 'bg-[#fffdf9] border-[#d6c7ab] text-[#6b5a4b] hover:border-amber-600'}`}
                                                    onClick={() => handleSpeciesConfigMultiToggle(opt.selectionConfig.key, option, max)}
                                                  >
                                                    {isSel && <span className="mr-1">✓</span>}
                                                    {option}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          )}
                                          {opt.selectionConfig.type === 'select' && (
                                            <div className="max-w-xs">
                                              <select
                                                className="w-full bg-[#fffdf9] border border-[#d6c7ab] p-2 rounded text-sm text-[#2c221e] focus:border-amber-600 outline-none font-bold"
                                                value={state.speciesConfig[opt.selectionConfig.key] || ''}
                                                onChange={(e) => handleSpeciesConfigChange(opt.selectionConfig.key, e.target.value)}
                                              >
                                                <option value="">選擇...</option>
                                                {(() => {
                                                  let finalOptions = opt.selectionConfig.options;
                                                  if (state.selectedSpeciesId === 'sp_demon' && opt.id === 'b1') {
                                                    const chosenResists = Array.isArray(state.speciesConfig?.sp_demon_resists) ? state.speciesConfig.sp_demon_resists : (state.speciesConfig?.sp_demon_resists ? [state.speciesConfig.sp_demon_resists] : []);
                                                    finalOptions = chosenResists;
                                                  } else if (state.selectedSpeciesId === 'sp_element' && opt.id === 'b1') {
                                                    const chosenImm = state.speciesConfig?.sp_element_immune;
                                                    finalOptions = ['毒', chosenImm].filter(Boolean);
                                                  }
                                                  return finalOptions.map(o => <option key={o} value={o}>{o}</option>);
                                                })()}
                                              </select>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Selection Area (Spellbook) */}
                                      {isChecked && opt.needsSelection && opt.selectionConfig?.type === 'spellbook' && (
                                        <div className="pl-10 grid grid-cols-1 md:grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300">
                                          {opt.selectionConfig.options.map(spellName => {
                                            const isSelected = state.speciesConfig[opt.selectionConfig.key] === spellName;
                                            const isClaimedElsewhere = allLearnedSpells.includes(spellName) && !isSelected;
                                            const hasSelectedAny = !!state.speciesConfig[opt.selectionConfig.key];
                                            const levelMatch = spellName.match(/\(Lv(\d+)\+\)/);
                                            const reqLevel = levelMatch ? parseInt(levelMatch[1], 10) : 0;
                                            const isLevelLocked = state.level < reqLevel;
                                            const isDisabled = isLevelLocked || (!isSelected && hasSelectedAny);
                                            return (
                                              <SpellCard
                                                key={spellName}
                                                skillId="species_spell"
                                                spellName={spellName}
                                                isActive={isSelected}
                                                isDisabled={isDisabled}
                                                isOverBudget={isSelected && isLevelLocked}
                                                isClaimedElsewhere={isClaimedElsewhere}
                                                onToggle={() => !isClaimedElsewhere && handleSpeciesConfigChange(opt.selectionConfig.key, isSelected ? '' : spellName)}
                                                npcLevel={state.level}
                                                partyLevel={state.partyLevel}
                                                selections={state.speciesConfig?.spellSelections?.[spellName] || (state.speciesConfig?.spellSelections?.customName !== undefined ? state.speciesConfig.spellSelections : {})}
                                                selectionsConfig={SPELLS_DATA[spellName.replace(/\(Lv30\+\)/g, '').trim()]?.selectionsConfig}
                                                onSelectionChange={(skillId, spName, key, value) => handleSpeciesSpellSelectionChange(spName, key, value)}
                                              />
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl pb-10">
            <div className="bg-[#f5efdf] border-l-4 border-amber-700 p-4 rounded text-[#2c221e] border border-[#d6c7ab] shadow-sm">
              <h3 className="font-bold mb-1 text-[#3c2415]">步驟 4：調整數值與能力</h3>
              <p className="text-sm text-[#574c43]">系統會根據你的定位與等級自動為你計算可用額度。請展開下方區塊完成配置。</p>
            </div>
            {/* Step 4 Sub-tabs */}
            <div className="flex bg-[#e8dec8] rounded-xl p-1 gap-1 border border-[#d6c7ab] shadow-inner">
              {[
                { id: 'stats', label: '基礎數值與相性', emoji: '🎲' },
                { id: 'skills', label: '攻擊與技能庫', emoji: '⚔️' },
                { id: 'spells', label: '咒語與自訂能力', emoji: '🔮' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStep4SubTab(tab.id)}
                  className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-black tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    step4SubTab === tab.id
                      ? 'bg-[#fbf7ee] text-[#2c221e] shadow-sm'
                      : 'text-[#6b5a4b] hover:text-[#2c221e] hover:bg-[#dfd3bc]/60'
                  }`}
                  style={step4SubTab === tab.id ? { borderBottom: `2px solid ${currentTheme.accent}` } : {}}
                >
                  <span>{tab.emoji}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.id === 'stats' ? '數值' : tab.id === 'skills' ? '技能' : '咒語'}</span>
                </button>
              ))}
            </div>

            {/* Sub-tab: 基礎數值與相性 */}
            {step4SubTab === 'stats' && (
              <div className="space-y-6">

            {/* Attribute Dice Customization Card (僅在開啟自定義模式時顯示) */}
            {state.isFreeModeEnabled && (
              <div className="p-5 md:p-6 rounded-xl border-2 transition-all duration-300 relative overflow-hidden bg-fuchsia-50/80 border-fuchsia-400 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-[#d6c7ab] pb-4">
                  <div>
                    <h4 className="text-base md:text-lg font-black tracking-widest text-[#3c2415] flex items-center gap-2">
                      <Sparkles size={20} className="text-fuchsia-700 animate-pulse" />
                      自定義 NPC 體質與基礎骰子
                    </h4>
                    <p className="text-xs text-[#6b5a4b] mt-1 leading-relaxed">
                      🔓 自定義模式已啟動：可自由調整 DEX, INS, MIG, WLP 骰子大小。HP/MP/物防/魔防將自動連動計算調整。
                    </p>
                  </div>
                  {state.customDice && Object.keys(state.customDice).some(k => state.customDice[k]) && (
                    <button
                      type="button"
                      onClick={() => setState(prev => ({ ...prev, customDice: {} }))}
                      className="px-3 py-1.5 text-xs font-bold text-[#3c2f21] hover:text-[#2c221e] bg-[#eee6d3] hover:bg-[#e4d9c0] border border-[#d6c7ab] rounded-lg transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-sm"
                    >
                      <RotateCcw size={14} /> 重置體質骰子
                    </button>
                  )}
                </div>

                {/* Attribute Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  {[
                    { key: 'DEX', label: '靈巧 (DEX)', color: 'text-blue-900 border-blue-200 bg-blue-50/50', defaultDie: (ROLES_DATA[state.role]?.levels[state.level]?.dex || ROLES_DATA[state.role]?.base?.DEX) },
                    { key: 'INS', label: '洞察 (INS)', color: 'text-emerald-900 border-emerald-200 bg-emerald-50/50', defaultDie: (ROLES_DATA[state.role]?.levels[state.level]?.ins || ROLES_DATA[state.role]?.base?.INS) },
                    { key: 'MIG', label: '力量 (MIG)', color: 'text-red-900 border-red-200 bg-red-50/50', defaultDie: (ROLES_DATA[state.role]?.levels[state.level]?.mig || ROLES_DATA[state.role]?.base?.MIG) },
                    { key: 'WLP', label: '意志 (WLP)', color: 'text-purple-900 border-purple-200 bg-purple-50/50', defaultDie: (ROLES_DATA[state.role]?.levels[state.level]?.wlp || ROLES_DATA[state.role]?.base?.WLP) }
                  ].map(attr => {
                    const currentDie = finalStats[attr.key];
                    const isCustomized = state.customDice?.[attr.key] && state.customDice[attr.key] !== attr.defaultDie;
                    const parseDice = d => parseInt(String(d).replace('d', ''), 10) || 8;
                    const roleData = ROLES_DATA[state.role];

                    let impactText = "";
                    if (attr.key === 'MIG') {
                      const diff = parseDice(currentDie) - parseDice(attr.defaultDie);
                      const mult = state.rank === '精英' ? 2 : state.rank === '冠位' ? state.championMultiplier : 1;
                      const hpChange = diff * 5 * mult;
                      impactText = `HP ${hpChange >= 0 ? '+' : ''}${hpChange} (${diff >= 0 ? '+' : ''}${diff * 5} Base)`;
                    } else if (attr.key === 'WLP') {
                      const diff = parseDice(currentDie) - parseDice(attr.defaultDie);
                      const mult = state.rank === '冠位' ? 2 : 1;
                      const mpChange = diff * 5 * mult;
                      impactText = `MP ${mpChange >= 0 ? '+' : ''}${mpChange} (${diff >= 0 ? '+' : ''}${diff * 5} Base)`;
                    } else if (attr.key === 'DEX') {
                      impactText = `物防 Base = ${parseDice(currentDie)} + ${roleData.base.def}`;
                    } else if (attr.key === 'INS') {
                      impactText = `魔防 Base = ${parseDice(currentDie)} + ${roleData.base.mdef}`;
                    }

                    return (
                      <div key={attr.key} className={`p-3.5 rounded-xl border flex flex-col gap-2.5 ${attr.color} relative shadow-sm`}>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black tracking-wider uppercase">{attr.label}</span>
                          {isCustomized ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900">
                              已自定義
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold opacity-70">
                              預設 {attr.defaultDie}
                            </span>
                          )}
                        </div>

                        {/* Dice Selector Buttons */}
                        <div className="grid grid-cols-4 gap-1">
                          {['d6', 'd8', 'd10', 'd12'].map(die => {
                            const isActive = currentDie === die;
                            const isDefault = attr.defaultDie === die;
                            return (
                              <button
                                key={die}
                                type="button"
                                onClick={() => {
                                  setState(prev => ({
                                    ...prev,
                                    customDice: {
                                      ...(prev.customDice || {}),
                                      [attr.key]: die === attr.defaultDie ? undefined : die
                                    }
                                  }));
                                }}
                                className={`py-1.5 text-xs font-black rounded transition-all duration-200 relative ${
                                  isActive
                                    ? 'bg-amber-700 text-white font-extrabold shadow-sm scale-105 z-10'
                                    : 'bg-[#fffdf9] hover:bg-amber-50 text-[#3c2f21] border border-[#d6c7ab]'
                                }`}
                              >
                                {die}
                                {isDefault && (
                                  <span className="absolute -top-1 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-600" title="預設體質" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        <div className="text-[11px] font-bold opacity-80 text-center tracking-tight pt-1.5 border-t border-black/10">
                          {impactText}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 反派等級 (Villain Tier) */}
            <div className="bg-[#fffdf9] border border-[#d6c7ab] rounded-xl p-6 shadow-sm overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-[0.05] text-8xl pointer-events-none group-hover:scale-110 transition-transform">🔥</div>
              <label className="block text-sm text-[#3c2415] mb-4 font-bold tracking-[0.2em] flex items-center gap-2 uppercase">
                <Crown size={18} className="text-amber-700" /> 反派等級 (Villain Tier)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(VILLAIN_TIERS).map(([key, tier]) => (
                  <button
                    key={key}
                    onClick={() => setState(prev => ({ ...prev, villainTier: key }))}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${state.villainTier === key ? `${tier.border} ${tier.bg} ${tier.color} shadow-md scale-105 z-10` : 'border-[#d6c7ab] bg-[#fffdf9] text-[#6b5a4b] hover:border-amber-600 hover:text-[#2c221e]'}`}
                  >
                    <span className="text-xs font-black tracking-widest mb-1">{tier.label}</span>
                    <span className="text-[10px] font-bold opacity-80">{tier.up} UP</span>
                  </button>
                ))}
              </div>
              {state.villainTier !== 'none' && (
                <div className={`mt-4 text-[11px] font-bold ${VILLAIN_TIERS[state.villainTier].color} flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2`}>
                  <AlertCircle size={12} /> 已賦予 {VILLAIN_TIERS[state.villainTier].up} 點終極點數，可用於發動反派能力。
                </div>
              )}
            </div>

            {/* 屬性相性配置 */}
            <div className="bg-[#fffdf9] border border-[#d6c7ab] rounded-lg p-4 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b border-[#d6c7ab] pb-2">
                <h2 className="text-sm font-bold text-amber-900">屬性相性配置</h2>
                {bonusSkillFromNegative > 0 && (
                  <div className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full font-bold shadow-sm">
                    (包含負面技能獎勵 +{bonusSkillFromNegative})
                  </div>
                )}
              </div>

              <div className="flex gap-2 mb-4">
                {['vul', 'res', 'imm', 'abs'].map(st => {
                  const max = affinityBudgets[st];
                  const curr = currentAffinities[st];
                  const isFull = curr >= max;
                  const isDisabled = !state.isFreeModeEnabled && (max === 0 && curr === 0);
                  const isActive = activeAffinityTab === st;
                  const conf = {
                    vul: { l: '弱點 VUL', c: 'text-red-800', activeBorder: 'border-red-600', activeBg: 'bg-red-50' },
                    res: { l: '抗性 RES', c: 'text-amber-900', activeBorder: 'border-amber-600', activeBg: 'bg-amber-50' },
                    imm: { l: '免疫 IMM', c: 'text-sky-900', activeBorder: 'border-sky-600', activeBg: 'bg-sky-50' },
                    abs: { l: '吸收 ABS', c: 'text-emerald-900', activeBorder: 'border-emerald-600', activeBg: 'bg-emerald-50' }
                  };
                  return (
                    <button key={st} onClick={() => !isDisabled && setActiveAffinityTab(st)} disabled={isDisabled} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-t-lg border-b-4 transition-all duration-200 ${isDisabled ? 'opacity-40 cursor-not-allowed border-[#d6c7ab] bg-stone-100 grayscale' : isActive ? `${conf[st].activeBorder} ${conf[st].activeBg} shadow-sm scale-105 z-10` : 'border-[#d6c7ab] bg-[#f5efdf] hover:bg-[#eee6d3]'}`}>
                      <span className={`text-[10px] sm:text-xs font-bold mb-1 ${isDisabled ? 'text-[#8c7b6c]' : conf[st].c}`}>{conf[st].l}</span>
                      <span className={`text-sm font-extrabold ${!isDisabled && isFull && max > 0 && !state.isFreeModeEnabled ? 'text-amber-800 font-black' : isDisabled ? 'text-[#8c7b6c]' : 'text-[#2c221e]'}`}>{curr} <span className="text-[#8c7b6c] font-normal mx-0.5">/</span> {state.isFreeModeEnabled ? '∞' : max}</span>
                    </button>
                  );
                })}
              </div>

              <div className={`grid grid-cols-3 md:grid-cols-5 gap-3 p-4 rounded-b-lg rounded-tr-lg border-2 bg-[#f9f5eb] transition-colors duration-300 ${activeAffinityTab === 'vul' ? 'border-red-300' : activeAffinityTab === 'res' ? 'border-amber-300' : activeAffinityTab === 'imm' ? 'border-sky-300' : activeAffinityTab === 'abs' ? 'border-emerald-300' : 'border-[#d6c7ab]'}`}>
                {DAMAGE_TYPES.map(type => {
                  const playerState = state.affinities[type] || 'normal';
                  const typeStyle = TYPE_STYLES[type];
                  const speciesVal = speciesAffinities[type];
                  const isSpeciesLocked = !!speciesVal;
                  const effectiveState = isSpeciesLocked ? speciesVal : playerState;
                  const style = AFFINITY_STATES[effectiveState];
                  const isCurrentTabFull = currentAffinities[activeAffinityTab] >= affinityBudgets[activeAffinityTab];
                  const isDisabled = isSpeciesLocked || (!state.isFreeModeEnabled && playerState !== activeAffinityTab && isCurrentTabFull);

                  return (
                    <button
                      key={type}
                      onClick={() => !isSpeciesLocked && handleAffinityClick(type)}
                      disabled={isDisabled}
                      className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg border-2 transition-all transform shadow-sm relative ${isSpeciesLocked ? 'opacity-100 border-dashed cursor-default saturate-[1.2] ring-1 ring-amber-600' : isDisabled ? 'opacity-40 cursor-not-allowed saturate-50' : 'hover:scale-105 cursor-pointer'} ${style.bg} ${style.border} ${style.text}`}
                    >
                      {isSpeciesLocked && (
                        <div className="absolute -top-2 -right-2 bg-[#fffdf9] border-2 border-amber-600 text-amber-900 p-1 rounded-full shadow z-20 flex items-center justify-center" title="物種綁定 (Species Bonded)">
                          <Lock size={10} strokeWidth={3} />
                        </div>
                      )}
                      <div className="flex items-center gap-1 sm:gap-2 mb-1.5">
                        <span className={`text-xl sm:text-2xl drop-shadow-sm ${isDisabled && !isSpeciesLocked && playerState === 'normal' ? 'text-[#8c7b6c]' : typeStyle.color}`}>{typeStyle.fuIcon ? <span className="fu-icon">{typeStyle.fuIcon}</span> : typeStyle.emoji}</span>
                        <span className={`text-lg sm:text-xl font-extrabold tracking-widest ${isDisabled && !isSpeciesLocked && playerState === 'normal' ? 'text-[#8c7b6c]' : typeStyle.color}`}>{type}</span>
                      </div>
                      <span className="bg-[#fffdf9] px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold tracking-widest border border-[#d6c7ab] shadow-sm">{style.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 攻擊性咒語檢定公式選擇區塊 */}
            {hasOffensiveSpells && (
              <div className="bg-[#fffdf9] border border-[#d6c7ab] rounded-xl p-5 shadow-sm overflow-hidden relative group animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-[0.05] text-7xl pointer-events-none group-hover:scale-110 transition-transform text-purple-900">🔮</div>
                <label className="block text-sm text-purple-900 mb-3 font-bold tracking-[0.2em] flex items-center gap-2 uppercase">
                  <span className="fu-icon text-lg">c</span> 攻擊性咒語檢定公式 (Offensive Spell Formula)
                </label>
                <p className="text-xs text-[#574c43] mb-4">此 NPC 獲得了攻擊性咒語。請選擇所有攻擊性咒語適用的精確度檢定公式：</p>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  {[
                    { value: '[INS + WLP]', label: '【洞察】+ 【意志】', desc: '標準魔法檢定 (INS + WLP)' },
                    { value: '[MIG + WLP]', label: '【力量】+ 【意志】', desc: '近戰/力量魔法檢定 (MIG + WLP)' }
                  ].map((opt) => {
                    const isSelected = (state.magicFormula || '[INS + WLP]') === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setState(prev => ({ ...prev, magicFormula: opt.value }))}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${isSelected
                          ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-sm scale-[1.02]'
                          : 'border-[#d6c7ab] bg-[#fffdf9] text-[#6b5a4b] hover:border-purple-500 hover:text-[#2c221e]'
                          }`}
                      >
                        <span className="text-xs font-black tracking-widest mb-1">{opt.value}</span>
                        <span className="text-[10px] font-bold opacity-80">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

              </div>
            )}
            {/* Sub-tab: 攻擊與技能庫 */}
            {step4SubTab === 'skills' && (
              <div className="space-y-6">

            {/* 基礎攻擊與核心能力 (Basic Attacks) */}
            {basicAttacksToRender.length > 0 && (
              <SectionAccordion title="基礎攻擊與核心能力" icon={<Swords size={16} />} current={basicAttacksToRender.length} max={basicAttacksToRender.length} hideIfZeroMax={false} titleColor="text-amber-900" borderColor="border-[#d6c7ab]" isFreeMode={state.isFreeModeEnabled}>
                <div className="space-y-4">
                  {basicAttacksToRender.map(skill => (
                    <div key={skill.id} id={`skill-card-${skill.id}`} className={`transition-all duration-300 ${highlightedSkillId === skill.id ? 'ring-4 ring-amber-500 bg-amber-100 rounded-xl p-1 shadow-lg scale-[1.02]' : ''}`}>
                      <EditableSkill skill={skill} rawSkill={validSkills.find(v => v.id === skill.id) || skill} onUpdate={updateSkill} onDelete={deleteSkill} onUpdateSelection={updateSelection} finalStats={finalStats} npcLevel={state.level} partyLevel={state.partyLevel} />
                    </div>
                  ))}
                </div>
              </SectionAccordion>
            )}

            <SectionAccordion title="客製化規則 (Customizations)" icon={<Settings size={16} />} current={usedCustomizations} max={maxCustomizations} hideIfZeroMax={!hasChampSupport} titleColor="text-amber-900" borderColor="border-[#d6c7ab]" isFreeMode={state.isFreeModeEnabled}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ROLES_DATA[state.role].availableSkills.filter(s => s.source === 'customization').map(skill => {
                  const activeSkillData = processedSkills.find(s => s.libId === skill.id);
                  const isActive = !!activeSkillData;

                  const isRankLocked = skill.reqRank && Array.isArray(skill.reqRank) && !skill.reqRank.includes(state.rank);
                  const isLevelLocked = skill.reqLevel && state.level < skill.reqLevel;
                  const isReqLocked = skill.requires && Array.isArray(skill.requires) && !skill.requires.every(reqId => validSkills.some(s => s.libId === reqId));
                  const isRequirementLocked = !state.isFreeModeEnabled && (isRankLocked || isLevelLocked || isReqLocked);
                  const lockedMsg = !state.isFreeModeEnabled ? (
                    isRankLocked ? `需階級：${skill.reqRank.join('/')}` :
                    isLevelLocked ? `需等級：Lv.${skill.reqLevel}` :
                    isReqLocked ? '需前置技能' : null
                  ) : null;

                  const isOverBudget = isActive && activeSkillData?.isOverBudget && !lockedMsg;
                  const isDisabled = isRequirementLocked || (!isActive && !state.isFreeModeEnabled && usedCustomizations >= maxCustomizations);
                  const targetId = activeSkillData?.id || skill.id;

                  return (
                    <div key={skill.id} id={`skill-card-${targetId}`} className={`transition-all duration-300 ${highlightedSkillId === targetId || highlightedSkillId === skill.id ? 'ring-4 ring-amber-500 bg-amber-100 rounded-xl p-1 shadow-lg scale-[1.02]' : ''}`}>
                      <SkillCard
                        skill={activeSkillData || skill}
                        isActive={isActive}
                        isDisabled={isDisabled}
                        isOverBudget={isOverBudget}
                        lockedMsg={lockedMsg}
                        onToggle={() => toggleLibrarySkill(skill)}
                        onSelectionChange={updateSelection}
                        onUpdateSkill={updateSkill}
                        npcLevel={state.level}
                        partyLevel={state.partyLevel}
                      />
                    </div>
                  );
                })}
              </div>
            </SectionAccordion>

            <SectionAccordion title="定位技能 (Role Skills)" icon={<ShieldAlert size={16} />} current={usedRoleSkills} max={maxRoleSkills} hideIfZeroMax={true} titleColor="text-blue-900" borderColor="border-[#d6c7ab]" isFreeMode={state.isFreeModeEnabled}>
              {usedRoleSkillForBoss > 0 && !state.isFreeModeEnabled && (
                <div className="mb-4 bg-amber-50 border border-amber-300 p-3 rounded text-[11px] text-amber-900 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-700" />
                  <span>注意：您已將 {usedRoleSkillForBoss} 個定位技能額度轉換為額外的 Boss 技能。</span>
                </div>
              )}
              {/* Search box for role skills */}
              <div className="mb-3 relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c7b6c] pointer-events-none" />
                <input
                  type="text"
                  placeholder="搜尋定位技能..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#fffdf9] border border-[#d6c7ab] rounded-lg outline-none focus:border-blue-400 text-[#2c221e] placeholder-[#a8987e] transition-colors"
                  value={roleSkillSearch}
                  onChange={e => setRoleSkillSearch(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ROLES_DATA[state.role].availableSkills.filter(s => s.source === 'roleSkill').filter(skill => !roleSkillSearch || (skill.originalName || '').toLowerCase().includes(roleSkillSearch.toLowerCase()) || (skill.originalDesc || '').toLowerCase().includes(roleSkillSearch.toLowerCase())).map(skill => {
                  const activeSkillData = processedSkills.find(s => s.libId === skill.id);
                  const isActive = !!activeSkillData;

                  const isRankLocked = skill.reqRank && Array.isArray(skill.reqRank) && !skill.reqRank.includes(state.rank);
                  const isLevelLocked = skill.reqLevel && state.level < skill.reqLevel;
                  const isReqLocked = skill.requires && Array.isArray(skill.requires) && !skill.requires.every(reqId => validSkills.some(s => s.libId === reqId));
                  const isRequirementLocked = !state.isFreeModeEnabled && (isRankLocked || isLevelLocked || isReqLocked);
                  const lockedMsg = !state.isFreeModeEnabled ? (
                    isRankLocked ? `需階級：${skill.reqRank.join('/')}` :
                    isLevelLocked ? `需等級：Lv.${skill.reqLevel}` :
                    isReqLocked ? '需前置技能' : null
                  ) : null;

                  const isOverBudget = isActive && activeSkillData?.isOverBudget && !lockedMsg;
                  const isDisabled = isRequirementLocked || (!isActive && !state.isFreeModeEnabled && usedRoleSkills >= maxRoleSkills);
                  const targetId = activeSkillData?.id || skill.id;

                  return (
                    <div key={skill.id} id={`skill-card-${targetId}`} className={`transition-all duration-300 ${highlightedSkillId === targetId || highlightedSkillId === skill.id ? 'ring-4 ring-amber-500 bg-amber-100 rounded-xl p-1 shadow-lg scale-[1.02]' : ''}`}>
                      <SkillCard
                        skill={activeSkillData || skill}
                        isActive={isActive}
                        isDisabled={isDisabled}
                        isOverBudget={isOverBudget}
                        lockedMsg={lockedMsg}
                        onToggle={() => toggleLibrarySkill(skill)}
                        onSelectionChange={updateSelection}
                        onUpdateSkill={updateSkill}
                        npcLevel={state.level}
                        partyLevel={state.partyLevel}
                      />
                    </div>
                  );
                })}
              </div>
            </SectionAccordion>

              </div>
            )}
            {/* Sub-tab: 咒語與自訂能力 */}
            {step4SubTab === 'spells' && (
              <div className="space-y-6">

            {allSpellbooksToRender.length > 0 && (
              <SectionAccordion title="咒語書配置 (Spellbook Configuration)" icon={<BookOpen size={16} />} current={allSpellbooksToRender.reduce((sum, s) => sum + (s.selectedSpells || []).length, 0)} max={allSpellbooksToRender.reduce((sum, s) => sum + (s.spellConfig?.capacity || 0), 0)} titleColor="text-purple-900" borderColor="border-[#d6c7ab]" isFreeMode={state.isFreeModeEnabled}>
                <div className="space-y-4">
                  {/* Search box for spells */}
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c7b6c] pointer-events-none" />
                    <input
                      type="text"
                      placeholder="搜尋咒語..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#fffdf9] border border-[#d6c7ab] rounded-lg outline-none focus:border-purple-400 text-[#2c221e] placeholder-[#a8987e] transition-colors"
                      value={spellSearch}
                      onChange={e => setSpellSearch(e.target.value)}
                    />
                  </div>
                  {allSpellbooksToRender.map(skill => (
                    <div key={skill.id} id={`skill-card-${skill.id}`} className={`pt-2 border-t border-[#d6c7ab] mt-4 first:mt-0 first:pt-0 first:border-0 transition-all duration-300 ${highlightedSkillId === skill.id ? 'ring-4 ring-amber-500 bg-amber-100 rounded-xl p-2 shadow-lg scale-[1.02]' : ''}`}>
                      <EditableSkill skill={skill} rawSkill={validSkills.find(v => v.id === skill.id) || skill} onUpdate={updateSkill} onDelete={deleteSkill} onUpdateSelection={updateSelection} finalStats={finalStats} npcLevel={state.level} partyLevel={state.partyLevel} />
                      <div className="flex justify-between items-center mt-3 mb-2 pl-6 pr-2">
                        <span className="text-xs font-bold text-purple-900">已選咒語 ({(skill.selectedSpells || []).length} / {skill.spellConfig.capacity})</span>
                      </div>
                      <div className="pl-6 grid grid-cols-1 gap-3 border-l-2 border-purple-300">
                        {skill.spellConfig.options.filter(spellName => !spellSearch || spellName.toLowerCase().includes(spellSearch.toLowerCase())).map(spellName => {
                          const isSelected = (skill.selectedSpells || []).some(sp => (typeof sp === 'string' ? sp : sp.name) === spellName);
                          const isClaimedElsewhere = allLearnedSpells.includes(spellName) && !isSelected;
                          const isAtCapacity = (skill.selectedSpells || []).length >= skill.spellConfig.capacity;
                          const levelMatch = spellName.match(/\(Lv(\d+)\+\)/);
                          const reqLevel = levelMatch ? parseInt(levelMatch[1], 10) : 0;
                          const isLevelLocked = !state.isFreeModeEnabled && reqLevel > 0 && state.level < reqLevel;
                          const lockedMsg = isLevelLocked ? `需等級：Lv.${reqLevel}` : null;
                          const isDisabled = isLevelLocked || (!state.isFreeModeEnabled && !isSelected && isAtCapacity);
                          const overBudgetCheck = state.isFreeModeEnabled ? false : (isSelected && isLevelLocked && !lockedMsg);
                          return (
                            <SpellCard
                              key={spellName}
                              skillId={skill.id}
                              spellName={spellName}
                              isActive={isSelected}
                              isDisabled={isDisabled}
                              isOverBudget={overBudgetCheck}
                              lockedMsg={lockedMsg}
                              isClaimedElsewhere={isClaimedElsewhere}
                              onToggle={() => !isClaimedElsewhere && !isDisabled && toggleSpell(skill.id, spellName, skill.spellConfig.capacity)}
                              selections={(skill.selectedSpells || []).find(sp => (typeof sp === 'string' ? sp : sp.name) === spellName)?.selections || {}}
                              selectionsConfig={SPELLS_DATA[spellName.replace(/\(Lv30\+\)/g, '').trim()]?.selectionsConfig}
                              onSelectionChange={updateSpellSelection}
                              npcLevel={state.level}
                              partyLevel={state.partyLevel}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionAccordion>
            )}

            {/* Custom Abilities Section (Permanent / 常駐) */}
            <SectionAccordion title="✨ 完全自訂技能 (Custom Abilities)" icon={<Sparkles size={16} />} current={state.skills.filter(s => s.id.startsWith('custom_')).length} max={0} titleColor="text-indigo-900" borderColor="border-indigo-300" alwaysComplete={true} isFreeMode={state.isFreeModeEnabled} defaultExpanded={true}>
              <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-xl mb-6 shadow-sm">
                <h4 className="text-indigo-900 text-xs font-bold mb-3 flex items-center gap-2"><PlusCircle size={14} /> 快速新增自訂能力</h4>
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    className="w-full bg-[#fffdf9] text-indigo-950 font-bold p-2 border border-indigo-300 outline-none rounded focus:border-indigo-600 transition-colors"
                    placeholder="能力名稱"
                    value={newCustomSkill.name}
                    onChange={(e) => setNewCustomSkill(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <textarea
                    className="w-full bg-[#fffdf9] text-indigo-950 p-2 border border-indigo-300 outline-none h-20 resize-none rounded text-sm focus:border-indigo-600 transition-colors"
                    placeholder="輸入效果與敘述..."
                    value={newCustomSkill.desc}
                    onChange={(e) => setNewCustomSkill(prev => ({ ...prev, desc: e.target.value }))}
                  />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <select
                        className="bg-[#fbf7ee] text-indigo-950 text-xs font-bold border border-indigo-300 p-2 rounded outline-none focus:border-indigo-600"
                        value={newCustomSkill.category}
                        onChange={(e) => setNewCustomSkill(prev => ({ ...prev, category: e.target.value }))}
                      >
                        <option value="spell">🔮 咒語 (Spell)</option>
                        <option value="action">⚡ 其餘行動 (Action)</option>
                        <option value="rule">📜 特殊規則 (Rule)</option>
                      </select>

                      {newCustomSkill.category === 'spell' && (
                        <div className="flex flex-col gap-3 w-full bg-indigo-100/60 p-3 rounded-lg border border-indigo-200 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-indigo-950 font-bold mb-1">目標 (Target)</label>
                              <select
                                className="w-full bg-[#fffdf9] text-indigo-950 font-bold p-1.5 border border-indigo-300 rounded outline-none focus:border-indigo-600"
                                value={newCustomSkill.targetType}
                                onChange={(e) => setNewCustomSkill(prev => ({ ...prev, targetType: e.target.value }))}
                              >
                                <option value="一個生物">一個生物</option>
                                <option value="自身">自身</option>
                                <option value="至多 X 個生物">至多 X 個生物</option>
                                <option value="特殊">特殊</option>
                              </select>
                            </div>

                            {newCustomSkill.targetType === '至多 X 個生物' ? (
                              <div>
                                <label className="block text-indigo-950 font-bold mb-1">目標數量 (X)</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="99"
                                  className="w-full bg-[#fffdf9] text-indigo-950 font-bold p-1.5 border border-indigo-300 rounded outline-none focus:border-indigo-600"
                                  placeholder="例: 3"
                                  value={newCustomSkill.maxTargets}
                                  onChange={(e) => setNewCustomSkill(prev => ({ ...prev, maxTargets: e.target.value }))}
                                />
                              </div>
                            ) : (
                              <div className="hidden sm:block"></div>
                            )}

                            <div>
                              <label className="block text-indigo-950 font-bold mb-1">
                                MP 消耗 {newCustomSkill.targetType === '至多 X 個生物' && <span className="text-indigo-700 font-normal">(自動填寫 × T)</span>}
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  className="w-full bg-[#fffdf9] text-indigo-950 font-bold p-1.5 border border-indigo-300 rounded outline-none focus:border-indigo-600"
                                  placeholder="例: 10"
                                  value={newCustomSkill.baseMp}
                                  onChange={(e) => setNewCustomSkill(prev => ({ ...prev, baseMp: e.target.value }))}
                                />
                                {newCustomSkill.targetType === '至多 X 個生物' && (
                                  <span className="text-indigo-900 font-extrabold text-sm shrink-0">× T</span>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="block text-indigo-950 font-bold mb-1">持續時間 (Duration)</label>
                              <select
                                className="w-full bg-[#fffdf9] text-indigo-950 font-bold p-1.5 border border-indigo-300 rounded outline-none focus:border-indigo-600"
                                value={newCustomSkill.duration}
                                onChange={(e) => setNewCustomSkill(prev => ({ ...prev, duration: e.target.value }))}
                              >
                                <option value="瞬發">瞬發</option>
                                <option value="場景">場景</option>
                                <option value="特別">特別</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-indigo-200">
                            <label className="flex items-center gap-1.5 cursor-pointer group">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-indigo-400 text-indigo-700 bg-[#fffdf9] focus:ring-indigo-500 focus:ring-2"
                                checked={newCustomSkill.isOffensiveSpell}
                                onChange={(e) => setNewCustomSkill(prev => ({ ...prev, isOffensiveSpell: e.target.checked }))}
                              />
                              <span className="text-xs font-bold text-indigo-900 group-hover:text-indigo-700 transition-colors">⚡ 攻擊性咒語 (包含魔法命中檢定)</span>
                            </label>

                            {newCustomSkill.isOffensiveSpell && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-indigo-900">魔法檢定公式:</span>
                                <select
                                  className="bg-[#fffdf9] text-indigo-950 text-xs font-bold border border-indigo-300 p-1.5 rounded outline-none focus:border-indigo-600"
                                  value={newCustomSkill.formula}
                                  onChange={(e) => setNewCustomSkill(prev => ({ ...prev, formula: e.target.value }))}
                                >
                                  <option value="[INS + WLP]">【INS + WLP】(洞察 + 意志)</option>
                                  <option value="[MIG + WLP]">【MIG + WLP】(體格 + 意志)</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleAddCustomSkill}
                      className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-[0_0_15px_rgba(67,56,202,0.4)] flex items-center gap-2 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto justify-center"
                    >
                      <PlusCircle size={14} /> 加入能力清單
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {state.skills.filter(s => s.id.startsWith('custom_')).map(skill => (
                  <EditableSkill
                    key={skill.id}
                    skill={skill}
                    onUpdate={updateSkill}
                    onDelete={deleteSkill}
                    onUpdateSelection={updateSelection}
                    finalStats={finalStats}
                    npcLevel={state.level}
                    partyLevel={state.partyLevel}
                  />
                ))}
                {state.skills.filter(s => s.id.startsWith('custom_')).length === 0 && (
                  <div className="text-center py-8 text-indigo-500/50 text-xs font-bold tracking-widest border-2 border-dashed border-indigo-900/30 rounded-xl">
                    目前尚無自訂能力
                  </div>
                )}
              </div>
            </SectionAccordion>

              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl pb-10 relative">
            <div className="bg-[#f5efdf] border-l-4 border-amber-700 p-4 rounded text-[#2c221e] border border-[#d6c7ab] shadow-sm">
              <h3 className="font-bold mb-1 text-[#3c2415]">步驟 5：Boss 技能</h3>
              <p className="text-sm text-[#574c43]">這些強大且顛覆規則的能力，只有「冠位」級別的敵人才有資格獲得。</p>
              <div className="mt-2 p-2 bg-[#fffdf9] border border-[#d6c7ab] rounded text-[11px] text-[#574c43] leading-relaxed italic">
                💡 規則提醒：您可以透過替換掉相同數量的「定位技能」來獲得額外的 Boss 技能。
              </div>
            </div>

            {/* Global Sticky Block for Step 5 */}
            <div className="sticky top-2 z-40 space-y-3 animate-in slide-in-from-top-4 duration-300">

              {/* Active Boss Skills Global Sticky Nav */}
              {processedSkills.filter(s => s.source === 'bossSkill').length > 0 && (
                <div className="bg-[#f4ebd9]/95 backdrop-blur-md p-3 rounded-xl border border-[#d6c7ab] shadow-md flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-bold text-[#6b5a4b] mr-1 flex items-center gap-1"><Crown size={14} className="text-amber-700" /> 技能導航：</span>
                  {processedSkills.filter(s => s.source === 'bossSkill').map(activeSkill => {
                    const dbSkill = BOSS_SKILLS_DATA.find(db => db.id === activeSkill.libId);
                    const cat = dbSkill?.subCategory || '未分類';
                    return (
                      <button
                        key={activeSkill.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveBossTab(cat);
                          setTimeout(() => {
                            const el = document.getElementById(`boss-skill-${activeSkill.libId}`);
                            if (el) {
                              const container = el.closest('.overflow-y-auto');
                              if (container) {
                                const containerRect = container.getBoundingClientRect();
                                const elRect = el.getBoundingClientRect();
                                const relativeTop = elRect.top - containerRect.top + container.scrollTop;
                                container.scrollTo({ top: relativeTop - 180, behavior: 'smooth' });
                              } else {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                              el.classList.add('ring-4', 'ring-amber-500', 'ring-offset-4', 'ring-offset-[#fbf7ee]', 'transition-all', 'duration-500', 'scale-[1.02]', 'z-10');
                              setTimeout(() => {
                                el.classList.remove('ring-4', 'ring-amber-500', 'ring-offset-4', 'ring-offset-[#fbf7ee]', 'scale-[1.02]', 'z-10');
                              }, 1500);
                            }
                          }, 100);
                        }}
                        className="text-xs text-amber-900 font-bold border border-amber-400 bg-amber-100 px-3 py-1.5 rounded-full shadow-sm hover:bg-amber-200 transition-all cursor-pointer"
                      >
                        {activeSkill.originalName}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Rules Warnings */}
              {(isMoreThanTwoBossSkills || hasDuplicateBossSubCategory) && (
                <div className="space-y-3">
                  {isMoreThanTwoBossSkills && (
                    <div className="bg-orange-50 border border-orange-300 p-4 rounded-xl flex gap-3 items-start shadow-sm relative overflow-hidden">
                      <AlertTriangle className="text-orange-700 shrink-0 mt-0.5 animate-pulse relative z-10" size={20} />
                      <div className="relative z-10">
                        <h4 className="text-sm font-bold text-orange-900">過多的 Boss 技能</h4>
                        <p className="text-xs text-[#574c43] leading-relaxed mt-1">手冊建議：在給予同一個 Boss 超過兩個 Boss 技能時要非常小心，這可能會導致戰鬥過於複雜或難以平衡。</p>
                      </div>
                    </div>
                  )}
                  {hasDuplicateBossSubCategory && (
                    <div className="bg-red-50 border border-red-300 p-4 rounded-xl flex gap-3 items-start shadow-sm relative overflow-hidden">
                      <AlertTriangle className="text-red-700 shrink-0 mt-0.5 animate-pulse relative z-10" size={20} />
                      <div className="relative z-10">
                        <h4 className="text-sm font-bold text-red-900">技能列表重複 (List Overlap)</h4>
                        <p className="text-xs text-[#574c43] leading-relaxed mt-1">手冊建議：應避免給予 Boss 來自同一個技能列表（子類別）的多個技能。請嘗試選擇不同類型的能力以增加戰術多樣性。</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {state.rank !== '冠位' ? (
              <div className="bg-[#fffdf9] p-8 md:p-12 rounded-2xl border border-[#d6c7ab] shadow-md flex flex-col items-center justify-center text-center relative overflow-hidden group mt-4">
                <Crown size={80} className="text-amber-700/30 mb-6 drop-shadow-sm" />
                <h3 className="text-3xl font-black text-[#3c2415] tracking-widest mb-3">力量尚未覺醒</h3>
                <p className="text-[#6b5a4b] max-w-md mx-auto mb-8 leading-relaxed">您的 NPC 目前是「{state.rank}」。<br />解鎖強大的 Boss 技能需要「冠位」階級。</p>

                <div className="w-full max-w-lg">
                  <div className="text-sm font-bold text-amber-900 mb-3 tracking-widest uppercase flex items-center justify-center gap-2">
                    <Crown size={14} /> 選擇冠位倍率以一鍵覺醒 <Crown size={14} />
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map(mult => (
                      <button
                        key={mult}
                        onClick={() => {
                          setState(prev => ({ ...prev, rank: '冠位', championMultiplier: mult }));
                          showToast(`✨ 成功覺醒為冠位 (倍率 x${mult})！`, 'success');
                        }}
                        className="flex flex-col items-center justify-center py-3 bg-[#f5efdf] border border-[#d6c7ab] rounded-xl hover:bg-amber-100 hover:border-amber-600 hover:scale-105 transition-all shadow-sm"
                      >
                        <span className="text-xl font-black text-amber-800 transition-colors drop-shadow-sm">{mult}</span>
                        <span className="text-[10px] text-amber-900 font-bold">倍率</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {(() => {
                  const bossSkillCategories = BOSS_SKILLS_DATA.reduce((acc, skill) => {
                    const cat = skill.subCategory || '未分類';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(skill);
                    return acc;
                  }, {});
                  const categories = Object.keys(bossSkillCategories);
                  const currentActiveTab = activeBossTab || categories[0];

                  return (
                    <div className="flex flex-col gap-4">
                      {/* Tabs Navigation */}
                      <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
                        {categories.map(cat => {
                          const isActive = currentActiveTab === cat;
                          const selectedCount = processedSkills.filter(s => s.source === 'bossSkill' && (BOSS_SKILLS_DATA.find(db => db.id === s.libId)?.subCategory || '未分類') === cat).length;
                          return (
                            <button
                              key={cat}
                              onClick={() => setActiveBossTab(cat)}
                              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 font-bold tracking-widest transition-all ${isActive ? 'bg-amber-700 border-amber-800 text-white shadow-md' : 'bg-[#fffdf9] border-[#d6c7ab] text-[#6b5a4b] hover:border-amber-600 hover:text-[#2c221e]'}`}
                            >
                              <span>{cat}</span>
                              {selectedCount > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full shadow-inner ${isActive ? 'bg-[#fffdf9] text-amber-900 font-bold' : 'bg-[#eee6d3] text-[#3c2f21]'}`}>{selectedCount}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Tab Content */}
                      <div className="bg-[#fffdf9] border border-[#d6c7ab] rounded-xl p-4 md:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-sm">
                        <div className="space-y-4">
                          {bossSkillCategories[currentActiveTab].map(skill => {
                            const activeSkillData = processedSkills.find(s => s.libId === skill.id);
                            const isActive = !!activeSkillData;

                            const isRankLocked = skill.reqRank && Array.isArray(skill.reqRank) && !skill.reqRank.includes(state.rank);
                            const isLevelLocked = skill.reqLevel && state.level < skill.reqLevel;
                            const isReqLocked = skill.requires && Array.isArray(skill.requires) && !skill.requires.every(reqId => validSkills.some(s => s.libId === reqId));
                            const isRequirementLocked = !state.isFreeModeEnabled && (isRankLocked || isLevelLocked || isReqLocked);
                            const lockedMsg = !state.isFreeModeEnabled ? (
                              isRankLocked ? `需階級：${skill.reqRank.join('/')}` :
                              isLevelLocked ? `需等級：Lv.${skill.reqLevel}` :
                              isReqLocked ? '需前置技能' : null
                            ) : null;

                            const isOverBudget = isActive && activeSkillData?.isOverBudget && !lockedMsg;
                            const isDisabled = isRequirementLocked || (!isActive && !state.isFreeModeEnabled && state.skills.filter(s => s.source === 'bossSkill').length >= maxAllowedBossSkills);
                            return (
                              <div key={skill.id} id={`boss-skill-${skill.id}`}>
                                <SkillCard
                                  skill={activeSkillData || skill}
                                  isActive={isActive}
                                  isDisabled={isDisabled}
                                  isOverBudget={isOverBudget}
                                  lockedMsg={lockedMsg}
                                  onToggle={() => toggleLibrarySkill(skill)}
                                  onSelectionChange={updateSelection}
                                  onUpdateSkill={updateSkill}
                                  npcLevel={state.level}
                                  partyLevel={state.partyLevel}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        );
      case 6:
        return (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl pb-10">
            <div className="bg-[#f5efdf] border-l-4 border-red-700 p-4 rounded text-[#2c221e] border border-[#d6c7ab] shadow-sm">
              <h3 className="font-bold mb-1 text-red-900">步驟 6：配置負面技能</h3>
              <p className="text-sm text-[#574c43]">為你的 NPC 配備一個顯著的弱點以換取額外的額度。</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {NEGATIVE_SKILLS_DATA.map(skill => {
                const selection = (state.selectedNegativeSkills || []).find(s => s.id === skill.id);
                const isActive = !!selection;

                const isRankLocked = skill.reqRank && Array.isArray(skill.reqRank) && !skill.reqRank.includes(state.rank);
                const isLevelLocked = skill.reqLevel && state.level < skill.reqLevel;
                const isRequirementLocked = !state.isFreeModeEnabled && (isRankLocked || isLevelLocked);
                const lockedMsg = !state.isFreeModeEnabled ? (
                  isRankLocked ? `需階級：${skill.reqRank.join('/')}` :
                  isLevelLocked ? `需等級：Lv.${skill.reqLevel}` : null
                ) : null;

                const isDisabled = isRequirementLocked || (!isActive && !state.isFreeModeEnabled && (state.selectedNegativeSkills || []).length >= 1);
                return (
                  <div key={skill.id}>
                    <SkillCard
                      skill={isActive ? { ...skill, ...selection } : skill}
                      isActive={isActive}
                      isDisabled={isDisabled}
                      lockedMsg={lockedMsg}
                      onToggle={() => handleNegativeSkillToggle(skill.id)}
                      onSelectionChange={handleNegativeSkillSelectionChange}
                      onUpdateSkill={handleNegativeSkillUpdate}
                      npcLevel={state.level}
                      partyLevel={state.partyLevel}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4 animate-in fade-in duration-300 max-w-3xl pb-10">
            <div className="bg-[#f5efdf] border-l-4 border-amber-700 p-4 rounded text-[#2c221e] border border-[#d6c7ab] shadow-sm">
              <h3 className="font-bold mb-1 text-[#3c2415]">步驟 7：設定稱呼與特質</h3>
              <p className="text-sm text-[#574c43]">為你的 NPC 起個名字，並設定頭像、特質與背景故事。</p>
            </div>
            <div className="bg-[#fffdf9] p-6 rounded-lg border border-[#d6c7ab] space-y-5 shadow-sm">
              <div>
                <label className="block text-sm text-[#3c2415] mb-2 font-bold">實體名稱</label>
                <input type="text" className="w-full bg-[#fffdf9] border border-[#d6c7ab] rounded p-3 text-[#2c221e] outline-none focus:border-amber-600 text-lg font-bold tracking-wider shadow-sm" value={state.name} onChange={e => setState({ ...state, name: e.target.value })} placeholder="輸入名稱..." />
              </div>

              {/* NPC 頭像照片上傳與進階設定 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-[#3c2415] font-bold flex items-center gap-1.5">
                    <ImageIcon size={16} className="text-amber-700" /> NPC 頭像與肖像 (Avatar)
                  </label>
                  {state.avatarBase64 && (
                    <button
                      type="button"
                      onClick={() => {
                        setState(p => ({ ...p, avatarBase64: null, avatarScale: 1, avatarFit: 'cover' }));
                        showToast("🗑️ 已清除頭像圖片");
                      }}
                      className="text-xs text-red-700 hover:text-red-900 flex items-center gap-1 transition-colors font-bold"
                    >
                      <Trash2 size={13} /> 移除圖片
                    </button>
                  )}
                </div>

                {/* 支援拖曳上傳與網址載入的面板 */}
                <div
                  onDragEnter={handleAvatarDragEnter}
                  onDragOver={handleAvatarDragOver}
                  onDragLeave={handleAvatarDragLeave}
                  onDrop={handleAvatarDrop}
                  className={`relative transition-all duration-200 border-2 rounded-xl p-4 ${
                    isDraggingOver
                      ? 'border-amber-600 bg-amber-50 shadow-md ring-2 ring-amber-500/50'
                      : 'border-[#d6c7ab] bg-[#fffdf9] hover:border-amber-600'
                  }`}
                >
                  {isDraggingOver && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#fffdf9]/90 backdrop-blur-sm rounded-xl border-2 border-dashed border-amber-600 text-amber-900 pointer-events-none animate-in fade-in duration-150">
                      <Upload size={36} className="animate-bounce mb-2 text-amber-700" />
                      <span className="font-bold text-sm">釋放滑鼠以上傳圖片或網址</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* 縮圖預覽框 */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg border-2 border-[#d6c7ab] bg-[#f5efdf] flex-shrink-0 overflow-hidden flex items-center justify-center shadow-inner group select-none">
                      {state.avatarBase64 ? (
                        <img
                          src={state.avatarBase64}
                          alt="Avatar Preview"
                          draggable={false}
                          className="w-full h-full object-cover pixelated select-none"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-[#8c7b6c] gap-1 p-2 text-center">
                          <ImageIcon size={28} />
                          <span className="text-[10px] text-[#8c7b6c]">可拖曳圖片至此</span>
                        </div>
                      )}
                    </div>

                    {/* 上傳控制區與網址輸入 */}
                    <div className="flex-1 space-y-3 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold rounded transition shadow-sm">
                          <Upload size={14} />
                          {state.avatarBase64 ? '更換本地檔案' : '上傳本地照片'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </label>

                        {state.avatarBase64 && (
                          <>
                            <button
                              type="button"
                              onClick={handleReCrop}
                              className="px-3 py-2 bg-[#eee6d3] hover:bg-[#e4d9c0] text-[#3c2f21] border border-[#d6c7ab] text-xs font-bold rounded transition flex items-center gap-1.5 shadow-sm"
                            >
                              <Crop size={14} />
                              重新調整大小
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setState(p => ({ ...p, avatarBase64: null, avatarRawBase64: null }));
                                showToast("🗑️ 已清除頭像圖片");
                              }}
                              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded transition shadow-sm"
                            >
                              清除圖片
                            </button>
                          </>
                        )}

                        <span className="text-[11px] text-[#8c7b6c] hidden sm:inline font-bold">
                          或拖曳圖片檔案至此
                        </span>
                      </div>

                      {/* 圖片網址輸入 */}
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="url"
                            placeholder="或輸入圖片網址 (URL)... 例如: https://.../pic.png"
                            value={imageUrlInput}
                            onChange={(e) => setImageUrlInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleLoadImageUrl();
                              }
                            }}
                            className="w-full bg-[#fffdf9] border border-[#d6c7ab] rounded px-3 py-1.5 text-xs text-[#2c221e] placeholder-[#8c7b6c] outline-none focus:border-amber-600 transition-colors font-bold"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleLoadImageUrl()}
                          disabled={isUrlLoading}
                          className="px-3 py-1.5 bg-[#eee6d3] hover:bg-[#e4d9c0] text-[#3c2f21] border border-[#d6c7ab] rounded text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50 shadow-sm"
                        >
                          <Link size={13} />
                          {isUrlLoading ? '載入中...' : '網址載入'}
                        </button>
                      </div>

                      <p className="text-xs text-[#6b5a4b] leading-relaxed">
                        支援 JPG、PNG、GIF、WebP。上傳或載入時會自動開啟調整視窗，可自由放大（最高至 500%）並拖曳移動畫面範圍。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div><label className="block text-sm text-[#3c2415] mb-2 font-bold">特質 (Traits)</label><input type="text" className="w-full bg-[#fffdf9] border border-[#d6c7ab] rounded p-3 text-[#2c221e] outline-none focus:border-amber-600 font-bold" value={state.traits} onChange={e => setState({ ...state, traits: e.target.value })} placeholder="例如: 敏捷, 致命..." /></div>
              <div><label className="block text-sm text-[#3c2415] mb-2 font-bold">背景故事 (Story)</label><textarea className="w-full bg-[#fffdf9] border border-[#d6c7ab] rounded p-3 text-[#2c221e] outline-none h-32 resize-none focus:border-amber-600 font-medium" value={state.story || ""} onChange={e => setState({ ...state, story: e.target.value })} placeholder="簡短描述其起源或動機..." /></div>
            </div>

            {/* 關聯實體設置區塊 */}
            <div className="bg-[#fffdf9] p-6 rounded-lg border border-[#d6c7ab] space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <label className="text-sm text-[#3c2415] font-bold tracking-widest flex items-center gap-2 uppercase">
                  <Link size={16} className="text-amber-700" /> 關聯實體設置 (Linked Entities)
                </label>
                <span className="text-[10px] text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  雙向自動關聯
                </span>
              </div>

              <p className="text-xs text-[#574c43] leading-relaxed">
                連結至檔案庫中的其他實體，以便在角色卡預覽中快速跳轉。儲存後將自動建立雙向連結。
              </p>

              {library.length <= 1 ? (
                <div className="text-center py-6 bg-[#f5efdf] rounded border border-dashed border-[#d6c7ab]">
                  <p className="text-xs text-[#8c7b6c] font-bold italic">檔案庫中暫無其他可連結的實體</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c7b6c] w-4 h-4 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="搜尋實體名稱..."
                      className="w-full bg-[#fffdf9] border border-[#d6c7ab] rounded-lg pl-9 pr-3 py-2 text-sm text-[#2c221e] outline-none focus:border-amber-600 transition-colors font-bold"
                      value={linkSearchQuery}
                      onChange={(e) => setLinkSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {library
                      .filter(n => n.id !== state.id)
                      .filter(n => (n.name || "未知").toLowerCase().includes(linkSearchQuery.toLowerCase()))
                      .sort((a, b) => {
                        const aLinked = (state.linkedNpcs || []).includes(a.id);
                        const bLinked = (state.linkedNpcs || []).includes(b.id);
                        if (aLinked && !bLinked) return -1;
                        if (!aLinked && bLinked) return 1;
                        return (a.name || "").localeCompare(b.name || "");
                      })
                      .map(npc => {
                        const isLinked = (state.linkedNpcs || []).includes(npc.id);
                        return (
                          <button
                            key={npc.id}
                            onClick={() => handleToggleNPCLink(npc.id)}
                            className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${isLinked
                              ? 'bg-amber-100/90 border-amber-600 text-[#3c2415] shadow-sm'
                              : 'bg-[#fffdf9] border-[#d6c7ab] text-[#6b5a4b] hover:border-amber-600 hover:text-[#2c221e]'
                              }`}
                          >
                            <div className="flex flex-col gap-0.5 overflow-hidden">
                              <span className="text-sm font-bold truncate">{npc.name || "未知"}</span>
                              <span className="text-[10px] opacity-70 tracking-tight">Lv. {npc.level} | {npc.role}</span>
                            </div>
                            {isLinked ? (
                              <div className="bg-amber-700 text-white rounded-full p-1 shadow-sm">
                                <CheckCircle2 size={12} strokeWidth={3} />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-[#d6c7ab]"></div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-4 animate-in fade-in duration-300 max-w-3xl pb-10">
            <div className="bg-[#f5efdf] border-l-4 border-amber-700 p-4 rounded text-[#2c221e] border border-[#d6c7ab] shadow-sm">
              <h3 className="font-bold mb-1 text-[#3c2415]">步驟 8：戰術與行動</h3>
              <p className="text-sm text-[#574c43]">最後決定 NPC 的戰術。</p>
            </div>
            <div className="bg-[#fffdf9] p-4 rounded-lg border border-[#d6c7ab] mb-6 shadow-sm">
              <textarea className="w-full bg-[#fffdf9] border border-[#d6c7ab] rounded p-3 text-[#2c221e] outline-none h-48 resize-none focus:border-amber-600 text-sm leading-relaxed font-medium" value={state.tactics || ""} onChange={e => setState({ ...state, tactics: e.target.value })} placeholder="..." />
            </div>
            <div className="flex justify-end"><button onClick={() => setActiveMainTab('preview')} className="bg-amber-700 hover:bg-amber-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold shadow-md transition-transform hover:scale-105"><Eye size={18} /> 立即查看角色卡</button></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-[calc(100vh-53px)] min-h-[650px] w-full font-sans flex flex-col overflow-hidden relative transition-colors duration-300" style={{ backgroundColor: currentTheme.appBg, color: currentTheme.textDark }}>

      {/* 全域浮動提示 (Toast Notification) */}
      <AvatarCropperModal
        isOpen={isCropModalOpen}
        imageSrc={cropImageSource}
        onClose={() => setIsCropModalOpen(false)}
        onConfirm={handleConfirmCrop}
      />

      <FreeModeConfirmModal
        isOpen={isFreeModeConfirmOpen}
        onClose={() => setIsFreeModeConfirmOpen(false)}
        onConfirm={handleConfirmFreeMode}
      />

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`backdrop-blur px-6 py-3 rounded-full shadow-md font-bold flex items-center gap-2 border ${
            toast.type === 'error' ? 'bg-red-50 text-red-900 border-red-300' :
            toast.type === 'warning' ? 'bg-amber-50 text-amber-900 border-amber-300' :
            'bg-[#fffdf9] text-amber-900 border-[#d6c7ab]'
          }`}>
            {toast.type === 'error' ? <AlertCircle size={18} /> : toast.type === 'warning' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            {toast.message}
          </div>
        </div>
      )}

      <div className="border-b p-3 shadow-sm flex justify-between items-center z-50 flex-shrink-0 transition-colors duration-300" style={{ backgroundColor: currentTheme.headerBg, borderColor: currentTheme.border }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <img src={appIcon} alt="App Icon" className="h-8 w-8 object-contain pixelated shrink-0 select-none hover:scale-105 transition-transform" />
            <span className="text-[#d6c7ab] font-bold hidden sm:inline">|</span>
            <h1 className="text-xs font-black text-[#3c2415] uppercase tracking-[0.2em] hidden sm:block">FU NPC BUILDER</h1>
          </div>

          {/* 配色主題選擇器 (頂部伸出半圓形托盤) */}
          <div className="relative">
            <button
              onClick={() => setIsPaletteOpen(!isPaletteOpen)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm transition-all duration-300 ${
                isPaletteOpen
                  ? 'bg-amber-100 text-amber-950 border-amber-500 scale-105 shadow-md'
                  : 'bg-[#fffdf9] text-[#6b5a4b] border-[#d6c7ab] hover:border-amber-600 hover:text-[#2c221e]'
              }`}
              title="切換介面配色主題"
            >
              <Palette size={15} className="shrink-0 transition-colors" style={{ color: currentTheme.accent }} />
              <span className="text-xs font-bold">{currentTheme.name.split(' ')[0]}</span>
              <ChevronDown size={12} className={`transition-transform duration-300 ${isPaletteOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* 頂部延伸半圓形托盤 Container */}
            {isPaletteOpen && (
              <>
                {/* 全域點擊遮罩 (Click-away backdrop) */}
                <div
                  className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] animate-in fade-in duration-200"
                  onClick={() => setIsPaletteOpen(false)}
                />

                {/* 頂部延伸拱形半圓形托盤 (畫面頂部居中伸出，徹底防止手機版左右溢出切邊) */}
                <div className="fixed top-[52px] left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-200 max-w-[calc(100vw-1rem)]">
                  <div
                    className="relative px-4 sm:px-6 pt-2.5 pb-4 sm:pb-5 rounded-b-[32px] sm:rounded-b-[36px] border-b-2 border-x-2 shadow-2xl backdrop-blur-md flex flex-col items-center gap-2 transition-colors duration-300"
                    style={{
                      backgroundColor: currentTheme.panelBg,
                      borderColor: currentTheme.accent,
                      color: currentTheme.textDark,
                      minWidth: '270px'
                    }}
                  >
                    {/* 托盤頂部裝飾條 */}
                    <div className="w-10 h-1 rounded-full bg-[#d6c7ab]/80 mb-0.5" />
                    <div className="text-[11px] font-bold opacity-75 tracking-wider mb-0.5 flex items-center gap-1">
                      <Palette size={12} /> 選擇色彩主題
                    </div>

                    {/* 6 色主題拱形半圓形選擇列 */}
                    <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                      {Object.keys(THEMES).map(t => {
                        const isSelected = appTheme === t;
                        return (
                          <button
                            key={t}
                            onClick={() => {
                              setAppTheme(t);
                              localStorage.setItem('fabula-npc-theme', t);
                              // 無需文字提示，眼睛看了就知道顏色已切換！
                              setIsPaletteOpen(false);
                            }}
                            className="group relative flex flex-col items-center justify-center transition-all duration-300 focus:outline-none"
                            title={THEMES[t].name}
                          >
                            <div
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-300 flex items-center justify-center shadow-md ${
                                isSelected
                                  ? 'ring-2 ring-offset-2 scale-110 shadow-lg'
                                  : 'hover:scale-125 opacity-85 hover:opacity-100'
                              }`}
                              style={{
                                backgroundColor: THEMES[t].accent,
                                borderColor: THEMES[t].accentDark,
                                ringColor: THEMES[t].accent
                              }}
                            >
                              {isSelected && (
                                <Check className="text-white drop-shadow-sm stroke-[3]" size={16} />
                              )}
                            </div>
                            <span className={`text-[10px] font-bold mt-1 transition-opacity ${isSelected ? 'opacity-100 font-black' : 'opacity-70 group-hover:opacity-100'}`}>
                              {THEMES[t].name.split(' ')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {activeMainTab !== 'library' && (
            <button onClick={() => setActiveMainTab('library')} className="text-sm font-bold text-[#6b5a4b] hover:text-[#2c221e] flex items-center gap-1 bg-[#fffdf9] px-2 sm:px-3 py-1.5 rounded border border-[#d6c7ab] transition-colors" title="回到檔案庫">
              <LayoutPanelLeft size={16} /> <span className="hidden sm:inline">回到檔案庫</span>
            </button>
          )}
        </div>
        <div className="flex gap-2 text-sm items-center">
          {/* 支持開發者 (Ko-fi) 靜音圖示 */}
          <button
            onClick={() => setIsSponsorModalOpen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b5a4b] hover:text-amber-900 hover:bg-[#f4ebd9] border border-[#d6c7ab] transition-all duration-200 shrink-0 shadow-sm"
            title="支持開發者 (Ko-fi)"
          >
            <Coffee size={16} />
          </button>
          {activeMainTab !== 'library' && state && (
            <button
              onClick={handleFreeModeToggleClick}
              className={`px-2.5 sm:px-3 py-1.5 rounded-full font-bold transition-all duration-300 flex items-center gap-1.5 text-xs shadow-sm border ${
                state.isFreeModeEnabled
                  ? 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-400 ring-1 ring-fuchsia-400/50 hover:bg-fuchsia-200'
                  : 'bg-[#fffdf9] text-[#6b5a4b] border-[#d6c7ab] hover:border-amber-600 hover:text-[#2c221e]'
              }`}
              title={state.isFreeModeEnabled ? '規則限制已解除（點擊恢復嚴謹模式）' : '點擊解除規則限制'}
            >
              {state.isFreeModeEnabled ? <Unlock size={14} className="text-fuchsia-700" /> : <Lock size={14} />}
              <span className="hidden sm:inline">
                {state.isFreeModeEnabled ? '🔓 解除規則限制' : '🔒 嚴謹模式'}
              </span>
              <span className="sm:hidden">
                {state.isFreeModeEnabled ? '🔓 已解除' : '🔒 嚴謹'}
              </span>
            </button>
          )}
          {activeMainTab !== 'library' && (
            <>
              <button onClick={handleSaveToLibrary} className="text-white px-2 sm:px-3 py-1.5 rounded font-bold transition-all hover:scale-105 active:scale-95 shadow-sm text-xs md:text-sm flex items-center gap-1" style={{ backgroundColor: currentTheme.accent }} title="儲存 NPC"><Save size={16} /> <span className="hidden sm:inline">儲存 NPC</span></button>
              <label className="cursor-pointer text-[#6b5a4b] hover:text-[#2c221e] px-2 sm:px-3 py-1.5 rounded bg-[#fffdf9] hover:bg-[#f4ebd9] border border-[#d6c7ab] transition-colors flex items-center gap-1" title="讀取 JSON"><Upload size={14} /> <span className="hidden sm:inline">讀取 JSON</span> <input type="file" accept=".json" className="hidden" onChange={handleImportJSON} /></label>
              <button onClick={handleExportJSON} className="text-[#6b5a4b] hover:text-[#2c221e] px-2 sm:px-3 py-1.5 rounded bg-[#fffdf9] hover:bg-[#f4ebd9] border border-[#d6c7ab] transition-colors flex items-center gap-1" title="匯出 JSON"><Download size={14} /> <span className="hidden sm:inline">匯出 JSON</span></button>
            </>
          )}
        </div>
      </div>

      {activeMainTab !== 'library' && (
        <div className="flex border-b-2 flex-shrink-0 transition-colors duration-300" style={{ backgroundColor: currentTheme.subpanelBg, borderColor: currentTheme.border }}>
          <button onClick={() => setActiveMainTab('build')} className={`flex-1 py-2 sm:py-3.5 text-sm sm:text-base font-bold tracking-widest flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2 transition-all duration-200 ${activeMainTab === 'build' ? 'shadow-sm' : 'hover:opacity-80'}`} style={{ backgroundColor: activeMainTab === 'build' ? currentTheme.appBg : 'transparent', borderColor: activeMainTab === 'build' ? currentTheme.accent : 'transparent', borderBottomWidth: '3px', color: activeMainTab === 'build' ? currentTheme.accentDark : '#6b5a4b' }}><Settings size={18} className="sm:w-[18px] sm:h-[18px] w-4 h-4" /> 構築頁面</button>
          <button onClick={() => setActiveMainTab('preview')} className={`flex-1 py-2 sm:py-3.5 text-sm sm:text-base font-bold tracking-widest flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2 transition-all duration-200 ${activeMainTab === 'preview' ? 'shadow-sm' : 'hover:opacity-80'}`} style={{ backgroundColor: activeMainTab === 'preview' ? currentTheme.appBg : 'transparent', borderColor: activeMainTab === 'preview' ? currentTheme.accent : 'transparent', borderBottomWidth: '3px', color: activeMainTab === 'preview' ? currentTheme.accentDark : '#6b5a4b' }}><Eye size={18} className="sm:w-[18px] sm:h-[18px] w-4 h-4" /> 角色卡預覽</button>
        </div>
      )}

      {/* 檔案庫 Tab 內容 (Library View) */}
      {activeMainTab === 'library' && (
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar animate-in fade-in transition-colors duration-300" style={{ backgroundColor: currentTheme.appBg }}>
          <div className="max-w-6xl mx-auto flex flex-col min-h-full">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 border-b border-[#d6c7ab] pb-4 gap-4">
              <div>
                <h2 className="text-3xl font-black text-[#3c2415] tracking-widest mb-1">
                  NPC 生成器
                </h2>
                <p className="text-[#6b5a4b] text-sm font-bold">管理與檢視您創建的所有自定義 NPC</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button onClick={handleBackupAllNPCs} className="bg-[#eee6d3] hover:bg-[#e4d9c0] text-[#3c2f21] border border-[#d6c7ab] px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-105 justify-center text-sm">
                  <Download size={16} /> 備份全庫
                </button>
                <button onClick={createNewNPC} className="bg-amber-700 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-md transition-all hover:scale-105 justify-center text-sm">
                  <PlusCircle size={18} /> 建立新 NPC
                </button>
              </div>
            </div>

            {library.length === 0 ? (
              <div className="text-center py-20 bg-[#fffdf9] rounded-xl border border-[#d6c7ab] border-dashed flex flex-col items-center justify-center shadow-sm">
                <div className="relative mb-6 group">
                  <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all duration-700 w-24 h-24 -translate-x-4 -translate-y-2"></div>
                  <img src={appIcon} alt="App Icon" className="h-20 w-20 object-contain pixelated opacity-50 group-hover:opacity-85 transition-all duration-500 relative z-10" />
                </div>
                <p className="text-[#3c2415] font-bold tracking-widest text-lg">檔案庫目前空空如也</p>
                <p className="text-[#6b5a4b] text-sm mt-2">點擊右上方按鈕開始創造你的第一個 NPC 吧！</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {library.map(npc => (
                  <div key={npc.id} className="bg-[#fffdf9] border border-[#d6c7ab] rounded-xl overflow-hidden shadow-md flex flex-col group hover:border-amber-600 transition-all hover:shadow-lg">
                    <div className="h-32 bg-[#f4ebd9] relative flex items-center justify-center border-b border-[#d6c7ab] overflow-hidden">
                      {npc.avatarBase64 ? (
                        <img
                          src={npc.avatarBase64}
                          className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity duration-500 pixelated"
                          style={{
                            imageRendering: 'pixelated',
                            objectFit: npc.avatarFit || 'cover',
                            transform: `translate(${npc.avatarOffsetX || 0}px, ${npc.avatarOffsetY || 0}px) scale(${npc.avatarScale || 1})`,
                            transformOrigin: 'center center'
                          }}
                        />
                      ) : (
                        <ImageIcon size={32} className="text-[#a8987e]" />
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        <span className="bg-[#fffdf9]/90 text-[#b45309] text-[10px] font-bold px-2 py-0.5 rounded border border-[#d6c7ab] shadow-sm">Lv. {npc.level}</span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-[#3c2415] mb-1 truncate drop-shadow-sm">{npc.name || "未知實體"}</h3>
                      <p className="text-xs text-[#6b5a4b] font-bold tracking-wider mb-5 flex items-center gap-1.5">
                        <span className="text-amber-700">【{npc.rank}】</span>
                        {(() => {
                          const LibRoleIcon = ROLE_ICONS[npc.role] || ROLE_DESCRIPTIONS[npc.role]?.Icon;
                          return LibRoleIcon ? <LibRoleIcon className="w-3.5 h-3.5 text-amber-800 shrink-0 inline" /> : null;
                        })()}
                        <span>{npc.role}</span>
                      </p>
                      <div className="mt-auto flex gap-2">
                        <button onClick={() => { setState(npc); setActiveMainTab('build'); }} className="flex-1 bg-[#eee6d3] hover:bg-[#e4d9c0] text-[#3c2f21] py-2 rounded text-sm font-bold flex justify-center items-center gap-1 transition-colors border border-[#d6c7ab]"><Edit3 size={14} /> 編輯</button>
                        <button onClick={() => { setState(npc); setActiveMainTab('preview'); }} className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-900 py-2 rounded text-sm font-bold flex justify-center items-center gap-1 transition-colors border border-amber-300"><Eye size={14} /> 預覽</button>
                        <button onClick={() => handleSendToCombat(npc)} className="bg-rose-100 hover:bg-rose-200 text-rose-900 px-3 py-2 rounded text-sm font-bold flex justify-center items-center gap-1 transition-colors border border-rose-300" title="推入戰鬥房間"><Swords size={14} /> 入戰</button>
                        <button onClick={() => {
                          if (window.confirm(`確定要刪除「${npc.name || "未知實體"}」嗎？此操作無法復原。`)) {
                            setLibrary(prev => {
                              let newLib = prev.filter(n => n.id !== npc.id);
                              newLib = newLib.map(n => ({
                                ...n,
                                linkedNpcs: (n.linkedNpcs || []).filter(id => id !== npc.id)
                              }));
                              return newLib;
                            });
                            showToast(`🗑️ 已刪除「${npc.name || "未知實體"}」`);
                          }
                        }} className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded transition-colors border border-red-200"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 贊助支持卡片 (Sponsorship Card) */}
            <div className="mt-10 mb-6 p-4 rounded-xl bg-[#f4ebd9]/90 border border-[#d6c7ab] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left transition-all hover:border-amber-400">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100/90 border border-amber-300 flex items-center justify-center shrink-0 text-amber-800 shadow-inner">
                  <Coffee size={20} />
                </div>
                <div className="text-xs sm:text-sm text-[#3c2415] font-medium leading-relaxed">
                  <span>喜歡的話，☕ 不妨</span>
                  <a
                    href={SPONSOR_CONFIG.kofiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-amber-800 hover:text-amber-900 underline underline-offset-2 transition-colors inline-flex items-center gap-1"
                  >
                    請作者 ScarletVice 一杯咖啡
                  </a>
                  <span>恢復 HP......</span>
                </div>
              </div>
              <button
                onClick={() => setIsSponsorModalOpen(true)}
                className="shrink-0 text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 border border-amber-400 px-3.5 py-1.5 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-sm flex items-center gap-1.5"
              >
                <Heart size={14} className="text-red-600 fill-red-600" />
                <span>支持詳情</span>
              </button>
            </div>

            {/* 第三方授權聲明 (Third-Party License Notice) */}
            <div className="mt-auto pt-6 border-t border-[#d6c7ab]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
              <div className="text-center space-y-2">
                <img src={modLogo} alt="FU Mod Logo" className="h-8 object-contain mx-auto opacity-70" />
                <div className="text-[11px] text-[#6b5a4b] leading-relaxed max-w-2xl mx-auto">
                  <p><span className="font-bold text-[#3c2415]">FU NPC Builder</span> is an independent production by <span className="font-bold text-[#3c2415]">ScarletVice</span>.</p>
                  <p>It is not affiliated with Need Games or Rooster Games.</p>
                  <p>Published under the <a href="https://need.games/wp-content/uploads/2024/06/Fabula-Ultima-Third-Party-Tabletop-License-1.0.pdf" target="_blank" rel="noopener noreferrer" className="text-amber-800 hover:text-amber-700 underline underline-offset-2 transition-colors">Fabula Ultima Third-Party Tabletop License 1.0</a>.</p>
                  <p>Fabula Ultima is © Emanuele Galletto, Need Games and Rooster Games.</p>
                  <p className="pt-1">This tool requires the <span className="font-bold text-[#3c2415]">Fabula Ultima Core Rulebook</span> and <span className="font-bold text-[#3c2415]">Fabula Ultima Bestiary vol.1</span>.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Global Budgets HUD - shows when in build mode with an NPC */}
      {activeMainTab === 'build' && state && (
        <>
          <div className="flex-shrink-0 bg-[#f4ebd9]/95 backdrop-blur border-b border-[#d6c7ab] px-3 py-1.5 flex flex-wrap items-center gap-2">
            {/* 定位技能 */}
            {maxRoleSkills > 0 && (
              <button
                onClick={() => { setCurrentStep(4); setStep4SubTab('skills'); }}
                className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all hover:scale-105 ${
                  usedRoleSkills > maxRoleSkills
                    ? 'bg-red-100 text-red-800 border-red-400 animate-pulse'
                    : usedRoleSkills >= maxRoleSkills
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
                title="點擊前往定位技能配置"
              >
                🛡️ 定位技能 {usedRoleSkills}/{maxRoleSkills}
              </button>
            )}
            {/* 咒語容量 */}
            {allSpellbooksToRender.length > 0 && (() => {
              const usedSpells = allSpellbooksToRender.reduce((s, b) => s + (b.selectedSpells || []).length, 0);
              const maxSpells = allSpellbooksToRender.reduce((s, b) => s + (b.spellConfig?.capacity || 0), 0);
              return (
                <button
                  onClick={() => { setCurrentStep(4); setStep4SubTab('spells'); }}
                  className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all hover:scale-105 ${
                    usedSpells > maxSpells
                      ? 'bg-red-100 text-red-800 border-red-400 animate-pulse'
                      : usedSpells >= maxSpells
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                  title="點擊前往咒語配置"
                >
                  🔮 咒語容量 {usedSpells}/{maxSpells}
                </button>
              );
            })()}
            {/* 屬性相性 (弱點 / 抗性 / 免疫) */}
            <button
              onClick={() => { setCurrentStep(4); setStep4SubTab('stats'); }}
              className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-900 transition-all hover:scale-105 ml-auto md:ml-0"
              title="點擊前往相性配置"
            >
              ⚡ 弱 {currentAffinities.vul} | 抗 {currentAffinities.res} | 免 {currentAffinities.imm}
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden relative">
            {/* 步驟側邊欄 ( md:flex, 手機端隱藏轉為頂部條 ) */}
            <div className="hidden md:flex w-64 bg-[#eee6d3] border-r border-[#d8c8b0] flex-col overflow-y-auto custom-scrollbar flex-shrink-0">
              <div className="p-4 border-b border-[#d8c8b0]">
                <h2 className="text-xs font-black text-[#6b5a4b] uppercase tracking-wider">建構步驟</h2>
              </div>
              <div className="p-2 space-y-1">
                {steps.map((s) => (
                  <button
                    key={s.num}
                    onClick={() => setCurrentStep(s.num)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                      currentStep === s.num
                        ? 'bg-[#fffdf9] text-[#2c221e] font-black shadow-sm border border-[#d6c7ab]'
                        : 'text-[#6b5a4b] hover:bg-[#e4d9c0] hover:text-[#2c221e]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                          currentStep === s.num
                            ? 'text-white'
                            : 'bg-[#d6c7ab] text-[#6b5a4b]'
                        }`}
                        style={{ backgroundColor: currentStep === s.num ? currentTheme.accent : undefined }}
                      >
                        {s.num}
                      </span>
                      <span className="font-bold text-sm tracking-widest whitespace-nowrap">{s.num}. {s.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 主表單與桌面雙欄容器 */}
            <div className="flex-1 flex flex-col relative overflow-hidden transition-colors duration-300" style={{ backgroundColor: currentTheme.appBg }}>
              {/* 手機頂部橫向步驟指示條 */}
              <div className="md:hidden sticky top-0 z-30 backdrop-blur border-b px-3 py-2 flex items-center gap-2 transition-colors duration-300" style={{ backgroundColor: currentTheme.headerBg, borderColor: currentTheme.border }}>
                <span className="text-xs font-black tracking-wide shrink-0" style={{ color: currentTheme.textDark }}>步驟 {currentStep}/{steps.length}</span>
                <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: currentTheme.border }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(currentStep / steps.length) * 100}%`, backgroundColor: currentTheme.accent }}></div>
                </div>
                <select
                  className="text-xs font-bold border px-2 py-1 rounded outline-none max-w-[140px] truncate transition-colors duration-300"
                  style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border, color: currentTheme.textDark }}
                  value={currentStep}
                  onChange={e => setCurrentStep(Number(e.target.value))}
                >
                  {steps.map(s => <option key={s.num} value={s.num}>{s.num}. {s.title}</option>)}
                </select>
              </div>

              {/* 可滾動的主內容區 (桌面雙欄 xl+) */}
              <div className="flex-1 overflow-hidden flex">
                {/* 左半欄：步驟表單 */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                  <div className="mx-auto flex flex-col min-h-full max-w-4xl px-4 py-6 md:px-8 md:py-8 relative xl:max-w-none xl:px-6">
                    {renderStepContent()}
                  </div>
                </div>

                {/* 右半欄：常駐角色卡預覽 (僅 xl+ 顯示) */}
                <div className="hidden xl:flex w-[45%] flex-shrink-0 border-l flex-col overflow-y-auto custom-scrollbar transition-colors duration-300" style={{ backgroundColor: currentTheme.subpanelBg, borderColor: currentTheme.border }}>
                  <div className="sticky top-0 z-10 backdrop-blur border-b px-4 py-2 flex items-center gap-2 transition-colors duration-300" style={{ backgroundColor: currentTheme.headerBg, borderColor: currentTheme.border }}>
                    <Eye size={14} style={{ color: currentTheme.accent }} />
                    <span className="text-xs font-black tracking-widest" style={{ color: currentTheme.textDark }}>即時預覽</span>
                    <span className="text-[10px] ml-auto border px-2 py-0.5 rounded transition-colors duration-300" style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border, color: currentTheme.textDark }}>修改左側數值，預覽即時同步</span>
                  </div>
                  <div className="px-4 py-4">
                    {renderCharacterCard()}
                  </div>
                </div>
              </div>

              {/* 固定在底部的全局導航按鈕 (除了步驟一保留原樣) */}
              {currentStep !== 1 && (
                <div className="w-full border-t py-3 shrink-0 z-50 relative shadow-[0_-10px_20px_-10px_rgba(44,34,30,0.1)] transition-colors duration-300" style={{ backgroundColor: currentTheme.headerBg, borderColor: currentTheme.border, paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
                  <div className="max-w-4xl mx-auto flex justify-between items-center px-4 md:px-8">
                    <button onClick={prevStep} className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all text-sm text-[#3c2f21] bg-[#eee6d3] hover:bg-[#e4d9c0] border border-[#d6c7ab] shadow-sm">
                      <ChevronLeft size={16} /> 上一步
                    </button>

                    {currentStep === 8 ? (
                      <button onClick={() => setActiveMainTab('preview')} className="flex items-center gap-2 px-8 py-2.5 rounded-lg font-bold transition-all shadow-md text-sm text-white hover:scale-105" style={{ backgroundColor: currentTheme.accent }}>
                        <Check size={16} /> 預覽角色卡
                      </button>
                    ) : (
                      <button onClick={nextStep} className="flex items-center gap-2 px-8 py-2.5 rounded-lg font-bold transition-all shadow-md text-sm text-white hover:scale-105" style={{ backgroundColor: currentTheme.accent }}>
                        下一步 <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 移動端 Bottom Sheet 懸浮按鈕 (FAB) - 僅在大螢幕 xl 以下顯示 */}
          <div className="xl:hidden fixed bottom-16 right-4 z-40">
            <button
              onClick={() => setIsBottomSheetOpen(true)}
              className="bg-amber-800 hover:bg-amber-700 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 font-bold transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-amber-300"
              title="查看角色卡預覽"
            >
              <Eye size={20} />
              <span className="text-xs font-black hidden sm:inline">預覽卡片</span>
            </button>
          </div>

          {/* Bottom Sheet Overlay */}
          {isBottomSheetOpen && (
            <div className="fixed inset-0 z-50 flex flex-col justify-end">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setIsBottomSheetOpen(false)}
              />
              <div
                ref={bottomSheetRef}
                className="relative z-10 bg-[#fbf7ee] rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300"
                onTouchStart={e => { bsDragStartY.current = e.touches[0].clientY; bsDragOffset.current = 0; }}
                onTouchMove={e => {
                  const dy = e.touches[0].clientY - bsDragStartY.current;
                  bsDragOffset.current = dy;
                  if (dy > 0 && bottomSheetRef.current) bottomSheetRef.current.style.transform = `translateY(${dy}px)`;
                }}
                onTouchEnd={() => {
                  if (bsDragOffset.current > 80) { setIsBottomSheetOpen(false); }
                  if (bottomSheetRef.current) bottomSheetRef.current.style.transform = '';
                }}
              >
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                  <div className="w-10 h-1.5 bg-[#d6c7ab] rounded-full" />
                </div>
                <div className="flex items-center justify-between px-4 pb-3 shrink-0 border-b border-[#d6c7ab]">
                  <span className="text-sm font-black tracking-widest text-[#3c2415] flex items-center gap-2"><Eye size={14} className="text-amber-700" /> 角色卡預覽</span>
                  <button onClick={() => setIsBottomSheetOpen(false)} className="text-[#6b5a4b] hover:text-red-700 transition-colors p-1">✕</button>
                </div>
                <div className="overflow-y-auto custom-scrollbar px-3 py-3">
                  {renderCharacterCard()}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeMainTab === 'preview' && state && (
        <div className="flex-1 overflow-y-auto bg-[#fbf7ee] custom-scrollbar animate-in fade-in">
          <div className="mx-auto flex flex-col items-center px-4 py-6 md:px-8 md:py-8 min-h-full max-w-4xl">
            <div className="w-full flex flex-wrap justify-between items-center mb-4 bg-[#f4ebd9]/95 backdrop-blur p-3 rounded-lg border border-[#d6c7ab] shadow-md sticky top-0 z-20 gap-2">
              <div className="flex items-center gap-4">
                <span className="text-[#3c2415] text-sm font-bold flex items-center gap-2"><Eye size={16} className="text-amber-600" /> 研究檢定結果</span>
                <div className="flex bg-[#fffdf9] rounded-lg p-1 border border-[#d6c7ab] shadow-inner overflow-hidden">
                  {['full', '7', '10', '13'].map(lv => (
                    <button
                      key={lv}
                      onClick={() => setRevealLevel(lv)}
                      className={`px-3 py-1 rounded text-[11px] font-black transition-all ${revealLevel === lv
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-[#6b5a4b] hover:text-[#2c221e]'
                        }`}
                    >
                      {lv === 'full' ? '完整' : `${lv}+`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {/* Multi-format copy dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setCopyFormatDropdownOpen(prev => !prev)}
                    className="bg-amber-800 hover:bg-amber-700 text-white px-3 py-2 rounded flex items-center gap-1.5 font-bold shadow transition-transform hover:scale-105 text-sm"
                  >
                    <FileText size={15} /> 複製文本 ▾
                  </button>
                  {copyFormatDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-[#fffdf9] border border-[#d6c7ab] rounded-xl shadow-xl z-30 min-w-[170px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                      <button
                        onClick={() => { handleCopyFullNpc('discord'); setCopyFormatDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#2c221e] hover:bg-[#f4ebd9] transition-colors text-left font-bold"
                      >
                        💬 Discord 格式
                      </button>
                      <button
                        onClick={() => { handleCopyFullNpc('markdown'); setCopyFormatDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#2c221e] hover:bg-[#f4ebd9] transition-colors text-left font-bold"
                      >
                        📝 Markdown 格式
                      </button>
                      <button
                        onClick={() => { handleCopyFullNpc('plain'); setCopyFormatDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#2c221e] hover:bg-[#f4ebd9] transition-colors text-left border-t border-[#d6c7ab] font-bold"
                      >
                        📱 純文字筆記格式
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={handleCopyJPG} className="bg-indigo-800 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center gap-2 font-bold shadow transition-transform hover:scale-105 text-sm">
                  <Copy size={16} /> 複製圖片
                </button>
                <button onClick={handleExportJPG} className="bg-emerald-800 hover:bg-emerald-700 text-white px-4 py-2 rounded flex items-center gap-2 font-bold shadow transition-transform hover:scale-105 text-sm">
                  <Download size={16} /> 匯出 JPG
                </button>
              </div>
            </div>
            {renderCharacterCard()}

            <div className="h-20 w-full flex-shrink-0"></div>
          </div>
        </div>
      )}

      {/* 贊助專屬彈窗 (Sponsorship Modal) */}
      {isSponsorModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsSponsorModalOpen(false)}
          />

          {/* Modal Box */}
          <div className="relative z-10 w-full max-w-lg bg-[#fffdf9] border-2 border-[#d6c7ab] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-[#3c2415]">
            {/* Modal Header */}
            <div className="bg-[#f4ebd9] px-6 py-4 border-b border-[#d6c7ab] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl border border-amber-300 shadow-sm">
                  <Coffee size={20} />
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-wide text-[#3c2415]">
                  ☕ 支持《FU NPC Builder》持續冒險
                </h3>
              </div>
              <button
                onClick={() => setIsSponsorModalOpen(false)}
                className="text-[#6b5a4b] hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                title="關閉"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Developer Note */}
              <div className="bg-[#fcf8f0] p-4 rounded-xl border border-[#e8dec8] relative shadow-inner">
                <p className="text-xs sm:text-sm leading-relaxed text-[#4a3b32] italic">
                  「本來只是為了自用而開發的小專案，如果能幫到大家真是太好了！一同努力把FU推薦出去吧！」
                </p>
              </div>

              {/* Primary Call to Action Button */}
              <a
                href={SPONSOR_CONFIG.kofiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#FF5E5B] hover:bg-[#e04f4c] text-white py-3 px-5 rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Coffee size={20} />
                <span>前往 Ko-fi 請作者 ScarletVice 喝咖啡</span>
              </a>

              {/* Future Plans Section */}
              <div className="border-t border-[#e8dec8] pt-4">
                <div className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-wider text-amber-800">
                  <Sparkles size={14} />
                  <span>未來開發計畫 Roadmap</span>
                </div>
                <ul className="space-y-2 text-xs text-[#5c4a3e] bg-[#f8f3e8] p-3.5 rounded-xl border border-[#e8dec8]">
                  <li className="flex items-center gap-2 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
                    <span>⚔️ 實時戰鬥追蹤器 (Encounter Tracker)</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
                    <span>📚 官方擴充書內容支援</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
                    <span>📜 角色卡構築器</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
                    <span>⏳ 命刻記錄</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#f4ebd9]/60 px-6 py-3 border-t border-[#d6c7ab] flex justify-end">
              <button
                onClick={() => setIsSponsorModalOpen(false)}
                className="px-4 py-1.5 bg-[#eee6d3] hover:bg-[#e4d9c0] text-[#3c2f21] border border-[#d6c7ab] text-xs font-bold rounded-lg transition-colors"
              >
                關閉窗口
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #d6c7ab; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #b4a383; }
        
        /* 修正匯出圖片時的文字與圖示對齊問題 */
        svg {
          vertical-align: middle;
          display: inline-block;
        }
        
        @media print {
          .no-print { display: none; }
        }
      `}} />
    </div>
  );
}
