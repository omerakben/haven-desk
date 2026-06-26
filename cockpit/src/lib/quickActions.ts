// Quick Actions: pre-built, one-click AI for people who don't know how to prompt.
// Each action is a friendly title, a tiny plain-language form, and a written-for-you
// prompt. The whole point is to remove the blank-prompt-box friction: pick a thing,
// answer one or two questions, get something useful. Pure data + builders so the
// route and the UI share one source of truth and it stays unit-testable.

import type { ChatMessage } from "@/lib/ollama";

export type QuickActionCategory = "write" | "organize" | "plan" | "improve";

export type QuickInput = {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea";
  optional?: boolean;
};

export type QuickAction = {
  id: string;
  title: string;
  blurb: string;
  category: QuickActionCategory;
  icon: string; // lucide icon name, resolved in the UI
  inputs: QuickInput[];
  system: string;
  buildPrompt: (inputs: Record<string, string>) => string;
};

export const QUICK_ACTION_CATEGORIES: { id: QuickActionCategory; label: string }[] = [
  { id: "write", label: "Write something" },
  { id: "organize", label: "Organize & summarize" },
  { id: "plan", label: "Plan" },
  { id: "improve", label: "Improve my writing" },
];

// Values arrive from JSON, so a field can be a non-string (number, array). Treat
// anything that isn't a string as empty, so the gate and the prompt never throw.
const v = (inputs: Record<string, string>, name: string) => {
  const s = inputs[name];
  return typeof s === "string" ? s.trim() : "";
};

