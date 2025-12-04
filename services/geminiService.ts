import { Ticket } from "../types";
import { getCaseLibrary } from "./mockData";

// 移除前端直接引用的 SDK 和 API Key
// import { GoogleGenAI } from "@google/genai";
// const apiKey = process.env.API_KEY || '';
// const ai = new GoogleGenAI({ apiKey });

export const generateTicketAnalysis = async (ticket: Ticket): Promise<string> => {
  // 1. 准备上下文数据 (Prompt 构建逻辑保留在前端，以便灵活调整业务逻辑)
  const knowledgeBase = getCaseLibrary().slice(0, 5);
  
  let knowledgeContext = "暂无相关历史案例。";
  if (knowledgeBase.length > 0) {
    knowledgeContext = knowledgeBase.map((c, i) => `
      [参考案例 ${i+1}]
      标题: ${c.title}
      故障现象: ${c.content}
      关键诊断过程: ${c.diagnoses.map(d => `(${d.role}) ${d.content}`).join('; ')}
      最终解决方案 (Resolution): ${c.resolution}
    `).join('\n');
  }

  const prompt = `
    角色设定：你是一名资深的物联网网络故障处理专家，拥有丰富的一线排查经验和理论知识。
    
    任务：基于提供的【参考知识库】和【当前工单详情】，生成一份深度研判分析报告。
    
    目标：
    1. 准确判断故障根因。
    2. **核心要求**：必须深度挖掘历史案例，**直接引用历史案例的【最终解决方案 (Resolution)】**来指导当前的修复工作。
    3. 给出可执行的分步解决方案。
    4. 提出长效的预防措施。

    === 参考知识库 (Historical Solutions) ===
    ${knowledgeContext}

    === 当前工单详情 (Current Ticket) ===
    工单标题: ${ticket.title}
    故障描述: ${ticket.content}
    客响班初步研判: ${ticket.preliminaryJudgment || '无'}
    
    各专业班组诊断记录 (已完成的排查动作):
    ${ticket.diagnoses.map(d => `- [${d.role}]: ${d.content}`).join('\n')}
    
    === 输出格式要求 (Markdown) ===
    请严格按照以下章节生成报告：

    ### 1. 深度故障根因分析 (Deep Root Cause Analysis)
    *   综合各班组诊断，逻辑推导问题的根本原因。
    *   不仅说明“是什么”，还要解释“为什么”。

    ### 2. 知识库智能关联 (Knowledge Base Correlation)
    *   **匹配分析**：分析当前工单与【参考知识库】中案例的匹配度。
    *   **必须引用**：如果发现相似案例，请务必写出：“参考历史案例 [案例标题]”，并**完整摘录其【最终解决方案 (Resolution)】的内容**。
    *   **适用性评估**：说明该历史解决方案是否可以直接应用于当前故障，或者需要根据当前环境进行微调。
    *   若无相似案例，请明确说明“未找到强相关历史案例”。

    ### 3. 分步处理与执行方案 (Step-by-Step Action Plan)
    *   基于根因分析和**步骤2中引用的历史解决方案**，制定详细的操作步骤。
    *   **指导性强**：请将历史经验转化为具体的指令（例如：参考案例中修改了参数A，则本步骤建议检查并修改参数A）。
    *   Step 1: ...
    *   Step 2: ...

    ### 4. 预防性维护建议 (Preventative Measures)
    *   针对此类故障，提出改进建议（如自动化脚本、参数优化）。

    ### 5. 协同工作流 (Collaboration)
    *   指定各班组后续的具体分工。
  `;

  try {
    // 调用后端代理接口，而不是直接调用 Google API
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server Error: ${response.status}`);
    }

    const data = await response.json();
    return data.text || "AI无法生成分析结果。";

  } catch (error) {
    console.error("AI Service Error:", error);
    return `[系统提示] AI分析服务调用失败。
    
原因: ${error instanceof Error ? error.message : '网络连接异常'}
建议: 请检查是否已在部署平台(Vercel/Netlify)配置 API_KEY 环境变量。`;
  }
};