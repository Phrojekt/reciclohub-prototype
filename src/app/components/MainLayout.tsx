"use client";

import { ReactNode, useEffect, useState, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import NotificationsMenu from "./NotificationsMenu";


interface UserProfile {
  name: string;
  role: string;
}

// Contexto para título dinâmico
const PageTitleContext = createContext<string>("RecicloHub");
export function usePageTitle() {
  return useContext(PageTitleContext);
}


export function MainLayout({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const pageTitle = usePageTitle();
  const pathname = usePathname();

  // Fallback: gera título a partir da rota se contexto não for definido
  // Mapeamento de rotas para títulos amigáveis (igual à sidebar)
  const routeTitles: Record<string, string> = {
    "chat": "Conversas",
    "proposals": "Propostas",
    "received": "Propostas Recebidas",
    "feed": "Feed",
    "residues": "Resíduos",
    "register": "Cadastro",
    "my-offers": "Minhas Ofertas",
    "edit-residues": "Editar Resíduo",
    "notifications": "Notificações",
    // Adicione outros conforme necessário
  };

  function getFallbackTitle() {
    if (pageTitle && pageTitle !== "RecicloHub") return pageTitle;
    if (!pathname || pathname === "/") return "RecicloHub";
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return "RecicloHub";
    let last = parts[parts.length - 1];
    // Se for id dinâmico, pega o anterior
    if (last.startsWith("[")) last = parts[parts.length - 2] || last;
    // Usa o mapeamento se existir
    if (routeTitles[last]) return routeTitles[last];
    // Fallback: capitaliza
    return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ");
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      if (user) {
        const userData = JSON.parse(user);
        setUserProfile({
          name: userData.nome || userData.name || "Usuário",
          role: userData.role || userData.papel || "Usuário"
        });
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F4FBFB] md:ml-64 pt-16 md:pt-0">
      <Navbar />
      {/* HEADER PADRÃO */}
      {/**
       * Hide the standard header on small screens when the route is /chat.
       * We use responsive Tailwind classes: make the header `hidden` on mobile and `flex` from `sm` upwards.
       */}
      <div
        className={
          (pathname && pathname.startsWith('/chat')
            ? 'hidden sm:flex'
            : 'flex') +
          ' w-full bg-white shadow-sm py-3 px-4 sm:px-6 flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0'
        }
        style={{ minHeight: 64 }}
      >
        {/* Título */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <span className="text-xl pl-4 sm:text-2xl font-bold text-teal-700 tracking-tight truncate">{getFallbackTitle()}</span>
        </div>
        {/* Barra de busca removida */}
        {/* Notificação e Perfil */}
        <div className="flex items-center gap-3 sm:gap-6 min-w-0 justify-end">
          <NotificationsMenu buttonClass="relative p-2 rounded-full hidden sm:inline-flex" iconClass="text-teal-700" hideOnMobile />
          {/* <Link href="/profile" ...> ... </Link> */}
          <div className="items-center gap-2 min-w-0 sm:flex hidden group opacity-60 cursor-not-allowed select-none">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg">
              {userProfile?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight truncate max-w-[80px] sm:max-w-[120px]">{userProfile?.name || "Usuário"}</span>
              <span className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[80px] sm:max-w-[120px]">{userProfile?.role || "Usuário"}</span>
            </div>
          </div>
        </div>
      </div>
      {/* FIM HEADER */}
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
}
// Provider para envolver a aplicação e definir o título da página
export function PageTitleProvider({ title, children }: { title: string; children: ReactNode }) {
  return <PageTitleContext.Provider value={title}>{children}</PageTitleContext.Provider>;
}
