import React, { useState } from 'react';
import {
  GiRollingDices,
  GiDragonHead,
  GiVisoredHelm,
  GiSwordClash,
  GiPocketWatch
} from 'react-icons/gi';
import BookCoverHub from './components/book/BookCoverHub';
import ChapterHeader from './components/book/ChapterHeader';
import BookPageFlipOverlay from './components/book/BookPageFlipOverlay';
import NPCWorkshop from './features/npc-workshop/NPCWorkshop';
import CharacterSheet from './features/character-sheet/CharacterSheet';
import CombatTracker from './features/combat-tracker/CombatTracker';
import FateClockPage from './features/clocks/FateClockPage';
import DiceRollerModal from './features/dice-roller/DiceRollerModal';

const CHAPTER_METAS = {
  character: {
    id: 'character',
    title: '角色卡助手',
    subtitle: '管理與檢視您創建的所有冒險者角色',
    icon: GiVisoredHelm
  },
  workshop: {
    id: 'workshop',
    title: 'NPC工坊',
    subtitle: '管理與檢視您創建的所有自定義 NPC',
    icon: GiDragonHead
  },
  combat: {
    id: 'combat',
    title: '戰鬥輪次',
    icon: GiSwordClash
  },
  clocks: {
    id: 'clocks',
    title: '命刻記錄',
    icon: GiPocketWatch
  }
};

