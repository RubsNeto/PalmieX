/***********************************************************
 *  realiza_pedidos.js
 ***********************************************************/

document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'Enter') {
        const botao = document.getElementById('realizarPedido');
        if (botao) botao.click();
    }
});

// **************************
// 1. Função de autocomplete
// **************************
function configureAutocomplete(input, datalistId) {
    // Para cada vez que digitarmos no input
    input.addEventListener('input', function () {
        const texto = this.value.trim();

        // Se não houver texto, limpa as opções do datalist e sai
        if (texto.length < 1) {
            const dl = document.getElementById(datalistId);
            if (dl) dl.innerHTML = '';
            return;
        }

        // Faz requisição para nossa rota Django (AJUSTE AQUI seu endpoint)
        fetch(`/autocomplete-produto/?q=${encodeURIComponent(texto)}`)
            .then(response => response.json())
            .then(listaDeProdutos => {
                const dl = document.getElementById(datalistId);
                if (!dl) return;

                // Limpa as opções anteriores
                dl.innerHTML = '';

                // Para cada produto, criamos um <option> com value = nome
                listaDeProdutos.forEach(nome => {
                    const option = document.createElement('option');
                    option.value = nome;
                    dl.appendChild(option);
                });
            })
            .catch(err => {
                console.error('Erro ao buscar autocomplete:', err);
            });
    });
}

// ***************************************************************
// 2. Função para ativar autocomplete em todos os pedidos da tela
// ***************************************************************
function ativarAutocompleteEmTodosOsPedidos() {
    // Seleciona todos os inputs do Balancinho
    document.querySelectorAll('.matBalancinho').forEach(input => {
        configureAutocomplete(input, 'listaBalancinho');
    });

    // Seleciona todos os inputs de Palmilha
    document.querySelectorAll('.matPalmilha').forEach(input => {
        configureAutocomplete(input, 'listaPalmilha');
    });
}

// Busca o código do produto pelo NOME e preenche a "refBalancinho"
function handleBalancinhoChange(event) {
    const nomeProduto = event.target.value.trim();
    if (!nomeProduto) return;

    fetch(`/buscar-produto-por-nome/?nome=${encodeURIComponent(nomeProduto)}`)
        .then(resp => resp.json())
        .then(data => {
            // Se houver 'erro' retornado pela view
            if (data.erro) {
                console.warn('Produto não encontrado ou outro problema:', data.erro);
                return;
            }
            // Localiza o .pedido-item mais próximo
            const pedidoItem = event.target.closest('.pedido-item');
            if (!pedidoItem) return;
        })
        .catch(err => {
            console.error('Erro ao buscar código do produto:', err);
        });
}


// Busca o código do produto pelo NOME e preenche a "refPalmilha"
function handlePalmilhaChange(event) {
    const nomeProduto = event.target.value.trim();
    if (!nomeProduto) return;

   
}


// =====================
// Função principal
// =====================
function ativarReferenciaAutomatica() {
    // Para cada pedido-item, vamos associar os eventos
    document.querySelectorAll('.pedido-item').forEach(pedido => {
        // Input de material Balancinho
        const matBalInput = pedido.querySelector('.matBalancinho');
        if (matBalInput) {
            // Quando o usuário "confirma" a escolha (change), chamamos handleBalancinhoChange
            matBalInput.removeEventListener('change', handleBalancinhoChange); // remove se já tinha
            matBalInput.addEventListener('change', handleBalancinhoChange);
        }

        // Input de material Palmilha
        const matPalmInput = pedido.querySelector('.matPalmilha');
        if (matPalmInput) {
            matPalmInput.removeEventListener('change', handlePalmilhaChange);
            matPalmInput.addEventListener('change', handlePalmilhaChange);
        }
    });
}

/**
 * Ajusta dinamicamente o tamanho da fonte do elemento
 * para que seu conteúdo não ultrapasse a largura disponível.
 *
 * @param {HTMLElement} element - O elemento que contém o número (ex.: .numero)
 * @param {string} defaultFontSize - Tamanho de fonte padrão (ex.: "1rem")
 */
    function adjustFontSize(element, defaultFontSize = "1rem") {
        // Resetar o tamanho da fonte para o valor padrão
        element.style.fontSize = defaultFontSize;
        
        // Obtém a largura disponível do elemento
        const containerWidth = element.clientWidth;
        // Pega o tamanho atual da fonte em pixels
        let currentFontSize = parseInt(window.getComputedStyle(element).fontSize, 10);
    
        // Enquanto o conteúdo (scrollWidth) for maior que a largura do elemento
        // e o tamanho da fonte for maior que um valor mínimo (por exemplo, 10px)
        while (element.scrollWidth > containerWidth && currentFontSize > 10) {
        currentFontSize--;
        element.style.fontSize = currentFontSize + "px";
        }
    }
  

