'use server';
/**
 * @fileOverview A Genkit flow for generating sound effect parameters from a text description.
 *
 * - generateSoundEffectFromDescription - A function that generates sound parameters based on a text description.
 * - GenerateSoundEffectFromDescriptionInput - The input type for the generateSoundEffectFromDescription function.
 * - GenerateSoundEffectFromDescriptionOutput - The return type for the generateSoundEffectFromDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSoundEffectFromDescriptionInputSchema = z
  .string()
  .describe('A text description of the desired sound effect, e.g., "space gun laser" or "forest ambiance".');
export type GenerateSoundEffectFromDescriptionInput = z.infer<typeof GenerateSoundEffectFromDescriptionInputSchema>;

const GenerateSoundEffectFromDescriptionOutputSchema = z.object({
  attack: z
    .number()
    .min(0)
    .max(1)
    .describe('The attack time of the sound in seconds (0 to 1). A lower value means a faster attack.'),
  decay: z
    .number()
    .min(0)
    .max(1)
    .describe('The decay time of the sound in seconds (0 to 1). A lower value means a faster decay.'),
  baseFrequency: z
    .number()
    .min(20)
    .max(20000)
    .describe('The fundamental frequency of the sound in Hz (20 to 20000).'),
  harmony: z
    .number()
    .min(0)
    .max(1)
    .describe('A value representing the harmonic complexity or richness of the sound (0 to 1). 0 for simple, 1 for rich harmonics.'),
  timbre: z
    .string()
    .describe('A descriptive string of the sound\'s tonal quality (e.g., "bright", "mellow", "harsh", "metallic", "airy").'),
  waveformPairs: z
    .array(z.enum(['sine', 'square', 'sawtooth', 'triangle', 'noise']))
    .min(1)
    .max(2)
    .describe('An array containing one or two waveform types to blend. Valid types are "sine", "square", "sawtooth", "triangle", "noise".'),
  vibratoDepth: z
    .number()
    .min(0)
    .max(1)
    .describe('The depth of the vibrato effect (0 to 1). 0 for no vibrato, 1 for maximum depth.'),
  vibratoRate: z
    .number()
    .min(0)
    .max(20)
    .describe('The rate of the vibrato effect in Hz (0 to 20). 0 for no vibrato.'),
  reverbAmount: z
    .number()
    .min(0)
    .max(1)
    .describe('The amount of reverb applied to the sound (0 to 1). 0 for no reverb, 1 for maximum reverb.'),
  echoAmount: z
    .number()
    .min(0)
    .max(1)
    .describe('The amount of echo applied to the sound (0 to 1). 0 for no echo, 1 for maximum echo.'),
  echoDelay: z
    .number()
    .min(0.01)
    .max(2)
    .describe('The delay time of the echo effect in seconds (0.01 to 2).'),
});
export type GenerateSoundEffectFromDescriptionOutput = z.infer<typeof GenerateSoundEffectFromDescriptionOutputSchema>;

const generateSoundEffectPrompt = ai.definePrompt({
  name: 'generateSoundEffectPrompt',
  input: {schema: GenerateSoundEffectFromDescriptionInputSchema},
  output: {schema: GenerateSoundEffectFromDescriptionOutputSchema},
  prompt: `You are an expert sound designer AI. Your task is to interpret a text description of a sound effect and generate a set of sound parameters that would create that effect.

Here is the description of the desired sound effect: {{{this}}}

Carefully consider the description and generate the appropriate values for attack, decay, base frequency, harmony, timbre, waveform pairs, vibrato depth and rate, reverb amount, echo amount, and echo delay.

- Attack: How quickly the sound reaches its peak volume. (0 to 1 seconds)
- Decay: How quickly the sound fades out after the attack. (0 to 1 seconds)
- Base Frequency: The fundamental pitch of the sound. (20 to 20000 Hz)
- Harmony: The richness or complexity of the overtones. (0 to 1, where 0 is simple and 1 is rich)
- Timbre: A descriptive string of the sound's tonal quality.
- Waveform Pairs: One or two primary waveforms that make up the sound. Choose from: "sine", "square", "sawtooth", "triangle", "noise".
- Vibrato Depth: The intensity of the pitch modulation. (0 to 1)
- Vibrato Rate: How fast the pitch modulates. (0 to 20 Hz)
- Reverb Amount: The intensity of the spatial reverb effect. (0 to 1)
- Echo Amount: The intensity of the echo effect. (0 to 1)
- Echo Delay: The time between echoes. (0.01 to 2 seconds)

Provide the output in a JSON object strictly conforming to the output schema.`,
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
