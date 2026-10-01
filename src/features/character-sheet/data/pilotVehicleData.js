// 科技奇幻 - 機師【個人載具】資料庫與機制規則
// 依據 Techno Fantasy Atlas p. 159-169 與繁中版 Excel 機師相關工作表

// 3 大框架定義
export const PILOT_FRAMES = [
  {
    id: 'exoskeleton',
    name: '外骨骼',
    passengers: 0,
    distanceModifier: '正常',
    maxWeapons: 2,
    maxArmor: 1,
    unlimitedSupport: true,
    specialRule: '支援模組不限。使用【壓縮技術】技能時消耗 0 IP。',
    ipFreeCompression: true,
    mpFreeHeart: false
  },
  {
    id: 'mecha',
    name: '機甲',
    passengers: 0,
    distanceModifier: '×2',
    maxWeapons: 2,
    maxArmor: 1,
    unlimitedSupport: true,
    specialRule: '支援模組不限。旅程距離變為 2 倍。',
    ipFreeCompression: false,
    mpFreeHeart: false
  },
  {
    id: 'steed',
    name: '戰馬',
    passengers: 1,
    distanceModifier: '×2',
    maxWeapons: 1,
    maxArmor: 1,
    unlimitedSupport: true,
    specialRule: '支援模組不限。旅程距離變為 2 倍，可額外載運 1 名乘客。使用【引擎之心】技能時消耗 0 MP。',
    ipFreeCompression: false,
    mpFreeHeart: true
  }
];

// 4 種防具模組（✦ 代表職業防具）
export const PILOT_ARMOR_MODULES = [
  {
    id: 'flexible_plating',
    name: '柔性鍍層模組',
    isMartial: false,
    defFormula: 'DEX 骰面 + 2',
    mdefFormula: 'INS 骰面 + 1'
  },
  {
    id: 'heavy_plating',
    name: '重裝鍍層模組 ✦',
    isMartial: true,
    def: 12,
    mdef: 8,
    defFormula: '12',
    mdefFormula: '8'
  },
  {
    id: 'runic_plating',
    name: '符文鍍層模組 ✦',
    isMartial: true,
    def: 10,
    mdef: 11,
    defFormula: '10',
    mdefFormula: '11'
  },
  {
    id: 'standard_plating',
    name: '標準鍍層模組 ✦',
    isMartial: true,
    def: 11,
    mdef: 10,
    defFormula: '11',
    mdefFormula: '10'
  }
];

