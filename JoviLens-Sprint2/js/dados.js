/* =========================================================
   JOVI Lens - dados da aplicação
   Tudo o que a interface mostra sai daqui. Assim o app.js
   cuida só da interação e não fica com texto solto no meio.
   ========================================================= */

/* Cenas que a câmera "enxerga". Cada uma tem uma leitura
   diferente da IA e um modo recomendado. */
var cenas = [
  {
    id: 'sala',
    imagem: 'img/cena-sala.jpg',
    alt: 'Sala de estar à noite com luz baixa',
    local: 'Sala de estar',
    cidade: 'São Paulo, SP',
    deteccao: 'Pouca luz',
    sugestao: 'sugiro Modo Noite',
    modo: 'Noite',
    rotulo: 'Modo Noite',
    aviso: 'capture com firmeza',
    analise: 'Cena interna com pouca luz. As sombras foram recuperadas e o ruído caiu bastante com o Modo Noite.',
    ganhos: [
      { rotulo: 'Redução de ruído', valor: 38 },
      { rotulo: 'Ganho de luz', valor: 52 }
    ],
    recursos: 'Modo Noite · HDR · Anti-ruído',
    dica: 'Da próxima vez, tente o Modo Retrato Tele 85mm para retratos com fundo desfocado profissional.'
  },
  {
    id: 'retrato',
    imagem: 'img/cena-retrato.jpg',
    alt: 'Retrato de uma pessoa com o fundo desfocado',
    local: 'Estúdio',
    cidade: 'São Paulo, SP',
    deteccao: 'Rosto detectado',
    sugestao: 'sugiro Modo Retrato',
    modo: 'Retrato',
    rotulo: 'Modo Retrato',
    aviso: 'ZEISS Sonnar 85mm',
    analise: 'Um rosto foi identificado no centro do quadro. O desfoque de fundo foi calculado pela lente ZEISS 85mm.',
    ganhos: [
      { rotulo: 'Separação do fundo', valor: 71 },
      { rotulo: 'Tom de pele', valor: 44 }
    ],
    recursos: 'Modo Retrato · ZEISS 85mm · Pele natural',
    dica: 'Para grupos, experimente a distância focal de 35mm: cabe mais gente sem distorcer os rostos.'
  },
  {
    id: 'comida',
    imagem: 'img/cena-comida.jpg',
    alt: 'Mesa de jantar servida com velas acesas',
    local: 'Jantar de domingo',
    cidade: 'São Paulo, SP',
    deteccao: 'Comida na mesa',
    sugestao: 'sugiro Modo Comida',
    modo: 'Comida',
    rotulo: 'Modo Comida',
    aviso: 'realce de cor ativo',
    analise: 'Mesa posta com luz quente de velas. As cores dos pratos foram realçadas sem estourar o branco da louça.',
    ganhos: [
      { rotulo: 'Realce de cor', valor: 46 },
      { rotulo: 'Equilíbrio de branco', valor: 33 }
    ],
    recursos: 'Modo Comida · Realce de cor · HDR',
    dica: 'Aproxime um pouco e use o zoom 2x: o prato ganha destaque e o fundo some naturalmente.'
  },
  {
    id: 'porsol',
    imagem: 'img/cena-porsol.jpg',
    alt: 'Pôr do sol sobre montanhas com céu alaranjado',
    local: 'Mirante',
    cidade: 'Campos do Jordão, SP',
    deteccao: 'Contraluz forte',
    sugestao: 'sugiro HDR automático',
    modo: 'Foto',
    rotulo: 'HDR automático',
    aviso: 'várias exposições em uma foto',
    analise: 'Cena de contraluz com grande diferença entre céu e sombra. O HDR juntou várias exposições em uma foto só.',
    ganhos: [
      { rotulo: 'Faixa dinâmica', valor: 64 },
      { rotulo: 'Detalhe no céu', valor: 58 }
    ],
    recursos: 'HDR automático · Céu vivo · Anti-flare',
    dica: 'Na hora dourada, o zoom .6x abre o enquadramento e deixa o céu ainda mais presente.'
  },
  {
    id: 'show',
    imagem: 'img/cena-show.jpg',
    alt: 'Público de um show com luzes amarelas no palco',
    local: 'Show no Ibirapuera',
    cidade: 'São Paulo, SP',
    deteccao: 'Palco iluminado',
    sugestao: 'sugiro Modo Palco',
    modo: 'Palco',
    rotulo: 'Modo Palco',
    aviso: 'congelando o movimento',
    analise: 'Luzes fortes e público em movimento. A velocidade do obturador subiu para congelar a cena sem tremer.',
    ganhos: [
      { rotulo: 'Nitidez em movimento', valor: 67 },
      { rotulo: 'Controle de luz forte', valor: 49 }
    ],
    recursos: 'Modo Palco · Anti-tremor · Luz forte',
    dica: 'Em shows, segure o celular com as duas mãos e deixe o Modo Palco cuidar do resto.'
  }
];

/* Modos da régua da câmera. "Mais" abre os modos extras. */
var modos = ['Noite', 'Retrato', 'Foto', 'Vídeo', 'Microfilme', 'Mais'];
var modosExtras = ['Comida', 'Palco', 'Pro', 'Panorâmica', 'Alta Resolução', 'Astro'];

/* Quanto a imagem do visor cresce em cada nível de zoom.
   O .6x é o enquadramento mais aberto que ainda preenche a tela. */
