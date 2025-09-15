import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * Rota GET para contar propostas por usuário/empresa
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

    // Contar propostas enviadas pela empresa
    const propostasEnviadas = await prisma.propostas.count({
      where: {
        empresaProponenteId: empresaIdNumber
      }
    })

    // Contar propostas recebidas pela empresa
    const propostasRecebidas = await prisma.propostas.count({
      where: {
        empresaReceptoraId: empresaIdNumber
      }
    })

    return NextResponse.json({
      enviadas: propostasEnviadas,
      recebidas: propostasRecebidas,
      total: propostasEnviadas + propostasRecebidas
    }, { status: 200 })

  } catch (error) {
    console.error("Erro ao contar propostas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
