import './style.css'

class VocabularyApp {
  constructor() {
    this.words = this.loadWords()
    this.dictationData = this.loadDictationData()
    this.character = this.loadCharacter()
    this.currentCategory = 'all'
    this.currentView = 'vocabulary'
    this.currentTab = 'list'
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.render()
  }

  setupEventListeners() {
    document.getElementById('addWordBtn')?.addEventListener('click', () => this.showAddModal())
    document.getElementById('addWordForm')?.addEventListener('submit', (e) => this.handleAddWord(e))
    document.getElementById('closeModal')?.addEventListener('click', () => this.closeModal())
    document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
      this.currentCategory = e.target.value
      this.render()
    })
    document.getElementById('quizBtn')?.addEventListener('click', () => this.startQuiz())
    document.getElementById('autoFillBtn')?.addEventListener('click', (e) => {
      e.preventDefault()
      this.autoFillWordInfo()
    })

    document.getElementById('vocabTab')?.addEventListener('click', () => {
      this.currentView = 'vocabulary'
      this.currentTab = 'list'
      this.render()
    })
    document.getElementById('dictationTab')?.addEventListener('click', () => {
      this.currentView = 'dictation'
      this.render()
    })
    document.getElementById('characterTab')?.addEventListener('click', () => {
      this.currentView = 'character'
      this.render()
    })
  }

  loadWords() {
    const stored = localStorage.getItem('vocabularyWords')
    if (stored) return JSON.parse(stored)

    const initialWords = [
      { id: 1, word: 'infrastructure', pos: '명사', meaning: '기간 시설, 인프라', englishMeaning: 'the basic systems, services, and facilities needed for a country or organization to function properly', ipa: '/ˈɪnfrəˌstrʌktʃər/', category: 'Business', example: 'Modern infrastructure is essential for economic development.', isLearned: false, createdAt: new Date().toISOString() },
      { id: 2, word: 'rollout', pos: '명사', meaning: '(첫) 출시, 본격적인 전개', englishMeaning: 'the process of introducing something new, especially a product or service', ipa: '/ˈroʊl.aʊt/', category: 'Business', example: 'The new product rollout was successful and exceeded expectations.', isLearned: false, createdAt: new Date().toISOString() },
      { id: 3, word: 'cooperation', pos: '명사', meaning: '협력, 협조', englishMeaning: 'the action or process of working together to the same end', ipa: '/koʊ.ɑpəˈreɪ.ʃən/', category: 'Business', example: 'Cooperation between teams is crucial for project success.', isLearned: false, createdAt: new Date().toISOString() },
      { id: 4, word: 'delivery', pos: '명사', meaning: '인도, 납품, 배달', englishMeaning: 'the action of delivering letters, packages, or goods', ipa: '/dɪˈlɪv.ər.i/', category: 'Business', example: 'Fast delivery is one of the key features of our service.', isLearned: false, createdAt: new Date().toISOString() },
      { id: 5, word: 'institute', pos: '명사', meaning: '기관, 협회, 연구소', englishMeaning: 'an organization founded for a particular purpose', ipa: '/ˈɪn.stɪ.tut/', category: 'Business', example: 'The research institute conducts groundbreaking studies.', isLearned: false, createdAt: new Date().toISOString() },
      { id: 6, word: 'strategically', pos: '부사', meaning: '전략적으로', englishMeaning: 'in a way that is carefully planned and designed to accomplish a particular goal', ipa: '/strəˈtɪdʒ.ɪ.kəl.i/', category: 'Business', example: 'The company strategically positioned itself in the market.', isLearned: false, createdAt: new Date().toISOString() },
      { id: 7, word: 'academic', pos: '형용사', meaning: '학문적인, 대학의', englishMeaning: 'relating to education and scholarship', ipa: '/ˌæk.əˈdem.ɪk/', category: 'Business', example: 'Academic research requires rigorous methodology and peer review.', isLearned: false, createdAt: new Date().toISOString() },
      { id: 8, word: 'establishment', pos: '명사', meaning: '설립, 수립', englishMeaning: 'the action or process of establishing or starting something', ipa: '/ɪˈstæb.lɪʃ.mənt/', category: 'Business', example: 'The establishment of new policies helped improve efficiency.', isLearned: false, createdAt: new Date().toISOString() },
    ]
    this.saveWords(initialWords)
    return initialWords
  }

  loadDictationData() {
    const stored = localStorage.getItem('dictationData')
    return stored ? JSON.parse(stored) : {
      records: {},
      stats: {}
    }
  }

  loadCharacter() {
    const stored = localStorage.getItem('character')
    return stored ? JSON.parse(stored) : {
      name: 'Vocabi',
      level: 1,
      exp: 0,
      totalSuccess: 0,
      streak: 0,
      badges: []
    }
  }

  saveWords(words = this.words) {
    localStorage.setItem('vocabularyWords', JSON.stringify(words))
  }

  saveDictationData() {
    localStorage.setItem('dictationData', JSON.stringify(this.dictationData))
  }

  saveCharacter() {
    localStorage.setItem('character', JSON.stringify(this.character))
  }

  render() {
    if (this.currentView === 'vocabulary') {
      this.renderVocabulary()
    } else if (this.currentView === 'dictation') {
      this.renderDictationTab()
    } else if (this.currentView === 'character') {
      this.renderCharacterTab()
    }
  }

  renderVocabulary() {
    document.body.innerHTML = `
      <div class="min-h-screen flex flex-col max-w-md mx-auto bg-gray-50">
        ${this.renderHeader()}
        ${this.renderTabs()}
        <main class="flex-1 px-4 py-4 overflow-y-auto pb-20">
          <div id="contentArea"></div>
        </main>
        ${this.renderAddModal()}
      </div>
    `
    this.setupEventListeners()
    this.renderWordList()
  }

  renderHeader() {
    return `
      <header class="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div class="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">heekiword</h1>
            <p class="text-xs text-gray-500 mt-1">단어 수집가를 위한 학습장</p>
          </div>
          <div class="flex gap-2">
            <button id="quizBtn" class="bg-orange-500 hover:bg-orange-600 text-white rounded-full p-3 transition-all active:scale-95 shadow-lg" title="퀴즈">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button id="addWordBtn" class="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 transition-all active:scale-95 shadow-lg">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
        <div class="px-4 pb-4 grid grid-cols-2 gap-3">
          <div class="bg-blue-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-600 mb-1">전체</p>
            <p class="text-2xl font-bold text-blue-600" id="totalWords">${this.words.length}</p>
          </div>
          <div class="bg-green-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-600 mb-1">학습완료</p>
            <p class="text-2xl font-bold text-green-600" id="learnedWords">${this.words.filter(w => w.isLearned).length}</p>
          </div>
        </div>
        <div class="px-4 pb-4">
          <select id="categoryFilter" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">전체</option>
            ${[...new Set(this.words.map(w => w.category))].sort().map(cat => `<option value="${cat}">${cat}</option>`).join('')}
          </select>
        </div>
      </header>
    `
  }

  renderTabs() {
    return `
      <div class="sticky top-24 z-30 bg-white border-b border-gray-200 flex">
        <button id="vocabTab" class="flex-1 py-3 px-4 font-medium border-b-2 border-blue-500 text-blue-600 text-center">
          📚 단어장
        </button>
        <button id="dictationTab" class="flex-1 py-3 px-4 font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 text-center">
          ✏️ 필사
        </button>
        <button id="characterTab" class="flex-1 py-3 px-4 font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 text-center">
          🐣 캐릭터
        </button>
      </div>
    `
  }

  renderWordList() {
    const filtered = this.words.filter(w =>
      this.currentCategory === 'all' || w.category === this.currentCategory
    )
    const content = document.getElementById('contentArea')

    if (!content) return

    if (filtered.length === 0) {
      content.innerHTML = '<div class="text-center py-8 text-gray-400">아직 단어가 없습니다.</div>'
      return
    }

    content.innerHTML = filtered.map(word => `
      <div class="bg-white rounded-lg shadow-sm p-4 mb-3 border-l-4 ${word.isLearned ? 'border-green-500 opacity-60' : 'border-blue-500'} transition-all">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <h3 class="font-bold text-lg ${word.isLearned ? 'line-through text-gray-400' : 'text-gray-900'}">${this.escapeHtml(word.word)}</h3>
              <span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">${this.escapeHtml(word.pos)}</span>
            </div>
            ${word.ipa ? `<p class="text-gray-500 text-xs mb-2">${this.escapeHtml(word.ipa)}</p>` : ''}
            <div class="mb-2 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition" onclick="app.toggleMeaning(${word.id})">
              <p class="text-gray-700 text-sm mb-2 font-medium">${this.escapeHtml(word.englishMeaning || word.meaning)}</p>
              <p class="text-xs text-gray-500 text-center">💬 뜻을 클릭하면 한글/영문 전환</p>
            </div>
            <div id="meaning-${word.id}" class="hidden text-gray-600 text-sm mb-2 p-2 bg-gray-50 rounded">
              ${this.escapeHtml(word.meaning)}
            </div>
            <div class="flex gap-2">
              <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">${this.escapeHtml(word.category)}</span>
            </div>
            ${word.example ? `<p class="text-gray-500 text-xs italic mt-2">예: ${this.escapeHtml(word.example)}</p>` : ''}
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <button onclick="app.toggleLearned(${word.id})" class="p-2 rounded-lg ${word.isLearned ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'} hover:opacity-80 transition">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </button>
            <button onclick="app.deleteWord(${word.id})" class="p-2 rounded-lg bg-red-100 text-red-600 hover:opacity-80 transition">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `).join('')
  }

  renderAddModal() {
    return `
      <div id="addModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
        <div class="w-full bg-white rounded-t-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-900">새 단어 추가</h2>
            <button id="closeModal" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form id="addWordForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">단어</label>
              <div class="flex gap-2">
                <input type="text" id="wordInput" placeholder="영어 단어를 입력하세요" class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" required>
                <button type="button" id="autoFillBtn" class="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-3 rounded-lg transition-all active:scale-95 whitespace-nowrap">자동 조회</button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">영문 뜻</label>
              <textarea id="englishMeaningInput" placeholder="영어로 뜻을 설명해주세요" rows="2" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">뜻 (한글)</label>
              <textarea id="meaningInput" placeholder="단어의 의미를 입력하세요" rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" required></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">발음기호 (IPA)</label>
              <input type="text" id="ipaInput" placeholder="예: /ˈɪnfrəˌstrʌktʃər/" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">품사</label>
              <select id="posInput" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="명사">명사</option>
                <option value="동사">동사</option>
                <option value="형용사">형용사</option>
                <option value="부사">부사</option>
                <option value="전치사">전치사</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
              <input type="text" id="categoryInput" placeholder="예: 비즈니스, 일상" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">예시</label>
              <textarea id="exampleInput" placeholder="단어를 사용한 예문을 입력하세요" rows="2" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"></textarea>
            </div>
            <div class="pt-4 space-y-2">
              <button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-all active:scale-95">추가하기</button>
            </div>
          </form>
        </div>
      </div>
      <style>
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      </style>
    `
  }

  renderDictationTab() {
    document.body.innerHTML = `
      <div class="min-h-screen flex flex-col max-w-md mx-auto bg-gray-50">
        ${this.renderDictationHeader()}
        ${this.renderDictationTabs()}
        <main class="flex-1 px-4 py-4 overflow-y-auto pb-20">
          <div id="dictationContent"></div>
        </main>
      </div>
    `
    this.setupEventListeners()
    this.renderDictationChallenge()
  }

  renderDictationHeader() {
    const today = new Date().toISOString().split('T')[0]
    const todayRecord = this.dictationData.records[today]

    return `
      <header class="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div class="px-4 py-4">
          <h1 class="text-2xl font-bold text-gray-900">✏️ 필사 도전</h1>
          <p class="text-xs text-gray-500 mt-1">매일 예문을 필사하고 스탬프를 모으세요</p>
        </div>
        <div class="px-4 pb-4 grid grid-cols-3 gap-2">
          <div class="bg-orange-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-600">오늘</p>
            <p class="text-lg font-bold ${todayRecord?.success ? 'text-orange-600' : 'text-gray-400'}">${todayRecord?.success ? '✅' : '⭕'}</p>
          </div>
          <div class="bg-blue-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-600">연속</p>
            <p class="text-lg font-bold text-blue-600">${this.character.streak}일</p>
          </div>
          <div class="bg-purple-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-600">성공</p>
            <p class="text-lg font-bold text-purple-600">${this.character.totalSuccess}회</p>
          </div>
        </div>
      </header>
    `
  }

  renderDictationTabs() {
    return `
      <div class="sticky top-24 z-30 bg-white border-b border-gray-200 flex">
        <button id="vocabTab" class="flex-1 py-3 px-4 font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 text-center">
          📚 단어장
        </button>
        <button id="dictationTab" class="flex-1 py-3 px-4 font-medium border-b-2 border-orange-500 text-orange-600 text-center">
          ✏️ 필사
        </button>
        <button id="characterTab" class="flex-1 py-3 px-4 font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 text-center">
          🐣 캐릭터
        </button>
      </div>
    `
  }

  renderDictationChallenge() {
    const today = new Date().toISOString().split('T')[0]
    const todayRecord = this.dictationData.records[today]

    if (todayRecord?.success) {
      document.getElementById('dictationContent').innerHTML = `
        <div class="text-center py-12">
          <div class="text-6xl mb-4">🎉</div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">완벽했어요!</h2>
          <p class="text-gray-600 mb-4">내일 다시 도전하세요!</p>
          <div class="bg-green-50 rounded-lg p-4 mb-4">
            <p class="text-sm text-green-700">✨ You nailed it! Keep up the great streak! ✨</p>
          </div>
        </div>
      `
      return
    }

    const randomWord = this.words[Math.floor(Math.random() * this.words.length)]
    if (!randomWord.example) {
      document.getElementById('dictationContent').innerHTML = `
        <div class="text-center py-8 text-gray-400">예문이 없는 단어가 있습니다.</div>
      `
      return
    }

    document.getElementById('dictationContent').innerHTML = `
      <div class="py-4">
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 class="text-xl font-bold text-gray-900 mb-2">${this.escapeHtml(randomWord.word)}</h2>
          <p class="text-gray-500 text-sm mb-4">${this.escapeHtml(randomWord.ipa)}</p>

          <div class="bg-gray-100 rounded-lg p-6 mb-6 relative min-h-24 flex items-center justify-center">
            <p class="text-gray-300 text-center text-lg leading-relaxed font-light tracking-wide">
              ${this.escapeHtml(randomWord.example)}
            </p>
          </div>

          <form id="dictationForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">위 문장을 그대로 따라 쓰세요</label>
              <textarea id="dictationInput" placeholder="예문을 입력하세요..." rows="4" class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"></textarea>
              <div id="dictationFeedback" class="text-xs mt-2"></div>
            </div>

            <button type="submit" class="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-all">
              확인
            </button>
          </form>
        </div>
      </div>
    `

    const input = document.getElementById('dictationInput')
    input.addEventListener('input', (e) => this.checkDictationRealtime(e, randomWord.example))
    document.getElementById('dictationForm').addEventListener('submit', (e) => this.submitDictation(e, randomWord))
  }

  checkDictationRealtime(e, correct) {
    const input = e.target.value
    const feedback = document.getElementById('dictationFeedback')

    if (!input) {
      feedback.innerHTML = ''
      return
    }

    let html = '<div class="space-y-1">'
    for (let i = 0; i < Math.max(input.length, correct.length); i++) {
      if (input[i] === correct[i]) {
        html += `<span class="text-green-600">✓ ${this.escapeHtml(input[i] || '_')}</span> `
      } else if (!input[i]) {
        html += `<span class="text-gray-400">_ </span>`
      } else {
        html += `<span class="text-red-600">✗ ${this.escapeHtml(input[i])}</span> `
      }
    }
    html += '</div>'
    feedback.innerHTML = html
  }

  submitDictation(e, word) {
    e.preventDefault()
    const input = document.getElementById('dictationInput').value.trim()
    const correct = word.example.trim()

    if (input === correct) {
      const today = new Date().toISOString().split('T')[0]
      this.dictationData.records[today] = { success: true, word: word.word }

      const month = today.substring(0, 7)
      if (!this.dictationData.stats[month]) {
        this.dictationData.stats[month] = { successDays: 0, totalAttempts: 0 }
      }
      this.dictationData.stats[month].successDays++
      this.dictationData.stats[month].totalAttempts++

      this.character.totalSuccess++
      this.character.streak++
      this.character.exp += 10
      if (this.character.exp >= 100) {
        this.character.level++
        this.character.exp = 0
        this.updateBadges()
      }

      this.saveDictationData()
      this.saveCharacter()

      alert('🎊 Perfect! You did it! Keep it up! 🌟')
      this.render()
    } else {
      const similarity = this.calculateSimilarity(input, correct)
      alert(`❌ Not quite. Keep trying! Accuracy: ${similarity}%`)
    }
  }

  renderCharacterTab() {
    document.body.innerHTML = `
      <div class="min-h-screen flex flex-col max-w-md mx-auto bg-gray-50">
        ${this.renderCharacterHeader()}
        ${this.renderCharacterTabs()}
        <main class="flex-1 px-4 py-4 overflow-y-auto pb-20">
          <div id="characterContent"></div>
        </main>
      </div>
    `
    this.setupEventListeners()
    this.renderCharacterContent()
  }

  renderCharacterHeader() {
    return `
      <header class="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div class="px-4 py-4">
          <h1 class="text-2xl font-bold text-gray-900">🐣 캐릭터</h1>
          <p class="text-xs text-gray-500 mt-1">매일 필사하면서 캐릭터를 성장시키세요</p>
        </div>
      </header>
    `
  }

  renderCharacterTabs() {
    return `
      <div class="sticky top-24 z-30 bg-white border-b border-gray-200 flex">
        <button id="vocabTab" class="flex-1 py-3 px-4 font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 text-center">
          📚 단어장
        </button>
        <button id="dictationTab" class="flex-1 py-3 px-4 font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 text-center">
          ✏️ 필사
        </button>
        <button id="characterTab" class="flex-1 py-3 px-4 font-medium border-b-2 border-purple-500 text-purple-600 text-center">
          🐣 캐릭터
        </button>
      </div>
    `
  }

  renderCharacterContent() {
    const content = document.getElementById('characterContent')
    const characterStage = this.getCharacterStage()

    content.innerHTML = `
      <div class="py-6">
        <div class="bg-white rounded-lg shadow-sm p-8 text-center mb-6">
          <div class="text-6xl mb-4">${characterStage.emoji}</div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">${this.character.name}</h2>
          <p class="text-gray-600 mb-4">Lv. ${this.character.level} ${characterStage.name}</p>

          <div class="bg-gray-100 rounded-full h-4 overflow-hidden mb-4">
            <div class="bg-gradient-to-r from-purple-400 to-pink-500 h-full" style="width: ${this.character.exp}%"></div>
          </div>
          <p class="text-xs text-gray-500 mb-6">${this.character.exp}/100 EXP</p>

          <div class="space-y-2">
            <div class="bg-blue-50 rounded-lg p-3">
              <p class="text-xs text-gray-600">Total Success</p>
              <p class="text-2xl font-bold text-blue-600">${this.character.totalSuccess} 🎯</p>
            </div>
            <div class="bg-orange-50 rounded-lg p-3">
              <p class="text-xs text-gray-600">Current Streak</p>
              <p class="text-2xl font-bold text-orange-600">${this.character.streak} 🔥</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 class="font-bold text-gray-900 mb-4">🏆 Badges</h3>
          <div class="grid grid-cols-3 gap-3">
            ${this.character.badges.map(b => `<div class="text-center p-3 bg-yellow-50 rounded-lg">${b.emoji} ${b.name}</div>`).join('')}
            ${this.character.badges.length === 0 ? '<p class="text-xs text-gray-400">배지를 획득하면 여기에 표시됩니다</p>' : ''}
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="font-bold text-gray-900 mb-4">📊 Monthly Stats</h3>
          ${this.renderMonthlyStats()}
        </div>
      </div>
    `
  }

  renderMonthlyStats() {
    const months = Object.keys(this.dictationData.stats).sort().reverse().slice(0, 3)

    if (months.length === 0) {
      return '<p class="text-xs text-gray-400">아직 필사 기록이 없습니다.</p>'
    }

    return months.map(month => {
      const stats = this.dictationData.stats[month]
      const [year, monthNum] = month.split('-')
      return `
        <div class="mb-3 pb-3 border-b last:border-b-0">
          <p class="text-sm font-medium text-gray-900 mb-2">${year}년 ${monthNum}월</p>
          <div class="flex justify-between text-xs text-gray-600">
            <span>성공: ${stats.successDays}일</span>
            <span>시도: ${stats.totalAttempts}일</span>
          </div>
        </div>
      `
    }).join('')
  }

  getCharacterStage() {
    const level = this.character.level
    if (level < 3) return { emoji: '🥚', name: 'Egg' }
    if (level < 6) return { emoji: '🐣', name: 'Baby Vocabi' }
    if (level < 10) return { emoji: '🐥', name: 'Growing Vocabi' }
    if (level < 20) return { emoji: '🦆', name: 'Adult Vocabi' }
    return { emoji: '🦅', name: 'Master Vocabi' }
  }

  updateBadges() {
    if (this.character.totalSuccess === 7 && !this.character.badges.find(b => b.id === 'week')) {
      this.character.badges.push({ id: 'week', name: '7일 챌린지', emoji: '🌟' })
    }
    if (this.character.totalSuccess === 30 && !this.character.badges.find(b => b.id === 'month')) {
      this.character.badges.push({ id: 'month', name: '30일 마스터', emoji: '💎' })
    }
    if (this.character.totalSuccess === 100 && !this.character.badges.find(b => b.id === 'century')) {
      this.character.badges.push({ id: 'century', name: '100일 전설', emoji: '👑' })
    }
  }

  toggleMeaning(id) {
    const meaningDiv = document.getElementById(`meaning-${id}`)
    if (meaningDiv) meaningDiv.classList.toggle('hidden')
  }

  toggleLearned(id) {
    const word = this.words.find(w => w.id === id)
    if (word) {
      word.isLearned = !word.isLearned
      this.saveWords()
      this.render()
    }
  }

  deleteWord(id) {
    if (confirm('이 단어를 삭제하시겠습니까?')) {
      this.words = this.words.filter(w => w.id !== id)
      this.saveWords()
      this.render()
    }
  }

  showAddModal() {
    const modal = document.getElementById('addModal')
    if (modal) modal.classList.remove('hidden')
  }

  closeModal() {
    const modal = document.getElementById('addModal')
    if (modal) modal.classList.add('hidden')
    const form = document.getElementById('addWordForm')
    if (form) form.reset()
  }

  handleAddWord(e) {
    e.preventDefault()
    const word = document.getElementById('wordInput').value.trim()
    const englishMeaning = document.getElementById('englishMeaningInput').value.trim()
    const meaning = document.getElementById('meaningInput').value.trim()
    const ipa = document.getElementById('ipaInput').value.trim()
    const pos = document.getElementById('posInput').value.trim() || '명사'
    const category = document.getElementById('categoryInput').value.trim() || 'General'
    const example = document.getElementById('exampleInput').value.trim()

    if (!word || !meaning) {
      alert('단어와 뜻은 필수입니다.')
      return
    }

    this.words.push({
      id: Date.now(),
      word,
      englishMeaning,
      meaning,
      ipa,
      pos,
      category,
      example,
      createdAt: new Date().toISOString(),
      isLearned: false,
    })

    this.saveWords()
    this.closeModal()
    this.currentView = 'vocabulary'
    this.currentTab = 'list'
    this.render()
  }

  async autoFillWordInfo() {
    const word = document.getElementById('wordInput').value.trim()
    if (!word) {
      alert('단어를 입력하세요.')
      return
    }

    const btn = document.getElementById('autoFillBtn')
    const originalText = btn.textContent
    btn.textContent = '조회 중...'
    btn.disabled = true

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`)
      if (!response.ok) throw new Error('단어를 찾을 수 없습니다.')

      const data = await response.json()
      const entry = data[0]

      const phonetic = entry.phonetics?.[0]?.text || entry.phonetic || ''
      const meanings = entry.meanings || []
      const definitions = meanings.flatMap(m => m.definitions || [])
      const englishMeaning = definitions[0]?.definition || meanings[0]?.definitions[0]?.definition || ''
      const example = definitions[0]?.example || meanings[0]?.definitions[0]?.example || ''

      document.getElementById('englishMeaningInput').value = englishMeaning
      document.getElementById('ipaInput').value = phonetic
      if (example) {
        document.getElementById('exampleInput').value = example
      }

      alert('✅ 자동 조회 완료! 한글 뜻을 입력해주세요.')
    } catch (err) {
      alert('❌ 단어를 찾을 수 없습니다. 다시 시도해주세요.')
    } finally {
      btn.textContent = originalText
      btn.disabled = false
    }
  }

  startQuiz() {
    if (this.words.length < 2) {
      alert('퀴즈를 하려면 최소 2개 이상의 단어가 필요합니다.')
      return
    }
    this.quizIndex = 0
    this.quizScore = 0
    this.currentView = 'quiz'
    this.generateQuiz()
    this.renderQuiz()
  }

  generateQuiz() {
    const shuffled = [...this.words].sort(() => Math.random() - 0.5)
    this.quizQuestions = shuffled.map(correct => {
      const options = [correct]
      const others = this.words.filter(w => w.id !== correct.id)
      while (options.length < 4 && others.length > 0) {
        const idx = Math.floor(Math.random() * others.length)
        options.push(others[idx])
        others.splice(idx, 1)
      }
      options.sort(() => Math.random() - 0.5)
      return { correct, options: options.map(o => o.meaning) }
    })
  }

  renderQuiz() {
    if (this.quizIndex >= this.quizQuestions.length) {
      document.body.innerHTML = `
        <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 max-w-md mx-auto">
          <div class="text-6xl mb-4">🎉</div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
          <p class="text-gray-600 mb-6">
            <span class="text-3xl font-bold text-blue-600">${this.quizScore}</span> / ${this.quizQuestions.length}
          </p>
          <button onclick="app.currentView = 'vocabulary'; app.render()" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all">
            돌아가기
          </button>
        </div>
      `
      return
    }

    const q = this.quizQuestions[this.quizIndex]
    const progress = this.quizIndex + 1

    document.body.innerHTML = `
      <div class="min-h-screen flex flex-col max-w-md mx-auto bg-gray-50">
        <header class="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm p-4">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-medium text-gray-600">Progress: ${progress}/${this.quizQuestions.length}</span>
            <button onclick="app.currentView = 'vocabulary'; app.render()" class="text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-blue-500 h-2 rounded-full transition-all" style="width: ${(progress / this.quizQuestions.length) * 100}%"></div>
          </div>
        </header>
        <main class="flex-1 px-4 py-6">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <p class="text-gray-600 text-sm mb-4">Select the meaning:</p>
            <h2 class="text-3xl font-bold text-gray-900 mb-6">${this.escapeHtml(q.correct.word)}</h2>
            <div class="space-y-3" id="quizOptions">
              ${q.options.map(meaning => `
                <button onclick="app.answerQuiz('${meaning}', '${q.correct.meaning}')" class="w-full p-4 bg-gray-100 hover:bg-gray-200 text-left rounded-lg font-medium text-gray-900 transition-all border-2 border-transparent hover:border-blue-400">
                  ${this.escapeHtml(meaning)}
                </button>
              `).join('')}
            </div>
          </div>
        </main>
      </div>
    `
  }

  answerQuiz(selected, correct) {
    if (selected === correct) this.quizScore++
    this.quizIndex++
    this.renderQuiz()
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    if (longer.length === 0) return 100
    const editDistance = this.getEditDistance(longer, shorter)
    return Math.round((1 - editDistance / longer.length) * 100)
  }

  getEditDistance(s1, s2) {
    const costs = []
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j
        } else if (j > 0) {
          let newValue = costs[j - 1]
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
          }
          costs[j - 1] = lastValue
          lastValue = newValue
        }
      }
      if (i > 0) costs[s2.length] = lastValue
    }
    return costs[s2.length]
  }

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}

window.app = new VocabularyApp()
