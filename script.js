document.addEventListener("DOMContentLoaded", () => {
  /* ==========================================
     STATE MANAGEMENT
  ========================================== */
  const state = {
    users: JSON.parse(localStorage.getItem("nortis_users")) || [],
    currentUser: JSON.parse(localStorage.getItem("nortis_session")) || null,
  };

  /* ==========================================
     DOM ELEMENTS
  ========================================== */
  const el = {
    authScreen: document.getElementById("authScreen"),
    appScreen: document.getElementById("appScreen"),
    loginForm: document.getElementById("loginForm"),
    registerForm: document.getElementById("registerForm"),
    switchButton: document.getElementById("switchButton"),
    switchText: document.getElementById("switchText"),
    loginMsg: document.getElementById("loginMessage"),
    registerMsg: document.getElementById("registerMessage"),
    logoutBtn: document.getElementById("logoutButton"),
    
    // Navigation
    navItems: document.querySelectorAll(".nav-item"),
    views: {
      dashboard: document.getElementById("dashboardView"),
      transactions: document.getElementById("transactionsView"),
      profile: document.getElementById("profileView"),
    },

    // User details
    greeting: document.getElementById("greeting"),
    userNameTop: document.getElementById("userNameTop"),
    userAvatar: document.getElementById("userAvatar"),
    
    // Financials
    balanceValue: document.getElementById("balanceValue"),
    incomeValue: document.getElementById("incomeValue"),
    expenseValue: document.getElementById("expenseValue"),
    accountNumber: document.getElementById("accountNumber"),
    
    // Movement Form
    movementForm: document.getElementById("movementForm"),
    movementDesc: document.getElementById("movementDescription"),
    movementAmount: document.getElementById("movementAmount"),
    movementType: document.getElementById("movementType"),
    movementMsg: document.getElementById("movementMessage"),
    transactionsList: document.getElementById("transactionsList"),

    // Profile Screen
    profileAvatar: document.getElementById("profileAvatar"),
    profileName: document.getElementById("profileName"),
    profileEmail: document.getElementById("profileEmail"),
    profileAccount: document.getElementById("profileAccount"),
    profileSince: document.getElementById("profileSince"),
  };

  /* ==========================================
     INITIALIZATION
  ========================================== */
  init();

  function init() {
    setupEventListeners();
    if (state.currentUser) {
      showApp();
    } else {
      showAuth();
    }
  }

  /* ==========================================
     EVENT LISTENERS
  ========================================== */
  function setupEventListeners() {
    // Auth Toggle
    el.switchButton.addEventListener("click", toggleAuthMode);

    // Auth Actions
    el.loginForm.addEventListener("submit", handleLogin);
    el.registerForm.addEventListener("submit", handleRegister);
    el.logoutBtn.addEventListener("click", handleLogout);

    // Navigation
    el.navItems.forEach((btn) => {
      btn.addEventListener("click", () => switchView(btn.dataset.view));
    });

    // Movements
    el.movementForm.addEventListener("submit", handleAddMovement);
  }

  /* ==========================================
     AUTHENTICATION LOGIC
  ========================================== */
  function toggleAuthMode() {
    const isLoginVisible = !el.loginForm.classList.contains("hidden");
    
    el.loginForm.classList.toggle("hidden", isLoginVisible);
    el.registerForm.classList.toggle("hidden", !isLoginVisible);
    
    el.switchText.textContent = isLoginVisible
      ? "Já tem uma conta?"
      : "Ainda não tem conta?";
    el.switchButton.textContent = isLoginVisible ? "Entrar" : "Criar conta";
    
    clearMessages();
  }

  function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value;

    if (state.users.some((u) => u.email === email)) {
      showMessage(el.registerMsg, "Este e-mail já está cadastrado.", "error");
      return;
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      password,
      accountNumber: Math.floor(100000 + Math.random() * 900000).toString(),
      createdAt: new Date().toLocaleDateString("pt-BR"),
      transactions: [],
    };

    state.users.push(newUser);
    saveUsers();

    state.currentUser = newUser;
    saveSession();

    showMessage(el.registerMsg, "Conta criada com sucesso!", "success");
    setTimeout(showApp, 800);
  }

  function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    const user = state.users.find((u) => u.email === email && u.password === password);

    if (!user) {
      showMessage(el.loginMsg, "E-mail ou senha inválidos.", "error");
      return;
    }

    state.currentUser = user;
    saveSession();
    showApp();
  }

  function handleLogout() {
    state.currentUser = null;
    localStorage.removeItem("nortis_session");
    showAuth();
  }

  /* ==========================================
     APP CORE & NAVIGATION
  ========================================== */
  function showAuth() {
    el.authScreen.classList.remove("hidden");
    el.appScreen.classList.add("hidden");
    clearMessages();
  }

  function showApp() {
    el.authScreen.classList.add("hidden");
    el.appScreen.classList.remove("hidden");
    switchView("dashboard");
    updateUI();
  }

  function switchView(targetView) {
    el.navItems.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === targetView);
    });

    Object.keys(el.views).forEach((viewKey) => {
      el.views[viewKey].classList.toggle("hidden", viewKey !== targetView);
    });
  }

  /* ==========================================
     FINANCIAL LOGIC & UI UPDATES
  ========================================== */
  function handleAddMovement(e) {
    e.preventDefault();

    const description = el.movementDesc.value.trim();
    const amount = parseFloat(el.movementAmount.value);
    const type = el.movementType.value;

    if (!description || isNaN(amount) || amount <= 0) {
      showMessage(el.movementMsg, "Insira valores válidos.", "error");
      return;
    }

    const transaction = {
      id: Date.now(),
      description,
      amount,
      type,
      date: new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    state.currentUser.transactions.unshift(transaction);
    
    // Sincroniza usuário na lista geral
    const index = state.users.findIndex((u) => u.id === state.currentUser.id);
    if (index !== -1) state.users[index] = state.currentUser;

    saveUsers();
    saveSession();
    updateUI();

    el.movementForm.reset();
    showMessage(el.movementMsg, "Movimentação registrada!", "success");
    setTimeout(() => clearMessages(), 2500);
  }

  function updateUI() {
    if (!state.currentUser) return;

    const { name, email, accountNumber, createdAt, transactions } = state.currentUser;
    const firstName = name.split(" ")[0];
    const initial = firstName.charAt(0).toUpperCase();

    // Headers & Badges
    el.greeting.textContent = `Olá, ${firstName}`;
    el.userNameTop.textContent = name;
    el.userAvatar.textContent = initial;

    // Profile Card
    el.profileName.textContent = name;
    el.profileEmail.textContent = email;
    el.profileAvatar.textContent = initial;
    el.profileAccount.textContent = accountNumber;
    el.profileSince.textContent = createdAt;
    el.accountNumber.textContent = `Conta ${accountNumber}`;

    // Calculations
    const totals = transactions.reduce(
      (acc, tx) => {
        if (tx.type === "deposit") acc.income += tx.amount;
        else acc.expense += tx.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );

    const balance = totals.income - totals.expense;

    el.balanceValue.textContent = formatCurrency(balance);
    el.incomeValue.textContent = formatCurrency(totals.income);
    el.expenseValue.textContent = formatCurrency(totals.expense);

    renderTransactions(transactions);
  }

  function renderTransactions(transactions) {
    if (transactions.length === 0) {
      el.transactionsList.innerHTML = `
        <p style="text-align: center; color: var(--text-muted); padding: 2rem 0;">
          Nenhuma movimentação registrada.
        </p>`;
      return;
    }

    el.transactionsList.innerHTML = transactions
      .map((tx) => {
        const isDeposit = tx.type === "deposit";
        const sign = isDeposit ? "+" : "-";
        const colorClass = isDeposit ? "green" : "red";

        return `
          <div class="transaction-item">
            <div class="tx-info">
              <span class="tx-title">${escapeHTML(tx.description)}</span>
              <span class="tx-date">${tx.date}</span>
            </div>
            <span class="tx-value ${colorClass}">
              ${sign} ${formatCurrency(tx.amount)}
            </span>
          </div>
        `;
      })
      .join("");
  }

  /* ==========================================
     HELPERS & UTILS
  ========================================== */
  function formatCurrency(value) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `feedback-msg ${type}`;
  }

  function clearMessages() {
    [el.loginMsg, el.registerMsg, el.movementMsg].forEach((element) => {
      element.textContent = "";
      element.className = "feedback-msg";
    });
  }

  function saveUsers() {
    localStorage.setItem("nortis_users", JSON.stringify(state.users));
  }

  function saveSession() {
    localStorage.setItem("nortis_session", JSON.stringify(state.currentUser));
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
});
