'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WebcamCapture } from '@/components/validacao/WebcamCapture';
import { ValidationPanel } from '@/components/validacao/ValidationPanel';
import { useWebcam } from '@/lib/hooks/useWebcam';

export default function ValidacaoPage() {
  const { videoRef, canvasRef, webcam, startWebcam, stopWebcam } = useWebcam();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-4 sm:py-6 md:py-8 px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Validação Facial</h1>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            Posicione-se em frente à câmera para validação de acesso
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <WebcamCapture 
              videoRef={videoRef}
              canvasRef={canvasRef}
              webcam={webcam}
              startWebcam={startWebcam}
              stopWebcam={stopWebcam}
            />
          </div>
          <div className="lg:col-span-1 order-1 lg:order-2">
            <ValidationPanel 
              videoRef={videoRef}
              canvasRef={canvasRef}
              webcam={webcam}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
