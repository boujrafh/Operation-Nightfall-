/**
 * Chapter 0 codec dialogue. Each line is at most 120 characters
 * (4 lines of 30 in the codec window).
 */
export const DIALOGUES = [
  {
    id: 'dlg_ch0_briefing',
    caller: 'hale',
    lines: [
      { speaker: 'hale', text: 'WREN, THIS IS HALE. DO YOU READ ME?' },
      { speaker: 'wren', text: 'LOUD AND CLEAR, COMMANDER.' },
      { speaker: 'hale', text: 'YOUR TARGET IS THE IRON VEIL BASE ON THE KESSRIN PLATEAU.' },
      {
        speaker: 'hale',
        text: 'THEY ARE BUILDING A WEAPON CALLED GOLIATH-7. WE NEED TO KNOW WHAT IT IS.',
      },
      { speaker: 'hale', text: 'KESTREL WENT IN THREE DAYS AGO. WE LOST CONTACT WITH HIM.' },
      { speaker: 'wren', text: 'SO I GO IN ALONE. NO WEAPONS?' },
      { speaker: 'hale', text: 'NONE. YOU LIVE OFF THE LAND. TAKE WHAT YOU NEED FROM THE ENEMY.' },
      { speaker: 'hale', text: 'CALL ME ON 140.85 IF YOU NEED HELP. GOOD LUCK, WREN.' },
    ],
  },
  {
    id: 'dlg_hale_bushes',
    caller: 'hale',
    lines: [
      { speaker: 'hale', text: "YOU'RE ON THE BEACH. GUARDS AHEAD." },
      {
        speaker: 'hale',
        text: 'MOVE WITH THE ARROWS, WASD / ZQSD, OR THE STICK ON A TOUCH SCREEN.',
      },
      {
        speaker: 'hale',
        text: "STAND INSIDE A BUSH AND THEY CAN'T SEE YOU. REACH THE EAST SIDE OF THE BEACH.",
      },
    ],
  },
  {
    id: 'dlg_bix_cones',
    caller: 'bix',
    lines: [
      { speaker: 'bix', text: "HEY ROOKIE! BIX HERE, I'M YOUR GEAR GUY." },
      { speaker: 'bix', text: "SEE THAT YELLOW CONE? THAT'S WHAT A GUARD CAN SEE." },
      { speaker: 'bix', text: "WALLS AND CRATES BLOCK IT. BUSHES DON'T, BUT THEY HIDE YOU." },
      {
        speaker: 'bix',
        text: 'IF THE CONE FLASHES, MOVE! YOU HAVE A SPLIT SECOND BEFORE HE SOUNDS THE ALARM.',
      },
    ],
  },
  {
    id: 'dlg_bix_box',
    caller: 'bix',
    lines: [
      { speaker: 'bix', text: "A CARDBOARD BOX! THE INFILTRATOR'S BEST FRIEND." },
      {
        speaker: 'bix',
        text: 'PRESS 1 (OR B) TO EQUIP IT. STAND STILL AND GUARDS WILL WALK RIGHT PAST YOU.',
      },
      { speaker: 'bix', text: 'MOVE INSIDE IT AND... WELL, A WALKING BOX LOOKS SUSPICIOUS.' },
    ],
  },
  {
    id: 'dlg_kestrel_tag',
    caller: 'hale',
    lines: [
      { speaker: 'wren', text: "A DOG TAG... IT SAYS 'KESTREL'." },
      {
        speaker: 'hale',
        text: 'SO HE MADE IT THIS FAR. KEEP MOVING, WREN. HE MAY STILL BE ALIVE.',
      },
    ],
  },
  {
    id: 'dlg_hale_takedown',
    caller: 'hale',
    lines: [
      {
        speaker: 'hale',
        text: 'THIS IS THE OUTER YARD. THE DOOR TO BUILDING A IS ON THE NORTH WALL.',
      },
      {
        speaker: 'hale',
        text: "IT'S LOCKED. YOU NEED A LEVEL 1 KEY CARD. ONE OF THE GUARDS CARRIES IT.",
      },
      {
        speaker: 'hale',
        text: 'GET BEHIND HIM AND PRESS SPACE (OR A) TO TAKE HIM DOWN. HE WILL DROP THE CARD.',
      },
      { speaker: 'hale', text: 'AND WATCH THE METAL GRATING. GUARDS WILL HEAR YOUR STEPS ON IT.' },
    ],
  },
  {
    id: 'dlg_bix_card',
    caller: 'bix',
    lines: [
      {
        speaker: 'bix',
        text: 'A LEVEL 1 CARD! PRESS 1 (OR B) TO EQUIP IT, THEN WALK INTO THE DOOR.',
      },
    ],
  },
  {
    id: 'dlg_lark_first',
    caller: 'lark',
    lines: [
      { speaker: 'lark', text: '...I SEE YOU, AGENT.' },
      { speaker: 'wren', text: 'WHO IS THIS? HOW DID YOU GET THIS FREQUENCY?' },
      { speaker: 'lark', text: "A FRIEND. THAT'S ALL YOU NEED TO KNOW FOR NOW." },
      {
        speaker: 'lark',
        text: 'TRUST YOUR EYES IN THERE. NOT EVERY VOICE ON THE RADIO. LARK OUT.',
      },
    ],
  },
  {
    id: 'dlg_hale_first_alert',
    caller: 'hale',
    lines: [
      { speaker: 'hale', text: 'THAT WAS CLOSE, WREN.' },
      {
        speaker: 'hale',
        text: "WHEN YOU'RE SPOTTED, BREAK THEIR LINE OF SIGHT. HIDE AND WAIT IT OUT.",
      },
      { speaker: 'hale', text: "WHEN EVASION ENDS, THEY'LL GO BACK TO THEIR ROUTES." },
    ],
  },
  {
    id: 'dlg_call_hale_0-1',
    caller: 'hale',
    lines: [
      {
        speaker: 'hale',
        text: 'WATCH THE GUARDS PATROL BEFORE YOU MOVE. WAIT IN THE BUSHES UNTIL THEY TURN AWAY.',
      },
    ],
  },
  {
    id: 'dlg_call_hale_0-2',
    caller: 'hale',
    lines: [
      {
        speaker: 'hale',
        text: 'THE FENCE HAS ONE GAP IN THE MIDDLE. THE GUARD ON THE EAST SIDE IS ARMED. TIME IT WELL.',
      },
    ],
  },
  {
    id: 'dlg_call_hale_0-3',
    caller: 'hale',
    lines: [
      {
        speaker: 'hale',
        text: 'THE CARD CARRIER PATROLS THE MIDDLE OF THE YARD. WHEN HE STOPS, HE LOOKS EAST. COME FROM THE WEST.',
      },
    ],
  },
  {
    id: 'dlg_call_hale',
    caller: 'hale',
    lines: [{ speaker: 'hale', text: 'STAY HIDDEN, WREN. THE MISSION COMES FIRST.' }],
  },
  {
    id: 'dlg_call_bix',
    caller: 'bix',
    lines: [
      { speaker: 'bix', text: 'QUICK REMINDER: 1 OR B CHANGES ITEM, 2 OR W CHANGES WEAPON.' },
      {
        speaker: 'bix',
        text: 'SPACE OR A IS YOUR ACTION: PUNCH, TAKEDOWN FROM BEHIND, OPEN DOORS.',
      },
    ],
  },
  {
    id: 'dlg_call_sato',
    caller: 'sato',
    lines: [{ speaker: 'sato', text: 'DR. SATO HERE. DO YOU WANT ME TO RECORD YOUR PROGRESS?' }],
    choice: { options: ['YES', 'NO'], action: 'save' },
  },
  {
    id: 'dlg_sato_saved',
    caller: 'sato',
    lines: [{ speaker: 'sato', text: 'PROGRESS RECORDED. TAKE CARE OF YOURSELF OUT THERE.' }],
  },
  {
    id: 'dlg_sato_memory',
    caller: 'sato',
    lines: [
      {
        speaker: 'sato',
        text: "I CAN'T REACH THE ARCHIVE. YOUR PROGRESS IS KEPT FOR THIS SESSION ONLY.",
      },
    ],
  },
  {
    id: 'dlg_sato_later',
    caller: 'sato',
    lines: [{ speaker: 'sato', text: 'UNDERSTOOD. CALL ME ANYTIME.' }],
  },
  {
    id: 'dlg_call_lark',
    caller: 'lark',
    lines: [{ speaker: 'lark', text: '...' }],
  },
];

/** Who answers a manual codec call, and with what. */
export const CODEC_CALLS = {
  hale: {
    default: 'dlg_call_hale',
    byRoom: { '0-1': 'dlg_call_hale_0-1', '0-2': 'dlg_call_hale_0-2', '0-3': 'dlg_call_hale_0-3' },
  },
  bix: { default: 'dlg_call_bix', byRoom: {} },
  sato: { default: 'dlg_call_sato', byRoom: {} },
  lark: { default: 'dlg_call_lark', byRoom: {} },
};
