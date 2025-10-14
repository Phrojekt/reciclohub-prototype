"use client"

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AnimatedSection, AnimatedCard } from './components/animations';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const router = useRouter();

  // Verifica se o usuário está logado ao carregar a página
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("token")) {
      router.replace("/feed");
    }
  }, [router]);

  // Controla a visibilidade do botão "voltar ao topo"
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
          setShowScrollTop(scrollTop > 150);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Verifica imediatamente
    handleScroll();

    // Event listeners otimizados para mobile
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    
    // Para iOS Safari
    document.body.addEventListener('touchmove', handleScroll, { passive: true });
    document.body.addEventListener('touchend', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      document.body.removeEventListener('touchmove', handleScroll);
      document.body.removeEventListener('touchend', handleScroll);
    };
  }, []);

  // Função para rolar suavemente para o topo
  const scrollToTop = () => {
    // Força o scroll em múltiplas tentativas para garantir compatibilidade total
    const scrollToTopFallback = () => {
      // Método 1: window.scrollTo com behavior
      if ('scrollTo' in window) {
        try {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        } catch {}
      }
      
      // Método 2: window.scrollTo simples
      try {
        window.scrollTo(0, 0);
        return;
      } catch {}
      
      // Método 3: document.documentElement
      try {
        document.documentElement.scrollTop = 0;
        return;
      } catch {}
      
      // Método 4: document.body
      try {
        document.body.scrollTop = 0;
        return;
      } catch {}
    };
    
    // Executa imediatamente
    scrollToTopFallback();
    
    // Executa novamente após um pequeno delay para dispositivos lentos
    setTimeout(scrollToTopFallback, 50);
    
    // Verificação final
    setTimeout(() => {
      if ((window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop) > 0) {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    }, 150);
  };

  return (
    <main className="min-h-screen bg-white" id="">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Image src="/reciclohub.newLogo.svg" alt="RecicloHub" width={300} height={40} className="h-12 w-auto" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex font-semibold items-center space-x-6">
            <Link href="#benefits" className="text-[#999999] hover:text-teal-600 text-sm md:text-base">
              Benefícios
            </Link>
            <Link href="#how-it-works" className="text-[#999999] hover:text-teal-600 text-sm md:text-base">
              Como Funciona
            </Link>
            <Link href="#mission" className="text-[#999999] hover:text-teal-600 text-sm md:text-base">
              Sobre Nós
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-[#00A2AA] px-4 py-2 text-sm md:text-base font-semibold text-white hover:bg-teal-600 min-w-[100px] text-center"
            >
              Cadastre-se
            </Link>
            <Link
              href="/login"
              className="rounded-md border-2 border-[#00A2AA] px-4 py-2 text-sm md:text-base font-semibold text-[#00A2AA] hover:bg-[#00A2AA] hover:text-white transition-all duration-200 min-w-[100px] text-center"
            >
              Login
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex items-center justify-center rounded-md bg-[#00A2AA] p-2 text-white hover:bg-teal-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu Sidebar */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Overlay */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
              onClick={() => setMenuOpen(false)}
            ></div>
            
            {/* Sidebar */}
            <div className="absolute top-0 right-0 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-out flex flex-col">
              {/* Header da Sidebar */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                <Image
                  src="/reciclohub.newLogo.svg"
                  alt="RecicloHub Logo"
                  width={100}
                  height={32}
                  className="h-8 w-auto"
                />
                <button
                  className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Fechar menu"
                >
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              
              {/* Conteúdo da Sidebar - Scrollable */}
              <div className="flex flex-col flex-1 overflow-y-auto">
                {/* Links de Navegação */}
                <nav className="flex-1 px-4 py-6 space-y-4">
                  <Link
                    href="#benefits"
                    className="block text-gray-700 hover:text-[#00A2AA] text-base font-medium transition-colors duration-200 py-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    Benefícios
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="block text-gray-700 hover:text-[#00A2AA] text-base font-medium transition-colors duration-200 py-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    Como Funciona
                  </Link>
                  <Link
                    href="#mission"
                    className="block text-gray-700 hover:text-[#00A2AA] text-base font-medium transition-colors duration-200 py-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sobre Nós
                  </Link>
                </nav>
                
                {/* Botões de Ação - Fixados no Bottom */}
                <div className="px-4 pb-6 space-y-3 flex-shrink-0">
                  <Link
                    href="/login"
                    className="flex items-center justify-center w-full h-11 rounded-lg border-2 border-[#00A2AA] text-[#00A2AA] font-medium hover:bg-[#00A2AA] hover:text-white transition-all duration-200 text-sm"
                    onClick={() => setMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center justify-center w-full h-11 rounded-lg bg-[#00A2AA] text-white font-medium hover:bg-[#00757B] transition-all duration-200 text-sm"
                    onClick={() => setMenuOpen(false)}
                  >
                    Cadastre-se
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <AnimatedSection delay={0}>
        <section
          className="relative py-16 md:py-48 h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/wallpaper.png')"
          }}
        >
          {/* Overlay preto com 80% de opacidade */}
          <div className="absolute inset-0 bg-black/60"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start lg:items-center min-h-[500px]">
              
              {/* Coluna Esquerda - Conteúdo Atual (7 colunas) */}
              <div className="lg:col-span-7 text-center lg:text-left flex flex-col justify-center h-full py-8 lg:py-0">
                <div className="animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
                  <h1 className="mb-6 text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight max-w-4xl lg:max-w-none">
                    Conectando Indústrias,
                    <br />
                    Transformando Resíduos em Oportunidades
                  </h1>
                </div>

                <div className="animate-fade-in-up" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
                  <p className="mx-auto lg:mx-0 mb-10 max-w-3xl lg:max-w-2xl font-semibold text-sm md:text-lg lg:text-xl text-white leading-relaxed">
                    Uma plataforma digital para troca e venda de resíduos industriais entre empresas, promovendo a
                    simbiose industrial e impulsionando a economia circular em Pernambuco.
                  </p>
                </div>

                <AnimatedCard delay={200} index={0}>
                  <div className="flex flex-col items-center lg:items-start justify-start space-y-4 md:flex-row md:space-x-4 md:space-y-0 lg:justify-start">
                    <Link
                      href="/register"
                      className="rounded-full bg-[#00A2AA] px-8 py-4 text-sm font-semibold md:text-base text-white hover:bg-[#00A2AA]/80 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Cadastre sua empresa
                    </Link>
                    <Link
                      href="#how-it-works"
                      className="rounded-full border-2 border-white font-semibold bg-white px-8 py-4 text-sm md:text-base text-[#00A2AA] hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Saiba como funciona
                    </Link>
                  </div>
                </AnimatedCard>
              </div>

              {/* Coluna Direita - Vídeo (5 colunas) */}
              <div className="lg:col-span-5 flex flex-col items-center lg:items-start justify-center h-full py-8 lg:py-0">
                <AnimatedCard delay={300} index={1}>
                  <div className="w-full max-w-lg">
                    <div className="bg-black rounded-lg shadow-2xl border-2 border-white/20 overflow-hidden">
                      <iframe 
                        width="100%" 
                        height="350" 
                        src="https://www.youtube.com/embed/FTND7_kbEPc?si=W00bf8jz7l7O2L5e" 
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        referrerPolicy="strict-origin-when-cross-origin" 
                        allowFullScreen
                        className="w-full"
                        style={{
                          minHeight: '350px',
                          aspectRatio: '16/9',
                          borderRadius: '8px'
                        }}
                      ></iframe>
                    </div>
                    <p className="text-center lg:text-left text-white/90 text-sm mt-4 font-medium">
                      Saiba sobre
                    </p>
                  </div>
                </AnimatedCard>
              </div>

            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Problem Section - Economia Circular */}
      <section className="relative py-16 md:py-24 bg-[#00A2AA] overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white rounded-full transform -translate-y-1/2"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <AnimatedCard delay={0} index={0}>
              <h2 className="mb-8 text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                Sua empresa pode estar perdendo
                <br />
                <span className="text-teal-950 font-black">milhares de reais</span> todos os meses
              </h2>
            </AnimatedCard>

            <AnimatedCard delay={100} index={1}>
              <p className="mb-12 text-lg md:text-xl text-white/90 leading-relaxed max-w-4xl mx-auto">
                Enquanto você paga caro para descartar resíduos, outras empresas precisam 
                comprar exatamente esses mesmos materiais como matéria-prima.
              </p>
            </AnimatedCard>

              {/* Statistics Grid */}
              <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <AnimatedCard delay={0} index={0}>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 transition-all duration-300 ease-out hover:bg-white/20 hover:border-white/30 hover:scale-105 hover:shadow-xl cursor-pointer">
                    <div className="text-3xl md:text-4xl font-black text-teal-950 mb-2">87%</div>
                    <p className="text-white/90 text-sm md:text-base">
                      dos resíduos industriais ainda vão para aterros
                    </p>
                  </div>
                </AnimatedCard>

                <AnimatedCard delay={0} index={1}>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 transition-all duration-300 ease-out hover:bg-white/20 hover:border-white/30 hover:scale-105 hover:shadow-xl cursor-pointer">
                    <div className="text-3xl md:text-4xl font-black text-teal-950 mb-2">R$ 50B</div>
                    <p className="text-white/90 text-sm md:text-base">
                      desperdiçados anualmente no Brasil em descarte
                    </p>
                  </div>
                </AnimatedCard>

                <AnimatedCard delay={0} index={2}>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 transition-all duration-300 ease-out hover:bg-white/20 hover:border-white/30 hover:scale-105 hover:shadow-xl cursor-pointer">
                    <div className="text-3xl md:text-4xl font-black text-teal-950 mb-2">40%</div>
                    <p className="text-white/90 text-sm md:text-base">
                      dos custos operacionais podem ser reduzidos
                    </p>
                  </div>
                </AnimatedCard>
              </div>

              <AnimatedCard delay={100} index={0}>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-3xl mx-auto">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-6">
                    O problema é real e está acontecendo agora:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 text-teal-950  rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-white/90 text-sm md:text-base">
                        Custos altos de descarte que drenam seu orçamento mensalmente
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 text-teal-950  rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-white/90 text-sm md:text-base">
                        Oportunidades de receita perdidas com materiais valiosos
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 text-teal-950  rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-white/90 text-sm md:text-base">
                        Imagem corporativa prejudicada por práticas não sustentáveis
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 text-teal-950  rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-white/90 text-sm md:text-base">
                        Desperdício de recursos que poderiam gerar lucro
                      </p>
                    </div>
                  </div>
                </div>
            </AnimatedCard>

            <AnimatedCard delay={200} index={0}>
              <div className="mt-12">
                <p className="text-lg md:text-xl text-white font-semibold mb-8">
                  Não deixe que sua concorrência saia na frente.
                </p>
                <Link
                  href="#solution"
                  className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-[#00A2AA] font-bold px-8 py-4 rounded-full text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Descobrir a solução
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </section>      {/* Solution Section */}
      <AnimatedSection id="solution-section" delay={50}>
        <section id="solution" className="py-20 md:py-32 bg-white">
          <div className="container mx-auto px-4">
            


            {/* Value Proposition */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24 lg:items-end">
              <div>
                <AnimatedCard delay={0} index={0}>
                  <div className="space-y-8">
                    <div className="inline-flex items-center gap-3 bg-[#00A2AA]/10 px-4 py-2 rounded-full">
                      <div className="w-2 h-2 bg-[#00A2AA] rounded-full"></div>
                      <span className="text-sm font-medium text-[#00A2AA] uppercase tracking-wide">A Solução Simples</span>
                    </div>
                    
                    <h3 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                      Conectamos o que você não quer 
                      <br />
                      <span className="text-[#00A2AA]">com quem precisa</span>
                    </h3>
                    
                    <p className="text-lg text-gray-600 leading-relaxed">
                      Somos o primeiro marketplace pernambucano dedicado exclusivamente à economia circular industrial. 
                      Nossa plataforma oferece suporte em cada etapa, garantindo segurança nas transações e transformando desperdício em receita.
                    </p>
                  </div>
                </AnimatedCard>
              </div>

              <div className="flex flex-col justify-end">
                <AnimatedCard delay={0} index={1}>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-1 h-12 bg-[#00A2AA] rounded-full flex-shrink-0 mt-1"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Para Geradores de Resíduos</h4>
                        <p className="text-gray-600">Transforme custos de descarte em fonte de receita</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-1 h-12 bg-[#00A2AA] rounded-full flex-shrink-0 mt-1"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Para Compradores</h4>
                        <p className="text-gray-600">Acesse matéria-prima de qualidade por preços competitivos</p>
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              </div>
            </div>

            {/* How It Works */}
            <div className="mb-24">
              <AnimatedCard delay={0} index={0}>
                <div className="text-center mb-16">
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Três passos simples para transformar seu relacionamento com resíduos
                  </p>
                </div>
              </AnimatedCard>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                {/* Linha conectora */}
                <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-1 bg-gradient-to-r from-[#00A2AA] via-[#00A2AA] to-[#00A2AA] rounded-full opacity-10 z-0"></div>
                <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-[#00A2AA] via-[#00A2AA] to-[#00A2AA] rounded-full opacity-15 z-0"></div>
                
                <AnimatedCard delay={0} index={0}>
                  <div className="text-center group relative z-10">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#00A2AA] to-[#008a91] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg relative z-10">
                        <span className="text-2xl font-bold text-white">1</span>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-3">Cadastre seus resíduos</h4>
                    <p className="text-gray-600">
                      Registre os materiais que sua empresa gera com informações simples e claras
                    </p>
                  </div>
                </AnimatedCard>

                <AnimatedCard delay={0} index={1}>
                  <div className="text-center group relative z-10">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#00A2AA] to-[#008a91] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg relative z-10">
                        <span className="text-2xl font-bold text-white">2</span>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-3">Conecte com empresas</h4>
                    <p className="text-gray-600">
                      Nossa plataforma conecta você com empresas interessadas nos seus materiais
                    </p>
                  </div>
                </AnimatedCard>

                <AnimatedCard delay={0} index={2}>
                  <div className="text-center group relative z-10">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#00A2AA] to-[#008a91] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg relative z-10">
                        <span className="text-2xl font-bold text-white">3</span>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-3">Negocie com segurança</h4>
                    <p className="text-gray-600">
                      Use nosso chat integrado com suporte da plataforma para negociar e fechar negócios
                    </p>
                  </div>
                </AnimatedCard>
              </div>
            </div>

            {/* Social Proof */}
            <div className="mb-20">
              <AnimatedCard delay={700} index={7}>
                <div className="bg-gray-50 rounded-3xl p-12 text-center">
                  <div className="max-w-3xl mx-auto">
                    <div className="flex justify-center mb-8">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <blockquote className="text-xl md:text-2xl text-gray-700 italic font-light mb-6">
                      &ldquo;Finalmente uma solução que faz sentido para nossa indústria. Transformamos um custo fixo em receita variável.&rdquo;
                    </blockquote>
                    <div className="text-sm text-gray-500 uppercase tracking-wide">
                      Empresas que já transformaram desperdício em oportunidade
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </div>

            {/* CTA Final */}
            <div className="text-center">
              <AnimatedCard delay={800} index={8}>
                <div className="max-w-3xl mx-auto">
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                    Não deixe dinheiro ir para o lixo
                  </h3>
                  <p className="text-xl text-gray-600 mb-8">
                    Cada dia que passa é receita perdida. Comece hoje mesmo.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center gap-2 bg-[#00A2AA] hover:bg-[#008a91] text-white font-semibold px-8 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Cadastrar Empresa
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                    <Link
                      href="#benefits"
                      className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-gray-50 text-gray-700 font-semibold px-8 py-4 rounded-full text-lg transition-all duration-300 border-2 border-gray-200 hover:border-gray-300"
                    >
                      Ver mais benefícios
                    </Link>
                  </div>
                </div>
              </AnimatedCard>
            </div>

          </div>
        </section>
      </AnimatedSection>

      {/* Benefits Section */}
      <AnimatedSection id="benefits-section" delay={50}>
        <section id="benefits" className="py-20 md:py-32 bg-gray-50 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100"></div>
            {/* Geometric elements */}
            <div className="absolute top-20 right-20 w-32 h-32 bg-[#00A2AA]/5 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 left-20 w-24 h-24 bg-[#00A2AA]/5 rounded-full blur-lg"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#00A2AA]/3 rounded-full blur-2xl"></div>
          </div>

          <div className="container mx-auto px-4 relative">
            {/* Header Section */}
            <AnimatedCard delay={0} index={0}>
              <div className="text-center mb-20">
                
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  Por que usar nossa plataforma?
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Descubra os benefícios únicos que transformarão a gestão de resíduos da sua empresa
                </p>
              </div>
            </AnimatedCard>

            {/* Cards Container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              
              {/* Card 1 - Ganhos Econômicos */}
              <AnimatedCard delay={100} index={1}>
                <div className="group bg-white rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden h-auto min-h-[380px] lg:h-[420px] flex flex-col">
                  {/* Icon */}
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <svg className="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4 group-hover:text-[#00A2AA] transition-colors duration-300 flex-shrink-0">
                    Ganhos Econômicos
                  </h3>
                  
                  <p className="text-gray-600 text-sm lg:text-base leading-relaxed mb-4 lg:mb-6 flex-grow">
                    Reduza seus custos operacionais ao diminuir significativamente as despesas com o descarte de resíduos. Além disso, transforme o que antes era um problema em uma nova fonte de receita através da venda inteligente de resíduos.
                  </p>

                  {/* Highlight */}
                  <div className="flex items-center text-xs lg:text-sm font-semibold text-green-600 flex-shrink-0">
                    <svg className="w-3 h-3 lg:w-4 lg:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Aumento de receita
                  </div>

                  {/* Background decoration */}
                  <div className="absolute -bottom-6 -right-6 w-16 h-16 lg:w-20 lg:h-20 bg-green-100 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                </div>
              </AnimatedCard>

              {/* Card 2 - Sustentabilidade */}
              <AnimatedCard delay={200} index={2}>
                <div className="group bg-white rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden h-auto min-h-[380px] lg:h-[420px] flex flex-col">
                  {/* Icon */}
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-[#00A2AA] to-[#008a91] rounded-xl flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <svg className="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4 group-hover:text-[#00A2AA] transition-colors duration-300 flex-shrink-0">
                    Sustentabilidade Prática
                  </h3>
                  
                  <p className="text-gray-600 text-sm lg:text-base leading-relaxed mb-4 lg:mb-6 flex-grow">
                    Contribua ativamente para um futuro mais verde ao reduzir o volume de resíduos destinados a aterros sanitários e diminuir a emissão de gases como o CO2 em suas operações. Demonstre seu compromisso ambiental e fortaleça a reputação da sua empresa.
                  </p>

                  {/* Highlight */}
                  <div className="flex items-center text-xs lg:text-sm font-semibold text-[#00A2AA] flex-shrink-0">
                    <svg className="w-3 h-3 lg:w-4 lg:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Impacto ambiental positivo
                  </div>

                  {/* Background decoration */}
                  <div className="absolute -bottom-6 -right-6 w-16 h-16 lg:w-20 lg:h-20 bg-[#00A2AA]/10 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                </div>
              </AnimatedCard>

              {/* Card 3 - Conexões */}
              <AnimatedCard delay={300} index={3}>
                <div className="group bg-white rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden h-auto min-h-[380px] lg:h-[420px] flex flex-col">
                  {/* Icon */}
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <svg className="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4 group-hover:text-[#00A2AA] transition-colors duration-300 flex-shrink-0">
                    Conexões Inteligentes
                  </h3>
                  
                  <p className="text-gray-600 text-sm lg:text-base leading-relaxed mb-4 lg:mb-6 flex-grow">
                    Amplie sua rede de contatos com empresas que possuem interesse nos seus resíduos ou que podem fornecer os materiais que você necessita. Estabeleça relações comerciais mutuamente benéficas e sustentáveis, impulsionando a economia circular.
                  </p>

                  {/* Highlight */}
                  <div className="flex items-center text-xs lg:text-sm font-semibold text-blue-600 flex-shrink-0">
                    <svg className="w-3 h-3 lg:w-4 lg:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Rede empresarial expandida
                  </div>

                  {/* Background decoration */}
                  <div className="absolute -bottom-6 -right-6 w-16 h-16 lg:w-20 lg:h-20 bg-blue-100 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                </div>
              </AnimatedCard>
            </div>

            {/* Call to Action */}
            <AnimatedCard delay={400} index={4}>
              <div className="text-center mt-16">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-3 bg-[#00A2AA] hover:bg-[#008a91] text-white font-semibold px-10 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Começar agora
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </AnimatedCard>
          </div>
        </section>
      </AnimatedSection>

      {/* How it Works Section */}
      <AnimatedSection delay={25}>
        <section id="how-it-works" className="py-16 md:py-24 bg-white relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-16 right-16 w-24 h-24 bg-[#00A2AA]/5 rounded-full blur-xl"></div>
            <div className="absolute bottom-16 left-16 w-32 h-32 bg-[#00A2AA]/3 rounded-full blur-2xl"></div>
            <div className="absolute top-1/3 left-1/3 w-20 h-20 bg-[#00A2AA]/4 rounded-blur lg"></div>
          </div>

          <div className="container mx-auto px-4 relative">
            {/* Header Section */}
            <AnimatedCard delay={0} index={0}>
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  Como Funciona?
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Transforme seus resíduos em oportunidades em apenas 4 passos simples
                </p>
              </div>
            </AnimatedCard>

            {/* Steps Container - Alternating Layout */}
            <div className="space-y-12 md:space-y-16">
              
              {/* Step 1 - Left Content */}
              <AnimatedCard delay={100} index={1}>
                <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12">
                  {/* Content */}
                  <div className="w-full lg:flex-1 text-center lg:text-left order-2 lg:order-1">
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 lg:mb-4">
                      Cadastre sua empresa
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Dedique alguns minutos para registrar sua empresa em nossa plataforma. Informe detalhes cruciais como o setor de atuação, a localização geográfica e os tipos de materiais com os quais você trabalha.
                    </p>
                  </div>
                  
                  {/* Visual */}
                  <div className="w-full lg:flex-1 lg:max-w-md order-1 lg:order-2">
                    <div className="bg-gradient-to-br from-[#00A2AA]/10 to-[#008a91]/10 rounded-3xl p-6 lg:p-8 relative mx-auto max-w-xs lg:max-w-none">
                      <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-lg">
                        <div className="space-y-3">
                          <div className="h-3 bg-gray-200 rounded-full"></div>
                          <div className="h-3 bg-gray-200 rounded-full w-3/4"></div>
                          <div className="h-3 bg-[#00A2AA]/30 rounded-full w-1/2"></div>
                        </div>
                      </div>
                      <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#00A2AA] rounded-xl flex items-center justify-center">
                        <span className="text-lg font-bold text-white">1</span>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedCard>

              {/* Step 2 - Right Content */}
              <AnimatedCard delay={200} index={2}>
                <div className="flex flex-col lg:flex-row-reverse items-center gap-6 lg:gap-12">
                  {/* Content */}
                  <div className="w-full lg:flex-1 text-center lg:text-left order-2 lg:order-1">
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 lg:mb-4">
                      Ofereça ou busque resíduos
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Utilize nossa interface intuitiva para listar os resíduos que sua empresa gera ou explore o catálogo de materiais disponíveis de outras empresas. Facilite a conexão entre oferta e demanda.
                    </p>
                  </div>
                  
                  {/* Visual */}
                  <div className="w-full lg:flex-1 lg:max-w-md order-1 lg:order-2">
                    <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-3xl p-6 lg:p-8 relative mx-auto max-w-xs lg:max-w-none">
                      <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-lg">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <div className="h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="absolute -top-3 -left-3 w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                        <span className="text-lg font-bold text-white">2</span>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedCard>

              {/* Step 3 - Left Content */}
              <AnimatedCard delay={300} index={3}>
                <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12">
                  {/* Content */}
                  <div className="w-full lg:flex-1 text-center lg:text-left order-2 lg:order-1">
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 lg:mb-4">
                      Negocie com outras empresas
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Entre em contato com outras empresas interessadas. Utilize as ferramentas de comunicação da plataforma com nosso suporte para discutir detalhes e negociar de forma segura.
                    </p>
                  </div>
                  
                  {/* Visual */}
                  <div className="w-full lg:flex-1 lg:max-w-md order-1 lg:order-2">
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl p-6 lg:p-8 relative mx-auto max-w-xs lg:max-w-none">
                      <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-lg">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            </div>
                            <div className="h-2 bg-blue-100 rounded-full flex-1"></div>
                          </div>
                          <div className="flex items-center space-x-2 justify-end">
                            <div className="h-2 bg-gray-200 rounded-full w-2/3"></div>
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                        <span className="text-lg font-bold text-white">3</span>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedCard>

              {/* Step 4 - Right Content */}
              <AnimatedCard delay={400} index={4}>
                <div className="flex flex-col lg:flex-row-reverse items-center gap-6 lg:gap-12">
                  {/* Content */}
                  <div className="w-full lg:flex-1 text-center lg:text-left order-2 lg:order-1">
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 lg:mb-4">
                      Acompanhe os impactos
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Visualize de forma clara e objetiva as métricas geradas pelas suas transações na plataforma. Acompanhe a economia de custos e quantifique sua contribuição para a sustentabilidade.
                    </p>
                  </div>
                  
                  {/* Visual */}
                  <div className="w-full lg:flex-1 lg:max-w-md order-1 lg:order-2">
                    <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-3xl p-6 lg:p-8 relative mx-auto max-w-xs lg:max-w-none">
                      <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-lg">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="h-2 bg-green-200 rounded-full w-3/4"></div>
                            <span className="text-xs font-semibold text-green-600">+30%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="h-2 bg-blue-200 rounded-full w-2/3"></div>
                            <span className="text-xs font-semibold text-blue-600">2.5t</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="h-2 bg-purple-200 rounded-full w-1/2"></div>
                            <span className="text-xs font-semibold text-purple-600">R$ 15k</span>
                          </div>
                        </div>
                      </div>
                      <div className="absolute -top-3 -left-3 w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                        <span className="text-lg font-bold text-white">4</span>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </div>

            {/* Call to Action */}
            <AnimatedCard delay={500} index={5}>
              <div className="text-center mt-16">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-3 bg-[#00A2AA] hover:bg-[#008a91] text-white font-semibold px-10 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Começar agora
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </AnimatedCard>
          </div>
        </section>
      </AnimatedSection>

      {/* About Us Section */}
      <AnimatedSection delay={25}>
        <section id="mission" className="py-16 md:py-32 bg-[#00A2AA] relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00A2AA] to-[#008a91]"></div>
            <div className="absolute inset-0 bg-black/10"></div>
            {/* Geometric patterns */}
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-lg"></div>
          </div>
          
          <div className="container mx-auto px-4 relative">
            {/* Header */}
            <AnimatedCard delay={0} index={0}>
              <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Sobre Nós</h2>
                <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                  Transformando a visão de sustentabilidade empresarial através da inovação e tecnologia
                </p>
              </div>
            </AnimatedCard>

            {/* Main Content - Design moderno e simples */}
            <div className="max-w-6xl mx-auto">
              
              {/* Card principal com texto original */}
              <AnimatedCard delay={0} index={1}>
                <div className="bg-white rounded-3xl p-12 md:p-16 shadow-xl border border-gray-100 relative overflow-hidden">
                  
                  {/* Conteúdo principal */}
                  <div className="space-y-8 text-center">
                    <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                      Mais do que uma plataforma, somos um ecossistema que conecta empresas, promovendo a economia circular e transformando resíduos em oportunidades de negócio, visando um futuro mais sustentável e colaborativo. Buscamos alinhar os interesses das empresas com as necessidades ambientais, criando um impacto positivo que vai além do lucro imediato.
                    </p>
                    
                    <div className="w-16 h-px bg-[#00A2AA] mx-auto my-8"></div>
                    
                    <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                      Seja através de nosso marketplace para transformar aquele resíduo que seria descartado em uma nova fonte de renda, como também através de ferramentas de gerenciamento destes resíduos, facilitando a emissão de relatórios PGRS, o RecicloHub se propõe a ser o parceiro ideal para empresas comprometidas com a sustentabilidade, oferecendo suporte para cada etapa do processo.
                    </p>
                  </div>

                  {/* Valores em destaque com espaçamento adequado */}
                  <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Inovação */}
                    <div className="text-center group">
                      <div className="w-12 h-12 bg-[#00A2AA]/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#00A2AA]/20 transition-colors duration-300">
                        <svg className="w-6 h-6 text-[#00A2AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Inovação</h3>
                      <p className="text-sm text-gray-600">Tecnologia sustentável</p>
                    </div>

                    {/* Sustentabilidade */}
                    <div className="text-center group">
                      <div className="w-12 h-12 bg-[#00A2AA]/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#00A2AA]/20 transition-colors duration-300">
                        <svg className="w-6 h-6 text-[#00A2AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Sustentabilidade</h3>
                      <p className="text-sm text-gray-600">Economia circular</p>
                    </div>

                    {/* Colaboração */}
                    <div className="text-center group">
                      <div className="w-12 h-12 bg-[#00A2AA]/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#00A2AA]/20 transition-colors duration-300">
                        <svg className="w-6 h-6 text-[#00A2AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Colaboração</h3>
                      <p className="text-sm text-gray-600">Conexão empresarial</p>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </div>
          </div>
        </section>
      </AnimatedSection>


      {/* FAQ Section */}
      <AnimatedSection delay={25}>
        <section className="bg-white py-16 md:py-20">
          <div className="container mx-auto px-4">

            <h2 className="mb-12 text-center text-3xl md:text-4xl font-extrabold text-[#00A2AA]">Perguntas Frequentes</h2>

            <div className="max-w-3xl mx-auto space-y-6">

              {/* FAQ Item 1 */}
              <AnimatedCard delay={50} index={0}>
                <details className="group rounded-lg bg-[#00A2AA]/14 p-6 shadow-md backdrop-blur-sm border border-white/10 transition-all duration-300 ease-out hover:shadow-lg">
                  <summary className="flex cursor-pointer items-center justify-between text-lg font-bold text-[#00757B] hover:text-[#00A2AA] transition-colors duration-200">
                    Como funciona o cadastro na plataforma?
                    <svg className="h-5 w-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    O cadastro é simples e gratuito. Você precisa fornecer informações básicas sobre sua empresa, como setor de atuação,
                    localização e tipos de resíduos ou matérias-primas de interesse. Após a aprovação, você terá acesso completo à plataforma.
                  </p>
                </details>
              </AnimatedCard>

              {/* FAQ Item 2 */}
              <AnimatedCard delay={75} index={1}>
                <details className="group rounded-lg bg-[#00A2AA]/14 p-6 shadow-md backdrop-blur-sm border border-white/10 transition-all duration-300 ease-out hover:shadow-lg">
                  <summary className="flex cursor-pointer items-center justify-between text-lg font-bold text-[#00757B] hover:text-[#00A2AA] transition-colors duration-200">
                    Quais tipos de resíduos podem ser negociados?
                    <svg className="h-5 w-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    Nossa plataforma aceita diversos tipos de resíduos industriais, incluindo metais, plásticos, papel, vidro,
                    materiais orgânicos e químicos (dentro das normas de segurança). Cada tipo de resíduo passa por verificação
                    para garantir conformidade legal e ambiental.
                  </p>
                </details>
              </AnimatedCard>

              {/* FAQ Item 3 */}
              <AnimatedCard delay={100} index={2}>
                <details className="group rounded-lg bg-[#00A2AA]/14 p-6 shadow-md backdrop-blur-sm border border-white/10 transition-all duration-300 ease-out hover:shadow-lg">
                  <summary className="flex cursor-pointer items-center justify-between text-lg font-bold text-[#00757B] hover:text-[#00A2AA] transition-colors duration-200">
                    Como é garantida a segurança nas transações?
                    <svg className="h-5 w-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    Implementamos um sistema robusto de verificação de empresas, avaliações mútuas e acompanhamento de transações.
                    Todas as negociações seguem protocolos de segurança e conformidade legal, garantindo transparência e confiabilidade
                    para todos os usuários.
                  </p>
                </details>
              </AnimatedCard>

              {/* FAQ Item 4 */}
              <AnimatedCard delay={125} index={3}>
                <details className="group rounded-lg bg-[#00A2AA]/14 p-6 shadow-md backdrop-blur-sm border border-white/10 transition-all duration-300 ease-out hover:shadow-lg">
                  <summary className="flex cursor-pointer items-center justify-between text-lg font-bold text-[#00757B] hover:text-[#00A2AA] transition-colors duration-200">
                    Existe algum custo para usar a plataforma?
                    <svg className="h-5 w-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    O cadastro e uso básico da plataforma são gratuitos. Cobramos apenas uma pequena taxa de sucesso sobre
                    transações completadas, garantindo que você só pague quando realmente obtiver resultados.
                    Oferecemos também planos premium com funcionalidades avançadas.
                  </p>
                </details>
              </AnimatedCard>

              {/* FAQ Item 5 */}
              <AnimatedCard delay={150} index={4}>
                <details className="group rounded-lg bg-[#00A2AA]/14 p-6 shadow-md backdrop-blur-sm border border-white/10 transition-all duration-300 ease-out hover:shadow-lg">
                  <summary className="flex cursor-pointer items-center justify-between text-lg font-bold text-[#00757B] hover:text-[#00A2AA] transition-colors duration-200">
                    Como posso maximizar minhas chances de encontrar parceiros?
                    <svg className="h-5 w-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    Mantenha seu perfil sempre atualizado, forneça descrições detalhadas dos seus resíduos/necessidades,
                    adicione fotos quando possível e responda rapidamente às propostas. Empresas ativas e bem detalhadas
                    têm 3x mais chances de fazer negócios na plataforma.
                  </p>
                </details>
              </AnimatedCard>

            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Mission Section */}
      <AnimatedSection delay={25}>
        <section id="mission" className="py-16">
          <div className="container mx-auto px-4 text-center">

            <h2 className="mb-10 text-3xl font-extrabold text-[#00A2AA]">
              Juntos por um futuro
              <br />
              mais limpo e colaborativo.
            </h2>
            <div className="">

              <p className="mb-8 text-center text-gray-600 leading-relaxed">
                A RecicloHub é mais que um marketplace de resíduos — é uma rede de colaboração que{" "}
                <span className="font-semibold">transforma passivos ambientais em ativos de valor</span>, fortalece
                cadeias produtivas e{" "}
                <span className="font-semibold">gera impacto positivo no meio ambiente e na economia local</span>.
              </p>


              <p className="text-center text-gray-700 font-bold text-xl leading-relaxed">
                Transforme resíduos em valor. Construa parcerias sustentáveis. Faça parte da nova era industrial.
              </p>
            </div>
          </div>
        </section>
      </AnimatedSection>




      {/* Footer */}
      <footer id="footer" className="bg-[#00A2AA] py-12 text-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <Image src="/reciclohub.newLogoWhite.svg" alt="RecicloHub" width={150} height={40} className="mb-4 h-12 w-auto" />
              <p className="text-sm md:text-base text-white pl-4 font-medium">
                Conectando indústrias para um futuro mais sustentável através da economia circular e colaboração.
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold pl-4">Links</h3>
              <ul className="space-y-2 text-white pl-4">
                <li>
                  <Link href="#benefits" className="hover:text-gray-300 hover:cursor-pointer">
                    Benefícios
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="hover:text-gray-300 hover:cursor-pointer">
                    Como Funciona
                  </Link>
                </li>
                <li>
                  <Link href="#mission" className="hover:text-gray-300 hover:cursor-pointer">
                    Sobre Nós
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 pl-4 text-lg font-semibold">Contato</h3>
              <a
                href="mailto:reciclohub@gmail.com"
                className="mb-2 text-white pl-4 hover:text-gray-300 hover:cursor-pointer"
                rel="noopener noreferrer"
              >
                reciclohub@gmail.com
              </a>
              <p className="text-white pl-4">Caruaru-PE</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Botão Voltar ao Topo */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          scrollToTop();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          scrollToTop();
        }}
        className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#00A2AA] shadow-2xl border-2 border-[#00A2AA]/20 transition-all duration-300 ease-out hover:scale-110 hover:shadow-xl hover:bg-[#00A2AA] hover:text-white touch-manipulation ${
          showScrollTop ? 'opacity-100 translate-y-0 pointer-events-auto scale-100' : 'opacity-0 translate-y-4 pointer-events-none scale-90'
        }`}
        style={{ 
          display: 'flex',
          visibility: showScrollTop ? 'visible' : 'hidden',
          transform: showScrollTop ? 'translateY(0)' : 'translateY(20px)',
          willChange: 'transform, opacity',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none'
        }}
        aria-label="Voltar ao topo"
        type="button"
      >
        <svg
          className="h-6 w-6 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 15l7-7 7 7"
          />
        </svg>
      </button>
    </main>
  );
}
