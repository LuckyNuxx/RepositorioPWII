// ===== Chaves de persistência no localStorage =====
const CHAVE_ESTOQUE = "estoque_loja";
const CHAVE_CUPONS = "cupons_loja";
const CHAVE_PEDIDOS = "pedidos_loja";
const CHAVE_CARRINHO = "carrinho_loja";
const CHAVE_CUPOM_ATUAL = "cupom_atual_loja";

// ===== Dados padrão (usados apenas se não houver nada salvo ainda) =====
const estoquePadrao = [
  { codigo: 101, nome: "Mouse sem fio", preco: 59.9, quantidadeEmEstoque: 12 },
  { codigo: 102, nome: "Teclado mecânico", preco: 189.9, quantidadeEmEstoque: 6 },
  { codigo: 103, nome: "Monitor 24", preco: 749.0, quantidadeEmEstoque: 4 },
  { codigo: 104, nome: "Headset gamer", preco: 129.5, quantidadeEmEstoque: 9 },
  { codigo: 105, nome: "Webcam Full HD", preco: 99.0, quantidadeEmEstoque: 0 },
  { codigo: 106, nome: "Pen drive 64GB", preco: 39.9, quantidadeEmEstoque: 25 }
];

const cuponsPadrao = [
  { codigo: "DESCONTO20", desconto: 20 },
  { codigo: "MAMAE10", desconto: 10 }
];

// ===== Estado da aplicação =====
let estoque = [];
let carrinho = [];
let cupons = [];
let pedidos = [];
let cupomAtual = null;

// ===== Migração de dados antigos (versões anteriores usavam cod/qtd/valor) =====
function normalizarEstoque(lista) {
  return lista.map(p => ({
    codigo: p.codigo !== undefined ? p.codigo : p.cod,
    nome: p.nome,
    preco: p.preco,
    quantidadeEmEstoque:
      p.quantidadeEmEstoque !== undefined ? p.quantidadeEmEstoque : p.qtd
  }));
}

function normalizarCupons(lista) {
  return lista.map(c => ({
    codigo: c.codigo !== undefined ? c.codigo : c.cod,
    desconto: c.desconto !== undefined ? c.desconto : c.valor
  }));
}

// ===== Inicialização =====
function iniciar() {
  const estoqueSalvo = localStorage.getItem(CHAVE_ESTOQUE);
  const cuponsSalvos = localStorage.getItem(CHAVE_CUPONS);
  const pedidosSalvos = localStorage.getItem(CHAVE_PEDIDOS);
  const carrinhoSalvo = localStorage.getItem(CHAVE_CARRINHO);
  const cupomAtualSalvo = localStorage.getItem(CHAVE_CUPOM_ATUAL);

  estoque = estoqueSalvo ? normalizarEstoque(JSON.parse(estoqueSalvo)) : estoquePadrao;
  cupons = cuponsSalvos ? normalizarCupons(JSON.parse(cuponsSalvos)) : cuponsPadrao;
  pedidos = pedidosSalvos ? JSON.parse(pedidosSalvos) : [];
  carrinho = carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
  cupomAtual = cupomAtualSalvo ? JSON.parse(cupomAtualSalvo) : null;

  salvarDados(); // já regrava no formato novo, evitando o problema de novo
  renderizarEstoque();
  renderizarCarrinho();
  renderizarCupons();

  if (cupomAtual) {
    const msgCupom = document.getElementById("msg-cupom");
    mostrarMensagem(
      msgCupom,
      `Cupom ${cupomAtual.codigo} (${cupomAtual.desconto}%) aplicado!`,
      "sucesso"
    );
  }
}

function salvarDados() {
  localStorage.setItem(CHAVE_ESTOQUE, JSON.stringify(estoque));
  localStorage.setItem(CHAVE_CUPONS, JSON.stringify(cupons));
  localStorage.setItem(CHAVE_PEDIDOS, JSON.stringify(pedidos));
  localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));
  localStorage.setItem(CHAVE_CUPOM_ATUAL, JSON.stringify(cupomAtual));
}

// ===== Utilitários =====
function formatarDinheiro(valor) {
  return "R$ " + valor.toFixed(2).replace(".", ",");
}

function mostrarMensagem(elemento, texto, tipo) {
  // tipo: "sucesso" ou "erro"
  elemento.textContent = texto;
  elemento.className = "mensagem " + tipo;
}

