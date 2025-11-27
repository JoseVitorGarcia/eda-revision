import {
  closestCenter,
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GripVertical,
  RefreshCw,
  Trophy,
  XCircle,
} from "lucide-react";
import React, { useState } from "react";

// --- 0. ESTILOS GLOBAIS E COMPONENTES (CSS INJETADO MANUALMENTE) ---
// Recriamos o visual "Premium Dark" manualmente para não depender de Tailwind externo
const GlobalStyles = () => (
  <style>{`
    :root {
      --bg-app: #020617;       /* Slate 950 - Fundo da página */
      --bg-card: #0f172a;      /* Slate 900 - Fundo dos cards */
      --bg-element: #1e293b;   /* Slate 800 - Fundo de itens/inputs */
      --border: #334155;       /* Slate 700 - Bordas */
      --primary: #2563eb;      /* Blue 600 - Botões/Destaques */
      --primary-hover: #1d4ed8;
      --text-main: #f8fafc;    /* Slate 50 */
      --text-muted: #94a3b8;   /* Slate 400 */
      --success-bg: rgba(20, 83, 45, 0.3);
      --success-border: #22c55e;
      --error-bg: rgba(127, 29, 29, 0.3);
      --error-border: #ef4444;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }

    body, html {
      height: 100%;
      background-color: var(--bg-app);
      color: var(--text-main);
      overflow-x: hidden;
    }

    #root {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center; /* CENTRALIZA O APP NA TELA */
      padding: 20px;
    }

    /* Layout Containers */
    .app-container {
      width: 100%;
      max-width: 800px; /* Largura similar à da imagem */
      display: flex;
      flex-direction: column;
      gap: 24px;
      animation: fadeIn 0.5s ease-out;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--text-muted);
      margin-bottom: 10px;
    }

    /* Cards */
    .card {
      background-color: var(--bg-card);
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }

    .card-title {
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1.4;
      margin-bottom: 24px;
      color: white;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
      margin-right: 8px;
    }
    .badge-blue { background: rgba(59, 130, 246, 0.1); color: #60a5fa; }
    .badge-purple { background: rgba(168, 85, 247, 0.1); color: #c084fc; }
    .badge-green { background: rgba(34, 197, 94, 0.1); color: #4ade80; }
    .badge-gray { background: rgba(148, 163, 184, 0.1); color: #94a3b8; }

    /* Quiz Options */
    .option-btn {
      width: 100%;
      text-align: left;
      padding: 16px 20px;
      margin-bottom: 12px;
      border-radius: 12px;
      background-color: var(--bg-app); /* Fundo mais escuro que o card */
      border: 1px solid #1e293b;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 1rem;
    }
    .option-btn:hover:not(:disabled) {
      border-color: var(--primary);
      background-color: #1e293b;
      color: white;
    }
    .option-btn.selected {
      border-color: var(--primary);
      background-color: rgba(37, 99, 235, 0.1);
      color: #93c5fd;
    }
    .option-btn.correct {
      border-color: var(--success-border);
      background-color: var(--success-bg);
      color: #4ade80;
    }
    .option-btn.incorrect {
      border-color: var(--error-border);
      background-color: var(--error-bg);
      color: #f87171;
    }

    /* Drag & Drop Items (Code Blocks) */
    .code-item {
      background-color: #0b1120; /* Muito escuro para parecer terminal */
      border: 1px solid #1e293b;
      padding: 16px;
      margin-bottom: 12px;
      border-radius: 8px;
      font-family: 'Fira Code', monospace;
      font-size: 0.9rem;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: grab;
      transition: transform 0.2s, border-color 0.2s;
    }
    .code-item:hover {
      border-color: #475569;
    }
    .code-item:active {
      cursor: grabbing;
    }
    .code-item.dragging {
      border-color: var(--primary);
      box-shadow: 0 0 15px rgba(37, 99, 235, 0.3);
      z-index: 100;
    }

    /* Buttons */
    .btn-primary {
      width: 100%;
      padding: 16px;
      background-color: var(--primary);
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;
      margin-top: 20px;
    }
    .btn-primary:hover {
      background-color: var(--primary-hover);
    }

    /* Feedback Card */
    .feedback-card {
      margin-top: 24px;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid;
      animation: slideUp 0.4s ease-out;
    }
    .feedback-correct {
      background-color: rgba(20, 83, 45, 0.2);
      border-color: rgba(34, 197, 94, 0.3);
    }
    .feedback-incorrect {
      background-color: rgba(127, 29, 29, 0.2);
      border-color: rgba(239, 68, 68, 0.3);
    }
    
    .feedback-header {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 16px;
    }
    .text-green { color: #4ade80; }
    .text-red { color: #f87171; }

    .terminal-view {
      background-color: #020617;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      font-family: monospace;
      font-size: 0.85rem;
    }
    .terminal-line {
      border-left: 2px solid #22c55e;
      padding-left: 10px;
      color: #86efac;
      margin-bottom: 4px;
    }

    .footer-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    
    .next-btn {
      background-color: #f1f5f9;
      color: #0f172a;
      border: none;
      padding: 10px 24px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .next-btn:hover { background-color: white; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `}</style>
);

