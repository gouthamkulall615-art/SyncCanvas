import { generateDiagram } from "./generateDiagram.js";
import { createGeminiLlm } from "./geminiWrapper.js";

const PROMPTS = [
  "design WhatsApp",
  "design Uber",
  "design a rate limiter",
  "design YouTube video transcoding pipeline",
  "design a distributed cache",
  "design Twitter news feed",
  "design an e-commerce checkout and payment service",
  "design a web crawler",
  "design Dropbox file sync",
  "design a real-time collaborative whiteboard",
];

async function runPhase1ValidationTest() {
  console.log("=================================================");
  console.log("       PHASE 1 DIAGRAM GENERATION TEST (10 PROMPTS)");
  console.log("=================================================\n");

  const llm = createGeminiLlm();
  let passedCount = 0;
  const results = [];

  for (let i = 0; i < PROMPTS.length; i++) {
    const prompt = PROMPTS[i];
    console.log(`[${i + 1}/${PROMPTS.length}] Testing prompt: "${prompt}"...`);
    const startTime = Date.now();

    try {
      const res = await generateDiagram(llm, prompt);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

      if (res.ok) {
        passedCount++;
        const { title, nodes, edges, bottlenecks } = res.diagram;
        console.log(`   ✓ PASSED (${elapsed}s) -> "${title}" (${nodes.length} nodes, ${edges.length} edges, ${bottlenecks.length} bottlenecks)`);
        results.push({ prompt, status: "PASS", elapsed: `${elapsed}s`, nodes: nodes.length, edges: edges.length });
      } else {
        console.log(`   ✗ FAILED (${elapsed}s) -> ${res.error}`);
        results.push({ prompt, status: "FAIL", elapsed: `${elapsed}s`, error: res.error });
      }
    } catch (err) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`   ✗ EXCEPTION (${elapsed}s) -> ${err.message}`);
      results.push({ prompt, status: "ERROR", elapsed: `${elapsed}s`, error: err.message });
    }

    // Small delay between calls to be gentle on rate limits
    if (i < PROMPTS.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log("\n=================================================");
  console.log(`SUMMARY: ${passedCount} / ${PROMPTS.length} passed validation (${(passedCount / PROMPTS.length) * 100}%)`);
  console.log("=================================================");

  if (passedCount >= 9) {
    console.log("🎉 SUCCESS: Phase 1 validation target achieved (>= 9/10)!");
  } else {
    console.log("⚠️ Target not yet reached (< 9/10). Review errors above.");
  }
}

runPhase1ValidationTest();