export default function App() {
  // null represents the Book Cover; string ID represents the exclusive chapter screen
  const [activeChapter, setActiveChapter] = useState(null);
  const [transitionState, setTransitionState] = useState(null); // 'opening' | 'closing' | null
  const [targetChapterId, setTargetChapterId] = useState(null);
  const [isDiceModalOpen, setIsDiceModalOpen] = useState(false);
  const [diceModalConfig, setDiceModalConfig] = useState(null);
  const [headerExtraLeft, setHeaderExtraLeft] = useState(null);
  const [headerExtraRight, setHeaderExtraRight] = useState(null);
  const [characterSubNav, setCharacterSubNav] = useState(null);
  const [workshopSubNav, setWorkshopSubNav] = useState(null);

  const handleOpenDice = (config = null) => {
    setDiceModalConfig(config);
    setIsDiceModalOpen(true);
  };

  // Trigger opening page flip to feature
  const handleSelectChapter = (chapterId) => {
    if (transitionState) return;
    setCharacterSubNav(null);
    setWorkshopSubNav(null);
    setTargetChapterId(chapterId);
    setTransitionState('opening');

    // Page flip timing: at 550ms switch views while overlay page is wide open
    setTimeout(() => {
      setActiveChapter(chapterId);
    }, 550);

    setTimeout(() => {
      setTransitionState(null);
      setTargetChapterId(null);
    }, 850);
  };

  // Trigger closing page flip back to cover
  const handleExitToCover = () => {
    if (transitionState) return;
    setCharacterSubNav(null);
    setWorkshopSubNav(null);
    setTransitionState('closing');

    // Page flip timing: at 380ms switch view back to cover so it fades in smoothly under the closing book
    setTimeout(() => {
      setActiveChapter(null);
    }, 380);

    setTimeout(() => {
      setTransitionState(null);
      setTargetChapterId(null);
    }, 850);
  };

  // Full site backup (All localStorage keys: NPC library, character roster, active combat, fate clocks)
  const handleFullBackup = () => {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      npcLibrary: JSON.parse(localStorage.getItem('fu_companion_npc_library') || '[]'),
      characterRoster: JSON.parse(localStorage.getItem('fu_companion_character_roster') || '[]'),
      activeCombat: JSON.parse(localStorage.getItem('fu_companion_active_combat') || '{}'),
      fateClocks: JSON.parse(localStorage.getItem('fu_companion_fate_clocks') || '[]')
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fu_companion_full_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Full site restore
  const handleFullRestore = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.npcLibrary) localStorage.setItem('fu_companion_npc_library', JSON.stringify(parsed.npcLibrary));
        if (parsed.characterRoster) localStorage.setItem('fu_companion_character_roster', JSON.stringify(parsed.characterRoster));
        if (parsed.activeCombat) localStorage.setItem('fu_companion_active_combat', JSON.stringify(parsed.activeCombat));
        if (parsed.fateClocks) localStorage.setItem('fu_companion_fate_clocks', JSON.stringify(parsed.fateClocks));

        alert('完整資料備份還原成功！將為您刷新頁面以載入數據。');
        window.location.reload();
      } catch (err) {
        alert('備份檔解析失敗，請確認檔案格式正確。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const currentMeta = activeChapter ? CHAPTER_METAS[activeChapter] : null;
  const targetMeta = targetChapterId ? CHAPTER_METAS[targetChapterId] : null;

  const CHAPTER_PAGE_THEMES = {
    workshop: 'bg-[#fbf7ee] text-[#2c221e] selection:bg-amber-200 selection:text-amber-900',
    character: 'bg-[#f4fbf7] text-[#1e293b] selection:bg-emerald-200 selection:text-emerald-900',
    combat: 'bg-[#fdf4f5] text-[#1e293b] selection:bg-rose-200 selection:text-rose-900',
    clocks: 'bg-[#f0f9ff] text-[#1e293b] selection:bg-cyan-200 selection:text-cyan-900',
  };

  const CHAPTER_FOOTER_THEMES = {
    character: {
      border: 'border-emerald-200',
      bg: 'bg-emerald-50/70',
      number: 'text-emerald-900',
      text: 'text-emerald-800',
      button: 'text-emerald-800 hover:text-emerald-950',
      subtext: 'text-emerald-600/80',
    },
    combat: {
      border: 'border-rose-200',
      bg: 'bg-rose-50/70',
      number: 'text-rose-900',
      text: 'text-rose-800',
      button: 'text-rose-800 hover:text-rose-950',
      subtext: 'text-rose-600/80',
    },
    clocks: {
      border: 'border-sky-200',
      bg: 'bg-sky-50/70',
      number: 'text-sky-900',
      text: 'text-sky-800',
      button: 'text-sky-800 hover:text-sky-950',
      subtext: 'text-sky-600/80',
    },
  };

  const activePageTheme = (activeChapter && CHAPTER_PAGE_THEMES[activeChapter]) || 'bg-[#f0f7f9] text-[#1e293b] selection:bg-cyan-200 selection:text-cyan-900';
  const footerTheme = (activeChapter && CHAPTER_FOOTER_THEMES[activeChapter]) || {
    border: 'border-[#d6c7ab]',
    bg: 'bg-[#f5efdf]/60',
    number: 'text-amber-900',
    text: 'text-[#6b5a4b]',
    button: 'text-amber-800 hover:text-amber-950',
    subtext: 'text-[#8c7b6c]',
  };

  return (
    <div
      className={`min-h-screen ${activePageTheme} flex flex-col relative transition-colors duration-300`}
      style={activeChapter === 'character' && characterSubNav?.theme ? { backgroundColor: characterSubNav.theme.appBg } : {}}
    >
      
      {/* 3D Page Flip Transition Overlay */}
      {transitionState && (
        <BookPageFlipOverlay
          direction={transitionState === 'opening' ? 'open' : 'close'}
          targetChapter={targetMeta || currentMeta}
        />
      )}

      {/* Screen 1: The Book Cover Hub (書的封面入口頁) */}
      {!activeChapter && (
        <div
          className={`flex-1 flex flex-col transition-all duration-500 ease-out ${
            transitionState === 'opening'
              ? 'opacity-0 scale-[0.96] pointer-events-none'
              : transitionState === 'closing'
              ? 'animate-page-dissolve-in'
              : 'opacity-100 scale-100'
          }`}
        >
          <BookCoverHub
            onSelectChapter={handleSelectChapter}
            onOpenDice={handleOpenDice}
            onBackup={handleFullBackup}
            onRestore={handleFullRestore}
            isOpening={transitionState === 'opening'}
          />
        </div>
      )}

      {/* Screen 2: The Exclusive Chapter Workspace (點擊後完全呈現該功能) */}
      {activeChapter && currentMeta && (
        <div
          className={`flex-1 flex flex-col ${
            transitionState === 'closing'
              ? 'opacity-0 scale-[0.98] transition-all duration-350 ease-out pointer-events-none'
              : 'animate-page-dissolve-in'
          }`}
        >
          {/* Dedicated Chapter Header with Exit to Cover */}
          <ChapterHeader
            chapter={currentMeta}
            onExitToCover={handleExitToCover}
            backOverride={
              activeChapter === 'character'
                ? characterSubNav
                : activeChapter === 'workshop'
                  ? workshopSubNav
                  : null
            }
            onOpenDice={handleOpenDice}
            onBackup={handleFullBackup}
            onRestore={handleFullRestore}
            extraLeft={activeChapter === 'workshop' ? headerExtraLeft : null}
            extraRight={activeChapter === 'workshop' ? headerExtraRight : null}
          />

          {/* Exclusive Main Body */}
          {activeChapter === 'workshop' ? (
            <main className="flex-1 w-full flex flex-col min-h-0 overflow-hidden">
              <NPCWorkshop
                setHeaderExtraLeft={setHeaderExtraLeft}
                setHeaderExtraRight={setHeaderExtraRight}
                onSubNavChange={setWorkshopSubNav}
              />
            </main>
          ) : (
            <>
              <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
                {activeChapter === 'character' && (
                  <CharacterSheet
                    onOpenDice={handleOpenDice}
                    onSubNavChange={setCharacterSubNav}
                  />
                )}
                {activeChapter === 'combat' && <CombatTracker />}
                {activeChapter === 'clocks' && <FateClockPage />}
              </main>

              {/* Dedicated Feature Footer */}
              <footer
                className={`border-t ${footerTheme.border} py-4 px-4 text-center text-xs ${footerTheme.text} font-medium flex flex-col sm:flex-row items-center justify-between gap-2 ${footerTheme.bg} mt-auto max-w-7xl mx-auto w-full transition-colors duration-300`}
                style={activeChapter === 'character' && characterSubNav?.theme ? {
                  borderColor: characterSubNav.theme.border,
                  backgroundColor: `${characterSubNav.theme.headerBg}cc`,
                  color: characterSubNav.theme.textDark
                } : {}}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-serif font-bold ${footerTheme.number}`}
                    style={activeChapter === 'character' && characterSubNav?.theme ? { color: characterSubNav.theme.accent } : {}}
                  >
                    {currentMeta.number}
                  </span>
                  <span>· {currentMeta.title}</span>
                </div>
                <button
                  onClick={handleExitToCover}
                  className={`${footerTheme.button} font-serif font-bold underline underline-offset-2 flex items-center gap-1 text-xs`}
                  style={activeChapter === 'character' && characterSubNav?.theme ? { color: characterSubNav.theme.accentDark } : {}}
                >
                  <span>合上本卷並返回封面目錄</span>
                </button>
                <p
                  className={`text-[11px] ${footerTheme.subtext}`}
                  style={activeChapter === 'character' && characterSubNav?.theme ? { color: characterSubNav.theme.textMuted } : {}}
                >
                  純前端零伺服器架構 · 數據即時自動保存
                </p>
              </footer>
            </>
          )}
        </div>
      )}

      {/* Floating Dice Roller Modal */}
      <DiceRollerModal
        isOpen={isDiceModalOpen}
        initialConfig={diceModalConfig}
        onClose={() => {
          setIsDiceModalOpen(false);
          setDiceModalConfig(null);
        }}
      />
    </div>
  );
}
