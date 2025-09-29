import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/+esm'

const SUPABASE_URL = 'https://fytwrvzwigkimbnujpke.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dHdydnp3aWdraW1ibnVqcGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNTU4MjMsImV4cCI6MjA3NDczMTgyM30.4okRydCY0I0ftKo1zTVIOVHT8j1OW70BJW2uXHUfFDY'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
let currentUser = null
let sitesCache = []

// Histórico de páginas
let lastPage = 'page-login'
function showPage(id){
  lastPage = document.querySelector('section[style*="block"]')?.id || lastPage
  document.querySelectorAll('section').forEach(s => s.style.display = 'none')
  document.getElementById(id).style.display = 'block'
}

// VOLTAR
window.goBack = function(){
  showPage(lastPage)
}

// LOGIN
document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault()
  const nome = document.getElementById('username').value.trim()
  const senha = document.getElementById('password').value.trim()
  const { data } = await supabase.from('login').select('*').eq('nome', nome).eq('senha', senha)
  if(!data || data.length===0){ alert('Usuário ou senha incorretos 😿'); return }
  currentUser = data[0].nome
  showPage('page-menu')
  loadSites()
})

// CRIAR CONTA
document.getElementById('btn-criar-conta').addEventListener('click', async ()=>{
  const nome = prompt("Digite o nome de usuário:")
  const senha = prompt("Digite a senha:")
  if(!nome || !senha) return alert('Nome e senha são obrigatórios!')
  const { error } = await supabase.from('login').insert([{nome, senha}])
  if(error) alert(error.message)
  else alert('Conta criada com sucesso! Agora faça login.')
})

// MENU
document.getElementById('btn-sair').addEventListener('click', ()=> {currentUser=null; showPage('page-login')})
document.getElementById('btn-sites').addEventListener('click', ()=> showPage('page-sites'))
document.getElementById('btn-criar-site').addEventListener('click', ()=> showPage('page-criar-site'))
document.getElementById('btn-editar-site').addEventListener('click', ()=> showPage('page-editar-site'))

// CRIAR SITE
document.getElementById('btn-criar-site-final').addEventListener('click', async ()=>{
  const nome = document.getElementById('novo-site-nome').value.trim()
  const conteudo = document.getElementById('novo-site-conteudo').value.trim()
  if(!nome||!conteudo) return alert('Preencha tudo!')
  const { error } = await supabase.from('sites').insert([{nome,conteudo,criado_por:currentUser,views:0,seguidores:0,seguindo:[]}])
  if(error) alert(error.message)
  else {
    document.getElementById('novo-site-nome').value=''
    document.getElementById('novo-site-conteudo').value=''
    loadSites()
    showPage('page-sites')
  }
})

// EDITAR SITE
const editArea = document.getElementById('edit-area')
document.getElementById('search-meus-sites').addEventListener('input', ()=> renderMeusSites())
document.getElementById('btn-salvar-edicao').addEventListener('click', async ()=>{
  const id = editArea.dataset.siteId
  const nome = document.getElementById('edit-site-nome').value.trim()
  const conteudo = document.getElementById('edit-site-conteudo').value.trim()
  const { error } = await supabase.from('sites').update({nome,conteudo}).eq('id',id)
  if(error) alert(error.message)
  else { editArea.style.display='none'; loadSites() }
})

// CARREGAR SITES
async function loadSites(){
  const { data } = await supabase.from('sites').select('*').order('views',{ascending:false})
  sitesCache = data || []
  renderSitesList()
  renderFollowedSites()
  renderMeusSites()
}

// RENDER SITES
function renderSitesList(){
  const tbody = document.querySelector('#sites-list tbody')
  tbody.innerHTML = sitesCache.map(s => `
    <tr>
      <td>${s.nome}</td>
      <td>${s.criado_por}</td>
      <td>${new Date(s.created_at).toLocaleDateString()}</td>
      <td><button onclick="openSite(${s.id})">Entrar</button></td>
    </tr>
  `).join('')
}

function renderFollowedSites(){
  const tbody = document.querySelector('#followed-list tbody')
  const followed = sitesCache.filter(s=>s.seguindo?.includes(currentUser))
  tbody.innerHTML = followed.length ? followed.map(s => `
    <tr>
      <td>${s.nome}</td>
      <td>${s.criado_por}</td>
      <td>${new Date(s.created_at).toLocaleDateString()}</td>
      <td><button onclick="openSite(${s.id})">Entrar</button></td>
    </tr>
  `).join('') : '<tr><td colspan="4">Nenhum</td></tr>'
}

function renderMeusSites(){
  const search = document.getElementById('search-meus-sites').value.toLowerCase()
  const meus = sitesCache.filter(s=>s.criado_por===currentUser && s.nome.toLowerCase().includes(search))
  const container = document.getElementById('meus-sites-list')
  container.innerHTML = meus.map(s=>`<p>${s.nome} <button onclick="editSite(${s.id})">Editar</button></p>`).join('')
}

// ABRIR SITE
window.openSite = async function(id){
  const site = sitesCache.find(s=>s.id===id)
  if(!site) return
  document.getElementById('view-site-title').innerText = site.nome
  document.getElementById('view-site-author').innerText = site.criado_por
  document.getElementById('view-site-date').innerText = new Date(site.created_at).toLocaleString()
  document.getElementById('view-site-content').innerHTML = marked.parse(site.conteudo)
  document.getElementById('view-site-views').innerText = site.views||0
  document.getElementById('view-site-followers').innerText = site.seguidores||0
  showPage('page-site-view')

  await supabase.from('sites').update({views:(site.views||0)+1}).eq('id',id)
  site.views = (site.views||0)+1
}

// EDITAR SITE
window.editSite = function(id){
  const site = sitesCache.find(s=>s.id===id)
  if(!site) return
  editArea.dataset.siteId=id
  editArea.style.display='block'
  document.getElementById('edit-site-nome').value=site.nome
  document.getElementById('edit-site-conteudo').value=site.conteudo
  showPage('page-editar-site')
}

// SEGUIR SITE
document.getElementById('btn-follow').addEventListener('click', async ()=>{
  const id = sitesCache.find(s=>s.nome===document.getElementById('view-site-title').innerText).id
  const site = sitesCache.find(s=>s.id===id)
  const seguindo = site.seguindo||[]
  if(!seguindo.includes(currentUser)) seguindo.push(currentUser)
  await supabase.from('sites').update({seguindo, seguidores:seguindo.length}).eq('id',id)
  site.seguindo=seguindo
  site.seguidores=seguindo.length
  renderFollowedSites()
  document.getElementById('view-site-followers').innerText=seguindo.length
})

// INICIAL
loadSites()
