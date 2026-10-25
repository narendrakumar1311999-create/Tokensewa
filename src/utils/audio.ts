/**
 * Audio chime, Urgent Alarm, Vibration, and Voice Synthesizer for queue announcements
 */

let activeAlarmInterval: any = null;
let activeAudioCtx: AudioContext | null = null;

export function playChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;

    // First pleasant tone (E5 ~ 659 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second lower harmonious tone (C5 ~ 523 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, now + 0.2);
    gain2.gain.setValueAtTime(0.28, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.85);
  } catch (err) {
    console.warn('Audio chime could not play:', err);
  }
}

/**
 * Trigger physical mobile device vibration
 * "Logo ke bari aane par usko ak massage ya alarm tone ya vibration aane lage"
 */
export function triggerVibration() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      // Vibrate pattern: 500ms vibrate, 200ms pause, 500ms vibrate, 200ms pause, 800ms vibrate
      navigator.vibrate([500, 200, 500, 200, 800, 200, 1000]);
    } catch (e) {
      console.warn('Vibration not permitted or unsupported:', e);
    }
  }
}

/**
 * Play an urgent, repeating alarm tone when it's the customer's turn!
 */
export function playUrgentAlarm(repeatCount: number = 4) {
  stopUrgentAlarm();
  triggerVibration();

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    activeAudioCtx = new AudioContextClass();

    let count = 0;
    const playBeep = () => {
      if (!activeAudioCtx || count >= repeatCount) {
        stopUrgentAlarm();
        return;
      }
      count++;
      triggerVibration();

      const now = activeAudioCtx.currentTime;

      // High pitch wake-up alert tone (880 Hz -> A5 and 1174 Hz -> D6)
      const osc = activeAudioCtx.createOscillator();
      const gain = activeAudioCtx.createGain();
      osc.type = 'square'; // loud, distinct alarm tone
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1174.66, now + 0.15);
      osc.frequency.setValueAtTime(880, now + 0.3);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(gain);
      gain.connect(activeAudioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    };

    playBeep();
    activeAlarmInterval = setInterval(playBeep, 750);
  } catch (err) {
    console.warn('Urgent alarm could not play:', err);
  }
}

export function stopUrgentAlarm() {
  if (activeAlarmInterval) {
    clearInterval(activeAlarmInterval);
    activeAlarmInterval = null;
  }
  if (activeAudioCtx) {
    try {
      activeAudioCtx.close();
    } catch {}
    activeAudioCtx = null;
  }
}

export function announceToken(tokenDisplay: string, counterNumber: number = 1, name?: string) {
  playChime();

  if (!('speechSynthesis' in window)) return;

  setTimeout(() => {
    try {
      window.speechSynthesis.cancel();

      const tokenDigits = tokenDisplay.replace(/[^0-9]/g, '');
      const hindiText = `टोकन नंबर ${tokenDigits}, ${name ? name + ', ' : ''}कृपया काउंटर नंबर ${counterNumber} पर आएं।`;

      const utterance = new SpeechSynthesisUtterance(hindiText);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(
        (v) => v.lang.includes('hi') || v.lang.includes('HI') || v.name.toLowerCase().includes('hindi')
      );
      const inVoice = voices.find((v) => v.lang.includes('IN') || v.lang.includes('en-IN'));

      if (hindiVoice) {
        utterance.voice = hindiVoice;
        utterance.lang = 'hi-IN';
      } else if (inVoice) {
        utterance.voice = inVoice;
        utterance.text = `Token number ${tokenDigits}, please come to counter ${counterNumber}.`;
      } else {
        utterance.text = `Token number ${tokenDigits}, please come to counter ${counterNumber}.`;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis failed:', err);
    }
  }, 450);
}
