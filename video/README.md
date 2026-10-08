# MatchImovel em motion design (Remotion)

Duas apresentações verticais (1080×1920, 30fps) feitas em código com Remotion:

| Composição | Público | Duração |
|---|---|---|
| `Corretor` | Corretor que traz o imóvel | ~42s |
| `Comprador` | Lead que quer comprar | ~39s |

## Rodar no seu computador (Windows)

```powershell
cd video
npm install
npm run dev
```

O Remotion Studio abre em `http://localhost:3000`. Lá dá para assistir, avançar quadro a quadro e editar os textos com atualização ao vivo.

## Gerar os MP4

```powershell
npm run render:corretor
npm run render:comprador
```

Os arquivos saem em `video/out/` (pasta ignorada pelo git).

## Trilha sonora

1. Coloque o arquivo em `video/public/` (ex.: `public/musica.mp3`).
2. Em `src/config.ts`, troque `MUSICA = null` por `MUSICA = "musica.mp3"`.

## Onde mexer

- **Textos, ordem e duração das cenas:** `src/corretor/Cenas.tsx` + `src/corretor/Corretor.tsx` (e o mesmo em `src/comprador/`).
- **Transições:** a lista `CENAS` em `Corretor.tsx`/`Comprador.tsx` define a transição de entrada de cada cena; as opções ficam em `src/components/transitions.tsx`.
- **Cores e fontes:** `src/theme.ts` (paleta do site: indigo `#4F46E5`, roxo `#9333EA`, fontes Outfit e Inter).
- **Destaque em degradê nos títulos:** escreva o trecho entre asteriscos, ex.: `"Descreva o imóvel\n*do seu jeito*"`.

As telas foram recriadas a partir dos prints do sistema, com dados fictícios.
