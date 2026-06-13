/**
 * EmojiToAscii - converts emoji and pictographic symbols to ASCII equivalents.
 *
 * The embedded DejaVu fonts cover box-drawing, extended Latin, and many symbols,
 * but NOT color/pictographic emoji (those need COLR/SVG tables jsPDF can't render).
 * Emoji left in the text would render as tofu boxes and desync width measurement,
 * so this pass replaces them with ASCII before the text reaches jsPDF.
 *
 * Two stages:
 *   1. kEmojiMap - explicit, curated emoji -> ASCII replacements.
 *   2. kEmojiRanges - any remaining codepoint in pictographic emoji ranges is
 *      stripped (these are emoji DejaVu cannot draw). Box-drawing, arrows, and
 *      extended Latin are deliberately NOT in these ranges, so they survive.
 */

// Curated emoji/symbol -> ASCII map. Longest/most-specific entries should win;
// JS string replace on exact emoji keys avoids partial-codepoint issues.
export const kEmojiMap: Record<string, string> = {
  // Status / checks
  '✅': '[x]',
  '❌': '[ ]',
  '✔️': '[x]',
  '✔': '[x]',
  '✖️': 'x',
  '✖': 'x',
  '☑️': '[x]',
  '☑': '[x]',
  '⬜': '[ ]',
  '⬛': '[#]',
  '🔲': '[ ]',
  '🔳': '[ ]',
  '🚫': '(no)',
  '⛔': '(stop)',
  '❎': '[x]',
  '✳️': '*',
  '✴️': '*',
  '❇️': '*',
  '➕': '+',
  '➖': '-',
  '➗': '/',

  // Warnings / info
  '⚠️': '(!)',
  '⚠': '(!)',
  '❗': '(!)',
  '❕': '(!)',
  '❓': '(?)',
  '❔': '(?)',
  'ℹ️': '(i)',
  'ℹ': '(i)',
  '💡': '(idea)',
  '🔥': '(hot)',
  '⭐': '*',
  '🌟': '*',
  '✨': '*',
  '💥': '(!)',
  '🎉': '(party)',
  '🎊': '(party)',

  // Arrows
  '→': '->',
  '←': '<-',
  '↑': '^',
  '↓': 'v',
  '↔️': '<->',
  '↔': '<->',
  '⟶': '-->',
  '⟵': '<--',
  '⇒': '=>',
  '⇐': '<=',
  '⇔': '<=>',
  '➡️': '->',
  '➡': '->',
  '⬅️': '<-',
  '⬅': '<-',
  '⬆️': '^',
  '⬆': '^',
  '⬇️': 'v',
  '⬇': 'v',
  '↩️': '<-',
  '↪️': '->',
  '🔙': '(back)',
  '🔜': '(soon)',
  '🔝': '(top)',

  // Faces / common reactions
  '😀': ':)',
  '😃': ':)',
  '😄': ':)',
  '😁': ':)',
  '😆': ':D',
  '😅': ':)',
  '😂': ':,)',
  '🙂': ':)',
  '🙃': '(:',
  '😉': ';)',
  '😊': ':)',
  '😍': ':)',
  '😘': ':*',
  '😜': ';P',
  '😝': ':P',
  '😛': ':P',
  '🤔': '(hmm)',
  '😐': ':|',
  '😑': ':|',
  '😏': ':)',
  '😒': ':/',
  '😞': ':(',
  '😔': ':(',
  '😟': ':(',
  '😢': ":'(",
  '😭': ":'(",
  '😡': '>:(',
  '😠': '>:(',
  '😎': 'B)',
  '😱': ':O',
  '😮': ':O',
  '😲': ':O',
  '🙁': ':(',
  '☹️': ':(',
  '😴': '(zzz)',
  '🤣': ':,D',

  // Hands / gestures
  '👍': '(+1)',
  '👎': '(-1)',
  '👌': '(ok)',
  '👏': '(clap)',
  '🙏': '(pls)',
  '🙌': '(yay)',
  '👋': '(wave)',
  '✋': '(stop)',
  '🤚': '(hand)',
  '💪': '(strong)',
  '🤝': '(deal)',
  '✊': '(fist)',
  '👊': '(fist)',
  '🤞': '(luck)',

  // Hearts / misc symbols
  '❤️': '<3',
  '❤': '<3',
  '🧡': '<3',
  '💛': '<3',
  '💚': '<3',
  '💙': '<3',
  '💜': '<3',
  '🖤': '<3',
  '🤍': '<3',
  '🤎': '<3',
  '💔': '</3',
  '💕': '<3',
  '💖': '<3',
  '💗': '<3',

  // Objects commonly used in docs/READMEs
  '📦': '(package)',
  '📁': '(folder)',
  '📂': '(folder)',
  '📄': '(file)',
  '📝': '(note)',
  '📌': '(pin)',
  '📍': '(pin)',
  '🔧': '(tool)',
  '🔨': '(hammer)',
  '🛠️': '(tools)',
  '⚙️': '(gear)',
  '⚙': '(gear)',
  '🔑': '(key)',
  '🔒': '(locked)',
  '🔓': '(unlocked)',
  '🔗': '(link)',
  '📎': '(clip)',
  '🚀': '(rocket)',
  '🐛': '(bug)',
  '🎯': '(target)',
  '🏷️': '(tag)',
  '🔍': '(search)',
  '🔎': '(search)',
  '📊': '(chart)',
  '📈': '(up)',
  '📉': '(down)',
  '🕐': '(clock)',
  '⏰': '(alarm)',
  '⏳': '(wait)',
  '⌛': '(wait)',
  '✏️': '(edit)',
  '✏': '(edit)',
  '🖊️': '(pen)',
  '📚': '(books)',
  '📖': '(book)',
  '💬': '(comment)',
  '💭': '(thought)',
  '🗒️': '(note)',
  '🗑️': '(trash)',

  // Flags / regional commonly seen
  '🇺🇸': '(US)',
  '🌍': '(world)',
  '🌎': '(world)',
  '🌐': '(web)',
};

// Pictographic emoji codepoint ranges DejaVu cannot render. Box-drawing
// (U+2500-257F), arrows (U+2190-21FF), and Latin are intentionally excluded.
const kEmojiRanges: ReadonlyArray<[number, number]> = [
  [0x1f000, 0x1faff], // misc symbols/pictographs, emoticons, transport, supplemental
  [0x1f1e6, 0x1f1ff], // regional indicators
  [0x2600, 0x26ff], // miscellaneous symbols
  [0x2700, 0x27bf], // dingbats
  [0xfe00, 0xfe0f], // variation selectors
  [0x200d, 0x200d], // zero-width joiner
];

function inEmojiRange(cp: number): boolean {
  return kEmojiRanges.some(([lo, hi]) => cp >= lo && cp <= hi);
}

/**
 * Convert emoji and pictographic symbols in `text` to ASCII.
 * Curated replacements first, then any leftover emoji-range codepoints removed.
 *
 * @example
 * emojiToAscii('Done ✅ → next');  // 'Done [x] -> next'
 */
export function emojiToAscii(text: string): string {
  if (!text) return text;

  let result = text;
  for (const [emoji, ascii] of Object.entries(kEmojiMap)) {
    if (result.includes(emoji)) {
      result = result.split(emoji).join(ascii);
    }
  }

  // Strip any remaining emoji-range codepoints (iterate by codepoint so astral
  // characters / surrogate pairs are handled correctly).
  let stripped = '';
  for (const ch of result) {
    const cp = ch.codePointAt(0);
    if (cp !== undefined && inEmojiRange(cp)) continue;
    stripped += ch;
  }
  return stripped;
}
