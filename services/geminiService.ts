
import { GoogleGenAI } from "@google/genai";
import { Ticket, Diagnosis, KnowledgeCase, Urgency, Role } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to format KB data for context
const formatContext = (tickets: Ticket[], manualCases: KnowledgeCase[]): string => {
  let context = "";
  
  // Add a few manual cases
  if (manualCases.length > 0) {
    context += "--- 参考知识库案例 ---\n";
    manualCases.slice(0, 3).forEach(c => {
      context += `案例标题: ${c.title}\n故障描述: ${c.description}\n解决方案: ${c.solution}\n\n`;
    });
  }

  // Add a few archived tickets
  const archived = tickets.filter(t => t.aiAnalysis).slice(0, 3);
  if (archived.length > 0) {
    context += "--- 历史已处理工单 ---\n";
    archived.forEach(t => {
      context += `工单标题: ${t.title}\n处理分析: ${t.aiAnalysis}\n\n`;
    });
  }

  return context;
};

export const analyzeTicketFault = async (
  ticket: Ticket, 
  historyTickets: Ticket[] = [], 
  manualCases: KnowledgeCase[] = []
): Promise<string> => {
  const diagnosesText = ticket.diagnoses
    .map(d => `- ${d.specialistRole} (${d.specialistName}): ${d.content}`)
    .join('\n');

  const contextData = formatContext(historyTickets, manualCases);

  const prompt = `
    你是一个协助客响班处理物联网工单的电信专家AI助手。
    
    【参考知识库与历史案例】
    ${contextData ? contextData : "暂无相关历史案例。"}
    
    【当前待处理工单信息】
    工单号: ${ticket.id}
    标题: ${ticket.title}
    描述: ${ticket.description}
    紧急程度: ${ticket.urgency}
    
    【专业班组诊断意见】
    ${diagnosesText || "暂无专业班组诊断。"}
    
    任务:
    1. **引用参考案例**：请仔细阅读提供的【参考知识库与历史案例】。如果其中包含与当前工单相似的故障，请在分析报告中**明确引用该案例的标题**，并指出其相似之处。
    2. **借鉴解决方案**：重点参考相似案例中的“解决方案”或“处理分析”字段。如果适用，请将这些经过验证的解决步骤应用到当前工单的建议中。
    3. 综合生成一份供“客响班”和“理想IT人员/前台支撑人员”查看的“最终处理意见文档”。
    
    文档结构要求:
    - **参考案例分析**：(如果引用了案例，请在此处说明引用的案例名称及其解决方案的参考价值)
    - **故障根本原因**：(结合班组诊断和案例经验进行分析)
    - **技术处理建议**：(详细步骤，供客响班执行)
    - **客户解释口径**：(通俗易懂，供 IT 人员回复客户)
    
    请始终使用中文回答，格式为 Markdown。
  `;

  try {
    // Fix: Using gemini-3-flash-preview for general summarization/reasoning tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "你是一个乐于助人且精准的物联网支撑系统助手。在分析时请高度重视知识库中的历史经验。",
        temperature: 0.3,
      }
    });
    return response.text || "AI分析生成失败。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "生成AI分析时出错，请检查系统日志。";
  }
};

// New function for Smart Ticket Creation
export const suggestTicketMetadata = async (rawDescription: string): Promise<{
  title: string;
  description: string;
  urgency: Urgency;
  suggestedRole?: Role;
}> => {
  const prompt = `
    作为物联网工单系统的智能助手，请根据以下用户输入的原始故障描述，生成规范的工单信息。

    用户原始描述: "${rawDescription}"

    请返回一个 JSON 对象，包含以下字段：
    1. "title": 一个简练、专业的工单标题（15字以内）。
    2. "description": 将原始描述重写为逻辑清晰、术语规范的技术故障描述。
    3. "urgency": 根据故障影响范围和严重性，判断为 "高"、"中" 或 "低" (对应 Urgency Enum)。
       - 高: 涉及大面积断网、核心业务中断、VIP客户。
       - 中: 局部信号差、单个设备故障但影响业务。
       - 低: 咨询类、非紧急故障。
    4. "suggestedRole": 根据故障类型，推测最可能需要负责排查的专业班组 (仅从以下选择: "核心网专业班", "网优专业班", "传输专业班", "集客专业班")。

    请直接返回 JSON 字符串，不要包含 Markdown 格式标记。
  `;

  try {
    // Fix: Using gemini-3-flash-preview for structured text generation tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1, // Low temperature for consistent formatting
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    
    const data = JSON.parse(text);
    return {
      title: data.title,
      description: data.description,
      urgency: data.urgency as Urgency,
      suggestedRole: data.suggestedRole as Role
    };
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    // Fallback
    return {
      title: "AI识别失败",
      description: rawDescription,
      urgency: Urgency.MEDIUM
    };
  }
};

