import React, { useState, useEffect } from 'react';
import './App.css';
import jsPDF from 'jspdf';

function App() {
  const [hospedes, setHospedes] = useState([
    { id: 1, data: "09/05/2025", nome: "Shirlene Maria Silva (Cir)", telefone: "(11) 98765-4321", rg: "12.345.678-9", cpf: "123.456.789-00", cnh: "12345678901", quartos: 190, pago: "PG", valorDiaria: 150.00, checkIn: "2025-05-09T12:00", consumos: [], statusHospedagem: "ATIVO" },
    { id: 2, data: "09/05/2025", nome: "José Hamilton", telefone: "(11) 97654-3210", rg: "23.456.789-0", cpf: "234.567.890-11", cnh: "23456789012", quartos: 180, pago: "PG", valorDiaria: 150.00, checkIn: "2025-05-09T14:30", consumos: [], statusHospedagem: "ATIVO" },
    { id: 3, data: "09/05/2025", nome: "Fábio (Vitória)", telefone: "(11) 96543-2109", rg: "34.567.890-1", cpf: "345.678.901-22", cnh: "", quartos: 50, pago: "PG", valorDiaria: 300.00, checkIn: "2025-05-09T16:00", consumos: [], statusHospedagem: "ATIVO" },
    { id: 4, data: "09/05/2025", nome: "Ivanilda Moreira da Silva", telefone: "(11) 95432-1098", rg: "45.678.901-2", cpf: "456.789.012-33", cnh: "45678901234", quartos: 240, pago: "PG", valorDiaria: 360.00, checkIn: "2025-05-09T10:15", consumos: [], statusHospedagem: "ATIVO" },
    { id: 5, data: "09/05/2025", nome: "Darlan da Silva", telefone: "(11) 94321-0987", rg: "56.789.012-3", cpf: "567.890.123-44", cnh: "56789012345", quartos: 30, pago: "PG", valorDiaria: 330.00, checkIn: "2025-05-09T13:45", consumos: [], statusHospedagem: "ATIVO" },
    { id: 6, data: "09/05/2025", nome: "William Oliveira (Fix)", telefone: "(11) 93210-9876", rg: "67.890.123-4", cpf: "678.901.234-55", cnh: "", quartos: 140, pago: "PG", valorDiaria: 300.00, checkIn: "2025-05-09T11:20", consumos: [], statusHospedagem: "ATIVO" },
    { id: 7, data: "09/04/2025", nome: "Major Douglas", telefone: "(11) 92109-8765", rg: "78.901.234-5", cpf: "789.012.345-66", cnh: "78901234567", quartos: 18, pago: "PG", valorDiaria: 360.00, checkIn: "2025-04-09T15:30", consumos: [], statusHospedagem: "ATIVO" },
    { id: 8, data: "10/05/2025", nome: "Eglias José da Silva", telefone: "(11) 91098-7654", rg: "89.012.345-6", cpf: "890.123.456-77", cnh: "89012345678", quartos: 150, pago: "PG", valorDiaria: 220.00, checkIn: "2025-05-10T09:00", consumos: [], statusHospedagem: "ATIVO" },
    { id: 9, data: "10/05/2025", nome: "João Pedro Fretini", telefone: "(11) 90987-6543", rg: "90.123.456-7", cpf: "901.234.567-88", cnh: "", quartos: 80, pago: "PENDENTE", valorDiaria: 50.00, checkIn: "2025-05-10T17:30", consumos: [], statusHospedagem: "ATIVO" },
    { id: 10, data: "10/05/2025", nome: "Denildo Quide do Nascimento", telefone: "(11) 99876-5432", rg: "01.234.567-8", cpf: "012.345.678-99", cnh: "01234567890", quartos: 270, pago: "PG", valorDiaria: 100.00, checkIn: "2025-05-10T08:45", consumos: [], statusHospedagem: "ATIVO" },
    { id: 11, data: "10/05/2025", nome: "Edinaldo Moreira da Silva", telefone: "(11) 98765-4321", rg: "12.345.678-9", cpf: "123.456.789-00", cnh: "12345678901", quartos: 50, pago: "PG", valorDiaria: 150.00, checkIn: "2025-05-10T12:30", consumos: [], statusHospedagem: "ATIVO" },
    { id: 12, data: "10/05/2025", nome: "José de Maria Lupa", telefone: "(11) 97654-3210", rg: "23.456.789-0", cpf: "234.567.890-11", cnh: "", quartos: 240, pago: "PG", valorDiaria: 110.00, checkIn: "2025-05-10T14:15", consumos: [], statusHospedagem: "ATIVO" },
    { id: 13, data: "10/05/2025", nome: "Miguel Rodriguez Jr", telefone: "(11) 96543-2109", rg: "34.567.890-1", cpf: "345.678.901-22", cnh: "34567890123", quartos: 21, pago: "PG", valorDiaria: 120.00, checkIn: "2025-05-10T16:45", consumos: [], statusHospedagem: "ATIVO" },
    { id: 14, data: "10/05/2025", nome: "Jursioma (Fix)", telefone: "(11) 95432-1098", rg: "45.678.901-2", cpf: "456.789.012-33", cnh: "", quartos: 4, pago: "PG", valorDiaria: 190.00, checkIn: "2025-05-10T11:00", consumos: [], statusHospedagem: "ATIVO" },
    { id: 15, data: "10/05/2025", nome: "Georsonkle", telefone: "(11) 94321-0987", rg: "56.789.012-3", cpf: "567.890.123-44", cnh: "56789012345", quartos: 200, pago: "PG", valorDiaria: 270.00, checkIn: "2025-05-10T13:20", consumos: [], statusHospedagem: "ATIVO" },
    { id: 16, data: "10/05/2025", nome: "Rilam", telefone: "(11) 93210-9876", rg: "67.890.123-4", cpf: "678.901.234-55", cnh: "", quartos: 8, pago: "PG", valorDiaria: 210.00, checkIn: "2025-05-10T15:10", consumos: [], statusHospedagem: "ATIVO" },
    { id: 17, data: "10/05/2025", nome: "Eudcleido (Fix)", telefone: "(11) 92109-8765", rg: "78.901.234-5", cpf: "789.012.345-66", cnh: "78901234567", quartos: 50, pago: "PG", valorDiaria: 150.00, checkIn: "2025-05-10T10:30", consumos: [], statusHospedagem: "ATIVO" },
    { id: 18, data: "10/05/2025", nome: "Tiago Bonilha", telefone: "(11) 91098-7654", rg: "89.012.345-6", cpf: "890.123.456-77", cnh: "89012345678", quartos: 15, pago: "PG", valorDiaria: 160.00, checkIn: "2025-05-10T18:00", consumos: [], statusHospedagem: "ATIVO" },
    { id: 19, data: "10/05/2025", nome: "Luiz Gustavo", telefone: "(11) 90987-6543", rg: "90.123.456-7", cpf: "901.234.567-88", cnh: "", quartos: 130, pago: "PG", valorDiaria: 300.00, checkIn: "2025-05-10T07:30", consumos: [], statusHospedagem: "ATIVO" },
    { id: 20, data: "10/05/2025", nome: "Osiel (PG depois)", telefone: "(11) 99876-5432", rg: "01.234.567-8", cpf: "012.345.678-99", cnh: "01234567890", quartos: 200, pago: "PG", valorDiaria: 330.00, checkIn: "2025-05-10T12:45", consumos: [], statusHospedagem: "ATIVO" },
    { id: 21, data: "10/05/2025", nome: "Paula", telefone: "(11) 98765-4321", rg: "12.345.678-9", cpf: "123.456.789-00", cnh: "", quartos: 140, pago: "PG", valorDiaria: 150.00, checkIn: "2025-05-10T14:30", consumos: [], statusHospedagem: "ATIVO" },
    { id: 22, data: "10/05/2025", nome: "Renê Ferreira da Silva", telefone: "(11) 97654-3210", rg: "23.456.789-0", cpf: "234.567.890-11", cnh: "23456789012", quartos: 60, pago: "PG", valorDiaria: 150.00, checkIn: "2025-05-10T16:15", consumos: [], statusHospedagem: "ATIVO" },
    { id: 23, data: "11/05/2025", nome: "José Antonio", telefone: "(11) 96543-2109", rg: "34.567.890-1", cpf: "345.678.901-22", cnh: "34567890123", quartos: 13, pago: "PG", valorDiaria: 180.00, checkIn: "2025-05-11T09:15", consumos: [], statusHospedagem: "ATIVO" },
    { id: 24, data: "11/05/2025", nome: "Kaio", telefone: "(11) 95432-1098", rg: "45.678.901-2", cpf: "456.789.012-33", cnh: "", quartos: 61, pago: "PG", valorDiaria: 330.00, checkIn: "2025-05-11T11:30", consumos: [], statusHospedagem: "ATIVO" },
    { id: 25, data: "11/05/2025", nome: "Pedro", telefone: "(11) 94321-0987", rg: "56.789.012-3", cpf: "567.890.123-44", cnh: "56789012345", quartos: 4, pago: "PG", valorDiaria: 100.00, checkIn: "2025-05-11T13:45", consumos: [], statusHospedagem: "ATIVO" },
    { id: 26, data: "12/05/2025", nome: "Luiz Adir (Dentx)", telefone: "(11) 93210-9876", rg: "67.890.123-4", cpf: "678.901.234-55", cnh: "", quartos: 13, pago: "PG", valorDiaria: 160.00, checkIn: "2025-05-12T08:20", consumos: [], statusHospedagem: "ATIVO" },
    { id: 27, data: "12/05/2025", nome: "Francimar Arruda", telefone: "(11) 92109-8765", rg: "78.901.234-5", cpf: "789.012.345-66", cnh: "78901234567", quartos: 15, pago: "PG", valorDiaria: 170.00, checkIn: "2025-05-12T10:40", consumos: [], statusHospedagem: "ATIVO" },
    { id: 28, data: "12/05/2025", nome: "João Batista (Negro Nai)", telefone: "(11) 91098-7654", rg: "89.012.345-6", cpf: "890.123.456-77", cnh: "89012345678", quartos: 220, pago: "PG", valorDiaria: 600.00, checkIn: "2025-05-12T15:00", consumos: [], statusHospedagem: "ATIVO" },
    { id: 29, data: "12/05/2025", nome: "Serdio (Pesall)", telefone: "(11) 90987-6543", rg: "90.123.456-7", cpf: "901.234.567-88", cnh: "", quartos: 180, pago: "PG", valorDiaria: 410.00, checkIn: "2025-05-12T17:30", consumos: [], statusHospedagem: "ATIVO" },
    { id: 30, data: "13/05/2025", nome: "Luvas Rinar (Rianau)", telefone: "(11) 99876-5432", rg: "01.234.567-8", cpf: "012.345.678-99", cnh: "01234567890", quartos: 30, pago: "PG", valorDiaria: 230.00, checkIn: "2025-05-13T07:45", consumos: [], statusHospedagem: "ATIVO" },
    { id: 31, data: "13/05/2025", nome: "Elton Filiato", telefone: "(11) 98765-4321", rg: "12.345.678-9", cpf: "123.456.789-00", cnh: "12345678901", quartos: 60, pago: "PG", valorDiaria: 150.00, checkIn: "2025-05-13T12:15", consumos: [], statusHospedagem: "ATIVO" },
    { id: 32, data: "13/05/2025", nome: "Pedrn Apel Alilu", telefone: "(11) 97654-3210", rg: "23.456.789-0", cpf: "234.567.890-11", cnh: "", quartos: 300, pago: "PG", valorDiaria: 110.00, checkIn: "2025-05-13T14:20", consumos: [], statusHospedagem: "ATIVO" },
    { id: 33, data: "13/05/2025", nome: "Sérgio", telefone: "(11) 96543-2109", rg: "34.567.890-1", cpf: "345.678.901-22", cnh: "34567890123", quartos: 70, pago: "PG", valorDiaria: 160.00, checkIn: "2025-05-13T16:30", consumos: [], statusHospedagem: "ATIVO" },
    { id: 34, data: "13/05/2025", nome: "Willian Cristiano", telefone: "(11) 95432-1098", rg: "45.678.901-2", cpf: "456.789.012-33", cnh: "", quartos: 8, pago: "PG", valorDiaria: 160.00, checkIn: "2025-05-13T18:45", consumos: [], statusHospedagem: "ATIVO" }
  ]);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarConsumos, setMostrarConsumos] = useState(false);
  const [mostrarFicha, setMostrarFicha] = useState(false);
  const [mostrarCheckout, setMostrarCheckout] = useState(false);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [hospedeCheckout, setHospedeCheckout] = useState(null);
  const [hospedeConsumos, setHospedeConsumos] = useState(null);
  const [hospedeFicha, setHospedeFicha] = useState(null);
  const [editando, setEditando] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [agora, setAgora] = useState(new Date());
  const [formulario, setFormulario] = useState({
    data: '',
    nome: '',
    telefone: '',
    rg: '',
    cpf: '',
    cnh: '',
    quartos: '',
    pago: '',
    valorDiaria: '',
    checkIn: ''
  });

  // Timer para atualizar em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setAgora(new Date());
    }, 60000); // Atualiza a cada minuto

    return () => clearInterval(timer);
  }, []);

  // Produtos disponíveis para consumo
  const produtosDisponiveis = [
    { id: 1, nome: "🥤 Refrigerante Lata", preco: 5.00 },
    { id: 2, nome: "💧 Água 500ml", preco: 3.00 },
    { id: 3, nome: "🍺 Cerveja Long Neck", preco: 8.00 },
    { id: 4, nome: "🍺 Cerveja Lata", preco: 6.00 },
    { id: 5, nome: "🥤 Suco Natural", preco: 7.00 },
    { id: 6, nome: "☕ Café", preco: 4.00 },
    { id: 7, nome: "🧊 Gelo", preco: 2.00 },
    { id: 8, nome: "🍫 Chocolate", preco: 8.00 },
    { id: 9, nome: "🥜 Amendoim", preco: 5.00 },
    { id: 10, nome: "🍪 Biscoito", preco: 4.00 }
  ];

  // Função para converter data do formato ISO para DD/MM/AAAA
  const formatarDataParaExibicao = (dataISO) => {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  // Função para converter data do formato DD/MM/AAAA para ISO
  const formatarDataParaISO = (dataBR) => {
    if (!dataBR) return '';
    const [dia, mes, ano] = dataBR.split('/');
    return `${ano}-${mes}-${dia}`;
  };

  // Calcular quantas diárias já passaram desde o check-in
  const calcularDiariasDecorridas = (checkIn) => {
    if (!checkIn) return 1;
    
    const dataCheckIn = new Date(checkIn);
    const diferencaMs = agora.getTime() - dataCheckIn.getTime();
    const horasDecorridas = diferencaMs / (1000 * 60 * 60);
    
    // Sempre pelo menos 1 diária, depois conta a cada 24h
    return Math.max(1, Math.ceil(horasDecorridas / 24));
  };

  // Calcular valor total baseado nas diárias
  const calcularTotalDiarias = (valorDiaria, checkIn) => {
    const diarias = calcularDiariasDecorridas(checkIn);
    return valorDiaria * diarias;
  };

  // Formatear tempo decorrido
  const formatarTempoDecorrido = (checkIn) => {
    if (!checkIn) return 'N/A';
    
    const dataCheckIn = new Date(checkIn);
    const diferencaMs = agora.getTime() - dataCheckIn.getTime();
    
    const dias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencaMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencaMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (dias > 0) {
      return `${dias}d ${horas}h ${minutos}m`;
    } else if (horas > 0) {
      return `${horas}h ${minutos}m`;
    } else {
      return `${minutos}m`;
    }
  };

  // Calcular total de consumos de um hóspede
  const calcularTotalConsumos = (consumos) => {
    return consumos.reduce((total, consumo) => total + (consumo.preco * consumo.quantidade), 0);
  };

  // Abrir modal de consumos
  const abrirConsumos = (hospede) => {
    setHospedeConsumos(hospede);
    setMostrarConsumos(true);
  };

  // Adicionar consumo
  const adicionarConsumo = (produto) => {
    const novoConsumo = {
      id: Date.now(),
      produtoId: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      quantidade: 1,
      dataHora: new Date().toLocaleString('pt-BR')
    };

    setHospedes(hospedes.map(h => 
      h.id === hospedeConsumos.id 
        ? { ...h, consumos: [...h.consumos, novoConsumo] }
        : h
    ));

    // Atualizar o hospede atual
    setHospedeConsumos({
      ...hospedeConsumos,
      consumos: [...hospedeConsumos.consumos, novoConsumo]
    });
  };

  // Remover consumo
  const removerConsumo = (consumoId) => {
    setHospedes(hospedes.map(h => 
      h.id === hospedeConsumos.id 
        ? { ...h, consumos: h.consumos.filter(c => c.id !== consumoId) }
        : h
    ));

    setHospedeConsumos({
      ...hospedeConsumos,
      consumos: hospedeConsumos.consumos.filter(c => c.id !== consumoId)
    });
  };

  // Alterar quantidade do consumo
  const alterarQuantidadeConsumo = (consumoId, novaQuantidade) => {
    if (novaQuantidade < 1) return;

    setHospedes(hospedes.map(h => 
      h.id === hospedeConsumos.id 
        ? { 
            ...h, 
            consumos: h.consumos.map(c => 
              c.id === consumoId ? { ...c, quantidade: novaQuantidade } : c
            )
          }
        : h
    ));

    setHospedeConsumos({
      ...hospedeConsumos,
      consumos: hospedeConsumos.consumos.map(c => 
        c.id === consumoId ? { ...c, quantidade: novaQuantidade } : c
      )
    });
  };

  // Filtrar hóspedes
  const hospedesFiltrados = hospedes.filter(hospede => {
    const matchNome = hospede.nome.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === '' || 
      (filtroStatus === 'pago' && hospede.pago === 'PG') ||
      (filtroStatus === 'pendente' && hospede.pago === 'PENDENTE');
    
    // Por padrão, mostrar apenas hóspedes ativos, a menos que seja histórico
    const statusHospedagem = mostrarHistorico ? hospede.statusHospedagem === 'FINALIZADO' : hospede.statusHospedagem === 'ATIVO';
    
    return matchNome && matchStatus && statusHospedagem;
  });

  // Estatísticas
  const hospedesAtivos = hospedes.filter(h => h.statusHospedagem === 'ATIVO');
  const totalHospedes = hospedesAtivos.length;
  const totalPago = hospedesAtivos.filter(h => h.pago === 'PG').length;
  const totalPendente = hospedesAtivos.filter(h => h.pago === 'PENDENTE').length;
  const faturamentoDiarias = hospedesAtivos.reduce((acc, h) => acc + calcularTotalDiarias(h.valorDiaria, h.checkIn), 0);
  const faturamentoConsumos = hospedesAtivos.reduce((acc, h) => acc + calcularTotalConsumos(h.consumos), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Converter data do formato ISO para DD/MM/AAAA
    const dataFormatada = formatarDataParaExibicao(formulario.data);
    
    // Se não informar check-in, usar data e hora atual
    const checkInFinal = formulario.checkIn || new Date().toISOString().slice(0, 16);
    
    if (editando) {
      setHospedes(hospedes.map(h => 
        h.id === editando.id 
          ? { 
              ...editando, 
              ...formulario, 
              data: dataFormatada, 
              valorDiaria: parseFloat(formulario.valorDiaria),
              checkIn: checkInFinal
            }
          : h
      ));
      setEditando(null);
    } else {
      const novoHospede = {
        id: Math.max(...hospedes.map(h => h.id)) + 1,
        ...formulario,
        data: dataFormatada,
        valorDiaria: parseFloat(formulario.valorDiaria),
        checkIn: checkInFinal,
        consumos: [],
        statusHospedagem: "ATIVO"
      };
      setHospedes([...hospedes, novoHospede]);
    }
    
    setFormulario({ data: '', nome: '', telefone: '', rg: '', cpf: '', cnh: '', quartos: '', pago: '', valorDiaria: '', checkIn: '' });
    setMostrarFormulario(false);
  };

  const iniciarEdicao = (hospede) => {
    setEditando(hospede);
    setFormulario({
      data: formatarDataParaISO(hospede.data),
      nome: hospede.nome,
      telefone: hospede.telefone || '',
      rg: hospede.rg || '',
      cpf: hospede.cpf || '',
      cnh: hospede.cnh || '',
      quartos: hospede.quartos.toString(),
      pago: hospede.pago,
      valorDiaria: hospede.valorDiaria.toString(),
      checkIn: hospede.checkIn || ''
    });
    setMostrarFormulario(true);
  };

  const removerHospede = (id) => {
    if (window.confirm('Tem certeza que deseja remover este hóspede?')) {
      setHospedes(hospedes.filter(h => h.id !== id));
    }
  };

  const cancelarFormulario = () => {
    setMostrarFormulario(false);
    setEditando(null);
    setFormulario({ data: '', nome: '', telefone: '', rg: '', cpf: '', cnh: '', quartos: '', pago: '', valorDiaria: '', checkIn: '' });
  };

  const fecharConsumos = () => {
    setMostrarConsumos(false);
    setHospedeConsumos(null);
  };

  // Abrir ficha completa
  const abrirFicha = (hospede) => {
    setHospedeFicha(hospede);
    setMostrarFicha(true);
  };

  // Fechar ficha completa
  const fecharFicha = () => {
    setMostrarFicha(false);
    setHospedeFicha(null);
  };

  // Abrir modal de checkout
  const abrirCheckout = (hospede) => {
    setHospedeCheckout(hospede);
    setMostrarCheckout(true);
  };

  // Fechar modal de checkout
  const fecharCheckout = () => {
    setMostrarCheckout(false);
    setHospedeCheckout(null);
  };

  // Finalizar hospedagem
  const finalizarHospedagem = () => {
    if (!hospedeCheckout) return;

    const agora = new Date();
    const checkOut = agora.toISOString().slice(0, 16);
    
    setHospedes(hospedes.map(h => 
      h.id === hospedeCheckout.id 
        ? { 
            ...h, 
            statusHospedagem: "FINALIZADO",
            checkOut: checkOut,
            dataFinalizacao: agora.toLocaleString('pt-BR')
          }
        : h
    ));

    // Gerar PDF automático da conta final
    gerarPDFCheckout(hospedeCheckout, checkOut);
    
    fecharCheckout();
  };

  // Gerar PDF de checkout
  const gerarPDFCheckout = (hospede, checkOut) => {
    const doc = new jsPDF();
    const dataImpressao = new Date().toLocaleString('pt-BR');
    
    // Configurações
    let y = 20;
    const margemEsq = 20;
    const larguraPagina = 170;
    
    // Cabeçalho
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('HOTEL COSTA', 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(14);
    doc.text('CONTA FINAL - CHECKOUT', 105, y, { align: 'center' });
    y += 15;
    
    // Linha separadora
    doc.line(margemEsq, y, margemEsq + larguraPagina, y);
    y += 10;
    
    // Dados do Hóspede
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('DADOS DO HOSPEDE', margemEsq, y);
    y += 8;
    doc.line(margemEsq, y, margemEsq + larguraPagina, y);
    y += 8;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Nome: ${hospede.nome}`, margemEsq, y);
    y += 6;
    doc.text(`Quarto: No ${hospede.quartos}`, margemEsq, y);
    y += 6;
    doc.text(`Check-in: ${hospede.checkIn ? new Date(hospede.checkIn).toLocaleString('pt-BR') : 'N/A'}`, margemEsq, y);
    y += 6;
    doc.text(`Check-out: ${new Date(checkOut).toLocaleString('pt-BR')}`, margemEsq, y);
    y += 6;
    doc.text(`Tempo Total: ${formatarTempoDecorrido(hospede.checkIn)}`, margemEsq, y);
    y += 15;
    
    // Resumo da Conta
    const totalDiarias = calcularTotalDiarias(hospede.valorDiaria, hospede.checkIn);
    const totalConsumos = calcularTotalConsumos(hospede.consumos);
    const totalGeral = totalDiarias + totalConsumos;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMO DA CONTA', margemEsq, y);
    y += 8;
    doc.line(margemEsq, y, margemEsq + larguraPagina, y);
    y += 8;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Valor da Diaria: R$ ${hospede.valorDiaria.toFixed(2)}`, margemEsq, y);
    doc.text(`x ${calcularDiariasDecorridas(hospede.checkIn)} diarias`, margemEsq + 100, y);
    doc.text(`R$ ${totalDiarias.toFixed(2)}`, margemEsq + 140, y);
    y += 8;
    
    if (hospede.consumos.length > 0) {
      doc.text('Consumos:', margemEsq, y);
      doc.text(`R$ ${totalConsumos.toFixed(2)}`, margemEsq + 140, y);
      y += 8;
    }
    
    // Total Final
    y += 5;
    doc.setDrawColor(0);
    doc.setFillColor(240, 240, 240);
    doc.rect(margemEsq, y, larguraPagina, 15, 'FD');
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL A PAGAR:', margemEsq + 5, y + 9);
    doc.text(`R$ ${totalGeral.toFixed(2)}`, margemEsq + larguraPagina - 5, y + 9, { align: 'right' });
    y += 25;
    
    // Status do pagamento
    doc.setFontSize(10);
    doc.text(`Status do Pagamento: ${hospede.pago === 'PG' ? 'PAGO' : 'PENDENTE'}`, margemEsq, y);
    y += 15;
    
    // Rodapé
    y = 270;
    doc.line(margemEsq, y, margemEsq + larguraPagina, y);
    y += 8;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text(`Obrigado pela preferencia! | Check-out realizado em: ${dataImpressao}`, 105, y, { align: 'center' });
    
    // Salvar o PDF
    const nomeArquivo = `Checkout_${hospede.nome.replace(/\s+/g, '_')}_${hospede.data.replace(/\//g, '-')}.pdf`;
    doc.save(nomeArquivo);
  };

  // Função para gerar PDF da ficha
  const gerarPDFFicha = () => {
    if (!hospedeFicha) return;
    
    const doc = new jsPDF();
    const dataImpressao = new Date().toLocaleString('pt-BR');
    
    // Configurações
    let y = 20;
    const margemEsq = 20;
    const larguraPagina = 170;
    
    // Cabeçalho
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('HOTEL COSTA', 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(14);
    doc.text('FICHA DO HOSPEDE', 105, y, { align: 'center' });
    y += 15;
    
    // Linha separadora
    doc.line(margemEsq, y, margemEsq + larguraPagina, y);
    y += 10;
    
    // Função auxiliar para adicionar seção
    const adicionarSecao = (titulo, dados) => {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(titulo.toUpperCase(), margemEsq, y);
      y += 8;
      
      doc.line(margemEsq, y, margemEsq + larguraPagina, y);
      y += 8;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      
      dados.forEach(item => {
        doc.text(`${item.label}:`, margemEsq, y);
        doc.text(item.valor, margemEsq + 70, y);
        y += 6;
      });
      
      y += 5;
    };
    
    // Dados Pessoais
    adicionarSecao('Dados Pessoais', [
      { label: 'Nome Completo', valor: hospedeFicha.nome },
      { label: 'Telefone', valor: hospedeFicha.telefone || 'Nao informado' },
      { label: 'RG', valor: hospedeFicha.rg || 'Nao informado' },
      { label: 'CPF', valor: hospedeFicha.cpf || 'Nao informado' },
      { label: 'CNH', valor: hospedeFicha.cnh || 'Nao possui' }
    ]);
    
    // Dados da Hospedagem
    adicionarSecao('Dados da Hospedagem', [
      { label: 'Data da Reserva', valor: hospedeFicha.data },
      { label: 'Quarto', valor: `No ${hospedeFicha.quartos}` },
      { label: 'Check-in', valor: hospedeFicha.checkIn ? new Date(hospedeFicha.checkIn).toLocaleString('pt-BR') : 'Nao informado' },
      { label: 'Tempo Hospedado', valor: formatarTempoDecorrido(hospedeFicha.checkIn) },
      { label: 'Status Pagamento', valor: hospedeFicha.pago === 'PG' ? 'PAGO' : 'PENDENTE' }
    ]);
    
    // Resumo Financeiro
    const totalDiarias = calcularTotalDiarias(hospedeFicha.valorDiaria, hospedeFicha.checkIn);
    const totalConsumos = calcularTotalConsumos(hospedeFicha.consumos);
    const totalGeral = totalDiarias + totalConsumos;
    
    adicionarSecao('Resumo Financeiro', [
      { label: 'Valor da Diaria', valor: `R$ ${hospedeFicha.valorDiaria.toFixed(2)}` },
      { label: 'Numero de Diarias', valor: `${calcularDiariasDecorridas(hospedeFicha.checkIn)}` },
      { label: 'Total Diarias', valor: `R$ ${totalDiarias.toFixed(2)}` },
      { label: 'Total Consumos', valor: `R$ ${totalConsumos.toFixed(2)}` }
    ]);
    
    // Total Geral Destacado
    doc.setDrawColor(0);
    doc.setFillColor(240, 240, 240);
    doc.rect(margemEsq, y, larguraPagina, 15, 'FD');
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL GERAL DA HOSPEDAGEM:', margemEsq + 5, y + 9);
    doc.text(`R$ ${totalGeral.toFixed(2)}`, margemEsq + larguraPagina - 5, y + 9, { align: 'right' });
    y += 20;
    
    // Histórico de Consumos
    if (hospedeFicha.consumos.length > 0) {
      y += 5;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('HISTORICO DE CONSUMOS', margemEsq, y);
      y += 8;
      
      doc.line(margemEsq, y, margemEsq + larguraPagina, y);
      y += 8;
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('ITEM', margemEsq, y);
      doc.text('QTD', margemEsq + 80, y);
      doc.text('VALOR UNIT.', margemEsq + 100, y);
      doc.text('SUBTOTAL', margemEsq + 130, y);
      doc.text('DATA/HORA', margemEsq + 155, y);
      y += 6;
      
      doc.line(margemEsq, y, margemEsq + larguraPagina, y);
      y += 4;
      
      doc.setFont(undefined, 'normal');
      hospedeFicha.consumos.forEach(consumo => {
        const nomeItem = consumo.nome.replace(/[^\w\s]/gi, ''); // Remove emojis
        doc.text(nomeItem.substring(0, 25), margemEsq, y);
        doc.text(`${consumo.quantidade}x`, margemEsq + 80, y);
        doc.text(`R$ ${consumo.preco.toFixed(2)}`, margemEsq + 100, y);
        doc.text(`R$ ${(consumo.preco * consumo.quantidade).toFixed(2)}`, margemEsq + 130, y);
        doc.text(consumo.dataHora.substring(0, 16), margemEsq + 155, y);
        y += 5;
      });
    } else {
      y += 5;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('HISTORICO DE CONSUMOS', margemEsq, y);
      y += 8;
      
      doc.line(margemEsq, y, margemEsq + larguraPagina, y);
      y += 8;
      
      doc.setFont(undefined, 'italic');
      doc.setFontSize(10);
      doc.text('Nenhum consumo registrado nesta hospedagem', 105, y, { align: 'center' });
    }
    
    // Rodapé
    y = 280; // Posição fixa no final da página
    doc.line(margemEsq, y, margemEsq + larguraPagina, y);
    y += 8;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text(`Sistema de Gestao - Hotel Costa | Impresso em: ${dataImpressao}`, 105, y, { align: 'center' });
    
    // Salvar o PDF
    const nomeArquivo = `Ficha_${hospedeFicha.nome.replace(/\s+/g, '_')}_${hospedeFicha.data.replace(/\//g, '-')}.pdf`;
    doc.save(nomeArquivo);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🏨 Sistema de Gestão - Hotel Costa</h1>
          <div className="header-info">
            <span className="current-time">
              ⏰ {agora.toLocaleString('pt-BR')}
            </span>
            <button 
              className={`btn-toggle ${mostrarHistorico ? 'active' : ''}`}
              onClick={() => setMostrarHistorico(!mostrarHistorico)}
            >
              {mostrarHistorico ? '🏨 Ver Ativos' : '📚 Ver Histórico'}
            </button>
            <button 
              className="btn-primary"
              onClick={() => setMostrarFormulario(true)}
            >
              ➕ Nova Reserva
            </button>
          </div>
        </div>
      </header>

      {/* Estatísticas */}
      <div className="stats">
        <div className="stat-card">
          <div>
            <h3>{totalHospedes}</h3>
            <p>Total de Hóspedes</p>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <h3>{totalPago}</h3>
            <p>Pagamentos Confirmados</p>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <h3>{totalPendente}</h3>
            <p>Pagamentos Pendentes</p>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <h3>R$ {(faturamentoDiarias + faturamentoConsumos).toFixed(2)}</h3>
            <p>Faturamento Total</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">Todos os Status</option>
          <option value="pago">Pago</option>
          <option value="pendente">Pendente</option>
        </select>
      </div>

      {/* Formulário Modal */}
      {mostrarFormulario && (
        <div className="modal-overlay">
          <div className="modal modal-cadastro">
            <h2>{editando ? 'Editar Reserva' : 'Nova Reserva'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>📅 Data da Reserva:</label>
                  <input
                    type="date"
                    value={formulario.data}
                    onChange={(e) => setFormulario({...formulario, data: e.target.value})}
                    required
                    className="date-input"
                  />
                </div>
                <div className="form-group">
                  <label>🕐 Check-in (Data e Hora):</label>
                  <input
                    type="datetime-local"
                    value={formulario.checkIn}
                    onChange={(e) => setFormulario({...formulario, checkIn: e.target.value})}
                    className="date-input"
                  />
                  <small>Se não informado, será usado o momento atual</small>
                </div>
              </div>

              <div className="form-group">
                <label>👤 Nome Completo:</label>
                <input
                  type="text"
                  value={formulario.nome}
                  onChange={(e) => setFormulario({...formulario, nome: e.target.value})}
                  placeholder="Nome completo do hóspede"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>📞 Telefone:</label>
                  <input
                    type="tel"
                    value={formulario.telefone}
                    onChange={(e) => setFormulario({...formulario, telefone: e.target.value})}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="form-group">
                  <label>🏠 Quarto:</label>
                  <input
                    type="number"
                    value={formulario.quartos}
                    onChange={(e) => setFormulario({...formulario, quartos: e.target.value})}
                    placeholder="Número do quarto"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>🆔 RG:</label>
                  <input
                    type="text"
                    value={formulario.rg}
                    onChange={(e) => setFormulario({...formulario, rg: e.target.value})}
                    placeholder="12.345.678-9"
                  />
                </div>
                <div className="form-group">
                  <label>📄 CPF:</label>
                  <input
                    type="text"
                    value={formulario.cpf}
                    onChange={(e) => setFormulario({...formulario, cpf: e.target.value})}
                    placeholder="123.456.789-00"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>🚗 CNH:</label>
                  <input
                    type="text"
                    value={formulario.cnh}
                    onChange={(e) => setFormulario({...formulario, cnh: e.target.value})}
                    placeholder="12345678901 (opcional)"
                  />
                </div>
                <div className="form-group">
                  <label>💰 Valor da Diária (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formulario.valorDiaria}
                    onChange={(e) => setFormulario({...formulario, valorDiaria: e.target.value})}
                    placeholder="120.00"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>💳 Status do Pagamento:</label>
                <select
                  value={formulario.pago}
                  onChange={(e) => setFormulario({...formulario, pago: e.target.value})}
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="PG">✅ Pago (PG)</option>
                  <option value="PENDENTE">⏳ Pendente</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" onClick={cancelarFormulario} className="btn-secondary">
                  ❌ Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editando ? '💾 Salvar' : '➕ Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Consumos */}
      {mostrarConsumos && hospedeConsumos && (
        <div className="modal-overlay">
          <div className="modal modal-consumos">
            <h2>🛒 Consumos - {hospedeConsumos.nome}</h2>
            
            {/* Produtos Disponíveis */}
            <div className="produtos-section">
              <h3>🏪 Produtos Disponíveis</h3>
              <div className="produtos-grid">
                {produtosDisponiveis.map(produto => (
                  <div key={produto.id} className="produto-card">
                    <span className="produto-nome">{produto.nome}</span>
                    <span className="produto-preco">R$ {produto.preco.toFixed(2)}</span>
                    <button 
                      onClick={() => adicionarConsumo(produto)}
                      className="btn-add-produto"
                    >
                      ➕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Consumos do Hóspede */}
            <div className="consumos-section">
              <h3>📋 Consumos Registrados</h3>
              {hospedeConsumos.consumos.length === 0 ? (
                <p className="no-consumos">Nenhum consumo registrado</p>
              ) : (
                <div className="consumos-lista">
                  {hospedeConsumos.consumos.map(consumo => (
                    <div key={consumo.id} className="consumo-item">
                      <div className="consumo-info">
                        <span className="consumo-nome">{consumo.nome}</span>
                        <span className="consumo-data">{consumo.dataHora}</span>
                      </div>
                      <div className="consumo-controles">
                        <button 
                          onClick={() => alterarQuantidadeConsumo(consumo.id, consumo.quantidade - 1)}
                          className="btn-quantidade"
                        >
                          ➖
                        </button>
                        <span className="quantidade">{consumo.quantidade}</span>
                        <button 
                          onClick={() => alterarQuantidadeConsumo(consumo.id, consumo.quantidade + 1)}
                          className="btn-quantidade"
                        >
                          ➕
                        </button>
                        <span className="consumo-subtotal">
                          R$ {(consumo.preco * consumo.quantidade).toFixed(2)}
                        </span>
                        <button 
                          onClick={() => removerConsumo(consumo.id)}
                          className="btn-remover-consumo"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="total-consumos">
                    <strong>Total de Consumos: R$ {calcularTotalConsumos(hospedeConsumos.consumos).toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button onClick={fecharConsumos} className="btn-primary">
                ✅ Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="table-container">
        <table className="hospedes-table">
          <thead>
            <tr>
              <th>📅 Data</th>
              <th>👤 Nome</th>
              <th>🏠 Quartos</th>
              <th>⏰ Tempo Hospedado</th>
              <th>🔢 Diárias</th>
              <th>💰 Valor Diária</th>
              <th>💰 Total Diárias</th>
              <th>🛒 Consumos</th>
              <th>💳 Status</th>
              <th>⚙️ Ações</th>
            </tr>
          </thead>
          <tbody>
            {hospedesFiltrados.map(hospede => (
              <tr key={hospede.id}>
                <td>{hospede.data}</td>
                <td>
                  <button 
                    className="nome-clicavel"
                    onClick={() => abrirConsumos(hospede)}
                    title="Clique para gerenciar consumos"
                  >
                    {hospede.nome}
                  </button>
                </td>
                <td>{hospede.quartos}</td>
                <td>
                  <span className="tempo-hospedado">
                    {formatarTempoDecorrido(hospede.checkIn)}
                  </span>
                </td>
                <td>
                  <span className="diarias-count">
                    {calcularDiariasDecorridas(hospede.checkIn)}
                  </span>
                </td>
                <td>R$ {hospede.valorDiaria.toFixed(2)}</td>
                <td>
                  <span className="total-diarias">
                    R$ {calcularTotalDiarias(hospede.valorDiaria, hospede.checkIn).toFixed(2)}
                  </span>
                </td>
                <td>
                  <span className="total-consumos-tabela">
                    R$ {calcularTotalConsumos(hospede.consumos).toFixed(2)}
                    {hospede.consumos.length > 0 && (
                      <span className="badge-consumos">{hospede.consumos.length}</span>
                    )}
                  </span>
                </td>
                <td>
                  <span className={`status ${hospede.pago === 'PG' ? 'pago' : 'pendente'}`}>
                    {hospede.pago === 'PG' ? '✅ Pago' : '⏳ Pendente'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => abrirFicha(hospede)}
                      className="btn-ficha"
                      title="Ver Ficha Completa"
                    >
                      📋
                    </button>
                    {!mostrarHistorico && (
                      <button
                        onClick={() => abrirCheckout(hospede)}
                        className="btn-checkout"
                        title="Finalizar Hospedagem"
                      >
                        🏁
                      </button>
                    )}
                    <button
                      onClick={() => iniciarEdicao(hospede)}
                      className="btn-edit"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => removerHospede(hospede.id)}
                      className="btn-delete"
                      title="Remover"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hospedesFiltrados.length === 0 && (
        <div className="no-results">
          <p>{mostrarHistorico ? 'Nenhum hóspede finalizado encontrado.' : 'Nenhum hóspede ativo encontrado com os filtros aplicados.'}</p>
        </div>
      )}

      {/* Modal de Checkout */}
      {mostrarCheckout && hospedeCheckout && (
        <div className="modal-overlay">
          <div className="modal modal-checkout">
            <div className="checkout-header">
              <h2>🏁 Finalização de Hospedagem</h2>
              <button onClick={fecharCheckout} className="btn-close">✖️</button>
            </div>

            <div className="checkout-content">
              <div className="checkout-info">
                <h3>👤 Dados do Hóspede</h3>
                <div className="info-grid">
                  <div><strong>Nome:</strong> {hospedeCheckout.nome}</div>
                  <div><strong>Quarto:</strong> Nº {hospedeCheckout.quartos}</div>
                  <div><strong>Check-in:</strong> {hospedeCheckout.checkIn ? new Date(hospedeCheckout.checkIn).toLocaleString('pt-BR') : 'N/A'}</div>
                  <div><strong>Tempo Total:</strong> {formatarTempoDecorrido(hospedeCheckout.checkIn)}</div>
                </div>
              </div>

              <div className="checkout-financeiro">
                <h3>💰 Resumo da Conta</h3>
                <div className="conta-detalhes">
                  <div className="conta-linha">
                    <span>Valor da Diária:</span>
                    <span>R$ {hospedeCheckout.valorDiaria.toFixed(2)}</span>
                  </div>
                  <div className="conta-linha">
                    <span>Número de Diárias:</span>
                    <span>{calcularDiariasDecorridas(hospedeCheckout.checkIn)}</span>
                  </div>
                  <div className="conta-linha">
                    <span>Total Diárias:</span>
                    <span>R$ {calcularTotalDiarias(hospedeCheckout.valorDiaria, hospedeCheckout.checkIn).toFixed(2)}</span>
                  </div>
                  <div className="conta-linha">
                    <span>Total Consumos:</span>
                    <span>R$ {calcularTotalConsumos(hospedeCheckout.consumos).toFixed(2)}</span>
                  </div>
                  <div className="conta-total">
                    <span>💎 TOTAL GERAL:</span>
                    <span>R$ {(calcularTotalDiarias(hospedeCheckout.valorDiaria, hospedeCheckout.checkIn) + calcularTotalConsumos(hospedeCheckout.consumos)).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="checkout-status">
                <h3>💳 Status do Pagamento</h3>
                <div className={`status-pagamento ${hospedeCheckout.pago === 'PG' ? 'pago' : 'pendente'}`}>
                  {hospedeCheckout.pago === 'PG' ? '✅ Pagamento Confirmado' : '⏳ Pagamento Pendente'}
                </div>
                {hospedeCheckout.pago === 'PENDENTE' && (
                  <div className="aviso-pendente">
                    ⚠️ Atenção: O pagamento ainda está pendente. Confirme o recebimento antes de finalizar.
                  </div>
                )}
              </div>
            </div>

            <div className="checkout-actions">
              <button onClick={fecharCheckout} className="btn-secondary">
                ❌ Cancelar
              </button>
              <button onClick={finalizarHospedagem} className="btn-primary">
                🏁 Finalizar & Gerar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal da Ficha Completa */}
      {mostrarFicha && hospedeFicha && (
        <div className="modal-overlay">
          <div className="modal modal-ficha">
            <div className="ficha-header">
              <h2>📋 Ficha Completa do Hóspede</h2>
              <button onClick={fecharFicha} className="btn-close">✖️</button>
            </div>

            <div className="ficha-content">
              {/* Dados Pessoais */}
              <div className="ficha-section">
                <h3>👤 Dados Pessoais</h3>
                <div className="ficha-grid">
                  <div className="ficha-item">
                    <label>Nome Completo:</label>
                    <span>{hospedeFicha.nome}</span>
                  </div>
                  <div className="ficha-item">
                    <label>📞 Telefone:</label>
                    <span>{hospedeFicha.telefone || 'Não informado'}</span>
                  </div>
                  <div className="ficha-item">
                    <label>🆔 RG:</label>
                    <span>{hospedeFicha.rg || 'Não informado'}</span>
                  </div>
                  <div className="ficha-item">
                    <label>📄 CPF:</label>
                    <span>{hospedeFicha.cpf || 'Não informado'}</span>
                  </div>
                  <div className="ficha-item">
                    <label>🚗 CNH:</label>
                    <span>{hospedeFicha.cnh || 'Não possui'}</span>
                  </div>
                </div>
              </div>

              {/* Dados da Hospedagem */}
              <div className="ficha-section">
                <h3>🏨 Dados da Hospedagem</h3>
                <div className="ficha-grid">
                  <div className="ficha-item">
                    <label>📅 Data da Reserva:</label>
                    <span>{hospedeFicha.data}</span>
                  </div>
                  <div className="ficha-item">
                    <label>🏠 Quarto:</label>
                    <span>Nº {hospedeFicha.quartos}</span>
                  </div>
                  <div className="ficha-item">
                    <label>🕐 Check-in:</label>
                    <span>{hospedeFicha.checkIn ? new Date(hospedeFicha.checkIn).toLocaleString('pt-BR') : 'Não informado'}</span>
                  </div>
                  <div className="ficha-item">
                    <label>⏰ Tempo Hospedado:</label>
                    <span>{formatarTempoDecorrido(hospedeFicha.checkIn)}</span>
                  </div>
                  <div className="ficha-item">
                    <label>💳 Status Pagamento:</label>
                    <span className={`status-ficha ${hospedeFicha.pago === 'PG' ? 'pago' : 'pendente'}`}>
                      {hospedeFicha.pago === 'PG' ? '✅ Pago' : '⏳ Pendente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dados Financeiros */}
              <div className="ficha-section">
                <h3>💰 Resumo Financeiro</h3>
                <div className="ficha-financeiro">
                  <div className="ficha-grid">
                    <div className="ficha-item">
                      <label>💰 Valor da Diária:</label>
                      <span>R$ {hospedeFicha.valorDiaria.toFixed(2)}</span>
                    </div>
                    <div className="ficha-item">
                      <label>🔢 Número de Diárias:</label>
                      <span>{calcularDiariasDecorridas(hospedeFicha.checkIn)}</span>
                    </div>
                    <div className="ficha-item">
                      <label>💰 Total Diárias:</label>
                      <span className="total-destaque">R$ {calcularTotalDiarias(hospedeFicha.valorDiaria, hospedeFicha.checkIn).toFixed(2)}</span>
                    </div>
                    <div className="ficha-item">
                      <label>🛒 Total Consumos:</label>
                      <span className="total-destaque">R$ {calcularTotalConsumos(hospedeFicha.consumos).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="total-geral">
                    <label>💎 Total Geral da Hospedagem:</label>
                    <span>R$ {(calcularTotalDiarias(hospedeFicha.valorDiaria, hospedeFicha.checkIn) + calcularTotalConsumos(hospedeFicha.consumos)).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Histórico de Consumos */}
              <div className="ficha-section">
                <h3>🛒 Histórico de Consumos</h3>
                {hospedeFicha.consumos.length === 0 ? (
                  <p className="no-consumos-ficha">Nenhum consumo registrado nesta hospedagem</p>
                ) : (
                  <div className="consumos-historico">
                    <div className="consumos-header">
                      <span>Item</span>
                      <span>Quantidade</span>
                      <span>Valor Unit.</span>
                      <span>Subtotal</span>
                      <span>Data/Hora</span>
                    </div>
                    {hospedeFicha.consumos.map(consumo => (
                      <div key={consumo.id} className="consumo-linha">
                        <span className="consumo-item-nome">{consumo.nome}</span>
                        <span className="consumo-quantidade">{consumo.quantidade}x</span>
                        <span className="consumo-valor">R$ {consumo.preco.toFixed(2)}</span>
                        <span className="consumo-subtotal">R$ {(consumo.preco * consumo.quantidade).toFixed(2)}</span>
                        <span className="consumo-data">{consumo.dataHora}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="ficha-actions">
              <button onClick={gerarPDFFicha} className="btn-print">
                📄 Gerar PDF
              </button>
              <button onClick={fecharFicha} className="btn-primary">
                ✅ Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
