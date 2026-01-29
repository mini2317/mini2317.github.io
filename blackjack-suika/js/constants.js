const CONFIG = {
    WIDTH: 600,
    HEIGHT: 800,
    WALL_THICKNESS: 100,
    GRAVITY: 1.2,
    FRICTION: 0.5,
    BOUNCINESS: 0.1,
    DROP_LINE_Y: 150,
    DANGER_LINE_Y: 200,
    MAX_VELOCITY: 15 // Limit speed to prevent glitch launches
};

// Ability Swap:
// Spades <-> Diamonds
const SUITS = {
    CLUBS: { id: 'clubs', symbol: '♣', color: '#8ecae6', effectName: 'SWITCH', rank: 0 },
    HEARTS: { id: 'hearts', symbol: '♥', color: '#f94144', effectName: 'BOMB', rank: 1 },
    DIAMONDS: { id: 'diamonds', symbol: '♦', color: '#ff7f50', effectName: 'SCATTER', rank: 2 },
    SPADES: { id: 'spades', symbol: '♠', color: '#a0a0a0', effectName: 'EXPLOSION', rank: 3 },
};

const SUIT_KEYS = Object.keys(SUITS);

// Increased Ace (1) frequency
const DROP_VALUES = [
    1, 1, 1, 1, 1,
    2, 2, 2,
    3, 3,
    4, 4,
    5, 5,
    6, 7, 8, 9
];

const TEXTS = {
    EN: {
        SCORE: "Score",
        HIGH_SCORE: "Best",
        NEXT: "Next",
        ITEM_SWITCH: "🔁 Switch",
        SWITCH_DESC: "Swap two balls!",
        ITEM_BOMB: "💣 Bomb",
        BOMB_DESC: "Destroy balls in area!",
        GAME_OVER: "GAME OVER",
        RESTART: "Click to Restart",
        HINT: "Click to Drop",
        HINT_SWITCH: "Select 2 Balls",
        HINT_BOMB: "Click to Explode",
        RULES_BTN: "Rules",
        RULES_TITLE: "How to Play",

        MSG_PAIR: "Pair!",
        MSG_SUIT: "Suit!",
        MSG_MIX: "Mix!",
        MSG_BJ: "BLACKJACK!",
        MSG_GET_SWITCH: "+1 🔁",
        MSG_GET_BOMB: "+1 💣",

        RULES_CONTENT: `
        <div style="text-align:left; font-size:15px; line-height:1.6;">
        <b>1. How to Merge</b><br>
        - <b>Diff Suit</b>: Same Number. (Priority: ♠ > ♦ > ♥ > ♣)<br>
        - <b>Same Suit</b>: Sum &le; 21.<br>
        - <b style="color:#ff4d4d">Sum > 21</b>: No Merge!<br>
        <br>
        <b>2. Rewards (Suit Effects)</b><br>
        - <b style="color:#a0a0a0">♠ Spade</b>: <b>Impact</b> (Push nearby balls).<br>
        - <b style="color:#ff7f50">♦ Diamond</b>: <b>Chaos</b> (Spawns random junk balls!).<br>
        - <b style="color:#f94144">♥ Heart</b>: <b>Bomb</b> (Get Bomb Item).<br>
        - <b style="color:#8ecae6">♣ Club</b>: <b>Switch</b> (Get Swap Item).<br>
        <br>
        <b>3. Items</b><br>
        - <b>Switch (🔁)</b>: Swap 2 balls' positions.<br>
        - <b>Bomb (💣)</b>: Click to explode an area.<br>
        <br>
        <b>4. Important Rule</b><br>
        - <b>Ace (A) is ALWAYS 1.</b><br>
        - Sum to exactly <b>21</b> to clear!<br>
        - <b>Danger Line</b> lowers as you drop balls!
        </div>
        `
    },
    KR: {
        SCORE: "점수",
        HIGH_SCORE: "최고 점수",
        NEXT: "다음",
        ITEM_SWITCH: "🔁 스위치",
        SWITCH_DESC: "공 두 개의 위치 교환",
        ITEM_BOMB: "💣 폭탄",
        BOMB_DESC: "클릭한 위치 폭파",
        GAME_OVER: "게임 오버",
        RESTART: "클릭하여 재시작",
        HINT: "클릭하여 떨어뜨리기",
        HINT_SWITCH: "두 개의 공을 선택하세요",
        HINT_BOMB: "폭파할 위치 클릭",
        RULES_BTN: "게임 방법",
        RULES_TITLE: "게임 규칙",

        MSG_PAIR: "페어!",
        MSG_SUIT: "슈트!",
        MSG_MIX: "합체!",
        MSG_BJ: "블랙잭!",
        MSG_GET_SWITCH: "+1 🔁",
        MSG_GET_BOMB: "+1 💣",

        RULES_CONTENT: `
        <div style="text-align:left; font-size:15px; line-height:1.6;">
        <b>1. 합치기 규칙</b><br>
        - <b>다른 무늬</b>: 숫자가 같으면 합쳐짐. (우선순위: ♠ > ♦ > ♥ > ♣)<br>
        - <b>같은 무늬</b>: 합이 21 이하일 때 합쳐짐.<br>
        - <b style="color:#ff4d4d">합이 21 초과</b>: 합쳐지지 않습니다!<br>
        <br>
        <b>2. 무늬별 보상 (완성 시)</b><br>
        - <b style="color:#a0a0a0">♠ 스페이드</b>: <b>충격</b> (주변을 밀어냄)<br>
        - <b style="color:#ff7f50">♦ 다이아</b>: <b>혼돈</b> (랜덤한 공들이 마구 쏟아짐!)<br>
        - <b style="color:#f94144">♥ 하트</b>: <b>폭탄</b> (폭탄 아이템 획득)<br>
        - <b style="color:#8ecae6">♣ 클로버</b>: <b>스위치</b> (위치 교환 아이템 획득)<br>
        <br>
        <b>3. 아이템</b><br>
        - <b>스위치 (🔁)</b>: 두 공의 위치를 맞바꿉니다.<br>
        - <b>폭탄 (💣)</b>: 원하는 곳을 클릭해 터뜨립니다.<br>
        <br>
        <b>4. 중요 규칙</b><br>
        - <b>A(에이스)는 무조건 1입니다.</b><br>
        - 합계가 정확히 <b>21</b>이 되면 터집니다!<br>
        - 공을 떨어뜨릴수록 <b>기준선이 점점 내려옵니다!</b>
        </div>
        `
    }
};
