// ============================================================
//  SHAH ABDUL LATIF ACADEMY — Shared JS
//  By Safdar Junejo
// ============================================================

// ── CONFIG ──────────────────────────────────────────────────
const ADMIN_EMAIL    = "safdar@sala.edu.pk";
const ADMIN_PASSWORD = "sala2026";
const SITE_KEY       = "sala_";

// ── STORAGE HELPERS ─────────────────────────────────────────
const Store = {
  get:  (k, def=null) => { try { return JSON.parse(localStorage.getItem(SITE_KEY+k)) ?? def; } catch { return def; } },
  set:  (k, v)        => localStorage.setItem(SITE_KEY+k, JSON.stringify(v)),
  push: (k, v)        => { const arr = Store.get(k, []); arr.push(v); Store.set(k, arr); },
};

// ── VISITOR TRACKING ────────────────────────────────────────
(function trackVisit() {
  const visits = Store.get('visits', []);
  visits.push({
    time:      new Date().toISOString(),
    page:      location.pathname.split('/').pop() || 'index.html',
    userAgent: navigator.userAgent.substring(0, 80),
    referrer:  document.referrer || 'Direct',
    id:        Math.random().toString(36).slice(2,10)
  });
  // keep last 500
  if (visits.length > 500) visits.splice(0, visits.length - 500);
  Store.set('visits', visits);
})();

// ── AUTH ────────────────────────────────────────────────────
const Auth = {
  getUsers() { return Store.get('users', []); },
  saveUsers(u) { Store.set('users', u); },
  currentUser() { return Store.get('session', null); },

  register(name, email, password) {
    if (!name||!email||!password) return {ok:false,msg:'All fields required.'};
    const users = this.getUsers();
    if (users.find(u=>u.email===email)) return {ok:false,msg:'Email already registered.'};
    const user = {
      id:         Math.random().toString(36).slice(2,10),
      name, email, password,
      joinedAt:   new Date().toISOString(),
      xp:         0,
      quizzesDone:0,
      mathScore:  0, mathTotal:  0,
      engScore:   0, engTotal:   0,
    };
    users.push(user);
    this.saveUsers(users);
    // log signup for admin
    Store.push('signups', { name, email, time: new Date().toISOString() });
    Store.set('session', user);
    return {ok:true, user};
  },

  login(email, password) {
    if (email===ADMIN_EMAIL && password===ADMIN_PASSWORD) {
      const admin = { id:'admin', name:'Safdar Junejo', email, isAdmin:true };
      Store.set('session', admin);
      return {ok:true, user:admin};
    }
    const users = this.getUsers();
    const user = users.find(u=>u.email===email && u.password===password);
    if (!user) return {ok:false,msg:'Invalid email or password.'};
    Store.set('session', user);
    return {ok:true, user};
  },

  logout() { localStorage.removeItem(SITE_KEY+'session'); },

  updateUser(updated) {
    const users = this.getUsers();
    const idx = users.findIndex(u=>u.id===updated.id);
    if (idx>=0) { users[idx]=updated; this.saveUsers(users); }
    Store.set('session', updated);
  },

  isAdmin() { const u=this.currentUser(); return u&&u.isAdmin; }
};

// ── NAV: set active link ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  // Inject login/logout button in nav if container exists
  const navExtra = document.getElementById('nav-auth-btn');
  if (navExtra) {
    const u = Auth.currentUser();
    if (u) {
      navExtra.innerHTML = `
        <a href="profile.html">👤 ${u.name.split(' ')[0]}</a>
        ${u.isAdmin ? '<a href="admin.html">🛡️ Admin</a>' : ''}
        <a href="#" onclick="Auth.logout();location.href='index.html'">🚪 Logout</a>`;
    } else {
      navExtra.innerHTML = `<a href="login.html">🔑 Login / Sign Up</a>`;
    }
  }
});

// ── TOAST ────────────────────────────────────────────────────
function showToast(msg, type='success') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = `
      position:fixed;bottom:28px;right:28px;z-index:9999;
      padding:14px 22px;border-radius:12px;font-size:14px;font-weight:700;
      box-shadow:0 8px 24px rgba(0,0,0,0.2);transition:.3s;
      transform:translateY(80px);opacity:0;max-width:320px;
      font-family:'Nunito',sans-serif;
    `;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.background = type==='success'?'#006644':type==='error'?'#c0392b':'#c9a84c';
  t.style.color = type==='gold'?'#1a1208':'#fff';
  t.style.transform='translateY(0)'; t.style.opacity='1';
  setTimeout(()=>{ t.style.transform='translateY(80px)'; t.style.opacity='0'; }, 3200);
}

// ── COMMENTS ────────────────────────────────────────────────
const Comments = {
  get(section) { return Store.get('comments_'+section, []); },
  add(section, author, text) {
    const c = { id: Date.now(), author, text, time: new Date().toISOString() };
    Store.push('comments_'+section, c);
    return c;
  }
};

function renderComments(section, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const list = Comments.get(section);
  if (!list.length) { el.innerHTML = '<p style="color:var(--muted);font-size:14px;">No comments yet. Be the first!</p>'; return; }
  el.innerHTML = list.slice(-50).reverse().map(c => `
    <div class="comment-item">
      <div class="comment-avatar">${c.author.charAt(0).toUpperCase()}</div>
      <div class="comment-content">
        <span class="comment-author">${escHtml(c.author)}</span>
        <span class="comment-time">${timeAgo(c.time)}</span>
        <div class="comment-text">${escHtml(c.text)}</div>
      </div>
    </div>`).join('');
}

function submitComment(section, containerId) {
  const u = Auth.currentUser();
  const textEl = document.getElementById('comment-input-'+section);
  const text = textEl ? textEl.value.trim() : '';
  if (!text) { showToast('Please write a comment first.','error'); return; }
  if (!u) { showToast('Please login to comment.','error'); return; }
  Comments.add(section, u.name, text);
  if (textEl) textEl.value = '';
  renderComments(section, containerId);
  showToast('Comment posted! ✅');
}

// ── HELPERS ─────────────────────────────────────────────────
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function timeAgo(iso) {
  const d = new Date(iso), now = new Date();
  const s = Math.floor((now-d)/1000);
  if (s<60) return 'just now';
  if (s<3600) return Math.floor(s/60)+'m ago';
  if (s<86400) return Math.floor(s/3600)+'h ago';
  return d.toLocaleDateString();
}

function requireLogin(redirect='login.html') {
  if (!Auth.currentUser()) { location.href = redirect; return false; }
  return true;
  }
                                               
