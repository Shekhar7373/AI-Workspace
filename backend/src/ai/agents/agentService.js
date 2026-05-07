import { groq, assertGroqKey } from "../../config/groq.js";
import { env } from "../../config/env.js";
import { agentSystemPrompt } from "../prompts/systemPrompts.js";
import { createMemory } from "../../services/memoryService.js";

const agentProfiles = {
  study: "Study Agent: plans learning sessions, revision, weak-topic recovery, and exam preparation.",
  reminder: "Reminder Agent: converts goals into reminders and task follow-ups.",
  notes: "Notes Summarizer: extracts summaries, definitions, and revision cards from notes.",
  coding: "Coding Tutor: explains code, debugging, DSA, and project architecture.",
  research: "Research Agent: breaks questions into research steps and synthesizes findings."
};

export async function runAgent({ userId, agent = "study", objective, context = "" }) {
  assertGroqKey();
  const profile = agentProfiles[agent] || agentProfiles.study;
  const response = await groq.chat.completions.create({
    model: env.groqChatModel,
    messages: [
      { role: "system", content: `${agentSystemPrompt}\n${profile}` },
      { role: "user", content: JSON.stringify({ objective, context }) }
    ]
  });

  const output = response.choices[0].message.content || "";
  await createMemory({
    userId,
    type: "conversation",
    content: `Agent ${agent} worked on: ${objective}`,
    source: "agent"
  }).catch(() => {});
  return { agent, output };
}
