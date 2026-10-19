'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CrisisChatInputSchema = z.object({
  caseId: z.string(),
  userMessage: z.string(),
  incidentType: z.string().optional(),
  urgency: z.string().optional(),
  stateName: z.string().optional(),
  isRecent: z.boolean().optional(),
  history: z
    .array(
      z.object({
        sender: z.enum(['reporter', 'support', 'system']),
        content: z.string(),
      })
    )
    .optional(),
});

export type CrisisChatInput = z.infer<typeof CrisisChatInputSchema>;

export async function generateCrisisChatReply(input: CrisisChatInput): Promise<string> {
  // If GEMINI_API_KEY is missing, return a thoughtful fallback
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENAI_API_KEY) {
    return (
      "I hear you, and your courage in sharing this matters deeply. Your message is safely documented under Case ID " +
      input.caseId +
      ". If you need immediate physical protection or medical care within 72 hours (PEP / contraception), please contact the 24/7 National Emergency line on 112 or NAPTIP on 0800 200 2020. You are not alone."
    );
  }

  try {
    const historyText = (input.history || [])
      .slice(-6)
      .map((h) => `${h.sender === 'reporter' ? 'Survivor' : 'Care AI'}: ${h.content}`)
      .join('\n');

    const promptText = `You are the Ventaya Care Assistant, a trauma-informed crisis companion for an anonymous sexual and gender-based violence (SGBV) reporting platform in Nigeria.

CONVERSATION CONTEXT:
Case ID: ${input.caseId}
Incident Type: ${input.incidentType || 'Not specified'}
Reported Urgency: ${input.urgency || 'standard'}
State: ${input.stateName || 'Nigeria'}
Recent Incident (within 72 hours): ${input.isRecent ? 'YES' : 'NO or unknown'}

RECENT CONVERSATION HISTORY:
${historyText || 'No prior messages.'}

CURRENT MESSAGE FROM SURVIVOR:
"${input.userMessage}"

CRITICAL RULES:
1. Always validate their experience and feelings. Never doubt, interrogate, or minimize what happened.
2. If this is a recent sexual assault (within 72 hours), kindly remind them that Post-Exposure Prophylaxis (PEP) to prevent HIV and emergency contraception are free and most effective within 72 hours at accredited Nigerian SARCs (like Mirabel Centre in Lagos, Tamar in Enugu, Maya in Kano, or Bwari in Abuja).
3. If they are in active physical danger right now, advise them to call 112 or NAPTIP on 0800 200 2020 or reach a safe public space immediately.
4. Assure them that this conversation is private, anonymous, and encrypted under their Case ID.
5. Keep your tone gentle, calm, and grounded. Use 2 to 3 concise paragraphs.
6. Do NOT use emojis anywhere in your response.
7. Do NOT use em-dashes anywhere in your response. Use hyphens, commas, or periods instead.
8. Do not make legal promises or prescribe specific drug dosages; refer them to medical professionals at verified SARCs.`;

    const { text } = await ai.generate({
      model: 'googleai/gemini-3.8-flash',
      prompt: promptText,
    });

    if (!text || !text.trim()) {
      return (
        "Thank you for sharing this. Your words are securely attached to Case ID " +
        input.caseId +
        ". If you require immediate emergency or forensic medical care, remember you can call 112 or NAPTIP toll-free on 0800 200 2020 at any time."
      );
    }

    // Clean up any accidental em-dashes
    return text.replace(/—/g, '-').trim();
  } catch (error) {
    console.error('[Ventaya Care AI] Crisis reply generation failed:', error);
    return (
      "I am listening, and you are not alone. Everything you record here is securely encrypted under Case ID " +
      input.caseId +
      ". If you are in immediate danger or need medical attention within 72 hours, please reach out to Nigeria Emergency on 112 or call NAPTIP toll-free on 0800 200 2020."
    );
  }
}
