/**
 * 官方非通用專有規則手冊數據 (Rule Codex Database)
 * 嚴格收錄《Fabula Ultima Core Rulebook》在 5 個技能後擁有獨立章節與特殊子系統之規則：
 * 1. 阿爾卡納 (Arcana - Arcanist p.178-182)
 * 2. 儀式學派 (Ritual Magic - p.118-121)
 * 3. 小工具 (Gadgets - Tinkerer p.212-216)
 * 4. 造物專案 (Projects - p.134-135)
 * 5. 忠實夥伴 (Faithful Companion - Wayfarer p.302)
 * 6. 核心職業法術書 (Spellbooks - Elementalist/Entropist/Spiritist p.188-210)
 */

export const RULE_CODEX = {
  arcana: {
    id: 'arcana',
    title: '阿爾卡納',
    englishTitle: 'The Arcana',
    category: '秘儀召喚',
    page: 'Core Rulebook p.178-182',
    keywords: ['阿爾卡納', '阿爾卡納圓環', '綁定和召喚', '緊急秘儀', '秘儀學派儀式'],
    summary: '阿爾卡納是屬於神話實體或古代英靈的物質化身。秘儀師可花費 40 MP 將其召喚降臨，獲得常駐連攜增益；自願解除時可觸發毀天滅地的解除效果。',
    rules: [
      '你可以使用一個動作並花費 40 點 MP 來召喚一個你已經綁定的阿爾卡納。',
      '同一時間你只能與一個阿爾卡納處於連結狀態；若要召喚新的阿爾卡納，必須先解除當前連結。',
      '連攜增益：在召喚存續期間，秘儀師常駐獲得該阿爾卡納的所有屬性抗性與特殊能力。',
      '自願解除：在衝突中於你的回合內（使用動作之前或之後），你可自願解除連結並啟動其解除效果。',
      '自動解除：場景結束、陷入昏迷或死亡、離開場景時，阿爾卡納會自動解除（此時不觸發解除效果）。',
      '等級強化：若解除效果造成傷害，角色等級達 20 級時額外造成 10 點傷害；達 40 級時額外造成 20 點傷害。'
    ],
    catalog: [
      {
        id: 'forge',
        name: '鍛造之阿爾卡納',
        domains: '火、熱、金屬',
        merge: '對火屬性傷害擁有抗性。你造成的任何火屬性傷害無視抗性。',
        dismiss: '【鍛造】創造一件自選基本防具、盾牌或武器；【煉獄】對任意數量可見生物造成 30 點火屬性傷害（無視抗性）。'
      },
      {
        id: 'frost',
        name: '霜之阿爾卡納',
        domains: '寒冷、冰、沉默',
        merge: '對冰屬性傷害擁有抗性，並免疫憤怒。你造成的任何冰屬性傷害無視抗性。',
        dismiss: '【冰河時代】對任意數量可見生物造成 30 點冰屬性傷害（無視抗性）。'
      },
      {
        id: 'gate',
        name: '門之阿爾卡納',
        domains: '空間、旅行、虛空',
        merge: '對暗屬性傷害擁有抗性。你的魔防獲得 +1 加值。',
        dismiss: '【異界傳送】將你自己與所有在場自願盟友傳送至當前場景中你看得見的安全位置。'
      },
      {
        id: 'grimoire',
        name: '魔典之阿爾卡納',
        domains: '知識、啟示、理解',
        merge: '能夠讀、寫、說和理解所有語言。INS 骰子尺寸提升一階（最高為 d12）。',
        dismiss: '【神諭】向 GM 提出一個問題，GM 必須如實回答。直到下個黎明前不可再次使用。'
      },
      {
        id: 'oak',
        name: '橡樹之阿爾卡納',
        domains: '大地、植物、毒素',
        merge: '對土屬性與毒屬性傷害擁有抗性，並免疫中毒。每當你恢復 HP 時額外恢復 5 點。',
        dismiss: '【綻放】對任意數量可見生物（包含自己）：解除中毒，並恢復 40 點 HP（20級為50點，40級為60點）。'
      },
      {
        id: 'sky',
        name: '天空之阿爾卡納',
        domains: '霧、雨、風暴',
        merge: '對風屬性與電屬性傷害擁有抗性。可以使用一個動作準確預測未來 24 小時天氣。',
        dismiss: '【雷霆風暴】對所有可見敵對生物造成 30 點電屬性傷害（無視抗性），並使其陷入緩慢或動搖。'
      },
      {
        id: 'sword',
        name: '劍之阿爾卡納',
        domains: '榮譽、勇氣、衝突',
        merge: '物防獲得 +1 加值。進行自由攻擊時造成的傷害額外增加 5 點。',
        dismiss: '【百萬兵刃】對任意數量可見生物造成 30 點物理傷害（無視抗性）。'
      },
      {
        id: 'tower',
        name: '王權之阿爾卡納',
        domains: '統禦、堅定、秩序',
        merge: '所有屬性檢定結果為偶數時獲得 +1 加值。',
        dismiss: '【王權敕令】選擇一個敵對目標，使其在本輪中失去下一次行動機會，並陷入動搖。'
      }
    ]
  },

  rituals: {
    id: 'rituals',
    title: '儀式學派',
    englishTitle: 'Ritual Magic',
    category: '魔法學派',
    page: 'Core Rulebook p.118-121',
    keywords: ['儀式學派', '秘儀學派儀式', '嵌合學派儀式', '元素學派儀式', '熵系學派儀式', '靈魂學派儀式'],
    summary: '儀式魔法是無需預先習得特定法術，只要效果屬於自身所掌握學派領域即可施展的深奧魔法。由 GM 判定強度、範圍與消耗。',
    disciplines: [
      { name: '秘儀學派', formula: '【WLP + WLP】', domains: '取決於施法者已綁定阿爾卡納之神聖領域。' },
      { name: '嵌合學派', formula: '【INS + WLP】或【MIG + WLP】', domains: '模仿野獸、魔獸與植物之能力、感官、感知與生物本能。' },
      { name: '元素學派', formula: '【INS + WLP】', domains: '喚起與操縱火、冰、電、風、土之自然界元素狂潮。' },
      { name: '熵學派', formula: '【INS + WLP】', domains: '操縱時間流動、引力、空間曲率、熱力學熵增與因果命運。' },
      { name: '靈魂學派', formula: '【INS + WLP】', domains: '靈魂、生命力淨化、神聖光輝、暗影遮蔽、精神感應與情感共鳴。' }
    ],
    costTable: [
      { tier: '初級儀式 (Minor)', mp: '20 MP', dl: '10', time: '數分鐘', desc: '對單一目標或小區域產生溫和或局部的超自然效果（如淨化水源、引燃熄滅火焰、感應附近魔力）。' },
      { tier: '中級儀式 (Medium)', mp: '30 MP', dl: '10', time: '約半小時', desc: '顯著影響場景環境、多個目標，或產生強力的探測與防禦結界（如透視迷宮、全隊短暫水下呼吸）。' },
      { tier: '高級儀式 (Major)', mp: '40 MP', dl: '12', time: '數小時', desc: '改變地形、召喚巨型風暴、大範圍長久結界或跨空間傳訊（如平息火山、修復古代結界核心）。' },
      { tier: '極限儀式 (Extreme)', mp: '50 MP', dl: '14', time: '數天或特別儀軌', desc: '傳奇級壯舉，需要珍稀材料與團隊協力推動命刻（如打破封印、復活死者靈魂、重塑天地）。' }
    ]
  },

  gadgets: {
    id: 'gadgets',
    title: '小工具',
    englishTitle: 'Gadgets',
    category: '修補科技',
    page: 'Core Rulebook p.212-216',
    keywords: ['小工具', '煉金術', '灌注術', '魔導科技', '秘密配方', '藥水雨'],
    summary: '修補匠的獨門發明，包含煉金術、灌注術與魔導科技三大派別。每次習得特技可解鎖新類型基礎益處，或既有類型的進階、上位益處。消耗 IP 即時合成。',
    branches: [
      {
        name: '煉金術',
        english: 'Alchemy',
        desc: '運用萃取蒸餾即時調配藥水。',
        tiers: [
          { level: '基礎益處', cost: '2 IP', desc: '製造藥水：恢復單一生物 40 點 HP 或 40 點 MP；或對目標施加一個異常狀態。' },
          { level: '進階益處', cost: '3 IP', desc: '製造強效藥水：恢復單一生物 70 點 HP 或 70 點 MP；或解除兩個異常狀態。' },
          { level: '上位益處', cost: '4 IP', desc: '製造極限藥水：完全恢復單一生物的 HP 或 MP；或治癒致命毒素與強力詛咒。' }
        ]
      },
      {
        name: '灌注術',
        english: 'Infusions',
        desc: '為裝備短暫注入強烈的元素屬性親和。',
        tiers: [
          { level: '基礎益處', cost: '2 IP', desc: '為一件武器或防具注入單一屬性親和（如火、冰、雷），持續至場景結束。' },
          { level: '進階益處', cost: '3 IP', desc: '為防具注入雙重屬性抗性，或使武器攻擊必定施加對應元素之異常狀態。' },
          { level: '上位益處', cost: '4 IP', desc: '賦予目標全元素傷害吸收，或武器攻擊轉化為全場無視抗性的元素爆發。' }
        ]
      },
      {
        name: '魔導科技',
        english: 'Magitech',
        desc: '製造魔導球與元素碎片等外骨骼與投擲奇物。',
        tiers: [
          { level: '基礎益處', cost: '2 IP', desc: '製造魔導球或元素碎片投擲物：造成 20 點屬性傷害。' },
          { level: '進階益處', cost: '3 IP', desc: '製造進階魔導裝置：造成 35 點屬性傷害並摧毀目標護盾或防具。' },
          { level: '上位益處', cost: '4 IP', desc: '部署小型自動自走防禦砲台或屏障力場發生器。' }
        ]
      }
    ]
  },

  projects: {
    id: 'projects',
    title: '造物專案',
    englishTitle: 'Projects',
    category: '工坊研發',
    page: 'Core Rulebook p.134-135',
    keywords: ['造物專案', '造物', '高瞻遠矚'],
    summary: '研製全新裝備、消耗品或奇物設備的完整體系。由 GM 判定發明階級，計算所需材料 Zenit 與進度命刻格數，休整期每天推動進度。',
    rules: [
      '專案發起：玩家向 GM 提出想要發明的裝備、消耗品或奇物。',
      'GM 裁定：依據其對遊戲平衡與劇情的影響，將其評定為簡單、實用、重大或傳奇發明。',
      '材料成本：由團隊或發明者支付所需的材料費用（Zenit）；修補匠《高瞻遠矚》可自動抵扣【SL × 100】z。',
      '進度命刻：設定 4、6、8、10 或 12 格命刻。日常推進每天自動累積 1 點進度（修補匠每日額外 +SL 點）。'
    ],
    tiers: [
      { tier: '簡單專案 (Minor)', cost: '100 ~ 300z', clock: '4 格或 6 格', time: '1 ~ 3 天', example: '改良現有常規武器、簡易實用探險工具、應急滑翔翼。' },
      { tier: '實用專案 (Useful)', cost: '500 ~ 1,000z', clock: '6 格或 8 格', time: '數天至一週', example: '自製精良武器或防具、可重複使用之探測發明、廣域解毒劑配方。' },
      { tier: '重大專案 (Major)', cost: '1,500 ~ 3,000z', clock: '8 格或 10 格', time: '數週', example: '改造飛空艇魔導引擎、製作強大魔法飾品、研發便攜式力場屏障。' },
      { tier: '傳奇專案 (Extreme)', cost: '5,000z+', clock: '10 格或 12 格', time: '數月或整個戰役', example: '古代巨神兵修復、神話級武裝鍛造、浮空要塞防衛系統。' }
    ]
  },

  companion: {
    id: 'companion',
    title: '忠實夥伴',
    englishTitle: 'Faithful Companion',
    category: '旅人隨從',
    page: 'Core Rulebook p.302',
    keywords: ['忠實夥伴'],
    summary: '旅人的專屬 5 級隨從生物。不獲先攻、不升級，旅人可花費動作指揮其行動，擁有專屬四維、生命值與雙基礎攻擊。',
    rules: [
      '生物等級：固定為 5 級。',
      '物種選擇：野獸 (Beast)、構造體 (Construct)、元素 (Elemental) 或植物 (Plant) 四選一。',
      '屬性配置：從【d8, d8, d6, d6】或【d10, d6, d6, d6】兩組中任選一組，分配至 DEX, INS, MIG, WLP。',
      '最大生命值：【(SL × 夥伴基礎 MIG 骰尺寸) + 旅人等級的一半】（向下取整）。危機值為最大 HP / 2。',
      '防禦分數：物理防禦 DEF = 夥伴 DEX 骰；魔法防禦 M.DEF = 夥伴 INS 骰。',
      '基礎攻擊：擁有最多 2 種基礎攻擊（近戰【MIG + DEX】或遠程【DEX + INS】等，命中與魔法檢定獲得等於【SL】的加值）。',
      '行動指揮：夥伴在衝突中沒有自己的回合，但在旅人回合中，旅人可使用一個動作讓夥伴執行動作（每回合限一次）。',
      '陣亡與回歸：夥伴 HP 降至 0 時會逃離戰場；在旅人登場的下一場景以危機 HP 重新歸隊。'
    ]
  },

  spellbooks: {
    id: 'spellbooks',
    title: '核心職業法術書',
    englishTitle: 'Core Spellbooks',
    category: '法術目錄',
    page: 'Core Rulebook p.188-210',
    keywords: ['元素魔法', '熵系魔法', '靈魂魔法', '咒語模仿'],
    summary: '收錄元素師（火冰雷風地）、熵師（時空混亂）與靈師（光暗治癒）核心三大施法者的完整官方咒語目錄。',
    schools: [
      {
        name: '元素魔法 (Elementalist)',
        spells: [
          { name: '耀斑 (Flare)', mp: '10 × T', target: '至多 3 個生物', duration: '瞬發', offensive: true, desc: '對每個目標造成【HR + 15】火屬性傷害。' },
          { name: '冰山 (Iceberg)', mp: '10 × T', target: '至多 3 個生物', duration: '瞬發', offensive: true, desc: '對每個目標造成【HR + 15】冰屬性傷害。' },
          { name: '落雷 (Thunderbolt)', mp: '10 × T', target: '至多 3 個生物', duration: '瞬發', offensive: true, desc: '對每個目標造成【HR + 15】電屬性傷害。' },
          { name: '風漩 (Vortex)', mp: '10 × T', target: '至多 3 個生物', duration: '瞬發', offensive: true, desc: '對每個目標造成【HR + 15】風屬性傷害。' },
          { name: '地震 (Terra)', mp: '10 × T', target: '至多 3 個生物', duration: '瞬發', offensive: true, desc: '對每個目標造成【HR + 15】土屬性傷害。' },
          { name: '元素護盾 (Elemental Shield)', mp: '5 × T', target: '至多 3 個生物', duration: '場景', offensive: false, desc: '目標對自選一種元素傷害（火/冰/雷/風/土）獲得抗性。' },
          { name: '元素武裝 (Elemental Weapon)', mp: '10', target: '一件武器', duration: '場景', offensive: false, desc: '所選武器造成的所有傷害轉化為所選元素類型。' }
        ]
      },
      {
        name: '熵系魔法 (Entropist)',
        spells: [
          { name: '加速 (Acceleration)', mp: '20', target: '一個生物', duration: '場景', offensive: false, desc: '目標在每輪可於不同輪次中行動兩次。' },
          { name: '異相 (Anomaly)', mp: '10 × T', target: '至多 3 個生物', duration: '瞬發', offensive: true, desc: '對每個目標造成【HR + 15】暗屬性傷害，並使其隨機陷入一個異常狀態。' },
          { name: '暗影武裝 (Dark Weapon)', mp: '10', target: '一件武器', duration: '場景', offensive: false, desc: '武器傷害轉化為暗屬性，且額外造成 5 點傷害。' },
          { name: '占卜 (Divination)', mp: '10', target: '自己', duration: '場景', offensive: false, desc: '可重擲一次任意檢定。' },
          { name: '時停 (Stop)', mp: '10 × T', target: '至多 3 個生物', duration: '瞬發', offensive: true, desc: '目標陷入緩慢與眩暈狀態。' }
        ]
      },
      {
        name: '靈魂魔法 (Spiritist)',
        spells: [
          { name: '護甲 (Armor)', mp: '5 × T', target: '至多 3 個生物', duration: '場景', offensive: false, desc: '目標物防 DEF 獲得 +2 加值。' },
          { name: '屏障 (Barrier)', mp: '5 × T', target: '至多 3 個生物', duration: '場景', offensive: false, desc: '目標魔防 M.DEF 獲得 +2 加值。' },
          { name: '淨化 (Cleanse)', mp: '5 × T', target: '至多 3 個生物', duration: '瞬發', offensive: false, desc: '解除目標身上的所有異常狀態。' },
          { name: '治療 (Heal)', mp: '10 × T', target: '至多 3 個生物', duration: '瞬發', offensive: false, desc: '為每個目標恢復 40 點 HP。' },
          { name: '聖光 (Lux)', mp: '10 × T', target: '至多 3 個生物', duration: '瞬發', offensive: true, desc: '對每個目標造成【HR + 15】光屬性傷害。' },
          { name: '慈悲 (Mercy)', mp: '20', target: '一個生物', duration: '場景', offensive: false, desc: '目標受到致死傷害時，生命值降為 1 而非 0（限一次）。' }
        ]
      }
    ]
  }
};

export function findCodexRule(term) {
  if (!term) return null;
  const lower = term.toLowerCase().trim();
  for (const key of Object.keys(RULE_CODEX)) {
    const item = RULE_CODEX[key];
    if (item.id === lower || item.title === term || item.keywords.some(k => k === term || lower === k.toLowerCase())) {
      return item;
    }
  }
  return null;
}

