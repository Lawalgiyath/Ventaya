
'use server';
/**
 * @fileOverview An AI agent for generating wellness articles.
 *
 * - generateArticle - A function that creates an article based on a title.
 * - GenerateArticleInput - The input type for the generateArticle function.
 * - GenerateArticleOutput - The return type for the generateArticle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateArticleInputSchema = z.object({
  title: z
    .string()
    .describe('The title of the wellness article to be generated.'),
});
export type GenerateArticleInput = z.infer<typeof GenerateArticleInputSchema>;

const GenerateArticleOutputSchema = z.object({
  articleContent: z.string().describe('The full content of the generated article, formatted in a readable, blog-style format. Use headings, paragraphs, and lists where appropriate.'),
});
export type GenerateArticleOutput = z.infer<typeof GenerateArticleOutputSchema>;

export async function generateArticle(input: GenerateArticleInput): Promise<GenerateArticleOutput> {
  return articleGenerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'articleGenerationPrompt',
  input: {schema: GenerateArticleInputSchema},
  output: {schema: GenerateArticleOutputSchema},
  prompt: `You are an expert wellness writer for the "Ventaya" app. Your task is to write a helpful, structured, and engaging article based on the provided title.

The article should be:
- **Empathetic and Supportive:** Use a kind and encouraging tone.
- **Well-Structured:** Include an introduction, a main body with 2-4 key points (using headings or bullet points), and a concluding summary.
- **Actionable:** Where appropriate, include simple, practical tips a user can apply.
- **Concise:** Keep the article to a reasonable length, around 400-600 words.

**Do not include a title in your response**, as the title is already known. Start directly with the article content.

**Article Title:**
"{{{title}}}"

Generate the article content now.`,
});

const articleGenerationFlow = ai.defineFlow(
  {
    name: 'articleGenerationFlow',
    inputSchema: GenerateArticleInputSchema,
    outputSchema: GenerateArticleOutputSchema,
  },
  async (input) => {
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const {output} = await prompt(input);
        return output!;
      } catch (error) {
        console.error('Error in articleGenerationFlow, retrying...', error);
        if (i === maxRetries - 1) {
          throw error; // Re-throw the error on the last attempt
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw new Error('Flow failed after multiple retries.');
  }
);
