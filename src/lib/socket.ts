import io from "socket.io-client"

let socket: ReturnType<typeof io> | null = null

export function getSocket() {
  if (!socket) {
    socket = io({ path: "/api/socketio" })
  }
  return socket
}

export function onDataUpdated(handler: (ev: { resource: string; action: string; id?: number; payload?: unknown }) => void) {
  const s = getSocket()
  s.on("data-updated", handler)
  return () => s.off("data-updated", handler)
}

export function joinRoom(roomId: string) {
  getSocket().emit("join", roomId)
}

export function leaveRoom(roomId: string) {
  getSocket().emit("leave", roomId)
}

export function emitMessage(event: string, payload: unknown) {
  getSocket().emit(event, payload)
}

export default getSocket
