import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Copy, Tag, Folder, Swords } from 'lucide-react';
import JRPGButton from '../../../components/ui/JRPGButton';
import JRPGBadge from '../../../components/ui/JRPGBadge';
import { calculateNpcStats } from '../utils/npcEngine';
import { SPECIES_DATA } from '../data';

export default function NPCLibrary({
  library = [],
  onSelectNpc,
  onCreateNpc,
  onDeleteNpc,
  onDuplicateNpc
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaction, setSelectedFaction] = useState('ALL');
  const [selectedTag, setSelectedTag] = useState('ALL');

  // Extract unique factions and tags
  const { factions, allTags } = useMemo(() => {
    const facSet = new Set(['未分類']);
    const tagSet = new Set();

    library.forEach(npc => {
      if (npc.faction && npc.faction.trim()) facSet.add(npc.faction.trim());
      if (Array.isArray(npc.tags)) {
        npc.tags.forEach(t => { if (t && t.trim()) tagSet.add(t.trim()); });
      }
    });

    return {
      factions: Array.from(facSet),
      allTags: Array.from(tagSet)
    };
  }, [library]);

  // Filtered NPC List
  const filteredNpcs = useMemo(() => {
    return library.filter(npc => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (npc.name || '').toLowerCase().includes(q);
        const matchRole = (npc.role || '').toLowerCase().includes(q);
        const matchTraits = (npc.traits || '').toLowerCase().includes(q);
        const matchFaction = (npc.faction || '').toLowerCase().includes(q);
        const matchTags = (npc.tags || []).some(t => t.toLowerCase().includes(q));
        if (!matchName && !matchRole && !matchTraits && !matchFaction && !matchTags) return false;
      }

      if (selectedFaction !== 'ALL') {
        if ((npc.faction || '未分類') !== selectedFaction) return false;
      }

      if (selectedTag !== 'ALL') {
        if (!(npc.tags || []).includes(selectedTag)) return false;
      }

      return true;
    });
  }, [library, searchQuery, selectedFaction, selectedTag]);

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-[#fffdf9] border border-[#d6c7ab] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Search & Counts */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7b6c] pointer-events-none" />
            <input
              type="text"
              placeholder="搜尋 NPC 名稱、定位、標籤或特徵..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#fbf7ee] border border-[#d6c7ab] rounded-lg pl-9 pr-3 py-2 text-sm text-[#2c221e] placeholder-[#8c7b6c] focus:outline-none focus:border-amber-700 shadow-inner"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <span className="text-xs font-mono text-[#6b5a4b]">
            收錄: <strong className="text-amber-800">{filteredNpcs.length}</strong> / {library.length} 隻
          </span>
          <JRPGButton
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={onCreateNpc}
          >
            建立新 NPC
          </JRPGButton>
        </div>
      </div>

      {/* Factions / Folders Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm border-b border-[#d6c7ab]">
        <button
          onClick={() => setSelectedFaction('ALL')}
          className={`px-3 py-1.5 rounded-t-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            selectedFaction === 'ALL'
              ? 'bg-amber-700 text-white shadow-sm'
              : 'bg-[#eee6d3] text-[#6b5a4b] hover:text-[#2c221e] hover:bg-[#e4d9c0] border border-[#d6c7ab] border-b-0'
          }`}
        >
          <Folder className="w-3.5 h-3.5" /> 全部陣營 ({library.length})
        </button>

        {factions.map(fac => {
          const count = library.filter(n => (n.faction || '未分類') === fac).length;
          return (
            <button
              key={fac}
              onClick={() => setSelectedFaction(fac)}
              className={`px-3 py-1.5 rounded-t-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                selectedFaction === fac
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'bg-[#eee6d3] text-[#6b5a4b] hover:text-[#2c221e] hover:bg-[#e4d9c0] border border-[#d6c7ab] border-b-0'
              }`}
            >
              🏷️ {fac} ({count})
            </button>
          );
        })}
      </div>

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[#8c7b6c] mr-1">標籤篩選:</span>
          <button
            onClick={() => setSelectedTag('ALL')}
            className={`px-2 py-0.5 rounded-md border ${
              selectedTag === 'ALL' ? 'border-amber-700 text-amber-900 bg-amber-100 font-bold' : 'border-[#d6c7ab] text-[#6b5a4b] hover:border-amber-600'
            }`}
          >
            全部
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? 'ALL' : tag)}
              className={`px-2 py-0.5 rounded-md border transition-colors ${
                selectedTag === tag
                  ? 'border-blue-500 text-blue-900 bg-blue-100 font-bold'
                  : 'border-[#d6c7ab] text-[#6b5a4b] hover:border-blue-400'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Grid of NPC Cards */}
      {filteredNpcs.length === 0 ? (
        <div className="text-center py-16 bg-[#fffdf9] rounded-xl border border-dashed border-[#d6c7ab] p-8 shadow-sm">
          <Swords className="w-12 h-12 text-[#8c7b6c] mx-auto mb-3 opacity-40" />
          <h4 className="text-base font-bold text-[#3c2415]">檔案庫目前沒有符合條件的 NPC</h4>
          <p className="text-xs text-[#6b5a4b] mt-1">點擊上方「建立新 NPC」開始構建</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredNpcs.map(npc => {
            const stats = calculateNpcStats(npc);
            const speciesObj = SPECIES_DATA.find(s => s.id === npc.selectedSpeciesId);

            return (
              <div
                key={npc.id}
                className="bg-[#fffdf9] rounded-xl border border-[#d6c7ab] hover:border-amber-600 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group relative"
              >
                {/* Top Accent Line */}
                <div className="h-1 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700" />

                {/* Profile Header */}
                <div className="p-4 flex items-start gap-3 border-b border-[#d6c7ab] bg-[#f4ebd9]">
                  <div className="w-12 h-12 rounded-lg bg-white border border-[#d6c7ab] overflow-hidden shrink-0 flex items-center justify-center font-serif text-amber-800 text-xl font-bold shadow-inner">
                    {npc.avatarBase64 ? (
                      <img src={npc.avatarBase64} alt={npc.name} className="w-full h-full object-cover" />
                    ) : (
                      npc.role?.[0] || '魔'
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-serif font-black text-base text-[#3c2415] truncate group-hover:text-amber-800 transition-colors">
                        {npc.name || '未命名怪物'}
                      </h4>
                      <JRPGBadge variant="gold" size="xs">
                        Lv {npc.level}
                      </JRPGBadge>
                      <JRPGBadge variant={npc.rank === '冠位' ? 'rose' : npc.rank === '精英' ? 'cyan' : 'slate'} size="xs">
                        {npc.rank}
                      </JRPGBadge>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-[#6b5a4b] mt-1 font-mono">
                      <span>{speciesObj?.name || '未知種族'}</span>
                      <span>·</span>
                      <span className="text-amber-800 font-bold">{npc.role}</span>
                      {npc.faction && (
                        <>
                          <span>·</span>
                          <span className="text-stone-700">🏷️ {npc.faction}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Stats Bar */}
                <div className="grid grid-cols-4 gap-1 p-2.5 bg-[#fbf7ee] border-b border-[#d6c7ab] text-center font-mono text-xs">
                  <div className="p-1 rounded bg-[#fee2e2] border border-[#fca5a5]">
                    <div className="text-[10px] text-red-700 font-bold">HP</div>
                    <div className="font-bold text-red-900">{stats.HP || 50}</div>
                  </div>
                  <div className="p-1 rounded bg-[#dbeafe] border border-[#93c5fd]">
                    <div className="text-[10px] text-blue-700 font-bold">MP</div>
                    <div className="font-bold text-blue-900">{stats.MP || 30}</div>
                  </div>
                  <div className="p-1 rounded bg-[#fef3c7] border border-[#fcd34d]">
                    <div className="text-[10px] text-amber-800 font-bold">物防</div>
                    <div className="font-bold text-amber-950">{stats.Def || 8}</div>
                  </div>
                  <div className="p-1 rounded bg-[#ede9fe] border border-[#ddd6fe]">
                    <div className="text-[10px] text-purple-700 font-bold">魔防</div>
                    <div className="font-bold text-purple-950">{stats.MDef || 8}</div>
                  </div>
                </div>

                {/* Traits snippet */}
                <div className="p-3 text-xs text-[#6b5a4b] flex-1 space-y-1">
                  {npc.traits && (
                    <p className="line-clamp-2 italic text-[11px]">
                      「{npc.traits}」
                    </p>
                  )}
                  {npc.tags && npc.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap pt-1">
                      {npc.tags.map(t => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-[#f4ebd9] text-[#3c2f21] border border-[#d6c7ab] font-mono">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="p-2.5 bg-[#f8f3e8] border-t border-[#d6c7ab] flex items-center justify-between gap-2">
                  <button
                    onClick={() => onDuplicateNpc(npc)}
                    className="p-1.5 rounded-lg text-[#6b5a4b] hover:text-[#2c221e] hover:bg-[#e4d9c0] transition-colors"
                    title="複製副本"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteNpc(npc.id)}
                    className="p-1.5 rounded-lg text-[#6b5a4b] hover:text-red-700 hover:bg-red-50 transition-colors"
                    title="刪除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <JRPGButton
                    variant="primary"
                    size="xs"
                    onClick={() => onSelectNpc(npc)}
                    className="ml-auto"
                  >
                    ✏️ 編輯
                  </JRPGButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
