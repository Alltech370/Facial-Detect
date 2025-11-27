'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Zap, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Shield,
    title: 'Seguro',
    description: 'Criptografia AES-256 e compliance LGPD',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    icon: Zap,
    title: 'Rápido',
    description: 'Processamento em tempo real',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Eye,
    title: 'Anti-Spoofing',
    description: 'Detecção de liveness integrada',
    gradient: 'from-green-500 to-emerald-500',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-6 sm:py-8 md:py-12">
      <div className="text-center mb-6 sm:mb-8 md:mb-12 px-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Recursos Principais</h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
          Tecnologia avançada para garantir segurança e eficiência no controle de acesso
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ y: -5 }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/20">
                <CardHeader className="text-center px-4 sm:px-6">
                  <div className="mx-auto mb-3 sm:mb-4 p-3 sm:p-4 rounded-full bg-gradient-to-r from-primary/10 to-primary/5">
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className={`h-1 w-full rounded-full bg-gradient-to-r ${feature.gradient}`} />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
