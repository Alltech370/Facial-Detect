import { z } from 'zod';

// Register form validation schema
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
  photo: z
    .any()
    .refine((file) => file instanceof File, { message: 'Foto é obrigatória' })
    .refine((file) => file.size <= 10 * 1024 * 1024, 'Arquivo deve ter no máximo 10MB')
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp'].includes(file.type),
      'Formato não suportado. Use JPG, PNG ou BMP'
    ),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// Utility functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatConfidence = (confidence: number): string => {
  return `${(confidence * 100).toFixed(1)}%`;
};

export const getStatusColor = (status: boolean): string => {
  return status ? 'text-green-600' : 'text-red-600';
};

export const getStatusBadgeVariant = (status: boolean): 'default' | 'destructive' => {
  return status ? 'default' : 'destructive';
};
