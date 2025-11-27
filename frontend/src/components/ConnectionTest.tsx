'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Wifi } from 'lucide-react';

interface ConnectionTest {
  name: string;
  url: string;
  status: 'idle' | 'testing' | 'success' | 'error';
  error?: string;
}

export function ConnectionTest() {
  // Detectar URL do backend baseado no ambiente
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 
    (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
      ? 'http://localhost:8000' 
      : '');
  
  // Em produção, usar a URL completa se disponível, senão usar URL relativa
  const getApiUrl = (path: string) => {
    if (backendUrl) {
      return `${backendUrl}${path}`;
    }
    // Em produção sem NEXT_PUBLIC_API_URL, tentar usar URL relativa (rewrites)
    return path;
  };
  
  const [tests, setTests] = useState<ConnectionTest[]>([
    { name: 'Backend API', url: getApiUrl('/api/stats'), status: 'idle' },
    { name: 'Frontend', url: '/', status: 'idle' },
  ]);

  const runTest = async (test: ConnectionTest) => {
    setTests(prev => prev.map(t => 
      t.name === test.name ? { ...t, status: 'testing' } : t
    ));

    try {
      // Usar URL completa se disponível, senão usar relativa
      const url = test.url.startsWith('http') ? test.url : getApiUrl(test.url);
      const response = await fetch(url);
      if (response.ok) {
        setTests(prev => prev.map(t => 
          t.name === test.name ? { ...t, status: 'success' } : t
        ));
      } else {
        setTests(prev => prev.map(t => 
          t.name === test.name ? { 
            ...t, 
            status: 'error', 
            error: `HTTP ${response.status}` 
          } : t
        ));
      }
    } catch (error) {
      setTests(prev => prev.map(t => 
        t.name === test.name ? { 
          ...t, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error'
        } : t
      ));
    }
  };

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test);
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay between tests
    }
  };

  const getStatusIcon = (status: ConnectionTest['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'testing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: ConnectionTest['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-600">Conectado</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'testing':
        return <Badge variant="secondary">Testando...</Badge>;
      default:
        return <Badge variant="outline">Não testado</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Wifi className="h-4 w-4 sm:h-5 sm:w-5" />
          Teste de Conectividade
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Verifique se o frontend está conectado corretamente ao backend
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 px-4 sm:px-6">
        <div className="flex gap-2">
          <Button onClick={runAllTests} className="flex items-center gap-2 w-full sm:w-auto">
            <Wifi className="h-4 w-4" />
            <span className="text-sm sm:text-base">Testar Todas as Conexões</span>
          </Button>
        </div>

        <div className="space-y-3">
          {tests.map((test) => (
            <div key={test.name} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getStatusIcon(test.status)}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base truncate">{test.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{test.url}</p>
                  {test.error && (
                    <p className="text-xs sm:text-sm text-red-600 truncate">{test.error}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {getStatusBadge(test.status)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runTest(test)}
                  disabled={test.status === 'testing'}
                  className="text-xs sm:text-sm"
                >
                  {test.status === 'testing' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    'Testar'
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 sm:p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2 text-sm sm:text-base">Como resolver problemas:</h4>
          <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
            <li>• <strong>Backend não conecta:</strong> Execute <code>python backend/app/main.py</code></li>
            <li>• <strong>Frontend não conecta:</strong> Execute <code>cd frontend && npm run dev</code></li>
            <li>• <strong>API não acessível:</strong> Verifique se o backend está rodando na porta 8000</li>
            <li>• <strong>CORS errors:</strong> O backend já tem CORS configurado para aceitar todas as origens</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
