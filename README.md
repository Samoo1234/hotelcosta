# 🏨 Sistema de Gestão Hoteleira - Hotel Costa

Sistema completo de gestão hoteleira desenvolvido em React.js com Firebase, oferecendo controle total sobre hóspedes, consumos, produtos e checkout.

## 🚀 Características

- ✅ **Gestão de Hóspedes**: Cadastro, edição e acompanhamento em tempo real
- ✅ **Sistema de Consumos**: Controle de produtos consumidos por hóspede
- ✅ **Gerenciamento de Produtos**: CRUD completo de produtos e preços
- ✅ **Checkout Automático**: Cálculo automático de diárias e consumos
- ✅ **Geração de PDFs**: Fichas e comprovantes de checkout
- ✅ **Busca Inteligente**: Evita duplicação de cadastros
- ✅ **Sincronização em Tempo Real**: Firebase Firestore
- ✅ **Interface Responsiva**: Funciona em desktop e mobile

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React.js 19.1.0
- **Database**: Firebase Firestore
- **Styling**: CSS3 com design moderno
- **PDF Generation**: jsPDF
- **Icons**: Emojis nativos
- **Deploy**: Vercel Ready

## 📦 Instalação Local

```bash
# Clonar o repositório
git clone https://github.com/Samoo1234/hotelcosta.git

# Entrar no diretório
cd hotelcosta

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm start
```

## 🌍 Deploy na Vercel

### Opção 1: Deploy Automático via GitHub

1. Acesse [vercel.com](https://vercel.com)
2. Conecte sua conta GitHub
3. Importe o repositório `hotelcosta`
4. Configure as variáveis de ambiente do Firebase
5. Deploy automático! 🚀

### Opção 2: Deploy via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login na Vercel
vercel login

# Deploy
vercel --prod
```

## ⚙️ Configuração do Firebase

O projeto já está configurado com Firebase. Para usar seu próprio projeto:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative o Firestore Database
3. Configure as regras de segurança
4. Substitua as configurações em `src/firebase.js`

### Regras do Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## 📁 Estrutura do Projeto

```
src/
├── App.js                 # Componente principal
├── App.css               # Estilos globais
├── firebase.js           # Configuração Firebase
└── services/
    └── firestoreService.js # Serviços do Firebase
```

## 🎯 Funcionalidades Principais

### Gestão de Hóspedes
- Cadastro completo com dados pessoais
- Check-in automático com timestamp
- Cálculo automático de diárias
- Status de pagamento (Pago/Pendente)

### Sistema de Consumos
- Catálogo de produtos configurável
- Adição rápida de consumos
- Controle de quantidade
- Cálculo automático de totais

### Checkout
- Resumo completo da estadia
- Cálculo de diárias + consumos
- Geração automática de PDF
- Histórico de checkouts

### Relatórios
- Ficha completa do hóspede em PDF
- Comprovante de checkout
- Estatísticas em tempo real

## 🔧 Scripts Disponíveis

- `npm start` - Inicia servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm test` - Executa testes
- `npm run eject` - Ejeta configurações (não recomendado)

## 📱 Responsividade

O sistema é totalmente responsivo e funciona perfeitamente em:
- 💻 Desktop (1200px+)
- 📱 Tablet (768px - 1199px)
- 📱 Mobile (480px - 767px)
- 📱 Mobile Pequeno (< 480px)

## 🎨 Design

Interface moderna com:
- Cores suaves e profissionais
- Animações suaves
- Feedback visual para ações
- Loading states
- Modais intuitivos

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**Samoel Duarte**
- GitHub: [@Samoo1234](https://github.com/Samoo1234)
- Projeto: [Hotel Costa](https://github.com/Samoo1234/hotelcosta)

---

⭐ Se este projeto foi útil, considere dar uma estrela!
