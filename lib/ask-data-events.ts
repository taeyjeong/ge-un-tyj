// Opens the "Ask the data" chat (components/AskDataWidget.tsx) from anywhere on the page, already
// holding an earlier question and answer, so the visitor can ask follow-up questions about it.
// Used by the public history page (/ask-history).

export interface SeedTurn {role: 'user' | 'assistant'; content: string; at?: string; coverage?: 'full' | 'partial' | 'none'}
export interface ChatSeed {turns: SeedTurn[]; draft?: string}

export const CONTINUE_EVENT = 'ge:ask-data:continue';

export function continueInChat(seed: ChatSeed) {
  window.dispatchEvent(new CustomEvent<ChatSeed>(CONTINUE_EVENT, {detail: seed}));
}
