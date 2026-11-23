// Builds a PDF of an "Ask the data" conversation in the browser and downloads it (jsPDF, loaded only
// when a visitor clicks Download). Answers are plain text with light markdown: **bold**, "- " bullets,
// "#" headings and [label](url) links. Links become numbered, clickable sources under each answer.
// The built-in PDF fonts cover Western European text; other characters are replaced with "?".

export interface PdfEntry {role: 'user' | 'assistant'; content: string; at?: string; note?: string}
export interface PdfChat {title: string; subtitle?: string; entries: PdfEntry[]; filename: string}

const KEEP = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');  // WinAnsi characters above U+00FF
const SWAP: Record<string, string> = {'→': '->', '←': '<-', '≥': '>=', '≤': '<=', '≈': '~', '−': '-', '‑': '-', '✦': '', '✓': 'v', '×': 'x', ' ': ' ', ' ': ' ', ' ': ' '};
function safe(text: string) {
  return [...text.normalize('NFC')].map(ch => SWAP[ch] ?? (ch.charCodeAt(0) <= 0xff || KEEP.has(ch) ? ch : '?')).join('');
}
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});

export async function downloadChatPdf(chat: PdfChat) {
  const {jsPDF} = await import('jspdf');
  const doc = new jsPDF({unit: 'mm', format: 'a4'});
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 18, TEXT_W = W - 2 * M;
  let y = M;
  const space = (h: number) => {if (y + h > H - M - 6) {doc.addPage(); y = M;}};
  const write = (text: string, {size = 10, bold = false, color = [32, 33, 36] as [number, number, number], indent = 0, gap = 1.6} = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(...color);
    const lineH = size * 0.42;
    for (const line of doc.splitTextToSize(safe(text), TEXT_W - indent) as string[]) {space(lineH); doc.text(line, M + indent, y + lineH * 0.8); y += lineH;}
    y += gap;
  };

  doc.setProperties({title: chat.title, subject: 'Ask the data: peace agreements and women’s inclusion', creator: 'GE / UN Data'});
  write(chat.title, {size: 16, bold: true, gap: 2});
  if (chat.subtitle) write(chat.subtitle, {size: 9, color: [104, 119, 134], gap: 2});
  write(`Downloaded ${when(new Date().toISOString())}. Answers come from an AI (Claude) using the project’s data and can contain mistakes; check the linked sources.`, {size: 8, color: [128, 134, 139], gap: 5});

  for (const entry of chat.entries) {
    space(14);
    const label = [entry.role === 'user' ? 'Question' : 'Answer', entry.at && when(entry.at), entry.note].filter(Boolean).join('  ·  ');
    write(label, {size: 8, bold: true, color: entry.role === 'user' ? [26, 115, 232] : [55, 104, 157], gap: 1});
    if (entry.role === 'user') {write(entry.content, {size: 11, bold: true, gap: 5}); continue;}

    const links: {label: string; href: string}[] = [];
    const withRefs = entry.content.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g, (_, label: string | undefined, href: string | undefined, bare: string | undefined) => {
      const url = href ?? bare!; let n = links.findIndex(l => l.href === url) + 1;
      if (!n) {links.push({label: label ?? url, href: url}); n = links.length;}
      return label ? `${label} [${n}]` : `[${n}]`;
    });
    for (const raw of withRefs.split('\n')) {
      const line = raw.trimEnd();
      if (!line.trim()) {y += 1.5; continue;}
      const heading = /^#{1,6}\s+/.test(line), boldLine = /^\*\*[^*]+\*\*:?$/.test(line.trim());
      const bullet = line.match(/^(\s*)([-*•]|\d+[.)])\s+(.*)$/);
      const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/^#{1,6}\s+/, '');
      if (bullet) {
        const indent = 4 + Math.min(bullet[1].length, 6);
        const mark = /\d/.test(bullet[2]) ? bullet[2] : '•';
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(32, 33, 36);
        space(4.2); doc.text(mark, M + indent - 3.5, y + 3.4);
        write(plain(bullet[3]), {indent: indent + (mark.length > 1 ? 2 : 0), gap: 0.8});
      } else write(plain(line), {bold: heading || boldLine, size: heading ? 11 : 10, gap: 0.8});
    }
    if (links.length) {
      y += 1.5; write('Sources', {size: 8, bold: true, color: [104, 119, 134], gap: 0.5});
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      for (const [i, l] of links.entries()) {
        for (const [j, line] of (doc.splitTextToSize(safe(`[${i + 1}] ${l.label === l.href ? '' : l.label + ': '}${l.href}`), TEXT_W) as string[]).entries()) {
          space(3.6); doc.setTextColor(26, 115, 232);
          doc.textWithLink(line, M, y + 2.9, {url: l.href}); y += 3.4;
          if (j > 3) break;
        }
      }
    }
    y += 5;
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(154, 160, 166);
    doc.text(safe(`GE / UN Data · Ask the data · ${typeof window === 'undefined' ? '' : window.location.origin + '/ask-history'}`), M, H - 9);
    doc.text(`${p} / ${pages}`, W - M, H - 9, {align: 'right'});
  }
  doc.save(chat.filename);
}

export function pdfFilename(prefix: string, iso = new Date().toISOString()) {
  const d = new Date(iso), two = (n: number) => String(n).padStart(2, '0');  // visitor's local time
  return `${prefix}-${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}-${two(d.getHours())}${two(d.getMinutes())}.pdf`;
}
