import './index.css';
import { Sidebar } from './component/Sidebar';
import { Dashboard } from './component/Dashboard';

function App() {
  return (
    <div className="flex h-screen bg-[#0B0C10] text-[#f3f4f6] font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <Dashboard />
      </div>
    </div>
  );
}

export default App;