// **************************
// 1. Função de autocomplete para REFERÊNCIA
// **************************
function configureReferenceAutocomplete(input, datalistId, materialClass) {
    input.addEventListener('input', function () {
        const texto = this.value.trim();

        if (texto.length < 1) {
            document.getElementById(datalistId).innerHTML = '';
            return;
        }

        
    });

    
}

function ativarAutocompleteEmTodasAsReferencias() {

    document.querySelectorAll('.refPalmilha').forEach(input => {
        configureReferenceAutocomplete(input, 'listaRefPalmilha', '.matPalmilha');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    ativarAutocompleteEmTodasAsReferencias();
});

let proximoTabindex = 1;

/**
 * Reorganiza os tabindex de todos os campos e botões da tela
 */
function reorganizarTabindex() {
    let proximoTabindex = 1;
    // Cliente, código, vendedor
    const cliente = document.querySelector('.cliente');
    if (cliente) cliente.setAttribute('tabindex', proximoTabindex++);
    const codVendedor = document.querySelector('.codVendedor');
    if (codVendedor) codVendedor.setAttribute('tabindex', proximoTabindex++);
    const vendedor = document.querySelector('.vendedor');
    if (vendedor) vendedor.setAttribute('tabindex', proximoTabindex++);

    // Todos os pedidos
    const pedidos = document.querySelectorAll('.pedido-item');
    pedidos.forEach(pedido => {
        // Referência e Material

        const matBalancinho = pedido.querySelector('.matBalancinho');
        if (matBalancinho) matBalancinho.setAttribute('tabindex', proximoTabindex++);

        const sintetico = pedido.querySelector('.sintetico');
        if (sintetico) sintetico.setAttribute('tabindex', proximoTabindex++);

        const cor = pedido.querySelector('.cor');
        if (cor) cor.setAttribute('tabindex', proximoTabindex++);

        const espessura = pedido.querySelector('.tamPalmilha');
        if (espessura) espessura.setAttribute('tabindex', proximoTabindex++);

        const refPalmilha = pedido.querySelector('.refPalmilha');
        if (refPalmilha) refPalmilha.setAttribute('tabindex', proximoTabindex++);

        const matPalmilha = pedido.querySelector('.matPalmilha');
        if (matPalmilha) matPalmilha.setAttribute('tabindex', proximoTabindex++);

        const corPalmilha = pedido.querySelector('.corPalmilha');
        if (corPalmilha) corPalmilha.setAttribute('tabindex', proximoTabindex++);
        
        const selectTipoServico = pedido.querySelector('.selectTipoServico');
        if (selectTipoServico) selectTipoServico.setAttribute('tabindex', proximoTabindex++);
        
        const marca = pedido.querySelector('.marca');
        if (marca) marca.setAttribute('tabindex', proximoTabindex++);
        

        const obs = pedido.querySelector('.obs');
        if (obs) obs.setAttribute('tabindex', proximoTabindex++);

        // Botões (+, -)
        const botoesFocaveis = pedido.querySelectorAll('.adicionarPedido, .removerPedido');
        botoesFocaveis.forEach(botao => {
            botao.setAttribute('tabindex', proximoTabindex++);
        });

        // Botões de tamanho não devem ser focados
        const botoesNaoFocaveis = pedido.querySelectorAll('.botao');
        botoesNaoFocaveis.forEach(botao => {
            botao.setAttribute('tabindex', -1);
        });

        // Inputs de quantidade (.numero)
        const numeros = Array.from(pedido.querySelectorAll('.numero')).sort((a, b) => {
            const numA = parseInt(a.previousElementSibling.textContent.trim(), 10);
            const numB = parseInt(b.previousElementSibling.textContent.trim(), 10);
            return numA - numB;
        });
        numeros.forEach(numero => {
            numero.setAttribute('tabindex', proximoTabindex++);
        });
    });
}

function reconstruirBotoes(pedidoItem) {
    const containerQuadradinhos = pedidoItem.querySelector('.containerQuadradinhos');
    if (!containerQuadradinhos) return;
    
    // Limpa tudo
    containerQuadradinhos.innerHTML = '';

    const inicio = 13;
    const fim   = 43;

    for (let num = inicio; num <= fim; num++) {
        criarInserirBotao(containerQuadradinhos, num, false);
    }

    redimensionarBotoes(containerQuadradinhos, '45.35px', '45.35px');

    reorganizarTabindex();
    atualizarTotalGlobal();
}

/**
 * Atualiza o total de pares de UM pedido
 */
function atualizarParesPedido(pedidoItem) {
    const numeros = pedidoItem.querySelectorAll('.numero'); 
    let soma = 0;
    numeros.forEach(num => {
        const valor = parseInt(num.textContent.trim(), 10) || 0;
        soma += valor;
    });
    const paresValorElem = pedidoItem.querySelector('.paresValor');
    if (paresValorElem) {
        paresValorElem.textContent = soma;
    }
    return soma;
}

/**
 * Atualiza o total global de pares (somando todos os pedidos).
 */
function atualizarTotalGlobal() {
    const pedidoItens = document.querySelectorAll('.pedido-item');
    let somaGlobal = 0;
    pedidoItens.forEach(pedido => {
        somaGlobal += atualizarParesPedido(pedido);
    });

    const valorTotalElem = document.querySelector('.valorTotal b');
    if (valorTotalElem) {
        valorTotalElem.textContent = somaGlobal;
    }
}

/**
 * Se o valor > 0, mostra no quadradinho. Se valor = 0, limpa.
 */
function atualizarEstiloValor(botaoContainer, valor) {
    const numeroDiv = botaoContainer.querySelector('.numero');
    if (valor > 0) {
        numeroDiv.textContent = valor;
        botaoContainer.classList.add('valor-positivo');
    } else {
        numeroDiv.textContent = '';
        botaoContainer.classList.remove('valor-positivo');
    }
}

/**
 * Remove do container todos os botões cujo número esteja na faixa [inicio, fim]
 */
function removerBotoesFaixa(container, inicio, fim) {
    const todosContainers = container.querySelectorAll('.botao-container');
    todosContainers.forEach(bc => {
        const botao = bc.querySelector('.botao');
        if (!botao) return;
        const numero = parseInt(botao.textContent.trim(), 10);
        if (numero >= inicio && numero <= fim) {
            bc.remove();
        }
    });
}

/**
 * Cria um botão "botao" com tabindex=-1
 */
function criarBotao(numero) {
    const btn = document.createElement('button');
    btn.classList.add('botao');
    btn.textContent = numero;
    btn.setAttribute('tabindex', -1);
    return btn;
}

/**
 * Cria a div.numero com contenteditable
 */
function criarNumeroDiv(numero) {
    const numeroDiv = document.createElement('div');
    numeroDiv.classList.add('numero');
    numeroDiv.setAttribute('contenteditable', 'true');
    numeroDiv.setAttribute('aria-label', `Número ${numero}`);
    numeroDiv.setAttribute('tabindex', proximoTabindex++);
    return numeroDiv;
}

/**
 * Cria (botão + div.numero) e insere no container
 */
function criarInserirBotao(container, numero, inserirNoInicio = false) {
    const botaoContainer = document.createElement('div');
    botaoContainer.classList.add('botao-container');

    const botao = criarBotao(numero);
    const numeroDiv = criarNumeroDiv(numero);

    // Clique => incrementa
    botao.addEventListener('click', () => {
        let val = parseInt(numeroDiv.textContent.trim(), 10) || 0;
        val += 1;
        atualizarEstiloValor(botaoContainer, val);
        atualizarTotalGlobal();
    });

    // Input manual
    numeroDiv.addEventListener('input', () => {
        let val = parseInt(numeroDiv.textContent.trim(), 10);
        if (isNaN(val)) val = 0;
        atualizarEstiloValor(botaoContainer, val);
        atualizarTotalGlobal()
    });

    botaoContainer.appendChild(botao);
    botaoContainer.appendChild(numeroDiv);

    if (inserirNoInicio) {
        container.insertBefore(botaoContainer, container.firstChild);
    } else {
        container.appendChild(botaoContainer);
    }
}

/**
 * Redimensiona TODOS os botões de um container para (largura x altura).
 */
function redimensionarBotoes(container, largura, altura) {
    const botoes = container.querySelectorAll('.botao');
    botoes.forEach(botao => {
        botao.style.width = largura;
        botao.style.height = altura;
    });
}

/**
 * Cria (30..43) no container, se não existirem,
 * e redimensiona para, por exemplo, 50x50 (adulto grande).
 */
function criarBotoesAdulto(container) {
    for (let num = 15; num <= 43; num++) {
        const jaExiste = Array.from(container.querySelectorAll('.botao'))
            .some(bt => parseInt(bt.textContent, 10) === num);
        if (!jaExiste) {
            criarInserirBotao(container, num, false);
        }
    }
    redimensionarBotoes(container, '45.35px', '45.35px');
    reorganizarTabindex();
}

/**
 * Função para criar botões de 15 a 43
 */
function criarBotoesTodos(container) {
    for (let num = 15; num <= 43; num++) {
        const jaExiste = Array.from(container.querySelectorAll('.botao'))
            .some(bt => parseInt(bt.textContent, 10) === num);
        if (!jaExiste) {
            criarInserirBotao(container, num, false);
        }
    }
    // Define o tamanho padrão para os botões
    redimensionarBotoes(container, '45.35px', '45.35px');
    reorganizarTabindex();
}

/**
 * Adiciona todos os eventos de um pedido
 */
function adicionarEventosPedido(pedidoItem) {
    // Removido trecho duplicado de listeners 'input' para evitar chamadas duplas
    const removerBtn = pedidoItem.querySelector('.removerPedido');
    if (removerBtn) {
        removerBtn.addEventListener('click', () => {
            if (confirm("Deseja remover este pedido?")) {
                pedidoItem.remove();
                atualizarTotalGlobal();
            }
        });
    }

    const adicionarBtn = pedidoItem.querySelector('.adicionarPedido');
    if (adicionarBtn) {
        adicionarBtn.addEventListener('click', () => {
            const lista = document.querySelector('.lista-pedidos');
            const novoPedido = document.createElement('div');
            novoPedido.classList.add('pedido-item');

            novoPedido.innerHTML = `
                <hr>
                <br>
                <br>
                <div class="pedido-conteudo">
                    <div class="linha-pedido grid-3">
                <div>
                <span class="campo">Sintético</span>
                <input type="text" class="matBalancinho" required list="listaBalancinho">
                <datalist id="listaBalancinho"></datalist>
                </div>
                <div>
                <span class="campo">Cor Sintético</span>
                <input type="text" class="cor">
                </div>
                
                <div>
                <span class="campo">Espessura Palmilha</span>
                <input type="text" class="tamPalmilha" required 
                        placeholder="mm" inputmode="numeric" pattern="[0-9]*" 
                        title="Digite apenas números para o tamanho em milímetros">
                </div>
                <div>
                <span class="campo">Referência Solado</span>
                <input type="text" class="refPalmilha" required list="listaRefPalmilha">
                <datalist id="listaRefPalmilha"></datalist>
                </div>
                <div>
                <span class="campo">Material Solado</span>
                <input type="text" class="matPalmilha" required list="listaPalmilha">
                <datalist id="listaPalmilha"></datalist>
                </div>

                <div class="divCor">
                <span class="campo">Cor Solado</span>
                <input type="text" class="corPalmilha">
                </div>

                
                <div class="campo-tipo">
                    <span class="campo">Tipo de Serviço</span>
                    <input type="text" name="tipoServico" class="selectTipoServico" placeholder="Ex. Costurado">
                </div>
                <div class="campo-tipo">
                <span class="campo">Marca</span>
                <select class="marca" name="marca">
                    <option value="Fibra">Fibra</option>
                    <option value="Seltex">Seltex</option>
                    <option value="Induma">Induma</option>
                </select>
                </div>
                
                
            </div>
            
            <div class="campoObs">
            <span class="campo">Obs:</span>
            <textarea class="obs"></textarea>
            </div>
            
            <div class="linha-pedido">
            <h5 class="pares">Pares: <b class="paresValor">0</b></h5> 
            <div class="maisEmenos">
                <button type="button" class="adicionarPedido">+</button>
                <button type="button" class="removerPedido">-</button>
            </div>
            </div>
                <div class="container containerQuadradinhos"></div>
            </div>`;


            lista.appendChild(novoPedido);

            const containerQuadradinhos = novoPedido.querySelector('.containerQuadradinhos');
            criarBotoesAdulto(containerQuadradinhos);

            adicionarEventosPedido(novoPedido);

            reorganizarTabindex();
            atualizarTotalGlobal();
        });
    }


}


function coletarDadosPedidos(tipoPedido = 'ambos') {
    const dados = {
        cliente: document.querySelector('.cliente')?.value.trim() || '',
        codigoVendedor: document.querySelector('.codVendedor')?.value.trim() || '',
        vendedor: document.querySelector('.vendedor')?.value.trim() || '',
        status_balancinho: document.querySelector('.status-balancinho')?.value || 'Pendente',
        status_solado: document.querySelector('.status-solado')?.value || 'Pendente',
        itens: [],
        tipo_pedido: tipoPedido // Indica o tipo de pedido
    };

    const pedidoItens = document.querySelectorAll('.pedido-item');
    pedidoItens.forEach(pedido => {
        // Coleta os valores dos campos para o Balancinho e Solado
        let matBalancinho = pedido.querySelector('.matBalancinho')?.value.trim() || '';
        let corBalancinho = pedido.querySelector('.cor')?.value.trim() || '';

        let refPalmilha = pedido.querySelector('.refPalmilha')?.value.trim() || '';
        let matPalmilha = pedido.querySelector('.matPalmilha')?.value.trim() || '';
        let corPalmilha = pedido.querySelector('.corPalmilha')?.value.trim() || '';
        let tipoServico = pedido.querySelector('.selectTipoServico')?.value.trim() || '';

        
        let espessura = pedido.querySelector('.tamPalmilha')?.value.trim() || '';
        let obs = pedido.querySelector('.obs')?.value.trim() || '';

        // **Adiciona a coleta da marca**
        let marca = pedido.querySelector('.marca')?.value.trim() || '';
            console.log('Marca coletada:', marca);


        // Ajusta os campos conforme o tipo de pedido
        if (tipoPedido === 'balancinho') {
            // Pedido apenas para balancinho: limpa os dados do solado/palmilha
            refPalmilha = '';
            matPalmilha = '';
            corPalmilha = '';
        } else if (tipoPedido === 'solado') {
            // Pedido apenas para solado: limpa os dados do balancinho
            matBalancinho = '';
            corBalancinho = '';
        }

        // Coleta os tamanhos e as quantidades dos botões
        const tamanhos = {};
        pedido.querySelectorAll('.botao-container').forEach(bc => {
            const btn = bc.querySelector('.botao');
            const numeroDiv = bc.querySelector('.numero');
            if (btn && numeroDiv) {
                const tamanho = parseInt(btn.textContent.trim(), 10);
                const quantidade = parseInt(numeroDiv.textContent.trim(), 10) || 0;
                if (quantidade > 0) {
                    tamanhos[tamanho] = quantidade;
                }
            }
        });

        // Inclui a propriedade "marca" no item
        dados.itens.push({
            matBalancinho,
            tipoServico,
            cor: corBalancinho,
            refPalmilha,
            matPalmilha,
            corPalmilha,
            espessura,
            obs,
            marca, // Novo campo
            tamanhos
        });
    });
    return dados;
}





function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
}

