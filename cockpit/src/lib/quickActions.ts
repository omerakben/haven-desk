// Quick Actions: pre-built, one-click AI for people who don't know how to prompt.
// Each action is a friendly title, a tiny plain-language form, and a written-for-you
// prompt. The whole point is to remove the blank-prompt-box friction: pick a thing,
// answer one or two questions, get something useful. Pure data + builders so the
// route and the UI share one source of truth and it stays unit-testable.

import type { ChatMessage } from "@/lib/ollama";
import { compileSpec, examplesFromGold } from "./prompts/spec";
import { QUICK_ACTION_SPECS } from "./prompts/quickActionSpecs";

export type QuickActionCategory = "write" | "organize" | "plan" | "improve";

export type QuickInput = {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea";
  optional?: boolean;
};

// A one-tap example: a short label plus inputs that fill the form and run for real.
export type QuickActionExample = { label: string; inputs: Record<string, string> };

// The Smart Inbox is a starter target too; its single textarea is the "text" field.
export const INBOX_TARGET = "inbox";
// The Image tool is a starter target too: its question presets fill the prompt.
export const IMAGE_TARGET = "image";
// Email Writer and Meeting Notes are single-text starter targets too (the brief
// and the pasted notes) — killing the last blank-box openings.
export const EMAIL_TARGET = "email";
export const MEETING_TARGET = "meeting-notes";
// Refine (the idea you talk through), the Help Wizard (the question you ask), and
// the Projects empty state (a project name) are single-text starter targets too —
// so every "Not sure where to start?" example in the app is user-editable.
export const REFINE_TARGET = "refine";
export const WIZARD_TARGET = "wizard";
export const PROJECTS_TARGET = "projects";
// The single text field shared by the single-text starter targets above.
export const INBOX_FIELD = "text";
// The single-text (no action schema) starter targets.
export const TEXT_STARTER_TARGETS = [
  INBOX_TARGET,
  IMAGE_TARGET,
  EMAIL_TARGET,
  MEETING_TARGET,
  REFINE_TARGET,
  WIZARD_TARGET,
  PROJECTS_TARGET,
];

// A built-in starter: the seed source for the editable Starter rows (lib/starters.ts).
// `key` is the stable sourceKey; `target` is a QuickAction id or INBOX_TARGET.
export type BuiltinStarter = { target: string; key: string; label: string; inputs: Record<string, string> };

export type QuickAction = {
  id: string;
  title: string;
  blurb: string;
  category: QuickActionCategory;
  icon: string; // lucide icon name, resolved in the UI
  /** Result is a list/plan worth turning into real Tasks (shows "Save as tasks"). */
  canSaveTasks?: boolean;
  inputs: QuickInput[];
  examples?: QuickActionExample[];
  system: string;
  buildPrompt: (inputs: Record<string, string>) => string;
};

export const QUICK_ACTION_CATEGORIES: { id: QuickActionCategory; label: string }[] = [
  { id: "write", label: "Write something" },
  { id: "organize", label: "Organize & summarize" },
  { id: "plan", label: "Plan" },
  { id: "improve", label: "Improve my writing" },
];

