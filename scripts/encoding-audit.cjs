const fs = require('fs');

const file = process.argv[2];
const cp1252 = {
  '\u20ac': 0x80, '\u201a': 0x82, '\u0192': 0x83, '\u201e': 0x84,
  '\u2026': 0x85, '\u2020': 0x86, '\u2021': 0x87, '\u02c6': 0x88,
  '\u2030': 0x89, '\u0160': 0x8a, '\u2039': 0x8b, '\u0152': 0x8c,
  '\u017d': 0x8e, '\u2018': 0x91, '\u2019': 0x92, '\u201c': 0x93,
  '\u201d': 0x94, '\u2022': 0x95, '\u2013': 0x96, '\u2014': 0x97,
  '\u02dc': 0x98, '\u2122': 0x99, '\u0161': 0x9a, '\u203a': 0x9b,
  '\u0153': 0x9c, '\u017e': 0x9e, '\u0178': 0x9f,
};

function toBytes(value) {
  const output = [];
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 0xff && !Object.hasOwn(cp1252, character)) output.push(codePoint);
    else if (Object.hasOwn(cp1252, character)) output.push(cp1252[character]);
    else throw new Error('Not a mojibake candidate');
  }
  return Buffer.from(output);
}

function decodeMojibake(value) {
  let current = value;
  for (let i = 0; i < 12; i += 1) {
    try {
      const next = new TextDecoder('utf-8', { fatal: true }).decode(toBytes(current));
      if (next === current) return current;
      current = next;
    } catch {
      return current;
    }
  }
  return current;
}

const changes = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  .map((old) => ({ old, next: decodeMojibake(old) }))
  .filter(({ old, next }) => old !== next);

process.stdout.write(JSON.stringify(changes));
