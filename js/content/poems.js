import a from './poems1.js';
import b from './poems2.js';
import c from './poems3.js';
export const POEMS = [...a, ...b, ...c].map((p, i) => ({ ...p, id: i + 1 }));
