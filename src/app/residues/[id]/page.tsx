"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, MapPin, Package, User, Clock, Check, Gift, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { PageTitleProvider } from "../../components/MainLayout"
import { ResiduoService, type Residuo } from "@/services/residuoService"
import { ProposalModal } from "@/app/modals/proposal"

export default function ResidueDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [residuo, setResiduo] = useState<Residuo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  
  // Estados para o modal de proposta
  const [showProposalModal, setShowProposalModal] = useState(false)

  const residueId = params?.id as string

  useEffect(() => {
    if (!residueId) return

    const loadResidue = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await ResiduoService.getResiduoById(parseInt(residueId))
        
        if (response.success && response.data) {
          setResiduo(response.data)
          setCurrentImageIndex(0) // Reset image index when new residue loads
          // Start auto-play if there are multiple images
          setIsAutoPlaying(response.data.imagens && response.data.imagens.length > 1)
        } else {
          setError(response.error || "Resíduo não encontrado")
        }
      } catch (err) {
        console.error("Erro ao carregar resíduo:", err)
        setError("Erro ao carregar detalhes do resíduo")
      } finally {
        setLoading(false)
      }
    }

    loadResidue()
  }, [residueId])

  // Navegação por teclado no carrossel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!residuo?.imagens || residuo.imagens.length <= 1) return
      
      if (e.key === 'ArrowLeft') {
        setIsAutoPlaying(false) // Stop auto-play
        setCurrentImageIndex((prev) => (prev - 1 + residuo.imagens.length) % residuo.imagens.length)
      } else if (e.key === 'ArrowRight') {
        setIsAutoPlaying(false) // Stop auto-play
        setCurrentImageIndex((prev) => (prev + 1) % residuo.imagens.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [residuo?.imagens])

  // Auto-play carrossel (opcional, apenas se mais de uma imagem)
  useEffect(() => {
    if (!residuo?.imagens || residuo.imagens.length <= 1 || !isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % residuo.imagens.length)
    }, 4000) // Change image every 4 seconds

    return () => clearInterval(interval)
  }, [residuo?.imagens, isAutoPlaying])

  // Função para abrir modal de proposta 
  const handleMakeProposal = () => {
    const empresaId = localStorage.getItem("empresaId")
    if (!empresaId) {
      alert("Você precisa estar logado para fazer uma proposta")
      return
    }

    if (!residuo) return

    // Verificar se não é a própria empresa
    if (residuo.empresa.id === parseInt(empresaId)) {
      alert("Você não pode fazer proposta para seu próprio resíduo")
      return
    }

    setShowProposalModal(true)
  }

  // Função para fechar modal 
  const handleCloseProposalModal = () => {
    setShowProposalModal(false)
  }

  // Formatar preço 
  const formatPrice = (preco: string | undefined, disponibilidade: string) => {
    if (disponibilidade === "doacao") return "Gratuito"
    if (disponibilidade === "troca") return "Troca"
    if (!preco || preco === "0") return "Preço não informado"
    return `R$ ${parseFloat(preco).toFixed(2)}`
  }

  // Obter ícone para disponibilidade
  const getAvailabilityIcon = (disponibilidade: string) => {
    switch (disponibilidade.toLowerCase()) {
      case 'venda':
        return <Check className="w-5 h-5 text-teal-600" />
      case 'doacao':
        return <Gift className="w-5 h-5 text-teal-600" />
      case 'troca':
        return <RefreshCw className="w-5 h-5 text-teal-600" />
      default:
        return <Package className="w-5 h-5 text-teal-600" />
    }
  }

  // Funções do carrossel
  const nextImage = () => {
    if (residuo?.imagens && residuo.imagens.length > 1) {
      setIsAutoPlaying(false) // Stop auto-play when user interacts
      setCurrentImageIndex((prev) => (prev + 1) % residuo.imagens.length)
    }
  }

  const prevImage = () => {
    if (residuo?.imagens && residuo.imagens.length > 1) {
      setIsAutoPlaying(false) // Stop auto-play when user interacts
      setCurrentImageIndex((prev) => (prev - 1 + residuo.imagens.length) % residuo.imagens.length)
    }
  }

  const goToImage = (index: number) => {
    setIsAutoPlaying(false) // Stop auto-play when user interacts
    setCurrentImageIndex(index)
  }

  if (loading) {
    return (
      <PageTitleProvider title="Carregando...">
        <div className=" px-12 py-6">
          <div className="max-w-4xl mx-auto">
            {/* Header skeleton */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse"></div>
              <div className="h-8 bg-gray-300 rounded w-48 animate-pulse"></div>
            </div>
            
            {/* Main Content skeleton */}
            <div className="bg-white mt-8 rounded-lg shadow-sm overflow-hidden">
              {/* Hero Section skeleton */}
              <div className="bg-gradient-to-r from-gray-300 to-gray-400 p-6 animate-pulse">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="h-8 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-40"></div>
                    <div className="h-4 bg-gray-200 rounded w-36"></div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="h-10 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>

              {/* Image Banner skeleton */}
              <div className="h-80 bg-gray-200 animate-pulse"></div>

              {/* Content skeleton */}
              <div className="p-6">
                {/* Description skeleton */}
                <div className="mb-8">
                  <div className="h-6 bg-gray-300 rounded w-24 mb-3 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded w-5/6 animate-pulse"></div>
                  </div>
                </div>

                {/* Details Grid skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Informações do Resíduo skeleton */}
                  <div>
                    <div className="h-6 bg-gray-300 rounded w-40 mb-4 animate-pulse"></div>
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Informações da Empresa skeleton */}
                  <div>
                    <div className="h-6 bg-gray-300 rounded w-20 mb-4 animate-pulse"></div>
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-300 rounded w-2/3 animate-pulse"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Button skeleton */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-40 animate-pulse"></div>
                      <div className="h-4 bg-gray-300 rounded w-56 animate-pulse"></div>
                    </div>
                    <div className="h-12 bg-gray-300 rounded-lg w-32 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageTitleProvider>
    )
  }

  if (error || !residuo) {
    return (
      <PageTitleProvider title="Erro">
        <div className="min-h-screen bg-gray-50 ">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <ArrowLeft className="w-5 h-5 text-black" />
              </button>
              <h1 className="text-2xl font-bold text-black">Erro</h1>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-8  text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-black mb-2">
                {error}
              </h2>
              <p className="text-black mb-6">
                O resíduo que você está procurando não foi encontrado ou não existe mais.
              </p>
              <button
                onClick={() => router.push('/feed')}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Voltar ao Feed
              </button>
            </div>
          </div>
        </div>
      </PageTitleProvider>
    )
  }

  return (
    <PageTitleProvider title="Detalhes do resíduo">
      <div className=" px-12 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="w-5 h-5 text-black" />
            </button>
            <h1 className="text-2xl font-bold text-black">Detalhes do Resíduo</h1>
          </div>

          {/* Main Content */}
          <div className="bg-white mt-8 rounded-lg shadow-sm overflow-hidden">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{residuo.tipoResiduo}</h2>
                  <div className="flex items-center gap-2 text-teal-100">
                    <User className="w-4 h-4" />
                    {residuo.empresa && residuo.empresa.id ? (
                      <Link 
                        href={`/user/${residuo.empresa.id}`}
                        className="hover:text-white hover:underline transition-colors cursor-pointer"
                      >
                        {residuo.empresa.nome}
                      </Link>
                    ) : (
                      <span>Empresa não disponível</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-teal-100 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{residuo.empresa.cidade}, {residuo.empresa.estado}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    {formatPrice(residuo.preco, residuo.disponibilidade)}
                  </div>
                  <div className="text-teal-100 text-sm">
                    {residuo.quantidade} {residuo.unidade?.toLowerCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* Image Banner/Carousel */}
            {residuo.imagens && residuo.imagens.length > 0 && (
              <div className="relative h-80 bg-gray-100 overflow-hidden">
                {/* Main Image */}
                <div className="relative w-full h-full">
                  <Image
                    src={residuo.imagens[currentImageIndex]?.url || residuo.imagens[0].url}
                    alt={`Imagem do resíduo ${residuo.tipoResiduo}`}
                    fill
                    className="object-cover"
                    quality={100}
                    priority={true}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-image.jpg';
                    }}
                  />
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                {/* Navigation arrows - only show if more than 1 image */}
                {residuo.imagens.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-105"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-105"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Dots indicator - only show if more than 1 image */}
                {residuo.imagens.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {residuo.imagens.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          index === currentImageIndex 
                            ? 'bg-white scale-125' 
                            : 'bg-white/60 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Image counter */}
                {residuo.imagens.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {residuo.imagens.length}
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {/* Description */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-black mb-3">Descrição</h3>
                <p className="text-black leading-relaxed">{residuo.descricao}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Informações do Resíduo */}
                <div>
                  <h3 className="text-lg font-semibold text-black mb-4">Informações do Resíduo</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-teal-600" />
                      <div>
                        <span className="text-sm text-black">Quantidade:</span>
                        <span className="ml-2 font-medium text-black">{residuo.quantidade} {residuo.unidade?.toLowerCase()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-teal-600" />
                      <div>
                        <span className="text-sm text-black">Condições:</span>
                        <span className="ml-2 font-medium text-black">{residuo.condicoes}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getAvailabilityIcon(residuo.disponibilidade)}
                      <div>
                        <span className="text-sm text-black">Disponibilidade:</span>
                        <span className="ml-2 font-medium text-black capitalize">{residuo.disponibilidade}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informações da Empresa */}
                <div>
                  <h3 className="text-lg font-semibold text-black mb-4">Empresa</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-teal-600" />
                      <div>
                        <span className="text-sm text-black">Nome:</span>
                        <span className="ml-2 font-medium text-black">{residuo.empresa.nome}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-teal-600" />
                      <div>
                        <span className="text-sm text-black">Localização:</span>
                        <span className="ml-2 font-medium text-black">{residuo.empresa.cidade}, {residuo.empresa.estado}</span>
                      </div>
                    </div>

                    {residuo.empresa.email && (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center">
                          <span className="text-white text-xs">@</span>
                        </div>
                        <div>
                          <span className="text-sm text-black">Email:</span>
                          <span className="ml-2 font-medium text-black">{residuo.empresa.email}</span>
                        </div>
                      </div>
                    )}

                    {residuo.empresa.telefone && (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center">
                          <span className="text-white text-xs">📞</span>
                        </div>
                        <div>
                          <span className="text-sm text-black">Telefone:</span>
                          <span className="ml-2 font-medium text-black">{residuo.empresa.telefone}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-black mb-1">Interessado neste resíduo?</p>
                    <p className="text-sm text-black">
                      Faça uma proposta para a empresa{" "}
                      {residuo.empresa && residuo.empresa.id ? (
                        <Link 
                          href={`/user/${residuo.empresa.id}`}
                          className="font-medium text-teal-600 hover:text-teal-700 hover:underline transition-colors"
                        >
                          {residuo.empresa.nome}
                        </Link>
                      ) : (
                        <span className="font-medium text-gray-500">{residuo.empresa?.nome || "não disponível"}</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={handleMakeProposal}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
                  >
                    Fazer Proposta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Proposta */}
      {showProposalModal && residuo && (
        <ProposalModal
          isOpen={showProposalModal}
          onClose={handleCloseProposalModal}
          offer={{
            id: residuo.id,
            company: residuo.empresa.nome,
            wasteType: residuo.tipoResiduo,
            quantity: `${residuo.quantidade} ${residuo.unidade}`,
          }}
        />
      )}
    </PageTitleProvider>
  )
}