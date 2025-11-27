/**
 * Tratamento global de erros para evitar AbortErrors não capturados
 */

// Função para tratar erros de Promise não capturados
export const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  const error = event.reason;
  
  // Ignorar AbortErrors específicos relacionados ao play() de vídeo
  if (error instanceof Error && error.name === 'AbortError') {
    if (error.message.includes('play() request was interrupted')) {
      console.debug('AbortError ignorado: play() request was interrupted');
      event.preventDefault(); // Prevenir que apareça no console
      return;
    }
  }
  
  // Log outros erros normalmente
  console.error('Unhandled promise rejection:', error);
};

// Função para tratar erros JavaScript não capturados
export const handleError = (event: ErrorEvent) => {
  const error = event.error;
  
  // Ignorar AbortErrors específicos
  if (error instanceof Error && error.name === 'AbortError') {
    if (error.message.includes('play() request was interrupted')) {
      console.debug('AbortError ignorado: play() request was interrupted');
      event.preventDefault();
      return;
    }
  }
  
  // Log outros erros normalmente
  console.error('Unhandled error:', error);
};

// Configurar tratamento global de erros
export const setupGlobalErrorHandling = () => {
  // Tratar rejeições de Promise não capturadas
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  
  // Tratar erros JavaScript não capturados
  window.addEventListener('error', handleError);
  
  // Retornar função de limpeza
  return () => {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    window.removeEventListener('error', handleError);
  };
};
