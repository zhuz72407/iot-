
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { 
  Users, Activity, MapPin, Smartphone, ShieldCheck, Clock, 
  Zap, Globe, MousePointer2, HeartPulse, TrendingUp, AlertTriangle, RefreshCw
} from 'lucide-react';

// --- DATA CONSTANTS ---

const BUSINESS_PLANNING = {
  trafficPeak: '17:00 - 18:00',
  userPeak: '18:00 - 19:00',
  apnRatio: [
    { name: 'CMMTM5GVL1 (数据)', value: 65.5 },
    { name: 'CMMTM5GVL2 (娱乐)', value: 34.5 },
  ],
  hourlyTrend: [
    { time: '08:00', traffic: 110, users: 4200 },
    { time: '10:00', traffic: 95, users: 3800 },
    { time: '12:00', traffic: 105, users: 4000 },
    { time: '14:00', traffic: 120, users: 4500 },
    { time: '16:00', traffic: 140, users: 4900 },
    { time: '17:30', traffic: 185, users: 5200 },
    { time: '18:30', traffic: 160, users: 6100 },
    { time: '20:00', traffic: 130, users: 4500 },
  ]
};

const REGIONAL_DIST = [
  { name: '苏州', traffic: 6500, ratio5G: 75 },
  { name: '无锡', traffic: 3800, ratio5G: 72 },
  { name: '常州', traffic: 2800, ratio5G: 45 }, // 常州4G占比较高
  { name: '南京', traffic: 2600, ratio5G: 68 },
  { name: '南通', traffic: 1900, ratio5G: 70 },
  { name: '淮安', traffic: 1100, ratio5G: 65 },
];

const TERMINAL_DATA = [
  { name: 'QUECTEL (移远)', value: 92, models: 'AG550Q-CN, AG552Q' },
  { name: 'CISZMOD (中云信安)', value: 8, models: 'ZX600' },
];

const PROTOCOL_DATA = [
  { name: 'TCP', value: 94.8 },
  { name: 'UDP', value: 4.2 },
  { name: 'ICMP', value: 1.0 },
];

const QUALITY_KPI = [
  { subject: 'TCP成功率', A: 99.7, full: 100 },
  { subject: 'DNS成功率', A: 99.2, full: 100 },
  { subject: 'HTTP成功率', A: 98.9, full: 100 },
  { subject: 'TCP时延', A: 85, full: 100 }, // 32ms is good
  { subject: 'HTTP时延', A: 30, full: 100 }, // 290ms is bad
];

const MOBILITY_DATA = [
  { time: '00:00', weekday: 1.2, weekend: 1.0 },
  { time: '04:00', weekday: 0.8, weekend: 0.7 },
  { time: '07:30', weekday: 4.2, weekend: 1.5 }, // Weekday morning peak
  { time: '11:30', weekday: 2.5, weekend: 3.8 }, // Weekend morning peak
  { time: '17:30', weekday: 3.5, weekend: 3.2 }, // Evening peak
  { time: '21:00', weekday: 1.5, weekend: 2.0 },
];

const ONLINE_BEHAVIOR = [
  { name: 'VoIP (Skype)', duration: 220 },
  { name: '社交 (Instagram)', duration: 135 },
  { name: '游戏 (LOL)', duration: 280 },
  { name: '会议 (Zoom)', duration: 195 },
  { name: '导航 (AutoNavi)', duration: 56 },
];

const INTERACTION_MODEL = [
  { type: 'TCP上行', size: 554 },
  { type: 'TCP下行', size: 590 },
  { type: 'MQTT上行', size: 122 },
  { type: 'MQTT下行', size: 69 },
];

const HABITS_DATA = [
  { name: '百度服务', apn1: 54, apn2: 12 },
  { name: '高德地图', apn1: 4.5, apn2: 9.1 },
  { name: 'QQ音乐', apn1: 3.9, apn2: 7.0 },
  { name: '爱奇艺', apn1: 1.7, apn2: 3.2 },
  { name: '抖音', apn1: 1.6, apn2: 4.4 },
];

const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

