export const environment = {
  production: true,
  apiUrl: 'http://localhost:8080/api',
  /**
   * 'auto'   -> usa a API se ela responder; caso contrário, entra no modo demonstração.
   * 'always' -> sempre usa o modo demonstração (build estático, sem backend).
   */
  demoMode: 'auto' as 'auto' | 'always',
};
