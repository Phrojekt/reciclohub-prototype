"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { getSocket, onDataUpdated } from "@/lib/socket"

type Notification = {
  id: number
  tipo: string
  titulo: string
  mensagem: string
  visualizada: boolean
  empresaId: number
  propostaId?: number
  criadaEm: string
}

type Props = {
  buttonClass?: string
  iconClass?: string
  hideOnMobile?: boolean
}

export default function NotificationsMenu({ buttonClass = '', iconClass = '', hideOnMobile = false }: Props) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [hasNew, setHasNew] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  // track which notifications are newly received since last open
  const [newIds, setNewIds] = useState<Set<number>>(new Set())
  const ref = useRef<HTMLDivElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return
      if (e.target instanceof Node && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  // Clear highlight for notifications that were visualizada when menu is closed
  useEffect(() => {
    if (open) return
    // menu was closed: remove from newIds any notifications that are already visualizada
    setNewIds((prev) => {
      try {
        const remaining = new Set<number>()
        for (const n of notifications) {
          if (!n.visualizada && prev.has(n.id)) remaining.add(n.id)
        }
        return remaining
      } catch {
        return new Set()
      }
    })
    // recompute hasNew
    setHasNew(notifications.some((n) => !n.visualizada))
  }, [open, notifications])

  // Load notifications for current empresaId using server-verified /api/auth/me
  useEffect(() => {
    let mounted = true
    const socket = getSocket()

    async function init() {
      try {
        setIsLoading(true)
        console.log('NotificationsMenu: Starting initialization...')
        const res = await fetch('/api/auth/me')
        console.log('NotificationsMenu: Auth response status:', res.status)
        
        let empresaId: string | null = null
        
        if (res.ok) {
          const payload = await res.json()
          console.log('NotificationsMenu: Auth payload:', payload)
          // the auth route may return { user: { empresaId: number, ... } } or { empresaId }
          const empresaIdFromServer = payload?.user?.empresaId ?? payload?.empresaId
          console.log('NotificationsMenu: Extracted empresaId:', empresaIdFromServer)
          if (empresaIdFromServer) {
            empresaId = String(empresaIdFromServer)
          }
        }
        
        // Fallback to localStorage if server auth fails (temporary compatibility)
        if (!empresaId) {
          console.log('NotificationsMenu: Server auth failed, trying localStorage fallback...')
          const storedEmpresaId = localStorage.getItem('empresaId')
          if (storedEmpresaId) {
            empresaId = storedEmpresaId
            console.log('NotificationsMenu: Using localStorage empresaId:', empresaId)
          }
        }
        
        if (!empresaId) {
          console.log('NotificationsMenu: No empresaId found anywhere')
          setIsLoading(false)
          return
        }

        // fetch notifications for this empresa
        console.log('NotificationsMenu: Fetching notifications for empresaId:', empresaId)
        const r = await fetch(`/api/notifications?empresaId=${empresaId}`)
        console.log('NotificationsMenu: Notifications response status:', r.status)
        if (r.ok) {
          const data: Notification[] = await r.json()
          console.log('NotificationsMenu: Notifications data:', data)
          if (!mounted) return
          setNotifications(data)
          const newOnes = data.filter((n) => !n.visualizada).map((n) => n.id)
          console.log('NotificationsMenu: New notification IDs:', newOnes)
          setNewIds(new Set(newOnes))
          setHasNew(newOnes.length > 0)
        } else {
          console.log('NotificationsMenu: Failed to fetch notifications:', await r.text())
        }
        setIsLoading(false)

        // Subscribe to socket for live notifications
        function onNotification(ev: { empresaId?: number | string; propostaId?: number; tipo?: string; titulo?: string; mensagem?: string }) {
          try {
            if (String(ev.empresaId) !== empresaId) return
            const newNotif: Notification = {
              id: (ev.propostaId ?? Date.now()) as number,
              tipo: ev.tipo || 'INFO',
              titulo: ev.titulo || 'Notificação',
              mensagem: ev.mensagem || '',
              visualizada: false,
              empresaId: Number(empresaId),
              propostaId: ev.propostaId,
              criadaEm: new Date().toISOString(),
            }
            setNotifications((s) => [newNotif, ...s])
            setNewIds((prev) => {
              const copy = new Set(prev)
              copy.add(newNotif.id)
              return copy
            })
            setHasNew(true)
          } catch (e) {
            console.warn('onNotification error', e)
          }
        }

        // Join the empresa-specific room so server can emit to it
        console.log('NotificationsMenu: Joining socket room:', empresaId)
        socket.emit('join', empresaId)
        socket.on('notification', onNotification)

        const unsub = onDataUpdated((ev) => {
          // if notifications changed, refetch
          if (ev.resource === 'notificacoes') {
            fetch(`/api/notifications?empresaId=${empresaId}`)
              .then((r2) => r2.json())
              .then((data: Notification[]) => {
                setNotifications(data)
                const newOnes = data.filter((n) => !n.visualizada).map((n) => n.id)
                setNewIds(new Set(newOnes))
                setHasNew(newOnes.length > 0)
              })
              .catch(() => {})
          }
        })

        // cleanup
        return () => {
          socket.off('notification', onNotification)
          unsub()
        }
      } catch (e) {
        console.warn('Failed to initialize notifications', e)
        setIsLoading(false)
      }
    }

    // call init and capture potential cleanup function
    let cleanup: void | (() => void)
    const p = init()
    p.then((maybe) => { if (typeof maybe === 'function') cleanup = maybe })

    return () => {
      mounted = false
      try {
        if (cleanup && typeof cleanup === 'function') cleanup()
      } catch {}
    }
  }, [])

  return (
    <div className={`relative ${hideOnMobile ? 'hidden sm:inline-flex' : ''}`} ref={ref}>
      <button
        aria-label="Notificações"
        className={`relative ${buttonClass}`}
        onClick={() => setOpen((s) => !s)}
        type="button"
      >
        {/* Bell icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 cursor-pointer ${iconClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        {hasNew && (
          <span className="absolute -top-1 -right-1 inline-flex h-3 w-3 rounded-full bg-red-500" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border rounded shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <div className="font-medium text-sm text-teal-700">Notificações</div>
            <button className="text-sm text-gray-500 cursor-pointer" onClick={() => setOpen(false)}>Fechar</button>
          </div>
          <div className="p-0 max-h-80 overflow-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {/* Skeleton loading for notifications */}
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications && notifications.length > 0 ? (
                notifications.map((n) => {
                  const isNew = newIds.has(n.id) || !n.visualizada
                  return (
                    <div
                      key={n.id}
                      className={`${isNew ? 'bg-gray-100' : 'bg-white'} px-4 py-3 border-b hover:bg-gray-50 cursor-pointer`}
                      onClick={async () => {
                        try {
                          // mark this notification as visualizada but keep it in the list
                          await fetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({ ids: [n.id] }), headers: { 'Content-Type': 'application/json' } })
                          setNotifications((prev) => prev.map((pn) => pn.id === n.id ? { ...pn, visualizada: true } : pn))
                          setNewIds((prev) => {
                            const copy = new Set(prev)
                            copy.delete(n.id)
                            return copy
                          })
                          // update hasNew based on the updated newIds set
                          setHasNew(() => {
                            // after removing this notification's id, check if any remain
                            const remainingNewIds = new Set(newIds)
                            remainingNewIds.delete(n.id)
                            return remainingNewIds.size > 0
                          })
                          // navigate based on notification type
                          try {
                            if (n.tipo === 'NOVA_PROPOSTA') {
                              router.push('/proposals/received')
                            } else if (n.tipo === 'PROPOSTA_ACEITA' || n.tipo === 'MATCH_CONFIRMADO') {
                              // Navigate through app route so layout and nav stay intact
                              router.push('/chat')
                              try {
                                if (n.propostaId) {
                                  sessionStorage.setItem('openMatchId', String(n.propostaId))
                                  window.dispatchEvent(new CustomEvent('open-chat', { detail: { matchId: String(n.propostaId) } }))
                                }
                              } catch {}
                            } else if (n.tipo === 'PROPOSTA_REJEITADA') {
                              router.push('/proposals/received')
                            } else {
                              router.push('/feed')
                            }
                          } catch (err) {
                            console.warn('Navigation failed', err)
                          }
                        } catch (e) {
                          console.warn('Failed to mark notification read', e)
                        }
                      }}
                    >
                      <div className="text-sm font-medium text-gray-800">{n.titulo}</div>
                      <div className="text-xs text-gray-600">{n.mensagem}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(n.criadaEm).toLocaleString()}</div>
                    </div>
                  )
                })
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center py-8">
                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <p className="text-sm font-medium text-gray-600">Nenhuma notificação</p>
                    <p className="text-xs text-gray-400 mt-1">Você está em dia!</p>
                  </div>
                </div>
              )}
            {notifications && notifications.length > 0 && (
              <div className="px-4 py-2 text-right">
                <button
                  className="text-xs text-teal-700"
                  onClick={async () => {
                    try {
                      const ids = notifications.map((n) => n.id)
                      await fetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({ ids }), headers: { 'Content-Type': 'application/json' } })
                      // keep notifications but mark them as visualizada in UI
                      setNotifications((prev) => prev.map((pn) => ({ ...pn, visualizada: true })))
                      setNewIds(new Set())
                      setHasNew(false)
                    } catch (e) {
                      console.warn('Failed to mark notifications read', e)
                    }
                  }}
                >Marcar todas como lidas</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
