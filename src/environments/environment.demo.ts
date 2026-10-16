// Build estático de demonstração: nunca tenta falar com a API.
export const environment = {
  production: true,
  apiUrl: 'http://localhost:8080/api',
  demoMode: 'always' as 'auto' | 'always',
};
