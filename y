rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras de desenvolvimento - PERMITIR TUDO
    // ⚠️ IMPORTANTE: Alterar para regras de produção antes do lançamento!
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
