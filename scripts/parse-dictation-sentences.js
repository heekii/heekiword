import fs from 'fs'
import path from 'path'

const filesDir = path.resolve('./files')
const publicDir = path.resolve('./public')

function parseMarkdownTable(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  const sentences = []
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
          const [num, word, sentence] = parts

          // 숫자로 시작하면 유효한 행
          if (!isNaN(parseInt(num))) {
            sentences.push({
              word: word.toLowerCase(),
              sentence: sentence,
              category: getCategory(filePath)
            })
          }
        }
      }

      // 테이블 끝 감지
      if (line.trim() === '' && inTable && sentences.length > 0) {
        // 테이블이 끝났을 수 있음
      }
    }
  }

  return sentences
}

function getCategory(filePath) {
  if (filePath.includes('ted')) return 'TED'
  if (filePath.includes('movie')) return 'Movie'
  if (filePath.includes('business')) return 'Business'
  return 'General'
}

function main() {
  console.log('🔄 Parsing dictation sentence files...')

  const mdFiles = ['ted_sentences.md', 'movie_sentences.md', 'business_sentences.md']
  let allSentences = []

  for (const file of mdFiles) {
    const filePath = path.join(filesDir, file)
    console.log(`📖 Reading ${file}...`)
    const sentences = parseMarkdownTable(filePath)
    console.log(`  ✅ Found ${sentences.length} sentences`)
    allSentences = allSentences.concat(sentences)
  }

  console.log(`\n📚 Total sentences: ${allSentences.length}`)

  // 카테고리별 분류
  const byCategory = {
    TED: allSentences.filter(s => s.category === 'TED'),
    Movie: allSentences.filter(s => s.category === 'Movie'),
    Business: allSentences.filter(s => s.category === 'Business')
  }

  console.log(`\n📊 By Category:`)
  console.log(`  TED: ${byCategory.TED.length}`)
  console.log(`  Movie: ${byCategory.Movie.length}`)
  console.log(`  Business: ${byCategory.Business.length}`)

  const outputPath = path.join(publicDir, 'dictation_sentences.json')
  fs.writeFileSync(outputPath, JSON.stringify(allSentences, null, 2))
  console.log(`\n✨ Complete! Saved to ${outputPath}`)
}

main()
