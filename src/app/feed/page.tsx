"use client"
import { Search } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import io from "socket.io-client"
import { ResiduoService, type Residuo } from "@/services/residuoService"
import { ProposalModal } from "@/app/modals/proposal"


let socket: ReturnType<typeof io> | null = null;

// ========================================
// NOVO: Interface para as métricas do dashboard
// ========================================
interface DashboardMetrics {
  residuosAnunciados: {
    total: number;
    incremento: number;
    periodo: string;
  };
  transacoesConcluidas: {
    total: number;
    periodo: string;
  };
  economiaGerada: {
    valor: number;
    incrementoPercentual: number;
    periodo: string;
  };
  empresasConectadas: {
    total: number;
    novasParcerias: number;
  };
}

export default function FeedPage() {
  const [residuos, setResiduos] = useState<Residuo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Estados para o modal de proposta
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [selectedResidue, setSelectedResidue] = useState<Residuo | null>(null)

  // ========================================
  // NOVO: Estado para as métricas do dashboard
  // ========================================
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null)

  // ========================================
  // NOVO: Dados fixos para as métricas do dashboard
  // Estes dados são estáticos e representam métricas gerais do sistema
  // ========================================
  const getDashboardMetrics = (): DashboardMetrics => {
    return {
      residuosAnunciados: {
        total: 12, // Dados fixos - total geral do sistema
        incremento: 3,
        periodo: "este mês"
      },
      transacoesConcluidas: {
        total: 8, // Dados fixos - transações do sistema
        periodo: "Este mês"
      },
      economiaGerada: {
        valor: 3250, // Dados fixos - R$ 3.250
        incrementoPercentual: 15,
        periodo: "mês passado"
      },
      empresasConectadas: {
        total: 7, // Dados fixos - 7 empresas
        novasParcerias: 1
      }
    };
  };

  // ========================================
  // NOVO: Função para formatar valores monetários
  // ========================================
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Carregar resíduos (função original mantida intacta)
  const loadResiduos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await ResiduoService.getAllResiduos({
        limit: 9, // 3x3 grid
        offset: (currentPage - 1) * 9
      })

      if (response.success) {
        setResiduos(response.data)
        const total = response.pagination?.total || 0
        setTotalPages(Math.ceil(total / 9))
      } else {
        setError("Erro ao carregar resíduos")
      }
    } catch (err) {
      console.error("Erro ao carregar resíduos:", err)
      setError("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  useEffect(() => {
    loadResiduos()

    // ========================================
    // NOVO: Carregar métricas fixas apenas uma vez
    // ========================================
    if (!dashboardMetrics) {
      const metrics = getDashboardMetrics();
      setDashboardMetrics(metrics);
    }
  }, [currentPage, loadResiduos, dashboardMetrics])

  // Atualização instantânea via Socket.IO 
  useEffect(() => {
    if (!socket) {
      socket = io(); // Usa a URL padrão do backend, ajuste se necessário
    }
    const handleResiduoRegistrado = (novoResiduo: Residuo) => {
      setResiduos(prev => {
        // Evita duplicatas
        if (prev.some(r => r.id === novoResiduo.id)) return prev;
        // Só adiciona se estiver na primeira página
        if (currentPage === 1) {
          const novaLista = [novoResiduo, ...prev];

          // Limita a 9 itens (página cheia)
          return novaLista.slice(0, 9);
        }
        return prev;
      });
      // Atualiza total de páginas se necessário
      setTotalPages(tp => {
        // Se já está correto, mantém
        if (residuos.length % 9 !== 0) return tp;
        return tp + 1;
      });
    };
    socket.on("residuo-registrado", handleResiduoRegistrado);
    return () => {
      socket?.off("residuo-registrado", handleResiduoRegistrado);
    };

  }, [currentPage, residuos.length]);

  // Busca avançada (mantida intacta, apenas com atualização das métricas)
  const handleSearch = async () => {
    if (!searchTerm.trim() && !selectedCity) {
      loadResiduos()
      return
    }

    try {
      setLoading(true)
      setError(null)

      const filters: {
        page?: number
        limit?: number
        search?: string
        cidade?: string
      } = {
        page: 1,
        limit: 9
      }

      if (searchTerm.trim()) {
        filters.search = searchTerm.trim()
      }

      if (selectedCity && selectedCity !== "Todas as cidades" && selectedCity !== "Outras cidades") {
        filters.cidade = selectedCity
      }

      const response = await ResiduoService.advancedSearch(filters)

      if (response.success) {
        setResiduos(response.data)
        setTotalPages(response.pagination?.totalPages || 1)
        setCurrentPage(1)
      } else {
        setError("Erro ao buscar resíduos")
      }
    } catch (err) {
      console.error("Erro na busca:", err)
      setError("Erro ao buscar resíduos")
    } finally {
      setLoading(false)
    }
  }

  // Função para abrir modal de proposta 
  const handleMakeProposal = (residuo: Residuo) => {
    const empresaId = localStorage.getItem("empresaId")
    if (!empresaId) {
      alert("Você precisa estar logado para fazer uma proposta")
      return
    }

    // Verificar se não é a própria empresa
    if (residuo.empresa.id === parseInt(empresaId)) {
      alert("Você não pode fazer proposta para seu próprio resíduo")
      return
    }

    setSelectedResidue(residuo)
    setShowProposalModal(true)
  }

  // Função para fechar modal 
  const handleCloseProposalModal = () => {
    setShowProposalModal(false)
    setSelectedResidue(null)
  }

  // Formatar preço 
  const formatPrice = (preco: string | undefined, disponibilidade: string) => {
    if (disponibilidade === "doacao") return "Gratuito"
    if (disponibilidade === "retirada") return "Retirada"
    return preco || "Preço não informado"
  }

  // Apenas cidades de Pernambuco 
  const locations = [
    "Todas as cidades",
    "Recife",
    "Olinda",
    "Jaboatão dos Guararapes",
    "Caruaru",
    "Petrolina",
    "Paulista",
    "Cabo de Santo Agostinho",
    "Camaragibe",
    "Garanhuns",
    "Vitória de Santo Antão",
    "Igarassu",
    "São Lourenço da Mata",
    "Abreu e Lima",
    "Arcoverde",
    "Serra Talhada",
    "Santa Cruz do Capibaribe",
    "Goiana",
    "Surubim",
    "Palmares",
    "Gravatá",
    "Pesqueira",
    "Belo Jardim",
    "Escada",
    "Ouricuri",
    "Carpina",
    "Araripina",
    "Limoeiro",
    "Barreiros",
    "Salgueiro",
    "Bezerros",
    "Afogados da Ingazeira",
    "São Bento do Una",
    "Timbaúba",
    "Custódia",
    "Buíque",
    "Bom Conselho",
    "Santa Maria da Boa Vista",
    "São José do Egito",
    "Ribeirão",
    "Trindade",
    "Águas Belas",
    "Flores",
    "Toritama",
    "Ipojuca",
    "Tabira",
    "Lajedo",
    "Itambé",
    "Pombos",
    "Moreilândia",
    "Petrolândia",
    "Cabrobó",
    "Exu",
    "Bodocó",
    "Santa Cruz",
    "Orobó",
    "Condado",
    "São Caetano",
    "Venturosa",
    "Santa Maria do Cambucá",
    "Itaíba",
    "Bonito",
    "Jataúba",
    "Gameleira",
    "São José do Belmonte",
    "Ipubi",
    "Outras cidades"
  ]

  return (
    <div className="min-h-screen">
      {/* Título da página */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por empresa ou material..."
              className="pl-10 bg-white border text-gray-900 border-[#00A2AA]/50 h-12 rounded w-full focus:border-[#00A2AA]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="w-full md:w-64">
            <select
              className="bg-white border text-gray-900 border-[#00A2AA]/50 h-12 rounded w-full px-3 focus:border-[#00A2AA]"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              <option value="">Todas as cidades</option>
              {locations.slice(1).map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSearch}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 h-12 rounded font-medium transition-colors"
          >
            Buscar
          </button>
        </div>

        {/* ========================================
            NOVO: Dashboard de Métricas
            ======================================== */}
        {dashboardMetrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Campo 1: Resíduos Anunciados */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Resíduos Anunciados
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardMetrics.residuosAnunciados.total}
                  </p>
                  <p className="text-sm text-green-600 font-medium">
                    +{dashboardMetrics.residuosAnunciados.incremento} {dashboardMetrics.residuosAnunciados.periodo}
                  </p>
                </div>
                {/* <div className="text-3xl">📦</div> */}
              </div>
            </div>

            {/* Campo 2: Transações Concluídas */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Transações Concluídas
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardMetrics.transacoesConcluidas.total}
                  </p>
                  <p className="text-sm text-gray-500 font-medium">
                    {dashboardMetrics.transacoesConcluidas.periodo}
                  </p>
                </div>
                {/* <div className="text-3xl">✅</div> */}
              </div>
            </div>

            {/* Campo 3: Economia Gerada */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Economia Gerada
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(dashboardMetrics.economiaGerada.valor)}
                  </p>
                  <p className="text-sm text-green-600 font-medium">
                    +{dashboardMetrics.economiaGerada.incrementoPercentual}% {dashboardMetrics.economiaGerada.periodo}
                  </p>
                </div>
                {/* <div className="text-3xl">💰</div> */}
              </div>
            </div>

            {/* Campo 4: Empresas Conectadas */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Empresas Conectadas
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardMetrics.empresasConectadas.total}
                  </p>
                  <p className="text-sm text-green-600 font-medium">
                    +{dashboardMetrics.empresasConectadas.novasParcerias} nova parceria
                  </p>
                </div>
                {/* <div className="text-3xl">🤝</div> */}
              </div>
            </div>
          </div>
        )}

        <h1 className="text-2xl pt-4 pb-4 font-bold text-gray-900 mb-4 md:mb-0">
          Resíduos Ofertados
          {residuos.length > 0 && (
            <span className="text-base font-normal text-gray-600 ml-2">
              ({residuos.length} {residuos.length === 1 ? 'resultado' : 'resultados'})
            </span>
          )}
        </h1>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={loadResiduos}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Waste Offers Grid */}
        {!loading && !error && (
          <>
            {residuos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {residuos.map((residuo) => (
                  <div
                    key={residuo.id}
                    className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden transition hover:shadow-md hover:border-teal-200"
                    style={{ minHeight: 320 }}
                  >
                    {/* Imagem do resíduo */}
                    <div className="w-full h-40 bg-gray-200 flex items-center justify-center overflow-hidden rounded-t-2xl">
                      {residuo.imagens.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={residuo.imagens[0].url}
                          alt={residuo.tipoResiduo}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="text-gray-400 text-center p-4">
                          <div className="text-4xl mb-2">📦</div>
                          <span className="text-sm">Sem imagem</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="flex-1 flex flex-col justify-between px-5 py-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                          {residuo.tipoResiduo}
                        </h3>
                        <div className="flex justify-between text-gray-500 text-sm mb-2">
                          <span className="line-clamp-1">{residuo.empresa.nome}</span>
                          <span>{residuo.quantidade} {residuo.unidade.toLowerCase()}</span>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                          {residuo.descricao}
                        </p>
                        <div className="text-xs text-gray-500 mb-2">
                          📍 {residuo.empresa.cidade}, {residuo.empresa.estado}
                        </div>
                      </div>
                      
                      <div className="flex items-end justify-between mt-2">
                        <span className="text-teal-600 font-bold text-base">
                          {formatPrice(residuo.preco, residuo.disponibilidade)}
                        </span>
                        <button
                          className="bg-teal-600 hover:cursor-pointer hover:bg-teal-700 text-white text-xs font-semibold rounded-lg px-4 py-2 shadow transition"
                          onClick={() => handleMakeProposal(residuo)}
                        >
                          Fazer Proposta
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Nenhum resíduo encontrado
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || selectedCity ? 
                    'Tente ajustar os filtros de busca ou limpar a pesquisa.' : 
                    'Ainda não há resíduos cadastrados no sistema.'
                  }
                </p>
                {(searchTerm || selectedCity) && (
                  <button
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedCity("")
                      setCurrentPage(1)
                      loadResiduos()
                    }}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            )}

            {/* Paginação */}
            {residuos.length > 0 && totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg ${
                          currentPage === page
                            ? 'bg-teal-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Modal de Proposta */}
      <ProposalModal
        isOpen={showProposalModal}
        onClose={handleCloseProposalModal}
        offer={selectedResidue ? {
          id: selectedResidue.id,
          company: selectedResidue.empresa.nome,
          wasteType: selectedResidue.tipoResiduo,
          quantity: `${selectedResidue.quantidade} ${selectedResidue.unidade}`,
        } : null}
      />
    </div>
  )
}