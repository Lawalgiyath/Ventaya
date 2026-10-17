
'use server';

/**
 * @fileOverview AI-powered mental health assessment flow.
 *
 * This flow takes user's answers to a series of open-ended questions and provides personalized insights and
 * recommendations for mental health resources.
 *
 * @exports mentalHealthAssessment - The main function to trigger the mental health assessment flow.
 * @exports MentalHealthAssessmentInput - The input type for the mentalHealthAssessment function.
 * @exports MentalHealthAssessmentOutput - The output type for the mentalHealthAssessment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MentalHealthAssessmentInputSchema = z.object({
  answers: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ).describe('List of answers to mental health assessment questions'),
});

export type MentalHealthAssessmentInput = z.infer<typeof MentalHealthAssessmentInputSchema>;

const MentalHealthAssessmentOutputSchema = z.object({
  insights: z.string().describe('A comprehensive summary of the user\'s potential emotional state, key themes, and areas of concern based on their answers. This should be empathetic and non-clinical.'),
  recommendations: z.string().describe('A list of 3-5 actionable, personalized recommendations for the user. These can include specific types of exercises, journaling prompts, or areas to focus on for goal-setting.'),
});

export type MentalHealthAssessmentOutput = z.infer<typeof MentalHealthAssessmentOutputSchema>;

export async function mentalHealthAssessment(input: MentalHealthAssessmentInput): Promise<MentalHealthAssessmentOutput> {
  return mentalHealthAssessmentFlow(input);
}

const mentalHealthAssessmentPrompt = ai.definePrompt({
  name: 'mentalHealthAssessmentPrompt',
  input: {schema: MentalHealthAssessmentInputSchema},
  output: {schema: MentalHealthAssessmentOutputSchema},
  prompt: `You are an AI mental health assistant. Your role is to provide supportive and insightful feedback based on a user's self-assessment. DO NOT PROVIDE A DIAGNOSIS or use clinical terms. Your tone should be encouraging and empathetic.

Analyze the user's answers to the following questions.

{{#each answers}}
Question: {{{question}}}
Answer: {{{answer}}}
---
{{/each}}

Based on their answers, provide:
1.  **Insights:** A holistic summary of their feelings and reported experiences. Identify key themes (e.g., stress at work, feelings of isolation, low energy).
2.  **Recommendations:** A few gentle, actionable next steps. Suggest things like mindfulness exercises, types of goals they could set, or topics they might want to explore in articles or meditations. Keep it simple and encouraging.`,
});

const mentalHealthAssessmentFlow = ai.defineFlow(
  {
    name: 'mentalHealthAssessmentFlow',
    inputSchema: MentalHealthAssessmentInputSchema,
    outputSchema: MentalHealthAssessmentOutputSchema,
  },
  async (input) => {
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const {output} = await mentalHealthAssessmentPrompt(input);
        return output!;
      } catch (error) {
        console.error('Error in mentalHealthAssessmentFlow, retrying...', error);
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
