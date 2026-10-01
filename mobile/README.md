# App das lojas (Capacitor)

Empacota o app web (`../HTML/carro-facil`) como app nativo iOS e Android. O código do app continua um só.

```bash
cd mobile
npm install
npm run assets     # gera ícones e splash a partir de assets/*.png
npm run sync       # copia o app web para www/ e sincroniza android/ e ios/
npm run android    # abre no Android Studio  (precisa do Android Studio)
npm run ios        # abre no Xcode            (precisa de um Mac)
```

## Antes do primeiro build de loja
1. **Firebase** (envio de notificações): crie o projeto, registre os apps `com.cademeucarro.app` (Android e iOS) e baixe
   `google-services.json` → `android/app/` e `GoogleService-Info.plist` → `ios/App/App/` (adicione ao alvo no Xcode).
   No iOS, envie a chave APNs (.p8) em Firebase → Configurações → Cloud Messaging.
   Cole o JSON da **conta de serviço** (Configurações → Contas de serviço) em `config_privada.fcm_service_account` no Supabase.
2. **Xcode** → alvo App → Signing & Capabilities: escolha o time, adicione **Push Notifications**, **Background Modes → Remote notifications** e **Sign in with Apple**.
3. **Login social**: no Supabase Auth, ative Google e Apple e inclua `com.cademeucarro.app://auth` em *Redirect URLs*.
4. **Android**: gere o keystore de upload, configure a assinatura em `android/app/build.gradle` (ou use o Play App Signing) e rode `./gradlew bundleRelease`.
5. Preencha `js/config.js` (razão social, CNPJ, e-mails) e revise os textos de `js/legal.js` com um advogado.
6. Troque `appId` (`com.cademeucarro.app`) se quiser outro identificador, em: `capacitor.config.json`, `android/app/build.gradle`, `Info.plist`, `AndroidManifest.xml` e `CF_CONFIG.appScheme`.

O workflow `.github/workflows/mobile.yml` gera um APK de teste no GitHub (sem assinatura de loja).
Ainda NÃO foi executado: o primeiro build real pode pedir ajustes.
