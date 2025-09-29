// 🔑 Supabase real
const SUPABASE_URL = "https://fytwrvzwigkimbnujpke.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dHdydnp3aWdraW1ibnVqcGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNTU4MjMsImV4cCI6MjA3NDczMTgyM30.4okRydCY0I0ftKo1zTVIOVHT8j1OW70BJW2uXHUfFDY";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentUser = null;

// === Navegação ===
function showPage(page) {
  document.querySelectorAll("section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(page).classList.remove("hidden");
}
document.getElementById("logo").onclick = () => showPage("page-menu");

// === LOGIN / REGISTRO ===
async function login() {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value.trim();
  if (!u || !p) return alert("Preencha todos os campos.");

  const { data, error } = await supabase
    .from("login")
    .select("id, nome, senha")   // ignorando "seguidores"
    .eq("nome", u)
    .eq("senha", p);

  if (error) {
    console.error("Erro Supabase:", error);
    return alert("Erro ao conectar no banco. Veja o console.");
  }

  if (data && data.length > 0) {
    currentUser = data[0];
    showPage("page-menu");
  } else {
    alert("Usuário ou senha incorretos.");
  }
}

async function register() {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value.trim();
  if (!u || !p) return alert("Preencha todos os campos.");

  const { error } = await supabase.from("login").insert([{ nome: u, senha: p, seguidores: [] }]);
  if (error) return alert("Erro ao criar conta: " + error.message);
  alert("Conta criada com sucesso!");
}

// === SITES ===
document.getElementById("search-sites").addEventListener("input", loadSites);
async function loadSites() {
  const { data, error } = await supabase.from("sites").select("*");
  if (error) return alert("Erro ao carregar sites: " + error.message);

  const search = document.getElementById("search-sites").value.toLowerCase();
  const list = document.getElementById("sites-list");
  list.innerHTML = "";
  data.filter(s => s.nome.toLowerCase().includes(search)).forEach(s => {
    const li = document.createElement("li");
    li.textContent = s.nome + " | " + s.criado_por;
    list.appendChild(li);
  });
}

// === PESSOAS ===
async function loadPessoas() {
  const { data, error } = await supabase.from("login").select("*");
  if (error) return alert("Erro ao carregar pessoas: " + error.message);

  const list = document.getElementById("pessoas-list");
  list.innerHTML = "";

  // Eu primeiro
  if (currentUser) list.appendChild(renderPessoa(currentUser, true));

  data.filter(p => !currentUser || p.id !== currentUser.id).forEach(p => {
    list.appendChild(renderPessoa(p, false));
  });
}

function renderPessoa(pessoa, isMe) {
  const li = document.createElement("li");
  const nome = isMe ? pessoa.nome + " (eu)" : pessoa.nome;
  li.innerHTML = `[ ${nome} | <button>Ver sites</button> | <button>Conversar</button> | <button>Seguir</button> ]`;
  return li;
}

// === CHAT GLOBAL ===
async function loadChatGlobal() {
  const { data, error } = await supabase.from("chat_global").select("*").order("created_at", { ascending: true });
  if (error) return alert("Erro ao carregar chat: " + error.message);

  const box = document.getElementById("chat-messages");
  box.innerHTML = "";
  data.forEach(msg => {
    const div = document.createElement("div");
    div.className = "message " + (currentUser && msg.de === currentUser.nome ? "me" : "other");
    div.innerHTML = `<b>${msg.de}</b> [${new Date(msg.created_at).toLocaleTimeString()}]: ${msg.texto}`;
    box.appendChild(div);
  });
  box.scrollTop = box.scrollHeight;
}

async function sendChat() {
  const text = document.getElementById("chat-text").value.trim();
  if (!text || !currentUser) return;

  const { error } = await supabase.from("chat_global").insert([{ de: currentUser.nome, texto: text }]);
  if (error) return alert("Erro enviando mensagem: " + error.message);

  document.getElementById("chat-text").value = "";
  loadChatGlobal();
}
