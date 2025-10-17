const API_URL = 'https://todoapitest.juansegaliz.com/todos';

async function http(path = '', init = {}){
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init.headers||{}) },
    ...init,
  });
  const raw = await res.text();
  const data = raw ? (()=>{ try{return JSON.parse(raw)}catch{return raw} })() : null;
  if(!res.ok) throw new Error((data && data.message) || res.statusText || 'Error');
  return data;
}

export const api = {
  list: () => http(''),
  create: (payload) => http('', { method:'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => http(`/${encodeURIComponent(id)}`, { method:'PUT', body: JSON.stringify(payload) }),
  remove: (id) => http(`/${encodeURIComponent(id)}`, { method:'DELETE' }),
};