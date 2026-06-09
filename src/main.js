import './style.css'
import { supabase, signUp, signIn, signOut, getCurrentUser, onAuthStateChange, signInAnonymously, signInWithGoogle, getOrCreateDeviceId, mergeDeviceDataToUser, saveLearningRecord } from './supabase-client'

const audio = {
  audioContext: null,
  init() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      this.audioContext = new AudioContext()
    } catch (e) {
      console.log('Web Audio API not supported')
    }
  },
  play(type) {
    if (!this.audioContext) return
    try {
      const now = this.audioContext.currentTime
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      osc.connect(gain)
      gain.connect(this.audioContext.destination)
      if (type === 'success') {
        osc.frequency.setValueAtTime(400, now)
        osc.frequency.setValueAtTime(600, now + 0.1)
        gain.gain.setValueAtTime(0.3, now)
        gain.gain.setValueAtTime(0, now + 0.2)
        osc.start(now)
        osc.stop(now + 0.2)
      } else if (type === 'error') {
        osc.frequency.setValueAtTime(200, now)
        osc.frequency.setValueAtTime(100, now + 0.1)
        gain.gain.setValueAtTime(0.3, now)
        gain.gain.setValueAtTime(0, now + 0.2)
        osc.start(now)
        osc.stop(now + 0.2)
      } else if (type === 'click') {
        osc.frequency.setValueAtTime(800, now)
        gain.gain.setValueAtTime(0.1, now)
        gain.gain.setValueAtTime(0, now + 0.05)
        osc.start(now)
        osc.stop(now + 0.05)
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(300, now)
        osc.frequency.setValueAtTime(400, now + 0.05)
        gain.gain.setValueAtTime(0.2, now)
        gain.gain.setValueAtTime(0, now + 0.1)
        osc.start(now)
        osc.stop(now + 0.1)
      }
    } catch (e) {}
  }
}
audio.init()

class VocabularyApp {
  constructor() {
    this.words = this.loadWords()
    this.dictationData = this.loadDictationData()
    this.character = this.loadCharacter()
    this.currentCategory = 'all'
    this.currentView = 'vocabulary'
    this.currentTab = 'list'
    this.selectedCourse = null
    this.courses = ['TED', 'Movie', 'Business']
    this.user = null
    this.authView = 'login' // 'login' or 'signup'
    this.init()
  }

  async init() {
    // Device ID 생성 (로그인 없이도 추적)
    this.deviceId = getOrCreateDeviceId()

    // 단어 데이터 로드 (public/words.json에서)
    await this.loadWordsFromFile()

    // 인증 상태 확인
    this.user = await getCurrentUser()

    // 첫 방문: Anonymous 로그인
    if (!this.user) {
      const { data } = await signInAnonymously()
      this.user = data?.user || null
    }

    // 인증 상태 변화 감시
    onAuthStateChange((event, session) => {
      this.user = session?.user || null

      // Google 로그인 시 기기 데이터 병합
      if (this.user && !this.user.is_anonymous) {
        mergeDeviceDataToUser(this.deviceId)
      }

      this.render()
    })

    this.render()
    this.attachGlobalListeners()
  }

  attachGlobalListeners() {
    document.addEventListener('click', (e) => {
      const button = e.target.closest('button')
      if (button) audio.play('click')

      if (e.target.id === 'addWordBtn') this.showAddModal()
      if (e.target.id === 'closeModal') this.closeModal()
      if (e.target.id === 'logoutBtn') {
        signOut()
        this.user = null
        this.render()
      }
      if (e.target.id === 'autoFillBtn') { e.preventDefault(); this.autoFillWordInfo() }
      if (e.target.id === 'quizBtn') this.startQuiz()
      if (e.target.id === 'submitBtn') { e.preventDefault(); this.submitDictation(e) }
      if (e.target.id === 'vocabTab') { this.currentView = 'vocabulary'; this.render() }
      if (e.target.id === 'dictationTab') { this.currentView = 'dictation'; this.render() }
      if (e.target.id === 'characterTab') { this.currentView = 'character'; this.render() }

      if (e.target.getAttribute('data-toggle-meaning')) {
        this.toggleMeaning(parseInt(e.target.getAttribute('data-toggle-meaning')))
      }
      if (e.target.getAttribute('data-toggle-learned')) {
        this.toggleLearned(parseInt(e.target.getAttribute('data-toggle-learned')))
      }
      if (e.target.getAttribute('data-delete-word')) {
        this.deleteWord(parseInt(e.target.getAttribute('data-delete-word')))
      }
      if (e.target.getAttribute('data-answer-quiz')) {
        const [selected, correct] = e.target.getAttribute('data-answer-quiz').split('|')
        this.answerQuiz(selected, correct)
      }

      // 코스 카드 클릭
      const courseCard = e.target.closest('.course-card')
      if (courseCard) {
        this.selectedCourse = courseCard.getAttribute('data-course')
        this.render()
      }

      // 뒤로가기 (코스 대시보드로)
      if (e.target.id === 'backToCourses') {
        this.selectedCourse = null
        this.render()
      }
    })

    document.addEventListener('change', (e) => {
      if (e.target.id === 'categoryFilter') {
        this.currentCategory = e.target.value
        this.render()
      }
    })

    document.addEventListener('submit', (e) => {
      if (e.target.id === 'addWordForm') {
        e.preventDefault()
        this.handleAddWord(e)
      }
      if (e.target.id === 'dictationForm') {
        e.preventDefault()
        this.submitDictation(e)
      }
    })

  }

