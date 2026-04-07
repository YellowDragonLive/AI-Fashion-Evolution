import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import { generateFashionImage, blobToBase64, ImageSize } from '../lib/gemini';
import { ImageStorage, base64ToBlob } from '../lib/db';

export type FashionNodeData = {
  imageId?: string; // ID in IndexedDB
  imageUrl?: string; // Object URL for rendering
  prompt: string;
  status: 'loading' | 'success' | 'error';
  metadata: {
    style: string;
  };
  onEvolve?: (instruction: string, size: ImageSize) => void;
};

export type FashionNode = Node<FashionNodeData, 'imageNode'>;

interface FashionState {
  nodes: FashionNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange<FashionNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: FashionNode) => void;
  updateNodeData: (id: string, data: Partial<FashionNodeData>) => void;
  triggerEvolution: (parentNodeId: string, userInstruction: string, size: ImageSize) => Promise<void>;
  initializeRoot: (prompt: string, size: ImageSize) => Promise<void>;
  initializeWithImage: (file: File) => Promise<void>;
  saveGraph: () => void;
  loadGraph: () => Promise<void>;
  clearGraph: () => void;
}

const HORIZONTAL_GAP = 450;
const VERTICAL_GAP = 600;

function calculateFanPosition(parentPos: { x: number; y: number }, index: number) {
  return {
    x: parentPos.x + HORIZONTAL_GAP,
    y: parentPos.y + (index - 1) * VERTICAL_GAP,
  };
}

export const useStore = create<FashionState>((set, get) => ({
  nodes: [],
  edges: [],
  onNodesChange: (changes: NodeChange<FashionNode>[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },
  addNode: (node: FashionNode) => {
    set({ nodes: [...get().nodes, node] });
  },
  updateNodeData: (id: string, data: Partial<FashionNodeData>) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      }),
    });
  },
  saveGraph: () => {
    const { nodes, edges } = get();
    localStorage.setItem('fashion-graph', JSON.stringify({ nodes, edges }));
  },
  loadGraph: async () => {
    const data = localStorage.getItem('fashion-graph');
    if (!data) return;
    try {
      const { nodes, edges } = JSON.parse(data);
      const rehydratedNodes = await Promise.all(
        nodes.map(async (node: FashionNode) => {
          if (node.data.imageId) {
            const url = await ImageStorage.getUrl(node.data.imageId);
            if (url) {
              node.data.imageUrl = url;
            }
          }
          return node;
        })
      );
      set({ nodes: rehydratedNodes, edges });
    } catch (e) {
      console.error('Failed to load graph:', e);
    }
  },
  clearGraph: () => {
    set({ nodes: [], edges: [] });
    localStorage.removeItem('fashion-graph');
  },
  initializeWithImage: async (file: File) => {
    const rootId = uuidv4();
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    const imageId = await ImageStorage.save(rootId, blob);
    const imageUrl = await ImageStorage.getUrl(imageId);

    const rootNode: FashionNode = {
      id: rootId,
      type: 'imageNode',
      position: { x: 100, y: 300 },
      data: {
        prompt: '用户上传的初始图片',
        status: 'success',
        metadata: { style: '原图' },
        imageId,
        imageUrl: imageUrl || undefined,
      },
    };

    set({ nodes: [rootNode], edges: [] });
  },
  initializeRoot: async (prompt: string, size: ImageSize) => {
    const rootId = uuidv4();
    const rootNode: FashionNode = {
      id: rootId,
      type: 'imageNode',
      position: { x: 100, y: 300 },
      data: {
        prompt,
        status: 'loading',
        metadata: { style: 'initial' },
      },
    };
    
    set({ nodes: [rootNode], edges: [] });

    try {
      const result = await generateFashionImage(prompt, null, null, size);
      const blob = base64ToBlob(result.base64, result.mimeType);
      const imageId = await ImageStorage.save(rootId, blob);
      const imageUrl = await ImageStorage.getUrl(imageId);

      get().updateNodeData(rootId, {
        status: 'success',
        imageId,
        imageUrl: imageUrl || undefined,
      });
    } catch (error) {
      console.error('Failed to generate root image:', error);
      get().updateNodeData(rootId, { status: 'error' });
    }
  },
  triggerEvolution: async (parentNodeId: string, userInstruction: string, size: ImageSize) => {
    const parentNode = get().nodes.find((n) => n.id === parentNodeId);
    if (!parentNode || parentNode.data.status !== 'success' || !parentNode.data.imageId) return;

    // Get parent image base64
    const parentImageUrl = await ImageStorage.getUrl(parentNode.data.imageId);
    if (!parentImageUrl) return;
    
    // Fetch blob to convert to base64
    const response = await fetch(parentImageUrl);
    const parentBlob = await response.blob();
    const parentBase64 = await blobToBase64(parentBlob);

    const branchConfigs = [
      { suffix: '侧重纹理与材质细节', style: '纹理' },
      { suffix: '侧重轮廓与版型', style: '轮廓' },
      { suffix: '前卫创意诠释', style: '创意' },
    ];

    const newNodes: FashionNode[] = branchConfigs.map((cfg, index) => {
      const id = uuidv4();
      return {
        id,
        type: 'imageNode',
        position: calculateFanPosition(parentNode.position, index),
        data: {
          prompt: `${userInstruction}, ${cfg.suffix}`,
          status: 'loading',
          metadata: { style: cfg.style },
        },
      };
    });

    const newEdges: Edge[] = newNodes.map((node) => ({
      id: `e-${parentNodeId}-${node.id}`,
      source: parentNodeId,
      target: node.id,
      label: userInstruction,
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
    }));

    set({
      nodes: [...get().nodes, ...newNodes],
      edges: [...get().edges, ...newEdges],
    });

    const generationTasks = branchConfigs.map(async (cfg, index) => {
      const nodeId = newNodes[index].id;
      try {
        const result = await generateFashionImage(
          `${userInstruction}, ${cfg.suffix}`,
          parentBase64,
          parentBlob.type,
          size
        );
        
        const blob = base64ToBlob(result.base64, result.mimeType);
        const imageId = await ImageStorage.save(nodeId, blob);
        const imageUrl = await ImageStorage.getUrl(imageId);

        get().updateNodeData(nodeId, {
          status: 'success',
          imageId,
          imageUrl: imageUrl || undefined,
        });
      } catch (err) {
        console.error(`Failed to evolve node ${nodeId}:`, err);
        get().updateNodeData(nodeId, { status: 'error' });
      }
    });

    await Promise.all(generationTasks);
  },
}));
