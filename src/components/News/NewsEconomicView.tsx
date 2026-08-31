import React, { useState } from 'react';
import {
  Newspaper,
  Calendar,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Flame,
  Award,
  Clock,
  Radio
} from 'lucide-react';
import { NewsArticle, EconomicEvent, EarningsEstimate, CreditRatingUpdate } from '../../types';
import {
  MOCK_NEWS_ARTICLES,
  MOCK_ECONOMIC_EVENTS,
  MOCK_EARNINGS,
  MOCK_CREDIT_RATINGS
} from '../../data/newsData';
import { terminalSound } from '../../utils/terminalSound';

export const NewsEconomicView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'WIRE' | 'ECO' | 'EARNINGS' | 'RATINGS'>('WIRE');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle>(MOCK_NEWS_ARTICLES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredNews = MOCK_NEWS_ARTICLES.filter(item => {
    const matchSearch =
      item.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tickers.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat = categoryFilter === 'ALL' || item.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-115px)] bg-[#090b11] text-[#ff9f1c] font-mono border-t border-[#1e2338]">
      {/* Top News & Eco Nav */}
      <div className="bg-[#121524] px-3 py-2 border-b border-[#1e2338] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => {
              setActiveTab('WIRE');
              terminalSound.playKeyClick();
            }}
            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
              activeTab === 'WIRE' ? 'bg-[#ff9f1c] text-black' : 'text-[#cbd5e1] hover:bg-[#1a1f33]'
            }`}
          >
            TOP NEWS WIRE (FIRST WORD)
          </button>
          <button
            onClick={() => {
              setActiveTab('ECO');
              terminalSound.playKeyClick();
            }}
            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
              activeTab === 'ECO' ? 'bg-[#ff9f1c] text-black' : 'text-[#cbd5e1] hover:bg-[#1a1f33]'
            }`}
          >
            ECONOMIC CALENDAR (ECO &lt;GO&gt;)
          </button>
          <button
            onClick={() => {
              setActiveTab('EARNINGS');
              terminalSound.playKeyClick();
            }}
            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
              activeTab === 'EARNINGS' ? 'bg-[#ff9f1c] text-black' : 'text-[#cbd5e1] hover:bg-[#1a1f33]'
            }`}
          >
            SHIPPING EARNINGS (ERN &lt;GO&gt;)
          </button>
          <button
            onClick={() => {
              setActiveTab('RATINGS');
              terminalSound.playKeyClick();
            }}
            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
              activeTab === 'RATINGS' ? 'bg-[#ff9f1c] text-black' : 'text-[#cbd5e1] hover:bg-[#1a1f33]'
            }`}
          >
            CREDIT RATINGS (CR &lt;GO&gt;)
          </button>
        </div>

        {/* Search */}
        {activeTab === 'WIRE' && (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Filter headlines / tickers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#181d2f] text-white text-xs border border-[#272f47] rounded px-2.5 py-1 outline-none placeholder-[#64748b]"
            />
          </div>
        )}
      </div>

      {/* VIEW 1: REAL-TIME NEWS WIRE */}
      {activeTab === 'WIRE' && (
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Headlines List */}
          <div className="w-full lg:w-3/5 border-r border-[#1e2338] overflow-y-auto divide-y divide-[#171b2b]">
            {filteredNews.map(article => {
              const isSelected = selectedArticle.id === article.id;
              const isFlash = article.priority === 'FLASH';

              return (
                <div
                  key={article.id}
                  onClick={() => {
                    setSelectedArticle(article);
                    terminalSound.playKeyClick();
                  }}
                  className={`p-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#1b233a] border-l-4 border-[#ff9f1c]'
                      : 'hover:bg-[#121626]'
                  }`}
                >
                  <div className="flex items-center space-x-2 text-[11px] mb-1">
                    <span className="text-[#64748b]">{article.timestamp}</span>
                    <span className="text-[#94a3b8] font-bold">{article.source}</span>
                    {isFlash && (
                      <span className="bg-rose-600 text-white font-extrabold px-1.5 py-0.2 rounded-xs text-[9px] animate-pulse">
                        FLASH
                      </span>
                    )}
                    <span className="text-[10px] text-[#64748b]">| {article.category}</span>
                  </div>

                  <h4 className={`text-sm font-bold leading-snug ${isFlash ? 'text-white' : 'text-[#cbd5e1]'}`}>
                    {article.headline}
                  </h4>

                  <div className="flex items-center justify-between mt-2 text-[11px]">
                    <div className="flex space-x-1.5">
                      {article.tickers.map(t => (
                        <span key={t} className="bg-[#0b0d14] text-[#ff9f1c] px-1.5 py-0.2 rounded border border-[#20273c] text-[10px] font-bold">
                          {t}
                        </span>
                      ))}
                    </div>

                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        article.sentiment === 'BULLISH'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : article.sentiment === 'BEARISH'
                          ? 'text-rose-400 bg-rose-500/10'
                          : 'text-[#94a3b8] bg-[#1a1f33]'
                      }`}
                    >
                      {article.sentiment}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Reader Pane */}
          <div className="flex-1 bg-[#0b0d16] p-4 overflow-y-auto flex flex-col justify-between">
            {selectedArticle && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#64748b] border-b border-[#1e2338] pb-2">
                  <span>SOURCE: {selectedArticle.source} | {selectedArticle.timestamp}</span>
                  <span className="text-[#ff9f1c] font-bold">ID: {selectedArticle.id}</span>
                </div>

                <h2 className="text-lg font-black text-white leading-tight">
                  {selectedArticle.headline}
                </h2>

                <p className="text-sm text-[#cbd5e1] leading-relaxed">
                  {selectedArticle.summary}
                </p>

                <div className="bg-[#121626] p-3 rounded border border-[#1e253c] text-xs space-y-2 mt-4">
                  <span className="text-[#94a3b8] font-bold block">IMPACT ANALYSIS & ASSOCIATED INSTRUMENTS</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tickers.map(t => (
                      <span key={t} className="bg-[#090a12] text-[#ff9f1c] px-2 py-1 rounded font-bold border border-[#222940]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="text-[10px] text-[#64748b] pt-3 border-t border-[#171b2b]">
              Terminal Wire Direct Feed • Verified Bloomberg / Reuters / Baltic Exchange Aggregation
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ECONOMIC RELEASE CALENDAR */}
      {activeTab === 'ECO' && (
        <div className="flex-1 p-3 overflow-y-auto">
          <div className="bg-[#101320] p-3 rounded border border-[#1e2338]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center">
                <Calendar className="w-4 h-4 mr-1.5 text-[#ff9f1c]" />
                GLOBAL MACROECONOMIC DATA RELEASES
              </h3>
              <span className="text-xs text-[#64748b]">AUTO-SYNC (BLS / FED / NBS / ECB)</span>
            </div>

            <div className="overflow-x-auto text-xs font-mono">
              <table className="w-full text-left">
                <thead className="text-[10px] text-[#64748b] border-b border-[#1e2338] bg-[#0c0e18]">
                  <tr>
                    <th className="p-2">TIME (UTC)</th>
                    <th>CNTRY</th>
                    <th>EVENT</th>
                    <th>PERIOD</th>
                    <th>ACTUAL</th>
                    <th>CONSENSUS</th>
                    <th>PREVIOUS</th>
                    <th>IMPACT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171c2e]">
                  {MOCK_ECONOMIC_EVENTS.map(eco => (
                    <tr key={eco.id} className="hover:bg-[#161a29]">
                      <td className="p-2 text-[#64748b]">{eco.timestamp}</td>
                      <td className="font-bold text-white">{eco.country}</td>
                      <td className="font-bold text-[#ff9f1c]">{eco.event}</td>
                      <td className="text-[#94a3b8]">{eco.period}</td>
                      <td className="font-bold text-white">{eco.actual}</td>
                      <td className="text-[#cbd5e1]">{eco.consensus}</td>
                      <td className="text-[#64748b]">{eco.previous}</td>
                      <td>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            eco.impact === 'HIGH'
                              ? 'bg-rose-500/20 text-rose-400'
                              : eco.impact === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}
                        >
                          {eco.impact}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: SHIPPING CORPORATE EARNINGS */}
      {activeTab === 'EARNINGS' && (
        <div className="flex-1 p-3 overflow-y-auto">
          <div className="bg-[#101320] p-3 rounded border border-[#1e2338]">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center">
              <Award className="w-4 h-4 mr-1.5 text-[#ff9f1c]" />
              GLOBAL CONTAINER & TANKER CARRIERS EARNINGS AUDIT
            </h3>

            <div className="overflow-x-auto text-xs font-mono">
              <table className="w-full text-left">
                <thead className="text-[10px] text-[#64748b] border-b border-[#1e2338] bg-[#0c0e18]">
                  <tr>
                    <th className="p-2">COMPANY</th>
                    <th>TICKER</th>
                    <th>PERIOD</th>
                    <th>REPORT DATE</th>
                    <th>EPS EST</th>
                    <th>EPS ACT</th>
                    <th>REV EST</th>
                    <th>REV ACT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171c2e]">
                  {MOCK_EARNINGS.map(ern => (
                    <tr key={ern.ticker} className="hover:bg-[#161a29]">
                      <td className="p-2 font-bold text-white">{ern.company}</td>
                      <td className="font-bold text-[#ff9f1c]">{ern.ticker}</td>
                      <td className="text-[#94a3b8]">{ern.period}</td>
                      <td className="text-[#cbd5e1]">{ern.reportDate}</td>
                      <td>{ern.epsEstimate}</td>
                      <td className="font-bold text-emerald-400">{ern.epsActual}</td>
                      <td>{ern.revEstimate}</td>
                      <td className="font-bold text-emerald-400">{ern.revActual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: CREDIT RATINGS */}
      {activeTab === 'RATINGS' && (
        <div className="flex-1 p-3 overflow-y-auto">
          <div className="bg-[#101320] p-3 rounded border border-[#1e2338]">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center">
              <Award className="w-4 h-4 mr-1.5 text-[#ff9f1c]" />
              CREDIT RATING ACTIONS (S&P / MOODY'S / FITCH)
            </h3>

            <div className="overflow-x-auto text-xs font-mono">
              <table className="w-full text-left">
                <thead className="text-[10px] text-[#64748b] border-b border-[#1e2338] bg-[#0c0e18]">
                  <tr>
                    <th className="p-2">ENTITY</th>
                    <th>TICKER</th>
                    <th>AGENCY</th>
                    <th>RATING</th>
                    <th>ACTION</th>
                    <th>OUTLOOK</th>
                    <th>DATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171c2e]">
                  {MOCK_CREDIT_RATINGS.map((cr, idx) => (
                    <tr key={idx} className="hover:bg-[#161a29]">
                      <td className="p-2 font-bold text-white">{cr.entity}</td>
                      <td className="font-bold text-[#ff9f1c]">{cr.ticker}</td>
                      <td className="text-[#94a3b8]">{cr.agency}</td>
                      <td className="font-bold text-emerald-400">{cr.rating}</td>
                      <td>
                        <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {cr.action}
                        </span>
                      </td>
                      <td className="text-white">{cr.outlook}</td>
                      <td className="text-[#64748b]">{cr.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
