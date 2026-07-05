/* ============================================================
   C2S VLSI Lab Portal — Login Page
   Stunning animated login with glassmorphic card
   ============================================================ */

function renderLoginPage() {
  return `
    <div class="login-layout">
      <div class="login-bg">
        <div class="login-particles" id="loginParticles"></div>
      </div>

      <div class="login-card animate-scaleIn">
        <div class="login-logo">
          <div class="login-logo-icon">
            <i data-lucide="cpu" style="width:32px;height:32px;color:#fff"></i>
          </div>
          <h1 class="login-title text-gradient">C2S VLSI Lab</h1>
          <p class="login-subtitle">Lab Management Portal</p>
        </div>

        <div class="login-error" id="loginError">
          <i data-lucide="alert-circle" style="width:16px;height:16px;flex-shrink:0"></i>
          <span id="loginErrorText">Invalid credentials</span>
        </div>

        <form id="loginForm" autocomplete="on">
          <div class="form-group">
            <label class="form-label" for="loginEmail">Email or Name</label>
            <div class="form-input-icon">
              <i data-lucide="mail" class="icon"></i>
              <input
                type="text"
                id="loginEmail"
                class="form-input"
                placeholder="you@c2s.edu or your name"
                autocomplete="username"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="loginPassword">Password</label>
            <div class="form-input-icon">
              <i data-lucide="lock" class="icon"></i>
              <input
                type="password"
                id="loginPassword"
                class="form-input"
                placeholder="Enter your password"
                autocomplete="current-password"
                required
                style="padding-right: 44px"
              />
              <button type="button" class="icon-right" id="togglePassword" aria-label="Toggle password visibility" style="background:none;border:none;cursor:pointer;">
                <i data-lucide="eye" style="width:18px;height:18px;color:var(--text-muted)"></i>
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg" id="loginBtn" style="width:100%;margin-top:var(--space-sm);">
            <span id="loginBtnText">Sign In</span>
            <div class="spinner" id="loginSpinner" style="display:none"></div>
          </button>
        </form>

        <div style="text-align:center;margin-top:var(--space-xl);">
          <p style="font-size:0.8125rem;color:var(--text-muted);margin:0;">
            Contact admin for account access
          </p>
        </div>
      </div>
    </div>
  `;
}

function initLoginPage() {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const toggleBtn = document.getElementById('togglePassword');
  const loginBtn = document.getElementById('loginBtn');
  const loginBtnText = document.getElementById('loginBtnText');
  const loginSpinner = document.getElementById('loginSpinner');
  const loginError = document.getElementById('loginError');
  const loginErrorText = document.getElementById('loginErrorText');

  if (!form) return;

  // Toggle password visibility
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      const icon = toggleBtn.querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
        if (window.lucide) lucide.createIcons({ nodes: [toggleBtn] });
      }
    });
  }

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showLoginError('Please enter your email/name and password.');
      return;
    }

    // Loading state
    setLoginLoading(true);
    hideLoginError();

    try {
      const res = await api.post('auth/login', { email, password });

      const data = res?.data || res;
      if (data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        navigate('/dashboard');
        showToast({ message: `Welcome back, ${data.user.name}!`, type: 'success' });
      } else {
        showLoginError('Unexpected response from server.');
      }
    } catch (err) {
      showLoginError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  });

  function setLoginLoading(loading) {
    loginBtn.disabled = loading;
    loginBtnText.style.display = loading ? 'none' : '';
    loginSpinner.style.display = loading ? 'inline-block' : 'none';
  }

  function showLoginError(message) {
    loginErrorText.textContent = message;
    loginError.classList.add('show');
  }

  function hideLoginError() {
    loginError.classList.remove('show');
  }

  // Focus email on load
  if (emailInput) {
    setTimeout(() => emailInput.focus(), 300);
  }

  // Add animated particles to login background
  createLoginParticles();
}

function createLoginParticles() {
  const container = document.getElementById('loginParticles');
  if (!container) return;

  // Inject particle styles
  if (!document.getElementById('login-particle-styles')) {
    const style = document.createElement('style');
    style.id = 'login-particle-styles';
    style.textContent = `
      .login-particles {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
      }
      .login-particle {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        animation: particleFloat linear infinite;
        opacity: 0;
      }
      @keyframes particleFloat {
        0% {
          opacity: 0;
          transform: translateY(100vh) scale(0);
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          opacity: 0;
          transform: translateY(-10vh) scale(1);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Create particles
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'login-particle';
    const size = Math.random() * 4 + 2;
    const left = Math.random() * 100;
    const duration = Math.random() * 15 + 10;
    const delay = Math.random() * 10;
    const color = Math.random() > 0.5
      ? 'rgba(79, 143, 255, 0.3)'
      : 'rgba(124, 92, 255, 0.3)';

    particle.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      background: ${color};
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      box-shadow: 0 0 ${size * 2}px ${color};
    `;
    container.appendChild(particle);
  }
}

// ── Global ────────────────────────────────────────────────────
window.renderLoginPage = renderLoginPage;
window.initLoginPage = initLoginPage;
