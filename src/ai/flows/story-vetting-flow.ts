
'use server';
/**
 * @fileOverview An AI agent for vetting user-submitted success stories.
 *
 * - vetStory - A function that checks if a story is appropriate for the community.
 * - StoryVettingInput - The input type for the vetStory function.
 * - StoryVettingOutput - The return type for the vetStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StoryVettingInputSchema = z.object({
  story: z
    .string()
    .describe('The user-submitted success story to be vetted.'),
});
export type StoryVettingInput = z.infer<typeof StoryVettingInputSchema>;

const StoryVettingOutputSchema = z.object({
  isApproved: z.boolean().describe('Whether the story is approved for publication.'),
  reason: z.string().optional().describe('The reason for rejection if the story is not approved. This should be constructive and polite.'),
});
export type StoryVettingOutput = z.infer<typeof StoryVettingOutputSchema>;

export async function vetStory(input: StoryVettingInput): Promise<StoryVettingOutput> {
  return storyVettingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'storyVettingPrompt',
  input: {schema: StoryVettingInputSchema},
  output: {schema: StoryVettingOutputSchema},
  prompt: `You are a compassionate and careful community moderator for "Ventaya," a mental wellness app. Your task is to review a user-submitted success story.

The story should be approved if it meets the following criteria:
1.  **Positive and Inspiring:** It should have a generally positive or hopeful tone.
2.  **Relevant:** It should be related to mental health, wellness, personal growth, or the use of the Ventaya app.
3.  **Safe:** It must NOT contain any harmful content, offensive language, personally identifiable information (like full names or contact info), or medical advice.

Review the following story and decide if it's approved. If you reject it, provide a brief, gentle, and constructive reason. For example, "This is a powerful story, but please remove any personal contact information before sharing." or "Thank you for sharing. To keep our community focused on personal journeys, please avoid giving specific medical advice."

User's Story:
"{{{story}}}"

Provide your decision in the specified output format.`,
});

const storyVettingFlow = ai.defineFlow(
  {
    name: 'storyVettingFlow',
    inputSchema: StoryVettingInputSchema,
    outputSchema: StoryVettingOutputSchema,
  },
  async (input) => {
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const {output} = await prompt(input);
        return output!;
      } catch (error) {
        console.error('Error in storyVettingFlow, retrying...', error);
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