// 17 種武裝模組
export const PILOT_WEAPON_MODULES = [
  {
    id: 'arcane_module',
    name: '奧術模組',
    attr1: 'DEX',
    attr2: 'WLP',
    modifier: 0,
    damage: '【HR + 8】物理',
    range: 'melee',
    category: '奧術',
    damageType: 'physical',
    isBulky: false,
    specialRule: '無'
  },
  {
    id: 'axe_module',
    name: '斧模組',
    attr1: 'DEX',
    attr2: 'INS',
    modifier: 0,
    damage: '【HR + 12】物理',
    range: 'melee',
    category: '重型',
    damageType: 'physical',
    isBulky: false,
    specialRule: '無'
  },
  {
    id: 'blade_module',
    name: '刀刃模組',
    attr1: 'DEX',
    attr2: 'INS',
    modifier: 1,
    damage: '【HR + 6】物理',
    range: 'melee',
    category: '匕首',
    damageType: 'physical',
    isBulky: false,
    specialRule: '無'
  },
  {
    id: 'bow_module',
    name: '弓模組',
    attr1: 'DEX',
    attr2: 'INS',
    modifier: 1,
    damage: '【HR + 12】物理',
    range: 'ranged',
    category: '弓',
    damageType: 'physical',
    isBulky: true,
    specialRule: '啟用時載具上不能裝備其他啟用的武裝模組。'
  },
  {
    id: 'cannon_module',
    name: '火砲模組',
    attr1: 'DEX',
    attr2: 'INS',
    modifier: 0,
    damage: '【HR + 14】物理',
    range: 'ranged',
    category: '火器',
    damageType: 'physical',
    isBulky: true,
    specialRule: '啟用時載具上不能裝備其他啟用的武裝模組。'
  },
  {
    id: 'claw_module',
    name: '爪模組',
    attr1: 'DEX',
    attr2: 'INS',
    modifier: 0,
    damage: '【HR + 8】物理',
    range: 'melee',
    category: '格鬥',
    damageType: 'physical',
    isBulky: false,
    specialRule: '可以像空手一樣與場景互動。'
  },
  {
    id: 'claymore_module',
    name: '大劍模組',
    attr1: 'DEX',
    attr2: 'INS',
    modifier: 1,
    damage: '【HR + 14】物理',
    range: 'melee',
    category: '劍',
    damageType: 'physical',
    isBulky: true,
    specialRule: '啟用時載具上不能裝備其他啟用的武裝模組。'
  },
  {
    id: 'esoteric_module',
    name: '高能量奧術模組',
    attr1: 'DEX',
    attr2: 'WLP',
    modifier: 0,
    damage: '【HR + 12】物理',
    range: 'melee',
    category: '奧術',
    damageType: 'physical',
    isBulky: true,
    specialRule: '啟用時載具上不能裝備其他啟用的武裝模組。'
  },
  {
    id: 'flail_module',
    name: '連枷模組',
    attr1: 'DEX',
    attr2: 'INS',
    modifier: 0,
    damage: '【HR + 10】物理',
    range: 'melee',
    category: '連枷',
    damageType: 'physical',
    isBulky: false,
    specialRule: '無'
  },
  {
    id: 'flamer_module',
    name: '火焰噴射模組',
    attr1: 'DEX',
    attr2: 'INS',
    modifier: 0,
    damage: '【HR + 8】火',
    range: 'ranged',
    category: '火器',
    damageType: 'fire',
    isBulky: false,
    specialRule: '無'
  },
  {
    id: 'machine_gun_module',
    name: '機關槍模組',
    attr1: 'DEX',
    attr2: 'INS',
    modifier: 0,
    damage: '【HR + 10】物理',
    range: 'ranged',
    category: '火器',
    damageType: 'physical',
    isBulky: true,
    specialRule: '啟用時載具上不能裝備其他啟用的武裝模組。使用該武裝模組進行攻擊動作時，你可以執行兩次單獨的攻擊（針對同一個目標或不同目標）。兩次攻擊都遵循雙武器戰鬥規則：失去多重且無法獲得，確定傷害時 HR 視為 0。'
  },
  {
    id: 'rifle_module',
    name: '步槍模組',
    attr1: 'DEX',
    attr2: 'INS',
    modifier: 0,
    damage: '【HR + 10】物理',
    range: 'ranged',
    category: '火器',
    damageType: 'physical',
    isBulky: false,
    specialRule: '無'
  },
  {
    id: 'scythe_module',
    name: '巨鐮模組',
    attr1: 'DEX',
    attr2: 'INS',
    modifier: 0,
    damage: '【HR + 16】物理',
    range: 'melee',
    category: '重型',
    damageType: 'physical',
    isBulky: true,
    specialRule: '啟用時載具上不能裝備其他啟用的武裝模組。'
  },
  {
    id: 'shield_module',
    name: '盾牌模組',
    attr1: null,
    attr2: null,
    modifier: 0,
    damage: null,
    range: null,
    category: '盾牌',
    isShield: true,
    frameRestrictions: ['exoskeleton', 'mecha'],
    isBulky: false,
    specialRule: '提供機師 DEF +2 和 M.DEF +2。只能在外骨骼或機甲框架啟用。不視為武器，視為一面裝備中的盾牌。只能裝備在副手欄位，除非持有【雙重盾牌】技能；持有該技能時雙盾額外造成 2 點傷害（同時啟用兩個盾牌模組可疊加）。'
  },
  {
    id: 'spear_module',
    name: '矛模組',
    attr1: 'DEX',
    attr2: 'INS',
    modifier: 0,
    damage: '【HR + 10】物理',
    range: 'melee',
    category: '矛',
    damageType: 'physical',
    isBulky: false,
    specialRule: '無'
  },
  {
    id: 'sword_module',
    name: '劍模組',
    attr1: 'DEX',
    attr2: 'INS',
    modifier: 1,
    damage: '【HR + 8】物理',
    range: 'melee',
    category: '劍',
    damageType: 'physical',
    isBulky: false,
    specialRule: '無'
  },
  {
    id: 'trident_module',
    name: '三叉戟模組',
    attr1: 'DEX',
    attr2: 'INS',
    modifier: 1,
    damage: '【HR + 14】物理',
    range: 'melee',
    category: '矛',
    damageType: 'physical',
    isBulky: true,
    specialRule: '啟用時載具上不能裝備其他啟用的武裝模組。'
  }
];

