import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Volume2,
  VolumeX,
  Clock,
  Radio,
  Search,
  Activity,
  Layers,
  HelpCircle,
  Cpu
} from 'lucide-react';
import { AssetQuote, TerminalTheme, TerminalViewId } from '../types';
import { terminalSound } from '../utils/terminalSound';

interface TerminalHeaderProps {
  currentView: TerminalViewId;
  onViewChange: (view: TerminalViewId) => void;
  theme: TerminalTheme;
  onThemeChange: (theme: TerminalTheme) => void;
  assets: AssetQuote[];
  onSelectTicker: (ticker: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  currentView,
  onViewChange,
  theme,
  onThemeChange,
  assets,
  onSelectTicker,
  soundEnabled,
  onToggleSound
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [utcTime, setUtcTime] = useState('');
  const [nycTime, setNycTime] = useState('');
  const [ldnTime, setLdnTime] = useState('');
  const [sgpTime, setSgpTime] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Live World Clocks
  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');

      const formatTz = (tz: string) => {
        return new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).format(now);
      };

      setNycTime(formatTz('America/New_York') + ' NYC');
      setLdnTime(formatTz('Europe/London') + ' LDN');
      setSgpTime(formatTz('Asia/Singapore') + ' SGP');
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  // Global keydown handler for function keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        onViewChange('WORKSPACE');
        terminalSound.playCommandGo();
      } else if (e.key === 'F2') {
        e.preventDefault();
        onViewChange('FRGT');
        terminalSound.playCommandGo();
      } else if (e.key === 'F3') {
        e.preventDefault();
        onViewChange('MARKET');
        terminalSound.playCommandGo();
      } else if (e.key === 'F4') {
        e.preventDefault();
        onViewChange('ANLY');
        terminalSound.playCommandGo();
      } else if (e.key === 'F5') {
        e.preventDefault();
        onViewChange('NEWS');
        terminalSound.playCommandGo();
      } else if (e.key === 'F6') {
        e.preventDefault();
        onViewChange('CHAT');
        terminalSound.playCommandGo();
      } else if (e.key === 'F7') {
        e.preventDefault();
        onViewChange('XL');
        terminalSound.playCommandGo();
      } else if (e.key === 'F8') {
        e.preventDefault();
        onViewChange('OMS');
        terminalSound.playCommandGo();
      } else if (e.key === 'F9') {
        e.preventDefault();
        onViewChange('AI');
        terminalSound.playCommandGo();
      } else if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onViewChange]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = commandInput.trim().toUpperCase();
    if (!raw) return;

    terminalSound.playCommandGo();

    // Check View commands
    if (raw === 'WORKSPACE' || raw === 'WORKSPACE <GO>' || raw === 'DESK') {
      onViewChange('WORKSPACE');
    } else if (raw === 'FRGT' || raw === 'FRGT <GO>' || raw === 'SHIP' || raw === 'MAP') {
      onViewChange('FRGT');
    } else if (raw === 'MARKET' || raw === 'MARKET <GO>' || raw === 'TRAD' || raw === 'QUOTE') {
      onViewChange('MARKET');
    } else if (raw === 'ANLY' || raw === 'ANLY <GO>' || raw === 'CHART' || raw === 'DERIV') {
      onViewChange('ANLY');
    } else if (raw === 'NEWS' || raw === 'NEWS <GO>' || raw === 'ECO' || raw === 'ECO <GO>') {
      onViewChange('NEWS');
    } else if (raw === 'CHAT' || raw === 'CHAT <GO>' || raw === 'IB' || raw === 'MSG') {
      onViewChange('CHAT');
    } else if (raw === 'XL' || raw === 'XL <GO>' || raw === 'EXCEL' || raw === 'MODEL') {
      onViewChange('XL');
    } else if (raw === 'OMS' || raw === 'OMS <GO>' || raw === 'EMSX' || raw === 'BLOTTER') {
      onViewChange('OMS');
    } else if (raw === 'AI' || raw === 'AI <GO>' || raw === 'ASK' || raw === 'COPILOT') {
      onViewChange('AI');
    } else {
      // Check if it's a ticker or search query
      const matched = assets.find(a => a.ticker.toUpperCase().includes(raw) || a.name.toUpperCase().includes(raw));
      if (matched) {
        onSelectTicker(matched.ticker);
        onViewChange('MARKET');
      }
    }

    setCommandInput('');
    setIsDropdownOpen(false);
  };

  const navItems: { id: TerminalViewId; label: string; keyHint: string }[] = [
    { id: 'WORKSPACE', label: 'DESK [QUAD]', keyHint: 'F1' },
    { id: 'FRGT', label: 'FRGT [GLOBAL LANES]', keyHint: 'F2' },
    { id: 'MARKET', label: 'MKT [LIVE TAPE]', keyHint: 'F3' },
    { id: 'ANLY', label: 'ANLY [DERIVS/CURVES]', keyHint: 'F4' },
    { id: 'NEWS', label: 'NEWS [WIRE/ECO]', keyHint: 'F5' },
    { id: 'CHAT', label: 'IB [TRADER CHAT]', keyHint: 'F6' },
    { id: 'XL', label: 'XL [SPREADSHEET]', keyHint: 'F7' },
    { id: 'OMS', label: 'OMS [ORDER EXEC]', keyHint: 'F8' },
    { id: 'AI', label: 'ASK [AI ANALYST]', keyHint: 'F9' }
  ];

  return (
    <header className="bg-[#121212] border-b border-[#333] text-[#d1d1d1] select-none sticky top-0 z-50">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1 bg-[#080808] border-b border-[#333] text-xs font-mono">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 font-bold tracking-tight text-[#F27D26]">
            <Terminal className="w-4 h-4 text-[#F27D26]" />
            <span className="text-[#F27D26] font-bold text-sm tracking-tight">
              TERMINAL.EXE
            </span>
            <span className="text-[#666] text-[10px] hidden sm:inline">[V4.8-PRO]</span>
          </div>

          <div className="hidden lg:flex items-center space-x-2 text-[11px] text-gray-500">
            <span className="inline-flex items-center text-[#00FF41]">
              <Radio className="w-3 h-3 mr-1 animate-pulse" />
              [ONLINE] 12ms
            </span>
            <span className="text-[#333]">|</span>
            <span>FEED: SGX / ICE / LSE / AIS-GLOBAL</span>
          </div>
        </div>

        {/* World Clocks */}
        <div className="flex items-center space-x-3 text-[11px]">
          <div className="flex items-center space-x-2 text-[#d1d1d1]">
            <Clock className="w-3 h-3 text-[#F27D26]" />
            <span className="text-[#F27D26] font-bold">{utcTime}</span>
            <span className="text-gray-600">|</span>
            <span className="hidden md:inline text-gray-400">{nycTime}</span>
            <span className="hidden md:inline text-gray-600">|</span>
            <span className="hidden md:inline text-gray-400">{ldnTime}</span>
            <span className="hidden lg:inline text-gray-600">|</span>
            <span className="hidden lg:inline text-gray-400">{sgpTime}</span>
          </div>

          {/* Audio toggle & Theme picker */}
          <div className="flex items-center space-x-2 border-l border-[#333] pl-2">
            <button
              onClick={() => {
                onToggleSound();
                terminalSound.playKeyClick();
              }}
              title={soundEnabled ? 'Audio alerts active (Click to mute)' : 'Audio muted (Click to enable)'}
              className={`p-1 rounded hover:bg-[#1a1a1a] transition-colors ${
                soundEnabled ? 'text-[#F27D26]' : 'text-gray-600'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            <select
              value={theme}
              onChange={(e) => {
                onThemeChange(e.target.value as TerminalTheme);
                terminalSound.playKeyClick();
              }}
              className="bg-[#1a1a1a] text-[#d1d1d1] border border-[#333] rounded px-1.5 py-0.5 text-[10px] outline-none hover:border-[#F27D26] focus:border-[#F27D26]"
            >
              <option value="amber">Elegant Dark (Amber/Orange)</option>
              <option value="bloomberg-classic">Classic Terminal</option>
              <option value="green">Matrix Phosphor</option>
              <option value="cyan">Cyber Cyan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Command Bar & Ticker Tape Strip */}
      <div className="px-3 py-1.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 bg-[#080808] border-b border-[#333]">
        {/* Command Search Input Form */}
        <form onSubmit={handleCommandSubmit} className="relative flex-1 max-w-xl">
          <div className="flex items-center bg-[#121212] border border-[#333] focus-within:border-[#F27D26] rounded px-2.5 py-1">
            <span className="text-[#00FF41] font-bold text-xs mr-2 select-none tracking-tight">
              &gt;
            </span>
            <input
              ref={inputRef}
              type="text"
              value={commandInput}
              onChange={(e) => {
                setCommandInput(e.target.value);
                setIsDropdownOpen(true);
                terminalSound.playKeyClick();
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="ENTER COMMAND OR TICKER (e.g. SHA-LAX <Go>, FRGT <Go>, NEWS <Go>)..."
              className="w-full bg-transparent text-white placeholder-gray-600 text-xs font-mono outline-none uppercase"
            />
            <button
              type="submit"
              className="bg-[#F27D26] hover:bg-[#ff8e36] text-black font-extrabold text-[11px] px-2 py-0.5 rounded-xs transition-colors shrink-0 ml-1 active:scale-95"
            >
              &lt;GO&gt;
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && commandInput.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-[#121212] border border-[#333] rounded shadow-2xl z-50 max-h-64 overflow-y-auto text-xs">
              <div className="p-1.5 bg-[#1a1a1a] text-[10px] text-[#F27D26] font-semibold uppercase tracking-wider flex justify-between border-b border-[#333]">
                <span>Matching Functions & Tickers</span>
                <span className="text-gray-500">Press Enter or Click</span>
              </div>
              <div className="divide-y divide-[#222]">
                {/* Functions */}
                {['FRGT <GO>', 'MARKET <GO>', 'ANLY <GO>', 'NEWS <GO>', 'CHAT <GO>', 'XL <GO>', 'OMS <GO>', 'AI <GO>', 'WORKSPACE <GO>']
                  .filter(f => f.toLowerCase().includes(commandInput.toLowerCase()))
                  .map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setCommandInput(f);
                        handleCommandSubmit({ preventDefault: () => {} } as React.FormEvent);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#1a1a1a] flex items-center justify-between text-[#F27D26]"
                    >
                      <span className="font-bold flex items-center">
                        <Activity className="w-3 h-3 mr-2 text-[#F27D26]" />
                        {f}
                      </span>
                      <span className="text-[10px] text-gray-500">FUNCTION</span>
                    </button>
                  ))}

                {/* Tickers */}
                {assets
                  .filter(a => a.ticker.toLowerCase().includes(commandInput.toLowerCase()) || a.name.toLowerCase().includes(commandInput.toLowerCase()))
                  .slice(0, 5)
                  .map(a => (
                    <button
                      key={a.ticker}
                      type="button"
                      onClick={() => {
                        onSelectTicker(a.ticker);
                        onViewChange('MARKET');
                        setIsDropdownOpen(false);
                        setCommandInput('');
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#1a1a1a] flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-[#F27D26] mr-2">{a.ticker}</span>
                        <span className="text-gray-300 text-[11px]">{a.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-white mr-2">{a.price.toLocaleString()}</span>
                        <span className={a.change >= 0 ? 'text-[#00FF41] font-bold' : 'text-red-500 font-bold'}>
                          {a.change >= 0 ? '▲ ' : '▼ '}{Math.abs(a.changePct).toFixed(2)}%
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </form>

        {/* Live Ticker Mini-Strip */}
        <div className="overflow-hidden whitespace-nowrap flex items-center space-x-4 text-xs bg-[#000000] px-3 py-1 rounded border border-[#333] text-[11px]">
          {assets.slice(0, 7).map((asset) => (
            <button
              key={asset.ticker}
              onClick={() => {
                onSelectTicker(asset.ticker);
                onViewChange('MARKET');
              }}
              className="inline-flex items-center space-x-1.5 hover:bg-[#1a1a1a] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
            >
              <span className="font-bold text-[#d1d1d1]">{asset.ticker}:</span>
              <span className="text-white">{asset.price.toLocaleString()}</span>
              <span className={asset.change >= 0 ? 'text-[#00FF41] font-semibold' : 'text-red-500 font-semibold'}>
                {asset.change >= 0 ? '▲' : '▼'}{Math.abs(asset.changePct).toFixed(2)}%
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Function Key Tabs */}
      <nav className="flex overflow-x-auto bg-[#121212] divide-x divide-[#333] scrollbar-none">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                terminalSound.playCommandGo();
              }}
              className={`px-3 py-1.5 text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-all outline-none ${
                isActive
                  ? 'bg-[#1a1a1a] text-white border-b-2 border-[#F27D26] font-bold'
                  : 'text-[#d1d1d1] hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <span className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                isActive ? 'bg-[#F27D26] text-black' : 'bg-[#222] text-gray-400'
              }`}>
                {item.keyHint}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
