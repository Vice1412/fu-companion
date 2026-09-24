import React, { useState, useEffect } from 'react';
import {
  Swords,
  Shield,
  Plus,
  RotateCcw,
  Wifi,
  WifiOff,
  Users,
  Clock,
  Trash2,
  Share2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import JRPGButton from '../../components/ui/JRPGButton';
import JRPGBadge from '../../components/ui/JRPGBadge';
import CombatantCard from './components/CombatantCard';
import AddCombatantModal from './components/AddCombatantModal';
import CharacterDrawer from './components/CharacterDrawer';
import ClockTracker from '../../components/ui/ClockTracker';
import { peerSync } from './utils/peerSync';
import { migrateNpcState } from '../npc-workshop/utils/npcEngine';

const COMBAT_STORAGE_KEY = 'fu_companion_active_combat';

export default function CombatTracker() {
  const [round, setRound] = useState(1);
  const [combatants, setCombatants] = useState(() => {
    try {
      const saved = localStorage.getItem(COMBAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.combatants)) {
          return parsed.combatants;
        }
      }
    } catch (e) {}
    return [];
  });

  const [sceneClocks, setSceneClocks] = useState(() => {
    try {
      const saved = localStorage.getItem(COMBAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.sceneClocks)) {
          return parsed.sceneClocks;
        }
      }
    } catch (e) {}
    return [
      { id: 'sc_1', title: '主要威脅 / 戰場倒數', totalSegments: 6, filledSegments: 0, theme: 'red', type: 'circle' }
    ];
  });

  // Modal & Drawer State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [drawerCombatant, setDrawerCombatant] = useState(null);

  // Online Room State
  const [roomCode, setRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [connectedPeersCount, setConnectedPeersCount] = useState(0);

  // Load NPC library & character roster from localStorage
  const [npcLibrary, setNpcLibrary] = useState([]);
  const [characterRoster, setCharacterRoster] = useState([]);

  useEffect(() => {
    try {
      const savedNpcs = localStorage.getItem('fu_companion_npc_library');
      if (savedNpcs) setNpcLibrary(JSON.parse(savedNpcs).map(migrateNpcState));

      const savedChars = localStorage.getItem('fu_companion_character_roster');
      if (savedChars) setCharacterRoster(JSON.parse(savedChars));
    } catch (e) {}
  }, [isAddModalOpen]);

  // Persist combat state
  useEffect(() => {
    try {
      localStorage.setItem(COMBAT_STORAGE_KEY, JSON.stringify({
        round,
        combatants,
        sceneClocks
      }));
    } catch (e) {}

    // If hosting, broadcast state to all connected players
    if (isHost && isConnected) {
      peerSync.broadcast('STATE_UPDATE', { round, combatants, sceneClocks });
    }
  }, [round, combatants, sceneClocks, isHost, isConnected]);

  // Setup PeerJS listeners
  useEffect(() => {
    peerSync.onStateReceived = (packet) => {
      if (packet.type === 'STATE_UPDATE' && packet.payload) {
        setRound(packet.payload.round || 1);
        setCombatants(packet.payload.combatants || []);
        setSceneClocks(packet.payload.sceneClocks || []);
      } else if (packet.type === 'PUSH_CHARACTER' && isHost) {
        // Player pushed their character into the room
        setCombatants(prev => [...prev, packet.payload]);
      }
    };

    peerSync.onPeerConnected = () => {
      setConnectedPeersCount(prev => prev + 1);
    };

    peerSync.onPeerDisconnected = () => {
      setConnectedPeersCount(prev => Math.max(0, prev - 1));
    };

    return () => {
      peerSync.destroy();
    };
  }, [isHost]);

  // Combatant actions
  const handleAddCombatant = (newCombatant) => {
    setCombatants(prev => [...prev, newCombatant]);
  };

  const handleUpdateCombatant = (updated) => {
    setCombatants(prev => prev.map(c => c.instanceId === updated.instanceId ? updated : c));
  };

  const handleRemoveCombatant = (instanceId) => {
    setCombatants(prev => prev.filter(c => c.instanceId !== instanceId));
  };

  const handleNextRound = () => {
    setRound(prev => prev + 1);
    // Reset hasActed for everyone
    setCombatants(prev => prev.map(c => ({ ...c, hasActed: false })));
  };

  const handleResetCombat = () => {
    if (window.confirm('確定要清空戰場並重置為第 1 輪嗎？')) {
      setRound(1);
      setCombatants([]);
    }
  };

  // Scene Clocks
  const handleAddSceneClock = () => {
    const newClock = {
      id: `sc_${Date.now()}`,
      title: '新場景危機',
      totalSegments: 6,
      filledSegments: 0,
      theme: 'red',
      type: 'circle'
    };
    setSceneClocks(prev => [...prev, newClock]);
  };

  const handleUpdateSceneClock = (clkId, newVal) => {
    setSceneClocks(prev => prev.map(c => c.id === clkId ? { ...c, filledSegments: newVal } : c));
  };

  const handleRemoveSceneClock = (clkId) => {
    setSceneClocks(prev => prev.filter(c => c.id !== clkId));
  };

  // Room Actions
  const handleCreateRoom = () => {
    const code = `FU-${Math.floor(1000 + Math.random() * 9000)}`;
    setRoomCode(code);
    setIsHost(true);
    setIsConnected(true);
    peerSync.createRoom(code, () => {
      // Room opened
    });
  };

  const handleJoinRoom = () => {
    if (!inputRoomCode.trim()) return;
    setIsHost(false);
    setIsConnected(true);
    setRoomCode(inputRoomCode.trim());
    peerSync.joinRoom(inputRoomCode.trim(), () => {
      // Joined
    });
  };

  // Group combatants into Player Team & Enemy/Other
  const playerCombatants = combatants.filter(c => c.sourceType === 'character' || c.faction === '玩家隊伍');
  const enemyCombatants = combatants.filter(c => c.sourceType !== 'character' && c.faction !== '玩家隊伍');

  const playerUnactedCount = playerCombatants.filter(c => !c.hasActed).length;
  const enemyUnactedCount = enemyCombatants.filter(c => !c.hasActed).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Round Controller */}
      <div className="bg-[#fffdf9] rounded-xl border border-[#d6c7ab] p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-rose-600 to-sky-600" />

        {/* Round Counter */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#f4ebd9] border border-[#d6c7ab] flex flex-col items-center justify-center font-mono shadow-inner">
            <span className="text-[10px] text-[#8c7b6c] uppercase tracking-widest font-bold">ROUND</span>
            <span className="text-2xl font-bold text-amber-800 leading-none">{round}</span>
          </div>

          <div>
            <h2 className="font-serif font-black text-xl text-[#2c221e] flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-700" /> 戰鬥與輪次管理中樞
            </h2>
            <div className="flex items-center gap-3 text-xs font-mono mt-1">
              <span className="text-sky-800 font-bold">
                玩家隊待行動: {playerUnactedCount} / {playerCombatants.length}
              </span>
              <span className="text-[#d6c7ab]">|</span>
              <span className="text-rose-800 font-bold">
                敵方待行動: {enemyUnactedCount} / {enemyCombatants.length}
              </span>
            </div>
          </div>
        </div>

        {/* Next Round & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <JRPGButton
            variant="primary"
            size="md"
            icon={ChevronRight}
            onClick={handleNextRound}
          >
            推進至下一輪
          </JRPGButton>

          <JRPGButton
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
          >
            調度參戰者
          </JRPGButton>

          <button
            onClick={handleResetCombat}
            className="p-2 text-[#6b5a4b] hover:text-rose-700 hover:bg-[#f4ebd9] rounded-lg transition-colors border border-transparent hover:border-[#d6c7ab]"
            title="清空重置戰場"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Online Room Sync Bar (P2P WebRTC) */}
      <div className="bg-[#f5efdf] rounded-xl border border-[#d6c7ab] p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2.5">
          {isConnected ? (
            <div className="flex items-center gap-2 text-emerald-800 font-mono font-bold">
              <Wifi className="w-4 h-4 animate-pulse text-emerald-600" />
              <span>
                {isHost ? 'GM 房間建立完成' : '已連線房間'}: <strong className="text-amber-900 bg-[#fbf3de] px-1.5 py-0.5 rounded border border-[#d6c7ab]">{roomCode}</strong>
              </span>
              {isHost && (
                <span className="text-[11px] text-[#6b5a4b] font-normal">
                  ({connectedPeersCount} 人同步中)
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#6b5a4b] font-mono">
              <WifiOff className="w-4 h-4 text-[#8c7b6c]" />
              <span>當前為本地單機模式（支援無網運行）</span>
            </div>
          )}
        </div>

        {/* Room Connect Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {!isConnected ? (
            <>
              <button
                onClick={handleCreateRoom}
                className="px-3 py-1.5 rounded-lg bg-amber-700 text-white font-bold hover:bg-amber-800 transition-colors shadow-sm"
              >
                + 開創連線房間
              </button>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="輸入房間碼 (如 FU-8821)"
                  value={inputRoomCode}
                  onChange={e => setInputRoomCode(e.target.value)}
                  className="bg-[#fffdf9] border border-[#d6c7ab] rounded-lg px-2.5 py-1 text-xs text-[#2c221e] uppercase font-mono w-36 focus:border-amber-700 outline-none"
                />
                <button
                  onClick={handleJoinRoom}
                  className="px-2.5 py-1 rounded-lg bg-[#eee6d3] border border-[#d6c7ab] hover:bg-[#e4d9c0] text-[#2c221e] font-bold transition-colors"
                >
                  加入
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => {
                peerSync.destroy();
                setIsConnected(false);
                setRoomCode('');
              }}
              className="px-2.5 py-1 rounded-lg bg-[#fffdf9] border border-[#d6c7ab] text-[#6b5a4b] hover:text-rose-700 hover:bg-rose-50 font-medium transition-colors"
            >
              斷開連線
            </button>
          )}
        </div>
      </div>

      {/* Scene Clocks (場景命刻) Bar */}
      <div className="bg-[#fffdf9] rounded-xl border border-[#d6c7ab] p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#d6c7ab]/80 pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-700" />
            <h3 className="font-serif font-bold text-sm text-[#2c221e]">
              戰鬥場景命刻 (Scene Clocks - 危機倒數與環境進度)
            </h3>
          </div>
          <JRPGButton
            variant="ghost"
            size="xs"
            icon={Plus}
            onClick={handleAddSceneClock}
          >
            新增場景命刻
          </JRPGButton>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {sceneClocks.map(clk => (
            <div key={clk.id} className="relative group bg-[#fbf7ee] p-2.5 rounded-lg border border-[#d6c7ab]/80">
              <ClockTracker
                title={clk.title}
                totalSegments={clk.totalSegments || 6}
                filledSegments={clk.filledSegments || 0}
                theme={clk.theme || 'red'}
                type={clk.type || 'circle'}
                size={95}
                onChange={newVal => handleUpdateSceneClock(clk.id, newVal)}
              />
              <button
                type="button"
                onClick={() => handleRemoveSceneClock(clk.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[#8c7b6c] hover:text-rose-700 p-1 transition-opacity"
                title="刪除此命刻"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Combatants Grid: Left = Player Team, Right = Enemy Force */}
      <div className="space-y-6">
        {/* Player Party Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-sky-600/40 pb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-700" />
              <h3 className="font-serif font-bold text-base text-sky-900">
                玩家小隊
              </h3>
              <JRPGBadge variant="cyan" size="xs">
                {playerCombatants.length} 人
              </JRPGBadge>
            </div>
          </div>

          {playerCombatants.length === 0 ? (
            <div className="py-8 text-center text-[#8c7b6c] text-xs font-mono bg-[#f5efdf]/50 rounded-xl border border-dashed border-[#d6c7ab]">
              尚無玩家參戰者。點擊上方「調度參戰者」從角色名冊載入。
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {playerCombatants.map(c => (
                <CombatantCard
                  key={c.instanceId}
                  combatant={c}
                  onUpdate={handleUpdateCombatant}
                  onRemove={handleRemoveCombatant}
                  onOpenDrawer={setDrawerCombatant}
                />
              ))}
            </div>
          )}
        </div>

        {/* Enemy / Monster Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-rose-600/40 pb-2">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-rose-700" />
              <h3 className="font-serif font-bold text-base text-rose-900">
                敵方怪物與 Boss (Enemies & Bosses)
              </h3>
              <JRPGBadge variant="rose" size="xs">
                {enemyCombatants.length} 隻
              </JRPGBadge>
            </div>
          </div>

          {enemyCombatants.length === 0 ? (
            <div className="py-8 text-center text-[#8c7b6c] text-xs font-mono bg-[#f5efdf]/50 rounded-xl border border-dashed border-[#d6c7ab]">
              戰場上目前沒有敵方怪物。點擊「調度參戰者」從怪物庫派兵。
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {enemyCombatants.map(c => (
                <CombatantCard
                  key={c.instanceId}
                  combatant={c}
                  onUpdate={handleUpdateCombatant}
                  onRemove={handleRemoveCombatant}
                  onOpenDrawer={setDrawerCombatant}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Combatant Modal */}
      <AddCombatantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        npcLibrary={npcLibrary}
        characterRoster={characterRoster}
        onAddCombatant={handleAddCombatant}
      />

      {/* Full Sheet Preview Drawer */}
      <CharacterDrawer
        isOpen={!!drawerCombatant}
        onClose={() => setDrawerCombatant(null)}
        combatant={drawerCombatant}
      />
    </div>
  );
}
