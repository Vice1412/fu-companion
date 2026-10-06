import React, { useMemo, useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { GiScrollUnfurled, GiCheckMark } from 'react-icons/gi';
import JRPGButton from '../../../components/ui/JRPGButton';
import GameIcon from '../../../components/ui/GameIcon';
import rulesData from '../data/rulesData.json';
import { calculateCharacterStats, getProficiencies } from '../utils/characterEngine';

/**
 * 官方角色卡三頁匯出 (Official Sheet Export)
 *
 * 依 `Fabula-Ultima-Character-Sheet.pdf`（官方三頁橫向 A4 表格）的**版面**重繪，
 * 內容全部換成本專案這張卡的實際資料：
 *   P1 主卡：姓名／特質／羈絆／物語點／經驗點／先攻與防禦／裝備／行囊／資金
 *           ｜肖像／四維與狀態／HP·MP·IP／職業×3
 *   P2 續頁：其他職業×4／英雄技能 ｜ 奧祕與咒語×7／儀式學派
 *   P3 續頁：奧祕與咒語×14／儀式學派
 *
 * 幾個刻意的決定：
 * 1. **版面照官方，文字用中文。** 依 `GEMINI.md` 規則三（純中文顯示鐵律），
 *    欄位標題一律中文；官方原表是英文，但本專案不是英文介面。
 * 2. **配色照官方**（深青綠標題條 ＋ 淺灰欄位底 ＋ 白底）。這是「印出來的文件」，
 *    不是應用程式介面，所以不套羊皮紙色系。
 * 3. **物語點／經驗點框裡印的是官方原表自己印的那段規則文字**，
 *    來源就是這張官方表格（不是憑記憶編的）；中文用本專案的既有定譯
 *    （物語點／反派／大失敗／羈絆強度／終結點／特質）。
 * 4. **儀式學派的勾選是資料推導的**：角色實際持有的技能名稱裡若含某學派名
 *    （例如「元素學派儀式」），就勾該學派——不是靠「哪個職業對應哪個學派」的記憶。
 * 5. 版面固定 1123×794 px（A4 橫向 @96dpi），與官方 842×595 pt 等比。
 *
 * `buildSheetModel` 是純函式：所有欄位對應都在那裡，測試直接驗它，
 * 不必渲染整張表。
 */

/** A4 橫向 @96dpi（官方為 842×595 pt） */
export const SHEET_PAGE_WIDTH = 1123;
export const SHEET_PAGE_HEIGHT = 794;

const C = {
  bar: '#2f5d57',
  barText: '#ffffff',
  border: '#b9c6c3',
  soft: '#f2f4f3',
  ink: '#1b2b28',
  faint: '#6b7a77'
};

const S = {
  page: {
    width: SHEET_PAGE_WIDTH,
    height: SHEET_PAGE_HEIGHT,
    backgroundColor: '#ffffff',
    color: C.ink,
    padding: '20px 22px',
    boxSizing: 'border-box',
    display: 'flex',
    gap: '16px',
    fontFamily: '"Segoe UI", "Microsoft JhengHei", "Noto Sans TC", sans-serif',
    overflow: 'hidden'
  },
  col: { display: 'flex', flexDirection: 'column', gap: '7px', minWidth: 0 },
  box: {
    border: `1px solid ${C.border}`,
    borderRadius: '3px',
    overflow: 'hidden',
    backgroundColor: '#ffffff'
  },
  bar: {
    backgroundColor: C.bar,
    color: C.barText,
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    padding: '2px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  barNote: { fontSize: '8.5px', fontWeight: 400, opacity: 0.92 },
  body: { padding: '6px 8px' },
  label: { fontSize: '9px', fontWeight: 700, color: C.ink, letterSpacing: '0.04em' },
  value: { fontSize: '10px', color: C.ink },
  faint: { fontSize: '8.5px', color: C.faint },
  line: { borderBottom: `1px solid ${C.border}`, minHeight: '14px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' },
  cell: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9.5px' },
  tableHead: {
    display: 'grid',
    fontSize: '8.5px',
    fontWeight: 700,
    color: C.faint,
    letterSpacing: '0.06em',
    borderBottom: `1px solid ${C.border}`,
    paddingBottom: '2px'
  }
};

const Check = ({ on }) => (
  <span
    style={{
      width: '10px',
      height: '10px',
      border: `1px solid ${C.ink}`,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '9px',
      lineHeight: 1,
      flex: '0 0 auto',
      backgroundColor: on ? C.ink : '#ffffff',
      color: on ? '#ffffff' : 'transparent'
    }}
  >
    {on ? '✓' : ''}
  </span>
);

const Line = ({ children, grow = false }) => (
  <span style={{ ...S.line, flex: grow ? '1 1 auto' : '0 0 auto', minWidth: grow ? 0 : '60px' }}>
    <span style={S.value}>{children || ''}</span>
  </span>
);

const Box = ({ title, note, children, style, bodyStyle }) => (
  <div style={{ ...S.box, ...style }}>
    <div style={S.bar}>
      <span>{title}</span>
      {note ? <span style={S.barNote}>{note}</span> : null}
    </div>
    <div style={{ ...S.body, ...bodyStyle }}>{children}</div>
  </div>
);

/** 官方原表 P1 印的物語點規則（中文用本專案既有定譯） */
export const FABULA_POINT_RULES = Object.freeze([
  '場景開始時若你沒有任何物語點，獲得 1 點。',
  '反派登場時，獲得 1 點。',
  '你在大失敗時，獲得 1 點。',
  '你在 0 HP 時投降，獲得 2 點。',
  '執行檢定後花費 1 點，觸發一項特質，重擲一顆或兩顆骰子（大失敗時不能）。',
  '執行檢定後花費 1 點，觸發一項羈絆，將其強度加到結果上（每次檢定一次）。',
  '花費 1 點來改變故事；若要改動既有的設定，需取得引入該設定者的同意。'
]);

/** 官方原表 P1 印的經驗點規則 */
export const EXPERIENCE_POINT_RULES = Object.freeze([
  '每次聚會結束時，你自動獲得 5 點經驗值。然後：',
  '獲得等同於【團隊花費的物語點 × 玩家角色人數】的經驗值。',
  '獲得等同於【反派花費的終結點】的經驗值。',
  '最後，若你有 10 點以上經驗值，失去 10 點並提升 1 級。'
]);

/** 儀式六學派（取自本專案技能名稱所用的學派詞） */
export const SHEET_DISCIPLINES = Object.freeze([
  '秘儀學派', '嵌合學派', '元素學派', '熵系學派', '靈魂學派', '儀式學派'
]);

const FEELINGS = Object.freeze([
  ['admiration', '欽佩'],
  ['inferiority', '自卑'],
  ['loyalty', '忠誠'],
  ['mistrust', '不信任'],
  ['affection', '親愛'],
  ['hatred', '憎恨']
]);

const ATTRIBUTES = Object.freeze([
  ['dex', 'DEX', '敏捷'],
  ['ins', 'INS', '洞察'],
  ['mig', 'MIG', '體魄'],
  ['wlp', 'WLP', '意志']
]);

/** 引擎算出來的「當前骰階」欄位名（狀態減值只影響這裡） */
const CURRENT_ATTR_KEYS = Object.freeze({
  dex: 'currentDex',
  ins: 'currentIns',
  mig: 'currentMig',
  wlp: 'currentWlp'
});

const STATUSES = Object.freeze([
  ['slow', '緩慢'],
  ['dazed', '眩暈'],
  ['weak', '虛弱'],
  ['poisoned', '中毒'],
  ['shaken', '動搖'],
  ['enraged', '憤怒']
]);

const EQUIP_SLOTS = Object.freeze([
  ['accessory', '配件'],
  ['armor', '防具'],
  ['mainHand', '主手'],
  ['offHand', '副手']
]);

/** 空插槽（官方表就是留空格給手寫） */
const blanks = (n) => Array.from({ length: n }, () => null);

/**
 * 把角色資料整理成三頁要用的欄位。純函式，不碰 DOM。
 */
export const buildSheetModel = (character, stats = null) => {
  const ch = character || {};
  const s = stats || calculateCharacterStats(ch);
  const profs = getProficiencies(ch);
  const equipment = ch.equipment || {};

  const resolve = (cur, max) => (cur === null || cur === undefined ? max : cur);

  // 羈絆：固定 6 格，把 feelings 轉成勾選狀態
  const bonds = blanks(6).map((_, i) => {
    const bond = (ch.bonds || [])[i];
    return {
      index: i + 1,
      target: bond?.target || '',
      feelings: FEELINGS.reduce((acc, [key]) => {
        acc[key] = Boolean(bond?.feelings?.includes(key));
        return acc;
      }, {})
    };
  });

  // 裝備：四列，各自帶規則書上的說明
  const findWeapon = (n) => rulesData.equipment.weapons.find((w) => w.name === n);
  const findShield = (n) => rulesData.equipment.shields.find((x) => x.name === n);
  const findArmor = (n) => rulesData.equipment.armors.find((x) => x.name === n);
  const findAccessory = (n) => rulesData.equipment.accessories.find((x) => x.name === n);
  const describe = (item) => {
    if (!item) return '';
    if (item.damage) return `${item.attr} ｜ ${item.damage} ｜ ${item.range}`;
    return item.desc || '';
  };
  const equipmentRows = EQUIP_SLOTS.map(([slot, label]) => {
    const name = equipment[slot] || '';
    const item = slot === 'armor'
      ? findArmor(name)
      : (slot === 'accessory' ? findAccessory(name) : (findShield(name) || findWeapon(name)));
    return { slot, label, name: item ? item.name : name, desc: describe(item) };
  });

  // 技能名稱裡含學派名 → 該學派打勾（資料推導，不靠職業對應的記憶）
  const skillNames = (ch.classes || []).flatMap((cl) => (cl.skills || []).map((sk) => sk.name));
  const disciplines = SHEET_DISCIPLINES.map((name) => ({
    name,
    on: skillNames.some((sn) => sn.includes(name))
  }));

  // 咒語：官方表的每一列是 名稱／MP／目標／持續時間 ＋ 說明
  const spellRows = (ch.spells || []).map((sp) => ({
    name: sp.name || '',
    mp: sp.mp || '',
    targets: sp.target || sp.targets || '',
    duration: sp.duration || '',
    desc: sp.desc || sp.effect || ''
  }));

  const classes = (ch.classes || []).map((cl) => ({
    className: cl.className,
    level: cl.level || 0,
    freeBenefit: cl.chosenBenefit === 'mp' ? '最大 MP +5' : (cl.chosenBenefit === 'hp' ? '最大 HP +5' : ''),
    skills: (cl.skills || []).map((sk) => `${sk.name}　SL ${sk.sl}`)
  }));

  return {
    name: ch.name || '',
    pronouns: '',
    identity: ch.identity || '',
    theme: ch.theme || '',
    origin: ch.origin || '',
    bonds,
    fabulaPoints: ch.fabulaPoints ?? 3,
    exp: ch.exp || 0,
    zenit: ch.zenit || 0,
    initiative: s.init ?? 0,
    defense: s.def ?? 0,
    magicDefense: s.mdef ?? 0,
    crisisThreshold: s.crisisThreshold ?? 0,
    proficiencies: profs,
    equipmentRows,
    backpackNotes: ch.backpackNotes || '',
    avatar: ch.avatar || null,
    attributes: {
      base: ATTRIBUTES.map(([key, en, cn]) => ({ key, en, cn, value: ch.attributes?.[key] || 0 })),
      current: ATTRIBUTES.map(([key, en, cn]) => ({
        key,
        en,
        cn,
        value: s[CURRENT_ATTR_KEYS[key]] ?? (ch.attributes?.[key] || 0)
      }))
    },
    statuses: STATUSES.map(([key, cn]) => ({ key, cn, on: Boolean(ch.statusAfflictions?.[key]) })),
    pools: {
      hp: { max: s.maxHp ?? 0, current: resolve(ch.currentHp, s.maxHp ?? 0) },
      mp: { max: s.maxMp ?? 0, current: resolve(ch.currentMp, s.maxMp ?? 0) },
      ip: { max: s.maxIp ?? 0, current: resolve(ch.currentIp, s.maxIp ?? 0) }
    },
    classes,
    page1Classes: classes.slice(0, 3),
    otherClasses: classes.slice(3, 7),
    heroicSkills: (ch.heroicSkills || []).map((h) => (typeof h === 'string' ? h : `${h.name}${h.sl ? `　SL ${h.sl}` : ''}`)),
    spells: spellRows,
    page2Spells: spellRows.slice(0, 7),
    page3Spells: spellRows.slice(7, 21),
    disciplines,
    quirk: ch.quirk && ch.quirk !== '無' ? ch.quirk : ''
  };
};

// ───────────────────────────────────────── 共用小區塊

const NameHeader = ({ model, full = false }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', marginBottom: '4px' }}>
    <span style={{ ...S.label, fontSize: '10px' }}>姓名</span>
    <span style={{ ...S.line, flex: '1 1 auto', minWidth: 0, fontSize: '13px', fontWeight: 700 }}>
      {model.name}
    </span>
    {!full && (
      <>
        <span style={{ ...S.label, fontSize: '10px', marginLeft: '8px' }}>代名詞</span>
        <span style={{ ...S.line, flex: '0 0 120px' }}>{model.pronouns}</span>
      </>
    )}
  </div>
);

const TraitsBox = ({ model }) => (
  <Box title="特質">
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ ...S.label, flex: '0 0 34px' }}>身分</span>
        <Line grow>{model.identity}</Line>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ ...S.label, flex: '0 0 34px' }}>主題</span>
        <Line grow>{model.theme}</Line>
        <span style={{ ...S.label, flex: '0 0 34px' }}>出身</span>
        <Line grow>{model.origin}</Line>
      </div>
    </div>
  </Box>
);

