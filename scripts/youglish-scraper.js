/**
 * YouGlish에서 YouTube 자막 기반 예문 자동 수집
 * Puppeteer를 사용해 브라우저 자동화
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORDS_PATH = path.join(__dirname, '../public/words.json');

// YouGlish API 엔드포인트 (역엔지니어링)
const YOUGLISH_API = 'https://youglish.com/api/v1/videos';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchYouglishExamples(word) {
  try {
    const params = new URLSearchParams({
      q: word,
      corpus: 'english',
      region: 'us',
      textsearch: word,
      lang: 'en'
    });

    const response = await fetch(`${YOUGLISH_API}?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) return null;
    const data = await response.json();

    if (!data.videos || data.videos.length === 0) return null;

    // 첫 번째 비디오의 자막에서 문장 추출
    const video = data.videos[0];
    const subtitle = video.subtitles?.[0];

    if (!subtitle) return null;

    // YouGlish에서 해당 단어가 있는 타임스탬프의 텍스트를 반환
    return subtitle.content || null;
  } catch (err) {
    console.log(`⚠️  YouGlish API 오류 (${word}): ${err.message}`);
    return null;
  }
}

async function enhanceWordsWithYouglish() {
  console.log('📺 Starting YouGlish example collection...\n');

  // 현재 words.json 로드
  const wordsData = JSON.parse(fs.readFileSync(WORDS_PATH, 'utf-8'));
  let updated = 0;

  for (let i = 0; i < wordsData.length; i++) {
    const word = wordsData[i];

    // 이미 좋은 예문이 있으면 스킵
    if (word.example && !word.example.includes('This is an example')) {
      continue;
    }

    try {
      const youglishExample = await fetchYouglishExamples(word.word);

      if (youglishExample) {
        word.example = youglishExample.trim();
        updated++;
        process.stdout.write(`\r✅ Updated: ${updated}/${wordsData.length}`);
      }

      // API Rate limiting (YouGlish는 제한이 있음)
      await delay(500);
    } catch (err) {
      console.error(`\n❌ Error processing "${word.word}":`, err.message);
    }
  }

  console.log(`\n\n📝 Total examples updated: ${updated}`);

  // 업데이트된 데이터 저장
  fs.writeFileSync(WORDS_PATH, JSON.stringify(wordsData, null, 2));
  console.log(`✅ Saved to: ${WORDS_PATH}`);
}

enhanceWordsWithYouglish().catch(console.error);
