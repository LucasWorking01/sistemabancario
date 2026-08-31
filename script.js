// =========================
// "BANCO DE DADOS" EM MEMÓRIA
// (reinicia a cada recarregamento — sem localStorage)
// =========================
const users = [];
let currentUser = null;

const money = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function generateAccountNumber() {
  const number = Math.floor(10000 + Math.random() * 89999);
  const digit = Math.floor(Math.random() * 9);
  return `${number}-${digit}`;
}

function initials(name) {
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

// =========================
// ELEMENTOS
// =========================
const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('appScreen');

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const switchButton = document.getElementById('switchButton');
const switchText = document.getElementById('switchText');

const loginMessage = document.getElementById('loginMessage');
const registerMessage = document.getElementById('registerMessage');
const movementMessage = document.getElementById('movementMessage');

const greeting = document.getElementById('greeting');
const userAvatar = document.getElementById('userAvatar');
const userNameTop = document.getElementById('userNameTop');

const balanceValue = document.getElementById('balanceValue');
const accountNumberEl = document.getElementById('accountNumber');
const incomeValue = document.getElementById('incomeValue');
const expenseValue = document.getElementById('expenseValue');
const transactionsList = document.getElementById('transactionsList');

const movementForm = document.getElementById('movementForm');

const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileAccount = document.getElementById('profileAccount');
const profileSince = document.getElementById('profileSince');

const navItems = document.querySelectorAll('.nav-item');
const views = {
  dashboard: document.getElementById('dashboardView'),
  transactions: document.getElementById('transactionsView'),
  profile: document.getElementById('profileView'),
};

// =========================
// ALTERNAR LOGIN / CADASTRO
// =========================
let showingLogin = true;

switchButton.addEventListener('click', () => {
  showingLogin = !showingLogin;
  loginForm.classList.toggle('hidden', !showingLogin);
  registerForm.classList.toggle('hidden', showingLogin);
  switchText.textContent = showingLogin ? 'Ainda não tem conta?' : 'Já tem conta?';
  switchButton.textContent = showingLogin ? 'Criar conta' : 'Entrar';
  loginMessage.textContent = '';
  registerMessage.textContent = '';
});

// =========================
// CADASTRO
// =========================
registerForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim().toLowerCase();
  const password = document.getElementById('registerPassword').value;

  if (password.length < 6) {
    setMessage(registerMessage, 'A senha precisa ter pelo menos 6 caracteres.', 'error');
    return;
  }

  if (users.some((user) => user.email === email)) {
    setMessage(registerMessage, 'Já existe uma conta com esse e-mail.', 'error');
    return;
  }

  const newUser = {
    name,
    email,
    password,
    account: generateAccountNumber(),
    createdAt: new Date(),
    transactions: [],
  };

  users.push(newUser);
  setMessage(registerMessage, 'Conta criada! Entrando...', 'success');

  setTimeout(() => {
    currentUser = newUser;
    enterApp();
  }, 500);
});

// =========================
// LOGIN
// =========================
loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;

  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    setMessage(loginMessage, 'E-mail ou senha incorretos.', 'error');
    return;
  }

  setMessage(loginMessage, '', '');
  currentUser = user;
  enterApp();
});

function setMessage(element, text, type) {
  element.textContent = text;
  element.classList.remove('message-error', 'message-success');
  if (type === 'error') element.classList.add('message-error');
  if (type === 'success') element.classList.add('message-success');
}

// =========================
// ENTRAR NO APP
// =========================
function enterApp() {
  authScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');

  const firstName = currentUser.name.split(' ')[0];
  greeting.textContent = `Olá, ${firstName}`;
  userAvatar.textContent = initials(currentUser.name);
  userNameTop.textContent = currentUser.name;

  profileAvatar.textContent = initials(currentUser.name);
  profileName.textContent = currentUser.name;
  profileEmail.textContent = currentUser.email;
  profileAccount.textContent = currentUser.account;
  profileSince.textContent = currentUser.createdAt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  accountNumberEl.textContent = `Conta ${currentUser.account}`;

  renderAll();
  switchView('dashboard');
}

// =========================
// LOGOUT
// =========================
document.getElementById('logoutButton').addEventListener('click', () => {
  currentUser = null;
  loginForm.reset();
  registerForm.reset();
  appScreen.classList.add('hidden');
  authScreen.classList.remove('hidden');
});

// =========================
// NAVEGAÇÃO ENTRE TELAS
// =========================
navItems.forEach((item) => {
  item.addEventListener('click', () => switchView(item.dataset.view));
});

function switchView(view) {
  Object.entries(views).forEach(([key, section]) => {
    section.classList.toggle('hidden', key !== view);
  });
  navItems.forEach((item) => {
    item.classList.toggle('active', item.dataset.view === view);
  });
}

// =========================
// NOVA MOVIMENTAÇÃO
// =========================
movementForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const description = document.getElementById('movementDescription').value.trim();
  const amount = parseFloat(document.getElementById('movementAmount').value);
  const type = document.getElementById('movementType').value;

  if (!amount || amount <= 0) {
    setMessage(movementMessage, 'Informe um valor válido.', 'error');
    return;
  }

  const currentBalance = getBalance();
  if (type === 'withdraw' && amount > currentBalance) {
    setMessage(movementMessage, 'Saldo insuficiente para essa retirada.', 'error');
    return;
  }

  currentUser.transactions.unshift({
    description,
    amount,
    type,
    date: new Date(),
  });

  setMessage(movementMessage, 'Movimentação registrada.', 'success');
  movementForm.reset();
  renderAll();
});

// =========================
// CÁLCULOS
// =========================
function getBalance() {
  return currentUser.transactions.reduce(
    (total, t) => total + (t.type === 'deposit' ? t.amount : -t.amount),
    0
  );
}

function getMonthlyTotals() {
  const now = new Date();
  const thisMonth = currentUser.transactions.filter(
    (t) => t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear()
  );
  const income = thisMonth
    .filter((t) => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = thisMonth
    .filter((t) => t.type === 'withdraw')
    .reduce((sum, t) => sum + t.amount, 0);
  return { income, expense };
}

// =========================
// RENDERIZAÇÃO
// =========================
function renderAll() {
  const balance = getBalance();
  const { income, expense } = getMonthlyTotals();

  balanceValue.textContent = money(balance);
  incomeValue.textContent = money(income);
  expenseValue.textContent = money(expense);

  renderTransactions();
}

function renderTransactions() {
  transactionsList.innerHTML = '';

  if (currentUser.transactions.length === 0) {
    transactionsList.innerHTML = '<p class="empty-state">Nenhuma movimentação ainda. Adicione a primeira acima.</p>';
    return;
  }

  currentUser.transactions.forEach((t) => {
    const isDeposit = t.type === 'deposit';
    const row = document.createElement('div');
    row.className = 'transaction';
    row.innerHTML = `
      <div class="transaction-icon ${isDeposit ? 'green-bg' : 'red-bg'}">
        ${isDeposit ? '↓' : '↑'}
      </div>
      <div class="transaction-info">
        <strong>${t.description || (isDeposit ? 'Depósito' : 'Retirada')}</strong>
        <small>${t.date.toLocaleDateString('pt-BR')} às ${t.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>
      </div>
      <div class="transaction-amount ${isDeposit ? 'green' : 'red'}">
        ${isDeposit ? '+' : '-'} ${money(t.amount)}
      </div>
    `;
    transactionsList.appendChild(row);
  });
}
