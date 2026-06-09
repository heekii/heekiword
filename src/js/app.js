// HeekiWord App
// Main application logic

console.log('🎯 HeekiWord 앱이 로드되었습니다');

// 버튼 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('click', handleButtonClick);
  });
});

function handleButtonClick(e) {
  const buttonText = e.target.textContent;
  console.log(`버튼 클릭: ${buttonText}`);

  if (buttonText.includes('학습')) {
    console.log('학습 페이지로 이동');
    // 학습 페이지로 이동 로직
  } else if (buttonText.includes('단어장')) {
    console.log('내 단어장 페이지로 이동');
    // 단어장 페이지로 이동 로직
  }
}

// 향후 기능들
// - 플래시카드 학습
// - 퀴즈 게임
// - 진도 추적
// - 데이터 저장 (localStorage)
