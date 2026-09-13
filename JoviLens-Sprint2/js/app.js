/* =========================================================
   JOVI Lens - interação da aplicação
   ========================================================= */

/* Tudo o que muda durante o uso fica guardado aqui. */
var estado = {
  tela: 'splash',
  telaAnterior: 'splash',
  cena: 0,
  modo: 'Foto',
  zoom: 1,
  filtro: 'original',
  formato: 'stories',
  categoria: 'Tudo',
  busca: '',
  grade: false,
  flash: false,
  zeiss: true,
  temporizador: 0,
  capturadas: [],
  ultimaFoto: null,
  fotoAberta: null,
  origemEditor: 'pos'
};

var tempoAnalise = null;
var avisoBootstrap = null;
var modalBootstrap = null;

/* ===================== FUNÇÕES DE APOIO ===================== */

function elemento(id) {
  return document.getElementById(id);
}

/* Troca as letras com acento pelas letras simples, para a busca
   funcionar tanto com "marco" quanto com "março". */
function semAcento(texto) {
  var comAcento = 'áàãâäéèêëíìîïóòõôöúùûüç';
  var trocaPor = 'aaaaaeeeeiiiiooooouuuuc';
  var resultado = '';

  for (var i = 0; i < texto.length; i++) {
    var posicao = comAcento.indexOf(texto[i]);
    resultado += (posicao === -1) ? texto[i] : trocaPor[posicao];
  }

  return resultado;
}

function horaAgora() {
  var agora = new Date();
  return String(agora.getHours()).padStart(2, '0') + ':' +
         String(agora.getMinutes()).padStart(2, '0');
}

/* Evita escrever "1 fotos" na galeria. */
function contarFotos(quantidade) {
  return quantidade + (quantidade === 1 ? ' foto' : ' fotos');
}

/* Alguns modos ficam estranhos escritos como "Modo Foto". */
function nomeDoModo(modo) {
  if (modo === 'Foto') return 'Foto automática';
  if (modo === 'Vídeo') return 'Vídeo 4K';
  return 'Modo ' + modo;
}

/* Reinicia uma animação de CSS que já rodou uma vez. */
function reiniciarAnimacao(alvo, classe) {
  alvo.classList.remove(classe);
  void alvo.offsetWidth;
  alvo.classList.add(classe);
}

function mostrarAviso(texto) {
  elemento('avisoTexto').textContent = texto;
  avisoBootstrap.show();
}

/* ===================== NAVEGAÇÃO ===================== */

function mostrarTela(nome) {
  if (nome === estado.tela) return;

  var telas = document.querySelectorAll('.tela');
  for (var i = 0; i < telas.length; i++) {
    telas[i].classList.remove('ativa');
  }

  elemento('tela-' + nome).classList.add('ativa');
  estado.telaAnterior = estado.tela;
  estado.tela = nome;

  if (nome === 'camera') analisarCena();
  if (nome === 'galeria') carregarGaleria();
  if (nome === 'editor') prepararEditor();
  if (nome === 'performance') montarPerformance();
}

/* ===================== BARRA DE STATUS ===================== */

function atualizarRelogio() {
  elemento('relogio').textContent = horaAgora();
}

/* ===================== TELA 1 · ABERTURA ===================== */

/* Barra de carregamento: mostra que o app sobe rápido,
   que é justamente o que a solução promete. */
function carregarAplicacao() {
  var barra = elemento('splashProgresso');
  var status = elemento('splashStatus');
  var botao = elemento('btnAbrirCamera');
  var progresso = 0;

  var contador = setInterval(function () {
    progresso = progresso + 4;
    barra.style.width = progresso + '%';

    if (progresso === 40) status.textContent = 'Carregando a JOVI Lens...';
    if (progresso === 76) status.textContent = 'Analisando o ambiente...';

    if (progresso >= 100) {
      clearInterval(contador);
      status.textContent = 'Tudo pronto em 1,0 s';
      botao.disabled = false;
    }
  }, 40);
}

/* ===================== TELA 2 · CÂMERA ===================== */