const BondsBox = ({ model }) => (
  <Box title="羈絆">
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 14px' }}>
      {model.bonds.map((bond) => (
        <div key={bond.index} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ ...S.faint, width: '8px' }}>{bond.index}</span>
          <span style={{ ...S.line, flex: '0 0 74px', fontSize: '9.5px' }}>{bond.target}</span>
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 6px', flex: '1 1 auto' }}>
            {FEELINGS.map(([key, cn]) => (
              <span key={key} style={{ ...S.cell, fontSize: '8px', gap: '2px' }}>
                <Check on={bond.feelings[key]} />
                {cn}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  </Box>
);

const RulesList = ({ lines }) => (
  <ul style={{ margin: 0, paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '1.5px' }}>
    {lines.map((t) => (
      <li key={t} style={{ fontSize: '8.5px', lineHeight: 1.35 }}>{t}</li>
    ))}
  </ul>
);

const ClassSlot = ({ slot }) => (
  <div style={{ ...S.box, display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: '104px' }}>
    <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ flex: '0 0 52%', backgroundColor: C.bar, color: C.barText, fontSize: '8.5px', fontWeight: 700, padding: '2px 6px' }}>
        職業 / 等級
      </div>
      <div style={{ flex: '1 1 auto', backgroundColor: C.soft, fontSize: '8.5px', fontWeight: 700, padding: '2px 6px' }}>
        免費增益
      </div>
    </div>
    <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ flex: '0 0 52%', fontSize: '11px', fontWeight: 700, padding: '3px 6px' }}>
        {slot ? `${slot.className}　Lv ${slot.level}` : ''}
      </div>
      <div style={{ flex: '1 1 auto', fontSize: '9px', padding: '3px 6px', backgroundColor: '#fbfcfc' }}>
        {slot?.freeBenefit || ''}
      </div>
    </div>
    <div style={{ flex: '1 1 auto', padding: '3px 6px' }}>
      <div style={{ ...S.faint, fontSize: '8px', marginBottom: '2px' }}>技能資訊</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {(slot?.skills || []).map((t) => (
          <span key={t} style={{ fontSize: '9px' }}>{t}</span>
        ))}
      </div>
    </div>
  </div>
);

