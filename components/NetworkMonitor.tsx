
import React, { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar,
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Monitor,
} from 'lucide-react';

// Specialized mock data for Ideal Car segments/regions
const lineData = [
  { time: '01/11 10:15', users: 45, terminal: 88, collect: 92, timely: 90 },
  { time: '01/12 10:15', users: 50, terminal: 85, collect: 90, timely: 88 },
  { time: '01/13 10:15', users: 80, terminal: 82, collect: 94, timely: 92 },
  { time: '01/14 10:15', users: 95, terminal: 90, collect: 98, timely: 96 },
  { time: '01/15 10:15', users: 65, terminal: 84, collect: 92, timely: 89 },
  { time: '01/16 10:15', users: 60, terminal: 86, collect: 93, timely: 91 },
  { time: '01/17 10:15', users: 55, terminal: 89, collect: 95, timely: 93 },
];

const barData = [
  { name: '北京研发中心', users: 85, traffic: 72 },
  { name: '上海交付中心', users: 92, traffic: 88 },
  { name: '常州制造基地', users: 78, traffic: 95 },
  { name: '广州服务中心', users: 64, traffic: 58 },
];

const stats = [
  { label: '理想车企总用户数', value: '1,289,573', change: '+2.3%', up: true, color: '#00f2ff' },
  { label: '在线终端数', value: '1,135,672', change: '+5.2%', up: true, color: '#00ff9d' },
  { label: '正常运行基地/总基地', value: '12 / 12', change: '100%', up: true, color: '#ffea00' },
  { label: '待处理告警数', value: '3', change: '-40%', up: false, color: '#ff3d3d' },
];

const abnormalEvents = [
  { company: '理想汽车 (常州基地)', desc: '生产线专用APN心跳检测异常, 当前时延 150ms, 阈值 50ms', time: '2025/8/24 17:25:00' },
  { company: '理想汽车 (上海交付)', desc: 'OTA升级服务器下载速率波动, 低于正常边界值(50Mbps)20%', time: '2025/8/24 17:10:00' },
  { company: '理想汽车 (北京中心)', desc: '高精地图下发APN响应成功率下降至 94.5%', time: '2025/8/24 16:45:00' },
];

const SectionHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
  <div className="flex items-center justify-center gap-4 mb-4 relative">
    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
    <div className="flex flex-col items-center">
       <div className="text-[10px] text-cyan-400/60 tracking-[0.3em] font-mono mb-0.5">:::::::::::::: {subtitle || "IDEAL CAR MONITORING"} ::::::::::::::</div>
       <h3 className="text-sm font-bold text-white tracking-widest">{title}</h3>
    </div>
    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
  </div>
);

interface MonitorCardProps {
  children: React.ReactNode;
  className?: string;
}

const MonitorCard: React.FC<MonitorCardProps> = ({ children, className }) => (
  <div className={`bg-[#051125]/80 backdrop-blur-md border border-cyan-500/20 rounded-lg p-4 relative overflow-hidden group shadow-[0_0_20px_rgba(0,180,216,0.1)] ${className}`}>
    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400"></div>
    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400"></div>
    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400"></div>
    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400"></div>
    {children}
  </div>
);

