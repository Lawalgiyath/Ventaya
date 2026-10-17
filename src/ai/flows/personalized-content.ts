
'use server';
/**
 * @fileOverview Provides personalized content suggestions based on user assessment and preferences.
 *
 * - personalizedContentSuggestions - A function that suggests articles, meditations, and exercises.
 * - PersonalizedContentInput - The input type for the personalizedContentSuggestions function.
 * - PersonalizedContentOutput - The return type for the personalizedContentSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedContentInputSchema = z.object({
  assessmentResults: z
    .string()
    .describe('The results from the mental health assessment.'),
  preferences: z.string().describe('The user preferences for content.'),
});
export type PersonalizedContentInput = z.infer<typeof PersonalizedContentInputSchema>;

const PersonalizedContentOutputSchema = z.object({
  articles: z.array(z.string()).describe('A list of 3-4 suggested wellness article titles.'),
  meditations: z.array(z.object({
    title: z.string().describe('The title of a guided meditation (e.g., "5-Minute Breathing Meditation for Anxiety").'),
    youtubeSearchQuery: z.string().describe('An optimized YouTube search query to find a high-quality video for this meditation (e.g., "5 minute guided breathing meditation for anxiety").'),
  })).describe('A list of 3-4 suggested guided meditations.'),
  exercises: z.array(z.object({
    title: z.string().describe('The name of a wellness or cognitive exercise (e.g., "The 5-4-3-2-1 Grounding Technique").'),
    googleSearchQuery: z.string().describe('An optimized Google search query to find a helpful article or video explaining this exercise (e.g., "how to do 54321 grounding technique for anxiety").'),
  })).describe('A list of 3-4 suggested wellness exercises.'),
});
export type PersonalizedContentOutput = z.infer<typeof PersonalizedContentOutputSchema>;

export async function personalizedContentSuggestions(
  input: PersonalizedContentInput
): Promise<PersonalizedContentOutput> {
  return personalizedContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedContentPrompt',
  input: {schema: PersonalizedContentInputSchema},
  output: {schema: PersonalizedContentOutputSchema},
  prompt: `You are an AI wellness coach for the "Ventaya" app. Your task is to suggest relevant, actionable content based on a user's assessment and goals.

**User's Assessment Insights:**
"{{{assessmentResults}}}"

**User's Stated Goals/Preferences:**
"{{{preferences}}}"

**Your Task:**
Based on the provided context, generate a list of 3-4 suggestions for EACH of the following categories: articles, meditations, and exercises.

For **meditations**, provide a clear title and an optimized YouTube search query that would lead to a high-quality guided meditation video.
For **exercises**, provide a clear title and an optimized Google search query that would lead to a high-quality article or video explaining the technique.

Return the response in the specified structured format.`,
});

const personalizedContentFlow = ai.defineFlow(
  {
    name: 'personalizedContentFlow',
    inputSchema: PersonalizedContentInputSchema,
    outputSchema: PersonalizedContentOutputSchema,
  },
  async (input) => {
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const {output} = await prompt(input);
        return output!;
      } catch (error) {
        console.error('Error in personalizedContentFlow, retrying...', error);
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
