import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET /api/notifications?empresaId=123 -> retorna notificações da empresa
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const empresaId = searchParams.get("empresaId")
    
    if (!empresaId) {
      return NextResponse.json({ error: "empresaId é obrigatório" }, { status: 400 })
    }
    
    const idNum = parseInt(empresaId)
    if (isNaN(idNum)) {
      return NextResponse.json({ error: "empresaId deve ser um número válido" }, { status: 400 })
    }

    const notifs = await prisma.notificacoes.findMany({
      where: { empresaId: idNum },
      include: {
        proposta: {
          include: {
            residuo: true,
            empresaProponente: true
          }
        }
      },
      orderBy: { criadaEm: 'desc' }
    })

    return NextResponse.json(notifs)
  } catch (e) {
    console.error('Failed to fetch notifications', e)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PATCH /api/notifications -> marcar como visualizada
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { ids } = body
    
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 })
    }

    // Validar se todos os IDs são números válidos
    const validIds = ids.filter(id => !isNaN(parseInt(id))).map(id => parseInt(id))
    
    if (validIds.length === 0) {
      return NextResponse.json({ error: 'No valid IDs provided' }, { status: 400 })
    }

    await prisma.notificacoes.updateMany({ 
      where: { id: { in: validIds } }, 
      data: { visualizada: true } 
    })

    return NextResponse.json({ 
      success: true, 
      message: `${validIds.length} notificações marcadas como visualizadas` 
    })
  } catch (e) {
    console.error('Failed to mark notifications read', e)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
