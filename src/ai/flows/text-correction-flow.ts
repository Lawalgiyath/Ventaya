
'use server';
/**
 * @fileOverview An AI agent for correcting and clarifying transcribed text.
 *
 * - correctText - A function that takes a raw text input and returns a corrected version.
 * - TextCorrectionInput - The input type for the correctText function.
 * - TextCorrectionOutput - The return type for the correctText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TextCorrectionInputSchema = z.object({
  rawText: z
    .string()
    .describe('The raw, potentially messy text transcribed from user speech.'),
});
export type TextCorrectionInput = z.infer<typeof TextCorrectionInputSchema>;

const TextCorrectionOutputSchema = z.object({
  correctedText: z.string().describe('The corrected, cleaned-up version of the text. It should be well-formed, grammatically correct, and make logical sense.'),
});
export type TextCorrectionOutput = z.infer<typeof TextCorrectionOutputSchema>;

export async function correctText(input: TextCorrectionInput): Promise<TextCorrectionOutput> {
  return textCorrectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'textCorrectionPrompt',
  input: {schema: TextCorrectionInputSchema},
  output: {schema: TextCorrectionOutputSchema},
  prompt: `You are an expert at processing raw speech-to-text transcriptions. Your task is to correct and refine the given text.

The user has spoken into their microphone, and the transcription might have errors, lack punctuation, or be grammatically awkward. Please perform the following actions:
1.  **Fix Grammatical Errors:** Correct any spelling mistakes and grammatical issues.
2.  **Add Punctuation:** Insert appropriate punctuation like commas, periods, and capitalization to make the text readable.
3.  **Clarify Meaning:** If the sentence structure is confusing, rephrase it to be clear and concise while preserving the original intent. The output should sound natural, as if a person typed it.
4.  **Do not add new information.** Only work with the text provided.

Raw Text:
"{{{rawText}}}"

Provide your corrected version in the specified output format.`,
});

const textCorrectionFlow = ai.defineFlow(
  {
    name: 'textCorrectionFlow',
    inputSchema: TextCorrectionInputSchema,
    outputSchema: TextCorrectionOutputSchema,
  },
  async (input) => {
    // If the input is very short, it's likely a test or mistake, so don't bother the AI.
    if (input.rawText.trim().length < 5) {
        return { correctedText: input.rawText };
    }

    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const {output} = await prompt(input);
        return output!;
      } catch (error) {
        console.error('Error in textCorrectionFlow, retrying...', error);
        if (i === maxRetries - 1) {
          throw error; // Re-throw the error on the last attempt
        }
        // Wait for a short period before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    // This part should not be reachable if the loop is correct, but for type safety:
    throw new Error('Flow failed after multiple retries.');
  }
);
