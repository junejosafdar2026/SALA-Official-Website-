// ============================================================
//  SHAH ABDUL LATIF ACADEMY — English Quiz Common JS
//  Each topic page uses this shared quiz engine
// ============================================================

// PAGE SIZE — 10 MCQs per page
const PAGE_SIZE = 10;

let allQuestions = [];
let currentPage  = 0;
let totalPages   = 0;
let answers      = {}; // { globalIndex: chosenIndex }
let submitted    = {}; // { globalIndex: true }

function initQuiz(questions, topicKey) {
  allQuestions = questions;
  totalPages   = Math.ceil(allQuestions.length / PAGE_SIZE);
  // Restore saved answers from session
  const saved = JSON.parse(sessionStorage.getItem('eng_ans_' + topicKey) || '{}');
  answers   = saved.answers   || {};
  submitted = saved.submitted || {};
  currentPage = parseInt(sessionStorage.getItem('eng_page_' + topicKey) || '0');
  renderPage();
}

function saveSession(topicKey) {
  sessionStorage.setItem('eng_ans_'  + topicKey, JSON.stringify({ answers, submitted }));
  sessionStorage.setItem('eng_page_' + topicKey, currentPage);
}

function renderPage() {
  const start  = currentPage * PAGE_SIZE;
  const end    = Math.min(start + PAGE_SIZE, allQuestions.length);
  const slice  = allQuestions.slice(start, end);

  // Page info
  document.getElementById('pageInfo').textContent =
    `Page ${currentPage + 1} of ${totalPages}`;

  // Progress bar
  const pct = ((currentPage + 1) / totalPages) * 100;
  document.getElementById('pageProgressFill').style.width = pct + '%';

  // Score so far
  updateScoreDisplay();

  // Questions
  const container = document.getElementById('questionsContainer');
  container.innerHTML = slice.map((q, i) => {
    const gi = start + i; // global index
    const letters = ['A','B','C','D'];
    const isSubmitted = submitted[gi];
    const chosen      = answers[gi];

    return `
      <div class="mcq-card" id="mcq-${gi}">
        <div class="mcq-num">Q${gi + 1}.</div>
        <div class="mcq-text">${escHtml(q.q)}</div>
        <div class="mcq-opts">
          ${q.opts.map((opt, oi) => {
            let cls = 'mcq-opt';
            if (isSubmitted) {
              if (oi === q.ans)                cls += ' correct';
              else if (oi === chosen && chosen !== q.ans) cls += ' wrong';
              else cls += ' disabled';
            } else if (chosen === oi) {
              cls += ' selected';
            }
            return `<div class="${cls}" onclick="pickAnswer(${gi}, ${oi})">
              <span class="mcq-letter">${letters[oi]}</span>
              <span>${escHtml(opt)}</span>
            </div>`;
          }).join('')}
        </div>
        ${isSubmitted ? `
          <div class="mcq-feedback ${chosen === q.ans ? 'fb-correct' : 'fb-wrong'}">
            ${chosen === q.ans
              ? '✅ Correct!'
              : `❌ Wrong! Correct answer: <strong>${q.opts[q.ans]}</strong>`}
          </div>` : ''}
      </div>`;
  }).join('');

  // Buttons
  document.getElementById('btnPrev').disabled = currentPage === 0;
  document.getElementById('btnNext').disabled = currentPage >= totalPages - 1;

  // Check all answered on this page
  const allAnswered = slice.every((_, i) => answers[start + i] !== undefined);
  const submitBtn   = document.getElementById('btnSubmit');
  if (submitBtn) {
    submitBtn.style.display = allAnswered ? 'inline-flex' : 'none';
    // Hide submit if all already submitted
    const allSubm = slice.every((_, i) => submitted[start + i]);
    if (allSubm) submitBtn.style.display = 'none';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function pickAnswer(gi, oi) {
  if (submitted[gi]) return; // already locked
  answers[gi] = oi;
  saveSession(window._topicKey);
  renderPage();
}

function submitPage() {
  const start = currentPage * PAGE_SIZE;
  const end   = Math.min(start + PAGE_SIZE, allQuestions.length);
  for (let gi = start; gi < end; gi++) {
    if (answers[gi] !== undefined) submitted[gi] = true;
  }
  saveSession(window._topicKey);
  renderPage();
  updateScoreDisplay();
}

function goPage(dir) {
  currentPage += dir;
  if (currentPage < 0) currentPage = 0;
  if (currentPage >= totalPages) currentPage = totalPages - 1;
  saveSession(window._topicKey);
  renderPage();
}

function updateScoreDisplay() {
  const total   = allQuestions.length;
  const done    = Object.keys(submitted).length;
  const correct = Object.keys(submitted).filter(gi => answers[gi] === allQuestions[gi].ans).length;
  document.getElementById('scoreDisplay').textContent =
    done > 0 ? `✅ ${correct} / ${done} correct so far` : 'Answer questions to see your score';
}

function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

