# MatchImovel em motion design (Remotion)

Duas apresentações verticais (1080×1920, 30fps) feitas em código com Remotion:

| Composição | Público | Duração |
|---|---|---|
| `Corretor` | Corretor que traz o imóvel | ~56s (com narração) |
| `Comprador` | Lead que quer comprar | ~50s (com narração) |

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

## Narração

As vozes ficam em `src/corretor/audios/corretor_voz.mp3` e `src/comprador/audios/comprador_voz.mp3`
(um único arquivo por vídeo, com todas as frases). Em `Corretor.tsx` e `Comprador.tsx`, a lista `FALAS` diz onde cada frase começa e termina no MP3 (em segundos);
cada frase toca no início da cena correspondente. Se gerar a voz de novo, atualize esses tempos.

## Trilha sonora

A música fica em `public/musica.m4a` e é a mesma nos dois vídeos. Em `src/config.ts`:

- `MUSICA`: nome do arquivo em `public/` (ou `null` para gerar sem música);
- `MUSICA_VOLUME_PAUSA`: volume nos intervalos sem voz;
- `MUSICA_VOLUME_VOZ`: volume enquanto a voz fala (a música abaixa sozinha, com rampa suave).

## Onde mexer

- **Textos, ordem e duração das cenas:** `src/corretor/Cenas.tsx` + `src/corretor/Corretor.tsx` (e o mesmo em `src/comprador/`).
- **Transições:** a lista `CENAS` em `Corretor.tsx`/`Comprador.tsx` define a transição de entrada de cada cena; as opções ficam em `src/components/transitions.tsx`.
- **Cores e fontes:** `src/theme.ts` (paleta do site: indigo `#4F46E5`, roxo `#9333EA`, fontes Outfit e Inter).
- **Destaque em degradê nos títulos:** escreva o trecho entre asteriscos, ex.: `"Descreva o imóvel\n*do seu jeito*"`.

## Celular 3D (teste)

A composição `Teste3D` mostra um celular 3D sobre uma mesa recebendo a notificação de match
(`src/tres/`). O render usa WebGL; num PC com placa de vídeo é rápido, em máquinas sem GPU fica lento.

Crédito obrigatório do modelo 3D (CC BY 4.0, incluir na legenda ao publicar):
"Realistic Smartphone 3D Model" (https://sketchfab.com/3d-models/realistic-smartphone-3d-model-77e5794dde144965b5bd4aeab9cb50e8)
por LukeModels75 (https://sketchfab.com/lucasgamerbdf), licenciado sob CC-BY-4.0.

As telas foram recriadas a partir dos prints do sistema, com dados fictícios.
