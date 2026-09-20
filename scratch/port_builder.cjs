const fs = require('fs');
const path = require('path');

const srcPath = 'C:\\Users\\Admin2\\fu-npc-builder\\src\\App.jsx';
const destPath = path.resolve(__dirname, '../src/features/npc-workshop/NPCWorkshop.jsx');

let content = fs.readFileSync(srcPath, 'utf8');

// 1. Fix asset import paths
content = content.replace(
  "import modLogo from './assets/Fabula Ultima Mod Logo - White Background.png';",
  "import modLogo from '../../assets/Fabula Ultima Mod Logo - White Background.png';"
);
content = content.replace(
  "import appIcon from './assets/app-icon.png';",
  "import appIcon from '../../assets/app-icon.png';"
);

// 2. Add exportNpcToCombatant import
content = content.replace(
  "import {\n  DAMAGE_TYPES,",
  "import { exportNpcToCombatant } from './utils/npcEngine';\nimport {\n  DAMAGE_TYPES,"
);

// 3. Dual Storage Sync for FU Companion
content = content.replace(
  "  const [library, setLibrary] = useState(() => {\n    const saved = localStorage.getItem('fabula-npc-library-v2');\n    if (saved) {\n      try {\n        const parsed = JSON.parse(saved);\n        return Array.isArray(parsed) ? parsed.map(migrateNpcState) : [];\n      } catch (e) { }\n    }\n    return [];\n  });\n\n  useEffect(() => { localStorage.setItem('fabula-npc-library-v2', JSON.stringify(library)); }, [library]);",
  `  const [library, setLibrary] = useState(() => {
    const saved = localStorage.getItem('fu_companion_npc_library') || localStorage.getItem('fabula-npc-library-v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.map(migrateNpcState) : [];
      } catch (e) { }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('fu_companion_npc_library', JSON.stringify(library));
    localStorage.setItem('fabula-npc-library-v2', JSON.stringify(library));
  }, [library]);`
);

// 4. Add handleSendToCombat handler inside App component
const sendCombatCode = `
  const handleSendToCombat = (npc) => {
    try {
      const combatant = exportNpcToCombatant(npc);
      const activeCombat = JSON.parse(localStorage.getItem('fu_companion_active_combat') || '{}');
      const combatants = activeCombat.combatants || [];
      combatants.push(combatant);
      activeCombat.combatants = combatants;
      localStorage.setItem('fu_companion_active_combat', JSON.stringify(activeCombat));
      showToast(\`⚔️ 已將【\${npc.name || 'NPC'}】推入戰鬥房間！\`, 'success');
    } catch (e) {
      console.error('Failed to send to combat:', e);
      showToast('❌ 入戰失敗，請確認怪物數據完整。', 'error');
    }
  };
`;

content = content.replace(
  "  const [toast, setToast] = useState(null);",
  "  const [toast, setToast] = useState(null);" + sendCombatCode
);

// 5. Add '入戰' button in library card actions
content = content.replace(
  `<button onClick={() => { setState(npc); setActiveMainTab('preview'); }} className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-900 py-2 rounded text-sm font-bold flex justify-center items-center gap-1 transition-colors border border-amber-300"><Eye size={14} /> 預覽</button>`,
  `<button onClick={() => { setState(npc); setActiveMainTab('preview'); }} className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-900 py-2 rounded text-sm font-bold flex justify-center items-center gap-1 transition-colors border border-amber-300"><Eye size={14} /> 預覽</button>
                        <button onClick={() => handleSendToCombat(npc)} className="bg-rose-100 hover:bg-rose-200 text-rose-900 px-3 py-2 rounded text-sm font-bold flex justify-center items-center gap-1 transition-colors border border-rose-300" title="推入戰鬥房間"><Swords size={14} /> 入戰</button>`
);

fs.writeFileSync(destPath, content, 'utf8');
console.log('Successfully deployed fu-npc-builder to src/features/npc-workshop/NPCWorkshop.jsx!');