const SpellTable = ({ rows, count }) => {
  const filled = rows.length > 0 ? rows : [];
  const blanksNeeded = Math.max(0, count - filled.length);
  const cols = '1.6fr 0.45fr 1fr 0.85fr';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}>
      {/* 官方表只有一列標題，不是每一條咒語都重印一次 */}
      <div style={{ ...S.tableHead, gridTemplateColumns: cols }}>
        <span>名稱</span><span>MP</span><span>目標</span><span>持續時間</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}>
        {filled.map((sp) => (
          <div key={sp.name} style={{ borderBottom: `1px solid ${C.border}`, padding: '2px 0 3px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: cols, fontSize: '9.5px', fontWeight: 700 }}>
              <span>{sp.name}</span><span>{sp.mp}</span><span>{sp.targets}</span><span>{sp.duration}</span>
            </div>
            {sp.desc ? (
              <div style={{ fontSize: '8.5px', lineHeight: 1.3, color: C.ink, whiteSpace: 'pre-wrap' }}>{sp.desc}</div>
            ) : null}
          </div>
        ))}
        {Array.from({ length: blanksNeeded }).map((_, i) => (
          <div
            key={`blank-${i}`}
            style={{
              borderBottom: `1px solid ${C.border}`,
              flex: '1 1 auto',
              minHeight: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              padding: '2px 0'
            }}
          >
            <div style={{ height: '13px', backgroundColor: C.soft, borderRadius: '2px' }} />
            <div style={{ flex: '1 1 auto', backgroundColor: '#fafbfb', borderRadius: '2px' }} />
          </div>
        ))}
      </div>
    </div>
  );
};