// ===== Módulo 1: Catálogo / Estoque =====
function renderizarEstoque(filtro = "") {
  const tb = document.getElementById("tabela-estoque");
  const termo = filtro.toLowerCase();

  const produtosFiltrados = estoque.filter(produto =>
    produto.nome.toLowerCase().includes(termo)
  );

  tb.innerHTML = produtosFiltrados
    .map(produto => {
      const statusEstoque =
        produto.quantidadeEmEstoque === 0
          ? '<span class="esgotado">Esgotado</span>'
          : produto.quantidadeEmEstoque;

      return `
        <tr>
          <td>${produto.codigo}</td>
          <td>${produto.nome}</td>
          <td>${formatarDinheiro(produto.preco)}</td>
          <td>${statusEstoque}</td>
        </tr>
      `;
    })
    .join("");

  if (produtosFiltrados.length === 0) {
    tb.innerHTML = '<tr><td colspan="4" align="center">Nenhum produto encontrado</td></tr>';
  }
}

function filtrarProdutos() {
  const texto = document.getElementById("input-busca").value;
  renderizarEstoque(texto);
}

// ===== Módulo 3: Carrinho =====
function adicionarAoCarrinho() {
  const inputCodigo = document.getElementById("input-codigo");
  const inputQtd = document.getElementById("input-qtd");
  const msg = document.getElementById("msg-carrinho");

  const codigo = parseInt(inputCodigo.value);
  const quantidade = parseInt(inputQtd.value);

  if (!codigo || !inputQtd.value || isNaN(quantidade)) {
    mostrarMensagem(msg, "Preencha os campos!", "erro");
    return;
  }

  if (quantidade <= 0) {
    mostrarMensagem(msg, "A quantidade deve ser maior que zero.", "erro");
    return;
  }

  const produto = estoque.find(p => p.codigo === codigo);

  if (!produto) {
    mostrarMensagem(msg, "Produto não existe.", "erro");
    return;
  }

  if (quantidade > produto.quantidadeEmEstoque) {
    mostrarMensagem(msg, "Não tem estoque suficiente.", "erro");
    return;
  }

  produto.quantidadeEmEstoque -= quantidade;

  const jaEstaNoCarrinho = carrinho.some(item => item.codigo === codigo);

  if (jaEstaNoCarrinho) {
    carrinho = carrinho.map(item =>
      item.codigo === codigo
        ? { ...item, quantidadeComprada: item.quantidadeComprada + quantidade }
        : item
    );
  } else {
    carrinho.push({
      codigo: produto.codigo,
      nome: produto.nome,
      preco: produto.preco,
      quantidadeComprada: quantidade
    });
  }

  salvarDados();
  renderizarEstoque(document.getElementById("input-busca").value);
  renderizarCarrinho();

  mostrarMensagem(msg, "Adicionado com sucesso!", "sucesso");
  inputCodigo.value = "";
  inputQtd.value = "1";
}

function removerItemCarrinho(codigo) {
  const item = carrinho.find(i => i.codigo === codigo);
  if (!item) return;

  const produtoEstoque = estoque.find(p => p.codigo === codigo);
  if (produtoEstoque) {
    produtoEstoque.quantidadeEmEstoque += item.quantidadeComprada;
  }

  carrinho = carrinho.filter(i => i.codigo !== codigo);

  if (carrinho.length === 0) {
    cupomAtual = null;
    document.getElementById("resultado-total").innerHTML = "";
  }

  salvarDados();
  renderizarEstoque(document.getElementById("input-busca").value);
  renderizarCarrinho();
}

function calcularSubtotalCarrinho() {
  return carrinho.reduce(
    (acumulado, item) => acumulado + item.preco * item.quantidadeComprada,
    0
  );
}

function renderizarCarrinho() {
  const tb = document.getElementById("tabela-carrinho");

  if (carrinho.length === 0) {
    tb.innerHTML = '<tr><td colspan="5" align="center">Carrinho vazio</td></tr>';
    return;
  }

  tb.innerHTML = carrinho
    .map(item => {
      const subtotal = item.preco * item.quantidadeComprada;
      return `
        <tr>
          <td>${item.nome}</td>
          <td>${item.quantidadeComprada}</td>
          <td>${formatarDinheiro(item.preco)}</td>
          <td>${formatarDinheiro(subtotal)}</td>
          <td><button onclick="removerItemCarrinho(${item.codigo})">Remover</button></td>
        </tr>
      `;
    })
    .join("");
}

