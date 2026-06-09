# HeekiWord 프로젝트 계획

## 📌 프로젝트 개요
**프로젝트명**: HeekiWord  
**목표**: 영단어를 쉽고 즐겁게 학습할 수 있는 웹 기반 암기 앱  
**대상 사용자**: 영어 학습자 (초급~중급)

---

## 🎯 핵심 기능

### Phase 1 (MVP)
- [ ] 플래시카드 학습 (단어 뜻 맞추기)
- [ ] 단어 목록 관리
- [ ] 진도 추적 (학습한 단어 수)

### Phase 2 (Enhancement)
- [ ] 퀴즈 게임 (4지선다형)
- [ ] 즐겨찾기 기능
- [ ] 학습 통계

### Phase 3 (Advanced)
- [ ] 발음 (TTS)
- [ ] 예문 제시
- [ ] 사용자 인증 / 클라우드 동기화

---

## 📁 기술 스택
- **Frontend**: 바닐라 HTML/CSS/JavaScript
- **저장소**: localStorage (초기 단계)
- **차트 라이브러리**: Chart.js (통계 시각화용)

---

## 📊 페이지 구조

```
index.html (홈)
├── learn.html (학습 - 플래시카드)
├── quiz.html (퀴즈)
├── vocabulary.html (내 단어장)
├── stats.html (통계)
└── settings.html (설정)
```

---

## 🎨 디자인 가이드

### 컬러 팔레트
- **Primary**: #6366f1 (인디고)
- **Secondary**: #8b5cf6 (보라)
- **Success**: #10b981 (초록)
- **Danger**: #ef4444 (빨강)

### 타이포그래피
- 제목: 24px ~ 32px, 700 weight
- 본문: 16px, 400 weight

---

## 📝 단어 데이터 구조

```json
{
  "id": "word-001",
  "word": "eloquent",
  "meaning": "유창한, 표현력 있는",
  "example": "She gave an eloquent speech.",
  "learned": false,
  "createdAt": "2025-01-01"
}
```

---

## 🚀 다음 단계
1. 기본 UI/UX 완성
2. 학습 기능 개발 (플래시카드)
3. 저장소 통합 (localStorage)
4. 테스트 & 배포

---

**Last Updated**: 2025-06-09  
**Owner**: heeki
