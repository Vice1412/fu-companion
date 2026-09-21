import React, { useState, useEffect } from 'react';
import {
  Plus,
  Download,
  Upload,
  Trash2,
  Copy,
  CheckCircle2,
  Swords,
  Heart,
  Sparkles,
  Play,
  Edit3,
  TrendingUp,
  Coins,
  Star
} from 'lucide-react';
import CharacterEditor from './components/CharacterEditor';
import CharacterPlayHUD from './components/CharacterPlayHUD';
import { createNewCharacter, calculateCharacterStats } from './utils/characterEngine';
import JRPGButton from '../../components/ui/JRPGButton';
import JRPGBadge from '../../components/ui/JRPGBadge';

const STORAGE_KEY = 'fu_companion_character_roster';

export default function CharacterSheet({ onOpenDice = null }) {
  const [roster, setRoster] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load characters:', e);
    }
    return [createNewCharacter()];
  });

  const [activeCharId, setActiveCharId] = useState(null);
  const [viewMode, setViewMode] = useState('roster'); // 'roster' | 'play' | 'editor'
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
    } catch (e) {
      console.error('Failed to save character roster:', e);
    }
  }, [roster]);

  const showToast = (msg, type = 'info') => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleOpenPlayMode = (char) => {
    setActiveCharId(char.id);
    setViewMode('play');
  };

  const handleOpenEditorMode = (char) => {
    setActiveCharId(char.id);
    setViewMode('editor');
  };

  const handleCreateCharacter = () => {
    const fresh = createNewCharacter();
    setRoster(prev => [fresh, ...prev]);
    setActiveCharId(fresh.id);
    setViewMode('editor');
    showToast('✨ 已創建新冒險者，開啟創角導引！');
  };

  const handleDeleteCharacter = (charId) => {
    if (roster.length <= 1) {
      showToast('⚠️ 至少需保留一張角色卡');
      return;
    }
    setRoster(prev => prev.filter(c => c.id !== charId));
    if (activeCharId === charId) {
      setActiveCharId(null);
      setViewMode('roster');
    }
    showToast('🗑️ 已刪除角色卡');
  };

  const handleDuplicateCharacter = (char) => {
    const cloned = {
      ...JSON.parse(JSON.stringify(char)),
      id: `char_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${char.name || '冒險者'} (副本)`,
      updatedAt: new Date().toISOString()
    };
    setRoster(prev => [cloned, ...prev]);
    showToast('📋 已複製角色副本！');
  };

  const handleUpdateActiveCharacter = (updatedChar) => {
    setRoster(prev => prev.map(c => c.id === updatedChar.id ? updatedChar : c));
  };

  const handleSendToCombatDirect = (char) => {
    try {
      const stats = calculateCharacterStats(char);
      const activeCombatRaw = localStorage.getItem('fu_companion_active_combat');
      const activeCombat = activeCombatRaw ? JSON.parse(activeCombatRaw) : { combatants: [] };
      const combatants = activeCombat.combatants || [];

      const curHp = char.currentHp !== null && char.currentHp !== undefined ? char.currentHp : stats.maxHp;
      const curMp = char.currentMp !== null && char.currentMp !== undefined ? char.currentMp : stats.maxMp;
      const curIp = char.currentIp !== null && char.currentIp !== undefined ? char.currentIp : stats.maxIp;

      const existingIdx = combatants.findIndex(c => c.sourceId === char.id);
      const combatantData = {
        instanceId: `comb_${char.id}_${Date.now()}`,
        sourceId: char.id,
        sourceType: 'character',
        name: char.name || '冒險者',
        avatar: char.avatar || null,
        faction: '玩家隊伍',
        level: char.level || 5,
        rank: '玩家',
        role: (char.classes || []).map(c => c.className).join(' / ') || '冒險者',
        species: '玩家',
        hp: {
          current: curHp,
          max: stats.maxHp,
          crisisThreshold: stats.crisisThreshold
        },
        mp: {
          current: curMp,
          max: stats.maxMp
        },
        ip: {
          current: curIp,
          max: stats.maxIp
        },
        fabulaPoints: char.fabulaPoints || 3,
        attributes: {
          dex: stats.currentDex,
          ins: stats.currentIns,
          mig: stats.currentMig,
          wlp: stats.currentWlp
        },
        defense: stats.def,
        magicDefense: stats.mdef,
        initiative: stats.init,
        hasActed: false,
        statusEffects: { ...char.statusAfflictions },
        skills: (char.classes || []).flatMap(cl => (cl.skills || []).map(sk => ({
          id: `${cl.className}_${sk.name}`,
          name: `${sk.name} (SL ${sk.sl})`,
          category: 'skill',
          desc: `【${cl.className}】特技`,
          isRevealed: true
        }))),
        rawCharData: char
      };

      if (existingIdx >= 0) {
        combatants[existingIdx] = combatantData;
      } else {
        combatants.push(combatantData);
      }

      activeCombat.combatants = combatants;
      localStorage.setItem('fu_companion_active_combat', JSON.stringify(activeCombat));
      showToast(`⚔️ 已將【${char.name}】推入戰鬥房間！`);
    } catch (e) {
      console.error(e);
      showToast('❌ 入戰失敗，請確認怪物數據完整。');
    }
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(roster, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fu_characters_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('💾 角色名冊已匯出為 JSON！');
  };

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (Array.isArray(parsed)) {
          setRoster(prev => {
            const combined = [...parsed];
            prev.forEach(item => {
              if (!combined.some(c => c.id === item.id)) combined.push(item);
            });
            return combined;
          });
          showToast(`✅ 成功匯入 ${parsed.length} 張角色卡！`);
        } else if (parsed && typeof parsed === 'object') {
          setRoster(prev => [parsed, ...prev]);
          showToast(`✅ 成功匯入「${parsed.name}」！`);
        }
      } catch (err) {
        showToast('❌ JSON 解析失敗，請確認格式');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const activeChar = roster.find(c => c.id === activeCharId) || roster[0];

  return (
    <div className="space-y-6">
      {/* Top Banner (Only visible in Roster overview) */}
      {viewMode === 'roster' && (
        <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-[#d6c7ab]">
          <div>
            <h2 className="font-serif font-black text-2xl text-[#2c221e] flex items-center gap-2.5 tracking-wide">
              <span className="text-amber-700">🧙</span> 玩家角色卡名冊 (Character Roster)
            </h2>
            <p className="text-xs text-[#6b5a4b] mt-0.5">
              免翻書繁中 28 職業構築 · 跑團實戰儀表板 · 經驗升級成長 · 官方經典配置一鍵套用
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d6c7ab] bg-[#fffdf9] hover:bg-[#f5efdf] text-xs text-[#6b5a4b] hover:text-[#2c221e] transition-colors shadow-sm font-medium">
                <Upload className="w-3.5 h-3.5 text-amber-700" /> 匯入卡片
              </span>
            </label>

            <JRPGButton
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={handleExportJSON}
            >
              匯出名冊
            </JRPGButton>

            <JRPGButton
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={handleCreateCharacter}
            >
              建立新角色
            </JRPGButton>
          </div>
        </div>
      )}

      {/* Main View Router */}
      {viewMode === 'roster' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#6b5a4b] font-medium">
            <span>現有名冊存檔: <strong className="text-amber-800">{roster.length}</strong> 位冒險者</span>
            <span className="text-[11px] text-[#8c7b6c]">純前端持久儲存 · 即時自動同步</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roster.map(char => {
              const stats = calculateCharacterStats(char);
              const curHp = char.currentHp ?? stats.maxHp;
              const curMp = char.currentMp ?? stats.maxMp;
              const isCrisis = curHp <= stats.crisisThreshold;

              return (
                <div
                  key={char.id}
                  className="bg-[#fffdf9] rounded-2xl border border-[#d6c7ab] hover:border-amber-600 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group relative"
                >
                  <div className="h-1 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800" />

                  {/* Profile Header */}
                  <div className="p-4 flex items-start gap-3.5 border-b border-[#d6c7ab]/80 bg-[#f4ebd9]/40">
                    <div className="w-12 h-12 rounded-xl bg-[#f5efdf] border border-[#d6c7ab] overflow-hidden shrink-0 flex items-center justify-center font-serif text-amber-800 text-xl font-bold shadow-inner">
                      {char.avatar ? (
                        <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                      ) : (
                        char.name?.[0] || '勇'
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-serif font-bold text-base text-[#2c221e] truncate group-hover:text-amber-800 transition-colors">
                          {char.name || '冒險者'}
                        </h4>
                        <JRPGBadge variant="gold" size="xs">
                          Lv {char.level || 5}
                        </JRPGBadge>
                        {isCrisis && (
                          <JRPGBadge variant="rose" size="xs">
                            ⚠️ 危機
                          </JRPGBadge>
                        )}
                      </div>

                      <p className="text-[11px] text-[#6b5a4b] mt-1 line-clamp-1">
                        {char.identity || '未設定身份'} · <span className="text-amber-900 font-bold">{char.theme || '希望'}</span>
                      </p>

                      {/* Classes */}
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {(char.classes || []).map((c, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#fbf3de] text-amber-900 border border-[#d6c7ab] font-mono font-medium">
                            {c.className} Lv{c.level}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stats snippet */}
                  <div className="grid grid-cols-4 gap-1.5 p-3 bg-[#f5efdf]/60 border-b border-[#d6c7ab]/80 text-center font-mono text-xs">
                    <div className="p-1 rounded bg-[#fee2e2] border border-red-200">
                      <div className="text-[10px] text-red-700 font-sans">HP</div>
                      <div className="font-bold text-red-900">{curHp}/{stats.maxHp}</div>
                    </div>
                    <div className="p-1 rounded bg-[#dbeafe] border border-blue-200">
                      <div className="text-[10px] text-blue-700 font-sans">MP</div>
                      <div className="font-bold text-blue-900">{curMp}/{stats.maxMp}</div>
                    </div>
                    <div className="p-1 rounded bg-[#fef3c7] border border-amber-200">
                      <div className="text-[10px] text-amber-700 font-sans">金幣</div>
                      <div className="font-bold text-amber-900">{char.zenit || 0}z</div>
                    </div>
                    <div className="p-1 rounded bg-[#ede9fe] border border-purple-200">
                      <div className="text-[10px] text-purple-700 font-sans">EXP</div>
                      <div className="font-bold text-purple-900">{char.exp || 0}/10</div>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="p-3 bg-[#f4ebd9]/30 border-t border-[#d6c7ab]/80 flex items-center justify-between gap-2 mt-auto flex-wrap">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicateCharacter(char)}
                        className="p-1.5 rounded-lg text-[#6b5a4b] hover:text-[#2c221e] hover:bg-[#ebdcc4] transition-colors"
                        title="複製卡片"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSendToCombatDirect(char)}
                        className="p-1.5 rounded-lg text-[#6b5a4b] hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="推入戰鬥房間"
                      >
                        <Swords className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCharacter(char.id)}
                        className="p-1.5 rounded-lg text-[#6b5a4b] hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="刪除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        onClick={() => handleOpenEditorMode(char)}
                        className="px-2.5 py-1 rounded-lg border border-[#d6c7ab] bg-[#fffdf9] hover:bg-[#f5efdf] text-xs font-bold text-[#3c2415] transition-colors shadow-sm flex items-center gap-1"
                        title="進入創角與加點工作台"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>構建</span>
                      </button>

                      <JRPGButton
                        variant="primary"
                        size="xs"
                        icon={Play}
                        onClick={() => handleOpenPlayMode(char)}
                      >
                        跑團卡
                      </JRPGButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 2: Live Play HUD */}
      {viewMode === 'play' && (
        <CharacterPlayHUD
          character={activeChar}
          onChange={handleUpdateActiveCharacter}
          onBackToRoster={() => setViewMode('roster')}
          onOpenEditor={() => setViewMode('editor')}
          onOpenDice={onOpenDice}
          showToast={showToast}
        />
      )}

      {/* Mode 3: Step-by-Step Builder Wizard */}
      {viewMode === 'editor' && (
        <CharacterEditor
          character={activeChar}
          onChange={handleUpdateActiveCharacter}
          onBackToRoster={() => setViewMode('roster')}
          onEnterPlayMode={() => setViewMode('play')}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#fffdf9] border-2 border-amber-600 text-[#2c221e] px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 font-medium text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
