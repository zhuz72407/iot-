
import React, { useState, useRef, useEffect } from 'react';
import { 
  UserSearch, 
  Activity, 
  TrendingUp, 
  MessageSquare, 
  Layers, 
  FileUp, 
  Zap, 
  Send, 
  Loader2, 
  History, 
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Network
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

type SccModule = 'USER' | 'NETWORK' | 'PREDICT' | 'QA' | 'MULTI' | 'OFFLINE';

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

export const SccAssistant: React.FC = () => {
  const [activeModule, setActiveModule] = useState<SccModule>('USER');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  // Input states
  const [userPhone, setUserPhone] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [indicatorName, setIndicatorName] = useState('');
  const [qaInput, setQaInput] = useState('');
  const [qaHistory, setQaHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [qaHistory]);

  const modules = [
    { id: 'USER', label: '用户质差诊断', icon: UserSearch, desc: '指定号码与时间分析' },
    { id: 'NETWORK', label: '网络质差诊断', icon: Activity, desc: '指标异常时间分析' },
    { id: 'PREDICT', label: '质差主动预测', icon: TrendingUp, desc: '大小模型结合识别' },
    { id: 'QA', label: '知识问答', icon: MessageSquare, desc: 'SCC专有知识库' },
    { id: 'MULTI', label: '多维度诊断', icon: Layers, desc: '信令流程/APN对象' },
    { id: 'OFFLINE', label: '离线数据分析', icon: FileUp, desc: '上传附件发现质差' }
  ];

  const handleDiagnosis = async (prompt: string) => {
    setIsProcessing(true);
    setResult(null);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction: "你是一个专业的车联网(SCC)质差诊断助手。请基于专业术语进行详细分析。" }
      });
      setResult(response.text || "诊断失败，请重试。");
    } catch (e) {
      setResult("诊断服务异常，请检查网络连接。");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQaSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!qaInput.trim() || isProcessing) return;

    const query = qaInput;
    setQaInput('');
    setQaHistory(prev => [...prev, { role: 'user', text: query }]);
    setIsProcessing(true);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: { systemInstruction: "你是一个SCC(车联网)产品与技术专家。请结合历史案例、车联信令流程、终端APN配置等知识回答。" }
      });
      setQaHistory(prev => [...prev, { role: 'ai', text: response.text || "抱歉，我暂时无法回答。" }]);
    } catch (e) {
      setQaHistory(prev => [...prev, { role: 'ai', text: "知识库连接超时。" }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderContent = () => {
    switch (activeModule) {
      case 'USER':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">用户号码 (MSISDN/ICCID)</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" 
                    placeholder="输入11位号码或20位ICCID"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">投诉时间点</label>
                <input 
                  type="datetime-local" 
                  value={incidentTime}
                  onChange={(e) => setIncidentTime(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" 
                />
              </div>
            </div>
            <button 
              onClick={() => handleDiagnosis(`分析车联网用户 ${userPhone} 在 ${incidentTime} 的质差原因。请从核心网切片、基站覆盖、终端信号强度三方面模拟诊断结果。`)}
              disabled={isProcessing || !userPhone || !incidentTime}
              className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-700 transition disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              开始用户质差一键诊断
            </button>
          </div>
        );
      case 'NETWORK':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">指标名称</label>
                <div className="relative">
                  <Network className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <select 
                    value={indicatorName}
                    onChange={(e) => setIndicatorName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
                  >
                    <option value="">选择监控指标</option>
                    <option value="ATTACH_SUCCESS">附着成功率</option>
                    <option value="PDP_ACT_SUCCESS">PDP激活成功率</option>
                    <option value="PING_LATENCY">业务时延 (ms)</option>
                    <option value="THROUGHPUT">吞吐量 (Mbps)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">异常观测时间段</label>
                <input 
                  type="datetime-local" 
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" 
                />
              </div>
            </div>
            <button 
              onClick={() => handleDiagnosis(`分析网络指标 ${indicatorName} 的质差原因。请提供异常趋势图描述及疑似故障网元分析。`)}
              disabled={isProcessing || !indicatorName}
              className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-700 transition disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
              执行网络健康度专项检查
            </button>
          </div>
        );
      case 'PREDICT':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-900">主动质差预测模式</p>
                <p className="text-xs text-amber-700">基于“大模型推理+小模型回归”双驱动模式，正扫描未来2小时内可能出现的网络质差波动。</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { area: '上海浦东', prob: '82%', level: '高危', msg: '基站扩容不足', icon: AlertTriangle },
                { area: '北京朝阳', prob: '45%', level: '中度', msg: '偶发性时延增大', icon: History },
                { area: '深圳南山', prob: '12%', level: '健康', msg: '运行平稳', icon: ShieldCheck },
              ].map((p, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-400">{p.area}</span>
                    <p.icon className={`w-4 h-4 ${p.level === '高危' ? 'text-red-500' : p.level === '中度' ? 'text-amber-500' : 'text-emerald-500'}`} />
                  </div>
                  <div className="text-2xl font-bold text-slate-800 mb-1">{p.prob}</div>
                  <div className="text-[10px] text-slate-500 font-medium">预测风险概率</div>
                  <div className="mt-3 pt-3 border-t border-slate-50 text-xs font-bold text-slate-700">{p.msg}</div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => handleDiagnosis("根据当前全网车联网运行趋势，预测接下来的高风险投诉区域，并提供预防性调优方案。")}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
            >
              生成全局预防性调优建议
            </button>
          </div>
        );
      case 'QA':
        return (
          <div className="flex flex-col h-[500px]">
             <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-50 rounded-xl border mb-4">
                {qaHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm">咨询关于车联网信令、APN配置或历史案例...</p>
                  </div>
                )}
                {qaHistory.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                      m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
                    }`}>
                      {m.role === 'ai' ? (
                        <div className="markdown-body prose prose-sm">
                          <ReactMarkdown>{m.text}</ReactMarkdown>
                        </div>
                      ) : m.text}
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-2">
                       <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                       <span className="text-xs text-slate-400">思考中...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
             </div>
             <form onSubmit={handleQaSend} className="relative">
                <input 
                  type="text" 
                  value={qaInput}
                  onChange={(e) => setQaInput(e.target.value)}
                  placeholder="请输入您的技术疑问..."
                  className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                />
                <button 
                  type="submit"
                  disabled={isProcessing || !qaInput.trim()}
                  className="absolute right-2 top-2 p-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
             </form>
          </div>
        );
      case 'MULTI':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800">信令流程维度</h4>
                  <div className="space-y-2">
                    {['S1-MME 建立', 'X2 切换', 'TAU 更新', 'PDP 激活/去激活'].map(sig => (
                      <label key={sig} className="flex items-center gap-2 p-3 bg-white border rounded-xl hover:border-brand-300 cursor-pointer transition">
                         <input type="checkbox" className="w-4 h-4 text-brand-600" />
                         <span className="text-sm">{sig}</span>
                      </label>
                    ))}
                  </div>
               </div>
               <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800">APN 对象维度</h4>
                  <div className="space-y-2">
                    {['OTA 业务 APN', '车主服务 APN', '多媒体娱乐 APN', '高精地图 APN'].map(apn => (
                      <label key={apn} className="flex items-center gap-2 p-3 bg-white border rounded-xl hover:border-brand-300 cursor-pointer transition">
                         <input type="radio" name="apn" className="w-4 h-4 text-brand-600" />
                         <span className="text-sm">{apn}</span>
                      </label>
                    ))}
                  </div>
               </div>
            </div>
            <button 
              onClick={() => handleDiagnosis("针对选定的信令流程与APN维度，开展多维度关联分析，查找深层次互联互通瓶颈。")}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition"
            >
              <Layers className="w-5 h-5" />
              启动多维下钻分析
            </button>
          </div>
        );
      case 'OFFLINE':
        return (
          <div className="space-y-6">
             <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-colors group cursor-pointer">
                <FileUp className="w-12 h-12 text-slate-300 group-hover:text-brand-500 mb-4 transition-colors" />
                <p className="font-bold text-slate-700">拖拽文件或点击上传</p>
                <p className="text-xs text-slate-400 mt-2">支持 .pcap, .xlsx, .csv 格式 (单文件 {'<'} 50MB)</p>
             </div>
             <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">最近分析</h4>
                {[
                  { name: '20241024_浦东断连信令.pcap', date: '2小时前', status: '完成' },
                  { name: 'VIP用户投诉详单_Q3.xlsx', date: '昨天', status: '完成' }
                ].map((f, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileUp className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{f.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-slate-400">{f.date}</span>
                      <span className="text-emerald-600 font-bold">{f.status}</span>
                    </div>
                  </div>
                ))}
             </div>
             <button className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold">全量离线质差提取</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Zap className="w-8 h-8 text-brand-500" />
            SCC 车联网质差诊断助手
          </h2>
          <p className="text-slate-500 mt-2">面向车企 IoT 的全栈式智能诊断工具箱</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-100 px-3 py-1 rounded-full border">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          SCC PRO V3.1 ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Module Nav */}
        <div className="xl:col-span-1 space-y-2">
          {modules.map(mod => (
            <button
              key={mod.id}
              onClick={() => {
                setActiveModule(mod.id as SccModule);
                setResult(null);
              }}
              className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all border text-left ${
                activeModule === mod.id 
                  ? 'bg-white border-brand-500 shadow-lg shadow-brand-100 ring-1 ring-brand-500' 
                  : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
              }`}
            >
              <div className={`p-2 rounded-xl ${activeModule === mod.id ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                <mod.icon className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-sm font-bold ${activeModule === mod.id ? 'text-brand-900' : 'text-slate-700'}`}>{mod.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{mod.desc}</div>
              </div>
              {activeModule === mod.id && <ChevronRight className="w-4 h-4 ml-auto self-center text-brand-500" />}
            </button>
          ))}
        </div>

        {/* Action & Result */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[400px]">
            <div className="mb-6 flex items-center justify-between border-b pb-4">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 {modules.find(m => m.id === activeModule)?.label}
               </h3>
               <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-md text-slate-500 font-bold uppercase tracking-widest">
                 Working Area
               </span>
            </div>
            
            {renderContent()}

            {result && (
              <div className="mt-8 p-6 bg-brand-50/50 rounded-2xl border border-brand-100 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-brand-500 rounded flex items-center justify-center">
                    <SparklesIcon className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="font-bold text-brand-900 text-sm">智能诊断报告</h4>
                </div>
                <div className="prose prose-sm prose-brand max-w-none prose-p:text-slate-700 prose-headings:text-brand-900 leading-relaxed">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
