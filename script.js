const SUPABASE_URL = "https://fytwrvzwigkimbnujpke.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dHdydnp3aWdraW1ibnVqcGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNTU4MjMsImV4cCI6MjA3NDczMTgyM30.4okRydCY0I0ftKo1zTVIOVHT8j1OW70BJW2uXHUfFDY";

let supabaseClient;
let currentUser = null;

window.addEventListener('DOMContentLoaded', () => {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
});

// ==================== NAVEGAÇÃO ====================
function showPage(page) {
  document.querySelectorAll("section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(page).classList.remove("hidden");
}
document.getElementById("logo").onclick = () => showPage("page-menu");
function logout() {
  currentUser = null;
  showPage("page-login");
}

// ==================== LOGIN / REGISTRO ====================
async function login() {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value.trim();
  if (!u || !p) return alert("Preencha todos os campos.");

  const { data, error } = await supabaseClient
    .from("login")
    .select("*")
    .eq("nome", u)
    .eq("senha", p);

  if (error) return alert("Erro Supabase: " + error.message);
  if (data && data.length > 0) {
    currentUser = data[0];
    showPage("page-menu");
    loadSites();
    loadPessoas();
    loadChatGlobal();
    loadSeguidores();
    loadMeusSitesPerfil();
  } else {
    alert("Usuário ou senha incorretos.");
  }
}

async function register() {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value.trim();
  if (!u || !p) return alert("Preencha todos os campos.");

  const { error } = await supabaseClient.from("login").insert([{ nome: u, senha: p, seguidores: [] }]);
  if (error) return alert("Erro ao criar conta: " + error.message);
  alert("Conta criada com sucesso!");
}

// ==================== SITES ====================
async function loadSites() {
  const search = document.getElementById("search-sites")?.value.toLowerCase() || "";
  const { data, error } = await supabaseClient
    .from("sites")
    .select("*")
    .order("views", { ascending: false });

  if (error) return alert("Erro ao carregar sites: " + error.message);

  const list = document.getElementById("sites-list");
  if (!list) return;

  list.innerHTML = "";
  data.filter(s => s.nome.toLowerCase().includes(search)).forEach(s => {
    const li = document.createElement("li");
    li.innerHTML = `${s.nome} | ${s.criado_por} | ${new Date(s.created_at).toLocaleString()} <button onclick="abrirSite(${s.id})">Entrar</button>`;
    list.appendChild(li);
  });
}

async function createSite() {
  const nome = document.getElementById("novo-site-nome").value.trim();
  const conteudo = document.getElementById("novo-site-conteudo").value.trim();
  if (!nome || !conteudo) return alert("Preencha todos os campos.");

  const { error } = await supabaseClient.from("sites").insert([{ nome, criado_por: currentUser.nome, conteudo, views: 0, seguidores: [] }]);
  if (error) return alert("Erro ao criar site: " + error.message);

  alert("Site criado!");
  document.getElementById("novo-site-nome").value = "";
  document.getElementById("novo-site-conteudo").value = "";
  loadSites();
}

// ==================== EDITAR SITE ====================
async function loadMeusSites() {
  const search = document.getElementById("search-meus-sites")?.value.toLowerCase() || "";
  const { data, error } = await supabaseClient.from("sites").select("*").eq("criado_por", currentUser.nome);
  if (error) return alert("Erro ao carregar meus sites: " + error.message);

  const list = document.getElementById("meus-sites-list");
  list.innerHTML = "";

  data.filter(s => s.nome.toLowerCase().includes(search)).forEach(s => {
    const li = document.createElement("li");
    li.innerHTML = `${s.nome} <button onclick="editarSite(${s.id})">Editar</button>`;
    list.appendChild(li);
  });
}

async function editarSite(siteId) {
  const { data, error } = await supabaseClient.from("sites").select("*").eq("id", siteId);
  if (error || !data || data.length === 0) return alert("Erro ao buscar site");

  const site = data[0];
  document.getElementById("page-criar-site").classList.remove("hidden");
  document.getElementById("page-editar-site").classList.add("hidden");
  document.getElementById("novo-site-nome").value = site.nome;
  document.getElementById("novo-site-conteudo").value = site.conteudo;

  document.querySelector("#page-criar-site button").onclick = async () => {
    const novoNome = document.getElementById("novo-site-nome").value.trim();
    const novoConteudo = document.getElementById("novo-site-conteudo").value.trim();
    const { error } = await supabaseClient.from("sites").update({ nome: novoNome, conteudo: novoConteudo }).eq("id", siteId);
    if (error) return alert("Erro ao atualizar site: " + error.message);
    alert("Site atualizado!");
    showPage("page-editar-site");
    loadMeusSites();
    loadSites();
  };
}

// ==================== ABRIR SITE ====================
async function abrirSite(siteId) {
  const { data, error } = await supabaseClient.from("sites").select("*").eq("id", siteId);
  if (error || !data || data.length === 0) return alert("Erro ao abrir site");
  const site = data[0];

  // Atualizar views
  await supabaseClient.from("sites").update({ views: (site.views || 0) + 1 }).eq("id", siteId);

  document.getElementById("abrir-site-titulo").textContent = site.nome;
  document.getElementById("abrir-site-autor").textContent = site.criado_por;
  document.getElementById("abrir-site-data").textContent = new Date(site.created_at).toLocaleString();
  document.getElementById("abrir-site-conteudo").innerHTML = renderMarkdown(site.conteudo);
  document.getElementById("abrir-site-views").textContent = (site.views || 0) + 1;
  document.getElementById("abrir-site-seguidores").textContent = (site.seguidores || []).length;

  const btn = document.getElementById("seguir-btn");
  btn.textContent = (site.seguidores || []).includes(currentUser.nome) ? "Deixar de seguir" : "Seguir";
  btn.onclick = async () => {
    let seguidores = site.seguidores || [];
    if (seguidores.includes(currentUser.nome)) seguidores = seguidores.filter(x => x !== currentUser.nome);
    else seguidores.push(currentUser.nome);
    await supabaseClient.from("sites").update({ seguidores }).eq("id", siteId);
    abrirSite(siteId);
  };

  showPage("page-abrir-site");
}

// ==================== RENDER MARKDOWN ====================
function renderMarkdown(md) {
  let html = md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
    .replace(/\*(.*)\*/gim, '<i>$1</i>')
    .replace(/\r?\n/g, '<br>');
  return html;
}

// ==================== PESSOAS ====================
async function loadPessoas() {
  const { data, error } = await supabaseClient.from("login").select("*");
  if (error) return alert("Erro ao carregar pessoas: " + error.message);

  const list = document.getElementById("pessoas-list");
  list.innerHTML = "";

  if (currentUser) list.appendChild(renderPessoa(currentUser, true));

  data.filter(p => !currentUser || p.id !== currentUser.id).forEach(p => list.appendChild(renderPessoa(p, false)));
}

function renderPessoa(pessoa, isMe) {
  const li = document.createElement("li");
  const nome = isMe ? pessoa.nome + " (eu)" : pessoa.nome;
  li.innerHTML = `[ ${nome} | <button>Ver sites</button> | <button>Conversar</button> | <button>Seguir</button> ]`;
  return li;
}

// ==================== CHAT GLOBAL ====================
async function loadChatGlobal() {
  const { data, error } = await supabaseClient.from("chat_global").select("*").order("created_at", { ascending: true });
  if (error) return alert("Erro ao carregar chat: " + error.message);

  const chatDiv = document.getElementById("chat-messages");
  chatDiv.innerHTML = "";
  data.forEach(msg => {
    const div = document.createElement("div");
    div.className = msg.de === currentUser.nome ? "message me" : "message other";
    div.textContent = `[${new Date(msg.created_at).toLocaleTimeString()}] ${msg.de}: ${msg.texto}`;
    chatDiv.appendChild(div);
  });
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

async function sendChat() {
  const text = document.getElementById("chat-text").value.trim();
  if (!text) return;

  const { error } = await supabaseClient.from("chat_global").insert([{ de: currentUser.nome, texto: text }]);
  if (error) return alert("Erro enviando mensagem: " + error.message);

  document.getElementById("chat-text").value = "";
  loadChatGlobal();
}

// ==================== PERFIL ====================
async function updatePerfil() {
  const novoNome = document.getElementById("novo-nome").value.trim();
  const novaSenha = document.getElementById("nova-senha").value.trim();
  if (!novoNome && !novaSenha) return alert("Preencha pelo menos um campo.");

  const updates = {};
  if (novoNome) updates.nome = novoNome;
  if (novaSenha) updates.senha = novaSenha;

  const { error } = await supabaseClient.from("login").update(updates).eq("id", currentUser.id);
  if (error) return alert("Erro ao atualizar: " + error.message);
  if (novoNome) currentUser.nome = novoNome;
  if (novaSenha) currentUser.senha = novaSenha;

  alert("Perfil atualizado!");
  document.getElementById("novo-nome").value = "";
  document.getElementById("nova-senha").value = "";
}

// ==================== MEUS SEGUIDORES ====================
async function loadSeguidores() {
  const { data, error } = await supabaseClient.from("login").select("*");
  if (error) return alert("Erro carregando seguidores: " + error.message);

  const list = document.getElementById("meus-seguidores");
  list.innerHTML = "";

  data.forEach(u => {
    if (u.seguidores && u.seguidores.includes(currentUser.nome)) {
      const li = document.createElement("li");
      li.textContent = u.nome;
      list.appendChild(li);
    }
  });
}

// ==================== MEUS SITES NO PERFIL ====================
async function loadMeusSitesPerfil() {
  const { data, error } = await supabaseClient.from("sites").select("*").eq("criado_por", currentUser.nome);
  if (error) return alert("Erro carregando meus sites: " + error.message);

  const list = document.getElementById("meus-sites-perfil");
  list.innerHTML = "";

  data.forEach(s => {
    const li = document.createElement("li");
    li.textContent = s.nome;
    list.appendChild(li);
  });
}
