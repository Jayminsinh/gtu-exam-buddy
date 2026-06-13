/**
 * @file AI Exam Assistant Page
 * @description Premium, high-contrast terminal chat interface for students.
 *              Generates blueprints and solves questions with optimized diagram keywords.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../utils/api';

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
            className="my-4 border border-thin border-luxury-gold bg-luxury-gold/[0.04] p-4 rounded-none"
          >
            <div className="flex items-center gap-2 text-luxury-gold font-sans text-[10px] tracking-[0.2em] uppercase mb-2 font-semibold">
              <span>🔍</span> GTU Diagram Search Engine Keyword
            </div>
            <p className="font-serif italic text-sm text-luxury-espresso mb-3 select-all">
              "{keyword}"
            </p>
            <button
              onClick={() =>
                window.open(
                  `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(keyword)}`,
                  '_blank'
                )
              }
              className="font-sans text-[9px] tracking-widest text-luxury-gold hover:text-luxury-espresso transition-colors duration-300 uppercase border-b border-luxury-gold/30 hover:border-luxury-espresso/50 pb-0.5"
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
          <h4 key={idx} className="font-serif text-base text-luxury-espresso mt-4 mb-2 font-normal uppercase">
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
          <h3 key={idx} className="font-serif text-lg text-luxury-espresso mt-6 mb-3 font-normal uppercase border-b border-thin border-luxury-charcoal/10 pb-1">
            {line.replace('## ', '')}
          </h3>
        );
        return;
      }

      // 3. Bullet list items
      if (line.startsWith('- ')) {
        const itemText = line.replace('- ', '');
        // Highlight bold sections within list item
        const boldRegex = /\*\*(.*?)\*\*/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = boldRegex.exec(itemText)) !== null) {
          if (match.index > lastIndex) {
            parts.push(itemText.substring(lastIndex, match.index));
          }
          parts.push(<strong key={match.index} className="font-semibold text-luxury-espresso">{match[1]}</strong>);
          lastIndex = boldRegex.lastIndex;
        }
        if (lastIndex < itemText.length) {
          parts.push(itemText.substring(lastIndex));
        }

        elements.push(
          <li key={idx} className="list-disc ml-5 mb-1.5 font-sans text-xs text-luxury-charcoal tracking-wide">
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

      // Highlight bold text in normal paragraphs
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-semibold text-luxury-espresso">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      elements.push(
        <p key={idx} className="mb-3 font-sans text-xs leading-relaxed text-luxury-charcoal tracking-wide">
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
### 📋 Core Exam Blueprint Weightage
- **Module 1: Fundamental Architectures** (Weightage: ~25% / 17 Marks)
  Focus heavily on structural configurations and operational design flows. Expect at least one 7-mark question.
- **Module 2: Core Processing Layers** (Weightage: ~35% / 25 Marks)
  High probability of comparative analyses (e.g., algorithm runtime evaluations, state machines). Expect two 7-mark questions.
- **Module 3: Optimization & Security** (Weightage: ~40% / 28 Marks)
  Practical design diagrams and application-level scenarios. Essential for securing a high rank.

### 🎯 High-Yield (7-Mark) Question Blueprint
- **Question 1:** Explain in detail the pipeline design and execution cycle. Illustrate with a detailed architectural layout.
[DIAGRAM_KEYWORD: ${subjectName} architectural pipeline execution diagram block sketch]
- **Question 2:** Compare and contrast the principal algorithms used for state optimization. Provide step-by-step trace tables.
- **Question 3:** Describe the mechanism of error resolution under high load metrics. Sketch the process interaction flow graph.
[DIAGRAM_KEYWORD: ${subjectName} error handling state sequence flowchart diagram]

### 💡 Preparation Tip
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
    <div className="flex flex-col h-[calc(100vh-180px)] w-full max-w-5xl gap-6">
      {/* ─── Header Panel ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-thin border-luxury-charcoal/10 pb-4">
        <div>
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-gold mb-1">
            🤖 GTU COGNITIVE ASSISTANT
          </p>
          <h2 className="font-serif text-3xl text-luxury-espresso font-normal uppercase tracking-wide">
            AI Exam Assistant
          </h2>
          {activeSubject && (
            <p className="font-sans text-[11px] text-luxury-taupe mt-1 uppercase tracking-wider">
              Active Context: <span className="text-luxury-gold font-medium">{activeSubject.code} — {activeSubject.name}</span>
            </p>
          )}
        </div>

        <button
          onClick={handleGenerateBlueprint}
          disabled={isTyping}
          className="mt-4 md:mt-0 font-sans text-[10px] tracking-[0.25em] uppercase px-5 py-3 border border-thin border-luxury-gold bg-luxury-gold/[0.08] text-luxury-espresso hover:bg-luxury-gold hover:text-luxury-ivory transition-all duration-500 font-semibold shadow-sm"
        >
          ✨ Generate IMP Blueprint
        </button>
      </div>

      {/* ─── Chat / Terminal Container ────────────────────── */}
      <div className="flex-1 flex flex-col bg-luxury-cream border border-thin border-luxury-charcoal/10 rounded-sm overflow-hidden shadow-md">
        
        {/* Terminal Header */}
        <div className="bg-luxury-espresso/5 border-b border-thin border-luxury-charcoal/10 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="font-sans text-[10px] tracking-[0.2em] text-luxury-taupe ml-2 uppercase font-medium">
              Cognitive Shell v1.0
            </span>
          </div>
          {activeSubject && (
            <span className="font-sans text-[9px] tracking-widest text-luxury-gold uppercase font-semibold">
              ● SYLLABUS LINKED
            </span>
          )}
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAF9F6]">
          {messages.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="bg-luxury-cream border border-thin border-luxury-charcoal/10 px-4 py-2 text-center text-luxury-taupe font-sans text-[10px] tracking-wide max-w-lg shadow-sm">
                    {msg.text.includes('**') ? (
                      <span>
                        Connected to <strong className="text-luxury-espresso font-semibold">{activeSubject?.name}</strong> context. You can generate a blueprint or ask questions.
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
                  className={`max-w-xl p-5 border-thin transition-all duration-300 shadow-sm ${
                    isUser
                      ? 'bg-luxury-espresso text-luxury-ivory border-luxury-charcoal'
                      : 'bg-luxury-cream text-luxury-espresso border-luxury-charcoal/10'
                  }`}
                >
                  {isUser ? (
                    <p className="font-sans text-xs tracking-wide leading-relaxed">{msg.text}</p>
                  ) : (
                    renderMessageText(msg.text)
                  )}
                  <span className={`block font-sans text-[8px] tracking-widest mt-3 uppercase ${
                    isUser ? 'text-luxury-taupe/40 text-right' : 'text-luxury-taupe/60'
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
              <div className="bg-luxury-cream border border-thin border-luxury-charcoal/10 p-5 max-w-md shadow-sm">
                <div className="flex items-center gap-1.5 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-luxury-gold animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-luxury-gold animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-luxury-gold animate-bounce" />
                </div>
                <span className="font-sans text-[8px] tracking-[0.2em] text-luxury-taupe uppercase mt-2 block">
                  Processing queries...
                </span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Prompts */}
        {messages.length <= 2 && !isTyping && (
          <div className="px-6 py-3 bg-luxury-cream border-t border-thin border-luxury-charcoal/5 flex flex-wrap gap-2 items-center">
            <span className="font-sans text-[9px] tracking-[0.2em] text-luxury-taupe uppercase mr-2 font-medium">
              Quick Queries:
            </span>
            {[
              "Explain the core concept",
              "How should I draw diagrams?",
              "Solve a typical 7-mark question"
            ].map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestedClick(p)}
                className="font-sans text-[9px] tracking-widest text-luxury-espresso hover:text-luxury-gold bg-luxury-ivory border border-thin border-luxury-charcoal/10 hover:border-luxury-gold px-3 py-1.5 transition-all duration-300 uppercase"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="border-t border-thin border-luxury-charcoal/10 bg-luxury-cream p-4 flex gap-4 items-center"
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
            className="flex-1 bg-luxury-ivory border border-thin border-luxury-charcoal/10 px-4 py-3 text-xs tracking-wider text-luxury-espresso outline-none focus:border-luxury-gold transition-colors duration-300 rounded-none placeholder-luxury-taupe/40"
          />
          <button
            type="submit"
            disabled={isTyping || !inputValue.trim()}
            className="font-sans text-[10px] tracking-[0.25em] uppercase px-6 py-3 border border-thin border-luxury-charcoal bg-luxury-espresso text-luxury-ivory hover:bg-transparent hover:text-luxury-espresso disabled:opacity-30 disabled:hover:bg-luxury-espresso disabled:hover:text-luxury-ivory disabled:cursor-not-allowed transition-all duration-500 font-semibold"
          >
            SEND
          </button>
        </form>
      </div>
    </div>
  );
}
