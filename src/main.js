import './style.css'

class VocabularyApp {
  constructor() {
    this.words = this.loadWords()
    this.currentCategory = 'all'
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
  }

  loadWords() {
    const stored = localStorage.getItem('vocabularyWords')
    return stored ? JSON.parse(stored) : []
  }

  saveWords() {
    localStorage.setItem('vocabularyWords', JSON.stringify(this.words))
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
    const meaning = document.getElementById('meaningInput').value.trim()
    const category = document.getElementById('categoryInput').value.trim() || 'General'
    const example = document.getElementById('exampleInput').value.trim()

    if (!word || !meaning) {
      alert('단어와 뜻은 필수입니다.')
      return
    }

    this.words.push({
      id: Date.now(),
      word,
      meaning,
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
    this.renderStats()
    this.renderCategoryFilter()
    this.renderWordList()
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
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-bold text-lg ${word.isLearned ? 'line-through text-gray-400' : 'text-gray-900'}">${this.escapeHtml(word.word)}</h3>
                <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">${this.escapeHtml(word.category)}</span>
              </div>
              <p class="text-gray-600 text-sm mb-2">${this.escapeHtml(word.meaning)}</p>
              ${word.example ? `<p class="text-gray-500 text-xs italic">예: ${this.escapeHtml(word.example)}</p>` : ''}
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

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}

window.app = new VocabularyApp()