/* Monta a régua de modos e a lista de modos extras. */
function montarModos() {
  var regua = elemento('camModos');
  var extras = elemento('camExtras');
  var i;

  regua.innerHTML = '';
  extras.innerHTML = '';

  for (i = 0; i < modos.length; i++) {
    var botao = document.createElement('button');
    botao.className = 'cam-modo';
    botao.textContent = modos[i];

    if (modos[i] === 'Mais') {
      botao.setAttribute('data-bs-toggle', 'collapse');
      botao.setAttribute('data-bs-target', '#modosExtras');
      /* "Mais" fica aceso quando o modo em uso está escondido nele */
      if (modosExtras.indexOf(estado.modo) !== -1) botao.classList.add('ativo');
    } else {
      botao.setAttribute('data-modo', modos[i]);
      if (modos[i] === estado.modo) botao.classList.add('ativo');
    }

    regua.appendChild(botao);
  }

  for (i = 0; i < modosExtras.length; i++) {
    var extra = document.createElement('button');
    extra.className = 'cam-extra';
    extra.textContent = modosExtras[i];
    extra.setAttribute('data-modo', modosExtras[i]);
    if (modosExtras[i] === estado.modo) extra.classList.add('ativo');
    extras.appendChild(extra);
  }
}

function atualizarVisor() {
  var imagem = elemento('camImagem');
  var cena = cenas[estado.cena];

  imagem.src = cena.imagem;
  imagem.alt = 'Pré-visualização da câmera: ' + cena.alt;
  imagem.style.filter = efeitoDoModo[estado.modo] || 'none';
  imagem.style.transform = 'scale(' + escalaDoZoom[estado.zoom] + ')';
}

function atualizarZoom() {
  var botoes = document.querySelectorAll('.zoom-btn');
  for (var i = 0; i < botoes.length; i++) {
    botoes[i].classList.toggle('ativo', Number(botoes[i].dataset.zoom) === estado.zoom);
  }
}

/* A IA "olha" a cena e demora um instante para responder,
   como aconteceria de verdade. */
function analisarCena() {
  var cena = cenas[estado.cena];
  var aviso = elemento('lensAviso');
  var texto = elemento('lensTexto');
  var botao = elemento('lensBotao');
  var marca = elemento('lensMarca');

  aviso.classList.remove('modo-ativo');
  marca.classList.remove('modo-ativo');
  marca.textContent = 'JOVI · LENS';
  botao.classList.add('d-none');
  texto.textContent = 'Analisando a cena...';

  clearTimeout(tempoAnalise);
  tempoAnalise = setTimeout(function () {
    texto.innerHTML = '<strong>' + cena.deteccao + '</strong> · ' + cena.sugestao;
    botao.classList.remove('d-none');
  }, 900);
}

function aceitarSugestao() {
  var cena = cenas[estado.cena];

  aplicarModo(cena.modo);

  elemento('lensAviso').classList.add('modo-ativo');
  elemento('lensBotao').classList.add('d-none');
  elemento('lensTexto').innerHTML = '<strong>' + cena.rotulo + '</strong> · ' + cena.aviso;

  var marca = elemento('lensMarca');
  marca.classList.add('modo-ativo');
  marca.textContent = 'JOVI · LENS · ATIVO';
}

function aplicarModo(modo) {
  estado.modo = modo;
  montarModos();
  atualizarVisor();
}

/* Aponta a câmera para outra cena e pede uma análise nova. */
function trocarCena() {
  estado.cena = (estado.cena + 1) % cenas.length;
  estado.modo = 'Foto';
  estado.zoom = 1;

  montarModos();
  atualizarZoom();
  atualizarVisor();
  analisarCena();
}

/* Quadradinho de foco onde o dedo tocou. */
function marcarFoco(evento) {
  if (evento.target.closest('button')) return;

  var visor = elemento('camVisor');
  var area = visor.getBoundingClientRect();
  var foco = elemento('camFoco');

  foco.style.left = (evento.clientX - area.left) + 'px';
  foco.style.top = (evento.clientY - area.top) + 'px';
  reiniciarAnimacao(foco, 'focando');
}

