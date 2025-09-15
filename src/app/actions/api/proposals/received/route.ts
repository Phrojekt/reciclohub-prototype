import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * Rota GET para listar todas as propostas recebidas por uma empresa
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const empresaId = searchParams.get("empresaId")
    
    if (!empresaId) {
      return NextResponse.json({ error: "empresaId é obrigatório" }, { status: 400 })
    }

    const empresaIdNumber = parseInt(empresaId)
    if (isNaN(empresaIdNumber)) {
      return NextResponse.json({ error: "empresaId deve ser um número válido" }, { status: 400 })
    }

    // Buscar propostas recebidas pela empresa
    const propostas = await prisma.propostas.findMany({
      where: {
        empresaReceptoraId: empresaIdNumber
      },
      include: {
        empresaProponente: {
          select: {
            id: true,
            nome: true,
            email: true,
            cidade: true,
            estado: true
          }
        },
        residuo: {
          select: {
            descricao: true,
            tipoResiduo: true,
            quantidade: true,
            unidade: true
          }
        }
      },
      orderBy: {
        criadaEm: 'desc'
      }
    })

    // Formatar os dados para o frontend
    const propostasFormatadas = propostas.map(proposta => ({
      id: proposta.id.toString(),
      quantidade: proposta.quantidade,
      frequencia: proposta.frequencia,
      preco: proposta.preco,
      mensagem: proposta.mensagem,
      tipoTransporte: proposta.tipoTransporte,
      status: proposta.status,
      criadaEm: proposta.criadaEm.toISOString(),
      empresaProponente: proposta.empresaProponente,
      residuo: proposta.residuo
    }))

    return NextResponse.json(propostasFormatadas, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar propostas recebidas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
