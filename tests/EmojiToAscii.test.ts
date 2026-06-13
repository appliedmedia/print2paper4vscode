import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { emojiToAscii, kEmojiMap } from '../src/EmojiToAscii.js';

describe('emojiToAscii', () => {
  it('replaces curated status emoji', () => {
    assert.strictEqual(emojiToAscii('Done ✅'), 'Done [x]');
    assert.strictEqual(emojiToAscii('Fail ❌'), 'Fail [ ]');
    assert.strictEqual(emojiToAscii('🚫 nope'), '(no) nope');
  });

  it('replaces arrows with ASCII', () => {
    assert.strictEqual(emojiToAscii('a → b'), 'a -> b');
    assert.strictEqual(emojiToAscii('x ⇒ y'), 'x => y');
  });

  it('strips uncurated pictographic emoji (astral plane)', () => {
    // 🦄 (U+1F984) is not in the map; should be removed, surrounding text intact
    assert.strictEqual(emojiToAscii('a🦄b'), 'ab');
  });

  it('preserves box-drawing characters (DejaVu renders these)', () => {
    const tree = '├── App.ts\n│   └── PDF.ts';
    assert.strictEqual(emojiToAscii(tree), tree);
  });

  it('preserves plain ASCII and extended Latin', () => {
    assert.strictEqual(emojiToAscii('café — naïve'), 'café — naïve');
  });

  it('handles empty and undefined-ish input', () => {
    assert.strictEqual(emojiToAscii(''), '');
    assert.strictEqual(emojiToAscii('no emoji here'), 'no emoji here');
  });

  it('strips variation selectors left after replacement', () => {
    // ⚠️ = U+26A0 + U+FE0F; maps to (!) and the VS16 must not linger
    assert.strictEqual(emojiToAscii('⚠️ careful'), '(!) careful');
  });

  it('map has no empty keys', () => {
    for (const key of Object.keys(kEmojiMap)) {
      assert.ok(key.length > 0, 'emoji key should be non-empty');
    }
  });
});
