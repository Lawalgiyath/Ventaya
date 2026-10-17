
'use server';
/**
 * @fileOverview A daily planner and meal-planning AI agent.
 *
 * - planDay - A function that handles the daily planning and meal generation process.
 * - DailyPlannerInput - The input type for the planDay function.
 * - DailyPlannerOutput - The return type for the planDay function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DailyPlannerInputSchema = z.object({
  activities: z
    .string()
    .describe('A description of tasks, appointments, and activities the user has for the day.'),
  mealTarget: z
    .string()
    .describe('The user\'s goal for their meals (e.g., "weight loss", "muscle gain", "balanced diet").'),
  dietaryRestrictions: z.string().optional().describe('Any dietary restrictions or preferences the user has (e.g., "vegetarian", "gluten-free").'),
});
export type DailyPlannerInput = z.infer<typeof DailyPlannerInputSchema>;

const DailyPlannerOutputSchema = z.object({
  dailyPlan: z.array(z.object({
      time: z.string().describe("The suggested time for the activity (e.g., '09:00 AM')."),
      activity: z.string().describe("The description of the task or activity."),
      isMeal: z.boolean().describe("Whether this activity is a meal."),
  })).describe("A structured schedule for the user's day, including breaks and wellness activities."),
  mealPlan: z.object({
      breakfast: z.string().describe("A healthy breakfast suggestion."),
      lunch: z.string().describe("A healthy lunch suggestion."),
      dinner: z.string().describe("A healthy dinner suggestion."),
  }).describe("A meal plan tailored to the user's targets and restrictions."),
});
export type DailyPlannerOutput = z.infer<typeof DailyPlannerOutputSchema>;

export async function planDay(input: DailyPlannerInput): Promise<DailyPlannerOutput> {
  return dailyPlannerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dailyPlannerPrompt',
  input: {schema: DailyPlannerInputSchema},
  output: {schema: DailyPlannerOutputSchema},
  prompt: `You are an expert AI coach specializing in productivity and nutrition. Your task is to create a structured daily schedule and a suitable meal plan based on the user's input.

**User's Activities for the day:**
"{{{activities}}}"

**User's Meal Target:**
"{{{mealTarget}}}"

**User's Dietary Restrictions:**
"{{#if dietaryRestrictions}}{{{dietaryRestrictions}}}{{else}}None{{/if}}"

**Your Task:**
1.  **Create a Daily Plan:**
    *   Analyze the user's activities and organize them into a logical, timed schedule.
    *   Intelligently schedule breaks, including time for meals.
    *   Incorporate at least one short wellness activity (e.g., "5-minute mindfulness break," "10-minute walk").
    *   For each item in the schedule, specify the time, a description of the activity, and whether it is a meal.

2.  **Create a Meal Plan:**
    *   Based on the user's meal target and dietary restrictions, suggest simple, healthy ideas for breakfast, lunch, and dinner.
    *   The meal suggestions should be concise and easy to understand.

Provide the response in the structured output format.`,
});

const dailyPlannerFlow = ai.defineFlow(
  {
    name: 'dailyPlannerFlow',
    inputSchema: DailyPlannerInputSchema,
    outputSchema: DailyPlannerOutputSchema,
  },
  async (input) => {
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const {output} = await prompt(input);
        return output!;
      } catch (error) {
        console.error('Error in dailyPlannerFlow, retrying...', error);
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
