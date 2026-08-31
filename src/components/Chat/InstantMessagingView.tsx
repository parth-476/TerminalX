import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  ShieldCheck,
  Users,
  CheckCheck,
  Lock,
  DollarSign,
  Download,
  Terminal,
  Paperclip,
  Check
} from 'lucide-react';
import { ChatChannel, ChatMessage } from '../../types';
import { INITIAL_CHAT_CHANNELS } from '../../data/newsData';
import { terminalSound } from '../../utils/terminalSound';

export const InstantMessagingView: React.FC = () => {
  const [channels, setChannels] = useState<ChatChannel[]>(INITIAL_CHAT_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string>(INITIAL_CHAT_CHANNELS[0].id);
  const [inputMessage, setInputMessage] = useState('');
  const [isTypingCounterparty, setIsTypingCounterparty] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChannel.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderName: 'DESK TRADER (ME)',
      senderFirm: 'GLENCORE MARITIME LTD',
      timestamp: new Date().toISOString().slice(11, 16),
      text: inputMessage,
      isCurrentUser: true,
      complianceArchived: true
    };

    setChannels(prev =>
      prev.map(ch =>
        ch.id === activeChannelId
          ? { ...ch, messages: [...ch.messages, newMsg] }
          : ch
      )
    );

    terminalSound.playKeyClick();
    setInputMessage('');

    // Simulate automated institutional counterparty reply
    setTimeout(() => {
      setIsTypingCounterparty(true);
      setTimeout(() => {
        setIsTypingCounterparty(false);
        const replyMsg: ChatMessage = {
          id: 'reply-' + Date.now(),
          senderName: activeChannel.type === 'DIRECT' ? activeChannel.name : 'GUNVOR HEAD OF DESK',
          senderFirm: 'GUNVOR SA GENEVA',
          timestamp: new Date().toISOString().slice(11, 16),
          text: `CONFIRMED: Received. We can firm offer 5 lots @ index parity. Let's book via EMSX order blotter.`,
          isCurrentUser: false,
          complianceArchived: true
        };

        setChannels(p =>
          p.map(ch =>
            ch.id === activeChannelId
              ? { ...ch, messages: [...ch.messages, replyMsg] }
              : ch
          )
        );
        terminalSound.playChatPop();
      }, 2000);
    }, 1200);
  };

  // Fast Quote Sharing Template Action
  const sendFastQuote = (quoteText: string) => {
    setInputMessage(quoteText);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-115px)] bg-[#090b11] text-[#ff9f1c] font-mono border-t border-[#1e2338]">
      {/* LEFT: Channel / Desk Counterparties List */}
      <div className="w-full lg:w-80 flex flex-col border-r border-[#1e2338] bg-[#0d0f18] shrink-0">
        <div className="p-2.5 bg-[#121524] border-b border-[#1e2338] flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center">
            <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-[#ff9f1c]" />
            IB (INSTANT BLOOMBERG)
          </span>
          <span className="text-[10px] text-emerald-400 font-bold flex items-center">
            <Lock className="w-3 h-3 mr-1" />
            FINRA/SEC ARCHIVED
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#171b2b]">
          {channels.map(channel => {
            const isSelected = channel.id === activeChannelId;
            const lastMsg = channel.messages[channel.messages.length - 1];

            return (
              <div
                key={channel.id}
                onClick={() => {
                  setActiveChannelId(channel.id);
                  terminalSound.playKeyClick();
                }}
                className={`p-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#1b233a] border-l-4 border-[#ff9f1c]'
                    : 'hover:bg-[#121626]'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-white text-xs block truncate max-w-[190px]">
                    {channel.name}
                  </span>
                  <span className="text-[10px] text-[#64748b]">{lastMsg?.timestamp}</span>
                </div>

                <div className="text-[10px] text-[#ff9f1c] font-semibold mt-0.5">
                  {channel.counterpartyFirm}
                </div>

                <p className="text-[11px] text-[#94a3b8] truncate mt-1">
                  {lastMsg ? `${lastMsg.senderName}: ${lastMsg.text}` : 'No messages yet'}
                </p>
              </div>
            );
          })}
        </div>

        <div className="p-2 bg-[#0a0c14] border-t border-[#1a1f33] text-[10px] text-[#64748b] flex justify-between items-center">
          <span>SEC RULE 17a-4 COMPLIANT</span>
          <button
            onClick={() => terminalSound.playKeyClick()}
            className="text-[#ff9f1c] hover:underline flex items-center"
          >
            <Download className="w-3 h-3 mr-1" />
            EXPORT AUDIT LOG
          </button>
        </div>
      </div>

      {/* RIGHT: Active Chat Room & Deal Confirmation Window */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0b12]">
        {/* Active Channel Header */}
        <div className="p-3 bg-[#111422] border-b border-[#1e2338] flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-extrabold text-white">{activeChannel.name}</h3>
              <span className="text-[10px] bg-[#1e253c] text-[#ff9f1c] px-2 py-0.5 rounded font-bold">
                {activeChannel.counterpartyFirm}
              </span>
            </div>
            <div className="text-[11px] text-[#64748b] mt-0.5">
              Secure institutional communication tunnel • End-to-end audit enabled
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded font-bold flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              AUTHENTICATED TRADER ID
            </span>
          </div>
        </div>

        {/* Quick Deal Negotiation Presets */}
        <div className="px-3 py-1.5 bg-[#0e101b] border-b border-[#1b2033] flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[10px] text-[#64748b] font-bold">FAST QUOTES:</span>
          <button
            onClick={() => sendFastQuote('FIRM BID: 10 Lots Oct-26 FE-EUR-01 @ $3,820/FEU')}
            className="bg-[#181d2f] text-emerald-400 hover:bg-emerald-500/20 px-2 py-0.5 rounded text-[11px] font-bold border border-emerald-500/30"
          >
            + BID $3,820/FEU
          </button>
          <button
            onClick={() => sendFastQuote('FIRM OFFER: 10 Lots Oct-26 FE-EUR-01 @ $3,870/FEU')}
            className="bg-[#181d2f] text-rose-400 hover:bg-rose-500/20 px-2 py-0.5 rounded text-[11px] font-bold border border-rose-500/30"
          >
            + OFFER $3,870/FEU
          </button>
          <button
            onClick={() => sendFastQuote('DONE @ $3,850. Confirming booking ref #TK-98842.')}
            className="bg-[#181d2f] text-[#ff9f1c] hover:bg-[#ff9f1c]/20 px-2 py-0.5 rounded text-[11px] font-bold border border-[#ff9f1c]/30"
          >
            + CONFIRM DEAL (DONE)
          </button>
        </div>

        {/* Messages Thread */}
        <div className="flex-1 p-3 overflow-y-auto space-y-3">
          {activeChannel.messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isCurrentUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center space-x-2 text-[10px] text-[#64748b] mb-0.5">
                <span className="font-bold text-[#ff9f1c]">{msg.senderName}</span>
                <span>({msg.senderFirm})</span>
                <span>{msg.timestamp}</span>
                {msg.complianceArchived && (
                  <CheckCheck className="w-3 h-3 text-emerald-400" title="Archived for compliance" />
                )}
              </div>

              <div
                className={`max-w-xl p-2.5 rounded text-xs leading-relaxed font-mono ${
                  msg.isCurrentUser
                    ? 'bg-[#1b263d] text-white border border-[#2b3a5c]'
                    : 'bg-[#141826] text-[#cbd5e1] border border-[#20273c]'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isTypingCounterparty && (
            <div className="text-[11px] text-[#94a3b8] italic flex items-center space-x-1">
              <span className="w-2 h-2 bg-[#ff9f1c] rounded-full animate-bounce"></span>
              <span>Counterparty trader is typing a quotation...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Message Form */}
        <form onSubmit={handleSendMessage} className="p-3 bg-[#101320] border-t border-[#1e2338] flex items-center space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type confidential negotiation message or quote (e.g. 'FIRM BID 5 lots @ 3840')..."
            className="flex-1 bg-[#090b12] text-white text-xs border border-[#242b40] rounded px-3 py-2 outline-none focus:border-[#ff9f1c] font-mono placeholder-[#64748b]"
          />
          <button
            type="submit"
            className="bg-[#ff9f1c] hover:bg-[#ff8400] text-black font-extrabold text-xs px-4 py-2 rounded flex items-center space-x-1 transition-all active:scale-95 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>SEND</span>
          </button>
        </form>
      </div>
    </div>
  );
};
