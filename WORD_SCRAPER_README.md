# 단어 수집 스크립트 가이드

Guardian API / NYT API / TED에서 영어 텍스트를 수집하고, Claude API로 B1~C1 수준 단어의 한글 뜻과 필사 문장을 생성합니다.

---

## 📋 사전 준비

### 1. API 키 발급

#### Claude API (필수)
- 이미 있음 (환경 변수 설정)

#### Guardian API (권장)
1. https://open-platform.theguardian.com/
2. "Register" 클릭
3. API 키 발급
4. `.env` 파일에 추가

#### NYT API (권장)
1. https://developer.nytimes.com/
2. "Sign Up" 클릭
3. Article Search API 활성화
4. `.env` 파일에 추가

#### TED (선택)
- 공개 데이터 사용 (API 키 불필요)

### 2. 환경 설정

```bash
# 1. .env 파일 생성
cp .env.example .env

# 2. API 키 입력
# .env 파일을 열고 다음 항목 작성:
CLAUDE_API_KEY=sk-ant-...
GUARDIAN_API_KEY=your-key-here
NYT_API_KEY=your-key-here
```

### 3. 파이썬 라이브러리 설치

```bash
cd scripts
pip install -r requirements.txt
```

---

## 🚀 실행 방법

### 기본 실행

```bash
cd scripts
python word-scraper.py
```

### 결과

- ✓ 기존 `words.json`과 병합
- ✓ 새 단어는 한글 뜻 + 필사 문장 자동 생성
- ✓ 중복 단어는 예문만 추가

---

## 📊 결과 형식

```json
{
  "word": "infrastructure",
  "meaning": "기간 시설, 인프라 구조",
  "ipa": "/ˈɪnfrəˌstrʌktʃər/",
  "example": "Modern infrastructure is essential for economic development.",
  "dictation_sentence": "Good infrastructure supports economic growth.",
  "source": "news",
  "category": "English"
}
```

---

## ⚙️ 커스터마이징

### 수집 단어 개수 변경

`word-scraper.py` 라인 195:
```python
extracted_words = list(extracted_words)[:10]  # 10 → 변경
```

### 추가 단어 목록 확장

`word-scraper.py` 라인 26-30:
```python
CEFR_B1_C1_WORDS = {
    '기존_단어들',
    'new_word_1',
    'new_word_2',
}
```

### 프롬프트 커스터마이징

`word-scraper.py` 라인 100 `generate_word_data()` 함수 수정

---

## 🐛 트러블슈팅

### "API 키 없음" 에러
```
⚠️  GUARDIAN_API_KEY 없음 - 스킵
```
→ `.env` 파일에 API 키 추가

### JSON 파싱 실패
```
⚠️  JSON 파싱 실패: word_name
```
→ Claude 응답이 JSON 형식이 아님 (재시도 중)

### 네트워크 타임아웃
```
✗ Guardian API 오류: [Errno 11001]
```
→ 인터넷 연결 확인 또는 API 상태 확인

---

## 📝 참고사항

- **첫 실행**: 모든 단어가 생성됨 (시간 소요 가능)
- **이후 실행**: 새 단어만 생성 (빠름)
- **요청 제한**: Guardian/NYT API는 요청 제한이 있을 수 있음
- **비용**: Claude API 사용량에 따라 비용 발생 가능

---

## 📌 예약 실행 (선택사항)

### Windows (Task Scheduler)
```powershell
# 매주 월요일 오전 10시 실행
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 10am
$action = New-ScheduledTaskAction -Execute "python" -Argument "scripts/word-scraper.py"
Register-ScheduledTask -TaskName "WordScraper" -Trigger $trigger -Action $action
```

### macOS/Linux (cron)
```bash
# 매주 월요일 오전 10시 실행
0 10 * * 1 cd /path/to/heekiword && python scripts/word-scraper.py
```

---

**질문이 있으면 알려주세요!** 🎯
