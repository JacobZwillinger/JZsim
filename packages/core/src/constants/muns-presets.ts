/**
 * Munitions preset levels for base inventory loading.
 * Semi-realistic stockpile amounts per weapon type.
 */
export const MUNS_PRESETS: Record<'STANDARD' | 'HIGH' | 'LOW', Record<string, number>> = {
  STANDARD: {
    'AIM-120': 100,
    'AIM-9': 80,
    'SA-10': 20,
    'SA-2': 16,
  },
  HIGH: {
    'AIM-120': 300,
    'AIM-9': 200,
    'SA-10': 60,
    'SA-2': 40,
  },
  LOW: {
    'AIM-120': 30,
    'AIM-9': 20,
    'SA-10': 8,
    'SA-2': 6,
  },
};

export type MunsLevel = keyof typeof MUNS_PRESETS;