/* A pílula preta do topo mostra o que a câmera está fazendo.
   Ela ocupa o lugar do aviso da IA, por isso um esconde o outro. */
function mostrarIlha(texto) {
  elemento('camIlhaTexto').textContent = texto;
  elemento('camIlha').classList.add('visivel');
  elemento('lensAviso').classList.add('d-none');
  elemento('lensMarca').classList.add('d-none');
}

function esconderIlha() {
  elemento('camIlha').classList.remove('visivel');
  elemento('lensAviso').classList.remove('d-none');
  elemento('lensMarca').classList.remove('d-none');
}

function dispararFoto() {
  var cena = cenas[estado.cena];

  reiniciarAnimacao(elemento('camClarao'), 'disparando');
  mostrarIlha('Processando com IA');

  var foto = {
    imagem: cena.imagem,
    alt: cena.alt,
    cena: estado.cena,
    modo: estado.modo,
    efeito: efeitoDoModo[estado.modo] || 'none',
    hora: horaAgora(),
    cidade: cena.cidade,
    momento: cena.local
  };

  estado.capturadas.unshift(foto);
  estado.ultimaFoto = foto;
  estado.fotoAberta = null;

  var miniatura = elemento('camMiniaturaImg');
  miniatura.src = foto.imagem;
  miniatura.style.filter = foto.efeito;
  reiniciarAnimacao(elemento('camMiniatura'), 'piscar');

  setTimeout(function () {
    esconderIlha();
    montarPosCaptura();
    mostrarTela('pos');
  }, 700);
}

/* ===================== TELA 3 · PÓS-CAPTURA ===================== */

function montarPosCaptura() {
  var foto = estado.ultimaFoto;
  var cena = cenas[foto.cena];
  var imagem = elemento('posFoto');

  imagem.src = foto.imagem;
  imagem.alt = foto.alt;
  imagem.style.filter = foto.efeito;

  elemento('posHora').textContent = 'Hoje · ' + foto.hora;
  elemento('posLocal').textContent = foto.cidade;
  elemento('posSelo').textContent = '200 MP · ' + nomeDoModo(foto.modo);
  elemento('posTexto').textContent = cena.analise;

  var caixa = elemento('posGanhos');
  caixa.innerHTML = '';

  for (var i = 0; i < cena.ganhos.length; i++) {
    var ganho = cena.ganhos[i];
    var linha = document.createElement('div');
    linha.className = 'pos-ganho';
    linha.innerHTML =
      '<span class="pos-ganho-rotulo">' + ganho.rotulo + '</span>' +
      '<span class="pos-ganho-trilho"><i></i></span>' +
      '<span class="pos-ganho-valor">+' + ganho.valor + '%</span>';
    caixa.appendChild(linha);
  }

  /* Espera um instante para a barra crescer na frente do usuário. */
  setTimeout(function () {
    var barras = caixa.querySelectorAll('.pos-ganho-trilho i');
    for (var j = 0; j < barras.length; j++) {
      barras[j].style.width = cena.ganhos[j].valor + '%';
    }
  }, 150);
}

/* ===================== TELA 4 · GALERIA ===================== */

/* As fotos tiradas agora entram como um momento novo, no topo. */
function listaDeMomentos() {
  var lista = momentos.slice();

  if (estado.capturadas.length > 0) {
    var imagens = [];
    for (var i = 0; i < estado.capturadas.length; i++) {
      imagens.push(estado.capturadas[i].imagem);
    }

    lista.unshift({
      id: 'capturadas',
      cena: estado.capturadas[0].cena,
      nome: 'Capturadas agora',
      emoji: '📸',
      periodo: 'Hoje · agora',
      categoria: 'Recentes',
      modo: nomeDoModo(estado.capturadas[0].modo),
      local: estado.capturadas[0].cidade,
      total: imagens.length,
      busca: 'capturadas agora recentes novas hoje',
      fotos: imagens
    });
  }

  return lista;
}

