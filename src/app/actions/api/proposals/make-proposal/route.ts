import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import type { Server as IOServer } from "socket.io"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const {
      residuoId,
      empresaProponenteId,
      quantidade,
      frequencia,
      preco,
      mensagem,
      tipoTransporte
    } = await req.json()

    // Validação dos campos obrigatórios
    if (!residuoId || !empresaProponenteId || !quantidade || !frequencia || !tipoTransporte) {
      return NextResponse.json({ 
        error: "Campos obrigatórios: residuoId, empresaProponenteId, quantidade, frequencia, tipoTransporte" 
      }, { status: 400 })
    }

    // Verificar se o resíduo existe e obter a empresa receptora
    const residuo = await prisma.residuos.findUnique({
      where: { id: parseInt(residuoId) },
      include: { empresa: true }
    })

    if (!residuo) {
      return NextResponse.json({ error: "Resíduo não encontrado" }, { status: 404 })
    }

    // Verificar se a empresa não está fazendo proposta para ela mesma
    if (residuo.empresaId === parseInt(empresaProponenteId)) {
      return NextResponse.json({ 
        error: "Não é possível fazer proposta para seu próprio resíduo" 
      }, { status: 400 })
    }

    // Verificar se já existe uma proposta pendente desta empresa para este resíduo
    const propostaExistente = await prisma.propostas.findFirst({
      where: {
        residuoId: parseInt(residuoId),
        empresaProponenteId: parseInt(empresaProponenteId),
        status: 'PENDENTE'
      }
    })

    if (propostaExistente) {
      return NextResponse.json({ 
        error: "Você já possui uma proposta pendente para este resíduo" 
      }, { status: 409 })
    }

    // Criar a proposta
    const proposta = await prisma.propostas.create({
      data: {
        quantidade,
        frequencia,
        preco: preco || null,
        mensagem: mensagem || null,
        tipoTransporte,
        residuoId: parseInt(residuoId),
        empresaProponenteId: parseInt(empresaProponenteId),
        empresaReceptoraId: residuo.empresaId
      },
      include: {
        empresaProponente: true,
        residuo: true
      }
    })

    // Criar notificação para a empresa receptora
    await prisma.notificacoes.create({
      data: {
        tipo: 'NOVA_PROPOSTA',
        titulo: 'Nova proposta recebida',
        mensagem: `A empresa ${proposta.empresaProponente.nome} fez uma proposta para seu resíduo "${proposta.residuo.descricao}"`,
        empresaId: residuo.empresaId,
        propostaId: proposta.id
      }
    })

    // Emitir evento de notificação via socket (se disponível)
    try {
      const io = (globalThis as unknown as { io?: IOServer }).io
      if (io) {
        io.to(String(residuo.empresaId)).emit('notification', {
          tipo: 'NOVA_PROPOSTA',
          titulo: 'Nova proposta recebida',
          mensagem: `A empresa ${proposta.empresaProponente.nome} fez uma proposta para seu resíduo "${proposta.residuo.descricao}"`,
          empresaId: residuo.empresaId,
          propostaId: proposta.id,
          createdAt: new Date()
        })
        // Also emit generic data-updated for caches
        io.emit('data-updated', { resource: 'notificacoes', action: 'created', id: proposta.id })
      }
    } catch (e) {
      console.warn('Socket emit failed (make-proposal):', e)
    }

    return NextResponse.json({ 
      success: true, 
      propostaId: proposta.id,
      message: "Proposta enviada com sucesso"
    }, { status: 201 })

  } catch (error) {
    console.error("Erro ao criar proposta:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}