// ===== Módulo 4: Cupom no checkout e fechamento da compra =====
function aplicarCupom() {
  const codigoDigitado = document.getElementById("input-cupom").value.trim().toUpperCase();
  const msg = document.getElementById("msg-cupom");

  if (carrinho.length === 0) {
    mostrarMensagem(msg, "Carrinho vazio!", "erro");
    return;
  }

  if (!codigoDigitado) {
    mostrarMensagem(msg, "Digite um código de cupom.", "erro");
    return;
  }

  const cupomEncontrado = cupons.find(c => c.codigo === codigoDigitado);

  if (cupomEncontrado) {
    cupomAtual = cupomEncontrado;
    mostrarMensagem(msg, `Cupom ${cupomEncontrado.codigo} (${cupomEncontrado.desconto}%) aplicado!`, "sucesso");
  } else {
    cupomAtual = null;
    mostrarMensagem(msg, "Cupom inválido.", "erro");
  }
}

function finalizarCompra() {
  const divResultado = document.getElementById("resultado-total");

  if (carrinho.length === 0) {
    alert("Carrinho vazio!");
    return;
  }

  const subtotal = calcularSubtotalCarrinho();

  let valorDesconto = 0;
  let linhaCupom = "";

  if (cupomAtual) {
    valorDesconto = (subtotal * cupomAtual.desconto) / 100;
    linhaCupom = `<b>Cupom ${cupomAtual.codigo} (-${cupomAtual.desconto}%):</b> -${formatarDinheiro(valorDesconto)}<br>`;
  } else {
    linhaCupom = `<b>Cupom aplicado:</b> nenhum<br>`;
  }

  const total = subtotal - valorDesconto;

  divResultado.innerHTML = `
    <br>
    <b>Subtotal da Compra:</b> ${formatarDinheiro(subtotal)}<br>
    ${linhaCupom}
    <h3>VALOR FINAL A PAGAR: ${formatarDinheiro(total)}</h3>
  `;

  // registra o pedido no histórico (persistido no localStorage)
  pedidos.push({
    data: new Date().toISOString(),
    itens: carrinho,
    subtotal: subtotal,
    cupom: cupomAtual ? cupomAtual.codigo : null,
    valorDesconto: valorDesconto,
    total: total
  });

  // limpa carrinho e cupom para o próximo pedido
  carrinho = [];
  cupomAtual = null;

  salvarDados();
  renderizarCarrinho();
  document.getElementById("input-cupom").value = "";
  document.getElementById("msg-cupom").textContent = "";
  document.getElementById("msg-cupom").className = "mensagem";
}

// ===== Módulo 2: Gestão de Cupons (Admin) =====
function salvarCupom() {
  const inputCod = document.getElementById("novo-cupom-cod");
  const inputDesc = document.getElementById("novo-cupom-desc");
  const msg = document.getElementById("msg-admin");

  const codigo = inputCod.value.trim().toUpperCase();
  const descontoTexto = inputDesc.value;
  const desconto = parseInt(descontoTexto);

  if (!codigo || !descontoTexto) {
    mostrarMensagem(msg, "Preencha os dados.", "erro");
    return;
  }

  if (isNaN(desconto) || desconto < 1 || desconto > 100) {
    mostrarMensagem(msg, "O desconto deve ser um número entre 1 e 100.", "erro");
    return;
  }

  const cupomJaExiste = cupons.some(c => c.codigo === codigo);
  if (cupomJaExiste) {
    mostrarMensagem(msg, "Já existe um cupom com esse código.", "erro");
    return;
  }

  cupons.push({ codigo: codigo, desconto: desconto });
  salvarDados();
  renderizarCupons();

  mostrarMensagem(msg, "Cupom salvo com sucesso!", "sucesso");
  inputCod.value = "";
  inputDesc.value = "";
}

function excluirCupom(codigo) {
  cupons = cupons.filter(c => c.codigo !== codigo);
  salvarDados();
  renderizarCupons();
}

function renderizarCupons() {
  const tb = document.getElementById("tabela-cupons");

  if (cupons.length === 0) {
    tb.innerHTML = '<tr><td colspan="3" align="center">Nenhum cupom cadastrado</td></tr>';
    return;
  }

  tb.innerHTML = cupons
    .map(
      c => `
        <tr>
          <td>${c.codigo}</td>
          <td>${c.desconto}%</td>
          <td><button onclick="excluirCupom('${c.codigo}')">X</button></td>
        </tr>
      `
    )
    .join("");
}

// Inicia quando a página carrega
window.onload = iniciar;