/* Filtra pela categoria escolhida e pelas palavras digitadas. */
function momentosFiltrados() {
  var lista = listaDeMomentos();
  var palavras = semAcento(estado.busca.toLowerCase()).split(' ');
  var resultado = [];

  for (var i = 0; i < lista.length; i++) {
    var momento = lista[i];

    if (estado.categoria !== 'Tudo' && momento.categoria !== estado.categoria) continue;

    var texto = semAcento((
      momento.nome + ' ' + momento.categoria + ' ' + momento.modo + ' ' +
      momento.periodo + ' ' + momento.local + ' ' + momento.busca
    ).toLowerCase());

    /* Só as palavras com 3 letras ou mais contam, assim "em", "de"
       e "da" não atrapalham a busca. */
    var combina = true;
    for (var p = 0; p < palavras.length; p++) {
      if (palavras[p].length >= 3 && texto.indexOf(palavras[p]) === -1) {
        combina = false;
      }
    }

    if (combina) resultado.push(momento);
  }

  return resultado;
}

function cartaoMomento(momento) {
  var visiveis = Math.min(momento.fotos.length, 3);
  var restantes = momento.total - visiveis;
  var grade = '';

  for (var i = 0; i < visiveis; i++) {
    var marcador = '';
    if (i === visiveis - 1 && restantes > 0) {
      marcador = '<span class="gal-mais">+' + restantes + '</span>';
    }
    grade +=
      '<button class="gal-foto" data-momento="' + momento.id + '" data-foto="' + i + '">' +
        '<img src="' + momento.fotos[i] + '" alt="Foto do momento ' + momento.nome + '" loading="lazy" decoding="async">' +
        marcador +
      '</button>';
  }

  return '' +
    '<article class="gal-momento">' +
      '<div class="gal-momento-topo">' +
        '<p class="gal-momento-nome">' + momento.emoji + ' <span>' + momento.nome + '</span></p>' +
        '<span class="gal-momento-dados">' + contarFotos(momento.total) + ' · ' + momento.modo + '</span>' +
      '</div>' +
      '<div class="gal-grade">' + grade + '</div>' +
    '</article>';
}

/* Enquanto a galeria "carrega", mostra blocos cinza piscando.
   Isso deixa a espera menos incômoda. */
function carregarGaleria() {
  var corpo = elemento('galCorpo');
  var esqueleto = '';

  for (var i = 0; i < 3; i++) {
    esqueleto +=
      '<div class="gal-esqueleto">' +
        '<div class="gal-esqueleto-linha"></div>' +
        '<div class="gal-esqueleto-grade">' +
          '<div class="gal-esqueleto-foto"></div>' +
          '<div class="gal-esqueleto-foto"></div>' +
          '<div class="gal-esqueleto-foto"></div>' +
        '</div>' +
      '</div>';
  }

  corpo.innerHTML = esqueleto;
  setTimeout(renderizarGaleria, 400);
}

function renderizarGaleria() {
  var lista = momentosFiltrados();
  var corpo = elemento('galCorpo');
  var total = 0;

  if (lista.length === 0) {
    corpo.innerHTML =
      '<div class="gal-vazio">' +
        '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.7" y2="16.7"/></svg>' +
        '<p>Nenhuma foto encontrada</p>' +
        '<small>Tente outra palavra ou volte para "Tudo".</small>' +
      '</div>';
    elemento('galTotal').textContent = contarFotos(0);
    return;
  }

  var html = '';
  var periodoAtual = '';

  for (var i = 0; i < lista.length; i++) {
    if (lista[i].periodo !== periodoAtual) {
      periodoAtual = lista[i].periodo;
      html += '<p class="gal-periodo">' + periodoAtual + '</p>';
    }
    html += cartaoMomento(lista[i]);
    total += lista[i].total;
  }

  corpo.innerHTML = html;
  corpo.scrollTop = 0;
  elemento('galTotal').textContent = contarFotos(total);
}

function montarCategorias() {
  var caixa = elemento('galCategorias');
  caixa.innerHTML = '';

  for (var i = 0; i < categorias.length; i++) {
    var botao = document.createElement('button');
    botao.className = 'gal-categoria';
    botao.textContent = categorias[i];
    botao.setAttribute('data-categoria', categorias[i]);
    if (categorias[i] === estado.categoria) botao.classList.add('ativa');
    caixa.appendChild(botao);
  }
}