const TABS = [
  { id: 'business', label: '业务规划', icon: TrendingUp },
  { id: 'regional', label: '地域分布', icon: MapPin },
  { id: 'terminal', label: '终端类型', icon: Smartphone },
  { id: 'protocol', label: '数传协议', icon: Globe },
  { id: 'quality', label: '数传质量', icon: ShieldCheck },
  { id: 'signaling', label: '信令行为', icon: Zap },
  { id: 'mobility', label: '移动行为', icon: MousePointer2 },
  { id: 'online', label: '在线行为', icon: Activity },
  { id: 'interaction', label: '交互模型', icon: HeartPulse },
  { id: 'habits', label: '行为习惯', icon: Users },
];

export const UserProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState('business');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // State for dynamic data
  const [businessTrend, setBusinessTrend] = useState(BUSINESS_PLANNING.hourlyTrend);
  const [regionalDist, setRegionalDist] = useState(REGIONAL_DIST);
  const [qualityKpi, setQualityKpi] = useState(QUALITY_KPI);
  const [mobilityData, setMobilityData] = useState(MOBILITY_DATA);

  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Simulate data fetch and randomization
    setTimeout(() => {
      // Randomize Business Trend
      setBusinessTrend(prev => prev.map(item => ({
        ...item,
        traffic: Math.floor(item.traffic * (0.95 + Math.random() * 0.1)),
        users: Math.floor(item.users * (0.98 + Math.random() * 0.04))
      })));

      // Randomize Regional Distribution
      setRegionalDist(prev => prev.map(item => ({
        ...item,
        traffic: Math.floor(item.traffic * (0.9 + Math.random() * 0.2)),
        ratio5G: Math.min(100, Math.max(0, item.ratio5G + (Math.random() * 4 - 2)))
      })));

      // Randomize Quality KPI
      setQualityKpi(prev => prev.map(item => ({
        ...item,
        A: Math.min(100, Math.max(20, item.A + (Math.random() * 2 - 1)))
      })));

      // Randomize Mobility Data
      setMobilityData(prev => prev.map(item => ({
        ...item,
        weekday: Number((item.weekday * (0.95 + Math.random() * 0.1)).toFixed(1)),
        weekend: Number((item.weekend * (0.95 + Math.random() * 0.1)).toFixed(1))
      })));

      setIsRefreshing(false);
      setLastUpdated(new Date());
    }, 1000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 60000); // Auto refresh every 60 seconds
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'business':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-sm font-bold text-slate-400 uppercase mb-4">流量与用户趋势 (24h)</h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={businessTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" hide />
                      <YAxis yAxisId="right" orientation="right" hide />
                      <Tooltip />
                      <Area yAxisId="left" type="monotone" dataKey="traffic" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.1} strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-brand-500 rounded-full"></div> 流量峰值: {BUSINESS_PLANNING.trafficPeak}</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-indigo-500 rounded-full"></div> 用户峰值: {BUSINESS_PLANNING.userPeak}</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-sm font-bold text-slate-400 uppercase mb-4">APN 流量占比</h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={BUSINESS_PLANNING.apnRatio} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {BUSINESS_PLANNING.apnRatio.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        );
      case 'regional':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-400 uppercase mb-6">江苏省内各地市流量与 5G 占比</h4>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionalDist}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="traffic" name="总流量 (GB)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ratio5G" name="5G 占比 (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <strong>异常发现:</strong> 常州与宿迁地市 4G 流量占比异常偏高，建议排查该区域 5G 深度覆盖及 SIM 卡签约状态。
                </p>
              </div>
            </div>
          </div>
        );
      case 'terminal':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
              <h4 className="text-sm font-bold text-slate-400 uppercase mb-8 w-full text-left">终端品牌分布</h4>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={TERMINAL_DATA} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                      <Cell fill="#0ea5e9" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2 w-full">
                {TERMINAL_DATA.map((t, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-bold text-slate-700">{t.name}</span>
                    <span className="text-brand-600 font-mono font-bold">{t.value}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl flex flex-col justify-center">
              <h4 className="text-brand-400 font-bold text-xs uppercase tracking-widest mb-4">典型终端型号</h4>
              <div className="space-y-6">
                <div>
                  <div className="text-2xl font-bold">AG550Q-CN</div>
                  <div className="text-slate-400 text-sm mt-1">移远通信 (QUECTEL) 车规级 5G 模块</div>
                  <div className="mt-3 flex gap-2">
                    <span className="px-2 py-1 bg-white/10 rounded text-[10px] uppercase font-bold">5G NR</span>
                    <span className="px-2 py-1 bg-white/10 rounded text-[10px] uppercase font-bold">C-V2X</span>
                    <span className="px-2 py-1 bg-white/10 rounded text-[10px] uppercase font-bold">GNSS</span>
                  </div>
                </div>
                <div className="h-px bg-white/10 w-full"></div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  现网 TOP5 IMEI_TAC 用户占比超过 99.8%，全部为车载模组，体现了极高的终端集中度。
                </p>
              </div>
            </div>
          </div>
        );
      case 'protocol':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-sm font-bold text-slate-400 uppercase mb-6">传输层协议流量分布</h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={PROTOCOL_DATA} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-brand-600 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-center">
                <h4 className="text-white/60 font-bold text-xs uppercase mb-4">应用层特征</h4>
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">95%</div>
                    <div className="text-white/80 text-xs">HTTPS 请求占比</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">99.6%</div>
                    <div className="text-white/80 text-xs">TOP5 DNS 请求占比</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'quality':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-400 uppercase mb-8">数传质量多维评估 (KPI)</h4>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={qualityKpi}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 12}} />
                    <Radar name="当前指标" dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.5} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-400 font-bold">TCP 建链时延</div>
                  <div className="text-xl font-bold text-slate-900">32.8 ms</div>
                  <div className="text-[10px] text-emerald-600 font-bold uppercase mt-1">正常</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-400 font-bold">DNS 响应时延</div>
                  <div className="text-xl font-bold text-slate-900">8.0 ms</div>
                  <div className="text-[10px] text-emerald-600 font-bold uppercase mt-1">正常</div>
                </div>
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="text-xs text-red-400 font-bold">HTTP 响应时延</div>
                  <div className="text-xl font-bold text-red-600">290.7 ms</div>
                  <div className="text-[10px] text-red-600 font-bold uppercase mt-1">异常</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-400 font-bold">内部丢包率</div>
                  <div className="text-xl font-bold text-slate-900">0.042%</div>
                  <div className="text-[10px] text-emerald-600 font-bold uppercase mt-1">正常</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'signaling':
        return (
          <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Zap className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">信令行为分析</h3>
            <p className="text-slate-500 max-w-md">
              当前试点环境缺少全量 CHR 或话统数据支撑，暂无法开展深度信令面分析。
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-lg">
              {['注册请求', 'PDU会话建立', '业务请求', '切换/互操作'].map((item, i) => (
                <div key={i} className="p-4 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm font-medium">
                  {item} (待接入)
                </div>
              ))}
            </div>
          </div>
        );
      case 'mobility':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-400 uppercase mb-6">单用户覆盖 ECGI 数量趋势 (移动性)</h4>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mobilityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="weekday" name="工作日" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="weekend" name="周末" stroke="#ec4899" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="text-xs text-blue-600 font-bold uppercase mb-1">工作日规律</div>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    移动性高峰出现在 7:00-8:00 (上班) 和 17:00-18:00 (下班)。
                  </p>
                </div>
                <div className="p-4 bg-pink-50 rounded-xl border border-pink-100">
                  <div className="text-xs text-pink-600 font-bold uppercase mb-1">周末规律</div>
                  <p className="text-sm text-pink-800 leading-relaxed">
                    上午高峰延后至 11:00-12:00，体现了明显的休闲出行特征。
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'online':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-400 uppercase mb-6">典型应用业务持续时长 (秒)</h4>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ONLINE_BEHAVIOR} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} />
                    <Tooltip />
                    <Bar dataKey="duration" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 p-4 bg-slate-50 rounded-xl text-sm text-slate-600 leading-relaxed">
                <strong>分析结论:</strong> TCP 平均持续时长 26s，UDP 28s。游戏与在线会议类应用具有最长的单次会话持续时间，对网络稳定性要求极高。
              </div>
            </div>
          </div>
        );
      case 'interaction':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-sm font-bold text-slate-400 uppercase mb-6">报文平均包长 (Bytes)</h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={INTERACTION_MODEL}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="type" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="size" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl">
                <h4 className="text-brand-400 font-bold text-xs uppercase tracking-widest mb-6">MQTT 协议深度画像</h4>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-brand-400 font-bold text-xl">5.3s</div>
                    <div>
                      <div className="text-sm font-bold">平均流持续时长</div>
                      <div className="text-xs text-slate-400">符合短连接特征</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-brand-400 font-bold text-xl">15s</div>
                    <div>
                      <div className="text-sm font-bold">周期性心跳</div>
                      <div className="text-xs text-slate-400">TOP 用户交互周期</div>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      理想车企 MQTT 使用比例极低，平均每小时仅 2.2 人在线，主要用于车机保活与基础指令下发。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'habits':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-400 uppercase mb-6">双 APN 应用偏好对比 (流量占比 %)</h4>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={HABITS_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="apn1" name="CMMTM5GVL1 (导航/基础)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="apn2" name="CMMTM5GVL2 (娱乐/多媒体)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-400">APN1 核心特征</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    以导航业务 (百度/高德) 为主，保障车辆通信与出行安全。TOP1 服务器位于山东，99.9% 流量为导航相关。
                  </p>
                </div>
                <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                    <span className="text-xs font-bold uppercase tracking-widest text-rose-400">APN2 核心特征</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    以车载娱乐 (QQ音乐/爱奇艺/抖音) 为主。80% 的服务器部署在江苏本地或周边，业务规划合理。
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-1 bg-brand-100 text-brand-700 text-[10px] font-bold rounded uppercase tracking-wider">试点项目报告</div>
            <div className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase tracking-wider">数据周期: 2025-05</div>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">理想车企用户画像</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-500 font-medium">基于江苏移动车联网试点项目全量数据挖掘</p>
            <div className="h-4 w-px bg-slate-300 mx-1"></div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              最后更新: {lastUpdated.toLocaleTimeString()}
            </div>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-1.5 rounded-lg hover:bg-slate-200 transition-all ${isRefreshing ? 'animate-spin text-brand-500' : 'text-slate-400'}`}
              title="手动刷新数据"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">平均每小时流量</div>
            <div className="text-2xl font-black text-brand-600">150 GB+</div>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">活跃用户数</div>
            <div className="text-2xl font-black text-brand-600">5000+</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-200/50 rounded-2xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-brand-500' : 'text-slate-400'}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="min-h-[500px]">
        {renderContent()}
      </div>

      {/* Footer Insights */}
      <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[100px] rounded-full"></div>
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            核心洞察与后续建议
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="text-brand-400 font-black uppercase text-xs tracking-[0.2em]">网络演进</div>
              <p className="text-slate-400 text-sm leading-relaxed">
                5G 流量占比已达 70%，但常州等地市 4G 占比仍较高。应持续优化深度覆盖盲区，提升全时段 5G 在线率。
              </p>
            </div>
            <div className="space-y-4">
              <div className="text-brand-400 font-black uppercase text-xs tracking-[0.2em]">质量预警</div>
              <p className="text-slate-400 text-sm leading-relaxed">
                HTTP 平均响应时延 (290.7ms) 显著高于基准值，主要受 CMMTM5GVL2 业务影响，需针对 SP 侧进行专项优化。
              </p>
            </div>
            <div className="space-y-4">
              <div className="text-brand-400 font-black uppercase text-xs tracking-[0.2em]">业务规划</div>
              <p className="text-slate-400 text-sm leading-relaxed">
                流量峰值出现在 17:00-19:00。建议后续大版本 OTA 推送采用分批次下发策略，降低单时段链路峰值负载。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
