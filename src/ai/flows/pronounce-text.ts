'use server';

/**
 * @fileOverview Defines a Genkit flow for providing the pronunciation of a given text.
 *
 * - pronounceText - A function that handles the process of getting the pronunciation of a text.
 * - PronounceTextInput - The input type for the pronounceText function.
 * - PronounceTextOutput - The return type for the pronounceText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PronounceTextInputSchema = z.object({
  text: z.string().describe('The text to get the pronunciation of.'),
  language: z.string().describe('The language of the text for more accurate pronunciation (e.g., "Spanish", "Japanese").'),
});
export type PronounceTextInput = z.infer<typeof PronounceTextInputSchema>;

const PronounceTextOutputSchema = z.object({
  pronunciation: z.string().describe('The phonetic pronunciation of the text, using the International Phonetic Alphabet (IPA) if possible.'),
});
export type PronounceTextOutput = z.infer<typeof PronounceTextOutputSchema>;

export async function pronounceText(input: PronounceTextInput): Promise<PronounceTextOutput> {
  return pronounceTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'pronounceTextPrompt',
  input: {schema: PronounceTextInputSchema},
  output: {schema: PronounceTextOutputSchema},
  prompt: `You are a linguistic expert. Provide the phonetic pronunciation for the following text, which is in {{language}}. Use the International Phonetic Alphabet (IPA) if appropriate for the language.

Text: "{{{text}}}"`,
});

const pronounceTextFlow = ai.defineFlow(
  {
    name: 'pronounceTextFlow',
    inputSchema: PronounceTextInputSchema,
    outputSchema: PronounceTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
