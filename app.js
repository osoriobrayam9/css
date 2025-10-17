import { api } from './api.js';

const $ = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

const refs = {
  list: $('#list'),
  form: $('#form-new'),
  title: $('#new-title'),
  desc: $('#new-desc'),
  reload: $('#btn-reload'),
  tpl: $('#tpl-item'),
};

let store = { items: [] };

function nodeFromTpl(){ return refs.tpl.content.firstElementChild.cloneNode(true); }

function paint(){
  refs.list.innerHTML = '';
  for(const it of store.items){
    const el = nodeFromTpl();
    el.dataset.id = it.id;
    el.classList.toggle('completed', !!it.completed);
    $('.t-title', el).textContent = it.title ?? '(Sin título)';
    const dd = $('.t-desc', el);
    dd.textContent = it.description ?? '';
    dd.style.display = dd.textContent ? 'block' : 'none';
    $('.t-toggle', el).checked = !!it.completed;
    refs.list.appendChild(el);
  }
}

async function boot(){
  const data = await api.list();
  store.items = Array.isArray(data) ? data : (data?.items ?? []);
  paint();
}

async function submitNew(e){
  e.preventDefault();
  const payload = { title: refs.title.value.trim(), description: refs.desc.value.trim() || null, completed: false };
  if(!payload.title) return;
  const created = await api.create(payload);
  store.items.unshift(created);
  refs.form.reset();
  paint();
}

async function flip(id, next){
  const pos = store.items.findIndex(x => String(x.id) === String(id));
  if(pos<0) return;
  const before = store.items[pos];
  const after = { ...before, completed: next };
  store.items[pos] = after; paint();
  try{ const saved = await api.update(id, { completed: next }); store.items[pos] = { ...after, ...saved }; }
  catch{ store.items[pos] = before; }
  paint();
}

async function purge(id){
  const pos = store.items.findIndex(x => String(x.id) === String(id));
  if(pos<0) return;
  const tmp = store.items.splice(pos,1)[0]; paint();
  try{ await api.remove(id); } catch { store.items.splice(pos,0,tmp); paint(); }
}

function beginEdit(id){
  const li = refs.list.querySelector(`li[data-id="${CSS.escape(String(id))}"]`);
  if(!li) return;
  const item = store.items.find(x => String(x.id)===String(id));
  const t = document.createElement('input'); t.className='inline'; t.value = item.title ?? '';
  const d = document.createElement('input'); d.className='inline'; d.placeholder='Descripción'; d.value = item.description ?? '';
  $('.t-title', li).replaceWith(t);
  $('.t-desc', li).replaceWith(d);
  const ok = document.createElement('button'); ok.textContent = '✔'; ok.className='icon-btn'; ok.dataset.act='confirm';
  $('.todo-right', li).prepend(ok);
  t.focus();
}

async function confirmEdit(id, el){
  const [t, d] = $$('.inline', el);
  const payload = { title: t?.value.trim() || '(Sin título)', description: d?.value.trim() || null };
  const pos = store.items.findIndex(x => String(x.id)===String(id));
  if(pos<0) return;
  const before = store.items[pos]; store.items[pos] = { ...before, ...payload }; paint();
  try{ const saved = await api.update(id, payload); store.items[pos] = { ...store.items[pos], ...saved }; }
  catch{ store.items[pos] = before; }
  paint();
}

function onListClick(e){
  const li = e.target.closest('li.todo'); if(!li) return;
  const id = li.dataset.id;
  if(e.target.matches('.t-toggle')) return void flip(id, e.target.checked);
  const btn = e.target.closest('[data-act]'); if(!btn) return;
  const act = btn.dataset.act;
  if(act==='delete') purge(id);
  else if(act==='edit') beginEdit(id);
  else if(act==='confirm') confirmEdit(id, li);
}

refs.form.addEventListener('submit', submitNew);
refs.reload.addEventListener('click', boot);
refs.list.addEventListener('click', onListClick);
boot();