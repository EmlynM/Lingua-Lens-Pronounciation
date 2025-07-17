'use server';

/**
 * @fileOverview Defines a Genkit flow for providing the meaning of a given text.
 *
 * - defineMeaning - A function that handles the process of defining the meaning of a text.
 * - DefineMeaningInput - The input type for the defineMeaning function.
 * - DefineMeaningOutput - The return type for the defineMeaning function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DefineMeaningInputSchema = z.object({
  text: z.string().describe('The text to define the meaning of.'),
});
export type DefineMeaningInput = z.infer<typeof DefineMeaningInputSchema>;

const DefineMeaningOutputSchema = z.object({
  meaning: z.string().describe('The meaning of the text.'),
});
export type DefineMeaningOutput = z.infer<typeof DefineMeaningOutputSchema>;

export async function defineMeaning(input: DefineMeaningInput): Promise<DefineMeaningOutput> {
  return defineMeaningFlow(input);
}

const prompt = ai.definePrompt({
  name: 'defineMeaningPrompt',
  input: {schema: DefineMeaningInputSchema},
  output: {schema: DefineMeaningOutputSchema},
  prompt: `What is the meaning of the following text: {{{text}}}`,
});

const defineMeaningFlow = ai.defineFlow(
  {
    name: 'defineMeaningFlow',
    inputSchema: DefineMeaningInputSchema,
    outputSchema: DefineMeaningOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
