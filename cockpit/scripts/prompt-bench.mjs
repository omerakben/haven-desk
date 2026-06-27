// Baseline-vs-engineered on real Gemma. For each flow it runs the OLD terse
// system prompt and the NEW engineered prompt (role + rules + house rules +
// output contract + two few-shot turns) on a FRESH input the model has not seen
// as an example, and prints both so a human can judge the lift.
//
// Dev-only (needs Ollama up); not part of CI. Run: node scripts/prompt-bench.mjs
// It mirrors the shipped catalog (src/lib/prompts/*) by hand — a smoke tool, not
// the source of truth; the unit tests pin the catalog.

const BASE = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL ?? "gemma4:e4b";

const HOUSE_RULES = [
  "Use only the details the user gave you. Never invent names, numbers, dates, prices, or facts.",
  "If something needed is missing, write the rest and leave a clearly marked blank like [their name] rather than guessing.",
  "Write in plain, everyday language. Do not act as a lawyer, doctor, or accountant; if asked for that, suggest checking a professional.",
];

function systemFromSpec(spec) {
  const rules = [...spec.rules, ...HOUSE_RULES];
  return [
    `## Role\n${spec.role}`,
    `## Rules\n${rules.map((r) => `- ${r}`).join("\n")}`,
    `## Output\n${spec.outputContract}`,
  ].join("\n\n");
}

function engineeredMessages(spec, user) {
  const msgs = [{ role: "system", content: systemFromSpec(spec) }];
  for (const ex of spec.examples) {
    msgs.push({ role: "user", content: ex.input });
    msgs.push({ role: "assistant", content: ex.output });
  }
  msgs.push({ role: "user", content: user });
  return msgs;
}

async function run(messages, temperature) {
  const res = await fetch(`${BASE}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, temperature, stream: false }),
  });
  const j = await res.json();
  return (j.choices?.[0]?.message?.content ?? "(no output)").trim();
}

const FLOWS = [
  {
    name: "summarize",
    temperature: 0.3,
    baselineSystem: "You summarize text clearly for a busy reader.",
    spec: {
      role: "You summarize text clearly for a busy reader who wants the gist fast.",
      rules: [
        "First write 3–5 plain sentences capturing the substance — not a description of the text ('this email is about…'), the actual content.",
        "Then a blank line, then the key points as short bullets starting with '- '.",
        "Keep every bullet to one line; no filler, no repetition of the prose summary.",
      ],
      outputContract: "Return the sentence summary, a blank line, then the bullets. Nothing else.",
      examples: [
        {
          input:
            "Summarize this in 3 to 5 sentences, then list the key points as bullets:\n\nResearchers found that short, frequent breaks during focused work improved retention more than one long break. The effect was strongest for complex material and weakest for routine tasks. They recommend a five-minute pause roughly every half hour, away from screens.",
          output:
            "Short, frequent breaks during focused work improved retention more than a single long break. The benefit was largest for complex material and smallest for routine tasks. The researchers recommend a roughly five-minute pause every half hour, away from screens.\n\n- Frequent short breaks beat one long break for retention\n- Strongest effect on complex work, weakest on routine tasks\n- Suggested: ~5 minutes off every 30 minutes, screen-free",
        },
      ],
    },
    fresh:
      "Summarize this in 3 to 5 sentences, then list the key points as bullets:\n\nHey everyone, quick update: the Saturday farmers-market booth is confirmed for next weekend, 8am to 1pm. We still need two more volunteers for setup at 7am. Maria is bringing the cash float and the signage. Please bring your own aprons. If it rains we'll move under the pavilion by the entrance. Reply with your availability by Wednesday so I can finalize the rota.",
  },
  {
    name: "reply-to-review",
    temperature: 0.4,
    baselineSystem:
      "You write short, professional, genuine replies to customer reviews for a small business. Stay gracious even with negative reviews; never be defensive or make excuses. Return only the reply.",
    spec: {
      role: "You write a short, genuine reply to a customer review on behalf of a small business owner.",
      rules: [
        "Stay gracious — even on a negative review. Never be defensive, never make excuses, never argue.",
        "Thank the customer; if there's a problem, acknowledge it plainly and say how you'll make it right (only using any note the user gave).",
        "Keep it brief — 2–4 sentences.",
      ],
      outputContract: "Return only the reply — no preamble, no surrounding quotes.",
      examples: [
        {
          input:
            "Write a reply to this customer review:\n\"\"\"\nWaited 40 minutes for a table even with a reservation. The food was good but the wait was frustrating.\n\"\"\"\nAlso keep in mind: apologize and offer a free dessert on their next visit.\nKeep it warm, professional, and brief.",
          output:
            "Thank you for the kind words about the food, and I'm sorry about the wait — a reservation should mean a table is ready, and we fell short there. We'd love to make it up to you: dessert is on us on your next visit.",
        },
      ],
    },
    fresh:
      "Write a reply to this customer review:\n\"\"\"\nThe haircut was great but the salon was running 30 minutes behind and nobody told me until I asked. Felt a bit ignored in the waiting area.\n\"\"\"\nAlso keep in mind: apologize and say we're adding a text-ahead heads-up for delays.\nKeep it warm, professional, and brief.",
  },
  {
    name: "plan-week",
    temperature: 0.3,
    baselineSystem: "You help people turn a list of things into a simple, realistic weekly plan.",
    spec: {
      role: "You turn a list of everything on someone's plate into a simple, realistic weekly plan.",
      rules: [
        "Group items under exactly three headings: 'Must do', 'Should do', 'Can wait'. Anything with a hard date or deadline goes in 'Must do'.",
        "Under each heading, list the items as short bullets starting with '- '. Don't invent tasks that weren't given.",
        "End with one short 'Sensible order' paragraph suggesting a realistic sequence around the fixed dates.",
      ],
      outputContract: "Return the three headed groups, then the 'Sensible order' paragraph. Keep it short.",
      examples: [
        {
          input:
            "Here's what's on my plate this week:\nfinish the proposal, dentist on Tuesday, kids' recital Thursday, taxes due Friday, hit the gym, call mom, grocery shop, fix the leaky tap\n\nMake a simple plan: group it into Must do, Should do, and Can wait, and suggest a sensible order. Keep it short.",
          output:
            "Must do\n- Finish the proposal\n- Dentist (Tuesday)\n- Kids' recital (Thursday)\n- Taxes (due Friday)\n\nShould do\n- Grocery shop\n- Fix the leaky tap\n- Call mom\n\nCan wait\n- Hit the gym\n\nSensible order: get the proposal done early in the week, work errands and the tap around Tuesday's dentist, and leave Thursday evening for the recital. Do the taxes Thursday night or Friday morning so they're not last-minute.",
        },
      ],
    },
    fresh:
      "Here's what's on my plate this week:\nrestock the cooler, inspection on Wednesday morning, payroll due Friday, fix the broken shelf, order more bags, call the linen supplier, deep-clean the storeroom, update the menu board\n\nMake a simple plan: group it into Must do, Should do, and Can wait, and suggest a sensible order. Keep it short.",
  },
];

for (const f of FLOWS) {
  const baseline = await run(
    [
      { role: "system", content: f.baselineSystem },
      { role: "user", content: f.fresh },
    ],
    f.temperature,
  );
  const engineered = await run(engineeredMessages(f.spec, f.fresh), f.temperature);
  console.log(`\n================ ${f.name} ================`);
  console.log(`\n----- BASELINE (terse system) -----\n${baseline}`);
  console.log(`\n----- ENGINEERED (spec + few-shot) -----\n${engineered}`);
}
