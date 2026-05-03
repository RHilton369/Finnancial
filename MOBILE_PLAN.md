# 📱 FinanZen Mobile: Plano de Implementação APK

Para transformar o FinanZen em um aplicativo Android (APK) profissional, seguiremos a estratégia de **Híbrido Nativo** usando **Capacitor**.

## 1. Estratégia: PWA + Capacitor
Não reconstruiremos o app do zero. Aproveitaremos a interface Next.js já polida e responsiva.

### Passos Técnicos:
1. **PWA (Progressive Web App):** Adicionar um `manifest.json` e `service-workers` para permitir a instalação via navegador e funcionamento offline básico.
2. **Capacitor Core:** Instalar o `@capacitor/core` e `@capacitor/android` no projeto frontend.
3. **Build de Produção:** Gerar o build estático do Next.js (`npm run build`).
4. **Sincronização Nativa:** Usar o comando `npx cap add android` para criar o projeto Android Studio.
5. **Geração do APK:** Usar o Gradle para compilar o arquivo `.apk` final.

## 2. Funcionalidades Mobile Exclusivas
- **Notificações Push:** Avisar sobre gastos via sistema do Android, além do WhatsApp.
- **Biometria:** Bloquear o acesso ao app com Digital ou Reconhecimento Facial.
- **Câmera Integrada:** Tirar foto do recibo direto pelo app (sem precisar abrir o WhatsApp).

## 3. Cronograma sugerido
- **Semana 1:** Conversão para PWA e testes de responsividade extrema.
- **Semana 2:** Configuração do Capacitor e testes em Emulador Android.
- **Semana 3:** Geração do APK Assinado e distribuição para teste.

---
*Este plano garante que o investimento feito no código atual seja 100% aproveitado no ambiente móvel.*
