export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-4 sm:py-6 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-3 sm:gap-4 md:flex-row">
          <div className="flex flex-col items-center gap-2 sm:gap-4 md:flex-row md:gap-2">
            <p className="text-center text-xs sm:text-sm leading-loose text-muted-foreground md:text-left">
              &copy; 2025 Sistema Reconhecimento Facial. Demo para controle de acesso.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
