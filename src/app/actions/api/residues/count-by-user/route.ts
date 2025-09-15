import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * Rota GET para contar resíduos por usuário/empresa
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

    // Contar resíduos cadastrados pela empresa
    const residuosCadastrados = await prisma.residuos.count({
      where: {
        empresaId: empresaIdNumber
      }
    })

    // Contar resíduos por tipo de disponibilidade
    const porDisponibilidade = await prisma.residuos.groupBy({
      by: ['disponibilidade'],
      where: {
        empresaId: empresaIdNumber
      },
      _count: true
    })

    return NextResponse.json({
      total: residuosCadastrados,
      porDisponibilidade: porDisponibilidade.map(item => ({
        tipo: item.disponibilidade,
        quantidade: item._count
      }))
    }, { status: 200 })

  } catch (error) {
    console.error("Erro ao contar resíduos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
