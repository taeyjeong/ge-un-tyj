// Opens the "Ask the data" chat (components/AskDataWidget.tsx) from anywhere on the page, already
// holding an earlier question and answer, so the visitor can ask follow-up questions about it.
// Used by the public history page (/ask-history).

export interface SeedTurn {role: 'user' | 'assistant'; content: string; at?: string; coverage?: 'full' | 'partial' | 'none'}
// continuedFrom: the /ask-history row the conversation was opened from; sent with each new question so
// the server can link the new conversation to the old one.
export interface ChatSeed {turns: SeedTurn[]; draft?: string; continuedFrom?: number}

export const CONTINUE_EVENT = 'ge:ask-data:continue';

export function continueInChat(seed: ChatSeed) {
  window.dispatchEvent(new CustomEvent<ChatSeed>(CONTINUE_EVENT, {detail: seed}));
}