/* ===================== TELA 5 · FOTO ABERTA ===================== */

function acharMomento(id) {
  var lista = listaDeMomentos();
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].id === id) return lista[i];
  }
  return null;
}

function abrirFoto(id, indice) {
  var momento = acharMomento(id);
  if (!momento) return;

  estado.fotoAberta = {
    imagem: momento.fotos[indice],
    alt: 'Foto do momento ' + momento.nome,
    cena: momento.cena,
    modo: momento.modo
  };

  var imagem = elemento('fotoGrande');
  imagem.src = estado.fotoAberta.imagem;
  imagem.alt = estado.fotoAberta.alt;

  elemento('fotoMomento').textContent = momento.nome;
  elemento('fotoDetalhe').textContent = momento.periodo + ' · ' + momento.local;
  elemento('fotoSelo').textContent = '200 MP · ' + momento.modo;

  mostrarTela('foto');
}

/* ===================== TELA 6 · EDITOR ===================== */

/* Pode chegar aqui vindo da pós-captura ou da galeria. */
function fotoEmUso() {
  if (estado.fotoAberta) return estado.fotoAberta;
  if (estado.ultimaFoto) return estado.ultimaFoto;
  return { imagem: cenas[0].imagem, alt: cenas[0].alt, cena: 0, modo: 'Foto' };
}

function prepararEditor() {
  var foto = fotoEmUso();

  estado.origemEditor = (estado.telaAnterior === 'foto') ? 'foto' : 'pos';

  var imagem = elemento('edFoto');
  imagem.src = foto.imagem;
  imagem.alt = 'Foto sendo editada: ' + foto.alt;

  montarFormatos();
  montarFiltros();
  aplicarEdicao();
}

function montarFormatos() {
  var caixa = elemento('edFormatos');
  caixa.innerHTML = '';

  for (var i = 0; i < formatos.length; i++) {
    var formato = formatos[i];
    var botao = document.createElement('button');
    botao.className = 'ed-formato';
    botao.setAttribute('data-formato', formato.id);
    if (formato.id === estado.formato) botao.classList.add('ativo');

    /* A forminha do botão usa a mesma proporção do formato. */
    botao.innerHTML =
      '<span class="ed-formato-forma" style="aspect-ratio:' + formato.proporcao + '"></span>' +
      '<span>' + formato.nome + '</span>';

    caixa.appendChild(botao);
  }
}

function montarFiltros() {
  var caixa = elemento('edFiltros');
  var foto = fotoEmUso();
  caixa.innerHTML = '';

  for (var i = 0; i < filtros.length; i++) {
    var filtro = filtros[i];
    var botao = document.createElement('button');
    botao.className = 'ed-filtro';
    botao.setAttribute('data-filtro', filtro.id);
    if (filtro.id === estado.filtro) botao.classList.add('ativo');

    botao.innerHTML =
      '<span class="ed-filtro-img">' +
        '<img src="' + foto.imagem + '" alt="Prévia do filtro ' + filtro.nome + '" style="filter:' + filtro.efeito + '">' +
      '</span>' +
      '<span>' + filtro.nome + '</span>';

    caixa.appendChild(botao);
  }
}

function acharPorId(lista, id) {
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].id === id) return lista[i];
  }
  return lista[0];
}

function aplicarEdicao() {
  var filtro = acharPorId(filtros, estado.filtro);
  var formato = acharPorId(formatos, estado.formato);

  elemento('edFoto').style.filter = filtro.efeito;
  elemento('edMoldura').style.aspectRatio = formato.proporcao;
  elemento('edProporcao').textContent = formato.rotulo;
}

/* ===================== TELA 7 · PERFORMANCE ===================== */