export const NetworkMonitor: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#020817] text-slate-200 p-6 font-sans relative overflow-hidden">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="relative mb-8 flex items-center justify-between">
         <div className="flex flex-col">
            <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-400 tracking-tighter">
              理想车企 · 移动网络专线监控大屏
            </h1>
            <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-transparent mt-1"></div>
         </div>
         <div className="text-right font-mono text-cyan-400 text-sm">
           <span className="opacity-60 mr-4 tracking-widest uppercase">Ideal Auto Network Control</span>
           <span className="tracking-widest">{now.toLocaleDateString()} {now.toLocaleTimeString([], { hour12: false })}</span>
         </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <MonitorCard key={i} className="flex flex-col justify-between">
            <div>
               <div className="flex items-center justify-between mb-2">
                 <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{stat.label}</span>
                 <div className={`flex items-center text-[10px] font-bold ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>
                   {stat.up ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                   {stat.change}
                 </div>
               </div>
               <div className="text-2xl font-black text-white" style={{ color: stat.color }}>{stat.value}</div>
            </div>
            <div className="h-8 w-full mt-4 flex items-end gap-0.5 opacity-30">
               {[40, 60, 45, 80, 50, 70, 90, 65].map((h, idx) => (
                 <div key={idx} className="flex-1 bg-cyan-500 rounded-t-sm" style={{ height: `${h}%` }}></div>
               ))}
            </div>
          </MonitorCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MonitorCard className="h-80">
          <SectionHeader title="理想车企终端在线趋势" />
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#051125', borderColor: '#0ea5e9', fontSize: '10px', color: '#fff' }} />
                <Line type="monotone" dataKey="users" stroke="#00f2ff" strokeWidth={3} dot={{ fill: '#00f2ff', r: 3 }} activeDot={{ r: 5, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </MonitorCard>

        <MonitorCard className="h-80">
          <SectionHeader title="核心基地/中心流量分布" />
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#051125', borderColor: '#0ea5e9', fontSize: '10px' }} />
                <Bar dataKey="users" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="traffic" fill="#00ff9d" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </MonitorCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MonitorCard className="h-80 overflow-hidden">
          <SectionHeader title="理想车企内部核心业务监控" />
          <div className="space-y-6 mt-4 px-2">
             <div>
                <div className="text-[10px] text-cyan-400 font-bold mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div> 智能座舱业务 (Smart Cabin)
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">车载多媒体流服务</span>
                    <div className="flex items-center gap-4">
                      <span className="text-cyan-400 font-mono">成功率: 99.8%</span>
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 w-[99.8%]"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">语音助手云端交互</span>
                    <div className="flex items-center gap-4">
                      <span className="text-cyan-400 font-mono">响应率: 99.2%</span>
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 w-[99.2%]"></div>
                      </div>
                    </div>
                  </div>
                </div>
             </div>
             <div>
                <div className="text-[10px] text-emerald-400 font-bold mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> 自动驾驶与OTA (AD & OTA)
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">高精地图下发专线</span>
                    <div className="flex items-center gap-4">
                      <span className="text-emerald-400 font-mono">准时率: 98.5%</span>
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[98.5%]"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">固件包推送服务</span>
                    <div className="flex items-center gap-4">
                      <span className="text-emerald-400 font-mono">完成率: 97.4%</span>
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[97.4%]"></div>
                      </div>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </MonitorCard>

        <MonitorCard className="h-80 overflow-y-auto">
          <SectionHeader title="理想车企实时异常日志" />
          <div className="mt-4 space-y-4 px-2">
            {abnormalEvents.map((event, i) => (
              <div key={i} className="flex justify-between items-start border-b border-slate-800 pb-3 last:border-0">
                <div className="flex-1 mr-4">
                   <div className="text-xs font-bold text-white mb-1">{event.company}</div>
                   <div className="text-[10px] text-slate-400 leading-relaxed">{event.desc}</div>
                </div>
                <div className="text-[10px] font-mono text-cyan-500/80 shrink-0">{event.time}</div>
              </div>
            ))}
          </div>
        </MonitorCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonitorCard className="h-80">
          <SectionHeader title="智能座舱 · 网络质量监控" subtitle="SMART CABIN QOS" />
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#051125', borderColor: '#0ea5e9', fontSize: '10px' }} />
                <Line type="monotone" dataKey="terminal" name="连接稳定性" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="collect" name="协议成功率" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="timely" name="响应及时率" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </MonitorCard>

        <MonitorCard className="h-80">
          <SectionHeader title="自动驾驶 · 网络质量监控" subtitle="AUTOPILOT QOS" />
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#051125', borderColor: '#0ea5e9', fontSize: '10px' }} />
                <Line type="monotone" dataKey="terminal" name="专线可用性" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="collect" name="报文交付率" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="timely" name="超低时延占比" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </MonitorCard>
      </div>
    </div>
  );
};
