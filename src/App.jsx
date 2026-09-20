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
  workshop: {
    id: 'workshop',
    title: 'NPC工坊',
    subtitle: '管理與檢視您創建的所有自定義 NPC',
    icon: GiDragonHead
  },
  character: {
    id: 'character',
    title: '角色卡助手',
    icon: GiVisoredHelm
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
  const [headerExtraLeft, setHeaderExtraLeft] = useState(null);
  const [headerExtraRight, setHeaderExtraRight] = useState(null);

  // Trigger opening page flip to feature
  const handleSelectChapter = (chapterId) => {
    if (transitionState) return;
    setTargetChapterId(chapterId);
    setTransitionState('opening');

    // Page flip timing: at 700ms switch views, overlay completes at 850ms
    setTimeout(() => {
      setActiveChapter(chapterId);
    }, 600);

    setTimeout(() => {
      setTransitionState(null);
      setTargetChapterId(null);
    }, 850);
  };

  // Trigger closing page flip back to cover
  const handleExitToCover = () => {
    if (transitionState) return;
    setTransitionState('closing');

    // Page flip timing: at 500ms switch view back to cover
    setTimeout(() => {
      setActiveChapter(null);
    }, 500);

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

        alert('✅ 完整資料備份還原成功！將為您刷新頁面以載入數據。');
        window.location.reload();
      } catch (err) {
        alert('❌ 備份檔解析失敗，請確認檔案格式正確。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const currentMeta = activeChapter ? CHAPTER_METAS[activeChapter] : null;
  const targetMeta = targetChapterId ? CHAPTER_METAS[targetChapterId] : null;

  return (
    <div className="min-h-screen bg-[#f0f7f9] text-[#1e293b] flex flex-col selection:bg-cyan-200 selection:text-cyan-900 relative">
      
      {/* 3D Page Flip Transition Overlay */}
      {transitionState && (
        <BookPageFlipOverlay
          direction={transitionState === 'opening' ? 'open' : 'close'}
          targetChapter={targetMeta || currentMeta}
        />
      )}

      {/* Screen 1: The Book Cover Hub (書的封面入口頁) */}
      {!activeChapter && (
        <div className={`flex-1 flex flex-col ${transitionState === 'closing' ? 'animate-page-dissolve-in' : ''}`}>
          <BookCoverHub
            onSelectChapter={handleSelectChapter}
            onOpenDice={() => setIsDiceModalOpen(true)}
            onBackup={handleFullBackup}
            onRestore={handleFullRestore}
          />
        </div>
      )}

      {/* Screen 2: The Exclusive Chapter Workspace (點擊後完全呈現該功能) */}
      {activeChapter && currentMeta && (
        <div className="flex-1 flex flex-col animate-page-dissolve-in">
          {/* Dedicated Chapter Header with Exit to Cover */}
          <ChapterHeader
            chapter={currentMeta}
            onExitToCover={handleExitToCover}
            onOpenDice={() => setIsDiceModalOpen(true)}
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
              />
            </main>
          ) : (
            <>
              <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
                {activeChapter === 'character' && <CharacterSheet />}
                {activeChapter === 'combat' && <CombatTracker />}
                {activeChapter === 'clocks' && <FateClockPage />}
              </main>

              {/* Dedicated Feature Footer */}
              <footer className="border-t border-[#d6c7ab] py-4 px-4 text-center text-xs text-[#6b5a4b] font-medium flex flex-col sm:flex-row items-center justify-between gap-2 bg-[#f5efdf]/60 mt-auto max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-amber-900">{currentMeta.number}</span>
                  <span>· {currentMeta.title}</span>
                </div>
                <button
                  onClick={handleExitToCover}
                  className="text-amber-800 hover:text-amber-950 font-serif font-bold underline underline-offset-2 flex items-center gap-1 text-xs"
                >
                  <span>合上本卷並返回封面目錄</span>
                </button>
                <p className="text-[11px] text-[#8c7b6c]">純前端零伺服器架構 · 數據即時自動保存</p>
              </footer>
            </>
          )}
        </div>
      )}

      {/* Floating Dice Roller Modal */}
      <DiceRollerModal
        isOpen={isDiceModalOpen}
        onClose={() => setIsDiceModalOpen(false)}
      />
    </div>
  );
}
