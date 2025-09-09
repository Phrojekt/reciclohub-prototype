"use client"
import { useState, useEffect, useCallback, useRef } from "react"
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

// Função fetchMatches mantida igual - não alteramos a lógica de dados
async function fetchMatches(userId: string, selectedChatId?: string): Promise<Match[]> {
  try {
    const response = await fetch(`/api/proposals-accepted?userId=${userId}`)
    const data = await response.json();
    if (!Array.isArray(data)) {
      return [];
    }
    const matches: Match[] = await Promise.all(data.map(async (match: ApiMatch, index: number) => {
      let messages: Message[] = [];
      let lastSeenMessageId = 0;
      try {
        const res = await fetch(`/api/chat-history?matchId=${match.id}`);
        const msgs = await res.json();
        if (Array.isArray(msgs)) {
          messages = msgs.map((msg) => ({
            id: msg.id,
            sender: msg.senderId == userId ? "me" : "other",
            content: msg.content,
            timestamp: new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            senderId: msg.senderId
          }));
        }
        if (userId) {
          const seenRes = await fetch(`/api/chat-last-seen?matchId=${match.id}&empresaId=${userId}`);
          const seenData = await seenRes.json();
          if (seenData && seenData.lastSeenMessageId) lastSeenMessageId = seenData.lastSeenMessageId;
        }
      } catch {}
      let wasteType = "Resíduo";
      if (match.residueData) {
        // @ts-expect-error: tipoResiduo pode não existir na tipagem ResidueData
        if (typeof match.residueData.tipoResiduo === "string" && match.residueData.tipoResiduo) {
          // @ts-expect-error: tipoResiduo pode não existir na tipagem ResidueData
          wasteType = match.residueData.tipoResiduo;
        } else if (typeof match.residueData.descricao === "string" && match.residueData.descricao) {
          wasteType = match.residueData.descricao;
        }
      }
      const lastMessage = (messages.length > 0 ? messages[messages.length - 1].content : (match.proposalData?.message || "Proposta aceita! Vamos negociar?"));
      const lastTimestamp = (messages.length > 0 ? messages[messages.length - 1].timestamp : new Date(match.acceptedAt?.seconds ? match.acceptedAt.seconds * 1000 : Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      let unread = 0;
      if (messages.length > 0 && match.id !== selectedChatId) {
        unread = messages.filter(m => m.sender === "other" && m.id > lastSeenMessageId).length;
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
    if (userId) {
      setLoading(true)
      fetchMatches(userId, selectedChat ?? undefined)
        .then(setMatches)
        .finally(() => setLoading(false))
    }
  }, [userId, selectedChat])

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
    loadingMessages.current[selectedChat] = true
    fetch(`/api/chat-history?matchId=${selectedChat}`)
      .then(res => res.json())
      .then(async (msgs) => {
        let lastSeenMessageId = 0;
        let lastMessageContent = "";
        if (Array.isArray(msgs) && msgs.length > 0) {
          lastSeenMessageId = msgs[msgs.length - 1].id;
          const lastOtherMsg = [...msgs].reverse().find(m => m.senderId != userId);
          lastMessageContent = lastOtherMsg ? lastOtherMsg.content : msgs[msgs.length - 1].content;
          await fetch('/api/chat-last-seen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchId: Number(selectedChat), empresaId: Number(userId), lastSeenMessageId })
          });
        }
        setMatches(prev => prev.map(match => {
          if (match.id !== selectedChat) return match
          if (!Array.isArray(msgs)) return match
          return {
            ...match,
            messages: msgs.map((msg) => ({
              id: msg.id,
              sender: msg.senderId == userId ? "me" : "other",
              content: msg.content,
              timestamp: new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              senderId: msg.senderId
            })),
            lastMessage: lastMessageContent || match.lastMessage,
            unread: 0
          }
        }))
      })
      .finally(() => { loadingMessages.current[selectedChat] = false })
  }, [selectedChat, userId])

  const onSocketMessage = useCallback((msg: Message & { matchId?: string }) => {
    if (!msg || !msg.matchId) return;
    fetch(`/api/chat-history?matchId=${msg.matchId}`)
      .then(res => res.json())
      .then((msgs) => {
        setMatches(prev => prev.map(match => {
          if (match.id !== msg.matchId) return match;
          if (!Array.isArray(msgs)) return match;
          const lastOtherMsg = [...msgs].reverse().find(m => m.senderId != userId);
          const lastMsg = msgs[msgs.length - 1];
          let unread = match.unread;
          if (selectedChat === msg.matchId) {
            unread = 0;
          } else if (lastMsg && lastMsg.senderId != userId) {
            unread = match.unread + 1;
          }
          return {
            ...match,
            messages: selectedChat === msg.matchId
              ? msgs.map((msg) => ({
                  id: msg.id,
                  sender: msg.senderId == userId ? "me" : "other",
                  content: msg.content,
                  timestamp: new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                  senderId: msg.senderId
                }))
              : match.messages,
            lastMessage: lastOtherMsg ? lastOtherMsg.content : (lastMsg ? lastMsg.content : match.lastMessage),
            unread
          }
        }))
      })
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
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
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
      setTimeout(() => {
        fetch(`/api/chat-history?matchId=${selectedMatch.id}`)
          .then(res => res.json())
          .then((msgs) => {
            setMatches(prev => prev.map(match => {
              if (match.id !== selectedMatch.id) return match
              if (!Array.isArray(msgs)) return match
              return {
                ...match,
                messages: msgs.map((msg) => ({
                  id: msg.id,
                  sender: msg.senderId == userId ? "me" : "other",
                  content: msg.content,
                  timestamp: new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                  senderId: msg.senderId
                })),
                lastMessage: msgs.length > 0 ? msgs[msgs.length - 1].content : match.lastMessage
              }
            }))
          })
      }, 200)
    }
  }

  const selectedMatch = matches.find((m) => m.id === selectedChat)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500">Carregando conversas...</div>
        </div>
      </div>
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
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                  style={{ backgroundColor: '#abd7d8' }}
                >
                  {selectedMatch.messages.map((msg: Message) => (
                    <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.sender === "me" 
                            ? "text-gray-900" // Mensagem enviada - texto escuro no fundo verde claro
                            : "text-gray-900" // Mensagem recebida - texto escuro no fundo cinza
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
                  ))}
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