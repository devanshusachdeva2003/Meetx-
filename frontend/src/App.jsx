import './index.css';
import { Sidebar } from './component/Sidebar';
import { Dashboard } from './component/Dashboard';

function App() {
  return (
    <div className="app-root flex h-screen bg-background text-gray-200 font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <Dashboard />
      </div>
    </div>
  );
}

export default App;