// A soft per-category accent for the icon tiles, so the gallery reads as four
// kinds of help at a glance instead of one wall of identical blue. Tailwind
// classes (with dark: variants) rather than theme tokens — these are intentional
// brand-adjacent accents, kept tasteful and legible in both themes.
export const CATEGORY_ACCENT: Record<QuickActionCategory, string> = {
  write: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  organize: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  plan: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  improve: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

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
  {
    id: "translate",
    title: "Translate this",
    blurb: "Translate text into another language — privately, on your machine.",
    category: "write",
    icon: "Languages",
    inputs: [
      { name: "text", label: "Text to translate", type: "textarea", placeholder: "Paste the text…" },
      { name: "language", label: "Into which language?", type: "text", placeholder: "e.g. Spanish, French, Japanese" },
    ],
    system:
      "You are a careful translator. Translate the user's text into the target language, preserving tone and meaning. Return only the translation — no notes, transliteration, or commentary.",
    buildPrompt: (i) => `Translate the following text into ${v(i, "language")}:\n"""\n${v(i, "text")}\n"""`,
  },
  {
    id: "reply-to-review",
    title: "Reply to a review",
    blurb: "A warm, professional reply to a customer review — good or bad.",
    category: "write",
    icon: "Star",
    inputs: [
      { name: "review", label: "The review", type: "textarea", placeholder: "Paste the customer's review…" },
      { name: "note", label: "Anything to add? (optional)", type: "text", placeholder: "e.g. offer a refund, thank them by name", optional: true },
    ],
    system:
      "You write short, professional, genuine replies to customer reviews for a small business. Stay gracious even with negative reviews; never be defensive or make excuses. Return only the reply.",
    buildPrompt: (i) => {
      const note = v(i, "note");
      return `Write a reply to this customer review:\n"""\n${v(i, "review")}\n"""\n${note ? `Also keep in mind: ${note}.\n` : ""}Keep it warm, professional, and brief.`;
    },
  },
  {
    id: "product-description",
    title: "Write a product description",
    blurb: "Turn a few details into a clear, appealing product description.",
    category: "write",
    icon: "Tag",
    inputs: [
      { name: "product", label: "What's the product?", type: "text", placeholder: "e.g. handmade lavender soap" },
      { name: "details", label: "Key details", type: "textarea", placeholder: "Materials, size, what makes it special…" },
    ],
    system:
      "You write concise, appealing product descriptions for small businesses. Lead with the benefit, keep it honest and easy to scan. Return only the description.",
    buildPrompt: (i) => `Write a short, appealing product description.\nProduct: ${v(i, "product")}\nKey details: ${v(i, "details")}`,
  },
  // ── Organize & summarize ─────────────────────────────────────────────────────
  {
    id: "notes-to-list",
    canSaveTasks: true,
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
    canSaveTasks: true,
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
    canSaveTasks: true,
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
    canSaveTasks: true,
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

// The shipped standard starters: the seed source for the editable Starter rows
// (lib/starters.ts). A re-seed is create-only, so an edit is never clobbered.
// Flat with a stable `key` (the sourceKey). 2–3 on the high-value everyday
// actions, one on the rest, plus a few Smart Inbox (target: "inbox") starters.
export const BUILTIN_STARTERS: BuiltinStarter[] = [
  // reply-to-message
  { target: "reply-to-message", key: "reply-to-message:bake-sale", label: "School bake sale",
    inputs: { message: "Hi! We'd love to have you join the school bake sale committee. Our first meeting is this Wednesday at 6pm in the library. Can you make it?", intent: "happy to help but I can't do Wednesdays, ask if there's another day" } },
  { target: "reply-to-message", key: "reply-to-message:reschedule", label: "Reschedule a call",
    inputs: { message: "Are we still on for our call tomorrow at 2pm?", intent: "yes, but I need to push it to 3pm — apologize for the short notice" } },
  { target: "reply-to-message", key: "reply-to-message:decline", label: "Politely decline",
    inputs: { message: "Would you be able to volunteer at the fundraiser this weekend?", intent: "I can't make it this time but I'd love to help with the next one" } },
  // polite-message
  { target: "polite-message", key: "polite-message:landlord", label: "Ask the landlord",
    inputs: { to: "my landlord", about: "the kitchen tap has been dripping for a week and I'd like someone to look at it" } },
  { target: "polite-message", key: "polite-message:teacher", label: "Message a teacher",
    inputs: { to: "my child's teacher", about: "my son will miss Thursday for a doctor's appointment; ask for the homework he'll need" } },
  // thank-you-note
  { target: "thank-you-note", key: "thank-you-note:gift", label: "A birthday gift",
    inputs: { who: "Aunt Mary", for: "the lovely birthday scarf" } },
  // translate
  { target: "translate", key: "translate:spanish-letter", label: "A letter in Spanish",
    inputs: { text: "Estimada vecina, le aviso que cortarán el agua el martes por la mañana por unas reparaciones. Disculpe las molestias.", language: "English" } },
  { target: "translate", key: "translate:to-french", label: "Reply in French",
    inputs: { text: "Thanks so much for your order — it will ship on Monday and arrive by Friday.", language: "French" } },
  // reply-to-review
  { target: "reply-to-review", key: "reply-to-review:happy", label: "A 5-star review",
    inputs: { review: "Absolutely loved the cake for my daughter's birthday — beautiful and delicious. Will order again!", note: "" } },
  { target: "reply-to-review", key: "reply-to-review:unhappy", label: "An unhappy review",
    inputs: { review: "Waited 40 minutes for a table even with a reservation. The food was good but the wait was frustrating.", note: "apologize and offer a free dessert on their next visit" } },
  // product-description
  { target: "product-description", key: "product-description:soap", label: "Handmade soap",
    inputs: { product: "handmade lavender soap", details: "olive oil base, dried lavender from a local farm, 100g bar, gentle on sensitive skin" } },
  // notes-to-list
  { target: "notes-to-list", key: "notes-to-list:brain-dump", label: "A meeting brain-dump",
    inputs: { notes: "call the printer about the proofs, Sam owes me the quote, book the venue for the 12th, follow up with Dana, order more business cards" } },
  { target: "notes-to-list", key: "notes-to-list:errands", label: "Weekend errands",
    inputs: { notes: "groceries, pick up dry cleaning, return the package, call the plumber, water the plants, charge the car" } },
  // summarize
  { target: "summarize", key: "summarize:long-email", label: "A long email",
    inputs: { text: "Hi team, following our review we've decided to push the launch to next month to give QA more time. Marketing should hold the announcement. Finance flagged that the vendor invoice is overdue. Please confirm your availability for a sync on Thursday and send updated timelines by end of day Friday. Thanks." } },
  { target: "summarize", key: "summarize:article", label: "An article",
    inputs: { text: "Researchers found that short, frequent breaks during focused work improved retention more than one long break. The effect was strongest for complex material and weakest for routine tasks. They recommend a five-minute pause roughly every half hour, away from screens." } },
  // key-points
  { target: "key-points", key: "key-points:wordy-update", label: "A wordy update",
    inputs: { text: "So basically the project is going okay but we hit a snag with the API, the client wants more features which will push the timeline, the team is a bit stretched, and we need to decide on hosting before next week or we'll be blocked." } },
  // plan-week
  { target: "plan-week", key: "plan-week:busy", label: "A busy week",
    inputs: { plate: "finish the proposal, dentist on Tuesday, kids' recital Thursday, taxes due Friday, hit the gym, call mom, grocery shop, fix the leaky tap" } },
  { target: "plan-week", key: "plan-week:launch", label: "A launch week",
    inputs: { plate: "finalize the deck, dry-run the demo, send invites, prep the FAQ, line up support coverage, write the announcement, brief the team" } },
  // meal-plan
  { target: "meal-plan", key: "meal-plan:vegetarian", label: "Quick vegetarian",
    inputs: { preferences: "vegetarian, quick weeknight dinners, no mushrooms", days: "5" } },
  { target: "meal-plan", key: "meal-plan:family", label: "Family of four",
    inputs: { preferences: "kid-friendly, one sheet-pan night, budget-conscious", days: "7" } },
  // study-plan
  { target: "study-plan", key: "study-plan:cert", label: "A cert exam",
    inputs: { topic: "the AWS Solutions Architect exam", deadline: "in 3 weeks" } },
  // make-friendlier
  { target: "make-friendlier", key: "make-friendlier:blunt", label: "A blunt note",
    inputs: { text: "I need the report by tomorrow. Don't be late this time." } },
  // make-professional
  { target: "make-professional", key: "make-professional:casual", label: "A casual message",
    inputs: { text: "hey so i can't make the call thing tomorrow, something came up, can we do it another time maybe?" } },
  // fix-writing
  { target: "fix-writing", key: "fix-writing:typos", label: "Typos & grammar",
    inputs: { text: "Their going to send the documents tommorow, i seen the email but its not arrived yet. Please could you check you're inbox." } },
  // make-shorter
  { target: "make-shorter", key: "make-shorter:paragraph", label: "Trim a paragraph",
    inputs: { text: "I wanted to reach out and let you know that, after giving it quite a lot of thought and consideration over the past few days, I've come to the conclusion that it would probably be best for everyone involved if we went ahead and rescheduled the meeting to a later date." } },
  // explain-simply
  { target: "explain-simply", key: "explain-simply:legal", label: "Legal jargon",
    inputs: { text: "The lessee shall indemnify and hold harmless the lessor from any and all liabilities, claims, or damages arising from the lessee's use of the premises, except those resulting from the lessor's gross negligence." } },
  // find-action-items
  { target: "find-action-items", key: "find-action-items:thread", label: "An email thread",
    inputs: { text: "Thanks all. Priya, can you send the updated deck by Wednesday? I'll book the room. We still need someone to follow up with the vendor, Tom can you take that? And let's all review the budget before Friday's call." } },
  // social-post
  { target: "social-post", key: "social-post:launch", label: "A product launch",
    inputs: { topic: "we just launched a local-first AI app that keeps your data on your own computer", vibe: "excited but down-to-earth" } },
  // apology
  { target: "apology", key: "apology:late-delivery", label: "A late delivery",
    inputs: { to: "a customer", what: "their order shipped three days late because of a warehouse mix-up" } },
  // packing-list
  { target: "packing-list", key: "packing-list:work-trip", label: "A work trip",
    inputs: { trip: "4 days in Chicago for a conference", notes: "it'll be cold, bringing a laptop, one nice dinner" } },
  // Smart Inbox starters — fill the textarea with a ready snippet to file.
  { target: INBOX_TARGET, key: "inbox:meeting-note", label: "A meeting note",
    inputs: { [INBOX_FIELD]: "Sync with Dana: agreed to ship the proposal Friday, she'll send the budget, I'll follow up with the printer about the proofs." } },
  { target: INBOX_TARGET, key: "inbox:todo-list", label: "A list of to-dos",
    inputs: { [INBOX_FIELD]: "call the printer, send the quote to Sam, book the venue for the 12th, order business cards" } },
  { target: INBOX_TARGET, key: "inbox:remember-fact", label: "A fact to remember",
    inputs: { [INBOX_FIELD]: "Our tax-exempt number is 12-3456789; the accountant is Priya at Maple & Co." } },
  // Image starters — question presets that fill the "what to ask" box.
  { target: IMAGE_TARGET, key: "image:describe", label: "Describe it",
    inputs: { [INBOX_FIELD]: "Describe this image in detail." } },
  { target: IMAGE_TARGET, key: "image:read-text", label: "Read the text",
    inputs: { [INBOX_FIELD]: "Read and transcribe all the text in this image, keeping the layout where it matters." } },
  { target: IMAGE_TARGET, key: "image:receipt", label: "Pull the receipt details",
    inputs: { [INBOX_FIELD]: "This is a receipt or invoice. Pull out the vendor, date, total, and a spending category. If a field is missing, say \"unknown\"." } },
  { target: IMAGE_TARGET, key: "image:screenshot", label: "What's in this screenshot?",
    inputs: { [INBOX_FIELD]: "What is shown in this screenshot, and what is it asking me to do?" } },
  // Email Writer starters — fill the brief.
  { target: EMAIL_TARGET, key: "email:overdue-invoice", label: "Chase an overdue invoice",
    inputs: { [INBOX_FIELD]: "Politely remind a client their invoice (#1042, $1,200) is two weeks overdue, and ask when I can expect payment." } },
  { target: EMAIL_TARGET, key: "email:decline", label: "Decline politely",
    inputs: { [INBOX_FIELD]: "Turn down an invitation to speak at an event because I'm fully booked that month, but offer to help another time." } },
  { target: EMAIL_TARGET, key: "email:intro", label: "Introduce two people",
    inputs: { [INBOX_FIELD]: "Introduce my colleague Dana (a designer) to my friend Sam (starting a bakery and needs branding), and explain why they should connect." } },
  // Meeting Notes starters — fill the notes box.
  { target: MEETING_TARGET, key: "meeting:rough", label: "Rough meeting notes",
    inputs: { [INBOX_FIELD]: "Standup: Sam to send the client quote by Friday. Dana finishing the logo, needs feedback by Wed. Book the venue for the 12th. Order more business cards. Follow up with the printer about the proofs." } },

  // Refine — fuzzy ideas to talk through (the chip label IS the idea).
  { target: REFINE_TARGET, key: "refine:newsletter", label: "A weekly newsletter for my bakery's regulars",
    inputs: { [INBOX_FIELD]: "A weekly newsletter for my bakery's regulars" } },
  { target: REFINE_TARGET, key: "refine:reminder-app", label: "An app that reminds me to call my parents",
    inputs: { [INBOX_FIELD]: "An app that reminds me to call my parents" } },
  { target: REFINE_TARGET, key: "refine:standup", label: "Reorganizing my team's Monday standup",
    inputs: { [INBOX_FIELD]: "Reorganizing my team's Monday standup" } },

  // Help Wizard — starter questions (the chip label IS the question).
  { target: WIZARD_TARGET, key: "wizard:what-can-it-do", label: "What can Haven Desk do?",
    inputs: { [INBOX_FIELD]: "What can Haven Desk do?" } },
  { target: WIZARD_TARGET, key: "wizard:notes-to-tasks", label: "How do I turn meeting notes into tasks?",
    inputs: { [INBOX_FIELD]: "How do I turn meeting notes into tasks?" } },
  { target: WIZARD_TARGET, key: "wizard:which-email", label: "Which tool writes an email?",
    inputs: { [INBOX_FIELD]: "Which tool writes an email?" } },

  // Projects — example project names for the empty state (the chip label IS the name).
  { target: PROJECTS_TARGET, key: "projects:acme-bakery", label: "Acme Bakery",
    inputs: { [INBOX_FIELD]: "Acme Bakery" } },
  { target: PROJECTS_TARGET, key: "projects:side-hustle", label: "Side hustle",
    inputs: { [INBOX_FIELD]: "Side hustle" } },
  { target: PROJECTS_TARGET, key: "projects:home-reno", label: "Home renovation",
    inputs: { [INBOX_FIELD]: "Home renovation" } },
  { target: PROJECTS_TARGET, key: "projects:q3-marketing", label: "Q3 marketing",
    inputs: { [INBOX_FIELD]: "Q3 marketing" } },
];

// Group the action-targeted built-ins into the per-action example shape the
// runner, the attach, and getFeaturedDemo already use (inbox starters excluded).
const EXAMPLES_BY_ACTION: Record<string, QuickActionExample[]> = {};
for (const s of BUILTIN_STARTERS) {
  if (TEXT_STARTER_TARGETS.includes(s.target)) continue;
  (EXAMPLES_BY_ACTION[s.target] ??= []).push({ label: s.label, inputs: s.inputs });
}
for (const a of QUICK_ACTIONS) {
  a.examples = EXAMPLES_BY_ACTION[a.id] ?? [];
}

/**
 * The code built-in starters for a single-text target (inbox / image / email /
 * meeting-notes), in the `{ label, inputs }` shape StarterChips wants as its
 * `fallback`. Passing this (instead of `[]`) means the chips render instantly
 * from code while the live `/api/starters` list loads — no empty-row flash.
 */
export function builtinStartersFor(target: string): QuickActionExample[] {
  return BUILTIN_STARTERS.filter((s) => s.target === target).map((s) => ({ label: s.label, inputs: s.inputs }));
}

/** The single curated example shown as the featured "see it work" demo on the home. */
export const FEATURED_DEMO = { actionId: "reply-to-message", exampleIndex: 0 };

export function getFeaturedDemo(): { action: QuickAction; example: QuickActionExample } | null {
  const action = getQuickAction(FEATURED_DEMO.actionId);
  const example = action?.examples?.[FEATURED_DEMO.exampleIndex];
  return action && example ? { action, example } : null;
}

export function getQuickAction(id: string): QuickAction | undefined {
  return QUICK_ACTIONS.find((a) => a.id === id);
}

// Dashboard hero actions — the six one-click actions surfaced on the home screen.
// Tailored to the onboarding persona so the pick finally pays off; falls back to a
// sensible everyday default for "skipped"/no persona. All ids are real actions
// above (enforced by a unit test).
export const DEFAULT_HERO_IDS = [
  "reply-to-message",
  "notes-to-list",
  "summarize",
  "polite-message",
  "make-friendlier",
  "plan-week",
];

export const HERO_IDS_BY_PERSONA: Record<string, string[]> = {
  household: ["reply-to-message", "notes-to-list", "plan-week", "meal-plan", "polite-message", "summarize"],
  "small-business": ["polite-message", "reply-to-message", "find-action-items", "plan-week", "make-professional", "summarize"],
  student: ["explain-simply", "study-plan", "summarize", "key-points", "notes-to-list", "fix-writing"],
  creative: ["social-post", "make-friendlier", "notes-to-list", "summarize", "reply-to-message", "key-points"],
  "personal-admin": ["explain-simply", "polite-message", "summarize", "key-points", "find-action-items", "notes-to-list"],
};

/** The home-screen hero action ids for a persona ("skipped"/null → default). */
export function getHeroIds(persona: string | null | undefined): string[] {
  return (persona && HERO_IDS_BY_PERSONA[persona]) || DEFAULT_HERO_IDS;
}

/**
 * Free-text search over the gallery (title, blurb, and the category label), so
 * a user can type "email" or "list" instead of scanning four sections. An empty
 * or whitespace query returns every action (the full gallery).
 */
export function searchQuickActions(query: string): QuickAction[] {
  // Normalize hyphens to spaces on BOTH sides so "thank you" matches the
  // "thank-you note" action (and "to do" matches "to-do list").
  const norm = (s: string) => s.toLowerCase().replace(/-/g, " ");
  const q = norm(query.trim());
  if (!q) return QUICK_ACTIONS;
  const labelOf = (c: QuickActionCategory) => QUICK_ACTION_CATEGORIES.find((x) => x.id === c)?.label ?? "";
  return QUICK_ACTIONS.filter((a) => norm(`${a.title} ${a.blurb} ${labelOf(a.category)}`).includes(q));
}

/** How many recently-used actions we remember. */
export const RECENTS_CAP = 5;

/**
 * Push an action id onto the recents list: most-recent first, de-duplicated
 * (re-running an action moves it to the front, never adds a second copy), and
 * capped. Pure so the localStorage glue stays trivial and this stays tested.
 */
export function pushRecent(ids: string[], id: string, cap = RECENTS_CAP): string[] {
  return [id, ...ids.filter((x) => x !== id)].slice(0, cap);
}

/** Resolve recent ids to actions, dropping any that no longer exist. */
export function recentActions(ids: string[]): QuickAction[] {
  return ids.map(getQuickAction).filter((a): a is QuickAction => Boolean(a));
}

// One-tap refinements on a result: the user got a draft and wants to nudge it
// without writing a new prompt. Each is a plain-language tweak; the id is what
// the UI sends, the instruction is what the model is told.
export type RefineOption = { id: string; label: string; instruction: string };

export const REFINE_OPTIONS: RefineOption[] = [
  { id: "shorter", label: "Shorter", instruction: "Make it shorter and more concise, keeping the main point." },
  { id: "friendlier", label: "Friendlier", instruction: "Make it warmer and friendlier in tone." },
  { id: "formal", label: "More formal", instruction: "Make it more formal and professional in tone." },
  { id: "simpler", label: "Simpler", instruction: "Use simpler, plainer language that anyone can understand." },
  { id: "detail", label: "More detail", instruction: "Add a little more helpful detail and specifics." },
];

export function getRefineOption(id: string): RefineOption | undefined {
  return REFINE_OPTIONS.find((r) => r.id === id);
}

/**
 * Messages to revise an existing result. The model gets the prior text plus a
 * plain-language instruction and returns ONLY the revised text — so refining is
 * iterative (refine the refinement) and needs no action context.
 */
export function buildRefineMessages(text: string, instruction: string): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "You revise a piece of writing according to the user's instruction. Return ONLY the revised text — no preamble, no commentary, no surrounding quotes.",
    },
    { role: "user", content: `Here is the text:\n"""\n${text}\n"""\n\nRevise it: ${instruction}` },
  ];
}

/** Required inputs that are empty (by label), so the UI and route can block a run. */
export function missingInputs(action: QuickAction, inputs: Record<string, string>): string[] {
  return action.inputs.filter((inp) => !inp.optional && !v(inputs, inp.name)).map((inp) => inp.label);
}

export function buildMessages(action: QuickAction, inputs: Record<string, string>): ChatMessage[] {
  const user = action.buildPrompt(inputs);
  const engineered = QUICK_ACTION_SPECS[action.id];
  if (engineered) {
    // The few-shot input is the action's own buildPrompt over the gold inputs —
    // so it mirrors the real runtime input exactly, by construction.
    const examples = examplesFromGold(action.buildPrompt, engineered.gold);
    return compileSpec({ ...engineered.spec, examples }, user);
  }
  return [
    { role: "system", content: action.system },
    { role: "user", content: user },
  ];
}

/** The engineered per-action temperature, if this action has a spec (else undefined). */
export function specTemperature(actionId: string): number | undefined {
  return QUICK_ACTION_SPECS[actionId]?.spec.temperature;
}
