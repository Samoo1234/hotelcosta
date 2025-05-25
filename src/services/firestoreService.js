// Serviços para interação com Firestore
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

// ==================== HÓSPEDES ====================

// Buscar todos os hóspedes
export const buscarHospedes = async () => {
  try {
    const q = query(collection(db, 'hospedes'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao buscar hóspedes:', error);
    return [];
  }
};

// Listener em tempo real para hóspedes
export const escutarHospedes = (callback) => {
  const q = query(collection(db, 'hospedes'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (querySnapshot) => {
    const hospedes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(hospedes);
  });
};

// Adicionar novo hóspede
export const adicionarHospede = async (hospedeData) => {
  try {
    const docRef = await addDoc(collection(db, 'hospedes'), {
      ...hospedeData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar hóspede:', error);
    throw error;
  }
};

// Atualizar hóspede
export const atualizarHospede = async (hospedeId, dadosAtualizados) => {
  try {
    const hospedeRef = doc(db, 'hospedes', hospedeId);
    await updateDoc(hospedeRef, {
      ...dadosAtualizados,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao atualizar hóspede:', error);
    throw error;
  }
};

// Remover hóspede
export const removerHospede = async (hospedeId) => {
  try {
    await deleteDoc(doc(db, 'hospedes', hospedeId));
  } catch (error) {
    console.error('Erro ao remover hóspede:', error);
    throw error;
  }
};

// Finalizar hospedagem
export const finalizarHospedagem = async (hospedeId, dadosCheckout) => {
  try {
    const hospedeRef = doc(db, 'hospedes', hospedeId);
    await updateDoc(hospedeRef, {
      statusHospedagem: 'FINALIZADO',
      checkOut: dadosCheckout.checkOut,
      dataFinalizacao: dadosCheckout.dataFinalizacao,
      totalFinal: dadosCheckout.totalFinal,
      updatedAt: serverTimestamp()
    });

    // Adicionar ao histórico de checkout
    await addDoc(collection(db, 'checkout_history'), {
      hospedeId,
      ...dadosCheckout,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao finalizar hospedagem:', error);
    throw error;
  }
};

// ==================== CONSUMOS ====================

// Adicionar consumo a um hóspede
export const adicionarConsumo = async (hospedeId, consumoData) => {
  try {
    console.log('🔥 === FIRESTORE: Adicionando consumo ===');
    console.log('🆔 hospedeId recebido:', hospedeId);
    console.log('📦 consumoData recebido:', consumoData);
    
    // Verificar se a coleção existe
    console.log('🔍 Verificando coleção consumos...');
    
    const dadosCompletos = {
      hospedeId,
      ...consumoData,
      createdAt: serverTimestamp()
    };
    
    console.log('💾 Dados completos a salvar:', dadosCompletos);
    
    const docRef = await addDoc(collection(db, 'consumos'), dadosCompletos);
    
    console.log('✅ Documento criado com ID:', docRef.id);
    console.log('✅ Consumo salvo no Firestore com sucesso!');
    
    return docRef.id;
  } catch (error) {
    console.error('❌ ERRO DETALHADO no Firestore:', error);
    console.error('❌ Código do erro:', error.code);
    console.error('❌ Mensagem do erro:', error.message);
    console.error('❌ Stack completo:', error.stack);
    throw error;
  }
};

// Buscar consumos de um hóspede (versão original)
export const buscarConsumosHospede = async (hospedeId) => {
  try {
    console.log('🔍 === TENTATIVA 1: Query com WHERE ===');
    console.log('🆔 hospedeId:', hospedeId);
    
    const q = query(
      collection(db, 'consumos'), 
      where('hospedeId', '==', hospedeId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const consumos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('📊 Consumos encontrados com query WHERE:', consumos.length);
    
    if (consumos.length > 0) {
      console.log('✅ Query WHERE funcionou!');
      return consumos;
    }
    
    // Se não encontrou nada, tenta busca alternativa
    console.log('🔄 Query WHERE não encontrou nada, tentando busca alternativa...');
    return await buscarConsumosHospedeAlternativo(hospedeId);
    
  } catch (error) {
    console.error('❌ ERRO na query WHERE:', error);
    console.log('🔄 Tentando busca alternativa devido ao erro...');
    return await buscarConsumosHospedeAlternativo(hospedeId);
  }
};

// Buscar consumos de um hóspede (versão alternativa que funciona)
export const buscarConsumosHospedeAlternativo = async (hospedeId) => {
  try {
    console.log('🔍 === BUSCA ALTERNATIVA DE CONSUMOS ===');
    console.log('🆔 hospedeId procurado:', hospedeId);
    
    // Buscar TODOS os consumos primeiro
    const q = query(collection(db, 'consumos'));
    const querySnapshot = await getDocs(q);
    
    console.log('📊 Total de consumos na coleção:', querySnapshot.docs.length);
    
    const todosConsumos = [];
    const consumosDoHospede = [];
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      const consumo = {
        id: doc.id,
        ...data
      };
      
      todosConsumos.push(consumo);
      
      console.log(`📄 Consumo ID: ${doc.id}`);
      console.log(`🆔 hospedeId no doc: "${data.hospedeId}"`);
      console.log(`🔄 Comparação: "${data.hospedeId}" === "${hospedeId}" ? ${data.hospedeId === hospedeId}`);
      
      // Filtrar para o hóspede específico
      if (data.hospedeId === hospedeId) {
        consumosDoHospede.push(consumo);
        console.log('✅ Consumo encontrado para o hóspede!');
      }
    });
    
    console.log('📊 Total de consumos encontrados para o hóspede:', consumosDoHospede.length);
    console.log('✅ Consumos retornados:', consumosDoHospede);
    
    return consumosDoHospede;
  } catch (error) {
    console.error('❌ ERRO na busca alternativa:', error);
    return [];
  }
};

// Listener para consumos de um hóspede
export const escutarConsumosHospede = (hospedeId, callback) => {
  const q = query(
    collection(db, 'consumos'), 
    where('hospedeId', '==', hospedeId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (querySnapshot) => {
    const consumos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(consumos);
  });
};

// Atualizar consumo
export const atualizarConsumo = async (consumoId, dadosAtualizados) => {
  try {
    const consumoRef = doc(db, 'consumos', consumoId);
    await updateDoc(consumoRef, {
      ...dadosAtualizados,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao atualizar consumo:', error);
    throw error;
  }
};

// Remover consumo
export const removerConsumo = async (consumoId) => {
  try {
    await deleteDoc(doc(db, 'consumos', consumoId));
  } catch (error) {
    console.error('Erro ao remover consumo:', error);
    throw error;
  }
};

// ==================== PRODUTOS ====================

// Buscar produtos disponíveis
export const buscarProdutos = async () => {
  try {
    const q = query(collection(db, 'produtos'), orderBy('nome'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
};

// Adicionar novo produto
export const adicionarProduto = async (produtoData) => {
  try {
    const docRef = await addDoc(collection(db, 'produtos'), {
      ...produtoData,
      ativo: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ Produto adicionado:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erro ao adicionar produto:', error);
    throw error;
  }
};

// Atualizar produto existente
export const atualizarProduto = async (produtoId, dadosAtualizados) => {
  try {
    const produtoRef = doc(db, 'produtos', produtoId);
    await updateDoc(produtoRef, {
      ...dadosAtualizados,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Produto atualizado:', produtoId);
  } catch (error) {
    console.error('❌ Erro ao atualizar produto:', error);
    throw error;
  }
};

// Remover produto
export const removerProduto = async (produtoId) => {
  try {
    await deleteDoc(doc(db, 'produtos', produtoId));
    console.log('✅ Produto removido:', produtoId);
  } catch (error) {
    console.error('❌ Erro ao remover produto:', error);
    throw error;
  }
};

// Inicializar produtos padrão (executar uma vez)
export const inicializarProdutos = async () => {
  const produtosPadrao = [
    { nome: "🥤 Refrigerante Lata", preco: 5.00, ativo: true },
    { nome: "💧 Água 500ml", preco: 3.00, ativo: true },
    { nome: "🍺 Cerveja Long Neck", preco: 8.00, ativo: true },
    { nome: "🍺 Cerveja Lata", preco: 6.00, ativo: true },
    { nome: "🥤 Suco Natural", preco: 7.00, ativo: true },
    { nome: "☕ Café", preco: 4.00, ativo: true },
    { nome: "🧊 Gelo", preco: 2.00, ativo: true },
    { nome: "🍫 Chocolate", preco: 8.00, ativo: true },
    { nome: "🥜 Amendoim", preco: 5.00, ativo: true },
    { nome: "🍪 Biscoito", preco: 4.00, ativo: true }
  ];

  try {
    for (const produto of produtosPadrao) {
      await addDoc(collection(db, 'produtos'), {
        ...produto,
        createdAt: serverTimestamp()
      });
    }
    console.log('Produtos inicializados com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar produtos:', error);
  }
};

// ==================== MIGRAÇÃO DE DADOS ====================

// ==================== CORREÇÃO DE DADOS ====================

// Função para corrigir dados existentes sem statusHospedagem
export const corrigirStatusHospedagem = async () => {
  try {
    console.log('🔧 Verificando e corrigindo statusHospedagem...');
    
    const q = query(collection(db, 'hospedes'));
    const querySnapshot = await getDocs(q);
    
    let corrigidos = 0;
    
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      
      // Se não tem statusHospedagem, adicionar como ATIVO
      if (!data.statusHospedagem) {
        await updateDoc(doc(db, 'hospedes', docSnap.id), {
          statusHospedagem: 'ATIVO',
          updatedAt: serverTimestamp()
        });
        corrigidos++;
      }
    }
    
    if (corrigidos > 0) {
      console.log(`✅ ${corrigidos} registros corrigidos com statusHospedagem: ATIVO`);
    } else {
      console.log('✅ Todos os registros já possuem statusHospedagem');
    }
    
    return corrigidos;
  } catch (error) {
    console.error('❌ Erro ao corrigir statusHospedagem:', error);
    throw error;
  }
};

// Função para corrigir hóspede específico para FINALIZADO
export const marcarComoFinalizado = async (hospedeId, nomeHospede) => {
  try {
    console.log(`🔧 Marcando ${nomeHospede} como FINALIZADO...`);
    
    const hospedeRef = doc(db, 'hospedes', hospedeId);
    await updateDoc(hospedeRef, {
      statusHospedagem: 'FINALIZADO',
      dataFinalizacao: new Date().toLocaleString('pt-BR'),
      updatedAt: serverTimestamp()
    });
    
    console.log(`✅ ${nomeHospede} marcado como FINALIZADO`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao marcar ${nomeHospede} como finalizado:`, error);
    throw error;
  }
};

// Função para listar todos os hóspedes e seus status (para debug)
export const listarStatusHospedes = async () => {
  try {
    const q = query(collection(db, 'hospedes'));
    const querySnapshot = await getDocs(q);
    
    const lista = [];
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      lista.push({
        id: doc.id,
        nome: data.nome,
        statusHospedagem: data.statusHospedagem || 'SEM_STATUS',
        checkOut: data.checkOut || 'N/A',
        dataFinalizacao: data.dataFinalizacao || 'N/A'
      });
    });
    
    console.log('📋 Lista completa de hóspedes e status:', lista);
    return lista;
  } catch (error) {
    console.error('❌ Erro ao listar status:', error);
    return [];
  }
};

// Função para identificar e remover duplicatas
export const removerDuplicatas = async () => {
  try {
    console.log('🔧 Buscando duplicatas...');
    
    const q = query(collection(db, 'hospedes'));
    const querySnapshot = await getDocs(q);
    
    // Agrupar por nome
    const nomes = {};
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      const nome = data.nome.trim();
      
      if (!nomes[nome]) {
        nomes[nome] = [];
      }
      
      nomes[nome].push({
        id: doc.id,
        ...data
      });
    });
    
    // Identificar duplicatas
    let duplicatasEncontradas = 0;
    let removidos = 0;
    
    for (const [nome, registros] of Object.entries(nomes)) {
      if (registros.length > 1) {
        duplicatasEncontradas++;
        console.log(`🔄 Duplicata encontrada: ${nome} (${registros.length} registros)`);
        
        // Manter apenas o mais recente (com base no createdAt ou updatedAt)
        registros.sort((a, b) => {
          const dataA = a.updatedAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
          const dataB = b.updatedAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
          return dataB - dataA;
        });
        
        const manter = registros[0];
        const remover = registros.slice(1);
        
        console.log(`✅ Mantendo: ${manter.id} (mais recente)`);
        
        // Remover os duplicados
        for (const reg of remover) {
          console.log(`🗑️ Removendo: ${reg.id}`);
          await deleteDoc(doc(db, 'hospedes', reg.id));
          removidos++;
        }
      }
    }
    
    console.log(`✅ Limpeza concluída: ${duplicatasEncontradas} duplicatas, ${removidos} registros removidos`);
    return { duplicatasEncontradas, removidos };
  } catch (error) {
    console.error('❌ Erro ao remover duplicatas:', error);
    throw error;
  }
};

// Função de debug para listar todos os consumos
export const debugConsumosFirestore = async () => {
  try {
    const q = query(collection(db, 'consumos'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const todos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('🔍 DEBUG - Todos os consumos no Firestore:', todos);
    console.log('🔍 DEBUG - Total de consumos encontrados:', todos.length);
    
    // Agrupar por hóspede
    const porHospede = {};
    todos.forEach(consumo => {
      if (!porHospede[consumo.hospedeId]) {
        porHospede[consumo.hospedeId] = [];
      }
      porHospede[consumo.hospedeId].push(consumo);
    });
    
    console.log('🔍 DEBUG - Consumos agrupados por hóspede:', porHospede);
    return { todos, porHospede };
  } catch (error) {
    console.error('❌ Erro no debug de consumos:', error);
    return { todos: [], porHospede: {} };
  }
};

// ==================== HISTÓRICO DE CHECKOUT ====================

// Salvar histórico completo de checkout
export const salvarHistoricoCheckout = async (hospede, dadosCheckout, consumos) => {
  try {
    const historicoData = {
      // Dados do hóspede
      hospedeId: hospede.id,
      nomeHospede: hospede.nome,
      telefone: hospede.telefone || '',
      rg: hospede.rg || '',
      cpf: hospede.cpf || '',
      cnh: hospede.cnh || '',
      quarto: hospede.quartos,
      
      // Dados da hospedagem
      dataReserva: hospede.data,
      checkIn: hospede.checkIn,
      checkOut: dadosCheckout.checkOut,
      tempoEstadia: dadosCheckout.tempoEstadia || '',
      valorDiaria: hospede.valorDiaria,
      totalDiarias: dadosCheckout.totalDiarias,
      
      // Dados financeiros
      statusPagamento: hospede.pago,
      totalConsumos: dadosCheckout.totalConsumos,
      totalFinal: dadosCheckout.totalFinal,
      
      // Consumos detalhados
      consumos: consumos || [],
      
      // Metadados
      dataFinalizacao: dadosCheckout.dataFinalizacao,
      anoMes: new Date().getFullYear() + '-' + (new Date().getMonth() + 1).toString().padStart(2, '0'),
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'historico_checkout'), historicoData);
    console.log('✅ Histórico de checkout salvo:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erro ao salvar histórico:', error);
    throw error;
  }
};

// Buscar histórico de checkout
export const buscarHistoricoCheckout = async (filtros = {}) => {
  try {
    let q = query(collection(db, 'historico_checkout'), orderBy('createdAt', 'desc'));
    
    // Aplicar filtros se fornecidos
    if (filtros.anoMes) {
      q = query(q, where('anoMes', '==', filtros.anoMes));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    return [];
  }
};

// Buscar histórico por período
export const buscarHistoricoPorPeriodo = async (dataInicio, dataFim) => {
  try {
    const q = query(
      collection(db, 'historico_checkout'),
      where('checkOut', '>=', dataInicio),
      where('checkOut', '<=', dataFim),
      orderBy('checkOut', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Erro ao buscar histórico por período:', error);
    return [];
  }
};

// Verificar e inicializar coleção de consumos
export const verificarColecaoConsumos = async () => {
  try {
    console.log('🔍 Verificando coleção de consumos...');
    
    const q = query(collection(db, 'consumos'));
    const querySnapshot = await getDocs(q);
    
    console.log(`📊 Coleção consumos: ${querySnapshot.docs.length} documentos encontrados`);
    
    if (querySnapshot.docs.length === 0) {
      console.log('⚠️ Coleção de consumos está vazia ou não existe');
      console.log('📝 Isso explica por que os consumos não aparecem nos modais');
      
      // Criar um documento dummy para inicializar a coleção
      const docRef = await addDoc(collection(db, 'consumos'), {
        _tipo: 'documento_inicializacao',
        _descricao: 'Documento criado para inicializar a coleção',
        _criadoEm: serverTimestamp()
      });
      
      console.log('✅ Coleção de consumos inicializada com documento:', docRef.id);
      
      // Remover o documento dummy
      await deleteDoc(doc(db, 'consumos', docRef.id));
      console.log('🧹 Documento de inicialização removido');
    }
    
    return querySnapshot.docs.length;
  } catch (error) {
    console.error('❌ Erro ao verificar coleção de consumos:', error);
    
    // Se o erro for de permissão, tentar criar a coleção mesmo assim
    if (error.code === 'permission-denied') {
      console.log('⚠️ Erro de permissão - tentando criar coleção...');
      try {
        const docRef = await addDoc(collection(db, 'consumos'), {
          _init: true,
          createdAt: serverTimestamp()
        });
        await deleteDoc(doc(db, 'consumos', docRef.id));
        console.log('✅ Coleção criada com sucesso');
        return 0;
      } catch (createError) {
        console.error('❌ Erro ao criar coleção:', createError);
        throw createError;
      }
    }
    
    throw error;
  }
};

// Migrar consumos existentes do localStorage ou array local para Firestore
export const migrarConsumosLocaisParaFirestore = async () => {
  try {
    console.log('🔄 Verificando consumos locais para migrar...');
    
    // Verificar se existem consumos armazenados localmente
    const consumosLocais = localStorage.getItem('consumos_hotel');
    if (consumosLocais) {
      const consumos = JSON.parse(consumosLocais);
      console.log('📦 Encontrados consumos locais:', consumos.length);
      
      for (const consumo of consumos) {
        await addDoc(collection(db, 'consumos'), {
          ...consumo,
          migradoEm: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      }
      
      // Limpar localStorage após migração
      localStorage.removeItem('consumos_hotel');
      console.log('✅ Consumos migrados e localStorage limpo');
      return consumos.length;
    }
    
    console.log('ℹ️ Nenhum consumo local encontrado');
    return 0;
  } catch (error) {
    console.error('❌ Erro na migração de consumos:', error);
    return 0;
  }
}; 