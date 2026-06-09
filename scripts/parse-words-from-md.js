import fs from 'fs'
import path from 'path'

const filesDir = path.resolve('./files')
const publicDir = path.resolve('./public')

async function parseMarkdownTable(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  const words = []
  let inTable = false

  for (const line of lines) {
    // 테이블 시작 감지
    if (line.includes('| # |') || inTable) {
      inTable = true

      // 구분선 또는 헤더 건너뛰기
      if (line.includes('---|') || line.includes('| #')) {
        continue
      }

      // 테이블 행 파싱
      if (line.startsWith('|') && line.endsWith('|')) {
        const parts = line.split('|').map(p => p.trim()).filter(p => p && p !== '#')

        if (parts.length >= 3) {
          const [num, word, pos, korean] = parts

          // 숫자로 시작하면 유효한 행
          if (!isNaN(parseInt(num))) {
            words.push({
              word: word.toLowerCase(),
              pos,
              meaning: korean,
              category: getCategory(filePath)
            })
          }
        }
      }

      // 테이블 끝 감지
      if (line.trim() === '' && inTable && words.length > 0) {
        // 테이블이 끝났을 수 있음
      }
    }
  }

  return words
}

function getCategory(filePath) {
  if (filePath.includes('ted')) return 'TED'
  if (filePath.includes('movie')) return 'Movie'
  if (filePath.includes('business')) return 'Business'
  return 'General'
}

async function fetchWordInfo(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`)
    if (!response.ok) {
      console.log(`⚠️  Not found: ${word}`)
      return null
    }

    const data = await response.json()
    if (!Array.isArray(data) || data.length === 0) return null

    const entry = data[0]

    // IPA 발음 기호
    const ipa = entry.phonetics?.[0]?.text || entry.phonetic || ''

    // 예문 추출
    let example = ''
    const meanings = entry.meanings || []
    for (const meaning of meanings) {
      const definitions = meaning.definitions || []
      if (definitions.length > 0 && definitions[0].example) {
        example = definitions[0].example
        break
      }
    }

    // 없으면 첫 번째 정의 사용
    if (!example && meanings.length > 0 && meanings[0].definitions?.length > 0) {
      example = `This word "${word}" means: ${meanings[0].definitions[0].definition}`
    }

    return {
      ipa: ipa || `/${word}/`,
      example: example || `Example sentence with ${word}.`,
      englishMeaning: meanings[0]?.definitions?.[0]?.definition || ''
    }
  } catch (error) {
    console.log(`❌ Error fetching ${word}:`, error.message)
    return null
  }
}

async function main() {
  console.log('🔄 Parsing markdown files...')

  const mdFiles = ['ted_words.md', 'movie_words.md', 'business_words.md']
  let allWords = []

  for (const file of mdFiles) {
    const filePath = path.join(filesDir, file)
    console.log(`📖 Reading ${file}...`)
    const words = await parseMarkdownTable(filePath)
    console.log(`  ✅ Found ${words.length} words`)
    allWords = allWords.concat(words)
  }

  console.log(`\n📚 Total words: ${allWords.length}`)
  console.log('🌐 Fetching word info from Dictionary API...')

  let processed = 0
  const enrichedWords = []

  for (const word of allWords) {
    processed++
    if (processed % 50 === 0) console.log(`  Progress: ${processed}/${allWords.length}`)

    const info = await fetchWordInfo(word.word)
    if (info) {
      enrichedWords.push({
        word: word.word,
        meaning: word.meaning,
        ipa: info.ipa,
        example: info.example,
        englishMeaning: info.englishMeaning,
        category: word.category,
        pos: word.pos
      })
    } else {
      enrichedWords.push({
        word: word.word,
        meaning: word.meaning,
        ipa: `/${word.word}/`,
        example: `Example sentence with ${word.word}.`,
        englishMeaning: word.meaning,
        category: word.category,
        pos: word.pos
      })
    }

    // API 속도 제한을 위해 대기
    await new Promise(r => setTimeout(r, 100))
  }

  const outputPath = path.join(publicDir, 'words.json')
  fs.writeFileSync(outputPath, JSON.stringify(enrichedWords, null, 2))
  console.log(`\n✨ Complete! Saved ${enrichedWords.length} words to ${outputPath}`)
}

main().catch(console.error)
