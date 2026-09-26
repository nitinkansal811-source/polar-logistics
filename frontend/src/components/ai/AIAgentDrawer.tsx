'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../../lib/api';
import { usePolarStore } from '../../lib/store';
import {
  Bot,
  Sparkles,
  Key,
  Send,
  X,
  RefreshCw,
  Radio,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Plane,
  ShieldAlert,
  ChevronRight,
  Compass,
  Boxes,
  Activity,
  Route,
  FastForward,
  Satellite
} from 'lucide-react';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  source?: 'groq' | 'simulated';
  executedAction?: {
    label: string;
    type: string;
  };
}

interface AIAgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAgentDrawer: React.FC<AIAgentDrawerProps> = ({ isOpen, onClose }) => {
  const {
    setActiveTab,
    simulation,
    setSimulation,
    satellite,
    setSatellite
  } = usePolarStore();

  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      content: `Greetings Commander. I am **HIMVEER** (हिमवीर), the AI Tactical Operations Co-Pilot for the 44th Indian Scientific Expedition to Antarctica (NCPOR / MoES).\n\nI am connected to live station telemetry (**Maitri**, **Bharati**, *MV Vasiliy Golovnin*, and polar flight corridors) and have direct operational command capabilities. You can ask me for logistics analysis, or instruct me to control simulation parameters, inject blizzards, enact fuel rationing, or switch console views.`,
      model: 'HIMVEER Telemetry Engine',
      source: 'simulated'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keyStatus, setKeyStatus] = useState<{ configured: boolean; maskedKey?: string }>({ configured: false });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      api.getAiStatus().then(setKeyStatus).catch(() => {});
      scrollToBottom();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Execute structured console action directives from the AI
  const executeActionDirective = async (actionData: { action: string; params?: any }): Promise<string> => {
    const { action, params = {} } = actionData;
    console.log('[AI Agent] Executing action directive:', action, params);

    try {
      switch (action) {
        case 'TRIGGER_BLIZZARD':
          await api.triggerBlizzard(params.active !== false);
          setSimulation({ is_blizzard_active: params.active !== false });
          return params.active !== false
            ? 'Katabatic Blizzard Code-Red Injected at Maitri (Temp: -44°C, Wind: 86 kt)'
            : 'Blizzard storm cleared. Normal operations resumed.';

        case 'CLEAR_BLIZZARD':
          await api.triggerBlizzard(false);
          setSimulation({ is_blizzard_active: false });
          return 'Blizzard storm cleared. Normal operations resumed.';

        case 'TRIGGER_BLACKOUT':
          await api.triggerSatelliteBlackout(true);
          setSatellite({ status: 'closed', bandwidth_kbps: 0, signal_strength_pct: 0 });
          setSimulation({ is_satellite_blackout: true });
          return 'Satellite Comms Blackout Injected (0 kbps link, offline queue active).';

        case 'RESTORE_SATELLITE':
          await api.triggerSatelliteBlackout(false);
          setSatellite({ status: 'active', bandwidth_kbps: 128, signal_strength_pct: 94 });
          setSimulation({ is_satellite_blackout: false });
          return 'Satellite Link Restored (Iridium NEXT 128 kbps).';

        case 'SET_TIME_WARP':
          const warp = params.warp === 60 ? 60 : params.warp === 10 ? 10 : 1;
          await api.setTimeWarp(warp);
          setSimulation({ time_warp: warp });
          return `Simulation Time Warp set to ${warp}x.`;

        case 'NAVIGATE_TAB':
          if (params.tab) {
            setActiveTab(params.tab);
            return `Console view switched to: ${params.tab.toUpperCase()}`;
          }
          return 'View switched.';

        case 'ENACT_RATIONING':
          const targetId = params.itemId || 'inv-mai-01';
          await api.enactRationing(targetId);
          return 'Level-2 Fuel Rationing Protocol enacted (-22% daily consumption).';

        case 'TRIGGER_EMERGENCY':
          const res = await api.triggerEmergency({
            type: params.type || 'medical_evacuation',
            station_id: params.station_id || 'maitri',
            notes: params.notes || 'Emergency triggered via HIMVEER AI Co-Pilot command.'
          });
          setActiveTab('emergency');
          return `Emergency Declared: ${res.incident.title} (Clearance: ${res.incident.clearance_code})`;

        default:
          return `Command acknowledged: ${action}`;
      }
    } catch (err: any) {
      return `Action error: ${err.message}`;
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.aiChat(
        newMessages.map((m) => ({ role: m.role, content: m.content }))
      );

      let rawContent = res.response;
      let executedActionLabel: string | undefined;

      // Extract and execute any ```action ... ``` block
      const actionBlockRegex = /```action\s*([\s\S]*?)\s*```/;
      const match = rawContent.match(actionBlockRegex);

      if (match) {
        try {
          const actionJson = JSON.parse(match[1]);
          const resultText = await executeActionDirective(actionJson);
          executedActionLabel = resultText;
          // Strip out the raw code block so the chat displays cleanly
          rawContent = rawContent.replace(actionBlockRegex, '').trim();
        } catch (parseErr) {
          console.error('[AI Agent] Failed to parse action block:', parseErr);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: rawContent,
          model: res.model,
          source: res.source,
          executedAction: executedActionLabel
            ? { label: executedActionLabel, type: 'action' }
            : undefined
        }
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Tactical Comm Error: ${e.message || 'Failed to reach AI inference service.'}`,
          model: 'Error',
          source: 'simulated'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    try {
      const res = await api.setAiConfig(apiKeyInput.trim());
      setKeyStatus({ configured: res.configured, maskedKey: res.maskedKey });
      setSaveMessage('Groq API Key saved successfully! Live Groq LPU inference active.');
      setApiKeyInput('');
      setTimeout(() => {
        setSaveMessage(null);
        setShowKeyModal(false);
      }, 2000);
    } catch (e: any) {
      setSaveMessage(`Error saving key: ${e.message}`);
    }
  };

  // Clean raw HTML tags (like <br>) from Markdown text
  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/&nbsp;/gi, ' ');
  };

  const quickPrompts = [
    { label: '⛽ Maitri Fuel vs Window', text: 'Analyze current Maitri fuel burn rate vs the next Austral Summer shipping window.' },
    { label: '✈️ 4,200 kg Cargo to Bharati', text: 'Can we fly 4,200 kg of scientific equipment to Bharati? What is the recommended multi-modal plan?' },
    { label: '🚨 MEDEVAC Protocol', text: 'Draft an emergency MEDEVAC protocol for a compound fracture requiring Cape Town hospital divert.' },
    { label: '🧊 Sea-Ice Risks', text: 'What are the current sea-ice risks and transit constraints for MV Vasiliy Golovnin?' }
  ];

  const quickConsoleActions = [
    { label: '📍 View Map', text: 'Please switch the console view to the Tactical Operations Map.' },
    { label: '❄️ Inject Blizzard', text: 'Please inject a Katabatic Blizzard at Maitri to test emergency fuel burn.' },
    { label: '⏩ Speed 60x', text: 'Set the simulation time warp to 60x.' },
    { label: '⛽ Enact Rationing', text: 'Enact Level-2 fuel rationing on Maitri heating diesel.' },
    { label: '🛰️ Toggle Satcom', text: 'Simulate satellite blackout to test the offline queue.' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in select-none">
      {/* DRAWER CONTAINER */}
      <div className="w-full max-w-2xl bg-polar-950 border-l border-polar-800 flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
        {/* DRAWER HEADER */}
        <div className="p-4 border-b border-polar-800 bg-polar-900 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-sky-950 border border-polar-cyan flex items-center justify-center text-polar-cyan shadow-md">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-100 tracking-wider">HIMVEER AI TACTICAL CO-PILOT</h2>
                <span className={`px-2 py-0.5 rounded text-[9px] font-telemetry font-bold ${
                  keyStatus.configured
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500 shadow-sm'
                    : 'bg-amber-950 text-amber-300 border border-amber-500'
                }`}>
                  {keyStatus.configured ? `GROQ LIVE (${keyStatus.maskedKey})` : 'GROQ READY (SIMULATED)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-telemetry">
                Autonomous Logistics Optimization • Console Control Enabled • Groq LPU Powered
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowKeyModal(true)}
              className="p-1.5 rounded bg-polar-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-telemetry flex items-center space-x-1"
              title="Configure Groq API Key"
            >
              <Key className="w-3.5 h-3.5 text-polar-amber" />
              <span className="hidden sm:inline">Groq Key</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded bg-polar-950 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TELEMETRY CONTEXT BAR */}
        <div className="px-4 py-2 bg-polar-950/95 border-b border-polar-800 text-[10px] font-telemetry text-slate-400 flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            <Radio className="w-3.5 h-3.5 text-polar-cyan shrink-0" />
            <span className="truncate">
              Telemetry Linked: Maitri ({simulation.is_blizzard_active ? '-44°C BLIZZARD' : '-19°C'}) • Bharati (-14°C) • Satcom {satellite.status.toUpperCase()} ({satellite.bandwidth_kbps} kbps)
            </span>
          </div>
          <span className="text-polar-ice shrink-0">Day {Math.floor(simulation.expedition_day)} / {simulation.total_days}</span>
        </div>

        {/* CHAT MESSAGES AREA WITH RICH MARKDOWN */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={idx}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                {/* EXECUTED ACTION BADGE */}
                {!isUser && msg.executedAction && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-sky-950/70 border border-polar-cyan text-polar-cyan text-[11px] font-telemetry shadow-md animate-in fade-in">
                    <Zap className="w-3.5 h-3.5 text-polar-cyan animate-pulse" />
                    <span className="font-bold">⚡ CONSOLE ACTION EXECUTED:</span>
                    <span className="text-slate-200">{msg.executedAction.label}</span>
                  </div>
                )}

                {/* MESSAGE BODY */}
                <div
                  className={`p-4 rounded-lg leading-relaxed max-w-[96%] ${
                    isUser
                      ? 'bg-polar-cyan text-polar-950 font-medium rounded-br-none shadow-md'
                      : 'bg-polar-900 border border-polar-800 text-slate-200 rounded-bl-none shadow-lg'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap font-sans text-xs">{msg.content}</div>
                  ) : (
                    <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Headings
                          h1: ({ node, ...props }) => (
                            <h1 className="text-base font-bold text-slate-100 pb-1 border-b border-slate-700/60 mt-3 mb-2 flex items-center space-x-2" {...props} />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2 className="text-sm font-bold text-polar-cyan mt-3 mb-1.5" {...props} />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3 className="text-xs font-bold text-polar-ice mt-2 mb-1" {...props} />
                          ),
                          // Bold highlights
                          strong: ({ node, ...props }) => (
                            <strong className="font-bold text-polar-ice" {...props} />
                          ),
                          // High-contrast mission control table
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-3 rounded border border-slate-700 bg-polar-950 shadow-md">
                              <table className="min-w-full text-left text-[11px] border-collapse font-telemetry" {...props} />
                            </div>
                          ),
                          thead: ({ node, ...props }) => (
                            <thead className="bg-polar-850 text-polar-cyan border-b border-slate-700 uppercase font-bold text-[10px] tracking-wider" {...props} />
                          ),
                          th: ({ node, ...props }) => (
                            <th className="p-2 border border-slate-700/80 font-bold text-polar-cyan" {...props} />
                          ),
                          td: ({ node, ...props }) => (
                            <td className="p-2 border border-slate-800 text-slate-200 align-top" {...props} />
                          ),
                          tr: ({ node, ...props }) => (
                            <tr className="hover:bg-slate-900/60 even:bg-polar-900/40 transition-colors" {...props} />
                          ),
                          // Lists
                          ul: ({ node, ...props }) => (
                            <ul className="list-disc list-inside space-y-1 my-2 text-slate-300 pl-1" {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className="list-decimal list-inside space-y-1 my-2 text-slate-300 pl-1" {...props} />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="leading-relaxed" {...props} />
                          ),
                          // Blockquotes
                          blockquote: ({ node, ...props }) => (
                            <blockquote className="border-l-2 border-polar-cyan pl-3 py-1 my-2 text-slate-300 italic bg-sky-950/25 rounded-r" {...props} />
                          ),
                          // Code tags
                          code: ({ node, ...props }) => (
                            <code className="px-1.5 py-0.5 rounded bg-polar-950 text-polar-cyan font-telemetry text-[10px] border border-slate-800" {...props} />
                          ),
                          pre: ({ node, ...props }) => (
                            <pre className="p-3 rounded-lg bg-polar-950 text-slate-200 font-telemetry text-[11px] border border-slate-800 overflow-x-auto my-2" {...props} />
                          ),
                          p: ({ node, ...props }) => (
                            <p className="my-1.5 leading-relaxed" {...props} />
                          )
                        }}
                      >
                        {cleanMarkdown(msg.content)}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {!isUser && msg.model && (
                  <div className="text-[10px] font-telemetry text-slate-500 flex items-center space-x-1.5 pl-1">
                    <Zap className="w-3 h-3 text-polar-cyan" />
                    <span>Inference: {msg.model}</span>
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center space-x-2 text-slate-300 text-xs font-telemetry p-3 bg-polar-900/80 rounded-lg border border-slate-800 max-w-[85%] animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-polar-cyan" />
              <span>HIMVEER analyzing telemetry & evaluating operational commands...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* QUICK CONSOLE COMMAND SHORTCUTS */}
        <div className="px-4 py-2 border-t border-polar-800 bg-polar-900/50 space-y-1.5">
          <div className="text-[10px] font-telemetry text-slate-400 flex items-center justify-between">
            <span className="font-bold text-polar-cyan flex items-center space-x-1">
              <Zap className="w-3 h-3" />
              <span>1-CLICK CONSOLE CONTROL DIRECTIVES:</span>
            </span>
            <span className="text-slate-500">Autonomous Actions</span>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto text-[11px] font-telemetry pb-1">
            {quickConsoleActions.map((act, i) => (
              <button
                key={i}
                onClick={() => handleSend(act.text)}
                disabled={loading}
                className="px-2 py-1 rounded bg-sky-950/60 hover:bg-sky-900/80 text-polar-cyan border border-sky-700/60 shrink-0 font-bold transition-all shadow-sm"
              >
                {act.label}
              </button>
            ))}
          </div>
        </div>

        {/* QUICK DOMAIN PROMPTS */}
        <div className="px-4 py-2 border-t border-polar-800 bg-polar-900/20 flex items-center space-x-1.5 overflow-x-auto text-[11px] font-telemetry">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p.text)}
              disabled={loading}
              className="px-2.5 py-1 rounded bg-polar-950 hover:bg-slate-800 text-slate-300 border border-slate-800 shrink-0 transition-all hover:border-slate-700"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* INPUT FORM */}
        <div className="p-3 border-t border-polar-800 bg-polar-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask logistics advice or instruct HIMVEER (e.g. 'Inject blizzard at Maitri', 'Switch to cargo')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 bg-polar-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-polar-cyan transition-all font-sans"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className={`p-2.5 rounded-lg font-bold text-polar-950 transition-all ${
                input.trim() && !loading
                  ? 'bg-polar-cyan hover:bg-sky-400 shadow-md'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* GROQ API KEY CONFIGURATION MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 z-60 bg-black/75 flex items-center justify-center p-4">
          <form onSubmit={handleSaveApiKey} className="polar-card p-6 max-w-md w-full space-y-4 border-polar-cyan shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Key className="w-4 h-4 text-polar-amber" />
                <span>Configure Groq API Key</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Integrate your personal **Groq API Key** (<code className="text-polar-cyan">gsk_...</code>) for live, ultra-fast LPU polar tactical inference.
            </p>

            {saveMessage && (
              <div className="p-2.5 rounded bg-emerald-950/70 border border-emerald-500 text-emerald-300 text-xs font-telemetry">
                {saveMessage}
              </div>
            )}

            <div>
              <label className="text-slate-400 block text-xs mb-1 font-semibold">Groq API Key:</label>
              <input
                type="password"
                required
                placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxx"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full bg-polar-950 border border-slate-800 rounded p-2.5 text-slate-200 text-xs font-mono focus:border-polar-cyan focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block font-telemetry">
                Current status: {keyStatus.configured ? `Active (${keyStatus.maskedKey})` : 'Not configured'}
              </span>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded bg-polar-cyan text-polar-950 font-bold hover:bg-sky-400 text-xs font-telemetry shadow-md"
              >
                Save & Connect Groq
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
