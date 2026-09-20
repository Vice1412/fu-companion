export const NEGATIVE_SKILLS_DATA = [
  {
    id: 'ns_1',
    originalName: '臨終延遲',
    originalDesc: '當此 NPC 降至 0 點 HP 或被迫離開場景時，擦除一個在填滿時會使他們盟友受益的命刻的 1 個區塊。'
  },
  {
    id: 'ns_2',
    originalName: '臨終引爆',
    originalDesc: '當此 NPC 降至 0 點 HP 或被迫離開場景時，他們對場景中在場的每個盟友造成[大量]的 {damage_type} 傷害。',
    selectionsConfig: [
      { key: 'damage_type', label: '傷害類型', options: ['風', '電', '暗', '土', '火', '冰', '光', '物理', '毒'] }
    ]
  },
  {
    id: 'ns_3',
    originalName: '臨終恢復',
    originalDesc: '當此 NPC 降至 0 點 HP 或被迫離開場景時，場景中在場的每個敵人恢復[大量]的 {recovery_type}。',
    selectionsConfig: [
      { key: 'recovery_type', label: '恢復類型', options: ['HP', 'MP'] }
    ]
  },
  {
    id: 'ns_4',
    originalName: '臨終狀態',
    originalDesc: '當此 NPC 降至 0 點 HP 或被迫離開場景時，場景中在場的每個盟友受到 {status} 狀態。',
    selectionsConfig: [
      { key: 'status', label: '狀態', options: ['眩暈', '動搖', '緩慢', '虛弱'] }
    ]
  },
  {
    id: 'ns_5',
    originalName: '臨終弱化',
    originalDesc: '當此 NPC 降至 0 點 HP 或被迫離開場景時，他們所陪同的冠位 Boss 對 {damage_type} 傷害變為具有弱點。此弱點取代了該 Boss 先前對此傷害類型的任何相性，並持續到當前輪次結束。',
    selectionsConfig: [
      { key: 'damage_type', label: '傷害類型', options: ['風', '電', '暗', '土', '火', '冰', '光', '物理', '毒'] }
    ]
  },
  {
    id: 'ns_6',
    originalName: '強制著陸',
    originalDesc: '當此 NPC 執行他們的強力攻擊時，他們將失去飛行技能的增益，直到當前輪次結束。'
  },
  {
    id: 'ns_7',
    originalName: '痛苦失誤',
    originalDesc: '在此 NPC 用他們的 {attack_type} 未命中所有目標後，他們導致 {target} 失去[少量]的 HP（在攻擊結算後）。',
    selectionsConfig: [
      { key: 'attack_type', label: '攻擊類型', options: ['普通攻擊', '強力攻擊'] },
      { key: 'target', label: '目標', options: ['他們自己', '隨機選擇的他們的一名盟友'] }
    ]
  },
  {
    id: 'ns_8',
    originalName: '狀態束縛',
    originalDesc: '將眩暈、動搖、緩慢和虛弱這四種狀態各分配到以下一項動作：眩暈 ({bind_daze})、動搖 ({bind_shaken})、緩慢 ({bind_slow})、虛弱 ({bind_weak})。\n此 NPC 失去他們通常會擁有的對眩暈、動搖、緩慢和虛弱的任何免疫，並且無法獲得對這四種狀態效果的免疫。此外，只要此 NPC 正受到這四種狀態效果中的一種或多種影響，他們就無法執行你分配給該狀態的攻擊或動作。\n在每個偶數輪結束時，此 NPC 從所有狀態效果中恢復。',
    selectionsConfig: [
      { key: 'bind_daze', label: '眩暈', options: ['普通攻擊', '強力攻擊', '技能動作', '咒語動作'] },
      { key: 'bind_shaken', label: '動搖', options: ['普通攻擊', '強力攻擊', '技能動作', '咒語動作'] },
      { key: 'bind_slow', label: '緩慢', options: ['普通攻擊', '強力攻擊', '技能動作', '咒語動作'] },
      { key: 'bind_weak', label: '虛弱', options: ['普通攻擊', '強力攻擊', '技能動作', '咒語動作'] }
    ]
  }
];
