/**
 * Dictionary API를 사용해서 단어 데이터 자동 수집
 * Free Dictionary API: https://dictionaryapi.dev/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CEFR B1-C2 레벨 단어 (영어 학습용)
const VOCABULARY_LISTS = {
  TED: [
    'resilience', 'innovation', 'collaboration', 'sustainability', 'transformation',
    'expertise', 'efficiency', 'perspective', 'engagement', 'empowerment', 'integrity',
    'advocacy', 'narrative', 'catalyst', 'paradigm', 'authenticity', 'complexity',
    'potential', 'adaptive', 'interconnected', 'diversity', 'inclusion', 'equity',
    'abundance', 'mindful', 'evolution', 'impact', 'legacy', 'infrastructure',
    'rollout', 'cooperation', 'delivery', 'institute', 'strategically', 'academic',
    'establishment', 'ambition', 'aspiration', 'breakthrough', 'challenge', 'commitment',
    'competence', 'confidence', 'consequence', 'constraint', 'contribution', 'controversy',
    'conviction', 'creativity', 'credibility', 'crisis', 'curiosity', 'dialogue',
    'discipline', 'discovery', 'disproportionate', 'distinction', 'distribution',
    'diverge', 'diversity', 'domain', 'dominance', 'dynamics', 'earnest', 'ecosystem',
    'effectively', 'efficacy', 'eloquent', 'emancipate', 'embrace', 'emergence',
    'emergent', 'emotion', 'emphasis', 'empirical', 'employment', 'enabling',
    'enact', 'encounter', 'encourage', 'endeavor', 'endorse', 'endure', 'energize',
    'enforce', 'engage', 'engineer', 'enhance', 'enigma', 'enlighten', 'enliven',
    'enmity', 'enormous', 'enrage', 'enrich', 'enroll', 'ensconce', 'ensemble',
    'ensue', 'ensure', 'entail', 'entangle', 'enterprise', 'entertain', 'enthusiasm',
    'entice', 'entitle', 'entity', 'entourage', 'entrench', 'entrepreneur',
    'entropy', 'entrust', 'entry', 'entwine', 'enumerate', 'enunciate', 'environ',
    'environment', 'environs', 'envisage', 'envision', 'envoy', 'envy', 'ephemeral',
    'epic', 'epidemic', 'epidermis', 'epigram', 'epigraph', 'epilogue', 'episode',
    'epistle', 'epitaph', 'epithet', 'epitome', 'epoch', 'eponym', 'epoxy',
    'epoxy', 'equable', 'equal', 'equalism', 'equality', 'equanimity', 'equate',
    'equation', 'equator', 'equatorial', 'equerries', 'equerry', 'equestrian',
    'equidistant', 'equilateral', 'equilibrium', 'equine', 'equinox', 'equipment',
    'equipoise', 'equitable', 'equity', 'equivalence', 'equivalent', 'equivocal',
    'equivocate', 'era', 'eradicate', 'erase', 'erasure', 'erbium', 'erect',
    'erection', 'erector', 'eremite', 'erethism', 'ergo', 'ergot', 'ermine',
    'erne', 'erode', 'erosion', 'erotic', 'eroticism', 'err', 'errand', 'errant',
    'errata', 'erratic', 'erratum', 'errhine', 'erring', 'erroneous', 'error',
    'ersatz', 'erst', 'eruct', 'erudite', 'erudition', 'erupt', 'eruption'
  ],
  Movie: [
    'protagonist', 'antagonist', 'climax', 'suspense', 'dialogue', 'flashback',
    'revelation', 'betrayal', 'redemption', 'poignant', 'narrative', 'protagonist',
    'ensemble', 'exposition', 'denouement', 'conflict', 'resolution', 'tension',
    'dramatic', 'melodrama', 'tragedy', 'comedy', 'satire', 'parody', 'farce',
    'slapstick', 'burlesque', 'sketch', 'monologue', 'soliloquy', 'aside',
    'dramatic irony', 'comic relief', 'deus ex machina', 'foreshadowing', 'allegory',
    'metaphor', 'simile', 'personification', 'symbolism', 'imagery', 'atmosphere',
    'mood', 'tone', 'theme', 'motif', 'leitmotif', 'foreshadow', 'foreboding',
    'portent', 'ominous', 'sinister', 'eerie', 'creepy', 'uncanny', 'bizarre',
    'grotesque', 'macabre', 'ghastly', 'horrifying', 'terrifying', 'petrifying',
    'startling', 'shocking', 'astonishing', 'astounding', 'amazing', 'incredible',
    'unbelievable', 'improbable', 'implausible', 'farfetched', 'preposterous',
    'ridiculous', 'absurd', 'ludicrous', 'amusing', 'entertaining', 'delightful',
    'charming', 'enchanting', 'captivating', 'fascinating', 'intriguing', 'gripping',
    'riveting', 'engrossing', 'absorbing', 'compelling', 'forceful', 'powerful',
    'intense', 'violent', 'brutal', 'savage', 'ferocious', 'fierce', 'aggressive',
    'hostile', 'antagonistic', 'contentious', 'confrontational', 'combative',
    'quarrelsome', 'bellicose', 'warlike', 'militant', 'revolutionary', 'radical',
    'extreme', 'excessive', 'exaggerated', 'hyperbolic', 'melodramatic', 'theatrical',
    'grandiose', 'bombastic', 'pretentious', 'pompous', 'ostentatious', 'flamboyant',
    'showy', 'gaudy', 'garish', 'loud', 'raucous', 'cacophonous', 'discordant'
  ],
  Business: [
    'revenue', 'profit', 'acquisition', 'merger', 'portfolio', 'strategy', 'stakeholder',
    'dividend', 'liability', 'asset', 'equity', 'leverage', 'forecast', 'projection',
    'benchmark', 'metric', 'analytics', 'optimization', 'efficiency', 'productivity',
    'scalability', 'sustainability', 'compliance', 'regulation', 'governance',
    'fiduciary', 'accountability', 'transparency', 'integrity', 'ethics', 'corporate',
    'enterprise', 'venture', 'startup', 'entrepreneurship', 'innovation', 'disruption',
    'market share', 'competitive advantage', 'differentiation', 'positioning', 'branding',
    'marketing', 'advertising', 'promotion', 'campaign', 'engagement', 'conversion',
    'retention', 'acquisition cost', 'lifetime value', 'ROI', 'KPI', 'dashboard',
    'workflow', 'process', 'procedure', 'protocol', 'infrastructure', 'architecture',
    'integration', 'implementation', 'deployment', 'migration', 'optimization',
    'automation', 'digitalization', 'transformation', 'modernization', 'upgrade',
    'legacy', 'database', 'cloud', 'security', 'encryption', 'authentication',
    'authorization', 'compliance', 'audit', 'certification', 'standard', 'quality',
    'assurance', 'control', 'risk management', 'mitigation', 'contingency', 'scenario',
    'analysis', 'forecasting', 'budgeting', 'accounting', 'financial', 'fiscal',
    'monetary', 'cash flow', 'liquidity', 'solvency', 'insolvency', 'bankruptcy',
    'creditor', 'debtor', 'loan', 'mortgage', 'collateral', 'lien', 'covenant',
    'warrant', 'option', 'future', 'derivative', 'hedge', 'arbitrage', 'speculation',
    'investment', 'portfolio management', 'asset allocation', 'diversification',
    'rebalancing', 'compound interest', 'annuity', 'pension', 'retirement', 'succession'
  ]
};

const API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const OUTPUT_PATH = path.join(__dirname, '../public/words.json');

// API 호출 시 딜레이 (rate limiting)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWordData(word) {
  try {
    const response = await fetch(`${API_URL}${word.toLowerCase()}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const entry = data[0];
    const meanings = entry.meanings || [];
    const definition = meanings[0]?.definitions?.[0]?.definition || meanings[0]?.definitions?.[0] || '';
    const example = meanings[0]?.definitions?.[0]?.example || meanings[0]?.example || '';
    const phonetic = entry.phonetic || entry.phonetics?.[0]?.text || '';

    return {
      definition: typeof definition === 'string' ? definition : definition.definition || '',
      example: typeof example === 'string' ? example : example.definition || '',
      phonetic
    };
  } catch (err) {
    console.log(`⚠️  Failed to fetch "${word}": ${err.message}`);
    return null;
  }
}

async function generateWords() {
  console.log('📚 Starting to fetch words from Dictionary API...\n');

  const allWords = [];
  let count = 0;

  for (const [course, words] of Object.entries(VOCABULARY_LISTS)) {
    console.log(`\n🎯 Processing ${course} (${words.length} words)...`);

    for (const word of words) {
      const data = await fetchWordData(word);

      if (data) {
        allWords.push({
          word: word.toLowerCase(),
          meaning: `${word} (${data.definition.substring(0, 50)}...)`,
          ipa: data.phonetic || `/${word}/`,
          example: data.example || `This is an example with ${word}.`,
          category: course
        });

        count++;
        process.stdout.write(`\r✅ Loaded: ${count}/${Object.values(VOCABULARY_LISTS).reduce((a, b) => a + b.length, 0)}`);
      }

      // API rate limiting
      await delay(100);
    }
  }

  console.log(`\n\n📝 Total words collected: ${allWords.length}`);

  // 파일 저장
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allWords, null, 2));
  console.log(`✅ Saved to: ${OUTPUT_PATH}`);
}

generateWords().catch(console.error);
