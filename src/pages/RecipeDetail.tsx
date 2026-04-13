import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Eye, Copy, CheckCircle2, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { mockRecipes, categoryLabels, formatChain } from '@/lib/mock-recipes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Simple Markdown renderer for Recipe content
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Heading ##
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="text-lg font-bold text-gray-900 mt-8 mb-3 first:mt-0">
          {line.slice(3)}
        </h3>
      );
    }
    // Bold line **...**
    else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <p key={i} className="text-sm font-semibold text-gray-900 mt-4 mb-1">
          {line.slice(2, -2)}
        </p>
      );
    }
    // List item
    else if (line.startsWith('- ') || line.startsWith('· ')) {
      elements.push(
        <div key={i} className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed ml-1">
          <span className="text-gray-400 mt-1 shrink-0">•</span>
          <span>{renderInlineCode(line.slice(2))}</span>
        </div>
      );
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.+)/);
      if (match) {
        elements.push(
          <div key={i} className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed ml-1">
            <span className="text-gray-400 shrink-0 w-4 text-right">{match[1]}.</span>
            <span>{renderInlineCode(match[2])}</span>
          </div>
        );
      }
    }
    // Empty line
    else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    }
    // Regular paragraph
    else {
      elements.push(
        <p key={i} className="text-sm text-gray-600 leading-relaxed">
          {renderInlineCode(line)}
        </p>
      );
    }
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
}

function renderInlineCode(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 rounded bg-gray-100 text-[12px] font-mono text-gray-800">{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function RecipeDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [copiedPrompt, setCopiedPrompt] = useState<number | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const recipe = mockRecipes.find(r => r.slug === slug);

  if (!recipe) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-2">Recipe not found</p>
          <button onClick={() => navigate('/recipes')} className="text-blue-600 text-sm font-medium">
            ← Back to Recipes
          </button>
        </div>
      </div>
    );
  }

  const handleCopyPrompt = (prompt: string, idx: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(idx);
    toast.success('Prompt copied');
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  const recipeUrl = `https://agenticwallet.cobo.com/recipes/${recipe.slug}`;
  const shareText = `${recipe.title} — ${recipe.description}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(recipeUrl);
    setCopiedUrl(true);
    toast.success('URL copied');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleShareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(recipeUrl)}&text=${encodeURIComponent(shareText)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleShareTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(recipeUrl)}&text=${encodeURIComponent(shareText)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const relatedRecipes = mockRecipes.filter(r => r.category === recipe.category && r.id !== recipe.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <button onClick={() => navigate('/recipes')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to Recipes
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Meta */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start gap-4 mb-5">
            <span className="text-4xl shrink-0">{recipe.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{recipe.title}</h1>
                {recipe.verified && (
                  <TooltipProvider>
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-help">
                          <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                          Verified
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px]">
                        <p className="text-xs leading-relaxed">Reviewed and audited by Cobo. Contract addresses, flows, and risk notes have been verified.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-gray-500 mt-1">{recipe.description}</p>
            </div>
          </div>

          {/* Category + Chains — clear hierarchy */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mb-5">
            {/* Category */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Category</span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-600 text-white">
                {categoryLabels[recipe.category]}
              </span>
            </div>

            {/* Divider */}
            <div className="w-px h-4 bg-gray-200" />

            {/* Chains */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Chains</span>
              {recipe.chains.map(chain => (
                <span key={chain} className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {formatChain(chain)}
                </span>
              ))}
            </div>
          </div>

        </motion.div>

        {/* Divider */}
        <div className="h-px bg-gray-100 my-6" />

        {/* Author + Share — unified row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center justify-between flex-wrap gap-4 mb-8"
        >
          {/* Author block */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
              {recipe.author_name[0]}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-gray-900">{recipe.author_name}</span>
                <span className="text-xs text-gray-400">· Author</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <Eye className="w-3.5 h-3.5" />
                <span>{recipe.view_count.toLocaleString()} views</span>
              </div>
            </div>
          </div>

          {/* Share buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors text-xs text-gray-600 font-medium"
            >
              {copiedUrl ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Link2 className="w-3.5 h-3.5" />}
              {copiedUrl ? 'Copied!' : 'Copy URL'}
            </button>
            <button
              onClick={handleShareTwitter}
              aria-label="Share on X"
              title="Share on X"
              className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center transition-colors text-sm text-gray-600"
            >
              𝕏
            </button>
            <button
              onClick={handleShareTelegram}
              aria-label="Share on Telegram"
              title="Share on Telegram"
              className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center transition-colors text-sm text-gray-600"
            >
              ✈
            </button>
          </div>
        </motion.div>

        {/* Two-column layout: Markdown + Sticky Sidebar */}
        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-12">
          {/* Main: Markdown Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:max-w-2xl min-w-0"
          >
            <MarkdownContent content={recipe.content_markdown} />
          </motion.div>

          {/* Sidebar: Try Prompts + Related Recipes */}
          <motion.aside
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10 lg:mt-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-96px)] lg:overflow-y-auto lg:pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-track]:bg-transparent"
          >
            {/* Try These Prompts */}
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-3">Try These Prompts</h3>
              <div className="space-y-2">
                {recipe.example_prompts.map((prompt, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleCopyPrompt(prompt, idx)}
                    className="flex items-center justify-between gap-2 p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all group"
                  >
                    <p className="text-[13px] text-gray-700 leading-relaxed">"{prompt}"</p>
                    <div className="shrink-0">
                      {copiedPrompt === idx ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Recipes */}
            {relatedRecipes.length > 0 && (
              <>
                <div className="h-px bg-gray-200 my-6" />
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-3">Related Recipes</h3>
                  <div className="space-y-2">
                    {relatedRecipes.map(r => (
                      <div
                        key={r.id}
                        onClick={() => { navigate(`/recipes/${r.slug}`); window.scrollTo(0, 0); }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all group"
                      >
                        <span className="text-2xl shrink-0">{r.icon}</span>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[13px] font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{r.title}</h4>
                          <span className="text-[10px] text-gray-500">{categoryLabels[r.category]}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 shrink-0 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