const RitualBox = ({ model }) => (
  <Box title="儀式">
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <span style={{ ...S.label }}>學派：</span>
      {model.disciplines.map((d) => (
        <span key={d.name} style={{ ...S.cell, fontSize: '9px' }}>
          <Check on={d.on} />
          {d.name}
        </span>
      ))}
    </div>
  </Box>
);

// ───────────────────────────────────────── 三頁

export const OfficialSheetPage1 = ({ model }) => (
  <div style={S.page} data-sheet-page="1">
    {/* 左欄 */}
    <div style={{ ...S.col, flex: '0 0 528px' }}>
      <NameHeader model={model} />
      <TraitsBox model={model} />
      <BondsBox model={model} />

      <Box title="物語點" note={`目前：${model.fabulaPoints}`}>
        <RulesList lines={FABULA_POINT_RULES} />
      </Box>

      <div style={{ display: 'flex', gap: '7px', alignItems: 'stretch' }}>
        <Box title="經驗點" note={`目前：${model.exp}`} style={{ flex: '1 1 60%' }}>
          <RulesList lines={EXPERIENCE_POINT_RULES} />
        </Box>
        <div style={{ ...S.box, flex: '1 1 40%' }}>
          <div style={S.bar}><span>先攻修正</span></div>
          <div style={{ padding: '4px 8px', fontSize: '14px', fontWeight: 700, borderBottom: `1px solid ${C.border}` }}>
            {model.initiative}
          </div>
          <div style={S.bar}><span>物防</span></div>
          <div style={{ padding: '4px 8px', fontSize: '14px', fontWeight: 700, borderBottom: `1px solid ${C.border}` }}>
            {model.defense}
          </div>
          <div style={S.bar}><span>魔防</span></div>
          <div style={{ padding: '4px 8px', fontSize: '14px', fontWeight: 700 }}>
            {model.magicDefense}
          </div>
        </div>
      </div>

      <Box
        title="裝備"
        note="可裝備："
        style={{ flex: '1 1 auto' }}
      >
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '5px' }}>
          {[['martialArmor', '職業防具'], ['martialShields', '職業盾牌'], ['martialMelee', '職業近戰武器'], ['martialRanged', '職業遠程武器']]
            .map(([key, cn]) => (
              <span key={key} style={{ ...S.cell, fontSize: '9px' }}>
                <Check on={Boolean(model.proficiencies[key])} />
                {cn}
              </span>
            ))}
        </div>
        <div style={{ ...S.tableHead, gridTemplateColumns: '120px 1fr', marginBottom: '2px' }}>
          <span>已裝備項目</span><span>說明</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {model.equipmentRows.map((row) => (
            <div
              key={row.slot}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                borderTop: `1px solid ${C.border}`,
                padding: '3px 0',
                alignItems: 'start'
              }}
            >
              <div>
                <div style={{ ...S.faint, fontSize: '7.5px' }}>{row.label}</div>
                <div style={{ fontSize: '10px', fontWeight: 700 }}>{row.name}</div>
              </div>
              <div style={{ fontSize: '8.5px', lineHeight: 1.3 }}>{row.desc}</div>
            </div>
          ))}
        </div>
      </Box>

      <div style={{ display: 'flex', gap: '7px', alignItems: 'stretch' }}>
        <Box title="行囊與筆記" style={{ flex: '1 1 auto' }}>
          <div style={{ fontSize: '9px', lineHeight: 1.35, whiteSpace: 'pre-wrap', minHeight: '44px' }}>
            {model.backpackNotes}
          </div>
        </Box>
        <div style={{ ...S.box, flex: '0 0 120px' }}>
          <div style={S.bar}><span>資金</span></div>
          <div style={{ padding: '8px', textAlign: 'center', fontSize: '16px', fontWeight: 700 }}>
            {model.zenit}<span style={{ fontSize: '10px' }}> z</span>
          </div>
        </div>
      </div>
    </div>

    {/* 右欄 */}
    <div style={{ ...S.col, flex: '1 1 auto' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
        <div
          style={{
            ...S.box,
            flex: '0 0 150px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '150px'
          }}
        >
          {model.avatar && (model.avatar.startsWith('http') || model.avatar.startsWith('data:')) ? (
            <img src={model.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : model.avatar ? (
            <GameIcon name={model.avatar} size={72} style={{ color: C.bar }} />
          ) : (
            <span style={S.faint}>肖像</span>
          )}
        </div>

        <Box title="四維屬性與狀態" style={{ flex: '1 1 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr', ...S.faint, fontSize: '8px' }}>
              <span /><span>基礎</span><span>當前</span>
            </div>
            {model.attributes.base.map((a, i) => (
              <div key={a.key} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr', alignItems: 'center' }}>
                <span style={{ fontSize: '9.5px', fontWeight: 700 }}>{a.cn} {a.en}</span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>d{a.value}</span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>
                  d{model.attributes.current[i].value}
                </span>
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', marginTop: '3px' }}>
              {model.statuses.map((st) => (
                <span key={st.key} style={{ ...S.cell, fontSize: '8.5px' }}>
                  <Check on={st.on} />
                  {st.cn}
                </span>
              ))}
            </div>
          </div>
        </Box>
      </div>

      <Box title="生命值・魔力值・物品點">
        <div style={{ display: 'grid', gridTemplateColumns: '46px 1fr 1fr', gap: '2px 8px', alignItems: 'center' }}>
          <span />
          <span style={{ ...S.faint, fontSize: '8px' }}>上限</span>
          <span style={{ ...S.faint, fontSize: '8px' }}>當前</span>
          {[['hp', 'HP', '生命值'], ['mp', 'MP', '魔力值'], ['ip', 'IP', '物品點']].map(([key, en, cn]) => (
            <React.Fragment key={key}>
              <span style={{ fontSize: '11px', fontWeight: 700 }}>{en}</span>
              <span style={{ fontSize: '15px', fontWeight: 700 }}>{model.pools[key].max}</span>
              <span style={{ fontSize: '15px', fontWeight: 700 }}>
                {model.pools[key].current}
                {key === 'hp' ? (
                  <span style={{ ...S.faint, fontSize: '8px', marginLeft: '6px' }}>
                    危機 {model.crisisThreshold}
                  </span>
                ) : null}
              </span>
            </React.Fragment>
          ))}
        </div>
      </Box>

      <Box
        title="角色等級"
        note={`Lv ${model.classes.reduce((sum, c) => sum + c.level, 0)}`}
        style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 auto' }}>
          {blanks(3).map((_, i) => (
            <ClassSlot key={i} slot={model.page1Classes[i]} />
          ))}
        </div>
      </Box>
    </div>
  </div>
);

export const OfficialSheetPage2 = ({ model }) => (
  <div style={S.page} data-sheet-page="2">
    <div style={{ ...S.col, flex: '0 0 528px' }}>
      <NameHeader model={model} full />
      <Box
        title="其他職業"
        note="最多 3 個未精通職業"
        style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 auto' }}>
          {blanks(4).map((_, i) => (
            <ClassSlot key={i} slot={model.otherClasses[i]} />
          ))}
        </div>
      </Box>
      <Box title="英雄技能">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minHeight: '54px' }}>
          {model.heroicSkills.map((t) => (
            <span key={t} style={{ fontSize: '9.5px' }}>{t}</span>
          ))}
        </div>
      </Box>
    </div>
    <div style={{ ...S.col, flex: '1 1 auto' }}>
      <NameHeader model={model} full />
      <Box
        title="奧祕與咒語"
        note="已習得咒語與已綁定阿爾卡納"
        style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}
      >
        <SpellTable rows={model.page2Spells} count={7} />
      </Box>
      <RitualBox model={model} />
    </div>
  </div>
);

export const OfficialSheetPage3 = ({ model }) => (
  <div style={S.page} data-sheet-page="3">
    <div style={{ ...S.col, flex: '1 1 1' }}>
      <NameHeader model={model} full />
      <Box
        title="奧祕與咒語（續）"
        style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}
      >
        <SpellTable rows={model.page3Spells.slice(0, 7)} count={7} />
      </Box>
    </div>
    <div style={{ ...S.col, flex: '1 1 1' }}>
      <NameHeader model={model} full />
      <Box
        title="奧祕與咒語（續）"
        style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}
      >
        <SpellTable rows={model.page3Spells.slice(7, 14)} count={7} />
      </Box>
      <RitualBox model={model} />
    </div>
  </div>
);

export const SHEET_PAGE_COMPONENTS = [OfficialSheetPage1, OfficialSheetPage2, OfficialSheetPage3];

// ───────────────────────────────────────── 匯出面板

const PREVIEW_SCALE = 0.46;

/**
 * 匯出面板：三頁預覽 ＋ 一鍵匯出三個 PNG。
 * 預覽用 `transform: scale()` 縮小，但**光柵化的是未縮放的節點**，
 * 所以輸出仍是 1123×794 × pixelRatio 的原始尺寸。
 */
export function CharacterSheetExportBody({ character, stats = null, showToast = null }) {
  const model = useMemo(() => buildSheetModel(character, stats), [character, stats]);
  const pageRefs = useRef([]);
  const [exporting, setExporting] = useState(false);

  const fileName = (i) => `${(model.name || '冒險者').replace(/[\\/:*?"<>|]/g, '_')}_角色卡_p${i}.png`;

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    let done = 0;
    try {
      for (let i = 0; i < SHEET_PAGE_COMPONENTS.length; i += 1) {
        const node = pageRefs.current[i];
        if (!node) continue;
        // 略過 DOM 尚未完成時的空白節點
        const dataUrl = await htmlToImage.toPng(node, {
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          width: SHEET_PAGE_WIDTH,
          height: SHEET_PAGE_HEIGHT
        });
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = fileName(i + 1);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        done += 1;
        // 讓瀏覽器有時間處理「允許多檔案下載」提示
        await new Promise((r) => setTimeout(r, 250));
      }
      if (showToast) showToast(`已匯出 ${done} 張 PNG（官方三頁格式）`);
    } catch (err) {
      if (showToast) showToast('匯出失敗，請再試一次');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs" style={{ color: C.faint }}>
          依官方三頁橫向 A4 表格的版面重繪，內容取自這張卡的實際資料。
          瀏覽器可能會詢問是否允許下載多個檔案。
        </p>
        <JRPGButton
          variant="primary"
          size="sm"
          icon={GiScrollUnfurled}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? '匯出中…' : '匯出三頁 PNG'}
        </JRPGButton>
      </div>

      <div className="space-y-3">
        {SHEET_PAGE_COMPONENTS.map((Page, i) => (
          <div key={i} className="rounded-lg border overflow-hidden" style={{ borderColor: C.border }}>
            <div
              className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold"
              style={{ backgroundColor: C.bar, color: C.barText }}
            >
              <GiCheckMark className="w-3 h-3" />
              第 {i + 1} 頁
            </div>
            {/* 外層負責縮放，內層才是被光柵化的原始尺寸節點 */}
            <div style={{ width: SHEET_PAGE_WIDTH * PREVIEW_SCALE, height: SHEET_PAGE_HEIGHT * PREVIEW_SCALE, overflow: 'hidden' }}>
              <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left' }}>
                <div ref={(el) => { pageRefs.current[i] = el; }}>
                  <Page model={model} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CharacterSheetExportBody;
