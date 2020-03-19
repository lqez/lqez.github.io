const words = [
  ["깨우다", "awake", "awoke", "awoken"],
  ["~이다, 있다", "be", "was | were", "been"],
  ["낳다, 견디다", "bear", "bore", "bore | borne"],
  ["치다", "beat", "beat", "beaten"],
  ["되다", "become", "became", "become"],
  ["시작하다", "begin", "began", "begun"],
  ["구부리다", "bend", "bent", "bent"],
  ["내기하다", "bet", "bet", "bet"],
  ["물다", "bite", "bit", "bitten"],
  ["피 흘리다", "bleed", "bled", "bled"],
  ["불다", "blow", "blew", "blown"],
  ["깨다", "break", "broke", "broken"],
  ["가져오다", "bring", "brought", "brought"],
  ["세우다", "build", "built", "built"],
  ["타다", "burn", "burnt | burned", "burnt | burned"],
  ["터지다", "burst", "burst", "burst"],
  ["사다", "buy", "bought", "bought"],
  ["잡다", "catch", "caught", "caught"],
  ["선택하다", "choose", "chose", "chosen"],
  ["오다", "come", "came", "come"],
  ["비용이 들다", "cost", "cost", "cost"],
  ["자르다", "cut", "cut", "cut"],
  ["다루다", "deal", "dealt", "dealt"],
  ["뛰어들다", "dive", "dived(dove)", "dived"],
  ["하다", "do", "did", "done"],
  ["그리다, 끌다", "draw", "drew", "drawn"],
  ["꿈꾸다", "dream", "dreamt | dreamed", "dreamt | dreamed"],
  ["마시다", "drink", "drank", "drunk"],
  ["운전하다", "drive", "drove", "driven"],
  ["먹다", "eat", "ate", "eaten"],
  ["떨어지다", "fall", "fell", "fallen"],
  ["먹이다", "feed", "fed", "fed"],
  ["느끼다", "feel", "felt", "felt"],
  ["싸우다", "fight", "fought", "fought"],
  ["발견하다", "find", "found", "found"],
  ["꼭 맞다", "fit", "fit", "fit"],
  ["날다", "fly", "flew", "flown"],
  ["금하다", "forbid", "forbade | forbad", "forbidden"],
  ["잊다", "forget", "fotgot", "forgetten"],
  ["용서하다", "forgive", "forgave", "forgiven"],
  ["얼다", "freeze", "froze", "frozen"],
  ["얻다", "get", "got", "got | gotten"],
  ["주다", "give", "gave", "given"],
  ["가다", "go", "went", "gone"],
  ["자라다", "grow", "grew", "grown"],
  ["걸다", "hang", "hung", "hung"],
  ["가지다", "have", "had", "had"],
  ["듣다", "hear", "heard", "heard"],
  ["숨기다", "hide", "hid", "hidden"],
  ["치다", "hit", "hit", "hit"],
  ["잡다", "hold", "held", "held"],
  ["다치게 하다", "hurt", "hurt", "hurt"],
  ["유지하다", "keep", "kept", "kept"],
  ["무릎 꿇다", "kneel", "knelt | kneeled", "knelt | kneeled"],
  ["뜨개질하다", "knit", "knit | knitted", "knit | knitted"],
  ["알다", "know", "knew", "known"],
  ["놓다", "lay", "laid", "laid"],
  ["이끌다", "lead", "led", "led"],
  ["뛰어오르다", "leap", "leapt | leaped", "leapt | leaped"],
  ["떠나다", "leave", "left", "left"],
  ["빌려주다", "lend", "lent", "lent"],
  ["시키다", "let", "let", "let"],
  ["눕다", "lie", "lay", "lain"],
  ["비추다", "light", "lit | lighted", "lit | lighted"],
  ["잃다", "lose", "lost", "lost"],
  ["만들다", "make", "made", "made"],
  ["뜻하다", "mean", "meant", "meant"],
  ["만나다", "meet", "met", "met"],
  ["지불하다", "pay", "paid", "paid"],
  ["증명하다", "prove", "proved", "proven | proved"],
  ["놓다, 두다", "put", "put", "put"],
  ["그만두다", "quit", "quit | quitted", "quit | quitted"],
  ["읽다", "read", "read", "read"],
  ["올라타다", "ride", "rode", "ridden"],
  ["소리가 울리다", "ring", "rang", "rung"],
  ["일어나다", "rise", "rose", "risen"],
  ["달리다", "run", "ran", "run"],
  ["말하다", "say", "said", "said"],
  ["보다", "see", "saw", "seen"],
  ["찾다", "seek", "sought", "sought"],
  ["팔다", "sell", "sold", "sold"],
  ["보내다", "send", "sent", "sent"],
  ["놓다", "set", "set", "set"],
  ["꿰매다", "sew", "sewed", "sewn | sewed"],
  ["흔들다", "shake", "shook", "shaken"],
  ["면도하다", "shave", "shaved", "shaven | shaved"],
  ["빛나다", "shine", "shone", "shone"],
  ["쏘다", "shoot", "shot", "shot"],
  ["보여주다", "show", "showed", "shown"],
  ["움츠러들다", "shrink", "shrank | shrunk", "shrunk"],
  ["닫다", "shut", "shut", "shut"],
  ["노래하다", "sing", "sang", "sung"],
  ["가라앉다", "sink", "sank", "sunk"],
  ["앉다", "sit", "sat", "sat"],
  ["자다", "sleep", "slept", "slept"],
  ["미끄러지다", "slide", "slid", "slid"],
  ["냄새를 맡다", "smell", "smelt | smelled", "smelt | smelled"],
  ["씨 뿌리다", "sow", "sowed", "sown | sowed"],
  ["말하다", "speak", "spoke", "spoken"],
  ["속력을 내다", "speed", "sped | speeded", "sped | speeded"],
  ["소비하다", "spend", "spent", "spent"],
  ["엎지르다", "spill", "spilt | spilled", "spilt"],
  ["돌다", "spin", "spun", "spun"],
  ["침을 뱉다", "spit", "spit | spat", "spit | spat"],
  ["쪼개다", "split", "split", "split"],
  ["펴다", "spread", "spread", "spread"],
  ["튀어 오르다", "spring", "sprang | sprung", "sprung"],
  ["서다", "stand", "stood", "stood"],
  ["훔치다", "steal", "stole", "stolen"],
  ["붙이다", "stiek", "stuck", "stuck"],
  ["찌르다", "sting", "stung", "stung"],
  ["치다", "strike", "struck", "struck"],
  ["맹세하다", "swear", "swore", "sworn"],
  ["쓸다", "sweep", "swept", "swept"],
  ["수영하다", "swim", "swam", "swum"],
  ["흔들다", "swing", "swung", "swung"],
  ["잡다", "take", "took", "taken"],
  ["가르치다", "teach", "taught", "taught"],
  ["찢다", "tear", "tore", "torn"],
  ["말하다", "tell", "told", "told"],
  ["생각하다", "think", "thought", "thought"],
  ["던지다", "throw", "threw", "thrown"],
  ["이해하다", "understand", "understood", "understood"],
  ["뒤엎다", "upset", "upset", "upset"],
  ["잠에서 깨다", "wake", "woke | wake", "woken | waked"],
  ["입다, 닳다", "wear", "wore", "worn"],
  ["엮다", "weave", "wove", "woven"],
  ["울다", "weep", "wept", "wept"],
  ["이기다", "win", "won", "won"],
  ["감다", "wind", "wound", "wound"],
  ["물러나다", "withdraw", "withdrew", "withdrawn"],
  ["쓰다", "write", "wrote", "written"]
];
