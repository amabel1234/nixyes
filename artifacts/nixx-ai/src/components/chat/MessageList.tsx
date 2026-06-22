import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Message { id: string | number; role: string; content: string; createdAt: string; }
interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  userAvatarUrl?: string;
  userInitials?: string;
}

function formatTime(dateStr: string) {
  try { return new Date(dateStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }); }
  catch { return ""; }
}

export function MessageList({ messages, isLoading, userAvatarUrl, userInitials }: MessageListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 space-y-5">
      {messages.map((msg) => {
        const isUser = msg.role === "user";
        const time = formatTime(msg.createdAt);
        const id = String(msg.id);
        return (
          <div key={id} className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
            {isUser ? (
              <div className="flex items-end gap-2 flex-row-reverse max-w-[82%]">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={userAvatarUrl} />
                  <AvatarFallback className="text-white text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
                    {userInitials || "K"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-end gap-1">
                  <div className="px-4 py-3 rounded-2xl rounded-tr-sm text-white text-sm leading-relaxed"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
                    {msg.content}
                  </div>
                  {time && <span className="text-[11px]" style={{ color: "hsl(248,15%,45%)" }}>{time}</span>}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 group max-w-[92%]">
                <div className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #c026d3)" }}>
                  🧠
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="relative px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
                    style={{ background: "hsl(248,28%,11%)", border: "1px solid hsl(248,25%,19%)", color: "hsl(0,0%,92%)" }}>
                    <div className="prose prose-sm max-w-none prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent overflow-x-auto">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code(props) {
                            const { children, className } = props;
                            const match = /language-(\w+)/.exec(className || "");
                            const codeStr = String(children).replace(/\n$/, "");
                            if (match) {
                              return (
                                <div className="relative group/code rounded-xl overflow-hidden my-3"
                                  style={{ border: "1px solid hsl(248,25%,22%)" }}>
                                  <div className="flex items-center justify-between px-3 py-2"
                                    style={{ background: "hsl(248,30%,7%)", borderBottom: "1px solid hsl(248,25%,22%)" }}>
                                    <span className="text-xs font-mono" style={{ color: "hsl(248,15%,55%)" }}>{match[1]}</span>
                                    <button onClick={() => navigator.clipboard.writeText(codeStr)}
                                      className="h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover/code:opacity-100 transition-opacity"
                                      style={{ color: "hsl(248,15%,60%)" }}>
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  </div>
                                  <SyntaxHighlighter language={match[1]} style={vscDarkPlus}
                                    customStyle={{ margin: 0, background: "transparent", padding: "12px 16px", fontSize: "12px" }}>
                                    {codeStr}
                                  </SyntaxHighlighter>
                                </div>
                              );
                            }
                            return (
                              <code className="px-1.5 py-0.5 rounded text-xs font-mono"
                                style={{ background: "hsl(248,25%,18%)", color: "#a855f7" }}>
                                {children}
                              </code>
                            );
                          },
                        }}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    <button
                      onClick={() => handleCopy(msg.content, id)}
                      className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "hsl(248,15%,60%)" }}>
                      {copiedId === id ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                  {time && <span className="text-[11px]" style={{ color: "hsl(248,15%,45%)" }}>{time}</span>}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Loading dots */}
      {isLoading && (
        <div className="flex items-start gap-2">
          <div className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm"
            style={{ background: "linear-gradient(135deg, #7c3aed, #c026d3)" }}>🧠</div>
          <div className="px-4 py-3.5 rounded-2xl rounded-tl-sm"
            style={{ background: "hsl(248,28%,11%)", border: "1px solid hsl(248,25%,19%)" }}>
            <div className="flex gap-1.5 items-center">
              {[0, 150, 300].map((d) => (
                <div key={d} className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: "#a855f7", animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
