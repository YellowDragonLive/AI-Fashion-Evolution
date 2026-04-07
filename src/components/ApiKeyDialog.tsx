import { useEffect, useState } from 'react';
import { Key } from 'lucide-react';

export function ApiKeyDialog({ onKeySelected }: { onKeySelected: () => void }) {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        onKeySelected();
      }
      setIsChecking(false);
    };
    checkKey();
  }, [onKeySelected]);

  const handleSelectKey = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // Assume success after triggering openSelectKey as per guidelines
      onKeySelected();
    } catch (error) {
      console.error("Failed to select API key:", error);
    }
  };

  if (isChecking) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Key className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">需要 API 密钥</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          本应用使用高质量的 <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-indigo-600">gemini-3-pro-image-preview</code> 模型生成 4K 时尚图像。您必须选择一个付费的 Google Cloud API 密钥才能继续。
        </p>
        <button
          onClick={handleSelectKey}
          className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl active:scale-[0.98]"
        >
          选择 API 密钥
        </button>
        <p className="text-xs text-gray-400 mt-6">
          有关计费详情，请访问 <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-gray-600">计费文档</a>。
        </p>
      </div>
    </div>
  );
}
