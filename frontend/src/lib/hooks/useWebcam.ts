import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store/useStore';

export const useWebcam = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isStartingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const currentStreamRef = useRef<MediaStream | null>(null);
  const { webcam, setWebcamActive, setWebcamStream, setWebcamError } = useStore();

  const startWebcam = useCallback(async () => {
    // Evitar múltiplas chamadas simultâneas
    if (isStartingRef.current) {
      console.warn('Webcam start already in progress');
      return;
    }

    try {
      isStartingRef.current = true;
      setWebcamError(null);
      
      // Cancelar qualquer operação anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Criar novo AbortController
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;
      
      // Parar qualquer stream existente antes de iniciar um novo
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Cancelar qualquer promise de play anterior
      if (playPromiseRef.current) {
        try {
          await playPromiseRef.current;
        } catch (error) {
          // Ignorar erros de promises canceladas
        }
        playPromiseRef.current = null;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      // Verificar se a operação foi cancelada
      if (signal.aborted) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      if (videoRef.current) {
        const video = videoRef.current;
        
        // Limpar srcObject anterior
        video.srcObject = null;
        
        // Aguardar um frame para garantir que o srcObject anterior foi limpo
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // Verificar se ainda não foi cancelado
        if (signal.aborted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        video.srcObject = stream;
        
        // Aguardar o carregamento dos metadados
        await new Promise<void>((resolve, reject) => {
          if (signal.aborted) {
            reject(new Error('Operation aborted'));
            return;
          }

          const handleLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            video.removeEventListener('abort', handleAbort);
            resolve();
          };

          const handleError = () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            video.removeEventListener('abort', handleAbort);
            reject(new Error('Failed to load video metadata'));
          };

          const handleAbort = () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            video.removeEventListener('abort', handleAbort);
            reject(new Error('Operation aborted'));
          };

          video.addEventListener('loadedmetadata', handleLoadedMetadata);
          video.addEventListener('error', handleError);
          signal.addEventListener('abort', handleAbort);
          
          // Timeout para evitar espera infinita
          setTimeout(() => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            signal.removeEventListener('abort', handleAbort);
            reject(new Error('Timeout loading video metadata'));
          }, 5000);
        });

        // Verificar se ainda não foi cancelado
        if (signal.aborted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        // Tentar reproduzir com tratamento robusto de AbortError
        const playVideo = async (): Promise<void> => {
          try {
            const playPromise = video.play();
            playPromiseRef.current = playPromise;
            await playPromise;
            playPromiseRef.current = null;
          } catch (playError) {
            playPromiseRef.current = null;
            
            if (signal.aborted) {
              return; // Operação foi cancelada, não fazer nada
            }
            
            if (playError instanceof Error && playError.name === 'AbortError') {
              console.warn('Play request was aborted, retrying...');
              // Aguardar um pouco antes de tentar novamente
              await new Promise(resolve => setTimeout(resolve, 200));
              
              if (!signal.aborted) {
                return playVideo(); // Tentar novamente recursivamente
              }
            } else {
              throw playError;
            }
          }
        };

        await playVideo();
      }

      // Verificar se ainda não foi cancelado antes de atualizar o estado
      if (!signal.aborted) {
        currentStreamRef.current = stream;
        setWebcamStream(stream);
        setWebcamActive(true);
      } else {
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Operation aborted') {
        console.log('Webcam start operation was aborted');
        return;
      }
      console.error('Error accessing webcam:', error);
      setWebcamError('Erro ao acessar a câmera. Verifique as permissões.');
    } finally {
      isStartingRef.current = false;
    }
  }, [setWebcamActive, setWebcamStream, setWebcamError]);

  const stopWebcam = useCallback(() => {
    // Cancelar qualquer operação pendente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Cancelar promise de play pendente
    if (playPromiseRef.current) {
      playPromiseRef.current = null;
    }
    
    if (currentStreamRef.current) {
      currentStreamRef.current.getTracks().forEach(track => track.stop());
      currentStreamRef.current = null;
      setWebcamStream(null);
    }
    
    if (videoRef.current) {
      // Pausar o vídeo antes de limpar o srcObject
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    
    setWebcamActive(false);
  }, [setWebcamActive, setWebcamStream]);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Verificar se o vídeo está pronto e reproduzindo
    if (video.videoWidth === 0 || video.videoHeight === 0 || video.paused || video.ended) {
      return null;
    }

    // Otimizar dimensões do canvas para melhor performance
    const maxWidth = 640;
    const maxHeight = 480;
    let { videoWidth, videoHeight } = video;
    
    // Redimensionar se necessário para melhor performance
    if (videoWidth > maxWidth || videoHeight > maxHeight) {
      const aspectRatio = videoWidth / videoHeight;
      if (videoWidth > videoHeight) {
        videoWidth = maxWidth;
        videoHeight = maxWidth / aspectRatio;
      } else {
        videoHeight = maxHeight;
        videoWidth = maxHeight * aspectRatio;
      }
    }

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // Usar drawImage com redimensionamento para melhor performance
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    return canvas.toDataURL('image/jpeg', 0.7); // Reduzir qualidade para melhor performance
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const video = videoRef.current;
    const stream = currentStreamRef.current;
    
    return () => {
      // Cancelar qualquer operação pendente
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Cancelar promise de play pendente
      if (playPromiseRef.current) {
        playPromiseRef.current = null;
      }
      
      // Parar stream diretamente sem usar stopWebcam para evitar dependência circular
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      if (video) {
        video.pause();
        video.srcObject = null;
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    webcam,
    startWebcam,
    stopWebcam,
    captureFrame,
  };
};
