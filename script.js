// script.js

// Navegação entre views
const views = {
  menu: document.getElementById("menuView"),
  sites: document.getElementById("sitesView"),
  pessoas: document.getElementById("pessoasView"),
  chat: document.getElementById("chatView"),
  create: document.getElementById("createAccountView"),
};

function show(view) {
  Object.values(views).forEach(v => v.classList.add("hidden"));
  views[view].classList.remove("hidden");
}

document.getElementById("menuBtn").onclick = () => show("menu");
document.getElementById("sitesBtn").onclick = () => show("sites");
document.getElementById("pessoasBtn").onclick = () => show("pessoas");
document.getElementById("chatBtn").onclick = () => show("chat");
document.getElementById("createAccountBtn").onclick = () => show("create");
document.getElementById("logo").onclick = () => show("menu");

document.getElementById("goSites").onclick = () => show("sites");
document.getElementById("goPessoas").onclick = () => show("pessoas");
document.getElementById("goChat").onclick = () => show("chat");

// Criar conta
const saveAccountBtn = document.getElementById("saveAccount");
saveAccountBtn.onclick = () => {
  const nome = document.getElementById("newName").value.trim();
  const handle = document.getElementById("newHandle").value.trim();
  const msg = document.getElementById("createMsg");
  if(!nome || !handle){
    msg.textContent = "Preencha os dois campos!";
    msg.style.color = "tomato";
    return;
  }
  msg.textContent = `Conta criada: ${nome} (@${handle})`;
  msg.style.color = "lightgreen";
};

// Sites (mock data)
const sites = [
  {nome:"Capuccino", url:"https://capuccino.sites"},
  {nome:"RaulinhoBlog", url:"https://raul.blog"},
  {nome:"Teste", url:"https://teste.com"}
];

const sitesList = document.getElementById("sitesList");
function renderSites(list){
  sitesList.innerHTML = "";
  list.forEach(s => {
    const div = document.createElement("div");
    div.className = "pill";
    div.innerHTML = `<strong>${s.nome}</strong> — <a href="${s.url}" target="_blank">${s.url}</a>`;
    sitesList.appendChild(div);
  });
}
renderSites(sites);

document.getElementById("searchBtn").onclick = () => {
  const q = document.getElementById("siteSearch").value.toLowerCase();
  const res = sites.filter(s => s.nome.toLowerCase().includes(q) || s.url.toLowerCase().includes(q));
  renderSites(res);
};

// Pessoas (mock)
const pessoasList = document.getElementById("pessoasList");
const pessoas = [
  {nome:"Raul (você)", cor:"#b78a4b", seguidores:[]},
  {nome:"Poeta Misterioso", cor:"#4b9cb7", seguidores:["Raul"]},
  {nome:"Canetinhas Secas", cor:"#b74b4b", seguidores:[]},
];

function renderPessoas(){
  pessoasList.innerHTML = "";
  pessoas.forEach(p => {
    const row = document.createElement("div");
    row.className = "people-row";
    row.innerHTML = `
      <div class="people-left">
        <div class="avatar" style="background:${p.cor}">${p.nome[0]}</div>
        <div>
          <div>${p.nome}</div>
          <div class="small">Seguidores: ${p.seguidores.length}</div>
        </div>
      </div>
      <div class="actions">
        <button class="btn-small">Ver sites</button>
        <button class="btn-small">Conversar</button>
        <button class="btn-small">Seguir</button>
      </div>
    `;
    pessoasList.appendChild(row);
  });
}
renderPessoas();

// Chat Global (mock)
const chatList = document.getElementById("chatList");
let chatData = [
  {id:1,de:"teste",texto:"blaaaaaa",created_at:"2025-09-29 19:09:01"}
];

function renderChat(){
  chatList.innerHTML = "";
  chatData.forEach(m => {
    const div = document.createElement("div");
    div.className = "msg";
    div.style.background = m.de==="Raul" ? "#2e3a20" : "#1e2a38";
    div.innerHTML = `<div class="meta">${m.de} — ${m.created_at}</div>${m.texto}`;
    chatList.appendChild(div);
  });
  chatList.scrollTop = chatList.scrollHeight;
}
renderChat();

const sendChat = document.getElementById("sendChat");
sendChat.onclick = () => {
  const val = document.getElementById("chatInput").value.trim();
  if(!val) return;
  chatData.push({id:chatData.length+1, de:"Raul", texto:val, created_at:new Date().toISOString()});
  document.getElementById("chatInput").value = "";
  renderChat();
};

document.getElementById("clearChat").onclick = () => {
  chatData = [];
  renderChat();
};