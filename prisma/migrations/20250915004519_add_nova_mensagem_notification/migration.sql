-- AlterEnum
ALTER TYPE "TipoNotificacao" ADD VALUE 'NOVA_MENSAGEM';

-- AlterTable
ALTER TABLE "notificacoes" ADD COLUMN     "mensagemId" INTEGER;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_mensagemId_fkey" FOREIGN KEY ("mensagemId") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