// --- 1. DEFINIÇÃO DE TIPOS ---
export type QuestionType = "quiz" | "drag-drop";

export interface Question {
  id: number;
  type: QuestionType;
  category: "Grafos" | "Árvores" | "Hash" | "Algoritmos" | "Geral";
  title: string;
  enunciation: string;
  options?: string[];
  correctOptionIndex?: number;
  codeLines?: string[];
  explanation: string;
  sourceRef: string;
}

// --- 2. BANCO DE DADOS (QUESTÕES) ---
const questions: Question[] = [
  {
    id: 10,
    type: "drag-drop",
    category: "Hash",
    title: "Inserção Hash",
    enunciation:
      "Ordene a lógica para inserir em uma HashTable com encadeamento.",
    codeLines: [
      "const index = this.hashFunction(key);",
      "if (!this.table[index]) {",
      "   this.table[index] = [];",
      "}",
      "this.table[index].push({key, value});",
    ],
    explanation:
      "Calcula-se o índice. Se não existir lista lá, cria-se uma. Adiciona-se o par chave-valor na lista.",
    sourceRef: "EDA - REVISAO.pdf (Questão 10)",
  },
  {
    id: 3,
    type: "drag-drop",
    category: "Árvores",
    title: "Lógica: Contar Nós",
    enunciation:
      "Ordene a lógica recursiva para contar nós em uma árvore binária.",
    codeLines: [
      "if (node == null) return 0;",
      "let leftCount = contarNos(node.left);",
      "let rightCount = contarNos(node.right);",
      "return 1 + leftCount + rightCount;",
    ],
    explanation:
      "A contagem soma 1 (o nó atual) com o resultado recursivo dos filhos da esquerda e direita.",
    sourceRef: "EDA - REVISAO.pdf (Questão 7)",
  },
  {
    id: 1,
    type: "quiz",
    category: "Árvores",
    title: "Conceito AVL",
    enunciation:
      "Qual é a principal característica estrutural que diferencia uma árvore AVL de uma BST comum?",
    options: [
      "Permite chaves duplicadas na subárvore esquerda.",
      "É uma árvore estritamente balanceada baseada no Fator de Balanceamento.",
      "Não utiliza recursão para inserção.",
      "Possui mais de dois filhos por nó.",
    ],
    correctOptionIndex: 1,
    explanation:
      "A árvore AVL é uma árvore binária de busca balanceada onde a diferença de altura entre subárvores esquerda e direita é no máximo 1.",
    sourceRef: "EDA - REVISAO.pdf (Questão 1)",
  },
  {
    id: 23,
    type: "drag-drop",
    category: "Grafos",
    title: "Matriz de Adjacência",
    enunciation:
      "Ordene a lógica para preencher uma Matriz de Adjacência de um grafo não ponderado.",
    codeLines: [
      "// Inicializa matriz N x N com zeros",
      "let matrix = Array(n).fill().map(() => Array(n).fill(0));",
      "for (let [u, v] of arestas) {",
      "   matrix[u][v] = 1;",
      "   matrix[v][u] = 1; // Se não direcionado",
      "}",
    ],
    explanation:
      "Se existe aresta entre U e V, marcamos matrix[u][v] como 1. Se não direcionado, marcamos também a volta.",
    sourceRef: "Aula 12 - EDA.pdf",
  },
  {
    id: 2,
    type: "quiz",
    category: "Árvores",
    title: "Fator de Balanceamento",
    enunciation:
      "Como é calculado o Fator de Balanceamento (FB) em uma AVL e quais valores são aceitáveis?",
    options: [
      "FB = AlturaEsquerda + AlturaDireita; Aceitável: qualquer valor positivo.",
      "FB = AlturaEsquerda - AlturaDireita; Aceitável: -1, 0, 1.",
      "FB = NósEsquerda - NósDireita; Aceitável: -2, 0, 2.",
      "FB = AlturaRaiz - AlturaFolha; Aceitável: 0 apenas.",
    ],
    correctOptionIndex: 1,
    explanation:
      "O fator de balanceamento é a altura da subárvore esquerda menos a da direita. Para ser AVL, deve ser -1, 0 ou 1.",
    sourceRef: "EDA - REVISAO.pdf (Questão 4)",
  },
  {
    id: 4,
    type: "drag-drop",
    category: "Árvores",
    title: "Lógica: Altura da Árvore",
    enunciation: "Ordene a lógica para calcular a altura de uma árvore.",
    codeLines: [
      "if (node == null) return 0;",
      "let hLeft = altura(node.left);",
      "let hRight = altura(node.right);",
      "if (hLeft > hRight) return hLeft + 1;",
      "else return hRight + 1;",
    ],
    explanation:
      "A altura é definida pelo maior caminho até uma folha, então pegamos o máximo entre esquerda e direita e somamos 1.",
    sourceRef: "EDA - REVISAO.pdf (Questão 8)",
  },
  {
    id: 5,
    type: "quiz",
    category: "Grafos",
    title: "BFS vs DFS",
    enunciation:
      "Qual a principal diferença na ordem de exploração entre BFS (Largura) e DFS (Profundidade)?",
    options: [
      "BFS explora nível a nível; DFS vai o mais fundo possível num ramo antes de voltar.",
      "DFS usa fila; BFS usa pilha.",
      "BFS é apenas para grafos ponderados; DFS para não ponderados.",
      "Não há diferença, depende apenas da implementação da lista de adjacência.",
    ],
    correctOptionIndex: 0,
    explanation:
      "BFS (Breadth-First Search) usa fila para visitar vizinhos em camadas. DFS (Depth-First Search) usa pilha (ou recursão) para ir ao fundo do grafo.",
    sourceRef: "EDA - REVISAO.pdf (Questão 3)",
  },
  {
    id: 6,
    type: "quiz",
    category: "Grafos",
    title: "Representação de Grafos",
    enunciation:
      "Em um grafo DENSO (muitas arestas), qual representação é geralmente mais eficiente em espaço e verificação de arestas?",
    options: [
      "Lista de Adjacência",
      "Matriz de Adjacência",
      "Árvore B",
      "Tabela Hash",
    ],
    correctOptionIndex: 1,
    explanation:
      "Para grafos densos (E próximo de V²), a Matriz de Adjacência é preferível pois o custo de espaço é fixo e o acesso à aresta é O(1).",
    sourceRef: "Aula 12 - EDA.pdf",
  },
  {
    id: 7,
    type: "quiz",
    category: "Grafos",
    title: "Grafo Bipartido",
    enunciation: "O que caracteriza um grafo Bipartido?",
    options: [
      "Possui ciclos de tamanho ímpar.",
      "Seus vértices podem ser divididos em dois grupos disjuntos sem arestas internas no mesmo grupo.",
      "Todos os vértices têm grau 2.",
      "É um grafo onde as arestas têm dois pesos.",
    ],
    correctOptionIndex: 1,
    explanation:
      "Um grafo é bipartido se V pode ser particionado em V1 e V2 tal que todas as arestas conectam um vértice de V1 a um de V2.",
    sourceRef: "Aula 12 - EDA.pdf",
  },
  {
    id: 8,
    type: "quiz",
    category: "Algoritmos",
    title: "Restrição do Dijkstra",
    enunciation:
      "Por que o algoritmo de Dijkstra não funciona corretamente com arestas de peso negativo?",
    options: [
      "Porque ele entra em loop infinito.",
      "Porque ele assume que adicionar uma aresta sempre aumenta o custo total (ganância).",
      "Porque ele usa uma pilha em vez de fila de prioridade.",
      "Ele funciona, apenas é mais lento.",
    ],
    correctOptionIndex: 1,
    explanation:
      'Dijkstra é guloso ("greedy"). Se houver pesos negativos, a premissa de que o caminho "fechado" é o menor pode ser violada posteriormente.',
    sourceRef: "Aula 11 - EDA.pdf",
  },
  {
    id: 9,
    type: "quiz",
    category: "Algoritmos",
    title: "Uso do Bellman-Ford",
    enunciation: "Qual a principal vantagem do Bellman-Ford sobre o Dijkstra?",
    options: [
      "É mais rápido (O(V+E)).",
      "Funciona com pesos negativos e detecta ciclos negativos.",
      "Usa menos memória.",
      "Gera a Árvore Geradora Mínima.",
    ],
    correctOptionIndex: 1,
    explanation:
      "Bellman-Ford relaxa todas as arestas V-1 vezes, permitindo acomodar reduções de custo por arestas negativas e detectar ciclos negativos.",
    sourceRef: "Algoritmos eda.txt",
  },
  {
    id: 10,
    type: "drag-drop",
    category: "Algoritmos",
    title: "Lógica: Dijkstra (Relaxamento)",
    enunciation:
      "Ordene a lógica de relaxamento de uma aresta (u, v) no Dijkstra.",
    codeLines: [
      "let distanciaCalculada = dist[u] + w;",
      "if (distanciaCalculada < dist[v]) {",
      "   dist[v] = distanciaCalculada;",
      "   parent[v] = u;",
      "}",
    ],
    explanation:
      'Se a distância até V passando por U for menor que a distância que eu já conhecia para V, atualizo o valor e o "pai".',
    sourceRef: "Algoritmos eda.txt (Função Dijkstra)",
  },
  {
    id: 11,
    type: "drag-drop",
    category: "Algoritmos",
    title: "Lógica: Bellman-Ford (Ciclo Negativo)",
    enunciation: "Ordene a verificação de ciclo negativo no Bellman-Ford.",
    codeLines: [
      "for (let [u, v, w] of arestas) {",
      "   if (dist[u] + w < dist[v]) {",
      '      console.log("Ciclo negativo detectado!");',
      "      return;",
      "   }",
      "}",
    ],
    explanation:
      "Após relaxar V-1 vezes, se ainda for possível relaxar alguma aresta, existe um ciclo negativo acessível.",
    sourceRef: "Algoritmos eda.txt (Bellman-Ford)",
  },
  {
    id: 12,
    type: "quiz",
    category: "Algoritmos",
    title: "Cenário: Logística",
    enunciation:
      "Uma empresa de logística tem rotas com custos fixos (sempre positivos). Qual algoritmo escolher para calcular rotas a partir de um depósito central?",
    options: ["Bellman-Ford", "Dijkstra", "Floyd-Warshall", "Kruskal"],
    correctOptionIndex: 1,
    explanation:
      "Como os pesos são estritamente positivos e queremos a partir de uma fonte única (depósito), Dijkstra é o mais eficiente.",
    sourceRef: "EDA - REVISAO.pdf (Questão 12)",
  },
  {
    id: 13,
    type: "quiz",
    category: "Algoritmos",
    title: "Prim vs Kruskal (Denso)",
    enunciation:
      "Para um grafo DENSO (muitas arestas), qual algoritmo de MST é preferível?",
    options: [
      "Kruskal",
      "Prim",
      "Ambos têm desempenho idêntico sempre.",
      "Nenhum, usa-se Dijkstra.",
    ],
    correctOptionIndex: 1,
    explanation:
      "Prim cresce a partir de vértices. Em grafos densos, evita a ordenação de uma quantidade massiva de arestas que o Kruskal exigiria.",
    sourceRef: "EDA - REVISAO.pdf (Questão 14)",
  },
  {
    id: 14,
    type: "drag-drop",
    category: "Algoritmos",
    title: "Lógica: Algoritmo de Kruskal",
    enunciation: "Ordene os passos principais do Algoritmo de Kruskal.",
    codeLines: [
      "Ordene todas as arestas por peso crescente.",
      "Inicialize conjuntos disjuntos (Union-Find) para cada vértice.",
      "Para cada aresta (u, v):",
      "Se find(u) != find(v):",
      "   Adicione aresta na MST e faça union(u, v).",
    ],
    explanation:
      "Kruskal é baseado em arestas: pega a menor globalmente, verifica se conecta componentes diferentes (evita ciclo) e une.",
    sourceRef: "Algoritmos eda.txt (Kruskal)",
  },
  {
    id: 15,
    type: "drag-drop",
    category: "Algoritmos",
    title: "Lógica: Algoritmo de Prim",
    enunciation: "Ordene a lógica básica do Algoritmo de Prim.",
    codeLines: [
      "Inicie com um vértice arbitrário na MST.",
      "Use uma lista/heap para arestas da fronteira.",
      "Enquanto MST não tiver todos os vértices:",
      "   Escolha aresta de menor peso conectando MST a um vértice fora.",
      "   Adicione vértice à MST e atualize custos dos vizinhos.",
    ],
    explanation:
      'Prim expande a árvore "gulosamente" sempre pegando o vizinho mais próximo da árvore atual.',
    sourceRef: "Algoritmos eda.txt (Prim)",
  },
  {
    id: 16,
    type: "quiz",
    category: "Algoritmos",
    title: "Union-Find",
    enunciation:
      "Qual estrutura de dados auxiliar é essencial para a eficiência do algoritmo de Kruskal?",
    options: [
      "Pilha (Stack)",
      "Union-Find (Disjoint Set)",
      "Matriz de Adjacência",
      "Tabela Hash",
    ],
    correctOptionIndex: 1,
    explanation:
      "Union-Find permite verificar ciclos e unir componentes conexos de forma quase constante, essencial para o Kruskal.",
    sourceRef: "Algoritmos eda.txt",
  },
  {
    id: 17,
    type: "quiz",
    category: "Hash",
    title: "Colisão em Hash",
    enunciation:
      'O que é "Encadeamento Exterior" (Separate Chaining) no tratamento de colisões?',
    options: [
      "Procurar o próximo slot vazio na matriz.",
      "Criar uma lista encadeada (ou outra estrutura) em cada posição da tabela.",
      "Redimensionar a tabela imediatamente.",
      "Usar uma segunda função hash.",
    ],
    correctOptionIndex: 1,
    explanation:
      'Separate Chaining mantém uma lista de elementos que caíram no mesmo índice, permitindo múltiplos valores por "bucket".',
    sourceRef: "EDA - REVISAO.pdf (Questão 5)",
  },
  {
    id: 18,
    type: "drag-drop",
    category: "Hash",
    title: "Implementação: Hash Set",
    enunciation:
      "Ordene a lógica para inserir em uma HashTable com encadeamento.",
    codeLines: [
      "const index = this.hashFunction(key);",
      "if (!this.table[index]) {",
      "   this.table[index] = [];",
      "}",
      "this.table[index].push({key, value});",
    ],
    explanation:
      "Calcula-se o índice. Se não existir lista lá, cria-se uma. Adiciona-se o par chave-valor na lista.",
    sourceRef: "EDA - REVISAO.pdf (Questão 10)",
  },
  {
    id: 19,
    type: "quiz",
    category: "Grafos",
    title: "Grafo Cíclico",
    enunciation: "O que define um Grafo Cíclico?",
    options: [
      "Possui arestas com pesos negativos.",
      "É possível partir de um vértice e retornar a ele percorrendo arestas.",
      "Não possui direção nas arestas.",
      "Todos os vértices estão conectados.",
    ],
    correctOptionIndex: 1,
    explanation:
      "Um ciclo é um caminho fechado onde o vértice inicial é igual ao final.",
    sourceRef: "Aula 12 - EDA.pdf",
  },
  {
    id: 20,
    type: "quiz",
    category: "Grafos",
    title: "Grafo Ponderado",
    enunciation: "O que é um grafo ponderado?",
    options: [
      "Um grafo onde as arestas têm pesos/custos associados.",
      "Um grafo com muitas arestas.",
      "Um grafo onde os vértices têm nomes.",
      "Um grafo dirigido.",
    ],
    correctOptionIndex: 0,
    explanation:
      "Grafos ponderados associam valores (distância, custo, tempo) às suas arestas.",
    sourceRef: "Aula 12 - EDA.pdf",
  },
  {
    id: 21,
    type: "quiz",
    category: "Árvores",
    title: "Percurso em Árvore",
    enunciation: "Qual a ordem de visita no percurso Pós-Ordem?",
    options: [
      "Raiz -> Esquerda -> Direita",
      "Esquerda -> Raiz -> Direita",
      "Esquerda -> Direita -> Raiz",
      "Nível por Nível",
    ],
    correctOptionIndex: 2,
    explanation:
      "Pós-ordem visita os filhos primeiro (Esquerda, depois Direita) e por último a Raiz.",
    sourceRef: "EDA - REVISAO.pdf",
  },
  {
    id: 22,
    type: "quiz",
    category: "Algoritmos",
    title: "Complexidade BFS/DFS",
    enunciation:
      "Qual a complexidade temporal típica de BFS e DFS usando Lista de Adjacência?",
    options: ["O(V * E)", "O(V + E)", "O(V^2)", "O(log V)"],
    correctOptionIndex: 1,
    explanation:
      "Visitamos cada vértice (V) e cada aresta (E) uma vez no pior caso.",
    sourceRef: "Aula 12 - EDA.pdf",
  },
  {
    id: 23,
    type: "drag-drop",
    category: "Grafos",
    title: "Matriz de Adjacência",
    enunciation:
      "Ordene a lógica para preencher uma Matriz de Adjacência de um grafo não ponderado.",
    codeLines: [
      "// Inicializa matriz N x N com zeros",
      "let matrix = Array(n).fill().map(() => Array(n).fill(0));",
      "for (let [u, v] of arestas) {",
      "   matrix[u][v] = 1;",
      "   matrix[v][u] = 1; // Se não direcionado",
      "}",
    ],
    explanation:
      "Se existe aresta entre U e V, marcamos matrix[u][v] como 1. Se não direcionado, marcamos também a volta.",
    sourceRef: "Aula 12 - EDA.pdf",
  },
  {
    id: 24,
    type: "quiz",
    category: "Algoritmos",
    title: "Floyd-Warshall",
    enunciation: "Para que serve o algoritmo de Floyd-Warshall?",
    options: [
      "Caminho mínimo de uma fonte única.",
      "Árvore Geradora Mínima.",
      "Caminho mínimo entre TODOS os pares de vértices.",
      "Busca topológica.",
    ],
    correctOptionIndex: 2,
    explanation:
      "Floyd-Warshall calcula as distâncias mais curtas entre todos os pares de nós em O(V^3).",
    sourceRef: "EDA - REVISAO.pdf (Questão 20 citada indiretamente)",
  },
  {
    id: 25,
    type: "quiz",
    category: "Grafos",
    title: "Grafo Conexo",
    enunciation: "O que é um grafo conexo?",
    options: [
      "Um grafo sem ciclos.",
      "Um grafo onde existe um caminho entre qualquer par de vértices.",
      "Um grafo completo.",
      "Um grafo com pesos positivos.",
    ],
    correctOptionIndex: 1,
    explanation:
      "Em um grafo conexo não há vértices isolados; é possível chegar de A a B para quaisquer A e B.",
    sourceRef: "Aula 11 - EDA.pdf",
  },
  {
    id: 26,
    type: "drag-drop",
    category: "Algoritmos",
    title: "Inicialização Dijkstra",
    enunciation: "Como inicializamos as estruturas de dados no Dijkstra?",
    codeLines: [
      "const dist = {};",
      "const visited = new Set();",
      "for (let v of vertices) dist[v] = Infinity;",
      "dist[startNode] = 0;",
      "queue.push([startNode, 0]);",
    ],
    explanation:
      "Todas as distâncias começam como Infinito, exceto a origem que é 0. Colocamos a origem na fila de prioridade.",
    sourceRef: "Algoritmos eda.txt",
  },
  {
    id: 27,
    type: "quiz",
    category: "Hash",
    title: "Endereçamento Aberto",
    enunciation:
      "Qual destas é uma técnica de sondagem no Endereçamento Aberto?",
    options: [
      "Sondagem Linear",
      "Lista Encadeada",
      "Árvore Rubro-Negra",
      "Heap Binário",
    ],
    correctOptionIndex: 0,
    explanation:
      "Sondagem Linear verifica o índice i, depois i+1, i+2... até achar espaço livre.",
    sourceRef: "EDA - REVISAO.pdf",
  },
  {
    id: 28,
    type: "quiz",
    category: "Árvores",
    title: "B-Tree",
    enunciation: "Qual a principal aplicação de B-Trees?",
    options: [
      "Compiladores.",
      "Sistemas de Arquivos e Bancos de Dados (armazenamento em disco).",
      "Renderização 3D.",
      "Roteamento de rede.",
    ],
    correctOptionIndex: 1,
    explanation:
      "B-Trees minimizam operações de I/O em disco pois possuem muitos filhos por nó, reduzindo a altura da árvore.",
    sourceRef: "EDA - REVISAO.pdf (Questão 1)",
  },
  {
    id: 29,
    type: "drag-drop",
    category: "Algoritmos",
    title: "Union-Find: Find",
    enunciation: "Monte a função Find com compressão de caminho.",
    codeLines: [
      "function find(i) {",
      "   if (parent[i] == i)",
      "      return i;",
      "   parent[i] = find(parent[i]);",
      "   return parent[i];",
      "}",
    ],
    explanation:
      "A compressão de caminho faz com que nós apontem diretamente para a raiz do conjunto, acelerando buscas futuras.",
    sourceRef: "Algoritmos eda.txt",
  },
  {
    id: 30,
    type: "quiz",
    category: "Geral",
    title: "Complexidade de Espaço",
    enunciation: "Qual a complexidade de espaço de uma Lista de Adjacência?",
    options: ["O(V^2)", "O(V + E)", "O(1)", "O(E^2)"],
    correctOptionIndex: 1,
    explanation:
      "Armazenamos uma lista para cada Vértice, contendo suas Arestas.",
    sourceRef: "Aula 12 - EDA.pdf",
  },
];

