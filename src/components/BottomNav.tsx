import React from 'react';
import { 
  Home, 
  Building2, 
  ReceiptText, 
  Compass, 
  Smartphone 
} from 'lucide-react';

export type TabType = 'dashboard' | 'fixed' | 'transactions' | 'advice' | 'shortcuts';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Início', icon: Home },
    { id: 'fixed' as TabType, label: 'Fixos', icon: Building2 },
    { id: 'transactions' as TabType, label: 'Extrato', icon: ReceiptText },
    { id: 'advice' as TabType, label: 'Consultoria', icon: Compass },
    { id: 'shortcuts' as TabType, label: 'Atalhos', icon: Smartphone },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c0f]/95 backdrop-blur-xl border-t border-zinc-800/80 px-2 sm:px-4 py-2 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all ${
                isActive
                  ? 'text-white scale-105 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 font-medium'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-zinc-800 text-emerald-400 shadow-sm' : ''}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10px] sm:text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
