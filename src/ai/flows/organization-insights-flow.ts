
'use server';
/**
 * @fileOverview An AI agent for generating insights about an organization's wellness.
 *
 * - generateOrganizationInsights - A function that analyzes aggregated member data.
 * - OrganizationInsightsInput - The input type for the function.
 * - OrganizationInsightsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OrganizationInsightsInputSchema = z.object({
  memberCount: z.number().describe('The total number of members in the organization.'),
  anonymizedMemberData: z.array(z.object({
      moods: z.array(z.object({
          mood: z.string(),
          date: z.string(),
      })).describe("A list of mood entries for a single, anonymous member."),
  })).describe('An array of anonymized data for each member. Each object represents one member.'),
});
export type OrganizationInsightsInput = z.infer<typeof OrganizationInsightsInputSchema>;

const OrganizationInsightsOutputSchema = z.object({
  overallMood: z.string().describe('A single-word summary of the dominant mood in the organization (e.g., "Positive", "Neutral", "Stressed").'),
  keyTheme: z.string().describe('The most significant positive or negative theme observed from the data (e.g., "High Engagement", "Signs of Burnout").'),
  engagementLevel: z.string().describe('A qualitative assessment of member engagement with the app (e.g., "High", "Moderate", "Low").'),
  recommendations: z.array(z.object({
      title: z.string().describe("A short, catchy title for the recommendation."),
      description: z.string().describe("A 1-2 sentence description of a specific, actionable recommendation for the organization leader to improve team wellness."),
  })).describe('A list of 2-3 actionable recommendations.'),
});
export type OrganizationInsightsOutput = z.infer<typeof OrganizationInsightsOutputSchema>;

export async function generateOrganizationInsights(input: OrganizationInsightsInput): Promise<OrganizationInsightsOutput> {
  return organizationInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'organizationInsightsPrompt',
  input: {schema: OrganizationInsightsInputSchema},
  output: {schema: OrganizationInsightsOutputSchema},
  prompt: `You are an expert organizational psychologist and data analyst for the "Ventaya" wellness app. Your task is to analyze aggregated, anonymized wellness data from an organization and provide high-level, actionable insights to the organization's leader.

**ABSOLUTELY DO NOT** refer to any individual users. All insights must be aggregated and anonymized. Focus on trends and general observations.

**Input Data:**
- **Total Members:** {{{memberCount}}}
- **Anonymized Data Snapshot:** (This is a sample of the structure, you will receive the full data)
  \`\`\`json
  [
    { "moods": [{ "mood": "Happy", "date": "..." }, { "mood": "Okay", "date": "..." }] },
    { "moods": [{ "mood": "Anxious", "date": "..." }] },
    ...
  ]
  \`\`\`

**Your Task:**
Based on the provided data, generate the following insights in the specified output format:

1.  **Overall Mood:** Analyze the mood distribution and determine the dominant emotional state of the organization. Summarize this in a single word (e.g., "Positive", "Neutral", "Stressed", "Mixed").
2.  **Key Theme:** Identify the single most important trend or pattern. This could be positive (e.g., "Consistent Goal Progress") or a potential area for improvement (e.g., "Weekend Stress Peaks").
3.  **Engagement Level:** Based on the frequency and consistency of data points (like mood logging), assess the overall app engagement as "High," "Moderate," or "Low."
4.  **Recommendations:** Provide 2-3 concrete, actionable recommendations for the organization's leader. These should be supportive and aimed at improving overall wellness. For example, if you see high anxiety, you might suggest a workshop on stress management. If you see low engagement, suggest a campaign to encourage daily mood logging.

Now, analyze the provided data and generate the report.
`,
});

const organizationInsightsFlow = ai.defineFlow(
  {
    name: 'organizationInsightsFlow',
    inputSchema: OrganizationInsightsInputSchema,
    outputSchema: OrganizationInsightsOutputSchema,
  },
  async (input) => {
    // Basic validation
    if (input.memberCount === 0 || input.anonymizedMemberData.length === 0) {
        return {
            overallMood: "No Data",
            keyTheme: "No Data",
            engagementLevel: "None",
            recommendations: [{
                title: "Invite Your Team",
                description: "Start by inviting your team members to the app to begin gathering wellness insights."
            }]
        }
    }

    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const {output} = await prompt(input);
        return output!;
      } catch (error) {
        console.error('Error in organizationInsightsFlow, retrying...', error);
        if (i === maxRetries - 1) {
          throw error; // Re-throw the error on the last attempt
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw new Error('Flow failed after multiple retries.');
  }
);