// --- 3. COMPONENTES UI ---

const QuizOption: React.FC<{
  text: string;
  selected: boolean;
  isCorrect: boolean | null;
  isAnswered: boolean;
  onClick: () => void;
}> = ({ text, selected, isCorrect, isAnswered, onClick }) => {
  let className = "option-btn";
  if (isAnswered) {
    if (selected) {
      className += isCorrect ? " correct" : " incorrect";
    } else {
      // Opções não selecionadas ficam apagadas
      className += " opacity-50";
    }
  } else if (selected) {
    className += " selected";
  }

  return (
    <button disabled={isAnswered} onClick={onClick} className={className}>
      <span>{text}</span>
      {isAnswered &&
        selected &&
        (isCorrect ? (
          <CheckCircle2 size={20} className="text-green" />
        ) : (
          <XCircle size={20} className="text-red" />
        ))}
    </button>
  );
};

const CodeSortable: React.FC<{ id: string; text: string }> = ({ id, text }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    position: "relative" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`code-item ${isDragging ? "dragging" : ""}`}
    >
      <div style={{ color: "#64748b", display: "flex" }}>
        <GripVertical size={20} />
      </div>
      <code>{text}</code>
    </div>
  );
};

// --- 4. APP PRINCIPAL ---

const generateShuffledQuestions = () => {
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const generateDragItems = (question?: Question) => {
  if (question?.type === "drag-drop" && question.codeLines) {
    const items = question.codeLines.map((text, idx) => ({
      id: `item-${idx}`,
      text,
    }));
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }
  return [];
};

export default function App() {
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>(() =>
    generateShuffledQuestions()
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  const [dragItems, setDragItems] = useState<{ id: string; text: string }[]>(
    () => generateDragItems(sessionQuestions[0])
  );
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  );

  const restartSession = () => {
    const newQs = generateShuffledQuestions();
    setSessionQuestions(newQs);
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setIsAnswered(false);
    setIsCorrect(false);
    setSelectedOption(null);
    if (newQs.length > 0) setDragItems(generateDragItems(newQs[0]));
  };

  const nextQuestion = () => {
    if (currentIndex < sessionQuestions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setIsAnswered(false);
      setIsCorrect(false);
      setSelectedOption(null);
      if (sessionQuestions[nextIdx].type === "drag-drop") {
        setDragItems(generateDragItems(sessionQuestions[nextIdx]));
      }
    } else {
      setIsFinished(true);
    }
  };

  const handleQuizSubmit = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    const correct = idx === sessionQuestions[currentIndex].correctOptionIndex;
    setIsCorrect(correct);
    if (correct) setScore((s) => s + 1);
    setIsAnswered(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (isAnswered) return;
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setDragItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleCodeSubmit = () => {
    if (isAnswered) return;
    const currentQ = sessionQuestions[currentIndex];
    const currentOrder = dragItems.map((i) => i.text.trim()).join("");
    const correctOrder =
      currentQ.codeLines?.map((i) => i.trim()).join("") || "";
    const correct = currentOrder === correctOrder;
    setIsCorrect(correct);
    if (correct) setScore((s) => s + 1);
    setIsAnswered(true);
  };

  const currentQ = sessionQuestions[currentIndex];

  if (isFinished) {
    return (
      <>
        <GlobalStyles />
        <div
          className="app-container"
          style={{ alignItems: "center", textAlign: "center" }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "500px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.5)",
                borderRadius: "50%",
                padding: "20px",
                marginBottom: "20px",
                border: "1px solid #1e293b",
              }}
            >
              <Trophy size={48} color="#facc15" />
            </div>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                marginBottom: "8px",
                color: "white",
              }}
            >
              Revisão Concluída!
            </h1>
            <p
              style={{
                color: "#94a3b8",
                marginBottom: "32px",
                fontSize: "1.1rem",
              }}
            >
              Você acertou{" "}
              <span style={{ color: "white", fontWeight: "bold" }}>
                {score}
              </span>{" "}
              de{" "}
              <span style={{ color: "white", fontWeight: "bold" }}>
                {sessionQuestions.length}
              </span>
            </p>
            <div
              style={{
                width: "100%",
                backgroundColor: "#1e293b",
                height: "12px",
                borderRadius: "6px",
                marginBottom: "32px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(score / sessionQuestions.length) * 100}%`,
                  backgroundColor: "#2563eb",
                  transition: "width 1s ease",
                }}
              />
            </div>
            <button
              onClick={restartSession}
              className="btn-primary"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              <RefreshCw size={20} /> Reiniciar Sessão
            </button>
          </div>
        </div>
      </>
    );
  }

  // Cores dos badges
  let badgeClass = "badge badge-gray";
  if (currentQ.category === "Grafos") badgeClass = "badge badge-purple";
  else if (currentQ.category === "Árvores") badgeClass = "badge badge-green";
  else if (currentQ.category === "Hash") badgeClass = "badge badge-blue";

  return (
    <>
      <GlobalStyles />
      <div className="app-container">
        {/* HEADER */}
        <header className="header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <BookOpen
              size={20}
              className="text-accent"
              style={{ color: "#3b82f6" }}
            />
            <span
              style={{
                fontWeight: 600,
                letterSpacing: "0.05em",
                fontSize: "0.9rem",
              }}
            >
              EDA REVISION A2
            </span>
          </div>
          <div
            style={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: "bold",
            }}
          >
            {currentIndex + 1} / {sessionQuestions.length}
          </div>
        </header>

        {/* CARD DA QUESTÃO */}
        <div className="card">
          <div>
            <span className={badgeClass}>{currentQ.category}</span>
            {currentQ.type === "drag-drop" && (
              <span className="badge badge-gray">Arrastar</span>
            )}
          </div>

          <h2 className="card-title">{currentQ.enunciation}</h2>

          <div>
            {currentQ.type === "quiz" ? (
              <div>
                {currentQ.options?.map((opt, idx) => (
                  <QuizOption
                    key={idx}
                    text={opt}
                    selected={selectedOption === idx}
                    isAnswered={isAnswered}
                    isCorrect={selectedOption === idx ? isCorrect : null}
                    onClick={() => handleQuizSubmit(idx)}
                  />
                ))}
              </div>
            ) : (
              <div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={dragItems}
                    strategy={verticalListSortingStrategy}
                  >
                    {dragItems.map((item) => (
                      <CodeSortable
                        key={item.id}
                        id={item.id}
                        text={item.text}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                {!isAnswered && (
                  <button onClick={handleCodeSubmit} className="btn-primary">
                    Verificar Ordem
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FEEDBACK CARD */}
        {isAnswered && (
          <div
            className={`feedback-card ${
              isCorrect ? "feedback-correct" : "feedback-incorrect"
            }`}
          >
            <div className="feedback-header">
              {isCorrect ? (
                <CheckCircle2 className="text-green" size={24} />
              ) : (
                <XCircle className="text-red" size={24} />
              )}
              <span className={isCorrect ? "text-green" : "text-red"}>
                {isCorrect ? "Resposta Correta" : "Resposta Incorreta"}
              </span>
            </div>

            {!isCorrect && currentQ.type === "drag-drop" && (
              <div className="terminal-view">
                <div
                  style={{
                    color: "#64748b",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  Ordem Correta
                </div>
                {currentQ.codeLines?.map((line, i) => (
                  <div key={i} className="terminal-line">
                    {line}
                  </div>
                ))}
              </div>
            )}

            <p
              style={{
                color: "#cbd5e1",
                lineHeight: "1.6",
                marginBottom: "20px",
              }}
            >
              {currentQ.explanation}
            </p>

            <div className="footer-nav">
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#64748b",
                  fontStyle: "italic",
                }}
              >
                Ref: {currentQ.sourceRef}
              </span>
              <button onClick={nextQuestion} className="next-btn">
                Próxima <ArrowRight size={16} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
