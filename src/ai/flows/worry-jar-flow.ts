
'use server';
/**
 * @fileOverview Provides a calming response to a user's worry.
 *
 * - reframeWorry - A function that takes a user's worry and returns a reframed perspective.
 * - ReframeWorryInput - The input type for the reframeWorry function.
 * - ReframeWorryOutput - The return type for the reframeWorry function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReframeWorryInputSchema = z.object({
  worry: z
    .string()
    .describe('A worry or anxious thought submitted by the user.'),
});
export type ReframeWorryInput = z.infer<typeof ReframeWorryInputSchema>;

const ReframeWorryOutputSchema = z.object({
  reframedThought: z.string().describe('A multi-sentence, reassuring, and constructive reframing of the user\'s worry. It should validate their feeling, offer a perspective shift, and suggest a micro-action.'),
});
export type ReframeWorryOutput = z.infer<typeof ReframeWorryOutputSchema>;

export async function reframeWorry(
  input: ReframeWorryInput
): Promise<ReframeWorryOutput> {
  return worryJarFlow(input);
}

const prompt = ai.definePrompt({
  name: 'worryJarPrompt',
  input: {schema: ReframeWorryInputSchema},
  output: {schema: ReframeWorryOutputSchema},
  prompt: `You are an empathetic AI companion trained in Cognitive Behavioral Therapy (CBT) and Acceptance and Commitment Therapy (ACT). A user has shared a worry. Your task is to provide a reassuring and constructive response in 3-4 sentences.

Your response MUST follow this structure:
1.  **Validate the feeling:** Start by acknowledging the difficulty of the emotion (e.g., "That sounds incredibly stressful," or "It's understandable to feel anxious about that.").
2.  **Offer a gentle perspective shift:** Reframe the thought without invalidating it. Focus on what the user can control or view differently (e.g., "Instead of seeing it as a potential failure, could we see it as an opportunity to learn?" or "While the future is uncertain, what is one thing that is true and in your control right now?").
3.  **Suggest a concrete micro-action:** Propose one small, immediate, and manageable action the user can take to ground themselves or regain a sense of agency (e.g., "Try taking three slow, deep breaths, focusing only on the air moving in and out." or "Can you write down one small part of this that you *can* influence?").

User's worry: "{{{worry}}}"

Provide your response in the specified output format.`,
});

const worryJarFlow = ai.defineFlow(
  {
    name: 'worryJarFlow',
    inputSchema: ReframeWorryInputSchema,
    outputSchema: ReframeWorryOutputSchema,
  },
  async (input) => {
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const {output} = await prompt(input);
        return output!;
      } catch (error) {
        console.error('Error in worryJarFlow, retrying...', error);
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
