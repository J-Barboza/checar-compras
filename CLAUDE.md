# Checar Compras

App Android (React Native + Expo SDK 58, TypeScript) para registrar preços durante a compra no supermercado e conferir com o total do caixa. Tudo fica no aparelho.

- **Especificação (fonte da verdade):** `docs/checar-compras-especificacao.md`. Leia as seções relevantes antes de mudar comportamento.
- **Protótipo aprovado (layout e paleta azul):** https://claude.ai/artifact/Rj3hHY1ZjAPvsY2akHcNPa
- `AGENTS.md` veio do template do Expo. Duas orientações dele **não** são seguidas aqui, de propósito:
  - Navegação por estado em `App.tsx`, sem Expo Router (são poucas telas e todas compartilham a compra em andamento).
  - Build local com Gradle, sem EAS.
  - O restante continua valendo, em especial: consultar a documentação versionada do Expo antes de usar uma API e instalar pacotes com `npx expo install`.

## Estrutura

```
App.tsx                  estado global (compra, tela), botão voltar do Android, aviso de orçamento, toast
src/domain/              lógica pura e testada (sem React Native)
  money.ts               parse/format de R$ ("1.234,56"), arredondamento em centavos
  purchase.ts            itens, totais, FLV kg/un, leitura repetida, orçamento, tolerância, ordenação
  purchase.test.ts       testes Jest
  priceOcr.ts            escolhe o preço entre as linhas do OCR (vírgula perdida, centavos sobrescritos)
src/data/
  db.ts                  SQLite: products (apelido + último preço), flv_history, kv (compra em andamento, tolerância, mercados)
  openFoodFacts.ts       sugestão de nome pelo código de barras (timeout de 4 s, falha em silêncio)
  labelOcr.ts            OCR da foto da etiqueta (ML Kit no aparelho); apaga a foto depois
src/ui/                  theme.ts (cores/fonte), components.tsx (Button, Header, MoneyField…), ItemRow.tsx
src/screens/             Home, NewPurchase, List (+ folha de edição), Scan, Flv, Check, Done, Config
```

## Comandos (a partir da raiz do projeto)

```bash
npm test                    # Jest (lógica de domínio)
npx tsc --noEmit            # checagem de tipos
npx expo prebuild --platform android --no-install   # regenera android/ a partir do app.json
cd android && JAVA_HOME=/usr/lib/jvm/java-17-openjdk ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
adb install -r android/app/build/outputs/apk/release/app-release.apk
adb shell am start -n com.jbarboz.checar_compras/.MainActivity
```

- O JDK padrão do sistema é o 11; o build exige o 17 (`JAVA_HOME` acima).
- Celular de teste: Galaxy M52 (Android 13), via USB/adb.
- O release é assinado com a chave de debug, o que só serve para teste.

## Armadilhas conhecidas

- **Não edite `android/` à mão.** A pasta é gerada pelo `prebuild` e está no `.gitignore`. Configuração nativa vai no `app.json` (plugins `expo-camera` e `expo-build-properties`).
- **Leitura de código de barras × R8:** com a otimização ligada (`enableMinifyInReleaseBuilds`), o R8 remove o ML Kit, que o expo-camera procura via `Class.forName`, e a leitura para sem nenhum erro. Uma regra `-keep` parcial fez o app fechar ao abrir (`MlKitInitProvider`). Por isso a otimização está **desligada** pelo `expo-build-properties`. Antes de religar no APK final, teste a leitura no aparelho.
- `onBarcodeScanned` dispara várias vezes por segundo; `ScanScreen` usa um `ref` de trava.
- Teclado: `KeyboardAvoidingView behavior="padding"` em `App.tsx` (o Android é edge-to-edge).

## Estado (27/10/2026)

**Atualizado em:** 2026-10-27
**Próximo passo:** analisar o resultado do teste do OCR no supermercado (fotos das etiquetas que falharem ficam em `image/`) e ajustar `priceOcr.ts`.

**Sessão de 27/10:** OCR corrigido com base em logs reais do ML Kit (vírgula perdida "1899" e centavos sobrescritos "47" + "15"; 8 de 9 leituras certas), branch `uat` criada e publicada, APK da `uat` instalado nos dois celulares (Galaxy M52 `RQCT6010AWX` e SM-S731B `RQGYB08KQ4Y`, este o do supermercado), pasta `image/` no `.gitignore`. Pendente: resultado do teste no supermercado.

**APK de teste 1 instalado e funcionando:** nova compra (mercado + orçamento), leitura de código pela câmera ou digitação, apelido com sugestão do Open Food Facts, último preço do produto, preço digitado, leitura repetida soma +1, FLV por kg ou unidade com último preço, edição e remoção de item, aviso de orçamento, conferência (ordem de coleta ou A a Z, marcar itens, total do caixa, tolerância), resultado e configuração da tolerância. A compra em andamento persiste se o app fechar. São 21 testes passando.

**APK de teste 2 (branch `uat`, em teste no supermercado):** preço pela foto da etiqueta (OCR com ML Kit no aparelho). O valor lido só preenche o campo e o usuário confirma ou corrige. Em 9 leituras de cartazes reais, 8 deram o preço certo; a que errou foi porque o ML Kit não leu os reais. Para diagnosticar falhas, registre no log as linhas e as posições (`frame`) devolvidas pelo `TextRecognition.recognize` e leia com `adb logcat`.

**Próximo APK (ainda não feito):**
1. Ajustes do OCR conforme o teste no supermercado.
2. Comprovante para contestação (30 dias, exclusão manual) e ranking por supermercado (spec 4.8 e 4.9).
3. Expiração da compra abandonada (5 h ou virada do dia) com aviso ao reabrir (spec 4.10).
4. Remover item deslizando, mantendo o botão como alternativa.
5. Ícone próprio do app e modo escuro.

Git: fluxo `develop` (desenvolvimento) → `uat` (APK em teste/avaliação) → `main` (quando estiver bom). O usuário não quer `master`. Commits por bloco lógico (spec seção 10), autor `jose.f.barboza@outlook.com` (e-mail pessoal do GitHub, usuário `j-barboza`), configurado só neste repositório. O e-mail global do computador é o corporativo: não use. Remoto: https://github.com/J-Barboza/checar-compras (privado até o app ficar completo, quando vira público). Já publicado: não reescreva o histórico.
