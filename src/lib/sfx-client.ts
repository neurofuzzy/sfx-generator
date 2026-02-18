import { SoundParams } from "@/types/audio";
import { audioEngine } from "./audio-engine";

/**
 * SFX Client: A portable library for playing procedural sound effects.
 * 
 * This class is designed to be self-contained. To use this in a separate project,
 * you only need this file, audio-engine.ts, and types/audio.ts.
 */
export class SfxClient {
  private library: Map<string, SoundParams> = new Map();

  constructor(initialLibrary?: SoundParams[]) {
    if (initialLibrary) {
      this.loadLibrary(JSON.stringify(initialLibrary));
    }
  }

  /**
   * Loads a JSON library of sound effects.
   * @param json A JSON string or object containing an array of SoundParams.
   */
  loadLibrary(data: string | SoundParams[]) {
    try {
      const sounds = typeof data === 'string' ? JSON.parse(data) : data;
      const soundArray = Array.isArray(sounds) ? sounds : [sounds];
      
      soundArray.forEach((sound: SoundParams) => {
        if (sound.name) {
          this.library.set(sound.name, sound);
        }
      });
      console.log(`SFX Client: ${this.library.size} sounds registered.`);
    } catch (e) {
      console.error("SFX Client: Failed to load library", e);
    }
  }

  /**
   * Plays a sound from the library with optional runtime overrides.
   * @param key The name of the sound to play.
   * @param volume Local volume multiplier (0.0 to 1.0).
   * @param lowpassFreq Cutoff frequency override in Hz (useful for distance/muffling).
   * @param pitchMultiplier Pitch multiplier (e.g. 2.0 for an octave up).
   */
  async playSound(key: string, volume: number = 1.0, lowpassFreq?: number, pitchMultiplier: number = 1.0) {
    const params = this.library.get(key);
    if (!params) {
      console.warn(`SFX Client: Sound "${key}" not found.`);
      return;
    }

    // Initialize the engine on the first play call (browser requirement for user gesture)
    await audioEngine.init();

    // Create a runtime variation for this specific trigger
    const activeParams: SoundParams = {
      ...params,
      filterCutoff: lowpassFreq !== undefined ? lowpassFreq : params.filterCutoff,
      baseFrequency: params.baseFrequency * pitchMultiplier,
    };

    // Trigger playback through the synthesis engine
    audioEngine.play(activeParams, 0, undefined, volume);
  }

  /**
   * Plays a sound generated on-the-fly from an entropy seed.
   * @param seed The numerical seed for the randomizer.
   * @param volume Local volume multiplier.
   * @param lowpassFreq Cutoff frequency override.
   * @param pitchMultiplier Pitch multiplier.
   */
  async playSeed(seed: number, volume: number = 1.0, lowpassFreq?: number, pitchMultiplier: number = 1.0) {
    await audioEngine.init();
    
    const params = audioEngine.generateParamsFromSeed(seed);
    const activeParams: SoundParams = {
      ...params,
      filterCutoff: lowpassFreq !== undefined ? lowpassFreq : params.filterCutoff,
      baseFrequency: params.baseFrequency * pitchMultiplier,
    };

    audioEngine.play(activeParams, 0, undefined, volume);
  }

  /**
   * Clears all registered sounds.
   */
  clearLibrary() {
    this.library.clear();
  }

  /**
   * Returns an array of all available sound keys.
   */
  getKeys(): string[] {
    return Array.from(this.library.keys());
  }

  /**
   * Stops all active audio nodes immediately.
   */
  stopAll() {
    audioEngine.stopAll();
  }
}

// Export a singleton instance for standard use cases
export const sfx = new SfxClient();
