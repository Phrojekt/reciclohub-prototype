import { useEffect, useRef } from "react"
import { getSocket, onDataUpdated, joinRoom, leaveRoom } from "@/lib/socket"

export interface Message {
  id: number
  sender: "me" | "other"
  content: string
  timestamp: string
  matchId?: string
}

export function useChatSocket(
  matchId: string | null,
  onMessage: (msg: Message) => void,
  allMatchIds?: string[]
) {
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null)

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = getSocket()
    }
    const socket = socketRef.current
    // Join em todas as rooms dos matches
    if (allMatchIds && allMatchIds.length > 0) {
      allMatchIds.forEach(id => joinRoom(id))
    } else if (matchId) {
      joinRoom(matchId)
    }
    socket.on("message", onMessage)

    // Subscribe to centralized 'data-updated' via helper
    const unsub = onDataUpdated((event) => {
      if (event?.resource === "chatMessage" && event.action === "created" && typeof event.payload === 'object' && event.payload) {
        onMessage(event.payload as Message)
      }
    })

    return () => {
      socket.off("message", onMessage)
      unsub()
      if (allMatchIds && allMatchIds.length > 0) {
        allMatchIds.forEach(id => leaveRoom(id))
      } else if (matchId) {
        leaveRoom(matchId)
      }
    }
  }, [matchId, onMessage, allMatchIds])

  function sendMessage(message: Message) {
    if (socketRef.current && matchId) {
      socketRef.current.emit("message", { matchId, message })
    }
  }

  return { sendMessage }
}
