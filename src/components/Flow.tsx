import React, { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, FolderOpen, Upload, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ImageNode } from './ImageNode';
import { ImageSize } from '../lib/gemini';

export function Flow() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    triggerEvolution,
    initializeWithImage,
    saveGraph,
    loadGraph,
    clearGraph,
  } = useStore();

  const nodeTypes = useMemo(() => ({ imageNode: ImageNode }), []);

  // Inject the onEvolve callback into nodes
  const nodesWithCallback = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onEvolve: (instruction: string, size: ImageSize) => {
          triggerEvolution(node.id, instruction, size);
        },
      },
    }));
  }, [nodes, triggerEvolution]);

  useEffect(() => {
    const hasData = localStorage.getItem('fashion-graph');
    if (hasData) {
      loadGraph();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await initializeWithImage(file);
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 relative">
      {nodes.length === 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-gray-100">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">上传您的照片</h2>
            <p className="text-gray-500 mb-6">上传一张您的全身或半身照，作为 AI 试装的初始参考图。</p>
            <label className="cursor-pointer bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors inline-block w-full shadow-md hover:shadow-lg">
              选择图片
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      )}
      <ReactFlow
        nodes={nodesWithCallback}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls className="bg-white shadow-md border-none rounded-xl overflow-hidden" />
        <MiniMap 
          className="bg-white shadow-md rounded-xl overflow-hidden" 
          nodeColor={(n) => {
            if (n.data?.status === 'loading') return '#eab308';
            if (n.data?.status === 'error') return '#ef4444';
            return '#6366f1';
          }}
        />
        <Panel position="top-left" className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">✨</span> AI 试装演化树
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                输入指令以分支生成新的 4K 设计。
              </p>
            </div>
            <div className="flex gap-2 ml-6">
              <button 
                onClick={saveGraph} 
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors" 
                title="保存进度"
              >
                <Save className="w-4 h-4" />
              </button>
              <button 
                onClick={loadGraph} 
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors" 
                title="加载进度"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
              <button 
                onClick={clearGraph} 
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-red-50 text-red-600 transition-colors ml-2" 
                title="重新开始"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