function montarPerformance() {
  var foto = fotoEmUso();
  var cena = cenas[foto.cena];
  var caixa = elemento('perfCartoes');

  var medidas = [
    { rotulo: 'Velocidade de captura', valor: '0,3 s · Ultrarrápido', porcento: 94, azul: false, icone: 'raio' },
    { rotulo: 'IA aplicada', valor: cena.recursos, porcento: 88, azul: true, icone: 'estrela' },
    { rotulo: 'Tamanho otimizado', valor: '4,2 MB → 1,1 MB', porcento: 74, azul: false, icone: 'seta' }
  ];

  var desenhos = {
    raio: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    estrela: '<path d="M12 2 13.5 8.5 20 10 13.5 11.5 12 18 10.5 11.5 4 10 10.5 8.5 12 2Z"/>',
    seta: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'
  };

  caixa.innerHTML = '';

  for (var i = 0; i < medidas.length; i++) {
    var medida = medidas[i];
    var cartao = document.createElement('div');
    cartao.className = 'perf-cartao';
    cartao.innerHTML =
      '<span class="perf-icone' + (medida.azul ? ' azul' : '') + '">' +
        '<svg viewBox="0 0 24 24">' + desenhos[medida.icone] + '</svg>' +
      '</span>' +
      '<div class="perf-dados">' +
        '<p class="perf-rotulo">' + medida.rotulo + '</p>' +
        '<p class="perf-valor">' + medida.valor + '</p>' +
      '</div>' +
      '<div class="perf-medidor">' +
        '<span class="perf-trilho' + (medida.azul ? ' azul' : '') + '"><i></i></span>' +
        '<span class="perf-porcento">0%</span>' +
      '</div>';
    caixa.appendChild(cartao);
  }

  elemento('perfDica').textContent = cena.dica;

  /* Barras e números sobem juntos, para a tela parecer viva. */
  setTimeout(function () {
    var barras = caixa.querySelectorAll('.perf-trilho i');
    var numeros = caixa.querySelectorAll('.perf-porcento');
    for (var j = 0; j < medidas.length; j++) {
      barras[j].style.width = medidas[j].porcento + '%';
      contarAte(numeros[j], medidas[j].porcento);
    }
  }, 200);
}

function contarAte(alvo, limite) {
  var valor = 0;
  var passo = setInterval(function () {
    valor = valor + 2;
    if (valor >= limite) {
      valor = limite;
      clearInterval(passo);
    }
    alvo.textContent = valor + '%';
  }, 18);
}

/* ===================== COMPARTILHAMENTO ===================== */

function montarRedes() {
  var caixa = elemento('redes');
  caixa.innerHTML = '';

  for (var i = 0; i < redes.length; i++) {
    var rede = redes[i];
    var botao = document.createElement('button');
    botao.className = 'rede';
    botao.setAttribute('data-rede', rede.nome);
    botao.innerHTML =
      '<span class="rede-bolha" style="background:' + rede.cor + '">' + rede.inicial + '</span>' +
      '<span>' + rede.nome + '</span>';
    caixa.appendChild(botao);
  }
}

function abrirCompartilhamento() {
  var formato = acharPorId(formatos, estado.formato);
  elemento('modalLegenda').textContent = 'Formato ' + formato.nome + ' · pronto para publicar';
  modalBootstrap.show();
}

function confirmarCompartilhamento(rede) {
  modalBootstrap.hide();
  mostrarAviso(rede === 'Salvar' ? 'Foto salva na galeria' : 'Compartilhado no ' + rede);
  setTimeout(function () {
    mostrarTela('performance');
  }, 700);
}

/* ===================== LIGAÇÃO DOS EVENTOS ===================== */

