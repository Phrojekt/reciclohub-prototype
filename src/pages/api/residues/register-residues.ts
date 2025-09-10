// Interface local para ImagemResiduos
interface ImagemResiduos {
  id: number;
  url: string;
  residuoId: number;
}
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { uploadFileToS3 } from "@/lib/s3";
import formidable, { File as FormidableFile } from "formidable";
import { Server as IOServer } from "socket.io";

export const config = {
  api: {
    bodyParser: false,
  },
};

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const form = new formidable.IncomingForm({ multiples: true });
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({ error: "Erro ao processar o formulário" });
      }

      // Validação dos campos obrigatórios
      const requiredFields = [
        "tipoResiduo",
        "descricao",
        "quantidade",
        "unidade",
        "condicoes",
        "disponibilidade",
        "empresaId",
        "userId",
      ];
      for (const field of requiredFields) {
        if (!fields[field] || (typeof fields[field] === "string" && (fields[field] as string).trim() === "")) {
          return res.status(400).json({ error: `Por favor, preencha o campo obrigatório: ${field}.` });
        }
      }

      // Validação de imagens obrigatória
      const imagens = files.imagens || files.images || files.image;
      let imagensArray: FormidableFile[] = [];
      if (Array.isArray(imagens)) imagensArray = imagens;
      else if (imagens) imagensArray = [imagens];

      if (!imagensArray.length) {
        return res.status(400).json({ error: "Pelo menos 1 imagem é obrigatória para cadastrar um resíduo." });
      }
      if (imagensArray.length > 5) {
        return res.status(400).json({ error: "Você pode enviar no máximo 5 imagens por resíduo." });
      }

      // Upload para S3
      const imagensUrls: string[] = [];
      for (const file of imagensArray) {
        try {
          const url = await uploadFileToS3({
            filepath: file.filepath as string,
            originalFilename: file.originalFilename || file.newFilename || "imagem.jpg",
            mimetype: file.mimetype || "image/jpeg",
          });
          imagensUrls.push(url);
        } catch (err) {
          console.error("Erro ao enviar imagem para S3:", err);
        }
      }

      if (!imagensUrls.length) {
        return res.status(500).json({ error: "Falha ao enviar imagens para o S3." });
      }

      // Cria o resíduo
      const residuo = await prisma.residuos.create({
        data: {
          tipoResiduo: Array.isArray(fields.tipoResiduo) ? fields.tipoResiduo[0] : fields.tipoResiduo ?? "",
          descricao: Array.isArray(fields.descricao) ? fields.descricao[0] : fields.descricao ?? "",
          quantidade: parseFloat(Array.isArray(fields.quantidade) ? fields.quantidade[0] : fields.quantidade ?? "0"),
          unidade: Array.isArray(fields.unidade) ? fields.unidade[0] : fields.unidade ?? "",
          condicoes: Array.isArray(fields.condicoes) ? fields.condicoes[0] : fields.condicoes ?? "",
          disponibilidade: Array.isArray(fields.disponibilidade) ? fields.disponibilidade[0] : fields.disponibilidade ?? "",
          preco: fields.preco ? (Array.isArray(fields.preco) ? fields.preco[0] : fields.preco) : null,
          empresaId: Number(fields.empresaId),
          userId: String(fields.userId),
        },
      });

      // Cria as imagens
      const imagensCriadas: ImagemResiduos[] = [];
      for (const url of imagensUrls) {
        try {
          const imagemCriada = await prisma.imagemResiduos.create({
            data: {
              url,
              residuoId: residuo.id,
            },
          });
          imagensCriadas.push(imagemCriada);
        } catch (imgError) {
          console.error("Erro ao salvar imagem no banco:", imgError);
        }
      }

      // Emite evento via Socket.IO para atualização instantânea
      interface SocketWithIO extends NodeJS.Socket {
        server: {
          io?: IOServer;
        };
      }
      const socketWithIO = res.socket as unknown as SocketWithIO;
      const io: IOServer | undefined = socketWithIO.server.io;
      if (io) {
        io.emit("data-updated", {
          resource: "residuo",
          action: "created",
          id: residuo.id,
          payload: {
            id: residuo.id,
            tipoResiduo: residuo.tipoResiduo,
            descricao: residuo.descricao,
            quantidade: residuo.quantidade,
            unidade: residuo.unidade,
            condicoes: residuo.condicoes,
            disponibilidade: residuo.disponibilidade,
            preco: residuo.preco,
            empresaId: residuo.empresaId,
            userId: residuo.userId,
            imagens: imagensCriadas.map(img => ({ id: img.id, url: img.url })),
          }
        });
      }
      return res.status(201).json({
        success: true,
        id: residuo.id,
        imagensCreated: imagensCriadas.length,
      });
    });
  } catch (error) {
    console.error("Erro geral na rota de registro:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Erro interno do servidor ao cadastrar resíduo.",
    });
  }
}
