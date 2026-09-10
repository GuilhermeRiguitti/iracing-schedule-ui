# Planner iRacing — 2026 Season 4

Interface para navegar o schedule oficial do iRacing: busca, filtros, paginação,
calendário semanal e controle do que falta comprar de conteúdo.

Next.js 16 + TypeScript + Tailwind v3. **Front-end puro** — `next build` gera
`./out`, que roda em qualquer hosting estático.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # gera ./out
```

## Telas

**Séries** (`/`) — as 151 séries da temporada. Busca por nome, carro ou pista.
Filtros por categoria, classe de licença, faixa de duração, formato
(voltas / tempo / heat), carro, pista, semana, fixed vs open e multiclasse.
Ordenação e paginação. Clicar abre o calendário completo da série com
condições, regras de incidente, split e settings de cada semana.

**Calendário** (`/calendario`) — escolhe a semana e vê todas as séries que
correm nela, com pista, duração e clima. A semana em andamento vem marcada.

**Conteúdo** (`/conteudo`) — carros e pistas com quantas séries usam cada um.
Marque o que já comprou; o resto é lista de compras. Com séries marcadas com ★,
mostra o que falta para rodar a temporada inteira nelas e em quais semanas cada
item aparece.

Favoritos e conteúdo marcado ficam em `localStorage`, por navegador.

## Dados

`public/data/schedule.json` — 971 KB (58 KB gzipado), carregado por fetch para
não pesar no bundle. O contrato está em `lib/types.ts`.

### Regerar a partir do PDF

```bash
pip install pdfplumber
python scripts/parse_pdf.py     # PDF -> raw.json
python scripts/build_data.py    # raw.json -> schedule.json
```

Depois copie `schedule.json` para `public/data/`. Para trocar de temporada,
baixe o PDF novo e ajuste a constante `PDF` no topo de `scripts/parse_pdf.py`.

### Como a extração funciona

O PDF tem camada de texto real e colunas em coordenadas fixas
(x = 58 / 158 / 358 / 518), com hierarquia por fonte: Helvetica-Bold 14 para
cabeçalhos, Bold 12 para regras, Helvetica 9 para o grid de semanas. A extração
é determinística, não heurística.

Casos tratados que um parser ingênuo erra:

- Número de página (Helvetica 12 no rodapé) grudava no nome da pista.
- Séries de carro rotativo (Draft Master, Ring Meister, Outlaw Micro) listam os
  carros dentro da coluna da pista, semana a semana.
- Dirt oval usa `H:8L C:10L F:50L` (bateria / repescagem / final).
- Regras por carro (`NGC: 8 tire sets`) vêm misturadas na coluna de settings.
- Duração aparece em três formatos: voltas, minutos e heat.

Números conferidos contra as 202 páginas: 151 séries, 1.989 semanas,
251 configurações de pista, 145 carros.

### Ressalva conhecida

As 251 "pistas" são **configurações**, não pacotes de compra. Charlotte aparece
como Oval, Legends Oval, Roval e Road Course separadamente, mas na loja é um
pacote só. A aba Conteúdo avisa sobre isso. O PDF não traz o `package_id`, então
não dá pra agrupar a partir dele — só a Data API resolveria, e a emissão de
credenciais OAuth está pausada pelo iRacing desde março de 2026.
