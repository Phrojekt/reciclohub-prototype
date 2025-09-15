import { Server as IOServer, Socket } from "socket.io"
import type { NextApiRequest, NextApiResponse } from "next"
import type { Server as HTTPServer } from "http"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

let io: IOServer | null = null

type NextServerWithIO = HTTPServer & {
  io?: IOServer
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const server: NextServerWithIO = (res.socket as import("net").Socket & { server: HTTPServer }).server

  if (!server.io) {
    io = new IOServer(server, {
      path: "/api/socketio",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })

    io.on("connection", (socket: Socket) => {
      // Join room by matchId
      socket.on("join", (matchId: string) => {
        socket.join(matchId)
      })

      // Broadcast message to room e persistir no banco
      socket.on(
        "message",
        async ({ matchId, message }: { matchId: string; message: { id: number; sender: string; content: string; timestamp: string; matchId?: string; senderId: number } }) => {
            // Persistir mensagem no banco e emitir evento padronizado
            try {
              const created = await prisma.chatMessage.create({
                data: {
                  matchId: Number(matchId),
                  senderId: message.senderId,
                  content: message.content,
                  timestamp: new Date(),
                }
              })
              // Emit standardized intermediary event to inform clients to update caches
              io?.to(matchId).emit("data-updated", {
                resource: "chatMessage",
                action: "created",
                id: created.id,
                payload: {
                  id: created.id,
                  matchId: created.matchId,
                  senderId: created.senderId,
                  content: created.content,
                  timestamp: created.timestamp,
                }
              })
              // Also emit the original 'message' for real-time chat listeners
              io?.to(matchId).emit("message", { ...message, id: created.id, timestamp: created.timestamp })
            } catch (err) {
              console.error("Failed to persist chat message:", err)
            }
        }
      )
    })

  // Expose io globally so app routes can emit events without needing NextApiResponse
  // Use a typed assertion to avoid `any` lint rules
    ;(globalThis as unknown as { io?: IOServer }).io = io
      server.io = io ?? undefined
  }
  res.end()
}

export const config = {
  api: {
    bodyParser: false,
  },
}
