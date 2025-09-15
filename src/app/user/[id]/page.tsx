"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Building2, 
  Globe, 
  Package,
  Calendar,
  ArrowLeft
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { PageTitleProvider } from "@/app/components/MainLayout"

interface PublicProfile {
  id: number
  nome: string
  email: string
  telefone?: string
  avatar?: string
  empresa: {
    id: number
    nome: string
    cnpj: string
    endereco: string
    cidade: string
    estado: string
    cep: string
    telefone?: string
    email?: string
    website?: string
    descricao?: string
    setor: string
  }
  dataCriacao: string
  totalResiduos: number
  residuosAtivos: number
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params?.id as string
  
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!userId) {
        throw new Error("ID do usuário não fornecido")
      }

      // Verificar se o ID é um número válido
      const numericId = parseInt(userId)
      if (isNaN(numericId) || numericId <= 0) {
        throw new Error("ID do usuário inválido")
      }

      const response = await fetch(`/actions/api/user/public-profile/${userId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar perfil")
      }

      setProfile(data.profile)
    } catch (error) {
      console.error("Erro ao carregar perfil:", error)
      setError(error instanceof Error ? error.message : "Erro ao carregar perfil")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadProfile()
    } else {
      setError("ID do usuário não fornecido")
      setLoading(false)
    }
  }, [userId, loadProfile])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <PageTitleProvider title="Carregando perfil...">
        <div className="min-h-screen mt-8">
          <div className="max-w-7xl mx-auto px-12 py-12 bg-white border rounded-xl">
            {/* Header Skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 mb-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3"></div>
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                </div>
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-5 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-5 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageTitleProvider>
    )
  }

  if (error) {
    return (
      <PageTitleProvider title="Erro">
        <div className="min-h-screen mt-8">
          <div className="max-w-7xl mx-auto px-12 py-12 bg-white border rounded-xl">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-black mb-2">Perfil não encontrado</h1>
              <p className="text-[#5B5858] mb-6">{error}</p>
              <button
                onClick={() => router.back()}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      </PageTitleProvider>
    )
  }

  if (!profile) {
    return (
      <PageTitleProvider title="Perfil não encontrado">
        <div className="min-h-screen mt-8">
          <div className="max-w-7xl mx-auto px-12 py-12 bg-white border rounded-xl">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h1 className="text-2xl font-bold text-black mb-2">Perfil não encontrado</h1>
              <p className="text-[#5B5858] mb-6">O usuário solicitado não existe ou foi removido.</p>
              <button
                onClick={() => router.back()}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      </PageTitleProvider>
    )
  }

  return (
    <PageTitleProvider title={`Perfil de ${profile.nome}`}>
      <div className="min-h-screen mt-8">
        <div className="max-w-7xl mx-auto px-12 py-12 bg-white border rounded-xl">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                {profile.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={`Foto de ${profile.nome}`}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full object-cover border-4 border-teal-100"
                  />
                ) : (
                  <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center border-4 border-teal-200">
                    <User className="w-12 h-12 text-teal-600" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold text-black mb-2">{profile.nome}</h1>
                <p className="text-lg text-[#5B5858] mb-2">{profile.empresa.nome}</p>
                <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-[#5B5858]">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.empresa.cidade}, {profile.empresa.estado}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Membro desde {formatDate(profile.dataCriacao)}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-teal-600">{profile.totalResiduos}</p>
                  <p className="text-sm text-[#5B5858]">Resíduos Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{profile.residuosAtivos}</p>
                  <p className="text-sm text-[#5B5858]">Ativos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-teal-600" />
                Informações de Contato
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <Mail className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-[#5B5858]">Email</p>
                    <p className="font-medium text-black">{profile.email}</p>
                  </div>
                </div>

                {profile.telefone && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      <Phone className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-[#5B5858]">Telefone</p>
                      <p className="font-medium text-black">{profile.telefone}</p>
                    </div>
                  </div>
                )}

                {profile.empresa.telefone && profile.empresa.telefone !== profile.telefone && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-[#5B5858]">Telefone da Empresa</p>
                      <p className="font-medium text-black">{profile.empresa.telefone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                Informações da Empresa
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[#5B5858]">Nome da Empresa</p>
                  <p className="font-medium text-black">{profile.empresa.nome}</p>
                </div>

                <div>
                  <p className="text-sm text-[#5B5858]">Setor</p>
                  <p className="font-medium text-black">{profile.empresa.setor}</p>
                </div>

                <div>
                  <p className="text-sm text-[#5B5858]">CNPJ</p>
                  <p className="font-medium text-black">{profile.empresa.cnpj}</p>
                </div>

                <div>
                  <p className="text-sm text-[#5B5858]">Endereço</p>
                  <p className="font-medium text-black">{profile.empresa.endereco}</p>
                  <p className="text-sm text-[#5B5858]">{profile.empresa.cidade}, {profile.empresa.estado} - {profile.empresa.cep}</p>
                </div>

                {profile.empresa.website && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      <Globe className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-[#5B5858]">Website</p>
                      <a
                        href={profile.empresa.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-teal-600 hover:text-teal-700 transition-colors"
                      >
                        {profile.empresa.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Company Description */}
          {profile.empresa.descricao && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mt-6">
              <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-600" />
                Sobre a Empresa
              </h2>
              <p className="text-[#5B5858] leading-relaxed">{profile.empresa.descricao}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-black">Interessado em fazer negócios?</h3>
                <p className="text-[#5B5858]">Entre em contato com {profile.nome} através dos dados acima.</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/feed?empresa=${profile.empresa.id}`}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Ver Resíduos
                </Link>
                {profile.empresa.email && (
                  <a
                    href={`mailto:${profile.empresa.email}`}
                    className="bg-gray-100 hover:bg-gray-200 text-[#5B5858] px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Enviar Email
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTitleProvider>
  )
}
