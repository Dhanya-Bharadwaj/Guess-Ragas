const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE = 'https://www.ragasurabhi.com';
const INDEX = BASE + '/carnatic-music/ragas.html';

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function fetchIndex() {
  const res = await axios.get(INDEX, { timeout: 20000 });
  return res.data;
}

function slugToUrl(slug) {
  // slug is like 'raga--kalyani.html' from the index links
  return BASE + '/carnatic-music/raga/' + slug;
}

function extractAroAv(html) {
  const $ = cheerio.load(html);

  // Heuristic: look for nodes containing 'Arohana' or 'Arohanam' and 'Avarohana' or 'Avarohanam'
  const text = $('body').text();

  // Try regex patterns: Arohana: ... Avarohana: ... or Arohanam - ... Avarohanam - ...
  const aroMatch = text.match(/Arohan(?:a|am)[:\-\s]*([A-Za-z0-9\s\'\-,\.\(\)\/]*)/i);
  const avMatch = text.match(/Avarohan(?:a|am)[:\-\s]*([A-Za-z0-9\s\'\-,\.\(\)\/]*)/i);

  // fallback: sometimes pages write 'Arohana / Avarohana' and include lines nearby
  if (!aroMatch || !avMatch) {
    // search for a block that contains both words and capture nearby lines
    const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (/Arohan/i.test(l) && /Avaroh/i.test(l)) {
        // split on Arohana/Avarohana
        const parts = l.split(/Arohan(?:a|am)|Avarohan(?:a|am)/i).map((p) => p.trim()).filter(Boolean);
        return { arohana: parts[0] || '', avarohana: parts[1] || '' };
      }
      if (/Arohan/i.test(l) && i + 1 < lines.length && /Avaroh/i.test(lines[i+1])) {
        return { arohana: l.replace(/Arohan(?:a|am)[:\-\s]*/i, ''), avarohana: lines[i+1].replace(/Avarohan(?:a|am)[:\-\s]*/i, '') };
      }
    }
  }

  const aro = aroMatch ? aroMatch[1].trim() : '';
  const av = avMatch ? avMatch[1].trim() : '';
  return { arohana: aro, avarohana: av };
}

async function fetchRagaPage(url) {
  try {
    const res = await axios.get(url, { timeout: 20000 });
    return res.data;
  } catch (err) {
    // some pages may redirect or block; return null
    return null;
  }
}

async function run() {
  console.log('Fetching Raga Surabhi index...');
  const idxHtml = await fetchIndex();
  const $ = cheerio.load(idxHtml);
  const links = [];
  $('a').each((i, el) => {
    const href = $(el).attr('href') || '';
    if (href.includes('/carnatic-music/raga/raga--')) {
      const text = $(el).text().trim();
      const slug = href.split('/').pop();
      links.push({ name: text, slug });
    }
  });

  console.log(`Found ${links.length} raga links in index.`);

  const out = {};
  for (let i = 0; i < links.length; i++) {
    const { name, slug } = links[i];
    const url = slugToUrl(slug);
    process.stdout.write(`(${i+1}/${links.length}) ${name} -> ${url} ... `);
    const html = await fetchRagaPage(url);
    if (!html) {
      console.log('failed');
      out[name] = { arohana: '', avarohana: '', notes: [], keerthanas: [], songs: [] };
    } else {
      const { arohana, avarohana } = extractAroAv(html);
      console.log('ok');
      out[name] = { arohana: arohana || '', avarohana: avarohana || '', notes: [], keerthanas: [], songs: [] };
    }

    // polite delay
    await sleep(500);
  }

  // previously wrote to `raga_meta_fetched.json` (removed). Keep outputting to `melakarta_meta.json` when rerunning the fetch.
  const dest = path.join(__dirname, '..', 'src', 'data', 'melakarta_meta.json');
  fs.writeFileSync(dest, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote', dest);
}

if (require.main === module) {
  run().catch((e) => {
    console.error('Error:', e && e.message);
    process.exit(1);
  });
}