  async loadWordsFromFile() {
    try {
      const stored = localStorage.getItem('vocabularyWords')
      if (stored) {
        this.words = JSON.parse(stored)
        return
      }

      const response = await fetch('/words.json')
      if (!response.ok) throw new Error('Failed to load words.json')

      const wordsData = await response.json()
      this.words = wordsData
      this.saveWords(wordsData)
    } catch (error) {
      console.warn('Failed to load words.json, using initial data:', error)
      this.words = this.getInitialWords()
      this.saveWords(this.words)
    }
  }

  loadWords() {
    const stored = localStorage.getItem('vocabularyWords')
    if (stored) return JSON.parse(stored)
    return this.getInitialWords()
  }

  getInitialWords() {
    return [
      { id: 1, word: 'infrastructure', pos: '명사', meaning: '기간 시설, 인프라', englishMeaning: 'the basic systems, services, and facilities needed for a country or organization to function properly', ipa: '/ˈɪnfrəˌstrʌktʃər/', category: 'Business', example: 'Modern infrastructure is essential for economic development.', isLearned: false, createdAt: new Date().toISOString() },
      { id: 2, word: 'rollout', pos: '명사', meaning: '(첫) 출시, 본격적인 전개', englishMeaning: 'the process of introducing something new, especially a product or service', ipa: '/ˈroʊl.aʊt/', category: 'Business', example: 'The new product rollout was successful and exceeded expectations.', isLearned: false, createdAt: new Date().toISOString() },
      { id: 3, word: 'cooperation', pos: '명사', meaning: '협력, 협조', englishMeaning: 'the action or process of working together to the same end', ipa: '/koʊ.ɑpəˈreɪ.ʃən/', category: 'Business', example: 'Cooperation between teams is crucial for project success.', isLearned: false, createdAt: new Date().toISOString() },
      { id: 4, word: 'delivery', pos: '명사', meaning: '인도, 납품, 배달', englishMeaning: 'the action of delivering letters, packages, or goods', ipa: '/dɪˈlɪv.ər.i/', category: 'Business', example: 'Fast delivery is one of the key features of our service.', isLearned: false, createdAt: new Date().toISOString() },
      { id: 5, word: 'institute', pos: '명사', meaning: '기관, 협회, 연구소', englishMeaning: 'an organization founded for a particular purpose', ipa: '/ˈɪn.stɪ.tut/', category: 'Business', example: 'The research institute conducts groundbreaking studies.', isLearned: false, createdAt: new Date().toISOString() },
      { id: 6, word: 'strategically', pos: '부사', meaning: '전략적으로', englishMeaning: 'in a way that is carefully planned and designed to accomplish a particular goal', ipa: '/strəˈtɪdʒ.ɪ.kəl.i/', category: 'Business', example: 'The company strategically positioned itself in the market.', isLearned: false, createdAt: new Date().toISOString() },
      { id: 7, word: 'academic', pos: '형용사', meaning: '학문적인, 대학의', englishMeaning: 'relating to education and scholarship', ipa: '/ˌæk.əˈdem.ɪk/', category: 'Business', example: 'Academic research requires rigorous methodology and peer review.', isLearned: false, createdAt: new Date().toISOString() },
      { id: 8, word: 'establishment', pos: '명사', meaning: '설립, 수립', englishMeaning: 'the action or process of establishing or starting something', ipa: '/ɪˈstæb.lɪʃ.mənt/', category: 'Business', example: 'The establishment of new policies helped improve efficiency.', isLearned: false, createdAt: new Date().toISOString() },
    ]
  }

