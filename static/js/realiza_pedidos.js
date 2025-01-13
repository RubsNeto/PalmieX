/***********************************************************
 *  realiza_pedidos.js
 ***********************************************************/

document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'Enter') {
        const botao = document.getElementById('realizarPedido');
        if (botao) botao.click();
    }
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
        const referencia = pedido.querySelector('.referencia');
        if (referencia) referencia.setAttribute('tabindex', proximoTabindex++);
        const material = pedido.querySelector('.material');
        if (material) material.setAttribute('tabindex', proximoTabindex++);

        // Botões (+, -, Inf)
        const botoesFocaveis = pedido.querySelectorAll('.adicionarPedido, .removerPedido, .adicionarInfantil');
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

function reconstruirBotoes(pedidoItem, infAtivo) {
    const containerQuadradinhos = pedidoItem.querySelector('.containerQuadradinhos');
    if (!containerQuadradinhos) return;
    
    // Limpa tudo
    containerQuadradinhos.innerHTML = '';

    // Se infAtivo = true => 15..43, senão => 30..43
    const inicio = infAtivo ? 15 : 30;
    const fim   = 43;

    for (let num = inicio; num <= fim; num++) {
        criarInserirBotao(containerQuadradinhos, num, false);
    }
    
    // Se for infantil, redimensiona para 40x40
    // Senão, redimensiona para 50x50
    if (infAtivo) {
        redimensionarBotoes(containerQuadradinhos, '40px', '40px');
    } else {
        redimensionarBotoes(containerQuadradinhos, '50px', '50px');
    }

    reorganizarTabindex();
    atualizarTotalGlobal();
}

/**
 * Atualiza o total de pares de UM pedido
 */
function atualizarParesPedido(pedidoItem) {
    const numeros = subpalmilha.querySelectorAll('.numero');
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
        atualizarTotalGlobal();
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
    for (let num = 30; num <= 43; num++) {
        const jaExiste = Array.from(container.querySelectorAll('.botao'))
            .some(bt => parseInt(bt.textContent, 10) === num);
        if (!jaExiste) {
            criarInserirBotao(container, num, false);
        }
    }
    redimensionarBotoes(container, '50px', '50px');
    reorganizarTabindex();
}

/**
 * Cria (15..29) no container, se não existirem,
 * normalmente redimensionando tudo para algo menor (ex.: 40x40).
 */
function criarBotoesInfantil(container) {
    for (let num = 15; num <= 29; num++) {
        const jaExiste = Array.from(container.querySelectorAll('.botao'))
            .some(bt => parseInt(bt.textContent, 10) === num);
        if (!jaExiste) {
            criarInserirBotao(container, num, true);
        }
    }
    reorganizarTabindex();
}

/**
 * Toggle do botão Inf do pedido:
 * - Se não tem infantil, adiciona 15..29 e redimensiona para 40x40
 * - Se já tem, remove 15..29 e volta adultos para 50x50
 */
function adicionarFuncionalidadesInf(pedidoItem) {
    const botaoInf = pedidoItem.querySelector('.adicionarInfantil');
    if (!botaoInf) return;

    // Começa sem infantil
    pedidoItem.dataset.infAtivo = "false";

    botaoInf.addEventListener('click', () => {
        const infAtivo = (pedidoItem.dataset.infAtivo === "true");
        const novoEstado = !infAtivo;
        pedidoItem.dataset.infAtivo = novoEstado ? "true" : "false";

        reconstruirBotoes(pedidoItem, novoEstado);
    });
}

/**
 * Adiciona todos os eventos de um pedido
 */
