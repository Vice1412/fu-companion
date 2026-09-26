import React, { useState } from 'react';
import { GiGearHammer, GiCancel, GiCheckMark, GiCoins, GiPocketWatch } from 'react-icons/gi';
import { Plus } from 'lucide-react';
import ClockTracker from '../../../../components/ui/ClockTracker';

export default function TinkererProjectTracker({
  character,
  onChange,
  showToast = () => {}
}) {
  const tinkererClass = (character.classes || []).find(c => c.className === '修補匠');
  const visionarySkill = (tinkererClass?.skills || []).find(s => s.name === '高瞻遠矚');
  const visionarySL = visionarySkill?.sl || 0;
  const freeCostDiscount = visionarySL * 100;
  const extraProgressPerDay = visionarySL;

  // 取得修補匠數據
  const tinkererData = character.tinkererData || {
    projects: [
      {
        id: 'proj_default',
        name: '多功能魔導工具箱',
        tier: '實用專案',
        zenit: 500,
        totalClock: 6,
        filledClock: 2,
        notes: '具備微型照明與簡易機械撬鎖功能',
        completed: false
      }
    ]
  };

  const projects = tinkererData.projects || [];

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newTier, setNewTier] = useState('實用專案');
  const [newZenit, setNewZenit] = useState('500');
  const [newClockSegments, setNewClockSegments] = useState(6);
  const [newNotes, setNewNotes] = useState('');

  const updateTinkererData = (newData) => {
    onChange({
      ...character,
      tinkererData: {
        ...tinkererData,
        ...newData
      },
      updatedAt: new Date().toISOString()
    });
  };

  const handleClockChange = (projId, newFilled) => {
    const updated = projects.map(p => {
      if (p.id === projId) {
        const isDone = newFilled >= p.totalClock;
        return { ...p, filledClock: newFilled, completed: isDone };
      }
      return p;
    });
    updateTinkererData({ projects: updated });
    const target = projects.find(p => p.id === projId);
    if (newFilled >= target.totalClock) {
      showToast(`專案【${target.name}】命刻已填滿！可以完工入庫！`, 'success');
    }
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      showToast('請輸入專案名稱', 'warning');
      return;
    }

    const created = {
      id: `proj_${Date.now()}`,
      name: newProjectName.trim(),
      tier: newTier,
      zenit: parseInt(newZenit, 10) || 500,
      totalClock: parseInt(newClockSegments, 10) || 6,
      filledClock: 0,
      notes: newNotes.trim(),
      completed: false
    };

    updateTinkererData({ projects: [created, ...projects] });
    setNewProjectName('');
    setNewNotes('');
    setIsAddModalOpen(false);
    showToast(`已建立新造物專案【${created.name}】！`, 'success');
  };

  const handleDeleteProject = (projId) => {
    const updated = projects.filter(p => p.id !== projId);
    updateTinkererData({ projects: updated });
    showToast('已移除造物專案');
  };

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/80 via-white to-yellow-50/60 dark:from-slate-900 dark:via-slate-800 dark:to-amber-950/20 border border-amber-300/80 dark:border-amber-700/60 shadow-sm space-y-4 text-xs">
      {/* 頂部標題與特技加成 */}
      <div className="flex items-center justify-between border-b border-amber-200 dark:border-slate-700 pb-2 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <GiGearHammer className="text-xl text-amber-600 dark:text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100 flex items-center gap-2">
              <span>造物工坊與專案時鐘追蹤器</span>
              {visionarySL > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  高瞻遠矚 SL {visionarySL}：每日進度 +{extraProgressPerDay} / 減免 {freeCostDiscount}z
                </span>
              )}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>新建專案</span>
        </button>
      </div>

      {/* 專案列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2.5 transition-all ${
              proj.completed
                ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-400'
                : 'bg-white dark:bg-slate-800 border-[#ded2be] dark:border-slate-700 shadow-2xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between border-b border-[#eee5d8] dark:border-slate-700 pb-1 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <strong className="text-stone-900 dark:text-stone-100 font-bold text-sm">
                    {proj.name}
                  </strong>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    {proj.tier}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteProject(proj.id)}
                  className="text-stone-400 hover:text-red-600 p-0.5"
                  title="刪除專案"
                >
                  <GiCancel className="text-xs" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                <span>材料成本：{proj.zenit}z</span>
                <span>進度：{proj.filledClock} / {proj.totalClock} 格</span>
              </div>

              {proj.notes && (
                <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1">
                  {proj.notes}
                </p>
              )}
            </div>

            {/* 互動式命刻時鐘 */}
            <div className="flex items-center justify-center py-1">
              <ClockTracker
                title=""
                totalSegments={proj.totalClock}
                filledSegments={proj.filledClock}
                theme="amber"
                type="circle"
                size={80}
                onChange={newVal => handleClockChange(proj.id, newVal)}
              />
            </div>

            {proj.completed && (
              <div className="text-center font-bold text-emerald-700 dark:text-emerald-400 text-xs py-1 bg-emerald-100/60 dark:bg-emerald-950/60 rounded-lg border border-emerald-300 dark:border-emerald-800 flex items-center justify-center gap-1">
                <GiCheckMark className="text-xs" />
                <span>研發已完成！</span>
              </div>
            )}
          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full p-6 text-center bg-white/60 dark:bg-slate-900/40 rounded-xl border border-dashed border-amber-300 dark:border-amber-800 text-stone-400 text-xs space-y-1">
            <GiGearHammer className="w-8 h-8 mx-auto text-amber-500/80" />
            <p className="font-bold text-stone-600 dark:text-stone-300">尚未建立任何造物專案</p>
            <p className="text-[11px]">點擊「新建專案」以建立研發命刻與 Zenit 預算！</p>
          </div>
        )}
      </div>

      {/* 新建模態框 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fdfbf7] dark:bg-slate-900 border border-amber-400 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100 flex items-center gap-2">
                <GiGearHammer className="text-amber-600" />
                <span>發起全新造物專案</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <GiCancel className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">專案名稱</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="例如：改良連弩、滑翔動力翼、便攜防禦護盾..."
                  className="w-full p-2 rounded-lg border border-amber-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">發明階級</label>
                  <select
                    value={newTier}
                    onChange={e => {
                      setNewTier(e.target.value);
                      if (e.target.value === '簡單專案') { setNewZenit('200'); setNewClockSegments(4); }
                      else if (e.target.value === '實用專案') { setNewZenit('500'); setNewClockSegments(6); }
                      else if (e.target.value === '重大專案') { setNewZenit('2000'); setNewClockSegments(8); }
                      else if (e.target.value === '傳奇專案') { setNewZenit('5000'); setNewClockSegments(10); }
                    }}
                    className="w-full p-2 rounded-lg border border-amber-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 outline-none focus:border-amber-500"
                  >
                    <option value="簡單專案">簡單專案 (100~300z, 4~6格)</option>
                    <option value="實用專案">實用專案 (500~1000z, 6~8格)</option>
                    <option value="重大專案">重大專案 (1500~3000z, 8~10格)</option>
                    <option value="傳奇專案">傳奇專案 (5000z+, 10~12格)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">材料成本 (Zenit)</label>
                  <input
                    type="number"
                    value={newZenit}
                    onChange={e => setNewZenit(e.target.value)}
                    className="w-full p-2 rounded-lg border border-amber-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">命刻格數</label>
                <select
                  value={newClockSegments}
                  onChange={e => setNewClockSegments(parseInt(e.target.value, 10))}
                  className="w-full p-2 rounded-lg border border-amber-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 outline-none focus:border-amber-500"
                >
                  <option value={4}>4 格命刻</option>
                  <option value={6}>6 格命刻</option>
                  <option value={8}>8 格命刻</option>
                  <option value={10}>10 格命刻</option>
                  <option value={12}>12 格命刻</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">備註說明</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="效果、用途或材料細節..."
                  className="w-full p-2 rounded-lg border border-amber-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-amber-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-slate-700 text-stone-600 dark:text-stone-400 font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm"
                >
                  啟動專案
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