/**
 * Função unificada para enviar pedidos
 */
function enviarPedido(url, dados) {
    const csrftoken = getCookie('csrftoken');
    
    // Validações básicas
    if (!dados.cliente.trim()) {
        alert('Por favor, preencha o campo "Cliente".');
        return;
    }
    if (!dados.codigoVendedor.trim() || !dados.vendedor.trim()) {
        alert('Por favor, preencha os campos "Código do Vendedor" e "Vendedor".');
        return;
    }
    if (dados.itens.length === 0) {
        alert('Por favor, adicione pelo menos um item ao pedido.');
        return;
    }
    
    // Validação de cada item: verifica se há quantidade informada
    for (let i = 0; i < dados.itens.length; i++) {
        const item = dados.itens[i];
        // Se o objeto "tamanhos" estiver vazio, nenhum quadradinho foi preenchido
        if (Object.keys(item.tamanhos).length === 0) {
            alert('Informe o tamanho.');
            return;
        }
    }
    
    // Validação de referências e materiais
    for (let i = 0; i < dados.itens.length; i++) {
        const item = dados.itens[i];
        const matBalancinho = (item.matBalancinho || '').trim();
        const refPalmilha   = (item.refPalmilha   || '').trim();
        const matPalmilha   = (item.matPalmilha   || '').trim();
    
        if (refPalmilha && !matPalmilha) {
            alert('Preencha o material para a Palmilha.');
            return;
        }
    }
    
    fetch(url, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken    
        },
        body: JSON.stringify(dados)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => { throw data; });
        }
        return response.json();
    })
    .then(data => {
        alert('Pedido realizado com sucesso!');
        window.location.href = '/producao/';
    })
    .catch(err => {
        console.error(err);
        alert(err.erro || 'Ocorreu um erro ao realizar o pedido.');
    });   
}

