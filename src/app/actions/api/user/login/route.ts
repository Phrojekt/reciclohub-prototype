import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const prisma = new PrismaClient()

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    // Validação básica
    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 })
    }

    // Busca usuário/empresa pelo email
    const user = await prisma.empresas.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 })
    }

    // Verifica a senha (bcrypt)
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ error: "Senha incorreta." }, { status: 401 })
    }

    // Criar JWT com claims mínimos
    const token = jwt.sign({ sub: String(user.id), empresaId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })

    // Configurar cookie seguro (httpOnly). Em desenvolvimento `secure` fica false
    const secure = process.env.NODE_ENV === 'production'
    const cookie = `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${secure ? '; Secure' : ''}`

    const res = NextResponse.json({ id: user.id, email: user.email, nome: user.nome, empresaId: user.id }, { status: 200 })
    res.headers.set('Set-Cookie', cookie)
    return res

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao realizar login." }, { status: 500 })
  }
}

// Exemplo dentro do seu código de login/cadastro, após o fetch:
// localStorage.setItem("userId", data.id)
// localStorage.setItem("empresaId", data.empresaId) // data.empresaId precisa existir!