function adicionarEventosPedido(pedidoItem) {
    adicionarFuncionalidadesInf(pedidoItem);

    const botoes = pedidoItem.querySelectorAll('.botao');
    botoes.forEach(botao => {
        botao.addEventListener('click', () => {
            const botaoContainer = botao.parentElement;
            const numeroDiv = botaoContainer.querySelector('.numero');
            let valor = parseInt(numeroDiv.textContent.trim(), 10) || 0;
            valor++;
            atualizarEstiloValor(botaoContainer, valor);
            atualizarTotalGlobal();
        });
    });

    const numeros = pedidoItem.querySelectorAll('.numero');
    numeros.forEach(num => {
        num.addEventListener('input', () => {
            let val = parseInt(num.textContent.trim(), 10);
            if (isNaN(val)) val = 0;
            atualizarEstiloValor(num.parentElement, val);
            atualizarTotalGlobal();
        });
    });

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
                <div class="pedidos">
                <div class="linha-pedido">
                    <span class="campo">Referência:</span>
                    <input type="text" class="referencia">

                    <span class="campo">Material:</span>
                    <input type="text" class="material">

                    <span class="campo">Subpalmilha:</span>
                    <input type="text" class="subpalmilha">

                    <span class="campo">Costura:</span>
                    <input type="text" class="costura">
                </div>

                <div class="linha-pedido">
                    <span class="campo">Sintetico:</span>
                    <input type="text" class="sintetico">
                    
                    <span class="campo">Cor:</span>
                    <input type="text" class="cor">
                    
                    <span class="campo">Obs:</span>
                    <input type="text" class="obs">
                
                    <button type="button" class="adicionarPedido">+</button>
                    <button type="button" class="removerPedido">-</button>
                    <button type="button" class="adicionarInfantil">Inf</button>
                    <h5 class="pares">Pares: <b class="paresValor">0</b></h5>
                </div>
            </div>
            <div class="container containerQuadradinhos"></div>
            `;

            lista.appendChild(novoPedido);

            const containerQuadradinhos = novoPedido.querySelector('.containerQuadradinhos');
            criarBotoesAdulto(containerQuadradinhos);

            adicionarEventosPedido(novoPedido);

            reorganizarTabindex();
            atualizarTotalGlobal();
        });
    }

    const referenciaInput = pedidoItem.querySelector('.referencia');
    const materialInput = pedidoItem.querySelector('.material');
    if (referenciaInput && materialInput) {
        referenciaInput.addEventListener('input', function() {
            const referencia = this.value;
            fetch(`/buscar-produto/?codigo=${encodeURIComponent(referencia)}`)
                .then(response => response.json())
                .then(data => {
                    if (data.nome) {
                        materialInput.value = data.nome;
                    }
                })
                .catch(err => {
                    console.error("Erro ao buscar material:", err);
                });
        });
    }
}

/**
 * Coleta dados de todos os pedidos para POST
 */
function coletarDadosPedidos() {
    const dados = {};
    dados.cliente = document.querySelector('.cliente')?.value || '';
    dados.codigoVendedor = document.querySelector('.codVendedor')?.value || '';
    dados.vendedor = document.querySelector('.vendedor')?.value || '';
    
    dados.itens = [];

    const pedidoItens = document.querySelectorAll('.pedido-item');
    pedidoItens.forEach(pedido => {
        const referencia = pedido.querySelector('.referencia')?.value || '';
        const material = pedido.querySelector('.material')?.value || '';

        const tamanhos = {};
        const botaoContainers = pedido.querySelectorAll('.botao-container');
        botaoContainers.forEach(bc => {
            const btn = bc.querySelector('.botao');
            const numeroDiv = bc.querySelector('.numero');
            if (btn && numeroDiv) {
                const tam = btn.textContent.trim();
                const val = parseInt(numeroDiv.textContent.trim(), 10) || 0;
                if (val > 0) {
                    tamanhos[tam] = val;
                }
            }
        });

        dados.itens.push({
            referencia: referencia,
            material: material,
            tamanhos: tamanhos
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

    if (!dados.cliente) {
        alert('Por favor, preencha o campo "Cliente".');
        return;
    }
    if (!dados.codigoVendedor || !dados.vendedor) {
        alert('Por favor, preencha os campos "Código do Vendedor" e "Vendedor".');
        return;
    }
    if (dados.itens.length === 0) {
        alert('Por favor, adicione pelo menos um item ao pedido.');
        return;
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
        console.log('Resposta do servidor:', data);
        window.location.href = '/producao/';
    })
    .catch(err => {
        console.error(err);
        if (err.erro) {
            alert(`Erro: ${err.erro}`);
        } else {
            alert('Ocorreu um erro ao realizar o pedido.');
        }
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

    
    document.querySelectorAll('.pedido-item').forEach(pedido => {
        const containerQuadradinhos = pedido.querySelector('.containerQuadradinhos');
        if (containerQuadradinhos) {
            criarBotoesAdulto(containerQuadradinhos);
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
            enviarPedido('/realizar-pedido-urgente/', dados);
        });
    }

    reorganizarTabindex();
    atualizarTotalGlobal();
});
