#!/usr/bin/env python3
"""
단어 수집 및 학습 자료 생성 스크립트

Guardian API / NYT API / TED에서 영어 텍스트 수집
B1~C1 수준 단어 추출
Claude API로 한글 뜻 + 예문 생성
"""

import os
import json
import requests
from typing import List, Dict
from dotenv import load_dotenv
from anthropic import Anthropic

# 환경 변수 로드
load_dotenv()

CLAUDE_API_KEY = os.getenv('CLAUDE_API_KEY')
GUARDIAN_API_KEY = os.getenv('GUARDIAN_API_KEY')
NYT_API_KEY = os.getenv('NYT_API_KEY')

# B1~C1 수준 단어 (CEFRLevel)
CEFR_B1_C1_WORDS = {
    'infrastructure', 'rollout', 'cooperation', 'delivery', 'institute',
    'strategically', 'academic', 'establishment', 'resilience', 'transition',
    'phenomenon', 'comprehensive', 'facilitate', 'sustain', 'innovative',
    'collaborate', 'advocate', 'abundance', 'coherent', 'paradigm',
    'meticulous', 'eloquent', 'enigmatic', 'diligent', 'pragmatic',
    'perpetual', 'ephemeral', 'ubiquitous', 'ambiguous', 'candid'
}

class WordScraper:
    def __init__(self):
        self.client = Anthropic()
        self.collected_texts = []
        self.words_data = {}
        self.load_existing_words()

    def load_existing_words(self):
        """기존 words.json 로드"""
        words_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'words.json')
        if os.path.exists(words_path):
            with open(words_path, 'r', encoding='utf-8') as f:
                self.words_data = json.load(f)
        print(f"✓ 기존 단어 {len(self.words_data)}개 로드됨")

    def fetch_guardian_articles(self, query: str = "global", limit: int = 5) -> List[str]:
        """Guardian API에서 기사 수집"""
        if not GUARDIAN_API_KEY:
            print("⚠️  GUARDIAN_API_KEY 없음 - 스킵")
            return []

        try:
            url = "https://open-platform.theguardian.com/search"
            params = {
                'q': query,
                'api-key': GUARDIAN_API_KEY,
                'page-size': limit
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            texts = []
            for result in response.json()['response']['results'][:limit]:
                texts.append(result.get('webTitle', '') + ' ' + result.get('fields', {}).get('bodyText', ''))

            print(f"✓ Guardian에서 {len(texts)}개 기사 수집")
            return texts
        except Exception as e:
            print(f"✗ Guardian API 오류: {e}")
            return []

    def fetch_nyt_articles(self, query: str = "world", limit: int = 5) -> List[str]:
        """NYT API에서 기사 수집"""
        if not NYT_API_KEY:
            print("⚠️  NYT_API_KEY 없음 - 스킵")
            return []

        try:
            url = "https://api.nytimes.com/svc/search/v2/articlesearch.json"
            params = {
                'q': query,
                'api-key': NYT_API_KEY,
                'limit': limit
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            texts = []
            for doc in response.json()['response']['docs'][:limit]:
                texts.append(doc.get('headline', {}).get('main', '') + ' ' + doc.get('snippet', ''))

            print(f"✓ NYT에서 {len(texts)}개 기사 수집")
            return texts
        except Exception as e:
            print(f"✗ NYT API 오류: {e}")
            return []

    def fetch_ted_talks(self, limit: int = 5) -> List[str]:
        """TED 스크립트 수집 (공개 API)"""
        try:
            url = "https://www.ted.com/graphql"

            # TED talks를 위한 GraphQL 쿼리 (간단한 예시)
            # 실제로는 TED의 공개 API 또는 스크래핑 필요
            print(f"⚠️  TED 트랜스크립트는 별도 설정 필요")
            return []
        except Exception as e:
            print(f"✗ TED 오류: {e}")
            return []

    def extract_cefr_words(self, text: str) -> List[str]:
        """텍스트에서 B1~C1 수준 단어 추출"""
        words = text.lower().split()
        found_words = [w.strip('.,!?;:"') for w in words if w.strip('.,!?;:"') in CEFR_B1_C1_WORDS]
        return list(set(found_words))

    def generate_word_data(self, word: str, example_sentence: str) -> Dict:
        """Claude API로 단어 정보 생성"""
        prompt = f"""다음 영단어에 대해 한글 뜻과 필사 예문을 생성해줘.

단어: {word}
예문: {example_sentence}

다음 JSON 형식으로 응답해줘 (JSON만, 다른 설명 없이):
{{
  "korean_meaning": "한글 뜻 (1~2줄)",
  "dictation_sentence": "40자 내외의 자연스러운 필사 문장",
  "ipa": "/IPA 발음기호/ (생략 가능)",
  "source_type": "news|ted|article"
}}
"""
        try:
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}]
            )

            result_text = response.content[0].text
            # JSON 파싱 시도
            try:
                return json.loads(result_text)
            except json.JSONDecodeError:
                print(f"⚠️  JSON 파싱 실패: {word}")
                return None
        except Exception as e:
            print(f"✗ Claude API 오류 ({word}): {e}")
            return None

    def run(self):
        """메인 실행 함수"""
        print("\n=== 단어 수집 스크립트 시작 ===\n")

        # 1. 텍스트 수집
        print("[1단계] 텍스트 수집 중...")
        guardian_texts = self.fetch_guardian_articles(limit=2)
        nyt_texts = self.fetch_nyt_articles(limit=2)
        ted_texts = self.fetch_ted_talks(limit=2)

        all_texts = guardian_texts + nyt_texts + ted_texts
        if not all_texts:
            print("❌ 수집된 텍스트 없음. API 키를 확인하세요.")
            return

        # 2. 단어 추출
        print("\n[2단계] B1~C1 단어 추출 중...")
        extracted_words = set()
        for text in all_texts:
            extracted_words.update(self.extract_cefr_words(text))

        extracted_words = list(extracted_words)[:10]  # 테스트용 10개만
        print(f"✓ {len(extracted_words)}개 단어 추출: {extracted_words}")

        # 3. Claude API로 정보 생성
        print("\n[3단계] Claude API로 단어 정보 생성 중...")
        new_words = {}

        for word in extracted_words:
            if word in self.words_data:
                print(f"⊘ {word}: 이미 존재 - 스킵")
                continue

            # 단순 예문 (실제로는 수집된 텍스트에서 추출)
            example = f"This is a sentence with {word}."

            word_data = self.generate_word_data(word, example)
            if word_data:
                new_words[word] = {
                    "word": word,
                    "meaning": word_data.get('korean_meaning', ''),
                    "ipa": word_data.get('ipa', ''),
                    "example": example,
                    "dictation_sentence": word_data.get('dictation_sentence', ''),
                    "source": word_data.get('source_type', 'unknown'),
                    "category": "English"
                }
                print(f"✓ {word}: {word_data.get('korean_meaning', '')}")

        # 4. JSON 저장 및 병합
        print("\n[4단계] 결과 저장 중...")
        self.words_data.update(new_words)

        output_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'words.json')
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(list(self.words_data.values()), f, ensure_ascii=False, indent=2)

        print(f"✓ {len(self.words_data)}개 단어가 {output_path}에 저장됨")
        print(f"  (신규: {len(new_words)}, 기존: {len(self.words_data) - len(new_words)})")
        print("\n=== 완료 ===\n")

if __name__ == "__main__":
    scraper = WordScraper()
    scraper.run()
