"use client"
import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react"
import { getCache, setCache } from "@/lib/cache"
import { fetchJsonWithTimeout } from "@/lib/fetchWithTimeout"
import { PageTitleProvider } from "../components/MainLayout"
import { useChatSocket } from "./useChatSocket"
import { ArrowLeft, Send, MoreVertical, MessageCircle, Search } from "lucide-react"

// Types (mantidos iguais - não alteramos)
interface Message {
  id: number
  sender: "me" | "other"
  content: string
  timestamp: string
  senderId?: number
}

interface Match {
  id: string
  company: string
  wasteType: string
  timestamp: string
  lastMessage: string
  unread: number
  avatar: string | null
  messages: Message[]
}

interface ProposalData {
  message?: string
}

interface ResidueData {
  companyName?: string
  descricao?: string
}

interface AcceptedAt {
  seconds?: number
}

interface ApiMatch {
  id: string
  userBId: string
  proposalData?: ProposalData
  residueData?: ResidueData
  acceptedAt?: AcceptedAt
}

// Helper para formatar timestamps de forma robusta (aceita Date, number, ISO string ou já formatado)
function formatTimestamp(raw: unknown): string {
  try {
    if (raw === undefined || raw === null) return ""
    // Se já for string curta no formato HH:mm, retorna direto
    if (typeof raw === 'string' && /^\d{1,2}:\d{2}$/.test(raw)) return raw
    const d = (typeof raw === 'number') ? new Date(raw) : (typeof raw === 'string' ? new Date(raw) : (raw instanceof Date ? raw : null))
    if (!d || Number.isNaN(d.getTime())) return ""
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ""
  }
}