  loadDictationData() {
    const stored = localStorage.getItem('dictationData')
    return stored ? JSON.parse(stored) : { records: {}, stats: {} }
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
    const app = document.getElementById('app') || document.body

    // v1 MVP: 로그인 페이지 제거 (나중에 추가)
    // if (!this.user) {
    //   app.innerHTML = this.renderAuthPage()
    //   requestAnimationFrame(() => this.attachAuthListeners())
    //   return
    // }

    // 공통 레이아웃 (고정 헤더 + 탭 + 콘텐츠)
    app.innerHTML = `
      <div class="min-h-screen flex flex-col max-w-md mx-auto bg-gray-50">
        <!-- 고정 헤더 (높이 h-28 = 112px) -->
        <header class="fixed top-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-md h-28 bg-white border-b border-gray-200 shadow-md">
          <div class="px-4 py-4 flex items-center justify-between h-full">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">heekiword</h1>
              <p class="text-xs text-gray-500 mt-1">Vocabulary Tracker for Learning</p>
            </div>
            <div class="flex gap-2 items-center">
              <button id="addWordBtn" class="bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 text-white rounded-full p-3 transition-all active:scale-95 shadow-lg" aria-label="Add Word">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button id="logoutBtn" class="bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 text-white rounded-full p-3 transition-all active:scale-95 shadow-lg" aria-label="Logout" title="Logout">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <!-- 탭 버튼 (top-28 = 헤더 바로 아래) -->
        ${this.renderTabs()}

        <!-- 콘텐츠 영역 (pt-56 = 헤더 + 탭 높이) -->
        <main id="mainContent" class="flex-1 overflow-y-auto pb-20 pt-56"></main>
      </div>
    `

    // 콘텐츠 렌더링 (requestAnimationFrame으로 DOM 준비 보장)
    requestAnimationFrame(() => {
      this.renderMainContent()
    })
  }

  renderMainContent() {
    const mainContent = document.getElementById('mainContent')
    if (!mainContent) return

    if (this.currentView === 'vocabulary') {
      mainContent.innerHTML = `<div class="px-4 py-4">${this.renderVocabularyContent()}</div>`
      this.renderWordList()
    } else if (this.currentView === 'dictation') {
      mainContent.innerHTML = `
        <div class="px-4 py-4">
          ${this.renderDictationStats()}
          <div id="dictationContent"></div>
        </div>
      `
      this.renderDictationChallenge()
    } else if (this.currentView === 'character') {
      mainContent.innerHTML = `<div class="px-4 py-4">${this.renderCharacterContent()}</div>`
    } else if (this.currentView === 'quiz') {
      mainContent.innerHTML = this.renderQuizContent()
    }
  }

  // v1 MVP: 로그인 페이지 제거 (나중에 추가)
  /*
  renderAuthPage() {
    const isSignup = this.authView === 'signup'
    return `
      <div class="min-h-screen flex flex-col max-w-md mx-auto bg-gray-50">
        <div class="flex-1 flex items-center justify-center px-4 py-8">
          <div class="w-full bg-white rounded-lg shadow-lg p-8">
            <div class="text-center mb-8">
              <h1 class="text-3xl font-bold text-gray-900 mb-2">heekiword</h1>
              <p class="text-sm text-gray-500">Vocabulary Tracker for Learning</p>
            </div>

            <form id="authForm" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" id="authEmail" placeholder="your@email.com" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input type="password" id="authPassword" placeholder="••••••••" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required>
              </div>

              ${isSignup ? `
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <input type="password" id="authPasswordConfirm" placeholder="••••••••" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required>
                </div>
              ` : ''}

              <button type="submit" class="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-all active:scale-95">
                ${isSignup ? 'Sign Up' : 'Log In'}
              </button>
            </form>

            <div class="mt-6 text-center">
              <button id="toggleAuth" class="text-orange-600 hover:text-orange-700 text-sm font-semibold">
                ${isSignup ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
              </button>
            </div>

            <div id="authError" class="mt-4 p-3 bg-red-50 text-red-700 rounded-lg hidden text-sm"></div>
            <div id="authSuccess" class="mt-4 p-3 bg-green-50 text-green-700 rounded-lg hidden text-sm"></div>

            <div class="mt-6">
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-300"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <button type="button" id="googleSignInBtn" class="w-full mt-6 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-900 font-semibold py-3 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google로 계속하기
              </button>
            </div>
          </div>
        </div>
      </div>
    `
  }
  */

