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
  migrarConsumosLocaisParaFirestore,
  verificarAtualizarDiarias,
  registrarPagamentoDiaria
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
  const [mostrarDiarias, setMostrarDiarias] = useState(false);
  const [carregandoConsumos, setCarregandoConsumos] = useState(false);
  
  // Estados dos hóspedes selecionados
  const [hospedeCheckout, setHospedeCheckout] = useState(null);
  const [hospedeConsumos, setHospedeConsumos] = useState(null);
  const [hospedeFicha, setHospedeFicha] = useState(null);
  const [hospedeDiarias, setHospedeDiarias] = useState(null);
  const [editando, setEditando] = useState(null);
  const [produtoEditando, setProdutoEditando] = useState(null);
  
  // Estado para controlar quais consumos são por conta do cliente (novo)
  const [consumosPorContaCliente, setConsumosPorContaCliente] = useState(new Set());
  
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
    tipoPessoa: 'fisica',
    nome: '',
    telefone: '',
    rg: '',
    cpf: '',
    cnpj: '',
    razaoSocial: '',
    cnh: '',
    // Campos de endereço
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    // Campos originais
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
        const unsubscribe = escutarHospedes(async (hospedesRecebidos) => {
          console.log('📊 Hóspedes atualizados:', hospedesRecebidos.length);
          
          // Verificar e atualizar diárias para hóspedes ativos
          for (const hospede of hospedesRecebidos) {
            if (hospede.statusHospedagem === 'ATIVO') {
              await verificarAtualizarDiarias(hospede.id);
            }
          }
          
          // Carregar consumos para cada hóspede
          console.log('🛒 Carregando consumos para todos os hóspedes...');
          const hospedesComConsumos = await Promise.all(
            hospedesRecebidos.map(async (hospede) => {
              try {
                const consumos = await buscarConsumosHospede(hospede.id);
                return { ...hospede, consumos: consumos || [] };
              } catch (error) {
                console.error(`❌ Erro ao carregar consumos do hóspede ${hospede.nome}:`, error);
                return { ...hospede, consumos: [] };
              }
            })
          );
          
          console.log('✅ Consumos carregados para todos os hóspedes');
          setHospedes(hospedesComConsumos);
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

  // Função para obter data/hora no fuso horário local brasileiro
  const obterDataHoraLocal = () => {
    const agora = new Date();
    
    // Usar diretamente o horário local do sistema
    console.log('🇧🇷 Horário local do sistema:', agora.toLocaleString('pt-BR'));
    console.log('🌍 Horário UTC:', agora.toUTCString());
    console.log('⚡ Offset do navegador (min):', agora.getTimezoneOffset());
    
    return agora;
  };

  // Função para converter data para formato datetime-local (YYYY-MM-DDTHH:mm)
  const formatarParaDatetimeLocal = (data) => {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');
    
    return `${ano}-${mes}-${dia}T${horas}:${minutos}`;
  };

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

  // Calcular quantas diárias já passaram desde o check-in (baseado em períodos de meio-dia a meio-dia)
  const calcularDiariasDecorridas = (checkIn, checkOut = null, statusHospedagem = 'ATIVO') => {
    if (!checkIn) return 1;
    
    const dataCheckIn = new Date(checkIn);
    
    // Se está finalizado ou cancelado, usar a data de checkout, senão usar data atual
    const dataFinal = (statusHospedagem === 'FINALIZADO' || statusHospedagem === 'CANCELADO') && checkOut 
      ? new Date(checkOut) 
      : agora;
    
    // Função para obter a data do meio-dia (12:00) de uma data específica
    const obterMeioDia = (data) => {
      const meioDia = new Date(data);
      meioDia.setHours(12, 0, 0, 0);
      return meioDia;
    };
    
    // Começar contando a partir do check-in
    let contadorDiarias = 1;
    let dataAtual = new Date(dataCheckIn);
    
    // Loop para contar quantos meio-dias passaram desde o check-in
    while (true) {
      // Obter o meio-dia do dia atual
      let meioDiaAtual = obterMeioDia(dataAtual);
      
      // Se o check-in foi depois do meio-dia, o próximo marco é o meio-dia do dia seguinte
      if (dataAtual.getHours() >= 12) {
        meioDiaAtual.setDate(meioDiaAtual.getDate() + 1);
      }
      
      // Se ainda não chegou neste meio-dia, para de contar
      if (dataFinal < meioDiaAtual) {
        break;
      }
      
      // Passou por mais um meio-dia, conta mais uma diária
      contadorDiarias++;
      
      // Avançar para o próximo dia
      dataAtual = new Date(meioDiaAtual);
    }
    
    return contadorDiarias;
  };

  // Calcular valor total baseado nas diárias
  const calcularTotalDiarias = (valorDiaria, checkIn, checkOut = null, statusHospedagem = 'ATIVO') => {
    const diarias = calcularDiariasDecorridas(checkIn, checkOut, statusHospedagem);
    return valorDiaria * diarias;
  };

  // Formatear tempo decorrido
  const formatarTempoDecorrido = (checkIn, checkOut = null, statusHospedagem = 'ATIVO') => {
    if (!checkIn) return 'N/A';
    
    const dataCheckIn = new Date(checkIn);
    
    // Se está finalizado ou cancelado, usar a data de checkout, senão usar data atual
    const dataFinal = (statusHospedagem === 'FINALIZADO' || statusHospedagem === 'CANCELADO') && checkOut 
      ? new Date(checkOut) 
      : agora;
    
    const diferencaMs = dataFinal.getTime() - dataCheckIn.getTime();
    
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

  // Verificar se hóspede ainda pode ser editado (máximo 1 hora após finalização)
  const podeEditarHospede = (hospede) => {
    // Se está ativo, sempre pode editar
    if (hospede.statusHospedagem !== 'FINALIZADO') {
      return true;
    }
    
    // Se foi finalizado, verificar se passou menos de 1 hora
    if (hospede.dataFinalizacao) {
      const dataFinalizacao = new Date(hospede.dataFinalizacao);
      const agora = new Date();
      const diferencaMs = agora.getTime() - dataFinalizacao.getTime();
      const horasPassadas = diferencaMs / (1000 * 60 * 60);
      
      console.log(`🔒 Debug edição ${hospede.nome}:`);
      console.log(`   - Data finalização: ${hospede.dataFinalizacao}`);
      console.log(`   - Data atual: ${agora.toISOString()}`);
      console.log(`   - Horas passadas: ${horasPassadas.toFixed(2)}`);
      console.log(`   - Pode editar: ${horasPassadas < 1}`);
      
      return horasPassadas < 1; // Permite edição por até 1 hora
    }
    
    return false;
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
      
      // Se não informar check-in, usar horário local brasileiro atual
      const checkInFinal = formulario.checkIn || formatarParaDatetimeLocal(obterDataHoraLocal());
      
      console.log('📝 Check-in definido como:', checkInFinal);
      
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
      setFormulario({
        data: '',
        tipoPessoa: 'fisica',
        nome: '',
        telefone: '',
        rg: '',
        cpf: '',
        cnpj: '',
        razaoSocial: '',
        cnh: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
        quartos: '',
        pago: '',
        valorDiaria: '',
        checkIn: ''
      });
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
      tipoPessoa: hospede.tipoPessoa || 'fisica',
      nome: hospede.nome || '',
      telefone: hospede.telefone || '',
      rg: hospede.rg || '',
      cpf: hospede.cpf || '',
      cnh: hospede.cnh || '',
      cnpj: hospede.cnpj || '',
      razaoSocial: hospede.razaoSocial || '',
      logradouro: hospede.logradouro || '',
      numero: hospede.numero || '',
      complemento: hospede.complemento || '',
      bairro: hospede.bairro || '',
      cidade: hospede.cidade || '',
      estado: hospede.estado || '',
      cep: hospede.cep || '',
      quartos: hospede.quartos?.toString() || '',
      pago: hospede.pago || '',
      valorDiaria: hospede.valorDiaria?.toString() || '',
      checkIn: hospede.checkIn || ''
    });
    setMostrarFormulario(true);
  };

  // Esta função será usada futuramente pelo sistema de administração
  // eslint-disable-next-line no-unused-vars
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
      
      // Atualizar estado local do modal
      const consumoComId = { ...novoConsumo, id: consumoId };
      setHospedeConsumos(prev => ({
        ...prev,
        consumos: [consumoComId, ...(prev.consumos || [])]
      }));

      // Atualizar também a lista principal de hóspedes
      setHospedes(prev => prev.map(h => 
        h.id === hospedeConsumos.id 
          ? { ...h, consumos: [consumoComId, ...(h.consumos || [])] }
          : h
      ));

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
      
      // Atualizar estado local do modal
      setHospedeConsumos(prev => ({
        ...prev,
        consumos: prev.consumos.map(c => 
          c.id === consumoId ? { ...c, quantidade: novaQuantidade } : c
        )
      }));

      // Atualizar também a lista principal de hóspedes
      setHospedes(prev => prev.map(h => 
        h.id === hospedeConsumos.id 
          ? { 
              ...h, 
              consumos: h.consumos.map(c => 
                c.id === consumoId ? { ...c, quantidade: novaQuantidade } : c
              )
            }
          : h
      ));

      console.log('✅ Quantidade atualizada!');
    } catch (error) {
      console.error('❌ Erro ao atualizar quantidade:', error);
      alert('Erro ao atualizar quantidade: ' + error.message);
    }
  };

  const removerConsumo = async (consumoId) => {
    try {
      await removerConsumoFirestore(consumoId);
      
      // Atualizar estado local do modal
      setHospedeConsumos(prev => ({
        ...prev,
        consumos: prev.consumos.filter(c => c.id !== consumoId)
      }));

      // Atualizar também a lista principal de hóspedes
      setHospedes(prev => prev.map(h => 
        h.id === hospedeConsumos.id 
          ? { ...h, consumos: h.consumos.filter(c => c.id !== consumoId) }
          : h
      ));

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
    setConsumosPorContaCliente(new Set()); // Resetar consumos por conta do cliente
  };
  
  // ==================== HANDLERS DAS DIÁRIAS ====================
  
  const abrirDiarias = async (hospede) => {
    try {
      // Verificar e atualizar diárias antes de abrir o modal
      await verificarAtualizarDiarias(hospede.id);
      
      // Buscar dados atualizados do hóspede para exibir diárias
      const hospedeAtualizado = hospedes.find(h => h.id === hospede.id);
      setHospedeDiarias(hospedeAtualizado);
      setMostrarDiarias(true);
    } catch (error) {
      console.error('❌ Erro ao abrir gerenciamento de diárias:', error);
      alert('Erro ao abrir gerenciamento de diárias: ' + error.message);
    }
  };
  
  const fecharDiarias = () => {
    setMostrarDiarias(false);
    setHospedeDiarias(null);
  };
  
  const pagarDiaria = async (numeroDiaria) => {
    try {
      if (!hospedeDiarias) return;
      
      await registrarPagamentoDiaria(hospedeDiarias.id, numeroDiaria);
      
      // Atualizar informações do hóspede após o pagamento
      const hospedeAtualizado = hospedes.find(h => h.id === hospedeDiarias.id);
      setHospedeDiarias(hospedeAtualizado);
      
      alert(`✅ Diária ${numeroDiaria} paga com sucesso!`);
    } catch (error) {
      console.error('❌ Erro ao pagar diária:', error);
      alert('Erro ao pagar diária: ' + error.message);
    }
  };

  const finalizarHospedagem = async () => {
    if (!hospedeCheckout) return;

    try {
      // Usar horário local brasileiro para evitar problemas de fuso horário
      const agoraLocal = obterDataHoraLocal();
      
      // 🔍 DEBUG: Vamos ver exatamente que horas são
      console.log('🕒 DEBUG HORÁRIOS (CORRIGIDO):');
      console.log('  - Check-in original:', hospedeCheckout.checkIn);
      console.log('  - Check-in parseado:', new Date(hospedeCheckout.checkIn).toLocaleString('pt-BR'));
      
      const checkOut = formatarParaDatetimeLocal(agoraLocal);
      console.log('  - Check-out será salvo como:', checkOut);
      console.log('  - Check-out em local:', new Date(checkOut).toLocaleString('pt-BR'));
      
      const totalDiarias = calcularTotalDiarias(hospedeCheckout.valorDiaria, hospedeCheckout.checkIn);
      
      // Calcular totais separados (empresa vs cliente)
      const { totalEmpresa, totalCliente } = calcularTotaisSeparados(hospedeCheckout.consumos || []);
      const totalConsumos = totalEmpresa + totalCliente; // Total geral de consumos
      const totalFinal = totalDiarias + totalConsumos;
      const tempoEstadia = formatarTempoDecorrido(hospedeCheckout.checkIn, hospedeCheckout.checkOut, hospedeCheckout.statusHospedagem);
      
      console.log('💰 Finalizando hospedagem:');
      console.log('  - Total diárias:', totalDiarias);
      console.log('  - Total consumos empresa:', totalEmpresa);
      console.log('  - Total consumos cliente:', totalCliente);
      console.log('  - Total final:', totalFinal);
      console.log('  - Consumos para salvar:', hospedeCheckout.consumos);
      
      const dadosCheckout = {
        checkOut,
        dataFinalizacao: agoraLocal.toISOString(), // Para compatibilidade com a função de edição
        totalFinal,
        totalDiarias,
        totalConsumos,
        totalConsumosEmpresa: totalEmpresa, // Novo campo
        totalConsumosCliente: totalCliente, // Novo campo
        consumosPorContaCliente: Array.from(consumosPorContaCliente), // Salvar quais foram marcados
        tempoEstadia
      };

      // Finalizar hospedagem (marca como FINALIZADO)
      await finalizarHospedagemFirestore(hospedeCheckout.id, dadosCheckout);
      
      // Salvar no histórico completo com todos os dados
      await salvarHistoricoCheckout(hospedeCheckout, dadosCheckout, hospedeCheckout.consumos || []);
      
      // Gerar PDF
      gerarPDFCheckout(hospedeCheckout, checkOut);
      
      fecharCheckout();
      console.log('✅ Hospedagem finalizada com horário correto!');
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
    doc.text(`Tempo Total: ${formatarTempoDecorrido(hospede.checkIn, hospede.checkOut, hospede.statusHospedagem)}`, margemEsq, y);
    y += 15;
    
    // Calcular totais separados
    const { totalEmpresa, totalCliente, consumosEmpresa, consumosCliente } = calcularTotaisSeparados(hospede.consumos || []);
    const totalDiarias = calcularTotalDiarias(hospede.valorDiaria, hospede.checkIn, hospede.checkOut, hospede.statusHospedagem);
    
    // Resumo da Conta - EMPRESA
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('CONTA EMPRESA', margemEsq, y);
    y += 8;
    doc.line(margemEsq, y, margemEsq + larguraPagina, y);
    y += 8;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Valor da Diária: R$ ${hospede.valorDiaria.toFixed(2)}`, margemEsq, y);
    doc.text(`x ${calcularDiariasDecorridas(hospede.checkIn, hospede.checkOut, hospede.statusHospedagem)} diárias`, margemEsq + 100, y);
    doc.text(`R$ ${totalDiarias.toFixed(2)}`, margemEsq + 140, y);
    y += 6;
    
    // Consumos da empresa (não marcados por conta do cliente)
    if (consumosEmpresa.length > 0) {
      doc.text(`Consumos (empresa): R$ ${totalEmpresa.toFixed(2)}`, margemEsq, y);
      y += 6;
    }
    
    const totalContaEmpresa = totalDiarias + totalEmpresa;
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL CONTA EMPRESA: R$ ${totalContaEmpresa.toFixed(2)}`, margemEsq, y);
    y += 15;
    
    // Se há consumos por conta do cliente, mostrar separadamente
    if (consumosCliente.length > 0) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('CONTA CLIENTE', margemEsq, y);
      y += 8;
      doc.line(margemEsq, y, margemEsq + larguraPagina, y);
      y += 8;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text('Consumos por conta do cliente:', margemEsq, y);
      y += 6;
      
      // Detalhamento dos consumos do cliente
      doc.setFontSize(9);
      doc.text('ITEM', margemEsq, y);
      doc.text('QTD', margemEsq + 80, y);
      doc.text('VALOR UNIT.', margemEsq + 100, y);
      doc.text('SUBTOTAL', margemEsq + 130, y);
      y += 4;
      
      doc.line(margemEsq, y, margemEsq + larguraPagina, y);
      y += 4;
      
      doc.setFont(undefined, 'normal');
      consumosCliente.forEach(consumo => {
        const nomeItemCheckout = consumo.nome
          .replace(/🥤|💧|🍺|☕|🧊|🍫|🥜|🍪/g, '')
          .trim();
        doc.text(nomeItemCheckout.substring(0, 20), margemEsq, y);
        doc.text(`${consumo.quantidade}x`, margemEsq + 80, y);
        doc.text(`R$ ${consumo.preco.toFixed(2)}`, margemEsq + 100, y);
        doc.text(`R$ ${(consumo.preco * consumo.quantidade).toFixed(2)}`, margemEsq + 130, y);
        y += 4;
      });
      
      y += 4;
      doc.line(margemEsq + 100, y, margemEsq + larguraPagina, y);
      doc.setFont(undefined, 'bold');
      doc.text('TOTAL CONTA CLIENTE:', margemEsq + 80, y);
      doc.text(`R$ ${totalCliente.toFixed(2)}`, margemEsq + 130, y);
      y += 15;
    }
    
    // Total Final
    const totalGeral = totalContaEmpresa + totalCliente;
    y += 5;
    doc.setDrawColor(0);
    doc.setFillColor(240, 240, 240);
    doc.rect(margemEsq, y, larguraPagina, 15, 'FD');
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL GERAL:', margemEsq + 5, y + 9);
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
    doc.text(`Obrigado pela preferência! | Check-out realizado em: ${dataImpressao}`, 105, y, { align: 'center' });
    
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
    
    // Dados Pessoais ou Dados Corporativos dependendo do tipo de pessoa
    if (hospedeFicha.tipoPessoa === 'juridica') {
      adicionarSecao('Dados Corporativos', [
        { label: 'Razão Social', valor: hospedeFicha.razaoSocial || 'Nao informado' },
        { label: 'CNPJ', valor: hospedeFicha.cnpj || 'Nao informado' },
        { label: 'Telefone', valor: hospedeFicha.telefone || 'Nao informado' }
      ]);
    } else {
      adicionarSecao('Dados Pessoais', [
        { label: 'Nome Completo', valor: hospedeFicha.nome },
        { label: 'Telefone', valor: hospedeFicha.telefone || 'Nao informado' },
        { label: 'RG', valor: hospedeFicha.rg || 'Nao informado' },
        { label: 'CPF', valor: hospedeFicha.cpf || 'Nao informado' },
        { label: 'CNH', valor: hospedeFicha.cnh || 'Nao possui' }
      ]);
    }
    
    // Seção de Endereço
    adicionarSecao('Endereco', [
      { label: 'Logradouro', valor: hospedeFicha.logradouro || 'Nao informado' },
      { label: 'Numero', valor: hospedeFicha.numero || 'Nao informado' },
      { label: 'Complemento', valor: hospedeFicha.complemento || 'Nao informado' },
      { label: 'Bairro', valor: hospedeFicha.bairro || 'Nao informado' },
      { label: 'Cidade', valor: hospedeFicha.cidade || 'Nao informado' },
      { label: 'Estado', valor: hospedeFicha.estado || 'Nao informado' },
      { label: 'CEP', valor: hospedeFicha.cep || 'Nao informado' }
    ]);
    
    // Dados da Hospedagem
    adicionarSecao('Dados da Hospedagem', [
      { label: 'Data da Reserva', valor: hospedeFicha.data },
      { label: 'Quarto', valor: `No ${hospedeFicha.quartos}` },
      { label: 'Check-in', valor: hospedeFicha.checkIn ? new Date(hospedeFicha.checkIn).toLocaleString('pt-BR') : 'Nao informado' },
      { label: 'Tempo Hospedado', valor: formatarTempoDecorrido(hospedeFicha.checkIn, hospedeFicha.checkOut, hospedeFicha.statusHospedagem) },
      { label: 'Status Pagamento', valor: hospedeFicha.pago === 'PG' ? 'PAGO' : 'PENDENTE' }
    ]);
    
    // Resumo Financeiro
    const totalDiarias = calcularTotalDiarias(hospedeFicha.valorDiaria, hospedeFicha.checkIn, hospedeFicha.checkOut, hospedeFicha.statusHospedagem);
    const totalConsumos = calcularTotalConsumos(hospedeFicha.consumos);
    const totalGeral = totalDiarias + totalConsumos;
    
    adicionarSecao('Resumo Financeiro', [
      { label: 'Valor da Diária', valor: `R$ ${hospedeFicha.valorDiaria.toFixed(2)}` },
      { label: 'Numero de Diarias', valor: `${calcularDiariasDecorridas(hospedeFicha.checkIn, hospedeFicha.checkOut, hospedeFicha.statusHospedagem)}` },
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
      y += 6;
      
      doc.line(margemEsq, y, margemEsq + larguraPagina, y);
      y += 4;
      
      doc.setFont(undefined, 'normal');
      hospedeFicha.consumos.forEach(consumo => {
        // Função mais simples para remover emojis comuns, preservando texto normal
        const nomeItemFicha = consumo.nome
          .replace(/🥤|💧|🍺|☕|🧊|🍫|🥜|🍪/g, '') // Remove apenas emojis específicos conhecidos
          .trim();
        doc.text(nomeItemFicha.substring(0, 25), margemEsq, y);
        doc.text(`${consumo.quantidade}x`, margemEsq + 80, y);
        doc.text(`R$ ${consumo.preco.toFixed(2)}`, margemEsq + 100, y);
        doc.text(`R$ ${(consumo.preco * consumo.quantidade).toFixed(2)}`, margemEsq + 130, y);
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
    
    // Lógica de exibição por status
    const statusHospedagem = mostrarHistorico ? 
      (statusHospedagemAtual === 'FINALIZADO' || statusHospedagemAtual === 'CANCELADO') : 
      statusHospedagemAtual === 'ATIVO';
    
    return matchNome && matchStatus && statusHospedagem;
  });

  // Recalcular com base no statusHospedagem correto
  const hospedesAtivos = hospedes.filter(h => {
    const status = h.statusHospedagem || 'ATIVO';
    return status === 'ATIVO';
  });
  
  const hospedesFinalizados = hospedes.filter(h => {
    return h.statusHospedagem === 'FINALIZADO';
  });

  const hospedesCancelados = hospedes.filter(h => {
    return h.statusHospedagem === 'CANCELADO';
  });

  console.log(`📊 Recálculo - ATIVOS: ${hospedesAtivos.length}, FINALIZADOS: ${hospedesFinalizados.length}, CANCELADOS: ${hospedesCancelados.length}`);

  // === DASHBOARD === Cálculo das estatísticas para o painel principal
  const totalHospedes = hospedesAtivos.length;
  
  // Corrigido: Contagem de pagamentos confirmados deve contar TODAS as diárias pagas
  const totalPago = hospedesAtivos.reduce((total, h) => {
    // Somar todas as diárias com status PAGO para todos os hóspedes
    const diariasPagas = h.controleDiarias?.diarias?.filter(d => d.status === 'PAGO')?.length || 0;
    return total + diariasPagas;
  }, 0);
  
  // Corrigido: Contagem de pagamentos pendentes deve contar TODAS as diárias pendentes
  const totalPendente = hospedesAtivos.reduce((total, h) => {
    // Somar todas as diárias com status PENDENTE para todos os hóspedes
    const diariasPendentes = h.controleDiarias?.diarias?.filter(d => d.status === 'PENDENTE')?.length || 0;
    return total + diariasPendentes;
  }, 0);
  
  // Para calcular faturamento, precisamos dos consumos
  const faturamentoDiarias = hospedesAtivos.reduce((acc, h) => 
    acc + calcularTotalDiarias(h.valorDiaria, h.checkIn, h.checkOut, h.statusHospedagem), 0
  );
  const faturamentoConsumos = 0; // Será calculado quando necessário

  // ==================== SISTEMA DE CANCELAMENTO SEGURO ====================

  const cancelarHospedagem = async (hospede, motivo) => {
    if (!hospede || !motivo) return;

    try {
      const agoraLocal = obterDataHoraLocal();
      
      console.log('🚫 Cancelando hospedagem:', hospede.nome);
      console.log('📋 Motivo:', motivo);
      
      const dadosCancelamento = {
        statusHospedagem: 'CANCELADO',
        pago: 'CANCELADO', // Status específico para cancelamentos - não manter o pagamento original
        dataCancelamento: agoraLocal.toISOString(),
        dataFinalizacao: agoraLocal.toISOString(), // Adicionar campo dataFinalizacao
        motivoCancelamento: motivo,
        checkOut: formatarParaDatetimeLocal(agoraLocal), // Marcar como saída
        totalFinal: 0, // Sem cobrança para cancelamentos rápidos
        totalDiarias: 0,
        totalConsumos: calcularTotalConsumos(hospede.consumos || []),
        tempoEstadia: formatarTempoDecorrido(hospede.checkIn, null, 'ATIVO'),
        canceladoPor: 'SISTEMA', // Pode ser expandido para incluir usuário logado
        observacoesCancelamento: `Cancelamento realizado ${formatarTempoDecorrido(hospede.checkIn, null, 'ATIVO')} após check-in`
      };

      // Atualizar no Firestore
      await finalizarHospedagemFirestore(hospede.id, dadosCancelamento);
      
      // Salvar no histórico como cancelamento (para auditoria)
      await salvarHistoricoCheckout(hospede, dadosCancelamento, hospede.consumos || []);
      
      console.log('✅ Hospedagem cancelada e registrada no histórico para auditoria');
      alert(`✅ Hospedagem cancelada com sucesso!\n📋 Motivo: ${motivo}\n🔍 Registro mantido no histórico para auditoria.`);
      
    } catch (error) {
      console.error('❌ Erro ao cancelar hospedagem:', error);
      alert('Erro ao cancelar hospedagem: ' + error.message);
    }
  };

  // Verificar se hospedagem pode ser cancelada (apenas primeiros 30 minutos)
  const podeSerCancelada = (hospede) => {
    if (!hospede.checkIn || hospede.statusHospedagem !== 'ATIVO') return false;
    
    const dataCheckIn = new Date(hospede.checkIn);
    const agora = new Date();
    const minutosDecorridos = (agora.getTime() - dataCheckIn.getTime()) / (1000 * 60);
    
    return minutosDecorridos <= 30; // Só permite cancelar em até 30 minutos
  };

  // Modal de cancelamento
  const [mostrarCancelamento, setMostrarCancelamento] = useState(false);
  const [hospedeCancelamento, setHospedeCancelamento] = useState(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');

  const abrirCancelamento = (hospede) => {
    setHospedeCancelamento(hospede);
    setMostrarCancelamento(true);
    setMotivoCancelamento('');
  };

  const fecharCancelamento = () => {
    setMostrarCancelamento(false);
    setHospedeCancelamento(null);
    setMotivoCancelamento('');
  };

  const confirmarCancelamento = async () => {
    if (!motivoCancelamento.trim()) {
      alert('Por favor, informe o motivo do cancelamento.');
      return;
    }

    await cancelarHospedagem(hospedeCancelamento, motivoCancelamento.trim());
    fecharCancelamento();
  };

  // Função para alternar se um consumo é por conta do cliente
  const alternarConsumoContaCliente = (consumoId) => {
    setConsumosPorContaCliente(prev => {
      const novoSet = new Set(prev);
      if (novoSet.has(consumoId)) {
        novoSet.delete(consumoId);
      } else {
        novoSet.add(consumoId);
      }
      return novoSet;
    });
  };

  // Função para calcular totais separados (empresa vs cliente)
  const calcularTotaisSeparados = (consumos) => {
    const consumosEmpresa = consumos.filter(c => !consumosPorContaCliente.has(c.id));
    const consumosCliente = consumos.filter(c => consumosPorContaCliente.has(c.id));
    
    return {
      totalEmpresa: calcularTotalConsumos(consumosEmpresa),
      totalCliente: calcularTotalConsumos(consumosCliente),
      consumosEmpresa,
      consumosCliente
    };
  };

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
                  {hospede.statusHospedagem === 'CANCELADO' || hospede.pago === 'CANCELADO' ? (
                    <span className="status cancelado">
                      🚫 Cancelado
                    </span>
                  ) : hospede.statusHospedagem === 'FINALIZADO' ? (
                    <span className="status finalizado">
                      ✅ Finalizado
                    </span>
                  ) : (
                  <span className={`status ${hospede.pago === 'PG' ? 'pago' : 'pendente'}`}>
                    {hospede.pago === 'PG' ? '✅ Pago' : '⏳ Pendente'}
                  </span>
                  )}
                </td>
                <td>R$ {hospede.valorDiaria.toFixed(2)}</td>
                <td className="tempo-cell">
                  <div>
                    <span className="tempo-decorrido">{formatarTempoDecorrido(hospede.checkIn, hospede.checkOut, hospede.statusHospedagem)}</span>
                    <span className="diarias-count">{calcularDiariasDecorridas(hospede.checkIn, hospede.checkOut, hospede.statusHospedagem)} diária(s)</span>
                  </div>
                </td>
                <td className="total-cell">
                  <div>
                    <div>
                      <strong>R$ {(calcularTotalDiarias(hospede.valorDiaria, hospede.checkIn, hospede.checkOut, hospede.statusHospedagem) + calcularTotalConsumos(hospede.consumos || [])).toFixed(2)}</strong>
                    </div>
                    <small style={{ color: '#666', fontSize: '0.8rem' }}>
                      Diárias: R$ {calcularTotalDiarias(hospede.valorDiaria, hospede.checkIn, hospede.checkOut, hospede.statusHospedagem).toFixed(2)}
                      {hospede.consumos && hospede.consumos.length > 0 && (
                        <span> + Consumos: R$ {calcularTotalConsumos(hospede.consumos).toFixed(2)}</span>
                      )}
                    </small>
                  </div>
                </td>
                <td>
                  <button 
                    onClick={() => abrirConsumos(hospede)}
                    className="btn-consumos"
                    disabled={hospede.statusHospedagem === 'FINALIZADO' || hospede.statusHospedagem === 'CANCELADO'}
                    title={hospede.statusHospedagem === 'FINALIZADO' ? "❌ Consumos bloqueados - Reserva finalizada" : 
                           hospede.statusHospedagem === 'CANCELADO' ? "❌ Consumos bloqueados - Reserva cancelada" : 
                           "🛒 Gerenciar Consumos"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg> Consumos
                  </button>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => abrirFicha(hospede)}
                      className="btn-ficha"
                      title="Ver Ficha Completa"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </button>
                    {!mostrarHistorico && (
                      <>
                        <button
                          onClick={() => abrirDiarias(hospede)}
                          className="btn-diarias"
                          title="Gerenciar Diárias"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </button>
                        <button
                          onClick={() => abrirCheckout(hospede)}
                          className="btn-checkout"
                          title="Finalizar Hospedagem"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </button>
                      </>
                    )}
                    {!mostrarHistorico && podeSerCancelada(hospede) && (
                      <button
                        onClick={() => abrirCancelamento(hospede)}
                        className="btn-cancel"
                        title="Cancelar Hospedagem (até 30min)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                      </button>
                    )}
                    {podeEditarHospede(hospede) ? (
                      <>
                        <button
                          onClick={() => iniciarEdicao(hospede)}
                          className="btn-edit"
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn-edit disabled"
                          title="Bloqueado - Mais de 1 hora após finalização"
                          disabled
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </button>
                      </>
                    )}
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

              {/* Tipo de Pessoa */}
              <div className="form-group">
                <label>👥 Tipo de Pessoa:</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="tipoPessoa"
                      value="fisica"
                      checked={formulario.tipoPessoa === 'fisica'}
                      onChange={(e) => setFormulario({...formulario, tipoPessoa: e.target.value})}
                    />
                    Pessoa Física
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="tipoPessoa"
                      value="juridica"
                      checked={formulario.tipoPessoa === 'juridica'}
                      onChange={(e) => setFormulario({...formulario, tipoPessoa: e.target.value})}
                    />
                    Pessoa Jurídica
                  </label>
                </div>
              </div>

              {/* Campos específicos para Pessoa Física */}
              {formulario.tipoPessoa === 'fisica' && (
                <>
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

                  <div className="form-group">
                    <label>🚗 CNH:</label>
                    <input
                      type="text"
                      value={formulario.cnh}
                      onChange={(e) => setFormulario({...formulario, cnh: e.target.value})}
                      placeholder="12345678901 (opcional)"
                    />
                  </div>
                </>
              )}

              {/* Campos específicos para Pessoa Jurídica */}
              {formulario.tipoPessoa === 'juridica' && (
                <>
                  <div className="form-group">
                    <label>🏢 Razão Social:</label>
                    <input
                      type="text"
                      value={formulario.razaoSocial}
                      onChange={(e) => setFormulario({...formulario, razaoSocial: e.target.value, nome: e.target.value})}
                      placeholder="Razão Social da Empresa"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>📄 CNPJ:</label>
                    <input
                      type="text"
                      value={formulario.cnpj}
                      onChange={(e) => setFormulario({...formulario, cnpj: e.target.value})}
                      placeholder="00.000.000/0001-00"
                      required
                    />
                  </div>
                </>
              )}

              {/* Campos comuns para ambos os tipos */}
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

              {/* Seção de Endereço */}
              <h3 className="form-section-title">📍 Endereço Completo</h3>

              <div className="form-row">
                <div className="form-group form-group-large">
                  <label>Logradouro:</label>
                  <input
                    type="text"
                    value={formulario.logradouro}
                    onChange={(e) => setFormulario({...formulario, logradouro: e.target.value})}
                    placeholder="Rua, Avenida, etc."
                  />
                </div>
                <div className="form-group form-group-small">
                  <label>Número:</label>
                  <input
                    type="text"
                    value={formulario.numero}
                    onChange={(e) => setFormulario({...formulario, numero: e.target.value})}
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Complemento:</label>
                  <input
                    type="text"
                    value={formulario.complemento}
                    onChange={(e) => setFormulario({...formulario, complemento: e.target.value})}
                    placeholder="Apto, Bloco, etc. (opcional)"
                  />
                </div>
                <div className="form-group">
                  <label>Bairro:</label>
                  <input
                    type="text"
                    value={formulario.bairro}
                    onChange={(e) => setFormulario({...formulario, bairro: e.target.value})}
                    placeholder="Bairro"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>CEP:</label>
                  <input
                    type="text"
                    value={formulario.cep}
                    onChange={(e) => setFormulario({...formulario, cep: e.target.value})}
                    placeholder="00000-000"
                  />
                </div>
                <div className="form-group">
                  <label>Cidade:</label>
                  <input
                    type="text"
                    value={formulario.cidade}
                    onChange={(e) => setFormulario({...formulario, cidade: e.target.value})}
                    placeholder="Cidade"
                  />
                </div>
                <div className="form-group form-group-small">
                  <label>Estado:</label>
                  <select
                    value={formulario.estado}
                    onChange={(e) => setFormulario({...formulario, estado: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    <option value="AC">AC</option>
                    <option value="AL">AL</option>
                    <option value="AM">AM</option>
                    <option value="AP">AP</option>
                    <option value="BA">BA</option>
                    <option value="CE">CE</option>
                    <option value="DF">DF</option>
                    <option value="ES">ES</option>
                    <option value="GO">GO</option>
                    <option value="MA">MA</option>
                    <option value="MG">MG</option>
                    <option value="MS">MS</option>
                    <option value="MT">MT</option>
                    <option value="PA">PA</option>
                    <option value="PB">PB</option>
                    <option value="PE">PE</option>
                    <option value="PI">PI</option>
                    <option value="PR">PR</option>
                    <option value="RJ">RJ</option>
                    <option value="RN">RN</option>
                    <option value="RO">RO</option>
                    <option value="RR">RR</option>
                    <option value="RS">RS</option>
                    <option value="SC">SC</option>
                    <option value="SE">SE</option>
                    <option value="SP">SP</option>
                    <option value="TO">TO</option>
                  </select>
                </div>
              </div>

              <h3 className="form-section-title">💰 Informações de Pagamento</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Valor da Diária (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formulario.valorDiaria}
                    onChange={(e) => setFormulario({...formulario, valorDiaria: e.target.value})}
                    placeholder="120.00"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status do Pagamento:</label>
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
                  <div><strong>Tempo de estadia:</strong> {formatarTempoDecorrido(hospedeCheckout.checkIn, hospedeCheckout.checkOut, hospedeCheckout.statusHospedagem)}</div>
                </div>
              </div>

              <div className="checkout-resumo">
                <h3>💰 Resumo Financeiro</h3>
                <div className="resumo-itens">
                  
                  {/* Conta da Empresa */}
                  <div className="conta-empresa">
                    <h4>🏢 Conta da Empresa</h4>
                    <div className="resumo-linha">
                      <span>Diárias ({calcularDiariasDecorridas(hospedeCheckout.checkIn, hospedeCheckout.checkOut, hospedeCheckout.statusHospedagem)}x R$ {hospedeCheckout.valorDiaria.toFixed(2)}):</span>
                      <span>R$ {calcularTotalDiarias(hospedeCheckout.valorDiaria, hospedeCheckout.checkIn, hospedeCheckout.checkOut, hospedeCheckout.statusHospedagem).toFixed(2)}</span>
                    </div>
                    
                    {/* Consumos da empresa */}
                    {(() => {
                      const { totalEmpresa } = calcularTotaisSeparados(hospedeCheckout.consumos || []);
                      return totalEmpresa > 0 ? (
                        <div className="resumo-linha">
                          <span>Consumos (empresa):</span>
                          <span>R$ {totalEmpresa.toFixed(2)}</span>
                        </div>
                      ) : null;
                    })()}
                    
                    <div className="resumo-subtotal">
                      <span><strong>Subtotal Empresa:</strong></span>
                      <span><strong>R$ {(() => {
                        const { totalEmpresa } = calcularTotaisSeparados(hospedeCheckout.consumos || []);
                        const totalDiarias = calcularTotalDiarias(hospedeCheckout.valorDiaria, hospedeCheckout.checkIn, hospedeCheckout.checkOut, hospedeCheckout.statusHospedagem);
                        return (totalDiarias + totalEmpresa).toFixed(2);
                      })()}</strong></span>
                    </div>
                  </div>
                  
                  {/* Detalhamento dos Consumos com Checkboxes */}
                  {carregandoConsumos ? (
                    <div className="loading-consumos">
                      <span>🔄 Carregando consumos...</span>
                    </div>
                  ) : hospedeCheckout.consumos && hospedeCheckout.consumos.length > 0 ? (
                    <div className="consumos-detalhamento">
                      <div className="consumos-header-checkout">
                        <strong>🛒 Consumos - Quem Paga?</strong>
                        <small>(Marque os que são por conta do cliente)</small>
                      </div>
                      {hospedeCheckout.consumos.map(consumo => (
                        <div key={consumo.id} className="consumo-linha-checkout-novo">
                          <div className="consumo-checkbox">
                            <input
                              type="checkbox"
                              id={`consumo-${consumo.id}`}
                              checked={consumosPorContaCliente.has(consumo.id)}
                              onChange={() => alternarConsumoContaCliente(consumo.id)}
                            />
                            <label htmlFor={`consumo-${consumo.id}`}>
                              {consumosPorContaCliente.has(consumo.id) ? '👤 Cliente paga' : '🏢 Empresa paga'}
                            </label>
                          </div>
                          <div className="consumo-info">
                            <span className="consumo-item-nome">{consumo.nome}</span>
                            <span className="consumo-qtd">{consumo.quantidade}x</span>
                            <span className="consumo-valor-unit">R$ {consumo.preco.toFixed(2)}</span>
                            <span className="consumo-subtotal">R$ {(consumo.preco * consumo.quantidade).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="resumo-linha">
                      <span>Consumos:</span>
                      <span>R$ 0,00 (Nenhum consumo registrado)</span>
                    </div>
                  )}
                  
                  {/* Conta do Cliente (se houver) */}
                  {(() => {
                    const { totalCliente } = calcularTotaisSeparados(hospedeCheckout.consumos || []);
                    return totalCliente > 0 ? (
                      <div className="conta-cliente">
                        <h4>👤 Conta do Cliente</h4>
                        <div className="resumo-linha">
                          <span>Consumos (cliente):</span>
                          <span>R$ {totalCliente.toFixed(2)}</span>
                        </div>
                        <div className="resumo-subtotal">
                          <span><strong>Subtotal Cliente:</strong></span>
                          <span><strong>R$ {totalCliente.toFixed(2)}</strong></span>
                        </div>
                      </div>
                    ) : null;
                  })()}
                  
                  <div className="resumo-total">
                    <span><strong>TOTAL GERAL:</strong></span>
                    <span><strong>R$ {(() => {
                      const { totalEmpresa, totalCliente } = calcularTotaisSeparados(hospedeCheckout.consumos || []);
                      const totalDiarias = calcularTotalDiarias(hospedeCheckout.valorDiaria, hospedeCheckout.checkIn, hospedeCheckout.checkOut, hospedeCheckout.statusHospedagem);
                      return (totalDiarias + totalEmpresa + totalCliente).toFixed(2);
                    })()}</strong></span>
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
                  <h3>👤 {hospedeFicha.tipoPessoa === 'juridica' ? 'Dados Corporativos' : 'Dados Pessoais'}</h3>
                  <div className="dados-grid">
                    {hospedeFicha.tipoPessoa === 'juridica' ? (
                      // Exibir campos de pessoa jurídica
                      <>
                        <div><strong>Razão Social:</strong> {hospedeFicha.razaoSocial}</div>
                        <div><strong>CNPJ:</strong> {hospedeFicha.cnpj}</div>
                        <div><strong>Telefone:</strong> {hospedeFicha.telefone}</div>
                      </>
                    ) : (
                      // Exibir campos de pessoa física
                      <>
                        <div><strong>Nome:</strong> {hospedeFicha.nome}</div>
                        <div><strong>Telefone:</strong> {hospedeFicha.telefone}</div>
                        <div><strong>RG:</strong> {hospedeFicha.rg}</div>
                        <div><strong>CPF:</strong> {hospedeFicha.cpf}</div>
                        <div><strong>CNH:</strong> {hospedeFicha.cnh || 'Não informado'}</div>
                      </>
                    )}
                  </div>
                </div>

                <div className="ficha-section">
                  <h3>📍 Endereço</h3>
                  <div className="dados-grid">
                    <div><strong>Logradouro:</strong> {hospedeFicha.logradouro || 'Não informado'}</div>
                    <div><strong>Número:</strong> {hospedeFicha.numero || 'Não informado'}</div>
                    <div><strong>Complemento:</strong> {hospedeFicha.complemento || 'Não informado'}</div>
                    <div><strong>Bairro:</strong> {hospedeFicha.bairro || 'Não informado'}</div>
                    <div><strong>Cidade:</strong> {hospedeFicha.cidade || 'Não informado'}</div>
                    <div><strong>Estado:</strong> {hospedeFicha.estado || 'Não informado'}</div>
                    <div><strong>CEP:</strong> {hospedeFicha.cep || 'Não informado'}</div>
                  </div>
                </div>

                <div className="ficha-section">
                  <h3>🏨 Dados da Hospedagem</h3>
                  <div className="dados-grid">
                    <div><strong>Data:</strong> {hospedeFicha.data}</div>
                    <div><strong>Quarto:</strong> {hospedeFicha.quartos}</div>
                    <div><strong>Check-in:</strong> {new Date(hospedeFicha.checkIn).toLocaleString('pt-BR')}</div>
                    <div><strong>Tempo de estadia:</strong> {formatarTempoDecorrido(hospedeFicha.checkIn, hospedeFicha.checkOut, hospedeFicha.statusHospedagem)}</div>
                    <div><strong>Status:</strong> <span className={`status ${hospedeFicha.pago === 'PG' ? 'pago' : 'pendente'}`}>{hospedeFicha.pago === 'PG' ? '✅ Pago' : '⏳ Pendente'}</span></div>
                  </div>
                </div>

                <div className="ficha-section">
                  <h3>💰 Dados Financeiros</h3>
                  <div className="dados-grid">
                    <div><strong>Valor da Diária:</strong> R$ {hospedeFicha.valorDiaria.toFixed(2)}</div>
                    <div><strong>Diárias:</strong> {calcularDiariasDecorridas(hospedeFicha.checkIn, hospedeFicha.checkOut, hospedeFicha.statusHospedagem)}</div>
                    <div><strong>Total Diárias:</strong> R$ {calcularTotalDiarias(hospedeFicha.valorDiaria, hospedeFicha.checkIn, hospedeFicha.checkOut, hospedeFicha.statusHospedagem).toFixed(2)}</div>
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
                <div className="total-valor">R$ {(calcularTotalDiarias(hospedeFicha.valorDiaria, hospedeFicha.checkIn, hospedeFicha.checkOut, hospedeFicha.statusHospedagem) + calcularTotalConsumos(hospedeFicha.consumos)).toFixed(2)}</div>
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

      {/* Modal de Diárias */}
      {mostrarDiarias && hospedeDiarias && (
        <div className="modal-overlay">
          <div className="modal modal-diarias">
            <div className="diarias-header">
              <h2>📅 Gerenciamento de Diárias - {hospedeDiarias.nome}</h2>
              <button onClick={fecharDiarias} className="btn-close">✖️</button>
            </div>

            {/* modal gerenciamento de diarias */}
            <div className="diarias-content">
              <div className="info-hospede">
                <div className="info-grid">
                  <div><strong>Nome:</strong> {hospedeDiarias.nome}</div>
                  <div><strong>Quarto:</strong> {hospedeDiarias.quartos}</div>
                  <div><strong>Check-in:</strong> {new Date(hospedeDiarias.checkIn).toLocaleString('pt-BR')}</div>
                  <div><strong>Diária:</strong> R$ {hospedeDiarias.valorDiaria.toFixed(2)}</div>
                </div>
              </div>
              
              <div className="diarias-lista">
                <h3>📊 Controle de Diárias</h3>
                {hospedeDiarias.controleDiarias && hospedeDiarias.controleDiarias.diarias ? (
                  <div className="tabela-diarias">
                    <table>
                      <thead>
                        <tr>
                          <th>Nº</th>
                          <th>Início</th>
                          <th>Status</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hospedeDiarias.controleDiarias.diarias.map(diaria => (
                          <tr key={diaria.numero} className={`diaria-row ${diaria.status.toLowerCase()}`}>
                            <td>{diaria.numero}</td>
                            <td>{diaria.dataInicio ? (diaria.dataInicio.toDate ? diaria.dataInicio.toDate().toLocaleString('pt-BR') : new Date(diaria.dataInicio).toLocaleString('pt-BR')) : '-'}</td>
                            <td>
                              <span className={`status-diaria ${diaria.status.toLowerCase()}`}>
                                {diaria.status === 'PAGO' ? '✅ Pago' : 
                                 diaria.status === 'PENDENTE' ? '⏳ Pendente' : '⌛ Aguardando'}
                              </span>
                            </td>
                            <td>
                              {diaria.status !== 'PAGO' && (
                                <button
                                  onClick={() => pagarDiaria(diaria.numero)}
                                  className="btn-pagar-diaria"
                                >
                                  💰 Pagar
                                </button>
                              )}
                              {diaria.status === 'PAGO' && diaria.dataPagamento && (
                                <span className="data-pagamento">
                                  Pago em: {diaria.dataPagamento.toDate ? diaria.dataPagamento.toDate().toLocaleString('pt-BR') : new Date(diaria.dataPagamento).toLocaleString('pt-BR')}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="sem-diarias">Este hóspede não possui controle de diárias configurado.</p>
                )}
              </div>
              
              <div className="diarias-resumo">
                <h3>💰 Resumo</h3>
                <div className="resumo-diarias">
                  <div className="resumo-linha">
                    <span>Total de Diárias:</span>
                    <span>{hospedeDiarias.controleDiarias?.diarias?.length || 0}</span>
                  </div>
                  <div className="resumo-linha">
                    <span>Diárias Pagas:</span>
                    <span>{hospedeDiarias.controleDiarias?.diarias?.filter(d => d.status === 'PAGO').length || 0}</span>
                  </div>
                  <div className="resumo-linha">
                    <span>Diárias Pendentes:</span>
                    <span>{hospedeDiarias.controleDiarias?.diarias?.filter(d => d.status === 'PENDENTE').length || 0}</span>
                  </div>
                  <div className="resumo-linha">
                    <span>Valor Total Pago:</span>
                    <span>R$ {((hospedeDiarias.controleDiarias?.diarias?.filter(d => d.status === 'PAGO').length || 0) * hospedeDiarias.valorDiaria).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={fecharDiarias} className="btn-primary">
                ✅ Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelamento */}
      {mostrarCancelamento && hospedeCancelamento && (
        <div className="modal-overlay">
          <div className="modal modal-cancelamento">
            <div className="cancelamento-header">
              <h2>🚫 Cancelamento de Hospedagem</h2>
              <button onClick={fecharCancelamento} className="btn-close">✖️</button>
            </div>

            <div className="cancelamento-content">
              <div className="cancelamento-info">
                <h3>👤 Dados do Hóspede</h3>
                <div className="info-grid">
                  <div><strong>Nome:</strong> {hospedeCancelamento.nome}</div>
                  <div><strong>Quarto:</strong> {hospedeCancelamento.quartos}</div>
                  <div><strong>Check-in:</strong> {new Date(hospedeCancelamento.checkIn).toLocaleString('pt-BR')}</div>
                  <div><strong>Tempo decorrido:</strong> {formatarTempoDecorrido(hospedeCancelamento.checkIn, null, 'ATIVO')}</div>
                </div>
                
                <div className="form-group">
                  <label><strong>📋 Motivo do Cancelamento:</strong></label>
                  <select
                    value={motivoCancelamento}
                    onChange={(e) => setMotivoCancelamento(e.target.value)}
                    required
                  >
                    <option value="">Selecione o motivo...</option>
                    <option value="Cliente desistiu">Cliente desistiu</option>
                    <option value="Problema no quarto">Problema no quarto</option>
                    <option value="Check-in por engano">Check-in por engano</option>
                    <option value="Questões de pagamento">Questões de pagamento</option>
                    <option value="Emergência do cliente">Emergência do cliente</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="cancelamento-resumo">
                <h3>💰 Resumo Financeiro</h3>
                <div className="resumo-itens">
                  <div className="resumo-linha">
                    <span>Total Diárias:</span>
                    <span>R$ 0,00 (Cancelamento rápido)</span>
                  </div>
                  <div className="resumo-linha">
                    <span>Total Consumos:</span>
                    <span>R$ {calcularTotalConsumos(hospedeCancelamento.consumos || []).toFixed(2)}</span>
                  </div>
                  <div className="resumo-total">
                    <span><strong>TOTAL GERAL:</strong></span>
                    <span><strong>R$ {calcularTotalConsumos(hospedeCancelamento.consumos || []).toFixed(2)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="cancelamento-actions">
                <button onClick={fecharCancelamento} className="btn-secondary">
                  Cancelar
                </button>
                <button onClick={confirmarCancelamento} className="btn-primary">
                  ✅ Confirmar Cancelamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