// Função fetchMatches mantida igual - não alteramos a lógica de dados
async function fetchMatches(userId: string, selectedChatId?: string): Promise<Match[]> {
  try {
    // Try both query params: some endpoints expect `empresaId` while callers may pass `userId`.
    // Primeiro tentamos `empresaId` (compat com outras rotas) e cai de volta para `userId` se vazio.
    let response = await fetch(`/api/proposals-accepted?empresaId=${userId}`)
    let data = await response.json()
    if ((!Array.isArray(data) || data.length === 0) && userId) {
      // fallback para userId se o response anterior não trouxe dados
      try {
        response = await fetch(`/api/proposals-accepted?userId=${userId}`)
        data = await response.json()
      } catch (err) {
        // ignore fallback error, we'll handle below
        console.debug('Fallback fetch proposals-accepted?userId failed', err)
      }
    }
    if (!Array.isArray(data)) return []

    // Helper para formatar timestamps de forma robusta (aceita Date, number, ISO string ou já formatado)
    function formatTimestamp(raw: unknown) {
      try {
        if (!raw && raw !== 0) return ""
        // Se já for string curta no formato HH:mm, retorna direto
        if (typeof raw === 'string' && /^\d{1,2}:\d{2}$/.test(raw)) return raw
        const d = (typeof raw === 'number') ? new Date(raw) : (typeof raw === 'string' ? new Date(raw) : (raw instanceof Date ? raw : null))
        if (!d || Number.isNaN(d.getTime())) return ""
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      } catch {
        return ""
      }
    }

    // For performance, fetch chat histories in parallel and reuse cache when available
    const matches: Match[] = await Promise.all(data.map(async (match: ApiMatch, index: number) => {
      // Inicialmente não carregamos o histórico completo para cada match (lazy load ao abrir conversa)
      const messages: Message[] = []
      let lastSeenMessageId = 0

      try {
        // buscamos apenas o lastSeen para calcular unread (rápido)
        if (userId) {
          const seenData = await fetchJsonWithTimeout(`/api/chat-last-seen?matchId=${match.id}&empresaId=${userId}`, { timeout: 5000, retries: 1 })
          if (seenData && typeof (seenData as unknown as Record<string, unknown>).lastSeenMessageId === 'number') lastSeenMessageId = Number((seenData as unknown as Record<string, unknown>).lastSeenMessageId)
        }
      } catch {}

      let wasteType = "Resíduo"
      if (match.residueData) {
        const rd = match.residueData as unknown as Record<string, unknown>
        const tipo = typeof rd.tipoResiduo === 'string' ? String(rd.tipoResiduo) : undefined
        const descricao = typeof rd.descricao === 'string' ? String(rd.descricao) : undefined
        if (tipo) wasteType = tipo
        else if (descricao) wasteType = descricao
      }

    // Para o carregamento inicial usamos as informações da proposta aceita (sem histórico completo)
    const lastMessage = (match.proposalData?.message || "Proposta aceita! Vamos negociar?")
    const lastTimestamp = formatTimestamp(match.acceptedAt?.seconds ? (match.acceptedAt.seconds * 1000) : Date.now())
      let unread = 0
      if (messages.length > 0 && match.id !== selectedChatId) {
        unread = messages.filter(m => m.sender === "other" && m.id > lastSeenMessageId).length
      }

      return {
        id: match.id,
        company: match.residueData?.companyName || `Empresa ${index + 1}`,
        wasteType,
        timestamp: lastTimestamp,
        lastMessage,
        unread,
        avatar: null,
        messages
      }
    }))

    return matches.sort((a: Match, b: Match) => {
      if (b.messages.length && a.messages.length) {
        return b.messages[b.messages.length-1].id - a.messages[a.messages.length-1].id;
      }
      return 0;
    });
  } catch (error) {
    console.error("Erro ao buscar matches:", error)
    return []
  }
}

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [matches, setMatches] = useState<Match[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // NOVA FUNCIONALIDADE: Estado para controlar o filtro de busca
  const [searchTerm, setSearchTerm] = useState("")
  const loadingMessages = useRef<{ [key: string]: boolean }>({})
  const [messagesLoadingMap, setMessagesLoadingMap] = useState<Record<string, boolean>>({})
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const prevMessagesCountRef = useRef<Record<string, number>>({})
  const selectionPendingRef = useRef<Record<string, boolean>>({})
  const [unreadSinceView, setUnreadSinceView] = useState<Record<string, number>>({})
  const unreadSinceViewRef = useRef<Record<string, number>>({})

  const setUnreadFor = (matchId: string, value: number) => {
    setUnreadSinceView(prev => {
      const next = { ...prev, [matchId]: value }
      unreadSinceViewRef.current = next
      return next
    })
  }

  const incUnreadFor = (matchId: string) => {
    setUnreadSinceView(prev => {
      const next = { ...prev, [matchId]: (prev[matchId] || 0) + 1 }
      unreadSinceViewRef.current = next
      return next
    })
  }
  const lastAtBottomRef = useRef<Record<string, boolean>>({})

  // Auto-scroll behavior: when messages change for the selected chat, scroll to bottom
  // Use layout effect to ensure DOM is updated before measuring/scrolling
  // Compute primitive values for dependencies to keep dependency array size constant
  const selectedMessagesCount = selectedChat ? (matches.find(m => m.id === selectedChat)?.messages.length || 0) : 0
  const unreadForSelected = selectedChat ? (unreadSinceView[selectedChat] || 0) : 0

  useLayoutEffect(() => {
    if (!selectedChat) return
    const el = messagesContainerRef.current
    // current messages count for selected chat (primitive computed outside)
    const currCount = selectedMessagesCount
    // treat as initial only if the selection flow set the pending flag
    const isInitial = !!selectionPendingRef.current[selectedChat]
    // store current count for this chat (will be overwritten after any forced initial scroll)
    prevMessagesCountRef.current[selectedChat] = currCount

    if (!el) return

    const atBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) <= 40
    const shouldForceScroll = !!lastAtBottomRef.current[selectedChat]

    // Do not auto-scroll if there are unseen messages while the user is scrolled up.
    const unseen = unreadSinceViewRef.current ? (unreadSinceViewRef.current[selectedChat] || 0) : 0
    const shouldAutoScroll = (isInitial || atBottom || shouldForceScroll) && unseen === 0

    if (shouldAutoScroll) {
      // Scroll to bottom (use RAF to ensure smoother behavior on some browsers)
      try {
        requestAnimationFrame(() => {
          try { el.scrollTo({ top: el.scrollHeight, behavior: 'auto' }) } catch { el.scrollTop = el.scrollHeight }
        })
      } catch {
        try { el.scrollTo({ top: el.scrollHeight, behavior: 'auto' }) } catch { el.scrollTop = el.scrollHeight }
      }
      // Only update state if the counter is non-zero to avoid unnecessary updates
      const currentUnseen = unreadSinceViewRef.current ? (unreadSinceViewRef.current[selectedChat] || 0) : 0
      if (currentUnseen !== 0) {
        setUnreadFor(selectedChat, 0)
      }
      // reset the forced/selection flag
      lastAtBottomRef.current[selectedChat] = false
      selectionPendingRef.current[selectedChat] = false
    }
  }, [selectedChat, selectedMessagesCount, unreadForSelected])

  // When user selects a chat, ensure we attempt to scroll to bottom (covers initial selection)
  useEffect(() => {
    if (!selectedChat) return
    const el = messagesContainerRef.current
    if (!el) return
    // mark that we want to scroll to bottom on selection (use explicit pending flag)
    lastAtBottomRef.current[selectedChat] = true
    selectionPendingRef.current[selectedChat] = true
    // small timeout to allow any immediate render/layout to settle
    const t = setTimeout(() => {
      try { el.scrollTo({ top: el.scrollHeight, behavior: 'auto' }) } catch { el.scrollTop = el.scrollHeight }
  setUnreadFor(selectedChat, 0)
      // after the explicit selection scroll, record the current messages count so future messages are diffed normally
      prevMessagesCountRef.current[selectedChat] = (matches.find(m => m.id === selectedChat)?.messages.length) || 0
      selectionPendingRef.current[selectedChat] = false
    }, 50)
    return () => clearTimeout(t)
  }, [matches, selectedChat])

  // Pega o userId do localStorage (mantido igual)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user")
      if (user) {
        const userData = JSON.parse(user)
        setUserId(userData.id)
      }
    }
  }, [])

  // Busca os matches quando o userId estiver disponível (mantido igual)
  useEffect(() => {
    // Apenas buscar matches quando o userId mudar. Não queremos re-executar
    // esse fetch ao selecionar uma conversa, pois o histórico deve ser carregado
    // de forma lazy apenas na área de chat.
    if (userId) {
      const cacheKey = `matches_${userId}`
      // show cached matches immediately (stale-while-revalidate)
      const cached = getCache<Match[]>(cacheKey)
      if (cached && Array.isArray(cached.value)) {
        setMatches(cached.value)
        // don't show global loading when we can show cached data
        setLoading(false)
        // revalidate in background - merge fresh metadata with existing matches
        fetchMatches(userId).then(fresh => {
          setMatches(prev => {
            const freshMap = new Map<string, Match>()
            fresh.forEach(f => freshMap.set(f.id, f))
            const merged: Match[] = prev.map(p => {
              const f = freshMap.get(p.id)
              if (!f) return p
              return {
                ...p,
                company: f.company,
                wasteType: f.wasteType,
                timestamp: f.timestamp,
                lastMessage: f.lastMessage,
                unread: f.unread,
                avatar: f.avatar ?? p.avatar,
                // keep existing messages if present
                messages: Array.isArray(p.messages) && p.messages.length > 0 ? p.messages : f.messages
              }
            })
            const prevIds = new Set(prev.map(p => p.id))
            fresh.forEach(f => { if (!prevIds.has(f.id)) merged.push(f) })
            try { setCache(cacheKey, merged) } catch {}
            return merged
          })
        }).catch(() => {})
      } else {
        setLoading(true)
        fetchMatches(userId)
          .then((m) => {
            // merge initial fetch with any existing matches in state to avoid clearing loaded messages
            setMatches(prev => {
              if (!prev || prev.length === 0) {
                try { setCache(cacheKey, m) } catch {}
                return m
              }
              const freshMap = new Map<string, Match>()
              m.forEach(f => freshMap.set(f.id, f))
              const merged: Match[] = prev.map(p => {
                const f = freshMap.get(p.id)
                if (!f) return p
                return {
                  ...p,
                  company: f.company,
                  wasteType: f.wasteType,
                  timestamp: f.timestamp,
                  lastMessage: f.lastMessage,
                  unread: f.unread,
                  avatar: f.avatar ?? p.avatar,
                  messages: Array.isArray(p.messages) && p.messages.length > 0 ? p.messages : f.messages
                }
              })
              const prevIds = new Set(prev.map(p => p.id))
              m.forEach(f => { if (!prevIds.has(f.id)) merged.push(f) })
              try { setCache(cacheKey, merged) } catch {}
              return merged
            })
          })
          .finally(() => setLoading(false))
      }
    }
  }, [userId])

  // NOVA FUNCIONALIDADE: Filtrar matches baseado no termo de busca
  const filteredMatches = matches.filter(match => 
    match.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.wasteType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Todos os useEffects e funções mantidos iguais (não alteramos lógica de dados)
  useEffect(() => {
    if (!selectedChat || !userId) return
    if (loadingMessages.current[selectedChat]) return

    const cacheKey = `chat_history_${selectedChat}`
    const cached = getCache<Message[]>(cacheKey)

    // If we have cached messages use them immediately (SWR)
    if (cached && Array.isArray(cached.value)) {
      setMatches(prev => prev.map(match => match.id === selectedChat ? ({ ...match, messages: cached.value }) : match))
      // show cached messages immediately and revalidate in background without showing skeleton
      loadingMessages.current[selectedChat] = true
      fetchJsonWithTimeout(`/api/chat-history?matchId=${selectedChat}`, { timeout: 8000, retries: 2 })
        .then(async (msgs) => {
          if (!Array.isArray(msgs)) return
          let lastSeenMessageId = 0
          let lastMessageContent = ""
          if (msgs.length > 0) {
            lastSeenMessageId = msgs[msgs.length - 1].id
            const lastOtherMsg = [...msgs].reverse().find(m => m.senderId != userId)
            lastMessageContent = lastOtherMsg ? lastOtherMsg.content : msgs[msgs.length - 1].content
            await fetch('/api/chat-last-seen', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ matchId: Number(selectedChat), empresaId: Number(userId), lastSeenMessageId })
            })
          }
          const mapped: Message[] = msgs.map((msg) => ({
            id: msg.id,
            sender: msg.senderId == userId ? ('me' as const) : ('other' as const),
            content: msg.content,
            timestamp: formatTimestamp(msg.timestamp),
            senderId: msg.senderId
          }))
          setMatches(prev => prev.map(match => {
            if (match.id !== selectedChat) return match
            // if fetched result is empty but we already have messages, avoid overwriting
            if (mapped.length === 0 && Array.isArray(match.messages) && match.messages.length > 0) return match
            return { ...match, messages: mapped, lastMessage: lastMessageContent || match.lastMessage, unread: 0 }
          }))
          try { if (mapped.length > 0) setCache(cacheKey, mapped) } catch {}
        })
        .finally(() => {
          loadingMessages.current[selectedChat] = false
          // only clear the UI-loading flag if it was set (no-op otherwise)
          setMessagesLoadingMap(prev => ({ ...prev, [selectedChat]: false }))
        })
    } else {
      // No cache: behave as before but write cache when done
      loadingMessages.current[selectedChat] = true
      setMessagesLoadingMap(prev => ({ ...prev, [selectedChat]: true }))
      fetchJsonWithTimeout(`/api/chat-history?matchId=${selectedChat}`, { timeout: 8000, retries: 2 })
        .then(async (msgs) => {
          if (!Array.isArray(msgs)) return
          let lastSeenMessageId = 0
          let lastMessageContent = ""
          if (msgs.length > 0) {
            lastSeenMessageId = msgs[msgs.length - 1].id
            const lastOtherMsg = [...msgs].reverse().find(m => m.senderId != userId)
            lastMessageContent = lastOtherMsg ? lastOtherMsg.content : msgs[msgs.length - 1].content
            await fetch('/api/chat-last-seen', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ matchId: Number(selectedChat), empresaId: Number(userId), lastSeenMessageId })
            })
          }
          const mapped: Message[] = msgs.map((msg) => ({
            id: msg.id,
            sender: msg.senderId == userId ? ('me' as const) : ('other' as const),
            content: msg.content,
            timestamp: formatTimestamp(msg.timestamp),
            senderId: msg.senderId
          }))
          setMatches(prev => prev.map(match => {
            if (match.id !== selectedChat) return match
            if (mapped.length === 0 && Array.isArray(match.messages) && match.messages.length > 0) return match
            return { ...match, messages: mapped, lastMessage: lastMessageContent || match.lastMessage, unread: 0 }
          }))
          try { if (mapped.length > 0) setCache(cacheKey, mapped) } catch {}
        })
        .finally(() => {
          loadingMessages.current[selectedChat] = false
          setMessagesLoadingMap(prev => ({ ...prev, [selectedChat]: false }))
        })
    }
  }, [selectedChat, userId])

  const onSocketMessage = useCallback((incoming: unknown) => {
    if (process.env.NODE_ENV !== 'production') {
      try { console.debug('socket incoming', incoming) } catch {}
    }
    // incoming can be either a Message-like object or a wrapped payload
  // safe extraction from unknown incoming
  const inc = (incoming && typeof incoming === 'object') ? incoming as Record<string, unknown> : {} as Record<string, unknown>
  const incPayload = (inc['payload'] && typeof inc['payload'] === 'object') ? inc['payload'] as Record<string, unknown> : undefined
  const matchIdVal = inc['matchId'] ?? (incPayload ? incPayload['matchId'] : undefined)
  const matchId = (typeof matchIdVal === 'string' || typeof matchIdVal === 'number') ? String(matchIdVal) : undefined
  if (!matchId) return

  // Normalize incoming message
  const payload = incPayload ?? inc
    const senderIdVal = payload['senderId'] ?? payload['sender']
    const senderId = (typeof senderIdVal === 'string' || typeof senderIdVal === 'number') ? String(senderIdVal) : undefined
    const contentVal = payload['content'] ?? ''
    const content = typeof contentVal === 'string' ? contentVal : String(contentVal)
  const rawTs = payload['timestamp'] ?? payload['createdAt'] ?? new Date().toISOString()
  const timestamp = formatTimestamp(rawTs)

    const isFromMe = userId ? Number(senderId) === Number(userId) : false
    const newMsg: Message = {
      id: Number(payload.id) || Date.now(),
      sender: isFromMe ? 'me' : 'other',
      content,
      timestamp,
      senderId: Number(senderId) || undefined
    }

    // Update cache for this chat history: if this is an echo of an optimistic message, replace it; otherwise append
    try {
      const cacheKey = `chat_history_${matchId}`
      const cached = getCache<Message[]>(cacheKey)
      let updatedCache: Message[] = []
      const userIdNum = userId ? Number(userId) : undefined
      if (Array.isArray(cached?.value)) {
        updatedCache = [...cached!.value]
        if (isFromMe && userIdNum !== undefined) {
          // Try to find an optimistic message (id === 0) with same content and senderId and replace it
          const optIdx = updatedCache.findIndex(m => m.id === 0 && m.senderId === userIdNum && m.content === newMsg.content)
          if (optIdx >= 0) {
            updatedCache[optIdx] = newMsg
          } else {
            updatedCache.push(newMsg)
          }
        } else {
          // other user's message: avoid duplicating if identical message exists
          const exists = updatedCache.find(m => m.id === newMsg.id || (m.content === newMsg.content && m.timestamp === newMsg.timestamp && m.senderId === newMsg.senderId))
          if (!exists) updatedCache.push(newMsg)
        }
      } else {
        updatedCache = [newMsg]
      }
      setCache(cacheKey, updatedCache)
    } catch {
      // ignore cache errors
    }

    setMatches(prev => {
      let updated = prev.map(match => {
        if (match.id !== matchId) return match
        const lastMessage = newMsg.content || match.lastMessage
        let unread = match.unread
        let messages = Array.isArray(match.messages) ? [...match.messages] : []

        if (selectedChat === matchId) {
          // Conversation is open
          if (isFromMe) {
            // Replace optimistic message if present, else append
            const userIdNum = userId ? Number(userId) : undefined
            const optIdx = userIdNum !== undefined ? messages.findIndex(m => m.id === 0 && m.senderId === userIdNum && m.content === newMsg.content) : -1
            if (optIdx >= 0) {
              messages[optIdx] = newMsg
            } else {
              // avoid duplicate if already present
              const exists = messages.find(m => m.id === newMsg.id || (m.content === newMsg.content && m.timestamp === newMsg.timestamp && m.senderId === newMsg.senderId))
              if (!exists) messages = [...messages, newMsg]
            }
            unread = 0
          } else {
            // Message from other user while conversation open
            // Decide based on actual DOM scroll position at the moment of arrival but do NOT overwrite the user's lastAtBottomRef
            const el = messagesContainerRef.current
            const atBottomNow = el ? ((el.scrollHeight - el.scrollTop - el.clientHeight) <= 40) : !!lastAtBottomRef.current[matchId]
            // avoid duplicate
            const exists = messages.find(m => m.id === newMsg.id || (m.content === newMsg.content && m.timestamp === newMsg.timestamp && m.senderId === newMsg.senderId))
            if (!exists) messages = [...messages, newMsg]
            if (!atBottomNow) {
              // increment bubble counter
              incUnreadFor(matchId)
            } else {
              // if at bottom we will let layout effect decide to scroll; keep unread 0
              setUnreadFor(matchId, 0)
            }
            unread = 0
          }
        } else {
          // conversation not open: append message and increment match.unread if message from other
          const exists = messages.find(m => m.id === newMsg.id || (m.content === newMsg.content && m.timestamp === newMsg.timestamp && m.senderId === newMsg.senderId))
          if (!exists) messages = [...messages, newMsg]
          if (!isFromMe) unread = (match.unread || 0) + 1
        }
        return { ...match, messages, lastMessage, unread }
      })
      // Move the touched match to top for recency
      const idx = updated.findIndex(m => m.id === matchId)
      if (idx > 0) {
        const [moved] = updated.splice(idx, 1)
        updated = [moved, ...updated]
      }
      return updated
    })
    // Mark that we were at bottom for this chat if appropriate; useLayoutEffect will perform actual scrolling
    if (selectedChat === matchId) {
      const el = messagesContainerRef.current
      if (el) {
        const atBottomNow = (el.scrollHeight - el.scrollTop - el.clientHeight) <= 40
        lastAtBottomRef.current[matchId] = atBottomNow
      }
    }
  }, [selectedChat, userId])

  const allMatchIds = matches.map(m => m.id)
  const { sendMessage } = useChatSocket(selectedChat, onSocketMessage, allMatchIds)

  interface OutgoingMessage extends Message {
    matchId: string
    senderId: number
  }

  const handleSendMessage = () => {
    const selectedMatch = matches.find((m) => m.id === selectedChat)
    if (message.trim() && selectedMatch && userId) {
      const outgoingMessage: OutgoingMessage = {
        id: 0,
        sender: "me",
        content: message.trim(),
        timestamp: formatTimestamp(new Date()),
        matchId: selectedMatch.id,
        senderId: Number(userId)
      }
      sendMessage(outgoingMessage)
      setMessage("")
      setMatches(prev => {
        const userIdNum = Number(userId);
        let updated = prev.map(match => {
          if (match.id !== selectedMatch.id) return match;
          const newMessages = [
            ...match.messages,
            {
              id: 0,
              sender: "me" as const,
              content: message.trim(),
              timestamp: outgoingMessage.timestamp,
              senderId: userIdNum
            }
          ];
          const lastOtherMsg = [...newMessages].reverse().find(m => m.senderId != userIdNum);
          return {
            ...match,
            messages: newMessages,
            lastMessage: lastOtherMsg ? lastOtherMsg.content : message.trim()
          }
        });
        const idx = updated.findIndex(m => m.id === selectedMatch.id);
        if (idx > 0) {
          const [moved] = updated.splice(idx, 1);
          updated = [moved, ...updated];
        }
        return updated;
      });
      // After optimistic update, ensure scroll to bottom so user sees their message
      try {
        requestAnimationFrame(() => {
          const el = messagesContainerRef.current
          if (!el) return
          try { el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }) } catch { el.scrollTop = el.scrollHeight }
        })
      } catch {
        const el = messagesContainerRef.current
        if (el) try { el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }) } catch { el.scrollTop = el.scrollHeight }
      }
      // Instead of refetching immediately, rely on socket/data-updated to provide the persisted message
      // but update cache locally so UI feels instant
      try {
        const cacheKey = `chat_history_${selectedMatch.id}`
        const cached = getCache<Message[]>(cacheKey)
        const userIdNum = Number(userId)
        const appended = Array.isArray(cached?.value) ? [...cached!.value, {
          id: 0,
          sender: 'me',
          content: message.trim(),
          timestamp: outgoingMessage.timestamp,
          senderId: userIdNum
        }] : [{ id: 0, sender: 'me', content: message.trim(), timestamp: outgoingMessage.timestamp, senderId: userIdNum }]
        setCache(cacheKey, appended)
      } catch {
        // ignore cache errors
      }
    }
  }

  const selectedMatch = matches.find((m) => m.id === selectedChat)

  if (loading) {
    // Skeleton loading: lista de conversas à esquerda e painel vazio à direita
    const SkeletonRow = ({ keyIndex = 0 }: { keyIndex?: number }) => (
      <div key={`s-${keyIndex}`} className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
          </div>
        </div>
      </div>
    )

    return (
      <PageTitleProvider title="Conversas">
        <div className="min-h-screen">
          <div className="max-w-7xl mx-auto h-[calc(100vh-80px)] flex mt-2">
            <div className={`w-full md:w-1/3 bg-white border-r`}>
              <div className="p-4 border-b bg-white">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Conversas</h2>
                <div className="relative">
                  <div className="absolute top-1/2 transform -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00A2AA' }}>
                    <Search className="w-4 h-4 text-white" />
                  </div>
                  <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-4 py-2 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-teal-500 text-black" style={{ backgroundColor: '#e7f2eb' }} />
                </div>
              </div>
              <div className="overflow-y-auto">
                {[...Array(6)].map((_, i) => SkeletonRow({ keyIndex: i }))}
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Carregando...</h3>
                  <p className="text-gray-600">Aguarde enquanto carregamos suas conversas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageTitleProvider>
    )
  }

  return (
    <PageTitleProvider title="Conversas">
      {/* ALTERAÇÃO VISUAL: Container principal com fundo mais claro, estilo WhatsApp */}
      <div className="min-h-screen" >
        <div className="max-w-7xl mx-auto h-[calc(100vh-80px)] flex mt-2">
          
          {/* ALTERAÇÃO VISUAL: Chat List - Fundo branco conforme solicitado */}
          <div className={`w-full md:w-1/3 bg-white border-r ${selectedChat ? "hidden md:block" : ""}`}>
            
            {/* ALTERAÇÃO VISUAL: Header da lista com busca */}
            <div className="p-4 border-b bg-white">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Conversas</h2>
              
              {/* NOVO COMPONENTE: Campo de busca */}
              <div className="relative">
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#00A2AA' }}
                >
                  <Search className="w-4 h-4 text-white" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-4 py-2 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-teal-500 text-black"
                  style={{ backgroundColor: '#e7f2eb' }}
                />
              </div>
            </div>

            <div className="overflow-y-auto">
              {/* ALTERAÇÃO VISUAL: Usar filteredMatches em vez de matches para busca */}
              {filteredMatches.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  {/* ALTERAÇÃO VISUAL: Mensagem condicional baseada na busca */}
                  <p>{searchTerm ? "Nenhuma conversa encontrada" : "Nenhuma conversa encontrada"}</p>
                  <p className="text-sm">
                    {searchTerm ? "Tente outros termos de busca" : "Aceite algumas propostas para começar a conversar!"}
                  </p>
                </div>
              ) : (
                filteredMatches.map((match) => (
                  <div
                    key={match.id}
                    onClick={() => setSelectedChat(match.id)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedChat === match.id ? "bg-teal-50 border-l-4 border-l-teal-600" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                        {match.wasteType[0]?.toUpperCase() || "R"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">{match.wasteType}</h3>
                          <span className="text-xs text-gray-500">{match.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{match.lastMessage}</p>
                        <p className="text-xs text-teal-600">{match.company}</p>
                      </div>
                      {match.unread > 0 && (
                        <div className="ml-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">{match.unread}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ALTERAÇÃO VISUAL: Chat Area com fundo personalizado */}
          <div className={`flex-1 flex flex-col ${!selectedChat ? "hidden md:flex" : ""}`}>
            {selectedChat && selectedMatch ? (
              <>
                {/* Chat Header mantido igual */}
                <div className="bg-white border-b p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedChat(null)}
                      className="md:hidden p-2 rounded hover:bg-gray-100"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedMatch.wasteType[0]?.toUpperCase() || "R"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedMatch.wasteType}</h3>
                      <p className="text-sm text-gray-600">{selectedMatch.company}</p>
                    </div>
                  </div>
                  <button className="p-2 rounded hover:bg-gray-100">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                {/* ALTERAÇÃO VISUAL: Messages com fundo personalizado e cores das mensagens */}
                <div 
                  className="flex-1 overflow-y-auto p-4 space-y-4 relative"
                  style={{ backgroundColor: '#abd7d8' }}
                  ref={el => { messagesContainerRef.current = el }}
                  onScroll={() => {
                    const el = messagesContainerRef.current
                    if (!el || !selectedChat) return
                    const atBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) <= 40
                    lastAtBottomRef.current[selectedChat] = atBottom
                    if (process.env.NODE_ENV !== 'production') {
                      try { console.debug('onScroll atBottom=', atBottom, 'selectedChat=', selectedChat) } catch {}
                    }
                    if (atBottom) {
                      setUnreadFor(selectedChat, 0)
                    }
                  }}
                >
                  {messagesLoadingMap[selectedChat ?? ''] ? (
                    // skeleton para mensagens enquanto são carregadas
                    [...Array(8)].map((_, i) => (
                      <div key={`msg-skel-${i}`} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg`} style={{ backgroundColor: '#F5F5F5' }}>
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                          <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
                        </div>
                      </div>
                    ))
                  ) : (
                    selectedMatch.messages.map((msg: Message) => (
                      <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.sender === "me" 
                              ? "text-gray-900"
                              : "text-gray-900"
                          }`}
                          style={{ 
                            backgroundColor: msg.sender === "me" ? "#D1FF66" : "#F5F5F5"
                          }}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs mt-1 text-gray-600">
                            {msg.timestamp}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {/* Go-to-recent bubble when there are unseen messages and we're not loading */}
                  {selectedChat && (unreadSinceView[selectedChat] || 0) > 0 && !messagesLoadingMap[selectedChat] && (
                    <div className="absolute bottom-6 right-6 z-20">
                      <button
                        onClick={() => {
                          const el = messagesContainerRef.current
                          if (!el) return
                          try { el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }) } catch { el.scrollTop = el.scrollHeight }
                      setUnreadFor(selectedChat, 0)
                        }}
                        className="bg-teal-600 text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2"
                      >
                        Ir para mensagens recentes ({unreadSinceView[selectedChat]})
                      </button>
                    </div>
                  )}
                </div>

                {/* Message Input mantido igual */}
                <div className="bg-white border-t p-4">
                  <div className="flex gap-2">
                    <input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 text-black"
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      className="bg-teal-600 hover:bg-teal-700 text-white rounded px-4 py-2 flex items-center justify-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma conversa</h3>
                  <p className="text-gray-600">Escolha uma conversa para começar a negociar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTitleProvider>
  )
}