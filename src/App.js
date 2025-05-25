import React, { useState, useEffect } from 'react';
import './App.css';
import jsPDF from 'jspdf';

// Importar serviços do Firestore
import {
  escutarHospedes,
  adicionarHospede,
  atualizarHospede,
  removerHospede as removerHospedeFirestore,
  finalizarHospedagem as finalizarHospedagemFirestore,
  buscarProdutos,
  adicionarProduto,
  atualizarProduto,
  removerProduto,
  inicializarProdutos,
  buscarConsumosHospede,
  adicionarConsumo as adicionarConsumoFirestore,
  atualizarConsumo,
  removerConsumo as removerConsumoFirestore,
  salvarHistoricoCheckout,
  verificarColecaoConsumos,
  migrarConsumosLocaisParaFirestore
} from './services/firestoreService';

function App() {
  // Estados principais
  const [hospedes, setHospedes] = useState([]);
  const [produtosDisponiveis, setProdutosDisponiveis] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  // Estados dos modais
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarConsumos, setMostrarConsumos] = useState(false);
  const [mostrarFicha, setMostrarFicha] = useState(false);
  const [mostrarCheckout, setMostrarCheckout] = useState(false);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [mostrarProdutos, setMostrarProdutos] = useState(false);
  const [carregandoConsumos, setCarregandoConsumos] = useState(false);
  
  // Estados dos hóspedes selecionados
  const [hospedeCheckout, setHospedeCheckout] = useState(null);
  const [hospedeConsumos, setHospedeConsumos] = useState(null);
  const [hospedeFicha, setHospedeFicha] = useState(null);
  const [editando, setEditando] = useState(null);
  const [produtoEditando, setProdutoEditando] = useState(null);
  
  // Estados dos filtros
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [agora, setAgora] = useState(new Date());
  
  // Estados para busca de hóspedes existentes (evitar duplicatas)
  const [sugestoesHospedes, setSugestoesHospedes] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [buscandoHospede, setBuscandoHospede] = useState(false);
  
  // Estado do formulário
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

  // Estado do formulário de produtos
  const [formularioProduto, setFormularioProduto] = useState({
    nome: '',
    preco: ''
  });

  // Timer para atualizar em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setAgora(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Inicialização do Firestore
  useEffect(() => {
    const inicializar = async () => {
      try {
        console.log('🔥 Inicializando Firebase Firestore...');
        
        // Verificar e inicializar coleção de consumos
        console.log('🛒 Verificando coleção de consumos...');
        await verificarColecaoConsumos();
        await migrarConsumosLocaisParaFirestore();
        
        // Verificar se existem produtos, se não, inicializar
        const produtos = await buscarProdutos();
        if (produtos.length === 0) {
          console.log('📦 Inicializando produtos padrão...');
          await inicializarProdutos();
          const produtosInicializados = await buscarProdutos();
          setProdutosDisponiveis(produtosInicializados);
        } else {
          setProdutosDisponiveis(produtos);
        }

        // Configurar listener para hóspedes em tempo real
        console.log('👥 Configurando listener de hóspedes...');
        const unsubscribe = escutarHospedes((hospedes) => {
          console.log('📊 Hóspedes atualizados:', hospedes.length);
          setHospedes(hospedes);
          setCarregando(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        setCarregando(false);
      }
    };

    inicializar();
  }, []);

  // Carregar consumos quando abrir modal
  useEffect(() => {
    const carregarConsumos = async () => {
      if (hospedeConsumos) {
        const consumos = await buscarConsumosHospede(hospedeConsumos.id);
        setHospedeConsumos(prev => ({ ...prev, consumos }));
      }
    };

    if (hospedeConsumos && !hospedeConsumos.consumos) {
      carregarConsumos();
    }
  }, [hospedeConsumos]);

  // ==================== FUNÇÕES UTILITÁRIAS ====================

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
    if (!consumos || !Array.isArray(consumos)) {
      return 0;
    }
    
    return consumos.reduce((total, consumo) => {
      const preco = parseFloat(consumo.preco) || 0;
      const quantidade = parseInt(consumo.quantidade) || 0;
      return total + (preco * quantidade);
    }, 0);
  };

  // ==================== BUSCA DE HÓSPEDES EXISTENTES ====================

  // Função para buscar hóspedes existentes conforme o usuário digita
  const buscarHospedesExistentes = async (termoBusca) => {
    if (!termoBusca || termoBusca.length < 2) {
      setSugestoesHospedes([]);
      setMostrarSugestoes(false);
      return;
    }

    setBuscandoHospede(true);
    
    try {
      // Buscar tanto nos hóspedes ativos quanto no histórico
      const termoLower = termoBusca.toLowerCase();
      const hospedesEncontrados = hospedes.filter(hospede => 
        hospede.nome.toLowerCase().includes(termoLower)
      );
      
      // Remover duplicatas baseado no nome + cpf ou telefone
      const hospedesUnicos = [];
      const chavesVistas = new Set();
      
      for (const hospede of hospedesEncontrados) {
        const chave = `${hospede.nome.toLowerCase()}-${hospede.cpf || hospede.telefone || ''}`;
        if (!chavesVistas.has(chave)) {
          chavesVistas.add(chave);
          hospedesUnicos.push(hospede);
        }
      }
      
      setSugestoesHospedes(hospedesUnicos.slice(0, 5)); // Limitar a 5 sugestões
      setMostrarSugestoes(hospedesUnicos.length > 0);
      
    } catch (error) {
      console.error('❌ Erro ao buscar hóspedes:', error);
    } finally {
      setBuscandoHospede(false);
    }
  };

  // Handler para mudança no campo nome (com busca em tempo real)
  const handleNomeChange = (e) => {
    const valor = e.target.value;
    setFormulario({...formulario, nome: valor});
    
    // Só buscar se não estiver editando um hóspede existente
    if (!editando && valor.length >= 2) {
      // Debounce simples para evitar muitas consultas
      clearTimeout(window.buscaTimeout);
      window.buscaTimeout = setTimeout(() => {
        buscarHospedesExistentes(valor);
      }, 300);
    } else if (valor.length < 2) {
      setSugestoesHospedes([]);
      setMostrarSugestoes(false);
    }
  };

  // Função para selecionar um hóspede existente das sugestões
  const selecionarHospedeExistente = (hospedeExistente) => {
    setFormulario({
      data: formulario.data, // Manter a data já selecionada
      nome: hospedeExistente.nome,
      telefone: hospedeExistente.telefone || '',
      rg: hospedeExistente.rg || '',
      cpf: hospedeExistente.cpf || '',
      cnh: hospedeExistente.cnh || '',
      quartos: '', // Deixar vazio para o usuário escolher novo quarto
      pago: formulario.pago, // Manter o status de pagamento selecionado
      valorDiaria: formulario.valorDiaria, // Manter valor da diária
      checkIn: formulario.checkIn // Manter check-in
    });
    
    // Fechar sugestões
    setSugestoesHospedes([]);
    setMostrarSugestoes(false);
    setBuscandoHospede(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const dataFormatada = formatarDataParaExibicao(formulario.data);
      const checkInFinal = formulario.checkIn || new Date().toISOString().slice(0, 16);
      
      const dadosHospede = {
        ...formulario,
        data: dataFormatada,
        valorDiaria: parseFloat(formulario.valorDiaria),
        checkIn: checkInFinal,
        statusHospedagem: "ATIVO"
      };

      if (editando) {
        await atualizarHospede(editando.id, dadosHospede);
        console.log('✅ Hóspede atualizado!');
      } else {
        const novoId = await adicionarHospede(dadosHospede);
        console.log('✅ Novo hóspede adicionado:', novoId);
      }
      
      // Limpar formulário
      setFormulario({ data: '', nome: '', telefone: '', rg: '', cpf: '', cnh: '', quartos: '', pago: '', valorDiaria: '', checkIn: '' });
      setMostrarFormulario(false);
      setEditando(null);
    } catch (error) {
      console.error('❌ Erro ao salvar hóspede:', error);
      alert('Erro ao salvar hóspede: ' + error.message);
    }
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

  const removerHospede = async (hospedeId) => {
    if (window.confirm('Tem certeza que deseja remover este hóspede?')) {
      try {
        await removerHospedeFirestore(hospedeId);
        console.log('✅ Hóspede removido!');
      } catch (error) {
        console.error('❌ Erro ao remover hóspede:', error);
        alert('Erro ao remover hóspede: ' + error.message);
      }
    }
  };

  const cancelarFormulario = () => {
    setMostrarFormulario(false);
    setEditando(null);
    setFormulario({ data: '', nome: '', telefone: '', rg: '', cpf: '', cnh: '', quartos: '', pago: '', valorDiaria: '', checkIn: '' });
    // Limpar sugestões
    setSugestoesHospedes([]);
    setMostrarSugestoes(false);
    setBuscandoHospede(false);
  };

  // ==================== HANDLERS DOS CONSUMOS ====================

  const abrirConsumos = async (hospede) => {
    setHospedeConsumos({ ...hospede, consumos: [] });
    setMostrarConsumos(true);
    
    // Carregar consumos
    const consumos = await buscarConsumosHospede(hospede.id);
    setHospedeConsumos(prev => ({ ...prev, consumos }));
  };

  const adicionarConsumo = async (produto) => {
    if (!hospedeConsumos) return;

    try {
      console.log('🛒 === ADICIONANDO CONSUMO ===');
      console.log('🆔 ID do hóspede:', hospedeConsumos.id);
      console.log('📦 Produto selecionado:', produto);

      const novoConsumo = {
        produtoId: produto.id,
        nome: produto.nome,
        preco: produto.preco,
        quantidade: 1,
        dataHora: new Date().toLocaleString('pt-BR')
      };

      console.log('💾 Dados do consumo a salvar:', novoConsumo);
      console.log('🔄 Chamando adicionarConsumoFirestore...');

      const consumoId = await adicionarConsumoFirestore(hospedeConsumos.id, novoConsumo);
      
      console.log('✅ Consumo salvo no Firestore! ID:', consumoId);
      
      // Atualizar estado local
      const consumoComId = { ...novoConsumo, id: consumoId };
      setHospedeConsumos(prev => ({
        ...prev,
        consumos: [consumoComId, ...(prev.consumos || [])]
      }));

      console.log('🔄 Estado local atualizado');
      
      // Verificar se salvou mesmo
      console.log('🔍 Verificando se o consumo foi salvo...');
      const consumosSalvos = await buscarConsumosHospede(hospedeConsumos.id);
      console.log('📊 Consumos encontrados após salvar:', consumosSalvos);

    } catch (error) {
      console.error('❌ ERRO AO ADICIONAR CONSUMO:', error);
      console.error('❌ Stack trace:', error.stack);
      alert('Erro ao adicionar consumo: ' + error.message);
    }
  };

  const alterarQuantidadeConsumo = async (consumoId, novaQuantidade) => {
    if (novaQuantidade < 1) return;

    try {
      await atualizarConsumo(consumoId, { quantidade: novaQuantidade });
      
      // Atualizar estado local
      setHospedeConsumos(prev => ({
        ...prev,
        consumos: prev.consumos.map(c => 
          c.id === consumoId ? { ...c, quantidade: novaQuantidade } : c
        )
      }));

      console.log('✅ Quantidade atualizada!');
    } catch (error) {
      console.error('❌ Erro ao atualizar quantidade:', error);
      alert('Erro ao atualizar quantidade: ' + error.message);
    }
  };

  const removerConsumo = async (consumoId) => {
    try {
      await removerConsumoFirestore(consumoId);
      
      // Atualizar estado local
      setHospedeConsumos(prev => ({
        ...prev,
        consumos: prev.consumos.filter(c => c.id !== consumoId)
      }));

      console.log('✅ Consumo removido!');
    } catch (error) {
      console.error('❌ Erro ao remover consumo:', error);
      alert('Erro ao remover consumo: ' + error.message);
    }
  };

  const fecharConsumos = () => {
    setMostrarConsumos(false);
    setHospedeConsumos(null);
  };

  // ==================== HANDLERS DOS PRODUTOS ====================

  const abrirGerenciamentoProdutos = () => {
    setMostrarProdutos(true);
  };

  const fecharGerenciamentoProdutos = () => {
    setMostrarProdutos(false);
    setProdutoEditando(null);
    setFormularioProduto({ nome: '', preco: '' });
  };

  const handleSubmitProduto = async (e) => {
    e.preventDefault();
    
    if (!formularioProduto.nome || !formularioProduto.preco) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    try {
      const dadosProduto = {
        nome: formularioProduto.nome.trim(),
        preco: parseFloat(formularioProduto.preco)
      };

      if (produtoEditando) {
        // Atualizar produto existente
        await atualizarProduto(produtoEditando.id, dadosProduto);
        console.log('✅ Produto atualizado!');
        
        // Atualizar lista local
        const produtosAtualizados = await buscarProdutos();
        setProdutosDisponiveis(produtosAtualizados);
        
        setProdutoEditando(null);
      } else {
        // Adicionar novo produto
        await adicionarProduto(dadosProduto);
        console.log('✅ Novo produto adicionado!');
        
        // Atualizar lista local
        const produtosAtualizados = await buscarProdutos();
        setProdutosDisponiveis(produtosAtualizados);
      }
      
      // Limpar formulário
      setFormularioProduto({ nome: '', preco: '' });
      
    } catch (error) {
      console.error('❌ Erro ao salvar produto:', error);
      alert('Erro ao salvar produto: ' + error.message);
    }
  };

  const iniciarEdicaoProduto = (produto) => {
    setProdutoEditando(produto);
    setFormularioProduto({
      nome: produto.nome,
      preco: produto.preco.toString()
    });
  };

  const cancelarFormularioProduto = () => {
    setProdutoEditando(null);
    setFormularioProduto({ nome: '', preco: '' });
  };

  const removerProdutoHandler = async (produtoId) => {
    if (window.confirm('Tem certeza que deseja remover este produto?')) {
      try {
        await removerProduto(produtoId);
        console.log('✅ Produto removido!');
        
        // Atualizar lista local
        const produtosAtualizados = await buscarProdutos();
        setProdutosDisponiveis(produtosAtualizados);
        
      } catch (error) {
        console.error('❌ Erro ao remover produto:', error);
        alert('Erro ao remover produto: ' + error.message);
      }
    }
  };

  // ==================== HANDLERS DA FICHA ====================

  const abrirFicha = async (hospede) => {
    try {
      console.log('📋 Abrindo ficha para:', hospede.nome);
      console.log('🆔 ID do hóspede:', hospede.id);
      
      // Primeiro definir o modal sem consumos
      setHospedeFicha({ ...hospede, consumos: [] });
      setMostrarFicha(true);
      setCarregandoConsumos(true);
      
      // Depois carregar os consumos
      const consumos = await buscarConsumosHospede(hospede.id);
      console.log('🛒 Consumos carregados para ficha:', consumos);
      console.log('📊 Total de consumos:', calcularTotalConsumos(consumos));
      
      // Atualizar com os consumos carregados
      setHospedeFicha(prev => ({ 
        ...prev, 
        consumos: consumos || [] 
      }));
      setCarregandoConsumos(false);
    } catch (error) {
      console.error('❌ Erro ao abrir ficha:', error);
      setCarregandoConsumos(false);
      alert('Erro ao carregar dados da ficha: ' + error.message);
    }
  };

  const fecharFicha = () => {
    setMostrarFicha(false);
    setHospedeFicha(null);
  };

  // ==================== HANDLERS DO CHECKOUT ====================

  const abrirCheckout = async (hospede) => {
    try {
      console.log('🏁 Abrindo checkout para:', hospede.nome);
      console.log('🆔 ID do hóspede:', hospede.id);
      
      // Primeiro definir o modal sem consumos
      setHospedeCheckout({ ...hospede, consumos: [] });
      setMostrarCheckout(true);
      setCarregandoConsumos(true);
      
      // Depois carregar os consumos
      const consumos = await buscarConsumosHospede(hospede.id);
      console.log('🛒 Consumos carregados para checkout:', consumos);
      console.log('📊 Total de consumos:', calcularTotalConsumos(consumos));
      
      // Atualizar com os consumos carregados
      setHospedeCheckout(prev => ({ 
        ...prev, 
        consumos: consumos || [] 
      }));
      setCarregandoConsumos(false);
    } catch (error) {
      console.error('❌ Erro ao abrir checkout:', error);
      setCarregandoConsumos(false);
      alert('Erro ao carregar dados do checkout: ' + error.message);
    }
  };

  const fecharCheckout = () => {
    setMostrarCheckout(false);
    setHospedeCheckout(null);
  };

  const finalizarHospedagem = async () => {
    if (!hospedeCheckout) return;

    try {
      const agora = new Date();
      const checkOut = agora.toISOString().slice(0, 16);
      const totalDiarias = calcularTotalDiarias(hospedeCheckout.valorDiaria, hospedeCheckout.checkIn);
      const totalConsumos = calcularTotalConsumos(hospedeCheckout.consumos || []);
      const totalFinal = totalDiarias + totalConsumos;
      const tempoEstadia = formatarTempoDecorrido(hospedeCheckout.checkIn);
      
      console.log('💰 Finalizando hospedagem:');
      console.log('  - Total diárias:', totalDiarias);
      console.log('  - Total consumos:', totalConsumos);
      console.log('  - Total final:', totalFinal);
      console.log('  - Consumos para salvar:', hospedeCheckout.consumos);
      
      const dadosCheckout = {
        checkOut,
        dataFinalizacao: agora.toLocaleString('pt-BR'),
        totalFinal,
        totalDiarias,
        totalConsumos,
        tempoEstadia
      };

      // Finalizar hospedagem (marca como FINALIZADO)
      await finalizarHospedagemFirestore(hospedeCheckout.id, dadosCheckout);
      
      // Salvar no histórico completo com todos os dados
      await salvarHistoricoCheckout(hospedeCheckout, dadosCheckout, hospedeCheckout.consumos || []);
      
      // Gerar PDF
      gerarPDFCheckout(hospedeCheckout, checkOut);
      
      fecharCheckout();
      console.log('✅ Hospedagem finalizada e salva no histórico!');
    } catch (error) {
      console.error('❌ Erro ao finalizar hospedagem:', error);
      alert('Erro ao finalizar hospedagem: ' + error.message);
    }
  };

  // ==================== GERAÇÃO DE PDF ====================

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
    y += 10;
    
    // Detalhamento dos Consumos
    if (hospede.consumos && hospede.consumos.length > 0) {
      doc.setFont(undefined, 'bold');
      doc.text('CONSUMOS:', margemEsq, y);
      y += 6;
      
      doc.setFontSize(9);
      doc.text('ITEM', margemEsq, y);
      doc.text('QTD', margemEsq + 80, y);
      doc.text('VALOR UNIT.', margemEsq + 100, y);
      doc.text('SUBTOTAL', margemEsq + 130, y);
      y += 4;
      
      doc.line(margemEsq, y, margemEsq + larguraPagina, y);
      y += 4;
      
      doc.setFont(undefined, 'normal');
      hospede.consumos.forEach(consumo => {
        const nomeItem = consumo.nome.replace(/[^\w\s]/gi, ''); // Remove emojis
        doc.text(nomeItem.substring(0, 20), margemEsq, y);
        doc.text(`${consumo.quantidade}x`, margemEsq + 80, y);
        doc.text(`R$ ${consumo.preco.toFixed(2)}`, margemEsq + 100, y);
        doc.text(`R$ ${(consumo.preco * consumo.quantidade).toFixed(2)}`, margemEsq + 130, y);
        y += 4;
      });
      
      y += 4;
      doc.line(margemEsq + 100, y, margemEsq + larguraPagina, y);
      doc.setFont(undefined, 'bold');
      doc.text('Total Consumos:', margemEsq + 100, y);
      doc.text(`R$ ${totalConsumos.toFixed(2)}`, margemEsq + 130, y);
      y += 8;
    } else {
      doc.text('Consumos: Nenhum consumo registrado', margemEsq, y);
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
      { label: 'Valor da Diária', valor: `R$ ${hospedeFicha.valorDiaria.toFixed(2)}` },
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

  // ==================== FILTROS E ESTATÍSTICAS ====================

  const hospedesFiltrados = hospedes.filter(hospede => {
    const matchNome = hospede.nome.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === '' || 
      (filtroStatus === 'pago' && hospede.pago === 'PG') ||
      (filtroStatus === 'pendente' && hospede.pago === 'PENDENTE');
    
    // Fallback: se não há statusHospedagem, considera ATIVO por padrão
    const statusHospedagemAtual = hospede.statusHospedagem || 'ATIVO';
    
    // Debug da lógica de filtro
    console.log(`🔍 Filtro - ${hospede.nome}:`);
    console.log(`   - statusHospedagem: ${statusHospedagemAtual}`);
    console.log(`   - mostrarHistorico: ${mostrarHistorico}`);
    console.log(`   - deve mostrar: ${mostrarHistorico ? statusHospedagemAtual === 'FINALIZADO' : statusHospedagemAtual === 'ATIVO'}`);
    
    const statusHospedagem = mostrarHistorico ? 
      statusHospedagemAtual === 'FINALIZADO' : 
      statusHospedagemAtual === 'ATIVO';
    
    const resultado = matchNome && matchStatus && statusHospedagem;
    console.log(`   - resultado final: ${resultado}`);
    
    return resultado;
  });

  // Recalcular com base no statusHospedagem correto
  const hospedesAtivos = hospedes.filter(h => {
    const status = h.statusHospedagem || 'ATIVO';
    return status === 'ATIVO';
  });
  
  const hospedesFinalizados = hospedes.filter(h => {
    return h.statusHospedagem === 'FINALIZADO';
  });

  console.log(`📊 Recálculo - ATIVOS: ${hospedesAtivos.length}, FINALIZADOS: ${hospedesFinalizados.length}`);

  const totalHospedes = hospedesAtivos.length;
  const totalPago = hospedesAtivos.filter(h => h.pago === 'PG').length;
  const totalPendente = hospedesAtivos.filter(h => h.pago === 'PENDENTE').length;
  
  // Para calcular faturamento, precisamos dos consumos
  const faturamentoDiarias = hospedesAtivos.reduce((acc, h) => 
    acc + calcularTotalDiarias(h.valorDiaria, h.checkIn), 0
  );
  const faturamentoConsumos = 0; // Será calculado quando necessário

  if (carregando) {
    return (
      <div className="app">
        <div className="loading-container">
          <h2>🔥 Conectando ao Firebase...</h2>
          <p>Carregando dados do hotel...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER ====================

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
              className="btn-secondary"
              onClick={abrirGerenciamentoProdutos}
            >
              📦 Gerenciar Produtos
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

      {/* Status de conexão */}
      <div className="firebase-status">
        <span className="status-online">🔥 Conectado ao Firebase - Dados sincronizados em tempo real</span>
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

      {/* Tabela de Hóspedes */}
      <div className="table-container">
        <table className="hospedes-table">
          <thead>
            <tr>
              <th>📅 Data</th>
              <th>👤 Nome</th>
              <th>📞 Telefone</th>
              <th>🏠 Quarto</th>
              <th>💳 Status</th>
              <th>💰 Diária</th>
              <th>⏰ Tempo</th>
              <th>📊 Total</th>
              <th>🛒 Consumos</th>
              <th>⚙️ Ações</th>
            </tr>
          </thead>
          <tbody>
            {hospedesFiltrados.map(hospede => (
              <tr key={hospede.id} className="hospede-row">
                <td>{hospede.data}</td>
                <td className="nome-cell">{hospede.nome}</td>
                <td>{hospede.telefone}</td>
                <td className="quarto-cell">{hospede.quartos}</td>
                <td>
                  <span className={`status ${hospede.pago === 'PG' ? 'pago' : 'pendente'}`}>
                    {hospede.pago === 'PG' ? '✅ Pago' : '⏳ Pendente'}
                  </span>
                </td>
                <td>R$ {hospede.valorDiaria.toFixed(2)}</td>
                <td className="tempo-cell">
                  <div>
                    <span className="tempo-decorrido">{formatarTempoDecorrido(hospede.checkIn)}</span>
                    <span className="diarias-count">{calcularDiariasDecorridas(hospede.checkIn)} diária(s)</span>
                  </div>
                </td>
                <td className="total-cell">
                  <strong>R$ {calcularTotalDiarias(hospede.valorDiaria, hospede.checkIn).toFixed(2)}</strong>
                </td>
                <td>
                  <button 
                    onClick={() => abrirConsumos(hospede)}
                    className="btn-consumos"
                    title="Gerenciar Consumos"
                  >
                    🛒 Consumos
                  </button>
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

      {/* Modal de Formulário */}
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
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={formulario.nome}
                    onChange={handleNomeChange}
                    onFocus={() => {
                      if (formulario.nome && !editando) {
                        buscarHospedesExistentes(formulario.nome);
                      }
                    }}
                    onBlur={() => {
                      // Delay para permitir clique nas sugestões
                      setTimeout(() => setMostrarSugestoes(false), 200);
                    }}
                    placeholder="Digite o nome completo do hóspede"
                    required
                  />
                  
                  {/* Loading de busca */}
                  {buscandoHospede && (
                    <div style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6c757d',
                      fontSize: '0.8rem'
                    }}>
                      🔍 Buscando...
                    </div>
                  )}
                  
                  {/* Sugestões de hóspedes existentes */}
                  {mostrarSugestoes && sugestoesHospedes.length > 0 && !editando && (
                    <div className="sugestoes-hospedes">
                      <div className="sugestoes-header">
                        <span>🔍 Hóspedes encontrados (evitar duplicatas):</span>
                      </div>
                      {sugestoesHospedes.map((hospede, index) => (
                        <div
                          key={hospede.id + '-' + index}
                          className="sugestao-item"
                          onClick={() => selecionarHospedeExistente(hospede)}
                        >
                          <div className="sugestao-nome">{hospede.nome}</div>
                          <div className="sugestao-detalhes">
                            {hospede.telefone && <span>📞 {hospede.telefone}</span>}
                            {hospede.cpf && <span>📄 {hospede.cpf}</span>}
                            <span className={`sugestao-status ${hospede.statusHospedagem?.toLowerCase()}`}>
                              {hospede.statusHospedagem === 'FINALIZADO' ? '✅ Histórico' : '🟢 Ativo'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Aviso sobre cliente existente */}
                {mostrarSugestoes && sugestoesHospedes.length > 0 && !editando && (
                  <small style={{ color: '#28a745', fontWeight: 'bold', marginTop: '5px', display: 'block' }}>
                    💡 Clique em um cliente para preencher os dados automaticamente
                  </small>
                )}
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
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editando ? 'Atualizar' : 'Salvar'}
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
            <div className="modal-header">
              <h2>🛒 Consumos - {hospedeConsumos.nome}</h2>
              <button onClick={fecharConsumos} className="btn-close">✖️</button>
            </div>

            <div className="consumos-content">
              <div className="produtos-disponiveis">
                <h3>📦 Produtos Disponíveis</h3>
                <div className="produtos-grid">
                  {produtosDisponiveis.map(produto => (
                    <button
                      key={produto.id}
                      onClick={() => adicionarConsumo(produto)}
                      className="produto-btn"
                    >
                      <span className="produto-nome">{produto.nome}</span>
                      <span className="produto-preco">R$ {produto.preco.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="consumos-lista">
                <h3>🧾 Consumos do Hóspede</h3>
                {hospedeConsumos.consumos && hospedeConsumos.consumos.length > 0 ? (
                  <div className="consumos-itens">
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
                          <span className="subtotal">R$ {(consumo.preco * consumo.quantidade).toFixed(2)}</span>
                          <button 
                            onClick={() => removerConsumo(consumo.id)}
                            className="btn-remover"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="total-consumos">
                      <strong>Total Consumos: R$ {calcularTotalConsumos(hospedeConsumos.consumos).toFixed(2)}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="sem-consumos">Nenhum consumo registrado</p>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={fecharConsumos} className="btn-primary">
                ✅ Concluir
              </button>
            </div>
          </div>
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
                  <div><strong>Quarto:</strong> {hospedeCheckout.quartos}</div>
                  <div><strong>Check-in:</strong> {new Date(hospedeCheckout.checkIn).toLocaleString('pt-BR')}</div>
                  <div><strong>Tempo de estadia:</strong> {formatarTempoDecorrido(hospedeCheckout.checkIn)}</div>
                </div>
              </div>

              <div className="checkout-resumo">
                <h3>💰 Resumo Financeiro</h3>
                <div className="resumo-itens">
                  <div className="resumo-linha">
                    <span>Diárias ({calcularDiariasDecorridas(hospedeCheckout.checkIn)}x R$ {hospedeCheckout.valorDiaria.toFixed(2)}):</span>
                    <span>R$ {calcularTotalDiarias(hospedeCheckout.valorDiaria, hospedeCheckout.checkIn).toFixed(2)}</span>
                  </div>
                  
                  {/* Detalhamento dos Consumos */}
                  {carregandoConsumos ? (
                    <div className="loading-consumos">
                      <span>🔄 Carregando consumos...</span>
                    </div>
                  ) : hospedeCheckout.consumos && hospedeCheckout.consumos.length > 0 ? (
                    <div className="consumos-detalhamento">
                      <div className="consumos-header-checkout">
                        <strong>🛒 Consumos Detalhados:</strong>
                      </div>
                      {hospedeCheckout.consumos.map(consumo => (
                        <div key={consumo.id} className="consumo-linha-checkout">
                          <span className="consumo-item-nome">{consumo.nome}</span>
                          <span className="consumo-qtd">{consumo.quantidade}x</span>
                          <span className="consumo-valor-unit">R$ {consumo.preco.toFixed(2)}</span>
                          <span className="consumo-subtotal">R$ {(consumo.preco * consumo.quantidade).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="consumos-total-linha">
                        <span><strong>Total Consumos:</strong></span>
                        <span><strong>R$ {calcularTotalConsumos(hospedeCheckout.consumos).toFixed(2)}</strong></span>
                      </div>
                    </div>
                  ) : (
                    <div className="resumo-linha">
                      <span>Consumos:</span>
                      <span>R$ 0,00 (Nenhum consumo registrado)</span>
                    </div>
                  )}
                  
                  <div className="resumo-total">
                    <span><strong>TOTAL GERAL:</strong></span>
                    <span><strong>R$ {(calcularTotalDiarias(hospedeCheckout.valorDiaria, hospedeCheckout.checkIn) + calcularTotalConsumos(hospedeCheckout.consumos || [])).toFixed(2)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="checkout-actions">
                <button onClick={fecharCheckout} className="btn-secondary">
                  Cancelar
                </button>
                <button onClick={finalizarHospedagem} className="btn-primary">
                  ✅ Finalizar & Gerar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal da Ficha Completa */}
      {mostrarFicha && hospedeFicha && (
        <div className="modal-overlay">
          <div className="modal modal-ficha">
            <div className="ficha-header">
              <h2>📋 Ficha Completa - {hospedeFicha.nome}</h2>
              <button onClick={fecharFicha} className="btn-close">✖️</button>
            </div>

            <div className="ficha-content">
              <div className="ficha-grid">
                <div className="ficha-section">
                  <h3>👤 Dados Pessoais</h3>
                  <div className="dados-grid">
                    <div><strong>Nome:</strong> {hospedeFicha.nome}</div>
                    <div><strong>Telefone:</strong> {hospedeFicha.telefone}</div>
                    <div><strong>RG:</strong> {hospedeFicha.rg}</div>
                    <div><strong>CPF:</strong> {hospedeFicha.cpf}</div>
                    <div><strong>CNH:</strong> {hospedeFicha.cnh || 'Não informado'}</div>
                  </div>
                </div>

                <div className="ficha-section">
                  <h3>🏨 Dados da Hospedagem</h3>
                  <div className="dados-grid">
                    <div><strong>Data:</strong> {hospedeFicha.data}</div>
                    <div><strong>Quarto:</strong> {hospedeFicha.quartos}</div>
                    <div><strong>Check-in:</strong> {new Date(hospedeFicha.checkIn).toLocaleString('pt-BR')}</div>
                    <div><strong>Tempo de estadia:</strong> {formatarTempoDecorrido(hospedeFicha.checkIn)}</div>
                    <div><strong>Status:</strong> <span className={`status ${hospedeFicha.pago === 'PG' ? 'pago' : 'pendente'}`}>{hospedeFicha.pago === 'PG' ? '✅ Pago' : '⏳ Pendente'}</span></div>
                  </div>
                </div>

                <div className="ficha-section">
                  <h3>💰 Dados Financeiros</h3>
                  <div className="dados-grid">
                    <div><strong>Valor da Diária:</strong> R$ {hospedeFicha.valorDiaria.toFixed(2)}</div>
                    <div><strong>Diárias:</strong> {calcularDiariasDecorridas(hospedeFicha.checkIn)}</div>
                    <div><strong>Total Diárias:</strong> R$ {calcularTotalDiarias(hospedeFicha.valorDiaria, hospedeFicha.checkIn).toFixed(2)}</div>
                    <div><strong>Total Consumos:</strong> R$ {calcularTotalConsumos(hospedeFicha.consumos).toFixed(2)}</div>
                  </div>
                </div>

                <div className="ficha-section">
                  <h3>🛒 Consumos</h3>
                  {carregandoConsumos ? (
                    <div className="loading-consumos">
                      <span>🔄 Carregando consumos...</span>
                    </div>
                  ) : hospedeFicha.consumos && hospedeFicha.consumos.length > 0 ? (
                    <div className="consumos-ficha">
                      <div className="consumos-header">
                        <span>Item</span>
                        <span>Qtd</span>
                        <span>Valor Unit.</span>
                        <span>Subtotal</span>
                      </div>
                      {hospedeFicha.consumos.map(consumo => (
                        <div key={consumo.id} className="consumo-linha">
                          <span>{consumo.nome}</span>
                          <span>{consumo.quantidade}</span>
                          <span>R$ {consumo.preco.toFixed(2)}</span>
                          <span>R$ {(consumo.preco * consumo.quantidade).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>Nenhum consumo registrado</p>
                  )}
                </div>
              </div>

              <div className="total-geral">
                <div className="total-label">TOTAL GERAL DA HOSPEDAGEM:</div>
                <div className="total-valor">R$ {(calcularTotalDiarias(hospedeFicha.valorDiaria, hospedeFicha.checkIn) + calcularTotalConsumos(hospedeFicha.consumos)).toFixed(2)}</div>
              </div>

              <div className="ficha-actions">
                <button onClick={fecharFicha} className="btn-secondary">
                  Fechar
                </button>
                <button onClick={gerarPDFFicha} className="btn-primary">
                  📄 Gerar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gerenciamento de Produtos */}
      {mostrarProdutos && (
        <div className="modal-overlay">
          <div className="modal modal-produtos">
            <div className="modal-header">
              <h2>📦 Gerenciamento de Produtos</h2>
              <button onClick={fecharGerenciamentoProdutos} className="btn-close">✖️</button>
            </div>

            <div className="produtos-content">
              {/* Formulário de Produto */}
              <div className="produto-form-section">
                <h3>{produtoEditando ? '✏️ Editar Produto' : '➕ Adicionar Novo Produto'}</h3>
                <form onSubmit={handleSubmitProduto} className="produto-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>📝 Nome do Produto:</label>
                      <input
                        type="text"
                        value={formularioProduto.nome}
                        onChange={(e) => setFormularioProduto({...formularioProduto, nome: e.target.value})}
                        placeholder="Ex: 🍺 Cerveja Long Neck"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>💰 Preço (R$):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formularioProduto.preco}
                        onChange={(e) => setFormularioProduto({...formularioProduto, preco: e.target.value})}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    {produtoEditando && (
                      <button type="button" onClick={cancelarFormularioProduto} className="btn-secondary">
                        Cancelar
                      </button>
                    )}
                    <button type="submit" className="btn-primary">
                      {produtoEditando ? '✅ Atualizar' : '➕ Adicionar'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Lista de Produtos */}
              <div className="produtos-lista-section">
                <h3>📋 Produtos Cadastrados ({produtosDisponiveis.length})</h3>
                <div className="produtos-lista">
                  {produtosDisponiveis.length > 0 ? (
                    <div className="produtos-grid">
                      {produtosDisponiveis.map(produto => (
                        <div key={produto.id} className="produto-item">
                          <div className="produto-info">
                            <span className="produto-nome">{produto.nome}</span>
                            <span className="produto-preco">R$ {produto.preco.toFixed(2)}</span>
                          </div>
                          <div className="produto-acoes">
                            <button 
                              onClick={() => iniciarEdicaoProduto(produto)}
                              className="btn-edit-produto"
                              title="Editar Produto"
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => removerProdutoHandler(produto.id)}
                              className="btn-delete-produto"
                              title="Remover Produto"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="sem-produtos">Nenhum produto cadastrado</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={fecharGerenciamentoProdutos} className="btn-primary">
                ✅ Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
