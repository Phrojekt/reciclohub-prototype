"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"

interface ResidueFormData {
  descricao: string
  quantidade: number
  unidade: string
  preco: string
  tipoResiduo: string
  condicoes: string
  disponibilidade: string
  imagens?: string[]
}

export default function EditResiduePage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params as { id: string }

  const [formData, setFormData] = useState<ResidueFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Buscar dados do resíduo pelo id
    fetch(`/actions/api/residues/consult-residue?id=${id}`)
      .then(res => res.json())
      .then(data => {
        setFormData({
          descricao: data.descricao || "",
          quantidade: data.quantidade || 0,
          unidade: data.unidade || "",
          preco: data.preco || "",
          tipoResiduo: data.tipoResiduo || "",
          condicoes: data.condicoes || "",
          disponibilidade: data.disponibilidade || "",
          imagens: data.imagens || [],
        })
        setLoading(false)
      })
      .catch(() => {
        setError("Erro ao carregar resíduo.")
        setLoading(false)
      })
  }, [id])

  const handleChange = (field: keyof ResidueFormData, value: string | number) => {
    if (!formData) return
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null
    if (!userId) {
      setError("Usuário não autenticado.")
      setSaving(false)
      return
    }
    const updateData = { ...formData }
    try {
      const res = await fetch("/actions/api/residues/edit-residues", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ residueId: id, userId, updateData }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || "Erro ao salvar.")
        setSaving(false)
        return
      }
      router.push("/my-offers")
    } catch {
      setError("Erro ao salvar.")
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-12">Carregando...</div>
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>
  if (!formData) return <div className="text-center py-12">Resíduo não encontrado.</div>

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar Resíduo</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Resíduo</label>
            <input
              type="text"
              value={formData.tipoResiduo}
              onChange={e => handleChange("tipoResiduo", e.target.value)}
              className="w-full px-4 py-3 border-2 border-teal-400 rounded-lg focus:border-teal-600 focus:ring-0 bg-white text-gray-900 placeholder-gray-400"
              placeholder="Tipo de resíduo"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={formData.descricao}
              onChange={e => handleChange("descricao", e.target.value)}
              className="w-full px-4 py-3 border-2 border-teal-400 rounded-lg focus:border-teal-600 focus:ring-0 bg-white text-gray-900 placeholder-gray-400 h-24 resize-none"
              placeholder="Descrição do resíduo"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
            <input
              type="number"
              value={formData.quantidade}
              onChange={e => handleChange("quantidade", Number(e.target.value))}
              className="w-full px-4 py-3 border-2 border-teal-400 rounded-lg focus:border-teal-600 focus:ring-0 bg-white text-gray-900 placeholder-gray-400"
              placeholder="Quantidade"
              required
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
            <input
              type="text"
              value={formData.unidade}
              onChange={e => handleChange("unidade", e.target.value)}
              className="w-full px-4 py-3 border-2 border-teal-400 rounded-lg focus:border-teal-600 focus:ring-0 bg-white text-gray-900 placeholder-gray-400"
              placeholder="Ex: kg, tonelada"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condições</label>
            <textarea
              value={formData.condicoes}
              onChange={e => handleChange("condicoes", e.target.value)}
              className="w-full px-4 py-3 border-2 border-teal-400 rounded-lg focus:border-teal-600 focus:ring-0 bg-white text-gray-900 placeholder-gray-400 h-20 resize-none"
              placeholder="Condições de armazenamento"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Disponibilidade</label>
            <select
              value={formData.disponibilidade}
              onChange={e => handleChange("disponibilidade", e.target.value)}
              className="w-full px-4 py-3 border-2 border-teal-400 rounded-lg focus:border-teal-600 focus:ring-0 bg-white text-gray-900"
              required
            >
              <option value="">Selecione</option>
              <option value="venda">Venda</option>
              <option value="doacao">Doação</option>
              <option value="retirada">Retirada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço</label>
            <input
              type="text"
              value={formData.preco}
              onChange={e => handleChange("preco", e.target.value)}
              className="w-full px-4 py-3 border-2 border-teal-400 rounded-lg focus:border-teal-600 focus:ring-0 bg-white text-gray-900 placeholder-gray-400"
              placeholder="Ex: R$ 1,80/kg"
              disabled={formData.disponibilidade !== "venda"}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-base"
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </form>
      </div>
    </div>
  )
}