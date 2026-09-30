require("dotenv").config();

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const Groq = require("groq-sdk");
const path = require("path");

const app = express();

const upload = multer({
    limits: {
        fileSize: 20 * 1024 * 1024
    }
});

app.use(cors());

// Seu HTML antigo ficará na pasta public
app.use(express.static(path.join(__dirname, "public")));

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

app.post("/analisar", upload.single("imagem"), async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                erro: "Nenhuma imagem foi enviada."
            });
        }

        // Converte a imagem para Base64
        const base64 = req.file.buffer.toString("base64");

        // Envia a imagem para a Groq
        const resposta = await groq.chat.completions.create({

            model: "qwen/qwen3.8-27b",

            messages: [
                {
                    role: "user",

                    content: [

                        {
                            type: "text",

                            text: `
Você é a IA visual do projeto escolar DITTO.

Analise cuidadosamente a imagem enviada e responda em português do Brasil.

IMPORTANTE:
- Descreva somente o que pode ser observado na imagem.
- Não identifique pessoas reais.
- Se houver um personagem fictício reconhecível, informe o nome se puder.
- Se houver um animal, informe a espécie provável.
- Diferencie fatos observáveis de estimativas.
- Não invente informações que não aparecem na imagem.

Organize a resposta assim:

🔎 IDENTIFICAÇÃO

Tipo:
Nome/espécie/personagem:
Confiança:

👁️ DESCRIÇÃO VISUAL

Descrição:

🧬 CARACTERÍSTICAS

Cor predominante:
Cor dos olhos:
Tamanho/porte:
Características físicas:
Roupas/acessórios:
Outros detalhes:

📝 OBSERVAÇÕES

Limitações:

FORMATAÇÃO DA RESPOSTA:
- Não use Markdown.
- Não use asteriscos ou símbolos como **.
- Não use hashtags.
- Use títulos simples.
- Separe cada seção com uma linha em branco.
- Escreva de forma clara e adequada para um trabalho escolar.

Finalize com um resumo curto.
`
                        },

                        {
                            type: "image_url",

                            image_url: {
                                url: `data:${req.file.mimetype};base64,${base64}`
                            }

                        }

                    ]

                }

            ],

            max_completion_tokens: 1500

        });

        const descricao =
            resposta.choices?.[0]?.message?.content ||
            "A IA não retornou uma descrição.";

        res.json({
            sucesso: true,
            descricao: descricao
        });

    } catch (erro) {

        console.error("ERRO GROQ:", erro);

        res.status(500).json({
            sucesso: false,
            erro: erro.message || "Erro ao consultar a Groq."
        });

    }

});

const PORTA = 3000;

app.listen(PORTA, () => {

    console.log("");
    console.log("================================");
    console.log("       DITTO AI - GROQ");
    console.log("================================");
    console.log("");
    console.log(`Site: http://localhost:${PORTA}`);
    console.log("");
});
