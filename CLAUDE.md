# heekiword — Claude 작업 지침

## 프로젝트 개요
영어 단어 학습 앱. Vite + Vanilla JS + Supabase(Anonymous Auth) + Vercel 배포.

- **배포**: https://heekiword.vercel.app
- **GitHub**: https://github.com/heekii/heekiword
- **상태**: v1 MVP (로그인 제거, 공개 연습용)

---

## 🎯 토큰 절약 우선 전략

### 1. 응답 길이 최소화
- 작업 완료 후: **1-2줄 요약만** (긴 설명 금지)
- 에러 발생 시: **문제 + 해결책만** (과정 설명 생략)
- 배포 완료: "✅ 배포됨" + URL만 (자세한 로그 불필요)

### 2. 파일 읽기 정책
- 변경 전: 해당 부분만 Read (전체 파일 X)
- 확인 필요 시: 라인 범위 지정 (offset/limit 사용)
- 배포 후: 변경 사항 Read 금지 (Edit이 성공했으면 OK)

### 3. 자동화 우선
- git commit + push + deploy를 **한 번에** (`&&`로 체이닝)
- 중간 상태 확인 금지 (필요할 때만)
- 백그라운드 작업은 완료 후 한 번만 확인

### 4. 진단은 필요할 때만
- 정상 작동 중: 추가 테스트 금지
- 에러 발생 시: 원인 파악 후 **한 번에 수정** (반복 테스트 X)

### 5. 커밋 메시지
```
feat:  새 기능
fix:   버그 수정
refactor: 구조 개선
```
→ **간단하게** (장문 설명 X)

---

## 기술 스택
- Frontend: Vanilla JS (클래스 기반)
- Styling: Tailwind CSS
- Build: Vite (dev: `npm run dev`, build: `npm run build`)
- Database: Supabase (Anonymous Auth)
- Hosting: Vercel (`vercel deploy --prod`)
- Words: `/public/words.json` (1200개 단어, 3개 코스)

---

## 파일 구조
```
src/
  main.js           # VocabularyApp 클래스 (메인)
  style.css         # Tailwind 설정
  supabase-client.js # Auth 함수들

public/
  words.json        # 1200개 단어 (TED/Movie/Business)
  
scripts/
  parse-words-from-md.js  # MD → JSON 변환 스크립트
  
files/
  ted_words.md      # TED 400개 단어
  movie_words.md    # Movie 400개 단어
  business_words.md # Business 400개 단어
```

---

## 코딩 컨벤션

### DO ✅
- 요청한 것만 구현 (추가 기능 금지)
- 간단한 변수명: `word`, `user`, `data`
- inline 주석은 WHY만 (`// 로그인 페이지 숨김 (v2에 추가)`)

### DON'T ❌
- 요청 없이 리팩토링, 정렬, 포맷팅
- 미사용 변수 정리 (커밋 영역만 정리)
- 과도한 추상화 (3줄 이상 반복될 때만)
- 에러 핸들링: 불가능한 시나리오는 다루지 않음

---

## 배포 워크플로우

```bash
# 1. 코드 수정
# 2. git add + commit + push + deploy (한 줄로)
git add <file> && git commit -m "feat: 설명" && git push && vercel deploy --prod

# 3. 완료 보고: "✅ 배포됨" + URL
```

**배포 후 추가 확인 금지** (Vercel 로그로 충분)

---

## 상시 지침 (매번 준수)

1. **로그인 페이지**: 주석 처리 상태 유지 (v2 추가 예정)
2. **학습 기록**: `saveLearningRecord` 주석 처리 상태 유지 (임시)
3. **Anonymous Auth**: 백그라운드에서 자동 작동 (사용자에게 숨김)
4. **Words 로드**: 앱 시작 시 `/public/words.json` fetch (localStorage 캐시)

---

## AI 행동 원칙

### "더 간단하게" 우선
- 불필요한 설명 X
- 한 줄 요약 O
- 링크만 제시 O

### "작동하는 것을 건드리지 말 것"
- Supabase 설정 건드리지 않기
- GitHub secrets 건드리지 않기
- Vercel 환경변수 건드리지 않기

### "사용자 판단 존중"
- 확신 없으면 질문 (선택지 제시)
- 변경 전 항상 설명 (주의 필요한 경우)

---

## 다음 단계 (v2 이상)
- 로그인 페이지 주석 해제 + Email/Google OAuth
- 학습 기록 저장 활성화 (Supabase)
- 캐릭터 진화 시스템 (데이터 기반)
- 일일 챌린지 (달력 UI)

---

*마지막 업데이트: 2026-06-09*
