import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import type { Server as IOServer } from "socket.io"

const prisma = new PrismaClient()

/**
 * Rota PATCH para aceitar ou rejeitar uma proposta
 */
export async function PATCH(req: Request) {
  try {
    const { propostaId, empresaId, acao } = await req.json()
    
    // Validação
    if (!propostaId || !empresaId || !acao) {
      return NextResponse.json({ 
        error: "propostaId, empresaId e acao são obrigatórios" 
      }, { status: 400 })
    }

    if (!['aceitar', 'rejeitar'].includes(acao)) {
      return NextResponse.json({ 
        error: "acao deve ser 'aceitar' ou 'rejeitar'" 
      }, { status: 400 })
    }

    // Buscar a proposta e verificar autorização
    const proposta = await prisma.propostas.findFirst({
      where: {
        id: parseInt(propostaId),
        empresaReceptoraId: parseInt(empresaId),
        status: 'PENDENTE'
      },
      include: {
        empresaProponente: {
          select: {
            id: true,
            nome: true
          }
        },
        empresaReceptora: {
          select: {
            id: true,
            nome: true
          }
        },
        residuo: {
          select: {
            descricao: true
          }
        }
      }
    })

    if (!proposta) {
      return NextResponse.json({ 
        error: "Proposta não encontrada ou não autorizada" 
      }, { status: 404 })
    }

    const novoStatus = acao === 'aceitar' ? 'ACEITA' : 'CANCELADA'
    
    // Atualizar status da proposta
    await prisma.propostas.update({
      where: { id: parseInt(propostaId) },
      data: { status: novoStatus }
    })

    // Criar notificação para a empresa proponente
    const tipoNotificacao = acao === 'aceitar' ? 'PROPOSTA_ACEITA' : 'PROPOSTA_REJEITADA'
    const tituloNotificacao = acao === 'aceitar' ? 'Proposta aceita!' : 'Proposta rejeitada'
    const mensagemNotificacao = acao === 'aceitar' 
      ? `Sua proposta para o resíduo "${proposta.residuo.descricao}" foi aceita!`
      : `Sua proposta para o resíduo "${proposta.residuo.descricao}" foi rejeitada.`

    await prisma.notificacoes.create({
      data: {
        tipo: tipoNotificacao,
        titulo: tituloNotificacao,
        mensagem: mensagemNotificacao,
        empresaId: proposta.empresaProponente.id,
        propostaId: proposta.id
      }
    })

    // Emit socket event for the proponente
    try {
      const io = (globalThis as unknown as { io?: IOServer }).io
      if (io) {
        io.to(String(proposta.empresaProponente.id)).emit('notification', {
          tipo: tipoNotificacao,
          titulo: tituloNotificacao,
          mensagem: mensagemNotificacao,
          empresaId: proposta.empresaProponente.id,
          propostaId: proposta.id,
          createdAt: new Date()
        })
        io.emit('data-updated', { resource: 'notificacoes', action: 'created', id: proposta.id })
      }
    } catch (e) {
      console.warn('Socket emit failed (respond-proposal):', e)
    }


    // Se foi aceita, criar notificação de match para ambos os lados
    if (acao === 'aceitar') {
      // Para o proponente (usuário B)
      await prisma.notificacoes.create({
        data: {
          tipo: 'MATCH_CONFIRMADO',
          titulo: 'Match confirmado!',
          mensagem: `Você tem um match com ${proposta.empresaReceptora.nome}`,
          empresaId: proposta.empresaProponente.id,
          propostaId: proposta.id
        }
      })
      // Para o receptor (usuário A)
      await prisma.notificacoes.create({
        data: {
          tipo: 'MATCH_CONFIRMADO',
          titulo: 'Match confirmado!',
          mensagem: `Você tem um match com ${proposta.empresaProponente.nome}`,
          empresaId: proposta.empresaReceptora.id,
          propostaId: proposta.id
        }
      })
      try {
        const io = (globalThis as unknown as { io?: IOServer }).io
        if (io) {
          io.to(String(proposta.empresaReceptora.id)).emit('notification', {
            tipo: 'MATCH_CONFIRMADO',
            titulo: 'Match confirmado!',
            mensagem: `Você tem um match com ${proposta.empresaProponente.nome}`,
            empresaId: proposta.empresaReceptora.id,
            propostaId: proposta.id,
            createdAt: new Date()
          })
          io.emit('data-updated', { resource: 'notificacoes', action: 'created', id: proposta.id })
        }
      } catch (e) {
        console.warn('Socket emit failed (respond-proposal match):', e)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Proposta ${acao === 'aceitar' ? 'aceita' : 'rejeitada'} com sucesso`,
      matchCreated: acao === 'aceitar'
    }, { status: 200 })

  } catch (error) {
    console.error("Erro ao processar proposta:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
