import { readFileSync } from 'fs';
import { decodeHTML } from 'entities';
const a = readFileSync(process.argv[2], 'utf8');
const b = readFileSync(process.argv[3], 'utf8');
const entityInsensitive = process.argv[4] === '--decode-entities';

console.log('byte identical:', a === b, `(A=${a.length} B=${b.length})`);

// Normalize: collapse whitespace between tags and trim text-node whitespace runs.
// With --decode-entities, also decode named/numeric HTML entities to their unicode
// characters on BOTH sides, so `&middot;` and `·` compare equal.
const norm = (s) => {
  let t = s.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
  if (entityInsensitive) t = decodeHTML(t);
  return t;
};

const na = norm(a), nb = norm(b);
console.log('normalized identical:', na === nb, `(A=${na.length} B=${nb.length})`);

if (na !== nb) {
  // find first divergence and show context
  let i = 0;
  while (i < na.length && i < nb.length && na[i] === nb[i]) i++;
  const from = Math.max(0, i - 80);
  console.log('\nfirst divergence at char', i);
  console.log('ORIG:', JSON.stringify(na.slice(from, i + 80)));
  console.log('NEW :', JSON.stringify(nb.slice(from, i + 80)));

  // Alignment-aware edit count: split into tag-delimited tokens, then greedily
  // resync after each mismatch (so one inserted <tbody> doesn't cascade).
  const ta = na.split(/(?=<)/), tb = nb.split(/(?=<)/);
  let i2 = 0, j2 = 0, ins = 0, del = 0, sub = 0;
  const W = 40;
  while (i2 < ta.length && j2 < tb.length) {
    if (ta[i2] === tb[j2]) { i2++; j2++; continue; }
    // look ahead for a resync point within window W
    let found = null;
    for (let d = 1; d <= W && !found; d++) {
      if (j2 + d < tb.length && ta[i2] === tb[j2 + d]) found = ['ins', d];
      else if (i2 + d < ta.length && ta[i2 + d] === tb[j2]) found = ['del', d];
    }
    if (found && found[0] === 'ins') { ins += found[1]; j2 += found[1]; }
    else if (found && found[0] === 'del') { del += found[1]; i2 += found[1]; }
    else { sub++; i2++; j2++; }
  }
  ins += (tb.length - j2); del += (ta.length - i2);
  console.log(`\ntokens: A=${ta.length} B=${tb.length}`);
  console.log(`real edits -> substitutions:${sub}  inserted(in NEW):${ins}  deleted(from ORIG):${del}`);

  // characterize inserted tokens
  const insertedTags = {};
  {
    let i3 = 0, j3 = 0;
    while (i3 < ta.length && j3 < tb.length) {
      if (ta[i3] === tb[j3]) { i3++; j3++; continue; }
      let matched = false;
      for (let d = 1; d <= W && !matched; d++) {
        if (j3 + d < tb.length && ta[i3] === tb[j3 + d]) {
          for (let k = 0; k < d; k++) { const tag = (tb[j3 + k].match(/^<\/?[a-zA-Z0-9]+/) || ['?'])[0]; insertedTags[tag] = (insertedTags[tag] || 0) + 1; }
          j3 += d; matched = true;
        } else if (i3 + d < ta.length && ta[i3 + d] === tb[j3]) { i3 += d; matched = true; }
      }
      if (!matched) { i3++; j3++; }
    }
  }
  console.log('inserted-token tag histogram:', insertedTags);
}