// 14 種支援模組
export const PILOT_SUPPORT_MODULES = [
  {
    id: 'aerial_module',
    name: '空戰模組',
    slotsCost: 2,
    frameRestrictions: null,
    description: '算作 2 個啟用模組。載具獲得飛行能力，旅程距離變為 ×3。駕駛時近戰可瞄準飛行目標；且載具內的任何生物都無法被近戰攻擊瞄準，除非攻擊者正在飛行或以某種方式能夠觸及飛行目標。當載具非啟動/停飛、機師處於危機狀態，或機師執行防禦掩護盟友時失效。此外，如果在衝突期間這台載具上的生物受到風、電或冰屬性傷害，此模組的增益將失效，直到你的下一個回合開始。'
  },
  {
    id: 'anti_element_module',
    name: '反元素模組',
    slotsCost: 1,
    frameRestrictions: null,
    hasSubchoice: true,
    choiceOptions: ['風', '電', '土', '火', '冰'],
    description: '啟用時，選擇風、電、土、火或冰其中一種屬性。載具上所有生物視為擁有對應傷害類型的抗性。'
  },
  {
    id: 'advanced_targeting_module',
    name: '高級瞄準模組',
    slotsCost: 1,
    frameRestrictions: null,
    description: '當駕駛這台載具時，你的命中檢定獲得 +2 加值，且你施展的攻擊性咒語的施法檢定也獲得 +2 加值。'
  },
  {
    id: 'counterstrike_module',
    name: '遠程反擊模組',
    slotsCost: 1,
    frameRestrictions: null,
    description: '在這台載具上的一名生物被遠程攻擊命中後，如果你正在駕駛這台載具，你可以消耗 1 點 IP。如果你這樣做，你會對攻擊者造成 10 點物理傷害（在他們的攻擊結算之後）。如果你達到 20 級或以上，此數值增加 5 點傷害；如果你達到 40 級或以上，此數值增加 10 點傷害。'
  },
  {
    id: 'excavation_module',
    name: '挖掘模組',
    slotsCost: 1,
    frameRestrictions: null,
    description: '載具可以在對地面進行挖掘，並且配備有強力探照燈。'
  },
  {
    id: 'expanded_plating_module',
    name: '鍍層擴展模組',
    slotsCost: 1,
    frameRestrictions: ['mecha', 'steed'],
    description: '僅限戰馬和機甲。當裝備啟動中的重裝、符文或標準鍍層時，乘客也可將物防/魔防替換為該模組數值（若乘客自身數值較高，可保留自身數值）。'
  },
  {
    id: 'magistatic_module',
    name: '魔能發電模組',
    slotsCost: 1,
    frameRestrictions: null,
    description: '在你支付了阿爾卡納、咒語或音調的 MP 消耗後，如果你正在駕駛這台載具並且裝備著奧術武器，你恢復 5 點 MP；如果消耗的 MP 等於或大於 30 點，則恢復 10 點 MP。'
  },
  {
    id: 'power_module',
    name: '高出力模組',
    slotsCost: 1,
    frameRestrictions: ['exoskeleton', 'mecha'],
    description: '僅限機甲和外骨骼。駕駛載具時，你所有關於依靠蠻力或身體抵抗的對抗檢定獲得 +2 加值。'
  },
  {
    id: 'rapid_interface_module',
    name: '快接模組',
    slotsCost: 1,
    frameRestrictions: null,
    description: '在衝突期間，當你在你的回合進入這台載具時，你可以執行一個額外的動作。'
  },
  {
    id: 'seafarer_module',
    name: '航海模組',
    slotsCost: 1,
    frameRestrictions: null,
    description: '這台載具可以在水面上和水下行駛。'
  },
  {
    id: 'seat_module',
    name: '座椅模組',
    slotsCost: 1,
    frameRestrictions: ['mecha', 'steed'],
    description: '僅限戰馬和機甲。這台載具可以額外運送一名人類體型的乘客。'
  },
  {
    id: 'secondary_offensive_module',
    name: '次要攻擊模組',
    slotsCost: 1,
    frameRestrictions: ['exoskeleton', 'mecha'],
    hasWeaponChoice: true,
    description: '僅限機甲和外骨骼。每次你在個人載具上啟用此模組時，選擇它的一個已停用的武裝模組。只要所選的模組處於停用狀態且此模組處於啟用狀態，你就可以使用一個動作來用該武裝模組執行一次自由攻擊。'
  },
  {
    id: 'sensor_module',
    name: '探測模組',
    slotsCost: 1,
    frameRestrictions: null,
    description: '駕駛載具時，你所有關於搜索附近生物、物品和地點的開放檢定獲得 +2 加值。'
  },
  {
    id: 'turbo_module',
    name: '渦輪增壓模組',
    slotsCost: 1,
    frameRestrictions: null,
    description: '駕駛載具時，你所有關於速度、快速機動的對抗檢定獲得 +2 加值。'
  }
];

// 計算機師解鎖模組總庫上限：SL 1 為 3 種，之後每級 +2 種
export function getUnlockedModuleQuota(sl = 1) {
  const safeSl = Math.max(1, Math.min(5, Number(sl) || 1));
  return 3 + (safeSl - 1) * 2;
}

// 計算機師同時啟用模組槽位上限：3 + SL
export function getActiveModuleCapacity(sl = 1) {
  const safeSl = Math.max(1, Math.min(5, Number(sl) || 1));
  return 3 + safeSl;
}

// 根據模組 ID 獲取模組定義
export function findModuleById(moduleId) {
  return (
    PILOT_ARMOR_MODULES.find(m => m.id === moduleId) ||
    PILOT_WEAPON_MODULES.find(m => m.id === moduleId) ||
    PILOT_SUPPORT_MODULES.find(m => m.id === moduleId) ||
    null
  );
}

// 根據框架 ID 獲取框架定義
export function findFrameById(frameId) {
  return PILOT_FRAMES.find(f => f.id === frameId) || PILOT_FRAMES[0];
}

// 預設空白載具資料結構
export function createDefaultVehicleData() {
  return {
    name: '個人載具',
    frameId: 'exoskeleton',
    unlockedModules: [], // 玩家已掌握的模組 ID 清單 (上限 3 + (SL-1)*2)
    activeModules: [],   // 目前啟用的模組 ID 清單 (佔用槽上限 3 + SL)
    antiElementChoice: '風',
    secondaryOffensiveWeaponId: '',
    isMounted: false
  };
}