  // v1 MVP: 로그인 리스너 제거 (나중에 추가)
  /*
  attachAuthListeners() {
    const form = document.getElementById('authForm')
    const toggleBtn = document.getElementById('toggleAuth')
    const googleBtn = document.getElementById('googleSignInBtn')
    const errorDiv = document.getElementById('authError')
    const successDiv = document.getElementById('authSuccess')

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.authView = this.authView === 'login' ? 'signup' : 'login'
        this.render()
      })
    }

    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        const { error } = await signInWithGoogle()
        if (error) {
          this.showAuthError(error.message, errorDiv)
        }
      })
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault()
        errorDiv.classList.add('hidden')
        successDiv.classList.add('hidden')

        const email = document.getElementById('authEmail').value.trim()
        const password = document.getElementById('authPassword').value

        if (this.authView === 'signup') {
          const passwordConfirm = document.getElementById('authPasswordConfirm').value
          if (password !== passwordConfirm) {
            this.showAuthError('Passwords do not match', errorDiv)
            return
          }
          const { error } = await signUp(email, password)
          if (error) {
            this.showAuthError(error.message, errorDiv)
          } else {
            this.showAuthSuccess('Sign up successful! Check your email to verify.', successDiv)
            setTimeout(() => {
              this.authView = 'login'
              this.render()
            }, 2000)
          }
        } else {
          const { error } = await signIn(email, password)
          if (error) {
            this.showAuthError(error.message, errorDiv)
          } else {
            this.showAuthSuccess('Logged in successfully!', successDiv)
          }
        }
      })
    }
  }
  */

  showAuthError(message, div) {
    div.textContent = '❌ ' + message
    div.classList.remove('hidden')
  }

  showAuthSuccess(message, div) {
    div.textContent = '✅ ' + message
    div.classList.remove('hidden')
  }

  renderVocabularyContent() {
    // 코스 대시보드 또는 단어 목록 표시
    if (!this.selectedCourse) {
      return this.renderCourseDashboard()
    }

    // 선택된 코스의 단어 목록
    const courseWords = this.words.filter(w => w.category === this.selectedCourse)
    const learned = courseWords.filter(w => w.isLearned).length

    return `
      <div class="mb-4">
        <button id="backToCourses" class="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold mb-4">
          <span>←</span> Back to Courses
        </button>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="bg-blue-50 rounded-lg p-3 text-center border-2 border-blue-200">
          <p class="text-xs text-gray-600 mb-1">Course</p>
          <p class="text-lg font-bold text-blue-600">${this.selectedCourse}</p>
        </div>
        <div class="bg-green-50 rounded-lg p-3 text-center border-2 border-green-200">
          <p class="text-xs text-gray-600 mb-1">Completed</p>
          <p class="text-2xl font-bold text-green-600">${learned}/${courseWords.length}</p>
        </div>
      </div>

      <div id="contentArea"></div>
      ${this.renderAddModal()}
    `
  }

  renderCourseDashboard() {
    return `
      <div class="py-4">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Select a Course</h2>
        <div class="space-y-3">
          ${this.courses.map(course => {
            const courseWords = this.words.filter(w => w.category === course)
            const learned = courseWords.filter(w => w.isLearned).length
            const progress = courseWords.length > 0 ? Math.round((learned / courseWords.length) * 100) : 0

            const courseEmojis = {
              'TED': '🎬',
              'Movie': '🎥',
              'Business': '💼'
            }

            return `
              <div class="bg-white rounded-lg shadow-sm p-5 border-l-4 border-orange-500 hover:shadow-md transition cursor-pointer course-card" data-course="${course}">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-3xl">${courseEmojis[course] || '📚'}</span>
                      <h3 class="text-lg font-bold text-gray-900">${course}</h3>
                    </div>
                    <p class="text-sm text-gray-600">${courseWords.length} words</p>
                  </div>
                  <span class="text-2xl font-bold text-orange-600">${progress}%</span>
                </div>

                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition" style="width: ${progress}%"></div>
                </div>

                <p class="text-xs text-gray-500 mt-2">${learned} completed</p>
              </div>
            `
          }).join('')}
        </div>
      </div>
      ${this.renderAddModal()}
    `
  }

