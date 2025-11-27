import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, adminApi } from '@/lib/api';
import type { User, RegisterRequest } from '@/types';
import { toast } from 'sonner';

export const useUsers = () => {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await usersApi.getUsers();
      return response.users;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
};

export const useRegisterUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterRequest) => usersApi.registerUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Usuário cadastrado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao cadastrar usuário');
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => usersApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Usuário removido com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao remover usuário');
    },
  });
};

export const useDeleteAllUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => usersApi.deleteAllUsers(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Usuários removidos com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao remover usuários');
    },
  });
};
