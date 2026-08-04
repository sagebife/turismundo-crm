// js/supabase-config.js
// Configuração e Inicialização do Supabase para a Turismundo

const SUPABASE_URL = 'https://xjjflsdtaruzaekadqoq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4w28HISw0UqCywyYMbm-8w_LVHV2ltM';

// Inicializa o cliente global do Supabase
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Supabase configurado com sucesso via módulo externo.");