document.addEventListener('DOMContentLoaded', function () {

  avisoBootstrap = new bootstrap.Toast(elemento('aviso'));
  modalBootstrap = new bootstrap.Modal(elemento('modalCompartilhar'));

  atualizarRelogio();
  setInterval(atualizarRelogio, 20000);

  montarModos();
  montarCategorias();
  montarRedes();
  atualizarVisor();
  carregarAplicacao();

  elemento('btnAbrirCamera').addEventListener('click', function () {
    mostrarTela('camera');
  });

  /* Câmera */
  elemento('btnTrocarCena').addEventListener('click', trocarCena);
  elemento('btnDisparo').addEventListener('click', dispararFoto);
  elemento('lensBotao').addEventListener('click', aceitarSugestao);
  elemento('camVisor').addEventListener('click', marcarFoco);

  /* Busca da galeria */
  elemento('galBusca').addEventListener('input', function () {
    estado.busca = this.value;
    elemento('galLimpar').classList.toggle('d-none', this.value === '');
    renderizarGaleria();
  });

  elemento('galLimpar').addEventListener('click', function () {
    var campo = elemento('galBusca');
    campo.value = '';
    estado.busca = '';
    this.classList.add('d-none');
    renderizarGaleria();
    campo.focus();
  });

  /* Editor */
  elemento('btnCompartilhar').addEventListener('click', abrirCompartilhamento);

  /* Um único clique cuida de tudo o que é criado pelo JavaScript. */
  document.addEventListener('click', function (evento) {
    var alvo = evento.target;

    var zoom = alvo.closest('.zoom-btn');
    if (zoom) {
      estado.zoom = Number(zoom.dataset.zoom);
      atualizarZoom();
      atualizarVisor();
      return;
    }

    var modo = alvo.closest('[data-modo]');
    if (modo) {
      aplicarModo(modo.dataset.modo);
      return;
    }

    var ferramenta = alvo.closest('[data-ferramenta]');
    if (ferramenta) {
      usarFerramenta(ferramenta);
      return;
    }

    var categoria = alvo.closest('[data-categoria]');
    if (categoria) {
      estado.categoria = categoria.dataset.categoria;
      montarCategorias();
      renderizarGaleria();
      return;
    }

    var foto = alvo.closest('[data-momento]');
    if (foto) {
      abrirFoto(foto.dataset.momento, Number(foto.dataset.foto));
      return;
    }

    var formato = alvo.closest('[data-formato]');
    if (formato) {
      estado.formato = formato.dataset.formato;
      montarFormatos();
      aplicarEdicao();
      return;
    }

    var filtro = alvo.closest('[data-filtro]');
    if (filtro) {
      estado.filtro = filtro.dataset.filtro;
      montarFiltros();
      aplicarEdicao();
      return;
    }

    var rede = alvo.closest('[data-rede]');
    if (rede) {
      confirmarCompartilhamento(rede.dataset.rede);
      return;
    }

    var voltar = alvo.closest('[data-voltar]');
    if (voltar) {
      mostrarTela(estado.origemEditor);
      return;
    }

    var tela = alvo.closest('[data-tela]');
    if (tela) {
      mostrarTela(tela.dataset.tela);
    }
  });
});

/* Liga e desliga os recursos da barra de cima da câmera. */
function usarFerramenta(botao) {
  var nome = botao.dataset.ferramenta;

  if (nome === 'grade') {
    estado.grade = !estado.grade;
    botao.classList.toggle('ativa', estado.grade);
    elemento('camGrade').classList.toggle('ativa', estado.grade);
    mostrarAviso(estado.grade ? 'Grade 3x3 ligada' : 'Grade 3x3 desligada');
    return;
  }

  if (nome === 'flash') {
    estado.flash = !estado.flash;
    botao.classList.toggle('ativa', estado.flash);
    mostrarAviso(estado.flash ? 'Flash automático' : 'Flash desligado');
    return;
  }

  if (nome === 'zeiss') {
    estado.zeiss = !estado.zeiss;
    botao.classList.toggle('ativa', estado.zeiss);
    mostrarAviso(estado.zeiss ? 'Lente ZEISS ativada' : 'Lente ZEISS desativada');
    return;
  }

  if (nome === 'proporcao') {
    var atual = elemento('camProporcao');
    atual.textContent = (atual.textContent === '4:3') ? '1:1' : '4:3';
    mostrarAviso('Proporção da foto: ' + atual.textContent);
    return;
  }

  if (nome === 'temporizador') {
    var tempos = [0, 3, 10];
    estado.temporizador = tempos[(tempos.indexOf(estado.temporizador) + 1) % tempos.length];
    botao.classList.toggle('ativa', estado.temporizador > 0);
    mostrarAviso(estado.temporizador === 0
      ? 'Temporizador desligado'
      : 'Temporizador de ' + estado.temporizador + ' s');
    return;
  }

  mostrarAviso('Ajustes avançados ficam no app nativo do V70');
}
