/**
 * Music in a small tracker format: per channel a wave, a volume and a
 * pattern of `NOTE:len` tokens (len in 16th notes), `r` rests and drum
 * letters (k kick, s snare, h hat, H open hat). `( ... )*N` repeats.
 */
export const TRACKS = [
  {
    id: 'trk_title',
    name: 'NIGHTFALL',
    bpm: 76,
    loop: true,
    channels: [
      {
        wave: 'square25',
        vol: 0.12,
        pattern: '(A2:2 r:2)*4 (F2:2 r:2)*4 (G2:2 r:2)*4 (E2:2 r:2)*4',
      },
      {
        wave: 'scc_lead',
        vol: 0.09,
        gate: 0.95,
        pattern:
          'E4:6 D4:2 C4:4 B3:4 A3:8 r:8 C4:6 D4:2 E4:4 G4:4 E4:12 r:4 ' +
          'A4:6 G4:2 E4:4 D4:4 C4:8 r:8 B3:6 C4:2 D4:4 E4:4 A3:12 r:4',
      },
      { wave: 'square12', vol: 0.035, gate: 1, pattern: 'A3:16 F3:16 G3:16 E3:16' },
      { wave: 'square50', vol: 0.03, pattern: '(h:8)*8' },
    ],
  },
  {
    id: 'trk_infiltration',
    name: 'SHADOW STEP',
    bpm: 92,
    loop: true,
    channels: [
      {
        wave: 'square25',
        vol: 0.13,
        gate: 0.7,
        pattern:
          '(D2:2 r:1 D2:1 A2:2 r:2 C3:2 r:1 D2:1 r:2 A2:2)*3 (C2:2 r:1 C2:1 G2:2 r:2 A#2:2 r:1 C2:1 r:2 G2:2)*1',
      },
      {
        wave: 'square12',
        vol: 0.07,
        gate: 0.8,
        pattern:
          'r:16 A4:3 r:1 G4:2 r:2 F4:4 r:4 r:16 D5:2 r:2 C5:2 r:2 B4:6 r:2 ' +
          'r:16 A4:2 B4:2 C5:4 r:8 r:8 A4:2 r:2 E4:8 r:12',
      },
      { wave: 'scc_soft', vol: 0.045, gate: 1, pattern: 'D3:32 C3:32 A#2:32 C3:32' },
      { wave: 'square50', vol: 0.025, pattern: '(h:4 r:4 h:2 r:2 h:4)*8' },
    ],
  },
  {
    id: 'trk_alert',
    name: 'RED LINE',
    bpm: 160,
    loop: true,
    channels: [
      {
        wave: 'square25',
        vol: 0.06,
        gate: 0.6,
        pattern: '(E4 G4 B4 E5)*2 (D4 F#4 A4 D5)*2 (C4 E4 G4 C5)*2 (B3 D#4 F#4 B4)*2',
      },
      {
        wave: 'square50',
        vol: 0.11,
        gate: 0.7,
        pattern: '(E2:2 E3:2)*4 (D2:2 D3:2)*4 (C2:2 C3:2)*4 (B1:2 B2:2)*4',
      },
      {
        wave: 'square12',
        vol: 0.08,
        pattern:
          'B4:4 B4:2 C5:2 B4:4 A4:4 G4:6 F#4:2 E4:4 r:4 ' +
          'A4:4 A4:2 B4:2 A4:4 G4:4 F#4:4 G4:4 D#4:8',
      },
      { wave: 'square50', vol: 0.1, pattern: '(k:2 h:2 s:2 h:2)*8' },
    ],
  },
  {
    id: 'trk_evasion',
    name: 'HOLDING BREATH',
    bpm: 96,
    loop: true,
    channels: [
      { wave: 'square50', vol: 0.09, pattern: '(k:1 r:1 k:1 r:13)*4' },
      {
        wave: 'square12',
        vol: 0.045,
        gate: 0.6,
        pattern:
          '(E4:2 B4:2 G4:2 B4:2)*2 (D4:2 A4:2 F#4:2 A4:2)*2 (C4:2 G4:2 E4:2 G4:2)*2 (B3:2 F#4:2 D#4:2 F#4:2)*2',
      },
      { wave: 'square25', vol: 0.08, gate: 0.95, pattern: 'E2:16 D2:16 C2:16 B1:16' },
    ],
  },
  {
    id: 'trk_codec',
    name: 'CODEC',
    bpm: 70,
    loop: true,
    channels: [
      { wave: 'scc_soft', vol: 0.04, gate: 1, pattern: 'C4:16 A3:16 F3:16 G3:16' },
      {
        wave: 'square12',
        vol: 0.025,
        gate: 0.5,
        pattern:
          '(C5:2 E5:2 G5:2 E5:2)*2 (A4:2 C5:2 E5:2 C5:2)*2 (F4:2 A4:2 C5:2 A4:2)*2 (G4:2 B4:2 D5:2 B4:2)*2',
      },
    ],
  },
  {
    id: 'trk_gameover',
    name: 'GAME OVER',
    bpm: 100,
    loop: false,
    channels: [
      { wave: 'square50', vol: 0.12, pattern: 'A4:2 G4:2 F4:2 E4:2 D4:4 C#4:4 D4:16' },
      { wave: 'square25', vol: 0.1, pattern: 'D3:8 A2:8 D2:16' },
      { wave: 'square50', vol: 0.08, pattern: 's:2 r:14 k:16' },
    ],
  },
  {
    id: 'trk_victory',
    name: 'MISSION STEP',
    bpm: 132,
    loop: false,
    channels: [
      { wave: 'square25', vol: 0.11, pattern: 'C5:2 E5:2 G5:2 C6:6 A5:2 B5:2 C6:16' },
      { wave: 'square50', vol: 0.1, pattern: 'C3:4 G2:4 C3:8 F2:4 G2:4 C3:8' },
      { wave: 'square50', vol: 0.08, pattern: '(k:2 h:2)*4 s:2 s:2 s:4 k:8' },
    ],
  },
];
