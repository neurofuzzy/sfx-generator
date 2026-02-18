'use server';
/**
 * @fileOverview A Genkit flow for generating sound effect parameters from a text description.
 *
 * - generateSoundEffectFromDescription - A function that generates sound parameters based on a text description.
 * - isAiConfigured - A function to check if the necessary API key is present.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Checks if the Google AI API key is configured in the environment.
 */
export async function isAiConfigured(): Promise<boolean> {
  return !!process.env.GOOGLE_GENAI_API_KEY;
}

const GenerateSoundEffectFromDescriptionInputSchema = z
  .string()
  .describe('A text description of the desired sound effect, e.g., "metallic tube ring" or "crunchy laser burst".');
export type GenerateSoundEffectFromDescriptionInput = z.infer<typeof GenerateSoundEffectFromDescriptionInputSchema>;

const GenerateSoundEffectFromDescriptionOutputSchema = z.object({
  attack: z.number().min(0).max(1),
  decay: z.number().min(0).max(2),
  envelopeShape: z.enum(['piano', 'strings', 'percussive', 'reverse']),
  baseFrequency: z.number().min(20).max(20000),
  frequencyDrift: z.number().min(-24).max(24).describe('Pitch slide in semitones over the duration of the note. Use negative for downward slides like "pew" or positive for rising sounds.'),
  harmony: z.number().min(0).max(1),
  quantize: z.number().min(0).max(48),
  timbre: z.string(),
  waveformPairs: z.array(z.enum(['sine', 'square', 'sawtooth', 'triangle'])).min(1).max(2),
  noiseAmount: z.number().min(0).max(1),
  noiseType: z.enum(['white', 'pink', 'brown', 'velvet']),
  noiseModulation: z.number().min(0).max(1),
  lfoAmount: z.number().min(0).max(1).describe('Amount of volume modulation (tremolo/pulsing).'),
  lfoRate: z.number().min(0.1).max(20).describe('Rate of volume modulation (tremolo).'),
  filterCutoff: z.number().min(0).max(10000),
  filterResonance: z.number().min(0).max(20),
  combAmount: z.number().min(0).max(0.95),
  combDelay: z.number().min(0.0001).max(0.05),
  vibratoDepth: z.number().min(0).max(1),
  vibratoRate: z.number().min(0).max(20),
  reverbAmount: z.number().min(0).max(1),
  echoAmount: z.number().min(0).max(1),
  echoDelay: z.number().min(0).max(0.5),
  sequenceSteps: z.number().min(1).max(4).describe('Number of notes in the progression (1 for single hit, 2-4 for melodies).'),
  sequenceOffsets: z.array(z.number().min(-12).max(12)).length(4).describe('Pitch offsets in semitones for each step.'),
  sequenceBpm: z.number().min(60).max(1200).describe('Tempo of the pitch sequence.'),
});
export type GenerateSoundEffectFromDescriptionOutput = z.infer<typeof GenerateSoundEffectFromDescriptionOutputSchema>;

const generateSoundEffectPrompt = ai.definePrompt({
  name: 'generateSoundEffectPrompt',
  input: {schema: GenerateSoundEffectFromDescriptionInputSchema},
  output: {schema: GenerateSoundEffectFromDescriptionOutputSchema},
  prompt: `You are an expert sound designer. Interpret the description and generate synthesis parameters.

Description: {{{this}}}

Guidelines:
- "frequencyDrift": Use negative values (e.g., -12 to -24) for lasers, blasters, and "pew" sounds. Use positive values for "rising" or "swelling" pitch.
- "sequenceSteps": Use 2-4 for sounds like "coin pickup" (ca-ching), "level up" (arpeggio), or "failed" (downward notes). Use 1 for single hits.
- "lfoAmount" & "lfoRate": Use for "pulsating," "tremolo," "shimmering," or rhythmic volume pulses.
- "envelopeShape": 
    - "piano": Standard decay.
    - "strings": Slow, fading.
    - "percussive": Snappy, explosive.
    - "reverse": Swelling/rising.
- Use "combAmount" and "combDelay" for metallic textures.
- Use "quantize" for retro/chiptune effects.`,
});

const generateSoundEffectFromDescriptionFlow = ai.defineFlow(
  {
    name: 'generateSoundEffectFromDescriptionFlow',
    inputSchema: GenerateSoundEffectFromDescriptionInputSchema,
    outputSchema: GenerateSoundEffectFromDescriptionOutputSchema,
  },
  async input => {
    const {output} = await generateSoundEffectPrompt(input);
    return output!;
  }
);

export async function generateSoundEffectFromDescription(
  input: GenerateSoundEffectFromDescriptionInput
): Promise<GenerateSoundEffectFromDescriptionOutput> {
  return generateSoundEffectFromDescriptionFlow(input);
}
