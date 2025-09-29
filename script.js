// 🔑 Config Supabase
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_KEY = "YOUR_ANON_KEY";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

// === Navegação ===
function showPage(page) {
  document.querySelectorAll("section").forEach(sec => sec.classList.add("hidden"));
  if (page === "menu") document.getElementById("page-menu").classList.remove("hidden");
  if (page === "sites") { loadSites(); document.getElementById("page-sites").classList.remove("hidden"); }
  if (page === "pessoas") { loadPessoas(); document.getElementById("page-pessoas").classList.remove("hidden"); }
  if (page === "chat") { loadChatGlobal(); document.getElementById("page-chat").classList.remove("hidden"); }
}
document.getElementById("logo").onclick = () => showPage("menu");

// === Login / Registro ===
window.login = async function(){
  const u = document.getElementById('username').value.trim()
  const p = document.getElementById('password').value.trim()

  if(!u || !p){
    alert("Preencha usuário e senha!")
    return
  }

  const { data, error } = await supabase
    .from("login")
    .select("*")
    .eq("nome", u)
    .eq("senha", p)

  if(error){
    console.error("Erro Supabase:", error)
    alert("Erro ao conectar no banco. Veja o console.")
    return
  }

  if(data && data.length > 0){
    currentUser = u
    console.log("Login OK:", currentUser)
    showPage("page-menu")
  } else {
    alert("Usuário ou senha incorretos.")
  }
}

async function register() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  if (!user || !pass) return alert("Preencha todos os campos.");

  const { error } = await db.from("login").insert([{ username: user, password: pass, seguidores: [] }]);
  if (error) return alert("Erro ao criar conta: " + error.message);
  alert("Conta criada com sucesso!");
}

// === Sites ===
async function loadSites() {
  const { data, error } = await db.from("sites").select("*");
  if (error) return alert("Erro carregando sites.");

  const list = document.getElementById("sites-list");
  list.innerHTML = "";

  const search = document.getElementById("search-sites").value.toLowerCase();
  data.filter(s => s.nome.toLowerCase().includes(search)).forEach(site => {
    const li = document.createElement("li");
    li.textContent = site.nome + " → " + site.url;
    list.appendChild(li);
  });
}
document.getElementById("search-sites").addEventListener("input", loadSites);

// === Pessoas ===
async function loadPessoas() {
  const { data, error } = await db.from("login").select("*");
  if (error) return alert("Erro carregando pessoas.");

  const list = document.getElementById("pessoas-list");
  list.innerHTML = "";

  // Eu primeiro
  if (currentUser) {
    const li = renderPessoa(currentUser, true);
    list.appendChild(li);
  }

  data.filter(p => !currentUser || p.id !== currentUser.id).forEach(pessoa => {
    const li = renderPessoa(pessoa, false);
    list.appendChild(li);
  });
}

function renderPessoa(pessoa, isMe) {
  const li = document.createElement("li");
  const nome = isMe ? pessoa.username + " (eu)" : pessoa.username;
  li.innerHTML = `[ ${nome} | <button>Ver sites</button> | <button>Conversar</button> | <button>Seguir</button> ]`;
  return li;
}

// === Chat Global ===
async function loadChatGlobal() {
  const { data, error } = await db.from("chat_global").select("*").order("created_at", { ascending: true });
  if (error) return alert("Erro carregando chat.");

  const box = document.getElementById("chat-messages");
  box.innerHTML = "";

  data.forEach(msg => {
    const div = document.createElement("div");
    div.className = "message " + (currentUser && msg.de === currentUser.username ? "me" : "other");
    div.innerHTML = `<b>${msg.de}</b> [${new Date(msg.created_at).toLocaleTimeString()}]: ${msg.texto}`;
    box.appendChild(div);
  });

  box.scrollTop = box.scrollHeight;
}

async function sendChat() {
  const text = document.getElementById("chat-text").value.trim();
  if (!text || !currentUser) return;

  const { error } = await db.from("chat_global").insert([{ de: currentUser.username, texto: text }]);
  if (error) return alert("Erro enviando mensagem: " + error.message);

  document.getElementById("chat-text").value = "";
  loadChatGlobal();
}
