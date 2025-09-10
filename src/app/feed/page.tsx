"use client"
import { Search } from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"
import { getSocket, onDataUpdated } from "@/lib/socket"
import { getCache, setCache, isStale } from "@/lib/cache"
import { ResiduoService, type Residuo } from "@/services/residuoService"
import { ProposalModal } from "@/app/modals/proposal"


let socket: ReturnType<typeof getSocket> | null = null

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
  // Simple in-memory cache reference to avoid repeated parsing
  const cacheKey = "recicloh_residuos_cache_v1"
  const inMemoryCacheRef = useRef<Residuo[] | null>(null)

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
    // Try to hydrate from cache first and revalidate in background
    try {
      const cached = getCache<Residuo[]>(cacheKey)
      if (cached && cached.value) {
        inMemoryCacheRef.current = cached.value
        setResiduos(cached.value.slice((currentPage - 1) * 9, currentPage * 9))
        setLoading(false)
        // Background revalidate if stale (>30s)
        if (isStale(cacheKey, 30 * 1000)) {
          loadResiduos()
        }
      } else {
        loadResiduos()
      }
    } catch {
      // Fallback to network
      loadResiduos()
    }

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
    // initialize socket singleton
    if (!socket) socket = getSocket()

    // Subscribe via helper
  const unsub = onDataUpdated((event) => {
      if (!event || event.resource !== "residuo") return
      const { action, payload } = event as { resource: string; action: string; id?: number; payload?: unknown }

      if (action === "created" && payload && typeof payload === "object" && 'id' in (payload as Record<string, unknown>)) {
        const residuoPayload = payload as Residuo
        setResiduos(prev => {
          if (prev.some(r => r.id === residuoPayload.id)) return prev
          if (currentPage === 1) {
            const nova = [residuoPayload, ...prev].slice(0, 9)
            // update caches
            try {
              const full = (inMemoryCacheRef.current || [])
              full.unshift(residuoPayload)
              inMemoryCacheRef.current = full
              setCache(cacheKey, full)
            } catch {}
            return nova
          }
          return prev
        })
      }

      if (action === "deleted" && event.id) {
        setResiduos(prev => {
          const filtered = prev.filter(r => r.id !== event.id)
          try {
            if (inMemoryCacheRef.current) {
              inMemoryCacheRef.current = inMemoryCacheRef.current.filter(r => r.id !== (event.id || 0))
              setCache(cacheKey, inMemoryCacheRef.current)
            }
          } catch {}
          return filtered
        })
      }
    })

  return () => { if (unsub) { unsub() } }

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
    <div className="min-h-screen mt-8">
      {/* Título da página */}
      <div className="max-w-7xl mx-auto px-12 py-12 bg-white border rounded-xl">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por empresa ou material..."
              className="pl-10 bg-white border  text-gray-900 border-[#00A2AA]/50 h-12 rounded w-full focus:border-[#00A2AA]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="w-full md:w-64">
            <select
              className="bg-white border text-gray-900 cursor-pointer border-[#00A2AA]/50 h-12 rounded w-full px-3 focus:border-[#00A2AA]"
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
            className="bg-teal-600 cursor-pointer hover:bg-teal-700 text-white px-6 h-12 rounded font-medium transition-colors"
          >
            Buscar
          </button>
        </div>

        {/* ========================================
            NOVO: Dashboard de Métricas
            ======================================== */}
        

        <h1 className="text-2xl pt-4 pb-4 font-bold text-gray-900 mb-4 md:mb-0">
          Resíduos Ofertados
          {residuos.length > 0 && (
            <span className="text-base font-normal text-gray-600 ml-2">
              ({residuos.length} {residuos.length === 1 ? 'resultado' : 'resultados'})
            </span>
          )}
        </h1>

        {/* Loading state: skeleton cards with centered green spinner */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden transition hover:shadow-md hover:border-teal-200"
                style={{ minHeight: 320 }}
              >
                {/* imagem placeholder - mantém h-40 */}
                <div className="w-full h-40 bg-gray-200 flex items-center justify-center overflow-hidden rounded-t-2xl animate-pulse">
                  <div className="w-full h-full bg-gray-200" />
                </div>

                {/* conteúdo placeholder com proporções similares ao conteúdo real */}
                <div className="flex-1 flex flex-col justify-between px-5 py-4">
                  <div>
                    {/* título - corresponde a text-lg font-bold mb-1 */}
                    <div className="h-5 bg-gray-100 rounded w-3/4 mb-1 animate-pulse" />

                    {/* empresa + quantidade (linha) - text-sm spacing */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                      <div className="h-3 bg-gray-100 rounded w-1/4 animate-pulse" />
                    </div>

                    {/* descrição: duas linhas (text-sm) */}
                    <div className="h-3 bg-gray-100 rounded w-full mb-2 animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded w-5/6 mb-2 animate-pulse" />

                    {/* local (cidade/estado) - text-xs */}
                    <div className="h-3 bg-gray-100 rounded w-1/3 mb-1 animate-pulse" />
                  </div>

                  {/* footer: preço + botão */}
                  <div className="flex items-end justify-between mt-2">
                    <div className="h-6 bg-gray-100 rounded w-32 animate-pulse" />
                    <div className="h-9 w-28 rounded-lg bg-gray-100 animate-pulse" />
                  </div>
                </div>

                {/* card skeleton only - no spinner overlay */}
              </div>
            ))}
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