export const QUICK_ACTIONS: QuickAction[] = [
  // ── Write something ──────────────────────────────────────────────────────────
  {
    id: "reply-to-message",
    title: "Reply to a message",
    blurb: "Paste a message and say what you want to convey; get a polished reply.",
    category: "write",
    icon: "Reply",
    inputs: [
      { name: "message", label: "The message you received", type: "textarea", placeholder: "Paste it here…" },
      { name: "intent", label: "What do you want to say back?", type: "text", placeholder: "e.g. say yes, but ask to move it to Friday" },
    ],
    system: "You help people write clear, kind replies to messages. Return only the reply text, no preamble or commentary.",
    buildPrompt: (i) =>
      `Here is a message I received:\n"""\n${v(i, "message")}\n"""\n\nWrite a reply. What I want to say: ${v(i, "intent")}. Keep it natural and appropriately polite.`,
  },
  {
    id: "polite-message",
    title: "Write a polite message",
    blurb: "A clear, friendly message to a school, landlord, service, or anyone.",
    category: "write",
    icon: "Mail",
    inputs: [
      { name: "to", label: "Who is it to?", type: "text", placeholder: "e.g. my child's teacher" },
      { name: "about", label: "What is it about?", type: "textarea", placeholder: "Describe it in your own words…" },
    ],
    system: "You write short, polite, clear messages for everyday situations. Return only the message.",
    buildPrompt: (i) => `Write a polite message to ${v(i, "to")}. It is about: ${v(i, "about")}. Keep it brief and friendly.`,
  },
  {
    id: "thank-you-note",
    title: "Write a thank-you note",
    blurb: "A warm, genuine thank-you in seconds.",
    category: "write",
    icon: "Heart",
    inputs: [
      { name: "who", label: "Who are you thanking?", type: "text", placeholder: "e.g. Aunt Mary" },
      { name: "for", label: "What for?", type: "text", placeholder: "e.g. the birthday gift" },
    ],
    system: "You write warm, sincere, short thank-you notes. Return only the note.",
    buildPrompt: (i) => `Write a warm, genuine thank-you note to ${v(i, "who")} for ${v(i, "for")}. Keep it short and heartfelt.`,
  },
  // ── Organize & summarize ─────────────────────────────────────────────────────
  {
    id: "notes-to-list",
    title: "Turn notes into a to-do list",
    blurb: "Drop a messy brain-dump; get a clean checklist.",
    category: "organize",
    icon: "ListChecks",
    inputs: [{ name: "notes", label: "Your notes", type: "textarea", placeholder: "Paste or type anything…" }],
    system: "You turn messy notes into a clean to-do list.",
    buildPrompt: (i) =>
      `Turn these notes into a clear to-do list. One task per line, start each with a dash, make each one a real action, and keep only actual to-dos:\n\n${v(i, "notes")}`,
  },
  {
    id: "summarize",
    title: "Summarize this",
    blurb: "A short summary plus the key points.",
    category: "organize",
    icon: "FileText",
    inputs: [{ name: "text", label: "Paste the text", type: "textarea", placeholder: "An email, an article, a document…" }],
    system: "You summarize text clearly for a busy reader.",
    buildPrompt: (i) => `Summarize this in 3 to 5 sentences, then list the key points as bullets:\n\n${v(i, "text")}`,
  },
  {
    id: "key-points",
    title: "Pull out the key points",
    blurb: "Just the important bits, as bullets.",
    category: "organize",
    icon: "ListFilter",
    inputs: [{ name: "text", label: "Paste the text", type: "textarea", placeholder: "Paste anything long…" }],
    system: "You extract the most important points from text.",
    buildPrompt: (i) => `List the most important points from this as short bullets, with no filler:\n\n${v(i, "text")}`,
  },
  // ── Plan ─────────────────────────────────────────────────────────────────────
  {
    id: "plan-week",
    title: "Plan my week",
    blurb: "Turn what's on your plate into a simple plan.",
    category: "plan",
    icon: "CalendarDays",
    inputs: [{ name: "plate", label: "What's on your plate this week?", type: "textarea", placeholder: "List everything, in any order…" }],
    system: "You help people turn a list of things into a simple, realistic weekly plan.",
    buildPrompt: (i) =>
      `Here's what's on my plate this week:\n${v(i, "plate")}\n\nMake a simple plan: group it into Must do, Should do, and Can wait, and suggest a sensible order. Keep it short.`,
  },
  {
    id: "meal-plan",
    title: "Make a meal plan",
    blurb: "A simple few days of meals and a grocery list.",
    category: "plan",
    icon: "Utensils",
    inputs: [
      { name: "preferences", label: "Any preferences or restrictions?", type: "text", placeholder: "e.g. vegetarian, quick dinners, no nuts" },
      { name: "days", label: "How many days?", type: "text", placeholder: "e.g. 5", optional: true },
    ],
    system: "You make simple, practical meal plans with a grocery list.",
    buildPrompt: (i) =>
      `Make a simple meal plan${v(i, "days") ? ` for ${v(i, "days")} days` : " for the week"}. Preferences: ${v(i, "preferences") || "none"}. List one meal per day, then a short grocery list.`,
  },
  {
    id: "study-plan",
    title: "Make a study plan",
    blurb: "A plan to learn or revise something by a date.",
    category: "plan",
    icon: "GraduationCap",
    inputs: [
      { name: "topic", label: "What are you studying?", type: "text", placeholder: "e.g. the AWS exam" },
      { name: "deadline", label: "By when?", type: "text", placeholder: "e.g. in 3 weeks", optional: true },
    ],
    system: "You make focused, realistic study plans.",
    buildPrompt: (i) =>
      `Make a study plan for: ${v(i, "topic")}${v(i, "deadline") ? `, due ${v(i, "deadline")}` : ""}. Break it into sessions with what to do in each. Keep it realistic.`,
  },
  // ── Improve my writing ───────────────────────────────────────────────────────
  {
    id: "make-friendlier",
    title: "Make this friendlier",
    blurb: "Warm up a message without changing the meaning.",
    category: "improve",
    icon: "Smile",
    inputs: [{ name: "text", label: "Paste your text", type: "textarea", placeholder: "Paste the message…" }],
    system: "You rewrite text to sound warmer and friendlier without changing the meaning or length much. Return only the rewrite.",
    buildPrompt: (i) => `Rewrite this to be friendlier and warmer. Keep the meaning and roughly the length:\n\n${v(i, "text")}`,
  },
  {
    id: "make-professional",
    title: "Make this professional",
    blurb: "Polish a rough message for work.",
    category: "improve",
    icon: "Briefcase",
    inputs: [{ name: "text", label: "Paste your text", type: "textarea", placeholder: "Paste the rough version…" }],
    system: "You rewrite text to sound clear and professional without being stiff. Return only the rewrite.",
    buildPrompt: (i) => `Rewrite this to sound clear and professional, but still human:\n\n${v(i, "text")}`,
  },
  {
    id: "fix-writing",
    title: "Fix spelling & grammar",
    blurb: "Clean up mistakes, keep your voice.",
    category: "improve",
    icon: "SpellCheck",
    inputs: [{ name: "text", label: "Paste your text", type: "textarea", placeholder: "Paste anything…" }],
    system: "You fix spelling and grammar while keeping the writer's voice. Return only the corrected text.",
    buildPrompt: (i) => `Fix the spelling and grammar in this. Keep my voice and meaning, and return only the corrected text:\n\n${v(i, "text")}`,
  },
  {
    id: "make-shorter",
    title: "Make this shorter",
    blurb: "Trim it down without losing the point.",
    category: "improve",
    icon: "Scissors",
    inputs: [{ name: "text", label: "Paste your text", type: "textarea", placeholder: "Paste the long version…" }],
    system: "You make text shorter and tighter while keeping the meaning and tone. Return only the shortened text.",
    buildPrompt: (i) => `Make this shorter and tighter without losing the main point or changing the tone:\n\n${v(i, "text")}`,
  },
  {
    id: "explain-simply",
    title: "Explain this simply",
    blurb: "Turn jargon or a hard passage into plain language.",
    category: "organize",
    icon: "Lightbulb",
    inputs: [{ name: "text", label: "Paste the text", type: "textarea", placeholder: "A confusing email, a clause, a term…" }],
    system: "You explain things in plain, simple language anyone can understand.",
    buildPrompt: (i) => `Explain this in plain, simple language, as if to a friend with no background in it:\n\n${v(i, "text")}`,
  },
  {
    id: "find-action-items",
    title: "Find the action items",
    blurb: "Pull the to-dos out of an email or thread.",
    category: "organize",
    icon: "CheckSquare",
    inputs: [{ name: "text", label: "Paste the email or thread", type: "textarea", placeholder: "Paste it here…" }],
    system: "You find the action items hidden in a message or thread.",
    buildPrompt: (i) =>
      `Read this and list only the action items (things someone needs to do), one per line starting with a dash. If there are none, say so:\n\n${v(i, "text")}`,
  },
  {
    id: "social-post",
    title: "Write a social post",
    blurb: "A short, engaging post from a quick idea.",
    category: "write",
    icon: "Megaphone",
    inputs: [
      { name: "topic", label: "What's it about?", type: "textarea", placeholder: "Describe it in a sentence or two…" },
      { name: "vibe", label: "Tone or vibe", type: "text", placeholder: "e.g. excited, professional, funny", optional: true },
    ],
    system: "You write short, engaging social media posts. Return only the post.",
    buildPrompt: (i) =>
      `Write a short social post about: ${v(i, "topic")}.${v(i, "vibe") ? ` Tone: ${v(i, "vibe")}.` : ""} Keep it punchy and natural.`,
  },
  {
    id: "apology",
    title: "Draft an apology",
    blurb: "A sincere, clear apology message.",
    category: "write",
    icon: "MessageSquareHeart",
    inputs: [
      { name: "to", label: "Who is it to?", type: "text", placeholder: "e.g. a customer, a friend" },
      { name: "what", label: "What happened?", type: "textarea", placeholder: "Describe it briefly…" },
    ],
    system: "You write sincere, clear apologies that take responsibility without over-explaining. Return only the message.",
    buildPrompt: (i) =>
      `Write a sincere apology to ${v(i, "to")}. What happened: ${v(i, "what")}. Take responsibility, keep it brief, and offer to make it right if appropriate.`,
  },
  {
    id: "packing-list",
    title: "Make a packing list",
    blurb: "A practical packing list for a trip.",
    category: "plan",
    icon: "Luggage",
    inputs: [
      { name: "trip", label: "Where and what kind of trip?", type: "text", placeholder: "e.g. 4 days in Chicago for work" },
      { name: "notes", label: "Anything else?", type: "text", placeholder: "e.g. it'll be cold, bringing a laptop", optional: true },
    ],
    system: "You make practical, well-organized packing lists.",
    buildPrompt: (i) =>
      `Make a practical packing list for: ${v(i, "trip")}.${v(i, "notes") ? ` Notes: ${v(i, "notes")}.` : ""} Group it into sections and keep it realistic.`,
  },
];

export function getQuickAction(id: string): QuickAction | undefined {
  return QUICK_ACTIONS.find((a) => a.id === id);
}

/** Required inputs that are empty (by label), so the UI and route can block a run. */
export function missingInputs(action: QuickAction, inputs: Record<string, string>): string[] {
  return action.inputs.filter((inp) => !inp.optional && !v(inputs, inp.name)).map((inp) => inp.label);
}

export function buildMessages(action: QuickAction, inputs: Record<string, string>): ChatMessage[] {
  return [
    { role: "system", content: action.system },
    { role: "user", content: action.buildPrompt(inputs) },
  ];
}
