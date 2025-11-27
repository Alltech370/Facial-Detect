'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Video, VideoOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface WebcamCaptureProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  webcam: any;
  startWebcam: () => void;
  stopWebcam: () => void;
}

export function WebcamCapture({ 
  videoRef, 
  canvasRef, 
  webcam, 
  startWebcam, 
  stopWebcam 
}: WebcamCaptureProps) {

  return (
    <Card className="w-full">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 sm:h-5 sm:w-5" />
            <CardTitle className="text-lg sm:text-xl">Câmera</CardTitle>
          </div>
          <Badge variant={webcam.isActive ? 'default' : 'secondary'} className="text-xs sm:text-sm">
            {webcam.isActive ? 'LIVE' : 'OFF'}
          </Badge>
        </div>
        <CardDescription className="text-sm sm:text-base">
          {webcam.isActive 
            ? 'Câmera ativa - posicione-se em frente à tela'
            : 'Clique em "Iniciar Câmera" para começar a validação'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-4 sm:px-6">
        <div className="space-y-4">
          {/* Video Container */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video w-full">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
            
            {!webcam.isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center text-muted-foreground">
                  <VideoOff className="h-12 w-12 mx-auto mb-4" />
                  <p>Câmera não ativa</p>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {webcam.error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
            >
              <p className="text-sm text-destructive">{webcam.error}</p>
            </motion.div>
          )}

          {/* Controls */}
          <div className="flex gap-4 justify-center">
            {!webcam.isActive ? (
              <Button onClick={startWebcam} className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Iniciar Câmera
              </Button>
            ) : (
              <Button 
                onClick={stopWebcam} 
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Parar Câmera
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
