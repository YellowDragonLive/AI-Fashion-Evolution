import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { FashionNode } from '../store/useStore';
import { cn } from '../lib/utils';
import { ImageSize } from '../lib/gemini';

export const ImageNode = memo(({ data, isConnectable }: NodeProps<FashionNode>) => {
  const [instruction, setInstruction] = useState('');
  const [size, setSize] = useState<ImageSize>('1K');

  const handleEvolve = () => {
    if (instruction.trim() && data.onEvolve) {
      data.onEvolve(instruction.trim(), size);
      setInstruction('');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden w-80 transition-all hover:shadow-2xl">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-indigo-500"
      />
      
      <div className="relative w-full aspect-[9/16] bg-gray-100 flex items-center justify-center overflow-hidden">
        {data.status === 'loading' && (
          <div className="flex flex-col items-center text-indigo-500">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="text-sm font-medium">生成中...</span>
          </div>
        )}
        
        {data.status === 'error' && (
          <div className="flex flex-col items-center text-red-500">
            <AlertCircle className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">生成失败</span>
          </div>
        )}
        
        {data.status === 'success' && data.imageUrl && (
          <img
            src={data.imageUrl}
            alt={data.prompt}
            className="w-full h-full object-cover"
          />
        )}
        
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md font-medium">
          {data.metadata.style}
        </div>
      </div>

      <div className="p-4 bg-white">
        <p className="text-xs text-gray-500 mb-3 line-clamp-2" title={data.prompt}>
          {data.prompt}
        </p>
        
        {data.status === 'success' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <select 
                value={size}
                onChange={(e) => setSize(e.target.value as ImageSize)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="1K">1K</option>
                <option value="2K">2K</option>
                <option value="4K">4K</option>
              </select>
              <input
                type="text"
                placeholder="例如：换成丝绸材质..."
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEvolve()}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>
            <button
              onClick={handleEvolve}
              disabled={!instruction.trim()}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                instruction.trim() 
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg" 
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              <Sparkles className="w-4 h-4" />
              演化 (x3)
            </button>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-indigo-500"
      />
    </div>
  );
});
