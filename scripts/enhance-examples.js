/**
 * Wiktionary API를 사용해 예문 개선
 * 더 정확하고 자세한 정의와 예문 수집
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORDS_PATH = path.join(__dirname, '../public/words.json');

const WIKTIONARY_API = 'https://en.wiktionary.org/api/rest_v1/page/definition/';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWiktionaryData(word) {
  try {
    const response = await fetch(`${WIKTIONARY_API}${word.toLowerCase()}`);
    if (!response.ok) return null;

    const data = await response.json();

    if (!data.en) return null;

    // 정의와 예문 추출
    let definition = '';
    let example = '';

    for (const entry of data.en) {
      if (entry.definitions && entry.definitions.length > 0) {
        const def = entry.definitions[0];
        definition = def.definition || '';

        if (def.examples && def.examples.length > 0) {
          example = def.examples[0].text || '';
          break;
        }
      }
    }

    return { definition, example };
  } catch (err) {
    return null;
  }
}

async function enhanceWords() {
  console.log('📚 Enhancing word examples from Wiktionary...\n');

  const wordsData = JSON.parse(fs.readFileSync(WORDS_PATH, 'utf-8'));
  let updated = 0;

  for (let i = 0; i < wordsData.length; i++) {
    const word = wordsData[i];

    try {
      const wiktData = await fetchWiktionaryData(word.word);

      if (wiktData?.example) {
        word.example = wiktData.example.trim();
        updated++;
      }

      if (wiktData?.definition && word.meaning.length < 100) {
        word.meaning = `${word.word} (${wiktData.definition})`;
      }

      process.stdout.write(`\r✅ Enhanced: ${i + 1}/${wordsData.length}`);
      await delay(300);
    } catch (err) {
      console.error(`\nError: ${err.message}`);
    }
  }

  console.log(`\n\n📝 Total examples updated: ${updated}`);
  fs.writeFileSync(WORDS_PATH, JSON.stringify(wordsData, null, 2));
  console.log(`✅ Saved!`);
}

enhanceWords().catch(console.error);