var escalaDoZoom = {
  '0.6': 1,
  '1': 1.25,
  '2': 2.2
};

/* Efeito que cada modo aplica na imagem do visor. */
var efeitoDoModo = {
  'Noite': 'brightness(1.28) saturate(1.12)',
  'Retrato': 'contrast(1.06) saturate(1.04)',
  'Foto': 'none',
  'Vídeo': 'none',
  'Microfilme': 'contrast(1.12) saturate(0.9)',
  'Comida': 'saturate(1.28) brightness(1.08)',
  'Palco': 'contrast(1.16) saturate(1.22) brightness(1.04)',
  'Pro': 'none',
  'Panorâmica': 'none',
  'Alta Resolução': 'none',
  'Astro': 'brightness(1.2) contrast(1.1)'
};

/* Momentos que a Smart Gallery monta sozinha.
   O campo "busca" guarda as palavras que a busca aceita. */
var momentos = [
  {
    id: 'sala',
    cena: 0,
    nome: 'Sala de estar',
    emoji: '🛋️',
    periodo: 'Hoje · noite',
    categoria: 'Lugares',
    modo: 'Modo Noite',
    local: 'São Paulo, SP',
    total: 3,
    busca: 'sala estar casa noite escuro sofá ambiente interno',
    fotos: ['img/cena-sala.jpg', 'img/sala-2.jpg', 'img/sala-3.jpg']
  },
  {
    id: 'retratos',
    cena: 1,
    nome: 'Retratos',
    emoji: '👤',
    periodo: 'Esta semana',
    categoria: 'Pessoas',
    modo: 'Modo Retrato',
    local: 'São Paulo, SP',
    total: 6,
    busca: 'retrato pessoa rosto gente amigos zeiss 85mm',
    fotos: ['img/cena-retrato.jpg', 'img/retrato-2.jpg']
  },
  {
    id: 'porsol',
    cena: 3,
    nome: 'Pôr do sol',
    emoji: '🌅',
    periodo: 'Esta semana',
    categoria: 'Lugares',
    modo: 'Paisagem',
    local: 'Campos do Jordão, SP',
    total: 8,
    busca: 'pôr do sol paisagem montanha praia céu viagem hdr',
    fotos: ['img/cena-porsol.jpg', 'img/porsol-2.jpg', 'img/porsol-3.jpg']
  },
  {
    id: 'jantar',
    cena: 2,
    nome: 'Jantar de domingo',
    emoji: '🍝',
    periodo: 'Esta semana',
    categoria: 'Comida',
    modo: 'Modo Comida',
    local: 'São Paulo, SP',
    total: 12,
    busca: 'comida jantar almoço mesa prato restaurante família',
    fotos: ['img/cena-comida.jpg', 'img/comida-2.jpg', 'img/comida-3.jpg']
  },
  {
    id: 'show',
    cena: 4,
    nome: 'Show no Ibirapuera',
    emoji: '🎤',
    periodo: 'Mês passado',
    categoria: 'Eventos',
    modo: 'Modo Palco',
    local: 'São Paulo, SP',
    total: 15,
    busca: 'show música palco festival luzes banda evento',
    fotos: ['img/cena-show.jpg', 'img/show-2.jpg']
  },
  {
    id: 'aniversario',
    cena: 1,
    nome: 'Aniversário da Maria',
    emoji: '🎉',
    periodo: 'Mês passado',
    categoria: 'Eventos',
    modo: 'Modo Retrato',
    local: 'Santo André, SP',
    total: 24,
    busca: 'aniversário festa bolo vela comemoração maria',
    fotos: ['img/festa-1.jpg', 'img/festa-2.jpg']
  }
];

var categorias = ['Tudo', 'Pessoas', 'Lugares', 'Comida', 'Eventos'];

/* Filtros do Share Studio. */
var filtros = [
  { id: 'original', nome: 'Original', efeito: 'none' },
  { id: 'aconchego', nome: 'Aconchego', efeito: 'saturate(1.2) brightness(1.08) sepia(0.18)' },
  { id: 'cinema', nome: 'Cinema', efeito: 'saturate(1.1) hue-rotate(12deg) contrast(1.12) brightness(0.94)' },
  { id: 'vintage', nome: 'Vintage', efeito: 'sepia(0.4) saturate(1.2) contrast(1.05)' },
  { id: 'vivo', nome: 'Vivo', efeito: 'saturate(1.6) contrast(1.15)' },
  { id: 'pb', nome: 'P&B', efeito: 'grayscale(1) contrast(1.12)' }
];

/* Formatos de recorte, com a proporção que a moldura assume. */
var formatos = [
  { id: 'feed', nome: 'Feed', proporcao: '1 / 1', rotulo: '1:1 · FEED' },
  { id: 'retrato', nome: 'Retrato', proporcao: '4 / 5', rotulo: '4:5 · RETRATO' },
  { id: 'stories', nome: 'Stories', proporcao: '9 / 16', rotulo: '9:16 · STORIES' },
  { id: 'paisagem', nome: 'Paisagem', proporcao: '16 / 9', rotulo: '16:9 · PAISAGEM' }
];

/* Redes do modal de compartilhamento. */
var redes = [
  { nome: 'Instagram', inicial: 'IG', cor: '#C13584' },
  { nome: 'WhatsApp', inicial: 'WA', cor: '#25D366' },
  { nome: 'TikTok', inicial: 'TT', cor: '#3A3A3A' },
  { nome: 'Salvar', inicial: '↓', cor: '#2C5DE8' }
];
