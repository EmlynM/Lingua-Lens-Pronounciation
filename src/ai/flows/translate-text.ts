// src/ai/flows/translate-text.ts
'use server';
/**
 * @fileOverview A translation AI agent.
 *
 * - translateText - A function that handles the translation process.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  targetLanguage: z.string().describe('The target language for the translation.'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translation: z.string().describe('The translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const simpleTranslateTool = ai.defineTool(
  {
    name: 'simpleTranslateTool',
    description: 'A simple translation tool.',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    const {text} = await ai.generate({
      prompt: `Translate the following text into ${input.targetLanguage}: ${input.text}`,
      model: 'googleai/gemini-2.0-flash',
    });
    return {translation: text};
  },
);

const translateTextPrompt = ai.definePrompt({
  name: 'translateTextPrompt',
  tools: [simpleTranslateTool],
  output: {schema: TranslateTextOutputSchema},
  prompt: `You are an expert multilingual translator. Translate the following text into {{{targetLanguage}}}.
  
Text to translate:
"{{{text}}}"`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    const {output} = await translateTextPrompt(input);
    return output!;
  },
);
