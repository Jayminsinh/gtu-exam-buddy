import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../utils/api';
import { Badge } from '../components/ui';
import { Sparkles, Loader2, Send, CornerDownLeft, HelpCircle, AlertCircle } from '../components/ui/Icons';

export default function AiAssistant() {
  const [activeSubject, setActiveSubject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // ─── Load Active Subject Context ────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('currentSubject');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setActiveSubject(parsed);
        // Append initial system message about the subject context
        setMessages([
          {
            id: 'sys-1',
            sender: 'system',
            text: `Connected to **${parsed.code} — ${parsed.name}** context. You can generate a blueprint or ask questions tailored to this curriculum.`,
            timestamp: new Date(),
          }
        ]);
      } catch (e) {
        console.warn('Failed to parse subject storage:', e);
      }
    } else {
      setMessages([
        {
          id: 'sys-1',
          sender: 'system',
          text: 'No active course selected. Navigate to 📚 **My Classroom** to select a subject for personalized exam guidance, or ask generic questions.',
          timestamp: new Date(),
        }
      ]);
    }
  }, []);

  // ─── Auto Scroll to Chat Bottom ─────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ─── Custom Markdown-to-HTML Parser ─────────────────────────
  const renderMessageText = (text) => {
    const lines = text.split('\n');
    let insideList = false;
    const elements = [];

    lines.forEach((line, idx) => {
      // 1. Diagram Box Parser
      if (line.startsWith('[DIAGRAM_KEYWORD:')) {
        const keyword = line.replace('[DIAGRAM_KEYWORD:', '').replace(']', '').trim();
        elements.push(
          <div
            key={`diag-${idx}`}
            className="my-4 border border-[rgba(201,169,110,0.22)] bg-[rgba(201,169,110,0.03)] p-4 rounded-lg flex flex-col"
          >
            <div className="flex items-center gap-2 text-[#C9A96E] font-mono text-[10px] tracking-[0.12em] uppercase mb-2.5 font-semibold">
              <Image size={12} />
              <span>GTU Diagram Reference Keyword</span>
            </div>
            <p className="font-mono text-[13px] text-[#F0EDE7] mb-3 select-all bg-[#0B0905]/40 p-2.5 border border-[rgba(255,255,255,0.04)] rounded-md">
              {keyword}
            </p>
            <button
              onClick={() =>
                window.open(
                  `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(keyword)}`,
                  '_blank'
                )
              }
              className="self-start font-sans text-[11px] tracking-wide text-[#C9A96E] hover:text-[#D4B47A] transition-colors duration-150 uppercase border-b border-[#C9A96E]/30 pb-0.5"
            >
              Open Google Image Search ↗
            </button>
          </div>
        );
        return;
      }

      // 2. Headings
      if (line.startsWith('### ')) {
        if (insideList) {
          insideList = false;
        }
        elements.push(
          <h4 key={idx} className="font-serif text-[15px] text-[#F0EDE7] mt-4 mb-2 font-normal italic">
            {line.replace('### ', '')}
          </h4>
        );
        return;
      }
      if (line.startsWith('## ')) {
        if (insideList) {
          insideList = false;
        }
        elements.push(
          <h3 key={idx} className="font-serif text-[17px] text-[#F0EDE7] mt-5 mb-3 font-normal uppercase border-b border-[rgba(255,255,255,0.06)] pb-1.5">
            {line.replace('## ', '')}
          </h3>
        );
        return;
      }

      // 3. Bullet list items
      if (line.startsWith('- ')) {
        const itemText = line.replace('- ', '');
        const boldRegex = /\*\*(.*?)\*\*/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = boldRegex.exec(itemText)) !== null) {
          if (match.index > lastIndex) {
            parts.push(itemText.substring(lastIndex, match.index));
          }
          parts.push(<strong key={match.index} className="font-semibold text-[#F0EDE7]">{match[1]}</strong>);
          lastIndex = boldRegex.lastIndex;
        }
        if (lastIndex < itemText.length) {
          parts.push(itemText.substring(lastIndex));
        }

        elements.push(
          <li key={idx} className="list-disc ml-5 mb-1.5 font-ui text-[13px] text-[#BDB5AA] leading-relaxed">
            {parts.length > 0 ? parts : itemText}
          </li>
        );
        insideList = true;
        return;
      }

      // 4. Standard paragraphs
      if (line.trim() === '') {
        return;
      }

      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-semibold text-[#F0EDE7]">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      elements.push(
        <p key={idx} className="mb-3 font-ui text-[13px] leading-relaxed text-[#BDB5AA]">
          {parts.length > 0 ? parts : line}
        </p>
      );
    });

    return <div className="space-y-1">{elements}</div>;
  };

  // ─── Generate blueprint routine ─────────────────────────────
  const handleGenerateBlueprint = () => {
    if (isTyping) return;
    setIsTyping(true);

    const subjectName = activeSubject ? activeSubject.name : 'Engineering Subject';
    const subjectCode = activeSubject ? activeSubject.code : 'GTU-XX';

    setTimeout(() => {
      const blueprintText = `## ✨ GTU IMP Exam Blueprint: ${subjectName} (${subjectCode})
## Core Exam Blueprint Weightage
- **Module 1: Fundamental Architectures** (Weightage: ~25% / 17 Marks)
  Focus heavily on structural configurations and operational design flows. Expect at least one 7-mark question.
- **Module 2: Core Processing Layers** (Weightage: ~35% / 25 Marks)
  High probability of comparative analyses (e.g., algorithm runtime evaluations, state machines). Expect two 7-mark questions.
- **Module 3: Optimization & Security** (Weightage: ~40% / 28 Marks)
  Practical design diagrams and application-level scenarios. Essential for securing a high rank.

## High-Yield (7-Mark) Question Blueprint
- **Question 1:** Explain in detail the pipeline design and execution cycle. Illustrate with a detailed architectural layout.
[DIAGRAM_KEYWORD: ${subjectName} architectural pipeline execution diagram block sketch]
- **Question 2:** Compare and contrast the principal algorithms used for state optimization. Provide step-by-step trace tables.
- **Question 3:** Describe the mechanism of error resolution under high load metrics. Sketch the process interaction flow graph.
[DIAGRAM_KEYWORD: ${subjectName} error handling state sequence flowchart diagram]

## Preparation Tip
GTU evaluators look for neat, labeled diagrams and schematic sketches. Always start long answers with a visual block diagram. Use the keywords above to fetch textbook-aligned references.`;

      setMessages((prev) => [
        ...prev,
        {
          id: `imp-${Date.now()}`,
          sender: 'assistant',
          text: blueprintText,
          timestamp: new Date(),
        }
      ]);
      setIsTyping(false);
      toast.success('IMP Question Blueprint generated.');
    }, 1200);
  };

  // ─── Handle chat input submit ──────────────────────────────
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue;
    setInputValue('');

    // Append user message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate smart AI response
    setTimeout(() => {
      let botResponse = '';
      const lowerText = userText.toLowerCase();
      const subjectName = activeSubject ? activeSubject.name : 'Engineering Course';

      if (lowerText.includes('diagram') || lowerText.includes('sketch') || lowerText.includes('draw')) {
        botResponse = `## 🎨 Visual Explanation Guide
Drawing the correct diagram is critical to scoring full marks in GTU. Here is a breakdown of the requested visual layout:
- **Key Components:** Draw the processing modules as distinct boxes. Connect them with directional data-flow arrows.
- **Labeling Rule:** Always label the inputs, state transfers, and final outputs clearly.
- **Visual Reference:** Search Google Images using the optimized keyword below to find standard textbook schematics.
[DIAGRAM_KEYWORD: ${subjectName} detailed layout wiring schematic structure diagram]`;
      } else if (lowerText.includes('solve') || lowerText.includes('problem') || lowerText.includes('formula')) {
        botResponse = `## 🧮 Step-by-Step Solution Workflow
Here is how to solve this class of problems systematically for your GTU exams:
- **Step 1: Document Givens:** Always write down all constant values, load sizes, and environmental parameters at the beginning.
- **Step 2: State the Formula:** Express the mathematical formula clearly before inserting numeric values.
- **Step 3: Solve Sequentially:** Perform intermediate reductions, carrying out standard decimal tracking to prevent rounding deviations.
- **Step 4: Label Final Units:** Clearly outline the resolved answer with correct units in a box.`;
      } else {
        botResponse = `## 💡 Core Concept Explanation
In simple terms, here is the explanation for your query within the context of **${subjectName}**:
- **Definition:** This concept represents the principal mechanism for scheduling, modeling, or executing tasks within the curriculum.
- **GTU Focus Area:** Typically asked as a **3-mark** or **5-mark** question. Evaluators look for standard definition, primary features, and an architectural block diagram.
- **Recommended Sketch:** Draw a neat flow diagram depicting input scheduling and operational cycles.
[DIAGRAM_KEYWORD: ${subjectName} core architecture execution diagram]`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: botResponse,
          timestamp: new Date(),
        }
      ]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestedClick = (promptText) => {
    setInputValue(promptText);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] w-full max-w-[1200px] mx-auto gap-5 animate-fade-in font-ui">
      {/* ─── Header Panel ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-4 gap-4">
        <div className="flex flex-col">
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#8B7456] mb-1 font-medium">
            🤖 GTU Cognitive Assistant
          </p>
          <h2 className="font-serif text-3xl text-[#F0EDE7] font-normal uppercase tracking-wide">
            AI Exam Assistant
          </h2>
          {activeSubject && (
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[12px] text-[#7A726A] uppercase tracking-wider">Active Context:</span>
              <Badge variant="gold" size="sm">
                {activeSubject.code} — {activeSubject.name}
              </Badge>
            </div>
          )}
        </div>

        <button
          onClick={handleGenerateBlueprint}
          disabled={isTyping}
          className="font-sans text-[11px] tracking-[0.2em] uppercase px-5 py-3 border border-[rgba(201,169,110,0.3)] bg-[rgba(201,169,110,0.06)] text-[#C9A96E] hover:bg-[#C9A96E] hover:text-[#0B0905] transition-all duration-300 font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
        >
          <Sparkles size={13} />
          <span>Generate IMP Blueprint</span>
        </button>
      </div>

      {/* ─── Chat / Terminal Container ────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#141210] border border-[rgba(255,255,255,0.07)] rounded-[14px] overflow-hidden shadow-lg">
        
        {/* Terminal Header */}
        <div className="bg-[rgba(255,255,255,0.015)] border-b border-[rgba(255,255,255,0.05)] px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#F87171]/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#34D399]/80" />
            <span className="font-mono text-[10px] tracking-[0.15em] text-[#7A726A] ml-2.5 uppercase font-medium">
              Cognitive Shell v1.0
            </span>
          </div>
          {activeSubject && (
            <Badge variant="ai" size="sm">
              Syllabus Linked
            </Badge>
          )}
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0B0905]/40">
          {messages.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="bg-[#141210] border border-[rgba(255,255,255,0.05)] rounded-lg px-4.5 py-2.5 text-center text-[#7A726A] text-[12px] max-w-lg shadow-sm">
                    {msg.text.includes('**') ? (
                      <span>
                        Connected to <strong className="text-[#F0EDE7] font-semibold">{activeSubject?.name}</strong> context. You can generate a blueprint or ask questions tailored to the curriculum.
                      </span>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              );
            }

            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xl p-5 rounded-xl border transition-all duration-300 shadow-md ${
                    isUser
                      ? 'bg-[#1C1915] text-[#F0EDE7] border-[rgba(255,255,255,0.08)]'
                      : 'bg-[rgba(99,102,241,0.04)] text-[#F0EDE7] border-[rgba(99,102,241,0.12)]'
                  }`}
                >
                  {isUser ? (
                    <p className="text-[13px] tracking-wide leading-relaxed font-ui">{msg.text}</p>
                  ) : (
                    renderMessageText(msg.text)
                  )}
                  <span className={`block font-mono text-[8px] tracking-widest mt-3 uppercase text-right ${
                    isUser ? 'text-[#7A726A]/40' : 'text-[#6366F1]/50'
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[rgba(99,102,241,0.03)] border border-[rgba(99,102,241,0.08)] p-4.5 rounded-xl max-w-md shadow-sm">
                <div className="flex items-center gap-1.5 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-bounce" />
                </div>
                <span className="font-mono text-[8px] tracking-[0.2em] text-[#6366F1]/70 uppercase mt-2.5 block">
                  AI is processing queries...
                </span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Prompts */}
        {messages.length <= 2 && !isTyping && (
          <div className="px-6 py-3 bg-[#141210] border-t border-[rgba(255,255,255,0.05)] flex flex-wrap gap-2 items-center">
            <span className="font-mono text-[9px] tracking-[0.2em] text-[#7A726A] uppercase mr-2 font-medium">
              Quick Queries:
            </span>
            {[
              "Explain core concepts",
              "How to draw GTU diagrams",
              "Solve standard 7-mark question"
            ].map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestedClick(p)}
                className="font-ui text-[10.5px] font-medium tracking-wide text-[#BDB5AA] hover:text-[#C9A96E] bg-[#1C1915] border border-[rgba(255,255,255,0.05)] hover:border-[#C9A96E]/40 px-3 py-1.5 transition-all duration-150 rounded-md cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="border-t border-[rgba(255,255,255,0.05)] bg-[#141210] p-4 flex gap-3.5 items-center"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTyping}
            placeholder={
              activeSubject
                ? `Ask questions about ${activeSubject.name}...`
                : "Ask questions, explore formulas, or sketch diagrams..."
            }
            className="flex-1 bg-[#1C1915] border border-[rgba(255,255,255,0.07)] px-4 h-11 text-[13px] tracking-wide text-[#F0EDE7] outline-none focus:border-[#C9A96E]/45 focus:shadow-[0_0_0_2px_rgba(201,169,110,0.05)] transition-all duration-150 rounded-lg placeholder-[#4A4540]"
          />
          <button
            type="submit"
            disabled={isTyping || !inputValue.trim()}
            className="h-11 px-5 bg-gradient-to-r from-[#C9A96E] to-[#A07840] hover:brightness-[1.08] active:brightness-[0.96] rounded-lg text-[13.5px] font-semibold text-[#0B0905] flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
          >
            <span>Send</span>
            <CornerDownLeft size={13} />
          </button>
        </form>
      </div>
    </div>
  );
}
