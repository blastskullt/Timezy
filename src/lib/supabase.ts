import { createClient } from '@supabase/supabase-js';

// Validação de variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Config Check:');
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Não configurada');
console.log('Key:', supabaseAnonKey ? '✅ Configurada' : '❌ Não configurada');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 ERRO CRÍTICO: Variáveis do Supabase não encontradas!');
  console.error('Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão no arquivo .env');
  
  // Mostrar exemplo de .env
  console.log('\n📝 Exemplo de .env:');
  console.log('VITE_SUPABASE_URL=https://seu-projeto.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=sua_chave_publica_aqui');
  
  throw new Error('Configuração do Supabase incompleta');
}

// Validação básica de formato da URL
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.warn('⚠️ AVISO: URL do Supabase pode estar incorreta:', supabaseUrl);
}

// Configurações de segurança do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    
    storage: {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // Falha silenciosa
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Falha silenciosa
        }
      }
    }
  },
  
  global: {
    headers: {
      'X-Client-Info': 'timezy-pro@1.0.0'
    }
  }
});

// Teste de conectividade
const testConnection = async () => {
  try {
    console.log('🔍 Testando conexão com Supabase...');
    const { data, error } = await supabase.from('professionals').select('count').limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message);
      if (error.message.includes('relation "professionals" does not exist')) {
        console.error('💡 A tabela "professionals" não existe. Execute as migrações SQL.');
      }
    } else {
      console.log('✅ Conexão com Supabase OK');
    }
  } catch (error: any) {
    console.error('❌ Erro crítico na conexão:', error.message);
  }
};

// Testar conexão apenas em desenvolvimento
if (import.meta.env.DEV) {
  testConnection();
}

console.log('✅ Supabase cliente criado com sucesso');

export const supabaseConfig = {
  url: supabaseUrl,
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV
};