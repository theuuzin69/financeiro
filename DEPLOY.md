# Como Publicar na Nuvem (Vercel) e Instalar no iPhone

Este guia rápido explica como colocar seu aplicativo financeiro na nuvem gratuitamente em 2 minutos para que as automações do seu iPhone funcionem em qualquer lugar (4G/5G, rua, restaurantes, etc.).

---

## Passo 1: Publicar na Vercel (Gratuito)

A Vercel é a plataforma oficial dos criadores do Next.js e oferece hospedagem gratuita com suporte a HTTPS e domínios automáticos.

1. Acesse [vercel.com](https://vercel.com) e faça login (com sua conta do GitHub).
2. Clique em **"Add New..." > "Project"**.
3. Conecte este repositório do GitHub (ou use a CLI da Vercel no terminal):
   ```bash
   npm i -g vercel
   vercel
   ```
4. A Vercel detectará automaticamente que é um projeto Next.js. Clique em **Deploy**.
5. Em segundos você terá um link seguro com HTTPS, como:
   `https://seu-controle-financeiro.vercel.app`

---

## Passo 2: Instalar no iPhone como App Nativo (PWA)

1. No seu **iPhone**, abra o **Safari**.
2. Acesse a URL gerada pela Vercel (`https://seu-controle-financeiro.vercel.app`).
3. Toque no botão de **Compartilhar** (ícone do quadrado com a seta para cima na barra inferior do Safari).
4. Role para baixo e toque em **"Adicionar à Tela de Início"** (*Add to Home Screen*).
5. Defina o nome como **"Finanças Pro"** e toque em **Adicionar**.
6. Pronto! O aplicativo agora abre em tela cheia, sem barras do navegador, exatamente como um app da App Store.

---

## Passo 3: Configurar a Automação do Apple Pay no iPhone

1. Abra o app **Atalhos (Shortcuts)** no seu iPhone.
2. Toque na aba central inferior **Automação**.
3. Toque no botão **+** no canto superior direito.
4. Escolha **Transação** (ícone de cartão da Carteira).
5. Selecione:
   - **Cartão:** Qualquer Cartão (ou seu cartão Santander / principal).
   - **Categoria:** Qualquer.
   - **Executar:** Marque **Executar Imediatamente**.
   - Desmarque **Notificar ao Executar** (para rodar 100% invisível em segundo plano).
6. Toque em **Avançar** e depois em **Nova Automação em Branco**.
7. Toque em **Adicionar Ação** e pesquise por **"Obter Conteúdo de URL"**.
8. Configure a ação:
   - **URL:** `https://seu-controle-financeiro.vercel.app/api/webhook/apple-pay`
   - **Método:** `POST`
   - **Cabeçalhos:**
     - `Content-Type`: `application/json`
   - **Corpo da Requisição:** `JSON`
     - Adicione os campos tocando nas variáveis da automação:
       - `amount`: selecione a variável **Entrada do Atalho > Valor**
       - `merchant`: selecione a variável **Entrada do Atalho > Comerciante**
       - `category`: selecione a variável **Entrada do Atalho > Categoria**
       - `card`: selecione a variável **Entrada do Atalho > Cartão**
       - `secret`: `iphone_secret_key_santander_2026`
9. Toque em **Concluído**.

Pronto! A partir desse momento, qualquer compra por aproximação na maquininha ou compra online via Apple Pay será lançada e categorizada no seu aplicativo instantaneamente.
