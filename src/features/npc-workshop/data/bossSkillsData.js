export const BOSS_SKILLS_DATA = [
  // ====================
  // 戰場技能 (bs_battle)
  // ====================
  {
    id: "bs_battle_1",
    source: "bossSkill",
    subCategory: "戰場技能",
    category: "boss",
    originalName: "痛苦光環",
    flavorText: "該區域內的生物難以恢復能量。",
    originalDesc: "場景中在場的所有生物都無法從{status}中恢復，失去對所選狀態效果的任何預先存在的免疫，並且無法獲得對它的免疫。",
    selectionsConfig: [
      { key: "status", label: "選擇狀態", options: ["眩暈", "憤怒", "中毒", "動搖", "緩慢", "虛弱"] }
    ]
  },
  {
    id: "bs_battle_2",
    source: "bossSkill",
    subCategory: "戰場技能",
    category: "boss",
    originalName: "生與死",
    flavorText: "生命力在整個戰場上來回流動。",
    originalDesc: "在奇數輪次，所有生物造成 5 點額外傷害；在偶數輪次，所有 HP 恢復來源額外恢復 10 點 HP。"
  },
  {
    id: "bs_battle_3",
    source: "bossSkill",
    subCategory: "戰場技能",
    category: "boss",
    originalName: "遠與近",
    flavorText: "戰場不斷變化，戰鬥人員必須根據他們的位置改變戰術。這對於飛空艇之間、跨越浮動平台或其他混亂情況的戰鬥非常有用。",
    originalDesc: "選擇一個選項並將其應用於整個衝突：{effect}。",
    selectionsConfig: [
      { key: "effect", label: "選擇效果", options: ["生物在奇數輪次不能成為近戰攻擊的目標", "生物在偶數輪次不能成為遠程攻擊的目標", "生物在奇數輪次不能成為近戰攻擊的目標，且在偶數輪次不能成為遠程攻擊的目標"] }
    ]
  },
  {
    id: "bs_battle_4",
    source: "bossSkill",
    subCategory: "戰場技能",
    category: "boss",
    originalName: "殭屍化",
    flavorText: "靈魂能量的流動被腐化，治療會帶來可怕的痛苦。",
    originalDesc: "當 Boss 以外的生物恢復 HP 時，如果該生物正受到{status}影響，他們改為失去等於該恢復量一半的 HP。只有在玩家角色能夠有效地移除狀態效果時才使用此技能。",
    selectionsConfig: [
      { key: "status", label: "狀態", options: ["虛弱", "中毒"] }
    ]
  },

  // ====================
  // 控制技能 (bs_ctrl)
  // ====================
  {
    id: "bs_ctrl_1",
    source: "bossSkill",
    subCategory: "控制技能",
    category: "boss",
    originalName: "自動反擊",
    flavorText: "這個 Boss 在被逼入絕境時會變得更具反應性。",
    originalDesc: "在敵人用他們的動作導致此 Boss 失去 HP 後，此 Boss 自動對該敵人{action}（在該敵人的動作結算後）。以這種方式執行的攻擊或咒語只能以導致 HP 失去的敵人為目標，並且此 Boss 在決定以此方式造成的傷害時，將他們的 HR 視為 0。",
    selectionsConfig: [
      { key: "action", label: "反擊動作", options: ["以普通攻擊執行一次自由攻擊", "施放一個總 MP 消耗等於或低於 10 點的特定攻擊性咒語"] }
    ]
  },
  {
    id: "bs_ctrl_2",
    source: "bossSkill",
    subCategory: "控制技能",
    category: "boss",
    originalName: "危機狀態",
    flavorText: "當受傷或被逼入絕境時，此 Boss 會發出可怕的咆哮、釋放一波負面能量，或產生其他削弱敵人的效果。",
    originalDesc: "當此 Boss 在衝突場景中第一次進入危機狀態時，場景中在場的每個敵人受到{status1}與{status2}(若僅選擇一種請將第二項設為無)。",
    selectionsConfig: [
      { key: "status1", label: "狀態1", options: ["眩暈", "憤怒", "中毒", "動搖", "緩慢", "虛弱"] },
      { key: "status2", label: "狀態2", options: ["無", "眩暈", "憤怒", "中毒", "動搖", "緩慢", "虛弱"] }
    ]
  },
  {
    id: "bs_ctrl_3",
    source: "bossSkill",
    subCategory: "控制技能",
    category: "boss",
    originalName: "分擔痛苦的印記",
    flavorText: "此 Boss 可以將他們部分失去的 HP 轉移給敵人。",
    originalDesc: "當{actor}用{attackType}命中一個或多個敵人時，這些敵人中的每一個都會被標記。被標記的敵人將保持被標記狀態，直到場景結束，或直到他們恢復任何數量的 HP。\n當此 Boss 失去任何數量的 HP 時，失去的 HP 盡可能平均地分配給此 Boss 和場景中在場的所有被標記的敵人（任何多餘的 HP 失去由 Boss 承受）。然後，所有被標記的敵人不再被標記。",
    selectionsConfig: [
      { key: "actor", label: "觸發者", options: ["此 Boss", "此 Boss 的盟友"] },
      { key: "attackType", label: "攻擊類型", options: ["普通攻擊", "攻擊性咒語"] }
    ]
  },
  {
    id: "bs_ctrl_4",
    source: "bossSkill",
    subCategory: "控制技能",
    category: "boss",
    originalName: "觀察與懲罰",
    flavorText: "此 Boss 惡毒地懲罰最後一個激起他們憤怒的敵人。",
    originalDesc: "當此 Boss 能看見的敵人{trigger}時，該敵人變為被觀察狀態，任何先前被觀察的敵人不再被觀察。\n在除了第一輪之外的每一輪的他們的第一個回合中，此 Boss 執行其普通攻擊，且僅以他們當前被觀察的敵人為目標（如果可以的話）。如果此攻擊命中被觀察的敵人，它造成 10 點額外傷害，並且該敵人也受到{status}。",
    selectionsConfig: [
      { key: "trigger", label: "觸發條件", options: ["對此 Boss 造成傷害", "對此 Boss 的盟友造成傷害", "執行咒語或技能動作"] },
      { key: "status", label: "附加狀態", options: ["眩暈", "動搖", "緩慢", "虛弱"] }
    ]
  },
  {
    id: "bs_ctrl_5",
    source: "bossSkill",
    subCategory: "控制技能",
    category: "boss",
    originalName: "暴君的法令",
    flavorText: "對於能夠制定魔法律法或法令的 Boss，或者對於防範特定手段準備得非常充分且警惕的 Boss 來說，這是一個不錯的選擇。",
    originalDesc: "在每一輪的他們的第一個回合中，此 Boss 使用一個動作來隨機禁止{prohibitCount}種動作類型（選擇池：攻擊、防禦、阻礙、道具、目標、咒語、技能）；必須告訴玩家哪種動作被禁止，並且該禁令持續到場景結束或直到此效果再次觸發。\n在敵人執行了被禁止的動作後，此 Boss 自動對該敵人{action}（在該敵人的動作結算後）。以這種方式執行的攻擊或咒語只能以執行了被禁止動作的敵人為目標，並且此 Boss 在決定以此方式造成的傷害時，將他們的 HR 視為 0。",
    selectionsConfig: [
      { key: "prohibitCount", label: "禁止數量", options: ["一種", "兩種", "三種"] },
      { key: "action", label: "反擊動作", options: ["執行阻礙動作", "以普通攻擊執行一次自由攻擊", "施放一個總 MP 消耗等於或低於 10 點的特定攻擊性咒語"] }
    ]
  },
  {
    id: "bs_ctrl_6",
    source: "bossSkill",
    subCategory: "控制技能",
    category: "boss",
    originalName: "你正好證明了我的觀點",
    flavorText: "這個 Boss 知道如何引誘英雄們落入他們自己製造的陷阱，讓他們感到自己的渺小和不足。",
    originalDesc: "在每一輪開始時，此 Boss 在身份、主題和起源中隨機選擇一種類型的特質；所選類型的特質變為危險狀態，直到下一輪開始。GM 必須宣布有一種類型的特質現在是危險的，但不能透露是哪一種。\n當玩家角色喚起危險的特質來重骰檢定時，兩顆骰子改為都顯示為 1，從而產生一次大失敗。"
  },

  // ====================
  // 破壞性技能 (bs_dest)
  // ====================
  {
    id: "bs_dest_1",
    source: "bossSkill",
    subCategory: "破壞性技能",
    category: "boss",
    originalName: "災難充能者",
    flavorText: "一項獨特的技能，適合那些將盟友用作魔法電池來為毀滅性爆炸充能的 Boss。",
    originalDesc: "在每一輪的最後一個回合中，此 Boss 使用一個動作導致場景中在場的每個士兵階級盟友失去 30 點 MP；然後，此 Boss 獲得等同於這些盟友失去的 MP 總量的災難點數。\n最後，如果此 Boss 擁有 100 點或更多災難點數，他們失去所有災難點數，並對場景中在場的每個敵人造成[大量]的{type}傷害。以這種方式失去 HP 的敵人也受到{status}。",
    selectionsConfig: [
      { key: "type", label: "傷害屬性", options: ["風", "電", "暗", "土", "火", "冰", "光", "物理", "毒"] },
      { key: "status", label: "附加狀態", options: ["眩暈", "動搖", "緩慢", "虛弱"] }
    ]
  },
  {
    id: "bs_dest_2",
    source: "bossSkill",
    subCategory: "破壞性技能",
    category: "boss",
    originalName: "腐蝕狀態",
    flavorText: "對於殘忍、精於算計、投機取巧或有毒的 Boss 來說，這是一個極佳的選擇。",
    originalDesc: "在每一輪的最後一個回合中，此 Boss 使用一個動作對場景中在場的每個正受到{status}影響的敵人造成[條件大量]的{type}傷害。",
    selectionsConfig: [
      { key: "status", label: "觸發狀態", options: ["眩暈", "憤怒", "中毒", "動搖", "緩慢", "虛弱"] },
      { key: "type", label: "傷害屬性", options: ["風", "電", "暗", "土", "火", "冰", "光", "物理", "毒"] }
    ]
  },
  {
    id: "bs_dest_3",
    source: "bossSkill",
    subCategory: "破壞性技能",
    category: "boss",
    originalName: "破壞性陣型",
    flavorText: "非常適合戰術天才、領袖或蟲群主腦。",
    originalDesc: "在每一輪的最後一個回合中，如果場景中有兩個或更多士兵階級盟友在場，此 Boss 使用一個動作對場景中在場的每個敵人造成[條件大量]的{type}傷害。",
    selectionsConfig: [
      { key: "type", label: "傷害屬性", options: ["風", "電", "暗", "土", "火", "冰", "光", "物理", "毒"] }
    ]
  },
  {
    id: "bs_dest_4",
    source: "bossSkill",
    subCategory: "破壞性技能",
    category: "boss",
    originalName: "毀盪",
    flavorText: "適合強大的施法者、元素生物和惡魔。",
    originalDesc: "此 Boss 學會『毀盪』咒語。*(此選項僅適用於 30 級或更高的 Boss)*",
    reqLevel: 30
  },
  {
    id: "bs_dest_5",
    source: "bossSkill",
    subCategory: "破壞性技能",
    category: "boss",
    originalName: "末日",
    flavorText: "這個 Boss 正在緩慢地為一招毀滅性動作充能；GM 應該清楚地傳達「末日」命刻代表著可能的失敗。",
    originalDesc: "此 Boss 伴隨著一個有 6 個區塊「末日」命刻進入衝突。在每一輪的最後一個回合中，此 Boss 使用一個動作來自動填滿「末日」命刻的 1 個區塊，或者如果他們處於危機狀態則改為 2 個區塊。\n然後，如果「末日」命刻已滿，每個敵人的 HP 都精確降至 1 點，並且將「末日」命刻從場景中移除。\n*(「末日」命刻可以正常地進行互動（讓玩家延遲），作為可選規則，你也可以讓特定事件（例如受到弱點傷害）擦除此命刻)*"
  },
  {
    id: "bs_dest_6",
    source: "bossSkill",
    subCategory: "破壞性技能",
    category: "boss",
    originalName: "地獄賭局",
    flavorText: "此 Boss 幾乎不把任何人的生命放在眼裡，包括他們自己的生命。",
    originalDesc: "在每個偶數輪的最後一個回合中，此 Boss 使用一個動作並花費 20 點 MP 釋放出一種不可預測的力量，對場景中在場的隨機生物（包括 Boss 本身）造成[大量]的{type}傷害。\n*(為此技能選擇的傷害類型必須是 Boss 對其具有中立相性的類型，並且由這造成的 HP 失去不能使生物降至 1 點 HP 以下)*",
    selectionsConfig: [
      { key: "type", label: "隨機傷害", options: ["風", "電", "暗", "土", "火", "冰", "光", "物理", "毒"] }
    ]
  },
  {
    id: "bs_dest_7",
    source: "bossSkill",
    subCategory: "破壞性技能",
    category: "boss",
    originalName: "虛無",
    flavorText: "這個敵人可以釋放出一波突如其來的負面能量。",
    originalDesc: "在每個偶數輪的最後一個回合中，此 Boss 使用一個動作並花費 10 點 MP 來結束所有持續時間為「場景」的咒語，結束所有持續「直到場景結束」或在生物回合開始或結束時結束的效果，強制解散所有秘儀，並摧毀場景中在場的所有象徵。"
  },

  // ====================
  // 元素技能 (bs_elem)
  // ====================
  {
    id: "bs_elem_1",
    source: "bossSkill",
    subCategory: "元素技能",
    category: "boss",
    originalName: "二元元素",
    flavorText: "此 Boss 作為對立面的持續流動而存在。",
    originalDesc: "此 Boss 對{pair}中的第一種傷害類型免疫，並對同一對中的第二種傷害類型具有弱點；這些相性取代了此 Boss 先前對這些傷害類型存在的任何相性。在每一輪結束時，此 Boss 交換這些相性。",
    selectionsConfig: [
      { key: "pair", label: "元素對子", options: ["風/土", "暗/光", "火/冰"] }
    ]
  },
  {
    id: "bs_elem_2",
    source: "bossSkill",
    subCategory: "元素技能",
    category: "boss",
    originalName: "元素危機",
    flavorText: "當處於危險中時，此 Boss 會經歷一種奇異的轉變。",
    originalDesc: "當此 Boss 在衝突中第一次進入危機狀態時，他們的傷害相性和/或他們攻擊、咒語和技能造成的傷害類型會改變，直到場景結束。*(確保 Boss 在轉變後仍然具有一個或多個玩家角色可以利用的弱點)*"
  },
  {
    id: "bs_elem_3",
    source: "bossSkill",
    subCategory: "元素技能",
    category: "boss",
    originalName: "元素架勢",
    flavorText: "對於掌握了各種元素技巧並且可以流暢切換相性的 Boss 來說，這是一個極佳的選擇。特別推薦在戰役後期（30+）時使用。",
    originalDesc: "此 Boss 以你選擇的架勢（見下）進入衝突，並且每當切換觸發器：{trigger}發生時，自動按照特定的模式（或隨機）切換到不同的架勢。架勢所賦予的免疫與弱點總是取代此 Boss 先前對相應傷害類型的任何現有相性。\n已選架勢：\n{selected_stances}",
    selectionsConfig: [
      { key: "trigger", label: "切換觸發器", options: ["在此 Boss 執行普通攻擊後（在攻擊結算後）", "在此 Boss 執行防禦動作後", "在此 Boss 因受到其具有弱點的類型的傷害而失去 HP 後", "在每一輪結束時"] },
      { key: "selected_stances", label: "選擇架勢 (2~5種)", type: "multiselect", min: 2, max: 5, options: ["風：免疫風，弱點電", "電：免疫電，弱點土", "暗：免疫暗，弱點光", "土：免疫土，弱點風", "火：免疫火，弱點冰", "冰：免疫冰，弱點火", "光：免疫光，弱點暗"] }
    ]
  },

  // ====================
  // 目標技能 (bs_obj)
  // ====================
  {
    id: "bs_obj_1",
    source: "bossSkill",
    subCategory: "目標技能",
    category: "boss",
    originalName: "消耗戰",
    flavorText: "由於他們巧妙的措辭、尖銳的反駁或拖延戰術，對付這個 Boss 特別令人疲憊。",
    originalDesc: "在此 Boss 於敵人回合對抗檢定失敗後，該敵人受到{failure_status}。如果該敵人已經受到此狀態，他們改為{repeat_penalty}。<meta>如果此 Boss 為 30 級或更高，失去的 HP 或 MP 數量翻倍。</meta>",
    selectionsConfig: [
      { key: "failure_status", label: "失敗狀態", options: ["眩暈", "動搖", "緩慢", "虛弱"] },
      { key: "repeat_penalty", label: "重複懲罰", options: ["失去 [消耗戰HP] 點 HP", "失去 [消耗戰MP] 點 MP", "受到眩暈狀態", "受到動搖狀態", "受到緩慢狀態", "受到虛弱狀態"] }
    ]
  },
  {
    id: "bs_obj_2",
    source: "bossSkill",
    subCategory: "目標技能",
    category: "boss",
    originalName: "倒數計時",
    flavorText: "這個選項給玩家設置了一個嚴格的計時器；GM 應該清楚地解釋「倒數計時」命刻代表嚴格的回合限制。",
    originalDesc: "此 Boss 伴隨著一個有 6 個區塊的「倒數計時」命刻進入衝突。在每一輪結束時，填滿「倒數計時」命刻的 1 個區塊；然後，如果「倒數計時」命刻已滿，衝突立即結束，Boss 達成他們的目標。\n*(「倒數計時」命刻只能透過擦除其部分區塊來延遲失敗；它的區塊只能如上所述在回合結束時填滿，或者透過機會填滿)*"
  },
  {
    id: "bs_obj_3",
    source: "bossSkill",
    subCategory: "目標技能",
    category: "boss",
    originalName: "殘酷的轉折",
    flavorText: "這個 Boss 有一個秘密計劃，領先英雄們一步。",
    originalDesc: "在每個衝突場景中一次，此 Boss 可以使用一個動作並花費 2 點終結點，來交換兩個不同命刻目前已填滿的區塊數量。如果這會導致一個命刻的填滿區塊數量超過其最大值，該命刻將直接完成，任何多餘的區塊都將被浪費。"
  },
  {
    id: "bs_obj_4",
    source: "bossSkill",
    subCategory: "目標技能",
    category: "boss",
    originalName: "壓倒性優勢",
    flavorText: "此 Boss 在特定領域或背景下無人能敵。",
    originalDesc: "此 Boss 在{expertise_area}展現出壓倒性優勢。在每一輪的最後一個回合中，此 Boss 花費一個動作和 20 點 MP 來自動填滿或擦除他們選擇的與所選領域相關的命刻的 2 個區塊。如果他們願意，他們還可以花費 1 點終結點來填滿或擦除該命刻的一個額外區塊。",
    selectionsConfig: [
      { key: "expertise_area", label: "擅長領域", type: "input", placeholder: "例如：宮廷陰謀、街頭追逐..." }
    ]
  },
  {
    id: "bs_obj_5",
    source: "bossSkill",
    subCategory: "目標技能",
    category: "boss",
    originalName: "我很了解你",
    flavorText: "這個 Boss 是一個反覆出現的敵人，或者已經收集了大量關於英雄們的資訊，可以輕易地操縱他們。",
    originalDesc: "當一個生物執行檢定時，此 Boss 可以花費 1 點終結點來喚起在一個玩家角色卡上找到的他們選擇的一項特質，並重骰該檢定的一顆或兩顆骰子。\n當一個玩家角色的特質以此方式被喚起時，該特質變為透支狀態，直到場景結束。在每個玩家角色回合結束時，如果該角色目前的 MP 等於或高於其最大 MP，他們所有透支的特質將不再處於透支狀態。\n玩家角色不能喚起透支的特質；只要一個角色有一個或多個透支的特質，他們造成的所有傷害都會無視弱點，並且他們受到的所有傷害都會無視抗性。"
  },
  {
    id: "bs_obj_6",
    source: "bossSkill",
    subCategory: "目標技能",
    category: "boss",
    originalName: "毀滅性影響",
    flavorText: "這個 Boss 可以編織命運和運氣來對抗英雄們。",
    originalDesc: "在此 Boss 執行對抗檢定後，他們可以花費 2 點終結點將參與該檢定的敵人擲出的所有骰子轉為顯示為 1，迫使這些敵人中的每一個產生一次大失敗（每次大失敗都會為此 Boss 提供一次單獨的機會）。此技能不能用於一個或多個敵人取得大成功的對抗檢定。"
  },

  // ====================
  // 召喚師技能 (bs_sum)
  // ====================
  {
    id: "bs_sum_1",
    source: "bossSkill",
    subCategory: "召喚師技能",
    category: "boss",
    originalName: "呼叫增援",
    flavorText: "非常適合指揮官、召喚師、死靈法師，以及任何能夠毫不費力地召喚成群的小兵來壓倒英雄的 Boss。",
    originalDesc: "此 Boss 可以使用一個動作並花費 1 點終結點來召喚最多兩名士兵階級盟友。（加強版：每回合結束時自動發動且不消耗動作，但最多只召喚一名士兵）"
  },
  {
    id: "bs_sum_2",
    source: "bossSkill",
    subCategory: "召喚師技能",
    category: "boss",
    originalName: "反擊召喚",
    flavorText: "非常適合在受到敵人傷害時召喚較弱生物的 Boss，例如可以分裂成更小版本的史萊姆，或者攜帶著大量生物並在受傷時「掉落」其中一些生物的 Boss。",
    originalDesc: "在每個回合結束時，如果此 Boss 在該回合中失去了 HP，他們召喚一名士兵階級盟友。擁有此技能的 Boss 開始衝突時應該沒有盟友陪同。"
  },
  {
    id: "bs_sum_3",
    source: "bossSkill",
    subCategory: "召喚師技能",
    category: "boss",
    originalName: "緊急增援",
    flavorText: "對於在危險中會再生肢體或帶來新盟友的 Boss 很有用。",
    originalDesc: "在每一輪結束時，如果此 Boss 處於危機狀態並且場景中剩餘的士兵階級盟友少於兩名，則有一名士兵階級盟友加入衝突。",
    selectionsConfig: [
      { key: "is_enhanced", label: "啟用加強版", type: "checkbox", enhancedDesc: "在每一輪結束時，如果此 Boss 處於危機狀態並且場景中剩餘的士兵階級盟友少於兩名，此 Boss 花費 1 點終結點，並召喚兩名士兵階級盟友加入衝突。" }
    ]
  },
  {
    id: "bs_sum_4",
    source: "bossSkill",
    subCategory: "召喚師技能",
    category: "boss",
    originalName: "部位再生",
    flavorText: "這是給予由代表其身體部位的士兵所陪同的 Boss 進行重置的一種方式。",
    originalDesc: "當此 Boss 在衝突中第一次進入危機狀態時，此 Boss 及場景中在場的其所有盟友從所有狀態效果中恢復，然後此 Boss 召喚士兵，直到他們這一方恢復到衝突場景開始時相同的組成。"
  },
  {
    id: "bs_sum_5",
    source: "bossSkill",
    subCategory: "召喚師技能",
    category: "boss",
    originalName: "完美協調",
    flavorText: "這個 Boss 對他們的小兵（或身體部位）有著非常直接的控制。",
    originalDesc: "當此 Boss 在場景中時，他們的士兵階級盟友可以從 Boss 的儲備中花費終結點來喚起他們的特質並重骰檢定。"
  },

  // ====================
  // 生存技能 (bs_surv)
  // ====================
  {
    id: "bs_surv_1",
    source: "bossSkill",
    subCategory: "生存技能",
    category: "boss",
    originalName: "適應性相性",
    flavorText: "這個 Boss 會本能地適應他們受到的上一種傷害類型。",
    originalDesc: "在此 Boss 因傷害而失去 HP 後，如果該傷害有類型，他們獲得對該傷害類型的免疫，直到此技能再次被觸發。<meta>（如果此 Boss 為 30 級或更高，此技能改為賦予吸收而不是免疫，或獲得的免疫可以持續直到被額外觸發兩次）。</meta>",
    selectionsConfig: [
      {
        key: "adaptive_30_abs",
        label: "改為賦予吸收而非免疫",
        type: "checkbox",
        reqLevel: 30,
        enhancedDesc: "在此 Boss 因傷害而失去 HP 後，如果該傷害有類型，他們獲得對該傷害類型的吸收，直到此技能再次被觸發。"
      },
      {
        key: "adaptive_30_imm",
        label: "免疫持續直到額外觸發兩次",
        type: "checkbox",
        reqLevel: 30,
        enhancedDesc: "在此 Boss 因傷害而失去 HP 後，如果該傷害有類型，他們獲得對該傷害類型的免疫，直到此技能額外被觸發兩次。"
      }
    ]
  },
  {
    id: "bs_surv_2",
    source: "bossSkill",
    subCategory: "生存技能",
    category: "boss",
    originalName: "偽裝",
    flavorText: "這個 Boss 可以暫時從視線中消失。",
    originalDesc: "此 Boss 在偶數輪{status}。",
    selectionsConfig: [
      { key: "status", label: "狀態", options: ["是隱形的", "不能成為近戰攻擊的目標", "不能成為咒語和遠程攻擊的目標"] }
    ]
  },
  {
    id: "bs_surv_3",
    source: "bossSkill",
    subCategory: "生存技能",
    category: "boss",
    originalName: "抓得到我就來啊",
    flavorText: "此 Boss 特別敏捷或隱蔽，或者可能離英雄們很遠。",
    originalDesc: "此 Boss 伴隨著一個「追捕」命刻進入衝突，通常有 8 或 10 個區塊。除非「追捕」命刻有一半或更多的區塊被填滿，否則敵人無法看見此 Boss，並且特定的 Boss 動作可以擦除該命刻的 1 個區塊。"
  },
  {
    id: "bs_surv_4",
    source: "bossSkill",
    subCategory: "生存技能",
    category: "boss",
    originalName: "防禦架勢",
    flavorText: "這個 Boss 在兩種防禦架勢之間交替，準備減少來自不同來源的傷害。",
    originalDesc: "在奇數輪次，此 Boss 將受到的所有來自攻擊的傷害減半；在偶數輪次，此 Boss 將受到的所有來自非攻擊來源的傷害減半。傷害總是在應用相性之前減半。"
  },
  {
    id: "bs_surv_5",
    source: "bossSkill",
    subCategory: "生存技能",
    category: "boss",
    originalName: "再生",
    flavorText: "此 Boss 在接近失敗時可以迅速恢復力量。",
    originalDesc: "在每一輪結束時，如果此 Boss 處於危機狀態，他們恢復[大量]的{hpmp}。",
    selectionsConfig: [
      { key: "hpmp", label: "恢復對象", options: ["HP", "MP", "HP 與 MP"] }
    ]
  },
  {
    id: "bs_surv_6",
    source: "bossSkill",
    subCategory: "生存技能",
    category: "boss",
    originalName: "復甦之風",
    flavorText: "當被逼入絕境時，此 Boss 聚集新的力量。",
    originalDesc: "當此 Boss 在場景中第一次進入危機狀態時，他們從所有狀態效果中恢復，並且還恢復[巨量]的 MP。"
  },
  {
    id: "bs_surv_7",
    source: "bossSkill",
    subCategory: "生存技能",
    category: "boss",
    originalName: "臨時防禦",
    flavorText: "這個 Boss 受到特殊的盔甲、鱗片、魔法屏障或力場的保護。如果這個盔甲受到足夠的損壞，Boss 就會變得更具攻擊性。",
    originalDesc: "此 Boss 始終將其{stat}分數視為等於 [臨時防禦]。當此 Boss 在場景中第一次進入危機狀態時，他們失去此增益，並且他們的普通攻擊獲得多重（2）。如果他們的普通攻擊已經有多重（2），則改為將其增加到多重（3）。",
    selectionsConfig: [
      { key: "stat", label: "防禦類型", options: ["物防", "魔防"] }
    ]
  },
  {
    id: "bs_surv_8",
    source: "bossSkill",
    subCategory: "生存技能",
    category: "boss",
    originalName: "撤銷",
    flavorText: "戰敗時，此 Boss 可以為整個戰場部分地倒轉時間。",
    originalDesc: "當此 Boss 降至 0 點 HP 時，他們可以花費 1 點終結點，改為讓場景中在場的每個生物（包括他們自己）恢復[巨量]的 HP 和 MP。"
  },
  {
    id: "bs_surv_9",
    source: "bossSkill",
    subCategory: "生存技能",
    category: "boss",
    originalName: "吸血陣型",
    flavorText: "當此 Boss 由盟友陪同，可怕的吸血能量就會聚集，允許他們從受害者身上吸取生命。",
    originalDesc: "當此 Boss 導致一個或多個敵人失去 HP 時，如果場景中有兩名或更多名此 Boss 的士兵階級盟友在場，此 Boss 恢復等同於這些敵人失去 HP 總量一半的 HP。"
  }
];
