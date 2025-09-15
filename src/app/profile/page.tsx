"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { User, Mail, Phone, MapPin, Building, Edit3, Save, X } from "lucide-react"
import { PageTitleProvider } from "../components/MainLayout"

interface UserProfile {
  id: number
  nome: string
  email: string
  telefone: string
  cnpj: string
  rua: string
  numero: string
  cep: string
  cidade: string
  estado: string
  pais: string
  avatarUrl?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const empresaId = localStorage.getItem("empresaId")
        const user = localStorage.getItem("user")
        
        if (!empresaId || !user) {
          setError("Dados de usuário não encontrados. Faça login novamente.")
          return
        }

        // Para demonstração, vamos usar os dados do localStorage
        // Em produção, você faria uma requisição à API para buscar dados completos
        const userData = JSON.parse(user)
        
        // Simular dados completos do perfil
        const mockProfile: UserProfile = {
          id: parseInt(empresaId),
          nome: userData.nome || "Usuário",
          email: userData.email || "usuario@exemplo.com",
          telefone: userData.telefone || "(11) 99999-9999",
          cnpj: userData.cnpj || "12.345.678/0001-90",
          rua: userData.rua || "Rua Exemplo",
          numero: userData.numero || "123",
          cep: userData.cep || "12345-678",
          cidade: userData.cidade || "São Paulo",
          estado: userData.estado || "SP",
          pais: userData.pais || "Brasil",
          avatarUrl: userData.avatarUrl
        }

        setUserProfile(mockProfile)
        setEditedProfile(mockProfile)
      } catch (err) {
        console.error("Erro ao carregar perfil:", err)
        setError("Erro ao carregar dados do perfil")
      } finally {
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedProfile(userProfile)
  }

  const handleSave = async () => {
    if (!editedProfile) return

    setSaving(true)
    try {
      // Aqui você faria a requisição para salvar os dados na API
      // Por enquanto, vamos apenas atualizar o localStorage
      
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}")
      const updatedUser = { ...currentUser, ...editedProfile }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      
      setUserProfile(editedProfile)
      setIsEditing(false)
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (err) {
      console.error("Erro ao salvar perfil:", err)
      setError("Erro ao salvar alterações")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    if (!editedProfile) return
    setEditedProfile({ ...editedProfile, [field]: value })
  }

  if (loading) {
    return (
      <PageTitleProvider title="Perfil">
        <div className="px-12 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="animate-pulse">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-20 h-20 bg-gray-300 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-300 rounded w-48"></div>
                    <div className="h-4 bg-gray-300 rounded w-32"></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-24"></div>
                      <div className="h-10 bg-gray-300 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageTitleProvider>
    )
  }

  if (error || !userProfile) {
    return (
      <PageTitleProvider title="Perfil">
        <div className="px-12 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                {error || "Perfil não encontrado"}
              </h2>
              <p className="text-gray-500 mb-6">
                Não foi possível carregar os dados do seu perfil.
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
    <PageTitleProvider title="Perfil">
      <div className="px-12 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                {userProfile.avatarUrl ? (
                  <Image 
                    src={userProfile.avatarUrl} 
                    alt={userProfile.nome} 
                    width={80} 
                    height={80} 
                    className="object-cover w-full h-full" 
                  />
                ) : (
                  userProfile.nome.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{userProfile.nome}</h1>
                <p className="text-gray-600">{userProfile.email}</p>
              </div>
            </div>
            
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Editar Perfil
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            )}
          </div>

          {/* Profile Content */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Informações Pessoais</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Nome Completo
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile?.nome || ""}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{userProfile.nome}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  E-mail
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedProfile?.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{userProfile.email}</p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Telefone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedProfile?.telefone || ""}
                    onChange={(e) => handleInputChange("telefone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{userProfile.telefone}</p>
                )}
              </div>

              {/* CNPJ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="w-4 h-4 inline mr-2" />
                  CNPJ
                </label>
                <p className="text-gray-900 py-2">{userProfile.cnpj}</p>
                {isEditing && (
                  <p className="text-xs text-gray-500 mt-1">CNPJ não pode ser alterado</p>
                )}
              </div>

              {/* CEP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  CEP
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile?.cep || ""}
                    onChange={(e) => handleInputChange("cep", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{userProfile.cep}</p>
                )}
              </div>

              {/* Rua */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rua
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile?.rua || ""}
                    onChange={(e) => handleInputChange("rua", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{userProfile.rua}</p>
                )}
              </div>

              {/* Número */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile?.numero || ""}
                    onChange={(e) => handleInputChange("numero", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{userProfile.numero}</p>
                )}
              </div>

              {/* Cidade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile?.cidade || ""}
                    onChange={(e) => handleInputChange("cidade", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{userProfile.cidade}</p>
                )}
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile?.estado || ""}
                    onChange={(e) => handleInputChange("estado", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{userProfile.estado}</p>
                )}
              </div>

              {/* País */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile?.pais || ""}
                    onChange={(e) => handleInputChange("pais", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{userProfile.pais}</p>
                )}
              </div>
            </div>

            {/* Endereço Completo */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço Completo</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900">
                  {userProfile.rua}, {userProfile.numero} - {userProfile.cidade}, {userProfile.estado}
                </p>
                <p className="text-gray-600">
                  CEP: {userProfile.cep} - {userProfile.pais}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTitleProvider>
  )
}