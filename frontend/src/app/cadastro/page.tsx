import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RegisterForm } from '@/components/cadastro/RegisterForm';

export default function CadastroPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-4 sm:py-6 md:py-8 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Cadastrar Novo Usuário</h1>
            <p className="text-sm sm:text-base text-muted-foreground px-4">
              Envie uma foto clara do seu rosto para cadastro no sistema
            </p>
          </div>
          
          <RegisterForm />
        </div>
      </main>

      <Footer />
    </div>
  );
}
