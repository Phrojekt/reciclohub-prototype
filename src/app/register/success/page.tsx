"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"

export default function RegisterSuccess() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Image 
              src="/reciclohub.newLogo.svg" 
              alt="RecicloHub" 
              width={200}
              height={64}
              className="h-12 md:h-16 w-auto"
            />
          </div>
          <h2 className="text-xl font-medium text-teal-600 mb-2">Cadastro concluído!</h2>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-1 bg-teal-600 rounded-full"></div>
            <div className="w-8 h-1 bg-teal-600 rounded-full"></div>
            <div className="w-8 h-1 bg-teal-600 rounded-full"></div>
          </div>
          <p className="text-sm text-teal-600">
            Sua conta foi criada com sucesso.<br />
            Agora você pode acessar a plataforma RecicloHub!
          </p>
        </div>
        <div className="pt-8 flex flex-col items-center">
          <Link
            href="/login"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-base text-center"
          >
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  )
}