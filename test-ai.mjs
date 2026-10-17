/**
 * Quick AI test — runs the triage flow directly with a test case.
 * Run with: node --env-file=.env test-ai.mjs
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load the Genkit + GoogleAI plugin directly
const { genkit } = await import('genkit');
const { googleAI } = await import('@genkit-ai/googleai');

const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error('❌  GEMINI_API_KEY is not set in .env');
  process.exit(1);
}

console.log('✅  GEMINI_API_KEY loaded:', key.slice(0, 12) + '...');
console.log('🔄  Initialising Genkit with GoogleAI plugin...');

const ai = genkit({ plugins: [googleAI()] });

console.log('🔄  Sending test prompt to Gemini...\n');

const start = Date.now();

try {
  const { text } = await ai.generate({
    model: 'googleai/gemini-3.8-flash',
    prompt: `You are a trauma-informed crisis triage specialist for an SGBV reporting platform in Nigeria.

A reporter submitted this:
- Incident type: rape
- Recent (within 72h): true
- State: Lagos (NG-LA)
- Narrative: "I was attacked last night by someone I know. I am scared and don't know what to do."

Respond with a JSON object:
{
  "urgency": "immediate" | "urgent" | "standard",
  "triageSummary": "2-3 sentence compassionate message to the reporter",
  "consistencyScore": 0-100,
  "keyNeeds": ["string", ...],
  "safetyRisk": true | false
}`,
    output: {
      format: 'json',
    },
  });

  const elapsed = Date.now() - start;
  console.log(`✅  Gemini responded in ${elapsed}ms\n`);
  console.log('📋  Raw response:');
  console.log(text);

  const parsed = JSON.parse(text ?? '{}');
  console.log('\n📊  Parsed result:');
  console.log('  urgency:         ', parsed.urgency);
  console.log('  safetyRisk:      ', parsed.safetyRisk);
  console.log('  consistencyScore:', parsed.consistencyScore);
  console.log('  keyNeeds:        ', parsed.keyNeeds?.join(', '));
  console.log('  triageSummary:   ', parsed.triageSummary);

  if (parsed.urgency && parsed.triageSummary && Array.isArray(parsed.keyNeeds)) {
    console.log('\n✅  AI triage is WORKING correctly.');
  } else {
    console.log('\n⚠️  Response parsed but some fields are missing. Check the output above.');
  }
} catch (err) {
  const elapsed = Date.now() - start;
  console.error(`\n❌  AI call failed after ${elapsed}ms:`);
  console.error(err?.message ?? err);

  if (err?.message?.includes('API_KEY_INVALID') || err?.message?.includes('401')) {
    console.error('\n🔑  The GEMINI_API_KEY appears to be invalid or revoked.');
    console.error('   Generate a new one at: https://aistudio.google.com/apikey');
  } else if (err?.message?.includes('PERMISSION_DENIED')) {
    console.error('\n🔑  Permission denied. The key may not have Gemini API enabled.');
  } else if (err?.message?.includes('QUOTA_EXCEEDED') || err?.message?.includes('429')) {
    console.error('\n⏱️  Rate limit or quota exceeded. Try again in a moment.');
  }
  process.exit(1);
}
