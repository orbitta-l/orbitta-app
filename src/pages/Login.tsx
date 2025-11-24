import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import LeftPanel from "@/components/login/LeftPanel";
import { supabase } from "@/lib/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { MailCheck } from "lucide-react";
import "./LoginPage.css";
import { getCurrentSession } from "@/services/authService";
import { getMyProfileRow } from "@/services/userService";

// === Fundo animado de estrelas (sem alterações) ===
function StarsBackground() {
  const [stars, setStars] = useState<
    { id: number; top: number; left: number; delay: number; duration: number }[]
  >([]);

  useEffect(() => {
    const newStars = [];
    for (let i = 0; i < 15; i++) {
      newStars.push({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: -Math.random() * 3,
        duration: 1 + Math.random() * 2,
      });
    }
    setStars(newStars);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            animation: `shoot ${star.duration}s linear ${star.delay}s infinite`,
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.8)]" />
        </div>
      ))}

      <style>{`
        @keyframes shoot {
          0% { transform: translate(0, 0); opacity: 0; }
          10%, 90% { opacity: 1; }
          100% { transform: translate(-300px, -300px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// === Painel direito com formulário de login e modal de redefinição de senha ===
function RightPanel() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [dialogView, setDialogView] = useState<'form' | 'success'>('form');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { success } = await login(email, password);
      if (!success) {
        toast({
          variant: "destructive",
          title: "Erro ao fazer login",
          description: "Email ou senha incorretos. Tente novamente.",
        });
        return;
      }

      const { session } = await getCurrentSession();
      if (!session) {
        toast({
          variant: "destructive",
          title: "Erro ao obter sessão",
          description: "Tente entrar novamente.",
        });
        return;
      }

      const { data: profileData, error } = await getMyProfileRow();
      if (error || !profileData) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar perfil",
          description:
            "Não foi possível carregar seus dados. Fale com o suporte.",
        });
        return;
      }

      const role = (profileData as any).role;
      const firstLogin = (profileData as any).first_login;

      if (firstLogin && role === "LIDERADO") {
        navigate("/set-new-password", { replace: true });
      } else if (role === "LIDER") {
        navigate("/dashboard-lider", { replace: true });
      } else {
        navigate("/dashboard-liderado", { replace: true });
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para seu dashboard...",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Ocorreu um erro ao tentar fazer login.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordResetRequest = async (e: FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/set-new-password`,
      });
      if (error) throw error;
      setDialogView('success');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao solicitar redefinição",
        description: error.message || "Não foi possível processar sua solicitação.",
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  const onDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setTimeout(() => {
        setDialogView('form');
        setResetEmail('');
      }, 300);
    }
  };

  return (
    <section className="right-panel z-10">
      <div className="form-container bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-[#1A2A46] mb-6 text-center">
          Acessar plataforma
        </h2>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="seu.email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} className="w-[320px]" />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} className="w-[320px]" />
          </div>
          <div className="text-right">
            <Dialog open={isDialogOpen} onOpenChange={onDialogChange}>
              <DialogTrigger asChild>
                <button type="button" className="text-sm text-gray-600 hover:text-primary transition-colors">
                  Esqueceu sua senha?
                </button>
              </DialogTrigger>
              <DialogContent>
                {dialogView === 'form' ? (
                  <>
                    <DialogHeader>
                      <DialogTitle>Redefinir Senha</DialogTitle>
                      <DialogDescription>
                        Digite seu e-mail para receber o link de redefinição.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePasswordResetRequest} className="space-y-4 pt-4">
                      <div>
                        <Label htmlFor="reset-email">Email</Label>
                        <Input id="reset-email" type="email" placeholder="seu.email@exemplo.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required disabled={isResetLoading} />
                      </div>
                      <Button type="submit" className="w-full" disabled={isResetLoading}>
                        {isResetLoading ? "Enviando..." : "Enviar Link de Redefinição"}
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <MailCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground">Link enviado!</h3>
                    <p className="text-muted-foreground mt-2">
                      Verifique sua caixa de entrada (e a pasta de spam) para encontrar o link de redefinição.
                    </p>
                    <DialogClose asChild>
                      <Button className="mt-6 w-full">Fechar</Button>
                    </DialogClose>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
          <Button type="submit" className="w-full bg-[#1A2A46] hover:bg-[#111A29] text-white rounded-full py-3 font-semibold transition-all" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </section>
  );
}

// === Página completa (sem alterações) ===
export default function LoginPage() {
  const slogan = (
    <>
      Conectando talentos em
      <br />
      uma única órbita
    </>
  );

  return (
    <main
      className="login-page relative flex min-h-screen w-full overflow-hidden"
      style={{
        background: 'url("/Login.svg") center/cover no-repeat',
      }}
    >
      <StarsBackground />
      <LeftPanel title={slogan} />
      <img className="float absolute" src="/Rocket.svg" alt="Foguete" />
      <RightPanel />
    </main>
  );
}
