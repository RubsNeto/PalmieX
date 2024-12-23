let proximoTabindex = 1;

function reorganizarTabindex() {
    let proximoTabindex = 1;

    // Cliente, código do vendedor, vendedor
    const cliente = document.querySelector('.cliente');
    if (cliente) cliente.setAttribute('tabindex', proximoTabindex++);

    const codVendedor = document.querySelector('.codVendedor');
    if (codVendedor) codVendedor.setAttribute('tabindex', proximoTabindex++);

    const vendedor = document.querySelector('.vendedor');
    if (vendedor) vendedor.setAttribute('tabindex', proximoTabindex++);

    // Percorre todos os pedidos
    const pedidos = document.querySelectorAll('.pedido-item');
    pedidos.forEach(pedido => {
        // Referência e material
        const referencia = pedido.querySelector('.referencia');
        if (referencia) referencia.setAttribute('tabindex', proximoTabindex++);

        const material = pedido.querySelector('.material');
        if (material) material.setAttribute('tabindex', proximoTabindex++);


        const botoesFocaveis = pedido.querySelectorAll('.adicionarPedido, .removerPedido, .adicionarInfantil');
        botoesFocaveis.forEach(botao => {
            botao.setAttribute('tabindex', proximoTabindex++); 
        });

        const botoesNaoFocaveis = pedido.querySelectorAll('.botao');
        botoesNaoFocaveis.forEach(botao => {
            botao.setAttribute('tabindex', -1); 
        });

        // Números (quadradinhos)
        // Ordena os inputs de .numero com base no número do botão associado
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


// Função auxiliar para criar botões com tabindex=-1 (não focáveis)
function criarBotao(texto) {
    const botao = document.createElement('button');
    botao.className = 'botao';
    botao.textContent = texto;
    botao.setAttribute('tabindex', -1); // Botões não focáveis via tab
    return botao;
}

// Função auxiliar para criar div.numero com tabindex
function criarNumeroDiv(num) {
    const numeroDiv = document.createElement('div');
    numeroDiv.className = 'numero';
    numeroDiv.setAttribute('contenteditable', 'true');
    numeroDiv.setAttribute('aria-label', `Número ${num}`);
    numeroDiv.setAttribute('tabindex', proximoTabindex++); // Atribui tabindex sequencial
    numeroDiv.textContent = ''; // Mantém o div.numero vazio
    return numeroDiv;
}

// Função para atualizar o total de pares de um único pedido
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

// Função para atualizar o total global de todos os pedidos
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

// Função para coletar dados de todos os pedidos (para realizar pedido)
function coletarDadosPedidos() {
    const dados = {};

    const clienteInput = document.querySelector('.cliente');
    const codVendedorInput = document.querySelector('.codVendedor');
    const vendedorInput = document.querySelector('.vendedor');

    dados.cliente = clienteInput ? clienteInput.value : '';
    dados.codigoVendedor = codVendedorInput ? codVendedorInput.value : '';
    dados.vendedor = vendedorInput ? vendedorInput.value : '';
    dados.pedidos = [];

    const pedidoItens = document.querySelectorAll('.pedido-item');
    pedidoItens.forEach(pedido => {
        const referencia = pedido.querySelector('.referencia') ? pedido.querySelector('.referencia').value : '';
        const material = pedido.querySelector('.material') ? pedido.querySelector('.material').value : '';

        const tamanhos = {};
        const botaoContainers = pedido.querySelectorAll('.botao-container');
        botaoContainers.forEach((bc) => {
            const botao = bc.querySelector('.botao');
            const numeroDiv = bc.querySelector('.numero');
            if (botao && numeroDiv) {
                const tamanho = botao.textContent.trim();
                const valor = parseInt(numeroDiv.textContent.trim(), 10) || 0;
                // Somente adiciona ao objeto se valor > 0, já que não queremos zeros
                if (valor > 0) {
                    tamanhos[tamanho] = valor;
                }
            }
        });

        dados.pedidos.push({
            referencia: referencia,
            material: material,
            tamanhos: tamanhos
        });
    });

    return dados;
}

// Função para aplicar estilo e mostrar/esconder zero
function atualizarEstiloValor(botaoContainer, valor) {
    const numeroDiv = botaoContainer.querySelector('.numero');

    if (valor > 0) {
        // Exibe o valor
        numeroDiv.textContent = valor;
        botaoContainer.classList.add('valor-positivo');
    } else {
        // Se valor = 0, não mostra nada (string vazia)
        numeroDiv.textContent = '';
        botaoContainer.classList.remove('valor-positivo');
    }
}

function adicionarFuncionalidadesInf(pedidoItem) {
    const botaoInf = pedidoItem.querySelector('.adicionarInfantil');
    const containerQuadradinhos = pedidoItem.querySelector('.containerQuadradinhos');
    
    if (botaoInf && containerQuadradinhos) {
        // Flag para evitar múltiplos cliques adicionando os mesmos botões
        let infAdicionado = false;
    
        botaoInf.addEventListener('click', () => {
            if (infAdicionado) {
                alert('Os botões de 15 a 29 já foram adicionados para este pedido.');
                return;
            }
    
            const inicio = 29;
            const fim = 15;
    
            for (let num = inicio; num >= fim; num--) {
                // Verifica se o botão já existe
                const existe = Array.from(containerQuadradinhos.querySelectorAll('.botao')).some(botao => parseInt(botao.textContent) === num);
                if (existe) continue; // Pula se o botão já existir

                // Cria o container do quadradinho
                const botaoContainer = document.createElement('div');
                botaoContainer.className = 'botao-container';

                // Cria o botão
                const botao = criarBotao(num);
                
                // Cria o campo de escrita (div.numero)
                const numeroDiv = criarNumeroDiv(num);
                // Já atribuímos tabindex na criação (não é necessário, pois reorganizarTabindex irá ajustar)

                // Adiciona o botão e o div.numero ao container
                botaoContainer.appendChild(botao);
                botaoContainer.appendChild(numeroDiv);

                // Adiciona o container ao container principal
                containerQuadradinhos.insertBefore(botaoContainer, containerQuadradinhos.firstChild); // Insere no início para manter a ordem

                // Adiciona evento de incremento ao novo botão
                botao.addEventListener('click', () => {
                    let valor = parseInt(numeroDiv.textContent.trim(), 10) || 0;
                    valor += 1;
                    atualizarEstiloValor(botaoContainer, valor);
                    atualizarTotalGlobal();
                });

                // Adiciona evento de input ao novo campo numero
                numeroDiv.addEventListener('input', () => {
                    let valor = parseInt(numeroDiv.textContent.trim(), 10);
                    if (isNaN(valor)) {
                        valor = 0; 
                    }

                    // Aplica a lógica de esconder zero
                    atualizarEstiloValor(numeroDiv.parentElement, valor);
                    atualizarTotalGlobal();
                });
            }

            // Alterar o tamanho de todos os botões
            const botoes = containerQuadradinhos.querySelectorAll('.botao');
            botoes.forEach(botao => {
                botao.style.width = '40px';
                botao.style.height = '40px';
            });

            // Atualiza a flag para evitar duplicações
            infAdicionado = true;

            // Reorganiza os tabindex após adicionar novos quadradinhos
            reorganizarTabindex();
        });
    }
}

// Função para adicionar eventos a um pedido específico
function adicionarEventosPedido(pedidoItem) {
    // Incremento ao clicar no botão
    const botoes = pedidoItem.querySelectorAll('.botao');
    botoes.forEach(botao => {
        botao.addEventListener('click', () => {
            const botaoContainer = botao.parentElement;
            const numeroDiv = botaoContainer.querySelector('.numero');
            let valor = parseInt(numeroDiv.textContent.trim(), 10) || 0;
            valor += 1;

            atualizarEstiloValor(botaoContainer, valor);
            atualizarTotalGlobal();
        });
    });

    // Edição manual do valor
    const numeros = pedidoItem.querySelectorAll('.numero');
    numeros.forEach(num => {
        num.addEventListener('input', () => {
            let valor = parseInt(num.textContent.trim(), 10);
            if (isNaN(valor)) {
                valor = 0; 
            }

            // Aplica a lógica de esconder zero
            atualizarEstiloValor(num.parentElement, valor);
            atualizarTotalGlobal();
        });
    });

    // Remover pedido
    const removerBtn = pedidoItem.querySelector('.removerPedido');
    if (removerBtn) {
        removerBtn.addEventListener('click', () => {
            if (confirm("Deseja realmente remover este pedido?")) {
                pedidoItem.remove();
                atualizarTotalGlobal();
            }
        });
    }

    // Adicionar novo pedido
    const adicionarBtn = pedidoItem.querySelector('.adicionarPedido');
    if (adicionarBtn) {
        adicionarBtn.addEventListener('click', () => {
            const lista = document.querySelector('.lista-pedidos');

            const novoPedido = document.createElement('div');
            novoPedido.classList.add('pedido-item');

            // HTML do novo pedido com +, -, e Inf
            novoPedido.innerHTML = `
                <div class="pedidos">
                    <span class="campo">Referência:</span>
                    <input type="text" class="referencia">

                    <span class="campo">Material:</span>
                    <input type="text" class="material">

                    <div class="maisEmenos">
                        <button type="button" class="adicionarPedido">+</button>
                        <button type="button" class="removerPedido">-</button>
                        <button type="button" class="adicionarInfantil">Inf</button>
                        <h5 class="pares">Pares: <b class="paresValor">0</b></h5>   
                    </div>
                </div>
                <div class="container containerQuadradinhos">
                    <!-- Quadradinhos Iniciais (30 a 43) -->
                    ${[...Array(14).keys()].map(i => {
                        const num = i + 30;
                        return `
                        <div class="botao-container">
                            <button class="botao" tabindex="-1">${num}</button>
                            <div class="numero" contenteditable="true" aria-label="Número ${num}"></div>
                        </div>`;
                    }).join('')}
                    
                </div>
            `;

            lista.appendChild(novoPedido);
            adicionarEventosPedido(novoPedido);
            adicionarFuncionalidadesInf(novoPedido);

            // Reorganiza todos os tabindex globalmente
            reorganizarTabindex();

            atualizarTotalGlobal();
        });
    }

    // Buscar material ao mudar referência
    const referenciaInput = pedidoItem.querySelector('.referencia');
    const materialInput = pedidoItem.querySelector('.material');
    if (referenciaInput && materialInput) {
        referenciaInput.addEventListener('input', function() {
            const referencia = this.value;
            fetch(`/buscar-material/?referencia=${encodeURIComponent(referencia)}`)
                .then(response => response.json())
                .then(data => {
                    if (data.tamanho) {
                        materialInput.value = `Tamanho ${data.tamanho}`;
                    } else {
                        alert(data.erro);
                    }
                });
        });
    }

    // Adicionar funcionalidades para o botão Inf dentro deste pedido
    adicionarFuncionalidadesInf(pedidoItem);
}

// Adicionar eventos ao pedido inicial
document.querySelectorAll('.pedido-item').forEach(pedido => {
    adicionarEventosPedido(pedido);
});

// Buscar vendedor ao alterar o código do vendedor
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
                } else {
                    alert(data.erro);
                }
            });
    });
}

// Ao clicar em "Realizar pedido"
const realizarPedidoBtn = document.querySelector('.realizarPedido');
if (realizarPedidoBtn) {
    realizarPedidoBtn.addEventListener('click', () => {
        const dados = coletarDadosPedidos();

        fetch('/realizar-pedido', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao realizar pedido');
            }
            return response.json();
        })
        .then(data => {
            alert('Pedido realizado com sucesso!');
            console.log('Resposta do servidor:', data);
            // Caso deseje, limpar campos após o pedido
        })
        .catch(err => {
            alert('Ocorreu um erro ao realizar o pedido');
            console.error(err);
        });
    });
}

// Função para inicializar tabindex e atualizar total
document.addEventListener('DOMContentLoaded', () => {
    reorganizarTabindex();
    atualizarTotalGlobal();
});
