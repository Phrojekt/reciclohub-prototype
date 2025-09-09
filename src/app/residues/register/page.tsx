"use client"

import React, { useState } from "react"
import { X, Camera, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CadastrarResiduoPage() {
  const router = useRouter()
  const [residuoData, setResiduoData] = useState({
    tipoResiduo: "",
    descricao: "",
    quantidade: "",
    unidade: "Quilograma por Mês",
    condicoes: "",
    disponibilidade: "",
    preco: "",
    abertoNegociacao: false, // Novo campo adicionado conforme solicitado
    imagens: [] as File[],
  })
  const [dragActive, setDragActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [processingImages, setProcessingImages] = useState(false)
  const [imageProcessingProgress, setImageProcessingProgress] = useState({ current: 0, total: 0 })

  const tiposResiduos = [
    "Plástico PET",
    "Plástico PEAD",
    "Plástico PVC",
    "Plástico PEBD",
    "Plástico PP",
    "Plástico PS",
    "Papel e Papelão",
    "Metal Ferroso",
    "Metal Não-Ferroso",
    "Vidro",
    "Madeira",
    "Têxtil",
    "Eletrônicos",
    "Orgânico",
    "Outros",
  ]

  const unidades = [
    "Quilograma por Mês",
    "Tonelada por Mês",
    "Quilograma por Semana",
    "Tonelada por Semana",
    "Quilograma por Dia",
    "Unidades por Mês",
  ]

  const handleInputChange = (field: string, value: string | boolean) => {
    setResiduoData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (files: FileList | null) => {
    if (files && files.length > 0) {
      const filesArray = Array.from(files)
      const availableSlots = 5 - residuoData.imagens.length
      const filesToProcess = filesArray.slice(0, availableSlots)

      if (filesToProcess.length === 0) return

      setProcessingImages(true)
      setImageProcessingProgress({ current: 0, total: filesToProcess.length })

      const processedImages: File[] = []

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i]
        setImageProcessingProgress({ current: i + 1, total: filesToProcess.length })

        // Verificar se Ã© uma imagem
        if (!file.type.startsWith('image/')) {
          alert(`Arquivo "${file.name}" não é uma imagem válida`)
          continue
        }

        try {
          // Processar a imagem (otimizar/comprimir se necessÃ¡rio)
          const processedFile = await optimizeImage(file)
          processedImages.push(processedFile)
        } catch (error) {
          console.error(`Erro ao processar imagem ${file.name}:`, error)
          alert(`Erro ao processar a imagem "${file.name}"`)
        }
      }

      setProcessingImages(false)
      setImageProcessingProgress({ current: 0, total: 0 })

      // Adicionar as imagens processadas
      if (processedImages.length > 0) {
        setResiduoData((prev) => ({
          ...prev,
          imagens: [...prev.imagens, ...processedImages],
        }))
      }
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleImageUpload(e.dataTransfer.files)
  }

  const removeImage = (index: number) => {
    setResiduoData((prev) => ({
      ...prev,
      imagens: prev.imagens.filter((_, i) => i !== index),
    }))
  }

  // FunÃ§Ã£o para otimizar imagens automaticamente
  const optimizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      // Validar tipo de arquivo primeiro
      if (!file.type.startsWith('image/')) {
        reject(new Error('Arquivo não é uma imagem válida'))
        return
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        try {
          // Definir dimensÃµes mÃ¡ximas para manter qualidade
          const MAX_WIDTH = 1920
          const MAX_HEIGHT = 1080
          const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB alvo (aumentado)

          let { width, height } = img

          // Redimensionar se necessÃ¡rio, mantendo proporÃ§Ã£o
          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }

          canvas.width = width
          canvas.height = height

          // Desenhar imagem redimensionada
          ctx?.drawImage(img, 0, 0, width, height)

          // FunÃ§Ã£o para tentar diferentes qualidades
          const tryQuality = (quality: number) => {
            canvas.toBlob((blob) => {
              if (blob) {
                // Se o arquivo resultante Ã© pequeno o suficiente ou qualidade jÃ¡ estÃ¡ muito baixa
                if (blob.size <= MAX_FILE_SIZE || quality <= 0.1) {
                  const optimizedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  })

                  console.log(`Imagem otimizada: ${file.name}`)
                  console.log(`Tamanho original: ${(file.size / (1024 * 1024)).toFixed(2)}MB`)
                  console.log(`Tamanho otimizado: ${(blob.size / (1024 * 1024)).toFixed(2)}MB`)
                  console.log(`Dimensões: ${width}x${height}`)
                  console.log(`Qualidade: ${Math.round(quality * 100)}%`)

                  resolve(optimizedFile)
                } else {
                  // Tentar com qualidade menor
                  tryQuality(Math.max(quality - 0.1, 0.1))
                }
              } else {
                reject(new Error('Erro ao processar imagem'))
              }
            }, 'image/jpeg', quality)
          }

          // ComeÃ§ar com qualidade baseada no tamanho original
          const initialQuality = file.size > 100 * 1024 * 1024 ? 0.6 : file.size > 20 * 1024 * 1024 ? 0.7 : 0.8
          tryQuality(initialQuality)
        } catch (error) {
          console.error('Erro no processamento da imagem:', error)
          reject(new Error('Erro ao processar imagem'))
        }
      }

      img.onerror = () => reject(new Error('Erro ao carregar imagem'))

      // Criar URL do objeto de forma segura
      try {
        img.src = URL.createObjectURL(file)
      } catch {
        reject(new Error('Erro ao criar URL da imagem'))
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = localStorage.getItem("userId");
    const empresaId = localStorage.getItem("empresaId");
    if (!userId || !empresaId) {
      alert("Usuário ou empresa não autenticados. Faça login novamente.");
      router.push("/");
      return;
    }

    if (residuoData.imagens.length === 0) {
      alert("Adicione pelo menos 1 imagem do resíduo.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("tipoResiduo", residuoData.tipoResiduo);
      formData.append("descricao", residuoData.descricao);
      formData.append("quantidade", residuoData.quantidade);
      formData.append("unidade", residuoData.unidade);
      formData.append("condicoes", residuoData.condicoes);
      formData.append("disponibilidade", residuoData.disponibilidade);
      formData.append("preco", residuoData.preco);
      formData.append("abertoNegociacao", String(residuoData.abertoNegociacao)); // Incluindo novo campo
      formData.append("empresaId", String(empresaId));
      formData.append("userId", String(userId));

      residuoData.imagens.forEach((file) => {
        formData.append("imagens", file);
      });

      const response = await fetch("/api/residues/register-residues", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const residuo = await response.json();
        alert(`resíduos cadastrado com sucesso! ${residuo.imagensCreated || 0} imagens foram salvas.`);
        router.push("/my-offers");
      } else {
        let error: unknown = {};
        try {
          error = await response.json();
        } catch {
          error = {};
        }
        let errorMsg = `Erro ao cadastrar resíduo. Código HTTP: ${response.status}${response.statusText ? " - " + response.statusText : ""}`;
        if (error && typeof error === "object") {
          type ErrorResponse = { error?: string; message?: string };
          const errObj = error as ErrorResponse;
          if ("error" in errObj && typeof errObj.error === "string") {
            errorMsg = errObj.error;
          } else if ("message" in errObj && typeof errObj.message === "string") {
            errorMsg = errObj.message;
          }
        }
        alert(errorMsg);
      }
    } catch {
      alert("Erro ao processar o cadastro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      residuoData.tipoResiduo &&
      residuoData.descricao.trim() &&
      residuoData.quantidade &&
      residuoData.condicoes.trim() &&
      residuoData.disponibilidade &&
      residuoData.imagens.length >= 1 &&
      residuoData.imagens.length <= 5
    );
  }

  return (
    <div className="min-h-screen ">
      {/* Container principal com largura maior para acomodar duas colunas */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
            Cadastrar Novo Resíduo
          </h1>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-white text-teal-600 border border-teal-600 rounded px-4 py-2 text-sm font-medium hover:bg-teal-50 transition"
          >
            Cancelar
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 relative">
          {/* Loading overlay mantido igual */}
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex flex-col items-center justify-center z-50 rounded-lg">
              <Loader2 className="animate-spin w-12 h-12 text-teal-600 mb-2" />
              <span className="text-teal-700 font-medium">Processando imagens...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* LAYOUT EM DUAS COLUNAS - Grid principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* COLUNA 1 - Campos do formulário (ocupa 2/3 da largura) */}
              <div className="lg:col-span-2 space-y-6">

                {/* LINHA 1: Tipo de resíduo + Quantidade + Unidade */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Tipo de resíduos */}
                  <div className="md:col-span-1 space-y-2">
                    <label htmlFor="tipoResiduo" className="text-gray-700 font-medium">
                      Tipo de resíduos*
                    </label>
                    <select
                      id="tipoResiduo"
                      value={residuoData.tipoResiduo}
                      onChange={(e) => handleInputChange("tipoResiduo", e.target.value)}
                      className="w-full text-gray-700 bg-gray-100 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="" className="text-gray-400">Selecione o tipo</option>
                      {tiposResiduos.map((tipo) => (
                        <option key={tipo} value={tipo} className="text-gray-700">
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantidade */}
                  <div className="space-y-2">
                    <label className="text-gray-700 font-medium">Quantidade*</label>
                    <input
                      type="number"
                      value={residuoData.quantidade}
                      onChange={(e) => handleInputChange("quantidade", e.target.value)}
                      className="w-full bg-gray-100 border text-gray-700 border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-400"
                      placeholder="Ex: 500"
                    />
                  </div>

                  {/* Unidade */}
                  <div className="space-y-2">
                    <label className="text-gray-700 font-medium">Unidade*</label>
                    <select
                      value={residuoData.unidade}
                      onChange={(e) => handleInputChange("unidade", e.target.value)}
                      className="w-full bg-gray-100 border text-gray-700 border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {unidades.map((unidade) => (
                        <option key={unidade} value={unidade}>
                          {unidade}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* LINHA 2: Descrição (largura total) */}
                <div className="space-y-2">
                  <label htmlFor="descricao" className="text-gray-700 font-medium">
                    Descrição Detalhada do resíduos*
                  </label>
                  <textarea
                    id="descricao"
                    value={residuoData.descricao}
                    onChange={(e) => handleInputChange("descricao", e.target.value)}
                    className="w-full h-32 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-gray-400 text-gray-700"
                    placeholder="Descreva detalhadamente o resíduo, suas características, origem, composição..."
                  />
                </div>

                {/* LINHA 3: Condições do Armazenamento (largura total) */}
                <div className="space-y-2">
                  <label htmlFor="condicoes" className="text-gray-700 font-medium">
                    Condições do Armazenamento*
                  </label>
                  <textarea
                    id="condicoes"
                    value={residuoData.condicoes}
                    onChange={(e) => handleInputChange("condicoes", e.target.value)}
                    className="w-full h-24 px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-gray-400"
                    placeholder="Descreva como o resíduo está armazenado, condições ambientais, embalagem..."
                  />

                </div>

                {/* LINHA 4: Disponibilidade (opções em coluna) */}
                <div className="space-y-3">
                  <label className="text-gray-700 font-medium">Disponibilidade para*</label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="retirada"
                        name="disponibilidade"
                        value="retirada"
                        checked={residuoData.disponibilidade === "retirada"}
                        onChange={(e) => handleInputChange("disponibilidade", e.target.value)}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <label htmlFor="retirada" className="text-gray-700 cursor-pointer">
                        Retirada por Terceiro
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="doacao"
                        name="disponibilidade"
                        value="doacao"
                        checked={residuoData.disponibilidade === "doacao"}
                        onChange={(e) => handleInputChange("disponibilidade", e.target.value)}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <label htmlFor="doacao" className="text-gray-700 cursor-pointer">
                        Doação
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="venda"
                        name="disponibilidade"
                        value="venda"
                        checked={residuoData.disponibilidade === "venda"}
                        onChange={(e) => handleInputChange("disponibilidade", e.target.value)}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <label htmlFor="venda" className="text-gray-700 cursor-pointer">
                        Venda (Especificar Preço Abaixo)
                      </label>
                    </div>
                  </div>
                </div>

                {/* LINHA 5: Preço (input abaixo do label) */}
                <div className="space-y-2">
                  <label htmlFor="preco" className="text-gray-700 font-medium">
                    Preço {residuoData.disponibilidade !== "venda" && "(Opcional)"}
                  </label>
                  <input
                    id="preco"
                    type="text"
                    value={residuoData.preco}
                    onChange={(e) => handleInputChange("preco", e.target.value)}
                    className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 text-gray-700 focus:ring-teal-500 placeholder-gray-400 disabled:bg-gray-200 disabled:text-gray-400"
                    placeholder="Ex: R$ 2,50 por kg"
                    disabled={residuoData.disponibilidade !== "venda"}
                  />
                </div>

                {/* LINHA 6: Aberto a negociação (checkbox/switch) */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="abertoNegociacao"
                      checked={residuoData.abertoNegociacao}
                      onChange={(e) => handleInputChange("abertoNegociacao", e.target.checked)}
                      className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 focus:ring-2"
                    />
                    <label htmlFor="abertoNegociacao" className="text-gray-700 font-medium cursor-pointer">
                      Aberto a negociação
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 ml-7">
                    Marque esta opção se estiver disposto a negociar o preço ou condições
                  </p>
                </div>

              </div>

              {/* COLUNA 2 - Upload de imagens (ocupa 1/3 da largura) */}
              <div className="lg:col-span-1">
                <div className="space-y-3 sticky">
                  <label className="text-gray-700 font-medium">Foto do resíduos</label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${processingImages ? "border-blue-300 bg-blue-50" :
                        dragActive ? "border-teal-500 bg-teal-50" : "border-gray-300 bg-gray-50 hover:border-gray-400"
                      }`}
                    onDragEnter={processingImages ? undefined : handleDrag}
                    onDragLeave={processingImages ? undefined : handleDrag}
                    onDragOver={processingImages ? undefined : handleDrag}
                    onDrop={processingImages ? undefined : handleDrop}
                  >
                    <input
                      type="file"
                      id="images"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      className="hidden"
                      disabled={processingImages}
                    />
                    <label htmlFor="images" className={processingImages ? "cursor-not-allowed" : "cursor-pointer"}>
                      {processingImages ? (
                        <Loader2 className="w-10 h-10 text-blue-400 mx-auto mb-3 animate-spin" />
                      ) : (
                        <Camera className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      )}
                      <p className="text-gray-500 text-sm">
                        {processingImages ? "Processando..." : "Clique ou arraste imagem"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Mínimo 1 e máximo 5 imagens</p>
                      <p className="text-xs text-gray-400 mt-1">
                        JPEG, PNG (até 500MB cada)
                      </p>
                    </label>
                  </div>

                  {/* Indicador de progresso do processamento de imagens */}
                  {processingImages && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-blue-800">
                            Otimizando... ({imageProcessingProgress.current}/{imageProcessingProgress.total})
                          </p>
                          <div className="w-full bg-blue-200 rounded-full h-1 mt-1">
                            <div
                              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${(imageProcessingProgress.current / imageProcessingProgress.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Preview das imagens */}
                  {residuoData.imagens.length > 0 && (
                    <div className="grid grid-cols-1 gap-3">
                      {residuoData.imagens.map((image, index) => (
                        <div key={index} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded border"
                          />


                          <div className="absolute bottom-0.5 left-0.5 bg-green-500 text-white rounded-full p-0.5">
                            <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button - Largura total */}
            <div className="pt-6 flex justify-end border-t border-gray-200">
              <button
                type="submit"
                disabled={!isFormValid()}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processando..." : "Ofertar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}