import './style.css'

class VocabularyApp {
  constructor() {
    this.words = this.loadWords()
    this.currentCategory = 'all'
    this.currentView = 'list'
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.render()
  }

  setupEventListeners() {
    document.getElementById('addWordBtn').addEventListener('click', () => this.showAddModal())
    document.getElementById('addWordForm').addEventListener('submit', (e) => this.handleAddWord(e))
    document.getElementById('closeModal').addEventListener('click', () => this.closeModal())
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
      this.currentCategory = e.target.value
      this.render()
    })
    document.getElementById('quizBtn')?.addEventListener('click', () => this.startQuiz())
    document.getElementById('backToListBtn')?.addEventListener('click', () => {
      this.currentView = 'list'
      this.render()
    })
  }

  loadWords() {
    const stored = localStorage.getItem('vocabularyWords')
    if (stored) return JSON.parse(stored)

    const initialWords = [
      { id: 1, word: 'infrastructure', pos: '명사', meaning: '기간 시설, 인프라', englishMeaning: 'the basic systems, services, and facilities needed for a country or organization to function properly', ipa: '/ˈɪnfrəˌstrʌktʃər/', category: 'Business', example: '', isLearned: false, createdAt: new Date().toISOString() },
      { id: 2, word: 'rollout', pos: '명사', meaning: '(첫) 출시, 본격적인 전개', englishMeaning: 'the process of introducing something new, especially a product or service', ipa: '/ˈroʊl.aʊt/', category: 'Business', example: '', isLearned: false, createdAt: new Date().toISOString() },
      { id: 3, word: 'cooperation', pos: '명사', meaning: '협력, 협조', englishMeaning: 'the action or process of working together to the same end', ipa: '/koʊ.ɑpəˈreɪ.ʃən/', category: 'Business', example: '', isLearned: false, createdAt: new Date().toISOString() },
      { id: 4, word: 'delivery', pos: '명사', meaning: '인도, 납품, 배달', englishMeaning: 'the action of delivering letters, packages, or goods', ipa: '/dɪˈlɪv.ər.i/', category: 'Business', example: '', isLearned: false, createdAt: new Date().toISOString() },
      { id: 5, word: 'institute', pos: '명사', meaning: '기관, 협회, 연구소', englishMeaning: 'an organization founded for a particular purpose', ipa: '/ˈɪn.stɪ.tut/', category: 'Business', example: '', isLearned: false, createdAt: new Date().toISOString() },
      { id: 6, word: 'strategically', pos: '부사', meaning: '전략적으로', englishMeaning: 'in a way that is carefully planned and designed to accomplish a particular goal', ipa: '/strəˈtɪdʒ.ɪ.kəl.i/', category: 'Business', example: '', isLearned: false, createdAt: new Date().toISOString() },
      { id: 7, word: 'academic', pos: '형용사', meaning: '학문적인, 대학의', englishMeaning: 'relating to education and scholarship', ipa: '/ˌæk.əˈdem.ɪk/', category: 'Business', example: '', isLearned: false, createdAt: new Date().toISOString() },
      { id: 8, word: 'establishment', pos: '명사', meaning: '설립, 수립', englishMeaning: 'the action or process of establishing or starting something', ipa: '/ɪˈstæb.lɪʃ.mənt/', category: 'Business', example: '', isLearned: false, createdAt: new Date().toISOString() },
    ]

    this.saveWords(initialWords)
    return initialWords
  }

  saveWords(words = this.words) {
    localStorage.setItem('vocabularyWords', JSON.stringify(words))
  }

  showAddModal() {
    document.getElementById('addModal').classList.remove('hidden')
  }

  closeModal() {
    document.getElementById('addModal').classList.add('hidden')
    document.getElementById('addWordForm').reset()
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
    this.render()
  }

  deleteWord(id) {
    if (confirm('이 단어를 삭제하시겠습니까?')) {
      this.words = this.words.filter(w => w.id !== id)
      this.saveWords()
      this.render()
    }
  }

  toggleLearned(id) {
    const word = this.words.find(w => w.id === id)
    if (word) {
      word.isLearned = !word.isLearned
      this.saveWords()
      this.render()
    }
  }

  getFilteredWords() {
    if (this.currentCategory === 'all') {
      return this.words
    }
    return this.words.filter(w => w.category === this.currentCategory)
  }

  getCategories() {
    const cats = new Set(this.words.map(w => w.category))
    return Array.from(cats).sort()
  }

  render() {
    if (this.currentView === 'quiz') {
      this.renderQuiz()
    } else if (this.currentView === 'dictation') {
      this.renderDictation()
    } else {
      this.renderStats()
      this.renderCategoryFilter()
      this.renderWordList()
    }
  }

  renderDictation() {
    const word = this.words.find(w => w.id === this.dictationWordId)
    const main = document.querySelector('main')
    if (!main || !word) return

    main.innerHTML = `
      <div class="py-4">
        <div class="mb-6">
          <button onclick="app.closeDictation()" class="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            목록으로 돌아가기
          </button>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 class="text-xl font-bold text-gray-900 mb-2">${this.escapeHtml(word.word)}</h2>
          <p class="text-gray-500 text-sm mb-4">${this.escapeHtml(word.ipa)}</p>

          <div class="bg-gray-100 rounded-lg p-4 mb-6">
            <p class="text-gray-700 font-medium text-center text-lg leading-relaxed">
              ${this.escapeHtml(word.example)}
            </p>
          </div>

          <form id="dictationForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">위 문장을 그대로 필사하세요</label>
              <textarea id="dictationInput" placeholder="예문을 입력하세요..." rows="4" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"></textarea>
            </div>

            <button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-all">
              확인
            </button>
          </form>
        </div>
      </div>
    `

    document.getElementById('dictationForm').addEventListener('submit', (e) => this.checkDictation(e, word))
  }

  checkDictation(e, word) {
    e.preventDefault()
    const input = document.getElementById('dictationInput').value.trim()
    const correct = word.example.trim()
    const isCorrect = input === correct

    if (isCorrect) {
      alert('✅ 완벽합니다!')
    } else {
      const similarity = this.calculateSimilarity(input, correct)
      if (similarity > 80) {
        alert('⚠️ 거의 맞았습니다! (정확도: ' + similarity + '%)')
      } else if (similarity > 60) {
        alert('❌ 다시 시도해보세요. (정확도: ' + similarity + '%)')
      } else {
        alert('❌ 다시 확인해주세요.')
      }
    }
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

  closeDictation() {
    this.currentView = 'list'
    this.render()
  }

  startQuiz() {
    if (this.words.length < 2) {
      alert('퀴즈를 하려면 최소 2개 이상의 단어가 필요합니다.')
      return
    }
    this.quizIndex = 0
    this.quizScore = 0
    this.quizAnswered = []
    this.currentView = 'quiz'
    this.generateQuiz()
    this.render()
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
    const main = document.querySelector('main')
    if (!main) return

    if (this.quizIndex >= this.quizQuestions.length) {
      main.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <div class="text-6xl mb-4">🎉</div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">퀴즈 완료!</h2>
          <p class="text-gray-600 mb-6">
            <span class="text-3xl font-bold text-blue-600">${this.quizScore}</span> / ${this.quizQuestions.length}
          </p>
          <button id="backToListBtn" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all">
            목록으로 돌아가기
          </button>
        </div>
      `
      document.getElementById('backToListBtn')?.addEventListener('click', () => {
        this.currentView = 'list'
        this.render()
      })
      return
    }

    const q = this.quizQuestions[this.quizIndex]
    const correctMeaning = q.correct.meaning
    const progress = this.quizIndex + 1

    main.innerHTML = `
      <div class="py-4">
        <div class="mb-6">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-medium text-gray-600">진행: ${progress}/${this.quizQuestions.length}</span>
            <span class="text-sm font-medium text-blue-600">${this.quizScore}점</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-blue-500 h-2 rounded-full transition-all" style="width: ${(progress / this.quizQuestions.length) * 100}%"></div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <p class="text-gray-600 text-sm mb-4">다음 단어의 뜻은?</p>
          <h2 class="text-3xl font-bold text-gray-900 mb-6">${this.escapeHtml(q.correct.word)}</h2>
          <p class="text-xs text-gray-500 mb-6">품사: ${this.escapeHtml(q.correct.pos)}</p>

          <div class="space-y-3" id="quizOptions">
            ${q.options.map((meaning, i) => `
              <button onclick="app.answerQuiz('${meaning}', '${correctMeaning}')" class="w-full p-4 bg-gray-100 hover:bg-gray-200 text-left rounded-lg font-medium text-gray-900 transition-all border-2 border-transparent hover:border-blue-400">
                ${this.escapeHtml(meaning)}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `
  }

  answerQuiz(selected, correct) {
    const isCorrect = selected === correct
    if (isCorrect) this.quizScore++
    this.quizAnswered.push({ isCorrect })
    this.quizIndex++
    this.render()
  }

  renderStats() {
    const total = this.words.length
    const learned = this.words.filter(w => w.isLearned).length
    document.getElementById('totalWords').textContent = total
    document.getElementById('learnedWords').textContent = learned
  }

  renderCategoryFilter() {
    const categories = this.getCategories()
    const select = document.getElementById('categoryFilter')
    const currentValue = select.value

    select.innerHTML = '<option value="all">전체</option>'
    categories.forEach(cat => {
      const option = document.createElement('option')
      option.value = cat
      option.textContent = cat
      select.appendChild(option)
    })

    select.value = currentValue
  }

  renderWordList() {
    const filtered = this.getFilteredWords()
    const list = document.getElementById('wordsList')

    if (filtered.length === 0) {
      list.innerHTML = '<div class="text-center py-8 text-gray-400">아직 단어가 없습니다.</div>'
      return
    }

    list.innerHTML = filtered
      .map(word => `
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
                <button onclick="app.startDictation(${word.id})" class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:opacity-80 transition">
                  필사 연습
                </button>
              </div>
              ${word.example ? `<p class="text-gray-500 text-xs italic mt-2">예: ${this.escapeHtml(word.example)}</p>` : ''}
            </div>
            <div class="flex gap-2 flex-shrink-0">
              <button onclick="app.toggleLearned(${word.id})" class="p-2 rounded-lg ${word.isLearned ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'} hover:opacity-80 transition" title="${word.isLearned ? '미학습' : '학습완료'}">
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
      `)
      .join('')
  }

  toggleMeaning(id) {
    const meaningDiv = document.getElementById(`meaning-${id}`)
    const word = this.words.find(w => w.id === id)
    if (!meaningDiv) return

    meaningDiv.classList.toggle('hidden')
  }

  startDictation(id) {
    const word = this.words.find(w => w.id === id)
    if (!word.example) {
      alert('이 단어에는 아직 예문이 없습니다.')
      return
    }
    this.dictationWordId = id
    this.currentView = 'dictation'
    this.render()
  }

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}

window.app = new VocabularyApp()
