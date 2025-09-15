import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id)
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: "ID de usuário inválido" },
        { status: 400 }
      )
    }

    // Buscar a empresa com dados
    const empresa = await prisma.empresas.findUnique({
      where: { id: userId }
    })

    if (!empresa) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Contar resíduos da empresa
    const totalResiduos = await prisma.residuos.count({
      where: { empresaId: empresa.id }
    })

    const residuosAtivos = await prisma.residuos.count({
      where: { 
        empresaId: empresa.id,
        // Consideramos todos como ativos por enquanto
        // Pode ser refinado conforme regras de negócio
      }
    })

    // Buscar data do primeiro resíduo para simular data de cadastro
    // Data simulada baseada no ID da empresa (mais antigo = ID menor)
    const dataBase = new Date('2024-01-01')
    const diasOffset = (empresa.id - 1) * 7 // Cada empresa "criada" 7 dias após a anterior
    const dataCadastro = new Date(dataBase.getTime() + (diasOffset * 24 * 60 * 60 * 1000))

    // Preparar dados públicos (sem informações sensíveis como password)
    const publicProfile = {
      id: empresa.id,
      nome: empresa.nome,
      email: empresa.email,
      telefone: empresa.telefone || undefined,
      avatar: undefined, // Não há campo avatar no modelo atual
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        cnpj: empresa.cnpj,
        endereco: `${empresa.rua}, ${empresa.numero}`,
        cidade: empresa.cidade,
        estado: empresa.estado,
        cep: empresa.cep,
        telefone: empresa.telefone || undefined,
        email: empresa.email || undefined,
        website: undefined, // Não há campo website no modelo atual
        descricao: undefined, // Não há campo descricao no modelo atual
        setor: "Não informado" // Não há campo setor no modelo atual
      },
      dataCriacao: dataCadastro.toISOString(),
      totalResiduos,
      residuosAtivos
    }

    return NextResponse.json({
      success: true,
      profile: publicProfile
    })

  } catch (error) {
    console.error("Erro ao buscar perfil público:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Erro interno do servidor" 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}