  renderTabs() {
    const isActive = (view) => this.currentView === view
    const activeClass = 'border-orange-500 text-orange-600 bg-orange-50'
    const inactiveClass = 'border-transparent text-gray-600 hover:text-gray-900'

    return `
      <div class="fixed top-28 left-1/2 -translate-x-1/2 z-30 w-full max-w-md bg-white border-b border-gray-200 flex" role="tablist" aria-label="Main navigation">
        <button id="vocabTab" class="flex-1 py-3 px-4 font-medium border-b-2 transition-colors ${isActive('vocabulary') ? activeClass : inactiveClass} text-center" role="tab" aria-selected="${isActive('vocabulary')}" aria-controls="vocab-panel">
          📚 <span class="hidden sm:inline">Vocabulary</span>
        </button>
        <button id="dictationTab" class="flex-1 py-3 px-4 font-medium border-b-2 transition-colors ${isActive('dictation') ? activeClass : inactiveClass} text-center" role="tab" aria-selected="${isActive('dictation')}" aria-controls="dictation-panel">
          ✏️ <span class="hidden sm:inline">Dictation</span>
        </button>
        <button id="characterTab" class="flex-1 py-3 px-4 font-medium border-b-2 transition-colors ${isActive('character') ? activeClass : inactiveClass} text-center" role="tab" aria-selected="${isActive('character')}" aria-controls="character-panel">
          🐣 <span class="hidden sm:inline">Character</span>
        </button>
      </div>
    `
  }