/**
 * Ao carregar a página
 */
document.addEventListener('DOMContentLoaded', () => {

    const ordem = document.querySelector('.ordem');
    ordem.style.animationDelay = '0.1s'; // Adiciona um pequeno atraso na animação
  
    const buttons = document.querySelectorAll('.botoesComando button');
    buttons.forEach((button, index) => {
      button.style.animationDelay = `${0.5 + index * 0.1}s`; // Delay progressivo nos botões
    });

    ativarReferenciaAutomatica();
    ativarAutocompleteEmTodosOsPedidos();

    ativarAutocompleteEmTodosOsPedidos();
    ativarAutocompleteEmTodasAsReferencias();

    document.querySelectorAll('.pedido-item').forEach(pedido => {
        const containerQuadradinhos = pedido.querySelector('.containerQuadradinhos');
        if (containerQuadradinhos) {
            criarBotoesTodos(containerQuadradinhos);
        }
        adicionarEventosPedido(pedido);
    });

    const codVendedorInput = document.querySelector('.codVendedor');
    const vendedorInput = document.querySelector('.vendedor');

    if (codVendedorInput && vendedorInput) {
        codVendedorInput.addEventListener('input', function() {
            const codigo = this.value;
            fetch(`/buscar-vendedor/?codigo=${encodeURIComponent(codigo)}`)
                .then(response => response.json())
                .then(data => {
                    if (data.nome) {
                        vendedorInput.value = data.nome;
                    }
                })
                .catch(err => {
                    console.error("Erro ao buscar vendedor:", err);
                });
        });
    }

    // Botão "Realizar pedido"
    const realizarPedidoBtn = document.querySelector('.realizarPedido');
    if (realizarPedidoBtn) {
        realizarPedidoBtn.addEventListener('click', () => {
            const dados = coletarDadosPedidos();
            enviarPedido('/realizar-pedido/', dados);
        });
    }

    // Botão "Realizar pedido urgente"
    const realizarPedidoUrgenteBtn = document.querySelector('#realizarPedidoUrgente');
    if (realizarPedidoUrgenteBtn) {
        realizarPedidoUrgenteBtn.addEventListener('click', () => {
            const dados = coletarDadosPedidos();
            dados.status_solado = "Cliente em Espera";
            dados.status_balancinho = "Cliente em Espera";
            enviarPedido('/realizar-pedido-urgente/', dados);
        });
    }

    // Botão "Realizar pedido Balancinho"
    const realizarPedidoBalancinhoBtn = document.querySelector('.realizarPedidoBalancinho');
    if (realizarPedidoBalancinhoBtn) {
        realizarPedidoBalancinhoBtn.addEventListener('click', () => {
            // Aqui o parâmetro 'balancinho' fará com que a função limpe os dados do solado
            const dados = coletarDadosPedidos();
            dados.status_solado = "Pedido Finalizado";
            enviarPedido('/realizar-pedido/', dados);
        });
    }

    // Botão "Realizar pedido Solado"
    const realizarPedidoSoladoBtn = document.querySelector('.realizarPedidoSolado');
    if (realizarPedidoSoladoBtn) {
        realizarPedidoSoladoBtn.addEventListener('click', () => {
            // Aqui o parâmetro 'solado' fará com que a função limpe os dados do balancinho
            const dados = coletarDadosPedidos();
            dados.status_balancinho = "Pedido Finalizado";
            enviarPedido('/realizar-pedido/', dados);
        });
    }

    reorganizarTabindex(); 
    atualizarTotalGlobal();
});
