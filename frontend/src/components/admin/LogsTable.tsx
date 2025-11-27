'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { History, RefreshCw, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate } from '@/lib/utils/validators';
import type { AccessLog } from '@/types';

export function LogsTable() {
  const [limit, setLimit] = useState(50);

  const { data: logs, isLoading, error, refetch } = useQuery<AccessLog[]>({
    queryKey: ['logs', limit],
    queryFn: async () => {
      const response = await adminApi.getLogs(limit);
      return response.logs;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Logs de Acesso</CardTitle>
          <CardDescription>Carregando logs...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
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
          <p className="text-muted-foreground">Erro ao carregar logs</p>
          <Button onClick={() => refetch()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 sm:h-5 sm:w-5" />
            <CardTitle className="text-lg sm:text-xl">Logs de Acesso</CardTitle>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-2 border border-input rounded-md bg-background text-sm flex-1 sm:flex-initial"
            >
              <option value={20}>Últimos 20</option>
              <option value={50}>Últimos 50</option>
              <option value={100}>Últimos 100</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="flex-1 sm:flex-initial">
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </div>
        <CardDescription className="text-sm sm:text-base">
          Histórico de tentativas de acesso ao sistema
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-4 sm:px-6">
        <div className="rounded-md border overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Confiança</TableHead>
                <TableHead>Liveness</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!logs || logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Nenhum log encontrado
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, index) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={log.access_granted ? 'bg-green-50/50' : 'bg-red-50/50'}
                  >
                    <TableCell className="font-mono text-sm">
                      {formatDate(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      {log.user_name || 'Desconhecido'}
                    </TableCell>
                    <TableCell>
                      {log.confidence ? (
                        <Badge variant="outline">
                          {(log.confidence * 100).toFixed(1)}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={log.liveness_passed ? 'default' : 'destructive'}
                        className={log.liveness_passed ? 'bg-green-600' : ''}
                      >
                        {log.liveness_passed ? 'Aprovado' : 'Reprovado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={log.access_granted ? 'default' : 'destructive'}
                        className={log.access_granted ? 'bg-green-600' : ''}
                      >
                        {log.access_granted ? 'Liberado' : 'Negado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.ip_address || '-'}
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
              </Table>
            </div>
          </div>

        {/* Summary */}
        <div className="mt-4 text-xs sm:text-sm text-muted-foreground">
          Mostrando {logs?.length || 0} log(s) mais recente(s)
        </div>
      </CardContent>
    </Card>
  );
}
