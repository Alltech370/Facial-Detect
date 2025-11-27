'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStats } from '@/lib/hooks/useStats';
import { Users, CheckCircle, History, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export function PassageStats() {
  const { data: stats, isLoading, error } = useStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas do Sistema</CardTitle>
          <CardDescription>Carregando estatísticas...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 w-24 bg-muted rounded mb-2"></div>
                <div className="h-8 w-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Erro ao carregar estatísticas</p>
        </CardContent>
      </Card>
    );
  }

  const statsData = [
    {
      icon: Users,
      title: 'Usuários Cadastrados',
      value: stats?.total_users || 0,
      color: 'text-blue-600',
    },
    {
      icon: CheckCircle,
      title: 'Taxa de Sucesso',
      value: `${(stats?.success_rate || 0).toFixed(1)}%`,
      color: 'text-green-600',
    },
    {
      icon: History,
      title: 'Tentativas de Acesso',
      value: stats?.total_logs || 0,
      color: 'text-purple-600',
    },
    {
      icon: Cpu,
      title: 'Dispositivo',
      value: stats?.face_recognition.device.toUpperCase() || 'N/A',
      color: 'text-orange-600',
    },
  ];

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-lg sm:text-xl">Estatísticas do Sistema</CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Visão geral das métricas do sistema de reconhecimento facial
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {statsData.map((stat, index) => {
            const Icon = stat.icon;
            
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-2">
                  <div className="p-3 rounded-full bg-muted">
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-1">{stat.value}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{stat.title}</p>
              </motion.div>
            );
          })}
        </div>
        
        {stats?.face_recognition && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status do Modelo</span>
              <Badge variant={stats.face_recognition.model_loaded ? 'default' : 'secondary'}>
                {stats.face_recognition.model_loaded ? 'Carregado' : 'Não Carregado'}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
