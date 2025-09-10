"use client"
import { useEffect, useState } from "react"
import { fetchJsonWithTimeout } from "@/lib/fetchWithTimeout"
import { getCache, setCache } from "@/lib/cache"
import { Trash2, Pencil, Plus, Eye, Filter, X } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface MyOffer {
  id: string
  tipoResiduo: string
  descricao: string
  quantidade: number
  unidade: string
  condicoes: string
  disponibilidade: string
  preco?: string
  imagens: { id: string; url: string }[]
  empresa: string
  propostas: number
  propostasPendentes: number
}

export default function MyOffersPage() {
  const [offers, setOffers] = useState<MyOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // 🆕 NOVOS ESTADOS PARA OS FILTROS
  const [filtroTipo, setFiltroTipo] = useState<string>("")
  const [filtroStatus, setFiltroStatus] = useState<string>("")
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    loadMyOffers()
  }, [])

  const loadMyOffers = async () => {
    try {
      setError(null)
      const empresaId = localStorage.getItem("empresaId")
      if (!empresaId) {
        setError("ID da empresa não encontrado. Faça login novamente.")
        setOffers([])
        setLoading(false)
        return
      }

      console.log("Fazendo requisição para empresaId:", empresaId)
      const cacheKey = `my_offers_${empresaId}`
  let data: unknown = null
      try {
        data = await fetchJsonWithTimeout(`/actions/api/residues/my-residues?empresaId=${empresaId}`, { timeout: 8000, retries: 2 })
        setCache(cacheKey, data)
        console.log("Response data received, processing...")
      } catch (err) {
        console.warn('Falha ao buscar ofertas, tentando cache...', err)
        const cached = getCache<unknown>(cacheKey)
        if (
          cached &&
          (Array.isArray(cached.value) ||
            (cached.value &&
              typeof cached.value === 'object' &&
              Array.isArray((cached.value as Record<string, unknown>).data)))
        ) {
          data = Array.isArray(cached.value)
            ? cached.value
            : (cached.value as Record<string, unknown>).data
          console.log('Usando cache para ofertas')
        } else {
          throw err
        }
      }

      // Normalize data shape into offers array or error
      if (data && typeof data === 'object') {
        const d = data as Record<string, unknown>
        // empty object check
        if (Object.keys(d).length === 0) {
          console.warn("Received empty object from API")
          setError("A API retornou uma resposta vazia. Verifique se o endpoint está funcionando corretamente.")
          setOffers([])
          return
        }

        if (d.success && Array.isArray(d.data)) {
          const arr = d.data as unknown as MyOffer[]
          const processedOffers = arr.map((offer: MyOffer) => ({
            ...offer,
            imagens: offer.imagens.filter(img => {
              if (!img.url || img.url.trim() === '') {
                console.warn(`Imagem vazia encontrada no resíduo ${offer.id}`)
                return false
              }
              if (img.url.startsWith('data:image/')) {
                const base64Part = img.url.split(',')[1]
                if (!base64Part || base64Part.length < 100) {
                  console.warn(`Base64 muito curto no resíduo ${offer.id}:`, img.url.substring(0, 100))
                  return false
                }
              }
              return true
            })
          }))
          console.log(`✅ Processadas ${processedOffers.length} ofertas com imagens válidas`)
          setOffers(processedOffers)
          return
        }
      }

      if (Array.isArray(data)) {
        console.log("Data is directly an array, using as offers")
        setOffers(data as MyOffer[])
      } else {
        const d = (data && typeof data === 'object') ? data as Record<string, unknown> : undefined
        const errorMessage = d ? (String(d.error ?? d.message) || `Formato de resposta inesperado.`) : `Formato de resposta inesperado.`
        console.error("Erro ao carregar ofertas:", errorMessage)
        setError(errorMessage)
        setOffers([])
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro de conexão"
      console.error("Erro ao carregar ofertas:", error)
      setError(`Erro de conexão: ${errorMessage}`)
      setOffers([])
    } finally {
      setLoading(false)
    }
  }

  // 🆕 FUNÇÃO PARA OBTER TIPOS ÚNICOS DOS RESÍDUOS
  const getTiposUnicos = () => {
    const tipos = offers.map(offer => offer.tipoResiduo)
    return [...new Set(tipos)].sort()
  }

  // 🆕 FUNÇÃO PARA OBTER STATUS ÚNICOS (baseado na disponibilidade)
  const getStatusUnicos = () => {
    const status = offers.map(offer => offer.disponibilidade)
    return [...new Set(status)].sort()
  }

  // 🆕 FUNÇÃO PARA FILTRAR AS OFERTAS
  const getOfertasFiltradas = () => {
    let ofertasFiltradas = offers

    // Filtro por tipo
    if (filtroTipo && filtroTipo !== "") {
      ofertasFiltradas = ofertasFiltradas.filter(offer => 
        offer.tipoResiduo === filtroTipo
      )
    }

    // Filtro por status (disponibilidade)
    if (filtroStatus && filtroStatus !== "") {
      ofertasFiltradas = ofertasFiltradas.filter(offer => 
        offer.disponibilidade === filtroStatus
      )
    }

    return ofertasFiltradas
  }

  // 🆕 FUNÇÃO PARA LIMPAR TODOS OS FILTROS
  const limparFiltros = () => {
    setFiltroTipo("")
    setFiltroStatus("")
  }

  // 🆕 VERIFICAR SE HÁ FILTROS ATIVOS
  const temFiltrosAtivos = filtroTipo !== "" || filtroStatus !== ""


  // 🆕 USAR AS OFERTAS FILTRADAS EM VEZ DAS OFERTAS ORIGINAIS
  const ofertasFiltradas = getOfertasFiltradas()

  const handleDelete = async (offerId: string) => {
    const empresaId = localStorage.getItem("empresaId")
    if (!empresaId) return

    if (!window.confirm("Tem certeza que deseja excluir este resíduo?")) return

    setDeletingId(offerId)

    try {
      const response = await fetch("/actions/api/residues/delete-residue", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ residueId: offerId, empresaId }),
      })

      if (response.ok) {
        setOffers(prev => prev.filter(o => o.id !== offerId))
        alert("Resíduo excluído com sucesso!")
      } else {
        const error = await response.json()
        alert(error.error || "Erro ao excluir resíduo.")
      }
    } catch (error) {
      console.error("Erro ao excluir resíduo:", error)
      alert("Erro ao excluir resíduo.")
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (offerId: string) => {
    router.push(`/edit-residues/${offerId}`)
  }

  const handleViewProposals = (offerId: string) => {
    router.push(`/proposals/received?residueId=${offerId}`)
  }

  const formatPrice = (preco?: string, disponibilidade?: string) => {
    if (disponibilidade === "doacao") return "Gratuito"
    if (disponibilidade === "retirada") return "Retirada no Local"
    return preco ? `R$ ${preco}` : "Sob consulta"
  }

  const getAvailabilityColor = (disponibilidade: string) => {
    switch (disponibilidade) {
      case "venda":
        return "text-green-600 bg-green-50"
      case "doacao":
        return "text-blue-600 bg-blue-50"
      case "retirada":
        return "text-orange-600 bg-orange-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getAvailabilityText = (disponibilidade: string) => {
    switch (disponibilidade) {
      case "venda":
        return "À venda"
      case "doacao":
        return "Doação"
      case "retirada":
        return "Retirada"
      default:
        return disponibilidade
    }
  }

  // Componente de imagem com fallback melhorado
  const ImageWithFallback = ({ offer }: { offer: MyOffer }) => {
    const [imageError, setImageError] = useState(false)

    const hasValidImage = offer.imagens && offer.imagens.length > 0 && offer.imagens[0].url

    if (!hasValidImage || imageError) {
      return (
        <div className="text-gray-400 text-center p-4 w-full h-full flex flex-col items-center justify-center">
          <div className="text-4xl mb-2">📦</div>
          <span className="text-sm">
            {imageError ? "Erro ao carregar imagem" : "Sem imagem"}
          </span>
        </div>
      )
    }

    const imageUrl = offer.imagens[0].url

    return (
      <Image
        src={imageUrl}
        alt={offer.tipoResiduo}
        width={400}
        height={160}
        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        onLoadingComplete={() => {
          console.log(`✅ Imagem carregada para resíduo ${offer.id}`)
        }}
        onError={() => {
          console.error(`❌ Erro ao carregar imagem do resíduo ${offer.id}:`, {
            url: imageUrl ? imageUrl.substring(0, 100) + '...' : 'URL não disponível',
            urlLength: imageUrl ? imageUrl.length : 0,
            hasImages: offer.imagens ? offer.imagens.length : 0
          })
          setImageError(true)
        }}
        loading="lazy"
        unoptimized={imageUrl.startsWith('data:image/')}
      />
    )
  }

  return (
    <div className="min-h-screen mt-8">
      <div className="max-w-7xl mx-auto px-12 py-12 bg-white border rounded-xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <p className="text-gray-600">
              Gerencie seus resíduos cadastrados e visualize propostas recebidas
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                temFiltrosAtivos || mostrarFiltros
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filtros
              {temFiltrosAtivos && (
                <span className="bg-white text-blue-600 text-xs rounded-full px-2 py-1 font-bold">
                  {(filtroTipo ? 1 : 0) + (filtroStatus ? 1 : 0)}
                </span>
              )}
            </button>
            
            <button
              onClick={() => router.push("/residues/register")}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nova Oferta
            </button>
          </div>
        </div>

        {/* 🆕 SEÇÃO DE FILTROS */}
        {mostrarFiltros && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Filtrar ofertas</h3>
              {temFiltrosAtivos && (
                <button
                  onClick={limparFiltros}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Limpar filtros
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtro por Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Resíduo
                </label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
                  style={{ color: '#111827' }}
                >
                  <option value="" style={{ color: '#6b7280' }}>Todos os tipos</option>
                  {getTiposUnicos().map(tipo => (
                    <option key={tipo} value={tipo} style={{ color: '#111827', backgroundColor: '#ffffff' }}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
                  style={{ color: '#111827' }}
                >
                  <option value="" style={{ color: '#6b7280' }}>Todos os status</option>
                  {getStatusUnicos().map(status => (
                    <option key={status} value={status} style={{ color: '#111827', backgroundColor: '#ffffff' }}>
                      {getAvailabilityText(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Loading: skeleton cards matching real card proportions */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-teal-300 hover:-translate-y-1"
                style={{ minHeight: 420 }}
              >
                {/* image placeholder */}
                <div className="relative w-full h-40 bg-gray-200 flex items-center justify-center overflow-hidden animate-pulse">
                  <div className="w-full h-full bg-gray-100" />
                </div>

                {/* content placeholder */}
                <div className="flex-1 flex flex-col p-4">
                  <div className="mb-3">
                    <div className="h-6 bg-gray-100 rounded w-3/4 mb-1 animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded w-full mb-2 animate-pulse" />
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="h-3 bg-gray-100 rounded w-3/4 mb-1 animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
                      </div>
                      <div>
                        <div className="h-3 bg-gray-100 rounded w-3/4 mb-1 animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
                      <div className="h-3 bg-gray-100 rounded w-1/3 animate-pulse" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-100 rounded-full animate-pulse" />
                        <div className="h-3 bg-gray-100 rounded w-1/4 animate-pulse" />
                      </div>
                      <div className="h-3 bg-gray-100 rounded w-1/6 animate-pulse" />
                    </div>
                  </div>

                  <div className="text-center mb-4 py-2">
                    <div className="h-8 bg-gray-100 rounded w-1/2 mx-auto animate-pulse" />
                  </div>

                  <div className="mt-auto space-y-2">
                    <div className="h-12 bg-gray-100 rounded-lg w-full animate-pulse" />
                    <div className="h-12 bg-gray-100 rounded-lg w-full animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Erro ao carregar ofertas
            </h3>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
            <button
              onClick={loadMyOffers}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && offers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma oferta cadastrada
            </h3>
            <p className="text-gray-600 mb-4">
              Comece publicando sua primeira oferta de resíduo
            </p>
            <button
              onClick={() => router.push("/residues/register")}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              Publicar Primeira Oferta
            </button>
          </div>
        )}

        {/* 🆕 ESTADO VAZIO PARA FILTROS SEM RESULTADOS */}
        {!loading && !error && offers.length > 0 && ofertasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                <Filter className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma oferta encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              Não há ofertas que correspondam aos filtros selecionados
            </p>
            <button
              onClick={limparFiltros}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              Limpar Filtros
            </button>
          </div>
        )}

        {/* Offers Grid */}
        {!loading && !error && ofertasFiltradas.length > 0 && (
          <>
            <div className="mb-4 text-sm text-gray-600 flex items-center justify-between">
              <span>
                {/* 🆕 MOSTRAR CONTAGEM FILTRADA */}
                {temFiltrosAtivos ? (
                  <>
                    {ofertasFiltradas.length} de {offers.length} {ofertasFiltradas.length === 1 ? 'oferta encontrada' : 'ofertas encontradas'}
                  </>
                ) : (
                  <>
                    {offers.length} {offers.length === 1 ? 'oferta cadastrada' : 'ofertas cadastradas'}
                  </>
                )}
              </span>
              
              {/* 🆕 INDICADOR DE FILTROS ATIVOS */}
              {temFiltrosAtivos && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Filtros ativos:</span>
                  {filtroTipo && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Tipo: {filtroTipo}
                    </span>
                  )}
                  {filtroStatus && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Status: {getAvailabilityText(filtroStatus)}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 🆕 USAR ofertasFiltradas EM VEZ DE offers */}
              {ofertasFiltradas.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-teal-300 hover:-translate-y-1"
                  style={{ minHeight: 420 }}
                >
                  {/* Image */}
                  <div className="relative w-full h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                    <ImageWithFallback offer={offer} />

                    {/* Edit button */}
                    <button
                      onClick={() => handleEdit(offer.id)}
                      className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white border border-gray-200 transition-all duration-200 hover:scale-105"
                      title="Editar resíduo"
                    >
                      <Pencil className="w-4 h-4 text-teal-600" />
                    </button>

                    {/* Status badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${getAvailabilityColor(offer.disponibilidade)}`}>
                        {getAvailabilityText(offer.disponibilidade)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col p-4">
                    {/* Header */}
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                        {offer.tipoResiduo}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {offer.descricao}
                      </p>
                    </div>

                    {/* Details section */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500 block text-xs mb-1">Quantidade</span>
                          <span className="font-semibold text-gray-800">{offer.quantidade} {offer.unidade}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-xs mb-1">Condições</span>
                          <span className="font-semibold text-gray-800 line-clamp-1">{offer.condicoes}</span>
                        </div>
                      </div>
                    </div>

                    {/* Images and proposals info */}
                    <div className="space-y-2 mb-4">
                      {/* Image count indicator */}
                      {offer.imagens && offer.imagens.length > 1 && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <Eye className="w-3 h-3 text-gray-500" />
                          </div>
                          <span className="text-xs text-gray-600">
                            +{offer.imagens.length - 1} imagem{offer.imagens.length > 2 ? 's' : ''}
                          </span>
                        </div>
                      )}

                      {/* Proposals counter */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center">
                            <Eye className="w-3 h-3 text-teal-600" />
                          </div>
                          <span className="text-sm text-gray-700">
                            {offer.propostas} {offer.propostas === 1 ? 'proposta' : 'propostas'}
                          </span>
                        </div>
                        
                        {offer.propostasPendentes > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                            <span className="text-sm font-medium text-amber-600">
                              {offer.propostasPendentes} pendente{offer.propostasPendentes > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-center mb-4 py-2">
                      <span className="text-teal-600 font-bold text-xl">
                        {formatPrice(offer.preco, offer.disponibilidade)}
                      </span>
                    </div>

                    {/* Actions - Layout aprimorado */}
                    <div className="mt-auto space-y-2">
                      <button
                        onClick={() => handleViewProposals(offer.id)}
                        className={`w-full text-sm font-medium rounded-lg px-4 py-3 transition-all duration-200 flex items-center justify-center gap-2 relative ${
                          offer.propostasPendentes > 0
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                            : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        Ver Propostas
                        {offer.propostasPendentes > 0 && (
                          <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                            {offer.propostasPendentes}
                          </span>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleDelete(offer.id)}
                        disabled={deletingId === offer.id}
                        className="w-full bg-gray-50 text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 text-sm font-medium rounded-lg px-4 py-2 transition-all duration-200 flex items-center justify-center gap-2"
                        title="Excluir resíduo"
                      >
                        {deletingId === offer.id ? (
                          <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}