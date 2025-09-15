import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret"

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || ''
    const match = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('token='))
    if (!match) return NextResponse.json({ authenticated: false }, { status: 200 })
    const token = match.split('=')[1]
    try {
      const payload = jwt.verify(token, JWT_SECRET) as unknown
      const payloadObj = typeof payload === 'object' && payload !== null ? payload as Record<string, unknown> : null
      const userId = payloadObj && payloadObj.sub ? Number(payloadObj.sub) : NaN
      if (isNaN(userId)) return NextResponse.json({ authenticated: false }, { status: 200 })
      const user = await prisma.empresas.findUnique({ where: { id: userId } })
      if (!user) return NextResponse.json({ authenticated: false }, { status: 200 })
      return NextResponse.json({ authenticated: true, id: user.id, email: user.email, nome: user.nome, empresaId: user.id })
    } catch {
      return NextResponse.json({ authenticated: false }, { status: 200 })
    }
  } catch (e) {
    console.error('me route failed', e)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}
