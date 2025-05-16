# PedMoto

PedMoto é um aplicativo móvel que conecta usuários a serviços de entrega por motocicleta no Brasil. Acesse [www.pedmoto.com.br](https://www.pedmoto.com.br) para mais detalhes.

## Pré-requisitos

- **Node.js:** v16 ou superior
- **Ionic CLI:**  
    ```bash
    npm install -g @ionic/cli
    ```
- **Cordova:**  
    ```bash
    npm install -g cordova@latest
    ```
- **Android SDK:** Configurado com a variável de ambiente `ANDROID_HOME`
- **Java JDK:** Versão 8 ou superior
- **Gradle:** Versão 4.10.3 ou compatível
- **Keystore:** Para assinar o APK (ex.: `my-release-key-ORIGINAL.keystore`)

## Configuração do Projeto

1. **Clone o repositório:**
     ```bash
     git clone <url-do-repositório>
     cd PedMoto/Client
     ```
2. **Instale as dependências:**
     ```bash
     npm install
     ```
3. **Adicione a plataforma Android:**
     ```bash
     ionic cordova platform add android@latest
     ```

## Compilando o Aplicativo

Um script de compilação (`sign-apk.sh`) é fornecido para gerar e assinar o APK de release.

### Script de Compilação (`sign-apk.sh`)
```bash
#!/bin/bash

# Compila o APK de release com otimizações
ionic cordova build android --release --aot --minifyjs --minifycss

# Navega para o diretório da plataforma Android
cd platforms/android

# Assina o APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
    -storepass "123diego" -keypass "123diego" \
    -keystore /home/diego/Downloads/my-release-key-ORIGINAL.keystore \
    ./app/build/outputs/apk/release/app-release.apk Principal

# Alinha o APK
zipalign -v 4 ./app/build/outputs/apk/release/app-release.apk /tmp/app-release-signed.apk

# Verifica o APK assinado
apksigner verify /tmp/app-release-signed.apk
```

## Como Usar o Script de Compilação

1. Certifique-se de que o arquivo de keystore está em `/home/diego/Downloads/my-release-key-ORIGINAL.keystore`.
2. Torne o script executável:
     ```bash
     chmod +x sign-apk.sh
     ```
3. Execute o script:
     ```bash
     ./sign-apk.sh
     ```
4. O APK assinado será gerado em `/tmp/app-release-signed.apk`.

## Solução de Problemas na Compilação

- Atualize o Cordova se houver erros:
    ```bash
    npm install -g cordova@latest
    ```
- Reinstale a plataforma Android:
    ```bash
    ionic cordova platform rm android && ionic cordova platform add android@latest
    ```
- Execute com saída detalhada para depuração:
    ```bash
    ionic cordova build android --release --verbose
    ```

## Configurando o Arquivo de Assinatura

Para assinar o APK, configure os detalhes do keystore em `platforms/android/release-signing.properties`.

### Criar `release-signing.properties`

No diretório `platforms/android`, crie ou edite o arquivo `release-signing.properties`:
```properties
key.store=/home/diego/Downloads/my-release-key-ORIGINAL.keystore
key.store.password=123diego
key.alias=Principal
key.alias.password=123diego
```

### Atualizar `build.gradle`

Certifique-se de que o `platforms/android/build.gradle` referencia o arquivo de assinatura e inclui a configuração de assinatura para release:
```gradle
ext.cdvReleaseSigningPropertiesFile = '/home/diego/Downloads/release-signing.properties'

if (cdvReleaseSigningPropertiesFile) {
        signingConfigs {
                release {
                        storeFile file('/home/diego/Downloads/my-release-key-ORIGINAL.keystore')
                        storePassword '123diego'
                        keyAlias 'Principal'
                        keyPassword '123diego'
                }
        }
        buildTypes {
                release {
                        signingConfig signingConfigs.release
                        minifyEnabled true
                        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
                }
        }
}
```

## Modificando Senhas

As senhas padrão em `release-signing.properties` e `sign-apk.sh` são `123diego`. Para maior segurança, atualize-as:

- **Atualize `release-signing.properties`:**
    - Altere `key.store.password` e `key.alias.password` para uma senha segura.
    - Exemplo:
        ```properties
        key.store=/home/diego/Downloads/my-release-key-ORIGINAL.keystore
        key.store.password=sua_senha_segura
        key.alias=Principal
        key.alias.password=sua_senha_segura
        ```
- **Atualize `sign-apk.sh`:**
    - Substitua `123diego` pela sua senha segura no comando `jarsigner`.
    - Exemplo:
        ```bash
        jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
            -storepass "sua_senha_segura" -keypass "sua_senha_segura" \
            -keystore /home/diego/Downloads/my-release-key-ORIGINAL.keystore \
            ./app/build/outputs/apk/release/app-release.apk Principal
        ```
- **Atualize `build.gradle`:**
    - Se usar senhas diretamente, atualize `storePassword` e `keyPassword` no bloco `signingConfigs.release` para corresponder à sua senha segura.
    - Para maior segurança, remova senhas hardcoded e use apenas o `release-signing.properties`.

> **Nota de Segurança:**  
> Evite incluir senhas em scripts ou no `build.gradle`. Considere usar variáveis de ambiente ou solicitar senhas durante a compilação.

## Verificando o Keystore

Para confirmar os detalhes do keystore:
```bash
keytool -list -v -keystore /home/diego/Downloads/my-release-key-ORIGINAL.keystore -storepass sua_senha_segura
```
Verifique se o alias (`Principal`) e as senhas correspondem à configuração.

## Notas Adicionais

- **Dependências:** O aplicativo usa Firebase (`cordova-plugin-fcm-with-dependecy-updated`) para notificações push. Certifique-se de que o arquivo `google-services.json` está em `platforms/android`.
- **Ferramentas do Android SDK:** Confirme que `zipalign` e `apksigner` estão disponíveis em `$ANDROID_HOME/build-tools/<versão>`.
- **AAB para Google Play:** Se for publicar na Google Play, compile um AAB:
    ```bash
    ionic cordova build android --release --aot --minifyjs --minifycss
    cd platforms/android
    ./gradlew bundleRelease
    ```
    Assine o AAB com `jarsigner` ou `bundletool` para distribuição.
- **ProGuard:** A compilação de release usa ProGuard para otimização. Personalize as regras em `platforms/android/app/proguard-rules.pro`, se necessário.
- **Configuração do Ambiente:**
    - Defina `ANDROID_HOME`:
        ```bash
        export ANDROID_HOME=/caminho/para/android-sdk
        ```
    - Adicione ao `~/.bashrc` ou equivalente para persistência.

## Licença

Este projeto é proprietário. Contate a equipe PedMoto para detalhes de licenciamento.
