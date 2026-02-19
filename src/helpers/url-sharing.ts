import { SoundParams, defaultSoundParams } from "@/types/audio";

/**
 * Mapping of SoundParams keys to short URL parameter keys for compression.
 */
const keyMap: Record<string, keyof SoundParams> = {
  n: "name",
  at: "attack",
  de: "decay",
  es: "envelopeShape",
  bf: "baseFrequency",
  fd: "frequencyDrift",
  ha: "harmony",
  qu: "quantize",
  ti: "timbre",
  wf: "waveformPairs",
  di: "distortion",
  na: "noiseAmount",
  nt: "noiseType",
  nm: "noiseModulation",
  la: "lfoAmount",
  lr: "lfoRate",
  fc: "filterCutoff",
  fr: "filterResonance",
  ca: "combAmount",
  cd: "combDelay",
  vd: "vibratoDepth",
  vr: "vibratoRate",
  ra: "reverbAmount",
  ea: "echoAmount",
  ed: "echoDelay",
  so: "sequenceOffsets",
  ss: "sequenceSteps",
  sb: "sequenceBpm",
  pm: "playbackMode",
  lc: "loopCount",
};

const reverseKeyMap = Object.fromEntries(
  Object.entries(keyMap).map(([k, v]) => [v, k])
) as Record<keyof SoundParams, string>;

/**
 * Encodes sound parameters into a compressed URL search string.
 */
export function encodeSoundParams(params: SoundParams): string {
  const urlParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    const shortKey = reverseKeyMap[key as keyof SoundParams];
    if (!shortKey || value === undefined) return;

    if (Array.isArray(value)) {
      urlParams.set(shortKey, value.join(","));
    } else {
      urlParams.set(shortKey, String(value));
    }
  });

  return urlParams.toString();
}

/**
 * Decodes a URL search string back into sound parameters.
 */
export function decodeSoundParams(search: string): Partial<SoundParams> {
  const params = new URLSearchParams(search);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {};

  for (const [shortKey, value] of params.entries()) {
    const fullKey = keyMap[shortKey];
    if (!fullKey) continue;

    if (fullKey === "waveformPairs") {
      result[fullKey] = value.split(",");
    } else if (fullKey === "sequenceOffsets") {
      result[fullKey] = value.split(",").map(Number);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } else if (typeof (defaultSoundParams as any)[fullKey] === "number") {
      result[fullKey] = Number(value);
    } else {
      result[fullKey] = value;
    }
  }

  return result;
}