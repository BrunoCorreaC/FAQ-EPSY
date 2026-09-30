// Chaves PÚBLICAS do Supabase (a "publishable key" foi feita para ficar no navegador).
// A proteção dos dados vem das políticas RLS em supabase/schema.sql, não do sigilo da chave.
window.CF_CONFIG = {
  supabaseUrl: 'https://idqaecjrakbrpatgvczq.supabase.co',
  supabaseKey: 'sb_publishable_xh8HW6wgDXGtmw2-iVr5jw_Qc4lthpx',
  // chave PÚBLICA de Web Push (a privada fica só no banco, tabela config_privada)
  vapidPublicKey: 'BFLHQfZmIyN2ZcbmtKrFj7Lnc3oncaMNN8jzHIXTx8I9J3lHuisbrexefRhvFtgqkCUQ4-h3kiS8IaamwoAAM8Q',
  // WhatsApp (55DDDNUMERO) da equipe para o garagista pedir créditos; vazio = só mostra o aviso
  contatoComercial: ''
};