// --- CLUSTER ANALYSIS (Feature 3) ---
export const checkSimilarTickets = async (newDescription: string, recentTickets: Ticket[]): Promise<{
  detected: boolean;
  similarCount: number;
  reason: string;
}> => {
  // If no recent tickets, skip
  if (recentTickets.length === 0) {
    return { detected: false, similarCount: 0, reason: '' };
  }

  // Optimize context: Only send relevant fields (title, desc) of last 10 tickets to avoid token limits
  const ticketsContext = recentTickets
    .slice(0, 10)
    .map(t => `- ID: ${t.id}, 标题: ${t.title}, 描述: ${t.description}`)
    .join('\n');

  const prompt = `
    作为物联网工单系统的智能风控模块，请分析以下【新工单描述】与【近期活跃工单列表】是否存在“故障聚类”现象（即多个用户反馈同一区域、同一类型的故障）。

    【新工单描述】
    ${newDescription}

    【近期活跃工单列表】
    ${ticketsContext}

    判定标准：
    1. 故障地点/区域是否相同或临近（如同一园区、同一小区、7G区域等）？
    2. 故障现象是否高度相似（如都是断网、都是延迟高）？
    3. 如果找到相似工单，请判断是否疑似区域性共性故障。

    请返回 JSON:
    {
      "detected": boolean, // 是否检测到聚类/重复。如果有 >0 个高度相似工单，则为 true。
      "similarCount": number, // 你认为高度相似的工单数量。
      "reason": string // 简短的警告提示（30字以内），例如："检测到该区域过去1小时内已有 5 起类似 5G 信号投诉，疑似基站故障。"
    }
  `;

  try {
    // Fix: Using gemini-3-flash-preview for complex data analysis tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    });
    
    const text = response.text;
    if (!text) return { detected: false, similarCount: 0, reason: '' };
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Cluster Analysis Error:", error);
    return { detected: false, similarCount: 0, reason: '' };
  }
};


// Expert Copilot Chat Function
export const askCopilot = async (question: string, currentTicket?: Ticket): Promise<string> => {
  let contextInfo = "";
  if (currentTicket) {
    contextInfo = `
    【当前专家正在处理的工单上下文】
    工单标题: ${currentTicket.title}
    故障描述: ${currentTicket.description}
    当前状态: ${currentTicket.status}
    已有的诊断记录: ${currentTicket.diagnoses.map(d => d.content).join('; ')}
    `;
  }

  const prompt = `
    你是一名资深的电信与物联网技术专家（Expert Copilot）。你的职责是辅助网络工程师进行故障排查、解释错误代码、提供技术方案。
    
    ${contextInfo}

    用户问题: "${question}"

    请遵循以下原则：
    1. **专业性**：使用准确的通信术语（如 5G SA/NSA, NB-IoT, 光功率, 丢包率等）。
    2. **针对性**：如果提供了工单上下文，请结合该具体故障场景进行回答。如果没有上下文，则提供通用的技术解答。
    3. **简洁性**：直接给出排查步骤、命令建议或原因分析，不要废话。
    4. **安全性**：不要建议执行高风险的删除/重置操作，除非给出明确警告。

    请用中文回答。支持 Markdown 格式。
  `;

  try {
    // Fix: Using gemini-3-pro-preview for advanced technical reasoning tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "你是一个专业的物联网技术支持助手。回答要硬核、准确。",
        temperature: 0.4,
      }
    });
    return response.text || "Copilot 暂时无法回答。";
  } catch (error) {
    console.error("Copilot Error:", error);
    return "专家助手连接超时，请稍后重试。";
  }
};