  renderWordList() {
    let filtered = this.words

    // 선택된 코스가 있으면 그 코스의 단어만 필터
    if (this.selectedCourse) {
      filtered = filtered.filter(w => w.category === this.selectedCourse)
    } else {
      filtered = filtered.filter(w => this.currentCategory === 'all' || w.category === this.currentCategory)
    }

    const content = document.getElementById('contentArea')
    if (!content) return

    if (filtered.length === 0) {
      content.innerHTML = '<div class="text-center py-8 text-gray-400">No words yet. Add your first word!</div>'
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
            <div class="mb-2 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition" data-toggle-meaning="${word.id}">
              <p class="text-gray-700 text-sm mb-2 font-medium">${this.escapeHtml(word.englishMeaning || word.meaning)}</p>
              <p class="text-xs text-gray-500 text-center">💬 Click to toggle Korean meaning</p>
            </div>
            <div id="meaning-${word.id}" class="hidden text-gray-600 text-sm mb-2 p-2 bg-gray-50 rounded">
              ${this.escapeHtml(word.meaning)}
            </div>
            <div class="flex gap-2">
              <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">${this.escapeHtml(word.category)}</span>
            </div>
            ${word.example ? `<p class="text-gray-500 text-xs italic mt-2">Example: ${this.escapeHtml(word.example)}</p>` : ''}
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <button data-toggle-learned="${word.id}" class="p-2 rounded-lg ${word.isLearned ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'} hover:opacity-80 transition">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </button>
            <button data-delete-word="${word.id}" class="p-2 rounded-lg bg-red-100 text-red-600 hover:opacity-80 transition">
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
            <h2 class="text-xl font-bold text-gray-900">Add Word</h2>
            <button id="closeModal" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form id="addWordForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Word</label>
              <div class="flex gap-2">
                <input type="text" id="wordInput" placeholder="Enter English word" class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" required>
                <button type="button" id="autoFillBtn" class="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-3 rounded-lg transition-all active:scale-95 whitespace-nowrap">Auto Search</button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">English Meaning</label>
              <textarea id="englishMeaningInput" placeholder="Describe the meaning in English" rows="2" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">한글 뜻 (Korean)</label>
              <textarea id="meaningInput" placeholder="단어의 의미를 입력하세요" rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" required></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">IPA (Pronunciation)</label>
              <input type="text" id="ipaInput" placeholder="Example: /ˈɪnfrəˌstrʌktʃər/" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Part of Speech</label>
              <select id="posInput" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="Noun">Noun</option>
                <option value="Verb">Verb</option>
                <option value="Adjective">Adjective</option>
                <option value="Adverb">Adverb</option>
                <option value="Preposition">Preposition</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <input type="text" id="categoryInput" placeholder="Example: Business" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Example Sentence</label>
              <textarea id="exampleInput" placeholder="Enter example sentence" rows="2" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"></textarea>
            </div>
            <button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-all active:scale-95">Add Word</button>
          </form>
        </div>
      </div>
      <style>
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      </style>
    `
  }

  renderDictationStats() {
    const today = new Date().toISOString().split('T')[0]
    const todayRecord = this.dictationData.records[today]

    return `
      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="rounded-lg p-3 text-center ${todayRecord?.success ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-100 border-2 border-gray-300'}">
          <p class="text-xs font-medium ${todayRecord?.success ? 'text-green-700' : 'text-gray-600'}">Today</p>
          <p class="text-2xl font-bold mt-2">${todayRecord?.success ? '✓ Done' : '⭕ Pending'}</p>
        </div>
        <div class="bg-blue-50 rounded-lg p-3 text-center border-2 border-blue-300">
          <p class="text-xs font-medium text-blue-700">Streak</p>
          <p class="text-2xl font-bold text-blue-600 mt-2">${this.character.streak} days</p>
        </div>
        <div class="bg-purple-50 rounded-lg p-3 text-center border-2 border-purple-300">
          <p class="text-xs font-medium text-purple-700">Success</p>
          <p class="text-2xl font-bold text-purple-600 mt-2">${this.character.totalSuccess}x</p>
        </div>
      </div>
    `
  }

  renderDictationChallenge() {
    const today = new Date().toISOString().split('T')[0]
    const todayRecord = this.dictationData.records[today]
    const content = document.getElementById('dictationContent')

    if (!content) return

    if (todayRecord?.success) {
      audio.play('success')
      content.innerHTML = `
        <div class="text-center py-12">
          <div class="text-6xl mb-4">🎉</div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Perfect!</h2>
          <p class="text-gray-600 mb-4">Come back tomorrow for your next challenge!</p>
          <div class="bg-green-50 rounded-lg p-4 mb-4 border-2 border-green-200">
            <p class="text-sm text-green-700">✨ You nailed it! Keep up the great streak! ✨</p>
          </div>
        </div>
      `
      return
    }

    const randomWord = this.words[Math.floor(Math.random() * this.words.length)]
    if (!randomWord?.example) {
      content.innerHTML = '<div class="text-center py-8 text-gray-400">예문이 없습니다.</div>'
      return
    }

    content.innerHTML = `
      <div class="py-4">
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 class="text-xl font-bold text-gray-900 mb-2">${this.escapeHtml(randomWord.word)}</h2>
          <p class="text-gray-500 text-sm mb-4 font-mono" aria-label="발음기호">${this.escapeHtml(randomWord.ipa)}</p>

          <form id="dictationForm" class="space-y-4">
            <label class="block text-sm font-medium text-gray-700 mb-4">Type the sentence below</label>

            <!-- contenteditable 입력 영역 -->
            <div
              id="dictationInput"
              contenteditable="true"
              data-word-id="${randomWord.id}"
              data-target="${this.escapeHtml(randomWord.example)}"
              class="w-full bg-white rounded-lg border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all p-4 text-base leading-relaxed text-gray-900 focus:outline-none min-h-24 text-left"
              aria-label="Dictation input"
              spellcheck="false"
            ></div>

            <button type="submit" id="submitBtn" class="w-full bg-gray-300 text-gray-500 font-semibold py-3 rounded-lg transition-all cursor-not-allowed" disabled>
              ✓ Typing...
            </button>
          </form>
        </div>
      </div>

      <style>
        #dictationInput .char {
          color: #ccc;
          position: relative;
        }
        #dictationInput .char.correct {
          color: #000;
        }
        #dictationInput .char.incorrect {
          background-color: #ffe0d0;
          color: #000;
        }
        #dictationInput .char.cursor::before {
          content: '';
          position: absolute;
          left: -2px;
          top: 0;
          bottom: 0;
          border-left: 2px solid #ff9500;
        }
      </style>
    `
    this.setupDictationInput()
  }

  setupDictationInput() {
    const input = document.getElementById('dictationInput')
    const submitBtn = document.getElementById('submitBtn')
    const target = input?.getAttribute('data-target') || ''

    if (!input) return

    // 초기 span 구조 생성
    let html = ''
    for (let char of target) {
      html += `<span class="char pending">${this.escapeHtml(char)}</span>`
    }
    input.innerHTML = html

    let currentIndex = 0

    // contenteditable 기본 입력 방지
    input.addEventListener('beforeinput', (e) => {
      e.preventDefault()
    })

    input.addEventListener('keydown', (e) => {
      // Enter 키: 완료 처리
      if (e.key === 'Enter') {
        e.preventDefault()
        if (currentIndex === target.length) {
          this.submitDictation({ target: document.getElementById('dictationForm') })
        }
        return
      }

      // 백스페이스 처리
      if (e.key === 'Backspace') {
        e.preventDefault()
        if (currentIndex > 0) {
          currentIndex--
          this.updateDictationDisplay(input, target, currentIndex)
        }
        return
      }

      // 화살표 키, 컨트롤 키 등은 기본 동작 허용하지 않음
      if (e.key.length !== 1) {
        e.preventDefault()
        return
      }

      e.preventDefault()

      // 정답 글자 비교
      if (currentIndex < target.length) {
        const spans = input.querySelectorAll('.char')

        if (e.key === target[currentIndex]) {
          // 맞는 글자
          spans[currentIndex].classList.remove('pending', 'incorrect', 'cursor')
          spans[currentIndex].classList.add('correct')
        } else {
          // 틀린 글자
          audio.play('error')
          spans[currentIndex].classList.remove('pending', 'correct', 'cursor')
          spans[currentIndex].classList.add('incorrect')
          spans[currentIndex].textContent = e.key
        }

        // 다음 인덱스로 이동 (맞든 틀리든)
        currentIndex++

        if (currentIndex < target.length) {
          spans[currentIndex].classList.add('cursor')
        }

        // 완료 확인
        if (currentIndex === target.length) {
          submitBtn.disabled = false
          submitBtn.classList.remove('bg-gray-300', 'text-gray-500', 'cursor-not-allowed')
          submitBtn.classList.add('bg-orange-500', 'hover:bg-orange-600', 'text-white')
          submitBtn.textContent = '✓ Done'
        } else {
          submitBtn.textContent = `✓ Typing... (${currentIndex}/${target.length})`
        }
      }
    })

    input.addEventListener('focus', () => {
      // 포커스 시 첫 글자에 커서 표시
      if (currentIndex < target.length) {
        const spans = input.querySelectorAll('.char')
        spans[currentIndex]?.classList.add('cursor')
      }
    })

    input.addEventListener('blur', () => {
      // 포커스 해제 시 커서 제거
      const spans = input.querySelectorAll('.char')
      spans.forEach(span => span.classList.remove('cursor'))
    })

    input.focus()
  }

  updateDictationDisplay(input, target, currentIndex) {
    const spans = input.querySelectorAll('.char')
    spans.forEach((span, i) => {
      span.classList.remove('correct', 'incorrect', 'cursor', 'pending')
      span.textContent = this.escapeHtml(target[i])

      if (i < currentIndex) {
        span.classList.add('correct')
      } else if (i === currentIndex) {
        span.classList.add('cursor')
      } else {
        span.classList.add('pending')
      }
    })
  }


  async submitDictation(e) {
    const inputElement = document.getElementById('dictationInput')
    const input = (inputElement?.textContent || '').trim()
    const wordId = parseInt(inputElement?.getAttribute('data-word-id'))
    const word = this.words.find(w => w.id === wordId)
    const correct = word?.example.trim() || ''

    if (input === correct) {
      audio.play('success')

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

      // Supabase에 학습 기록 저장 (User 또는 Device)
      // const { error } = await saveLearningRecord({
      //   type: 'dictation',
      //   word: word.word,
      //   course: word.category,
      //   success: true
      // }, this.deviceId)
      // if (error) console.error('Failed to save record:', error)

      // 성공 페이지로 전환
      this.currentView = 'dictation'
      this.render()
    } else {
      audio.play('error')
      const similarity = this.calculateSimilarity(input, correct)
      alert(`Not quite right. Keep trying! Accuracy: ${similarity}%`)
    }
  }

  renderCharacterContent() {
    const characterStage = this.getCharacterStage()
    const months = Object.keys(this.dictationData.stats).sort().reverse().slice(0, 3)

    return `
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
            ${this.character.badges.map(b => `<div class="text-center p-3 bg-yellow-50 rounded-lg"><div class="text-2xl mb-1">${b.emoji}</div><p class="text-xs font-medium">${b.name}</p></div>`).join('')}
            ${this.character.badges.length === 0 ? '<p class="text-xs text-gray-400 col-span-3">Earn badges to see them here</p>' : ''}
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="font-bold text-gray-900 mb-4">📊 Monthly Stats</h3>
          ${months.length === 0 ? '<p class="text-xs text-gray-400">No dictation records yet.</p>' : months.map(month => {
            const stats = this.dictationData.stats[month]
            const [year, monthNum] = month.split('-')
            return `
              <div class="mb-3 pb-3 border-b last:border-b-0">
                <p class="text-sm font-medium text-gray-900 mb-2">${year}.${monthNum}</p>
                <div class="flex justify-between text-xs text-gray-600">
                  <span>Successful: ${stats.successDays}d</span>
                  <span>Attempts: ${stats.totalAttempts}d</span>
                </div>
              </div>
            `
          }).join('')}
        </div>
      </div>
    `
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

  renderQuizContent() {
    if (this.quizIndex >= (this.quizQuestions?.length || 0)) {
      return `
        <div class="flex flex-col items-center justify-center min-h-96 text-center">
          <div class="text-6xl mb-4">🎉</div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
          <p class="text-gray-600 mb-6">
            <span class="text-3xl font-bold text-blue-600">${this.quizScore}</span> / ${this.quizQuestions?.length || 0}
          </p>
          <button id="vocabTab" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all">Back</button>
        </div>
      `
    }

    const q = this.quizQuestions[this.quizIndex]
    const progress = (this.quizIndex || 0) + 1

    return `
      <div>
        <div class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-medium text-gray-600">Progress: ${progress}/${this.quizQuestions?.length || 0}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-blue-500 h-2 rounded-full transition-all" style="width: ${(progress / (this.quizQuestions?.length || 1)) * 100}%"></div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-6">
          <p class="text-gray-600 text-sm mb-4">Select the meaning:</p>
          <h2 class="text-3xl font-bold text-gray-900 mb-6">${this.escapeHtml(q.correct.word)}</h2>
          <div class="space-y-3">
            ${q.options.map((meaning, idx) => `
              <button data-answer-quiz="${meaning}|${q.correct.meaning}" class="w-full p-4 bg-gray-100 hover:bg-gray-200 text-left rounded-lg font-medium text-gray-900 transition-all border-2 border-transparent hover:border-blue-400">
                ${this.escapeHtml(meaning)}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `
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
    if (confirm('Delete this word?')) {
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
    const word = document.getElementById('wordInput')?.value.trim() || ''
    const englishMeaning = document.getElementById('englishMeaningInput')?.value.trim() || ''
    const meaning = document.getElementById('meaningInput')?.value.trim() || ''
    const ipa = document.getElementById('ipaInput')?.value.trim() || ''
    const pos = document.getElementById('posInput')?.value.trim() || 'Noun'
    const category = document.getElementById('categoryInput')?.value.trim() || 'General'
    const example = document.getElementById('exampleInput')?.value.trim() || ''

    if (!word || !meaning) {
      alert('Word and meaning are required.')
      return
    }

    this.words.push({
      id: Date.now(),
      word, englishMeaning, meaning, ipa, pos, category, example,
      createdAt: new Date().toISOString(),
      isLearned: false,
    })

    this.saveWords()
    this.closeModal()
    this.currentView = 'vocabulary'
    this.render()
  }

  async autoFillWordInfo() {
    const word = document.getElementById('wordInput')?.value.trim()
    if (!word) {
      alert('Enter a word first.')
      return
    }

    const btn = document.getElementById('autoFillBtn')
    const originalText = btn.textContent
    btn.textContent = 'Searching...'
    btn.disabled = true

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`)
      if (!response.ok) throw new Error()

      const data = await response.json()
      const entry = data[0]
      const phonetic = entry.phonetics?.[0]?.text || entry.phonetic || ''
      const meanings = entry.meanings || []
      const definitions = meanings.flatMap(m => m.definitions || [])
      const englishMeaning = definitions[0]?.definition || ''
      const example = definitions[0]?.example || ''

      document.getElementById('englishMeaningInput').value = englishMeaning
      document.getElementById('ipaInput').value = phonetic
      if (example) document.getElementById('exampleInput').value = example

      alert('✅ Auto search complete! Enter the Korean meaning.')
    } catch (err) {
      alert('❌ Word not found.')
    } finally {
      btn.textContent = originalText
      btn.disabled = false
    }
  }

  startQuiz() {
    if (this.words.length < 2) {
      alert('At least 2 words are needed for a quiz.')
      return
    }
    this.quizIndex = 0
    this.quizScore = 0
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

  answerQuiz(selected, correct) {
    if (selected === correct) {
      audio.play('success')
      this.quizScore++
    } else {
      audio.play('error')
    }
    this.quizIndex++
    this.render()
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
