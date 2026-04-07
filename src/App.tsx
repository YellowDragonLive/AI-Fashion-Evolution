import { useState } from 'react';
import { Flow } from './components/Flow';
import { ApiKeyDialog } from './components/ApiKeyDialog';

export default function App() {
  const [hasKey, setHasKey] = useState(false);

  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-50 font-sans">
      {!hasKey ? (
        <ApiKeyDialog onKeySelected={() => setHasKey(true)} />
      ) : (
        <Flow />
      )}
    </div>
  );
}
