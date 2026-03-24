// src/lib/audio.js
// A lightweight Web Audio API synthesizer for Discord-like UI sounds

let audioCtx = null;

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume context if it was suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Utility to create a basic beep
function playTone(freq, type, duration, vol, delay = 0) {
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

  // Envelope
  gain.gain.setValueAtTime(0, ctx.currentTime + delay);
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

export function playMessageSound() {
  // A soft "bloop" (high sine wave dropping slightly)
  playTone(600, 'sine', 0.2, 0.1, 0);
  playTone(800, 'sine', 0.3, 0.1, 0.1);
}

export function playJoinSound() {
  // An ascending joyful marimba/sine chord
  playTone(440, 'sine', 0.3, 0.1, 0); // A4
  playTone(554.37, 'sine', 0.3, 0.1, 0.1); // C#5
  playTone(659.25, 'sine', 0.4, 0.1, 0.2); // E5
}

export function playLeaveSound() {
  // A descending chord
  playTone(659.25, 'sine', 0.3, 0.1, 0); // E5
  playTone(554.37, 'sine', 0.3, 0.1, 0.1); // C#5
  playTone(440, 'sine', 0.4, 0.1, 0.2); // A4
}

export function playMuteSound() {
  // Short low click
  playTone(300, 'triangle', 0.1, 0.05, 0);
  playTone(250, 'triangle', 0.1, 0.05, 0.05);
}

export function playUnmuteSound() {
  // Short high click
  playTone(300, 'triangle', 0.1, 0.05, 0);
  playTone(400, 'triangle', 0.1, 0.05, 0.05);
}

export function playDeafenSound() {
  playTone(200, 'square', 0.15, 0.03, 0);
  playTone(150, 'square', 0.2, 0.03, 0.08);
}

export function playUndeafenSound() {
  playTone(200, 'square', 0.15, 0.03, 0);
  playTone(300, 'square', 0.2, 0.03, 0.08);
}
