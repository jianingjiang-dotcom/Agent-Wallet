import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Eye, Wrench, Copy, CheckCircle2, Link2, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { mockRecipes, categoryLabels, formatChain } from '@/lib/mock-recipes';
import { RecipeIcon } from '@/components/RecipeIcon';

// Telegram brand icon (paper plane) — lucide doesn't ship a branded Telegram glyph
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
    </svg>
  );
}

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
          <span>{renderInline(line.slice(2))}</span>
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
            <span>{renderInline(match[2])}</span>
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
          {renderInline(line)}
        </p>
      );
    }
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
}

// Render inline `code` and **bold** within a line
function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 rounded bg-gray-100 text-[12px] font-mono text-gray-800">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
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
          <button onClick={() => navigate('/recipes')} className="text-primary text-sm font-medium">
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
            <RecipeIcon recipe={recipe} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{recipe.title}</h1>
                {recipe.featured && (
                  <Star className="w-4.5 h-4.5 text-amber-500 fill-amber-500 shrink-0" strokeWidth={1.5} title="Featured" />
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
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {recipe.view_count.toLocaleString()} views
                </span>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5" />
                  {recipe.use_count.toLocaleString()} uses
                </span>
              </div>
            </div>
          </div>

          {/* Share buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors text-xs text-gray-600 font-medium"
            >
              {copiedUrl ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Link2 className="w-3.5 h-3.5" />}
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
              className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center transition-colors text-gray-600"
            >
              <TelegramIcon className="w-4 h-4" />
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
            {/* Try These Prompts — premium CTA */}
            <div className="relative">
              {/* Section header with subtle accent */}
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-500" strokeWidth={2.25} />
                <h3 className="text-base font-bold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Try with your agent
                </h3>
              </div>
              <p className="text-[11px] text-gray-400 mb-4 ml-6">Tap any prompt to copy.</p>

              <div className="space-y-2.5">
                {recipe.example_prompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCopyPrompt(prompt, idx)}
                    className="w-full text-left relative group p-4 rounded-xl bg-gradient-to-br from-white via-white to-indigo-50/30 border border-gray-200 hover:border-indigo-300 hover:shadow-[0_8px_24px_-12px_rgba(99,102,241,0.35)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                  >
                    {/* Corner glow on hover */}
                    <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-indigo-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Prompt mark */}
                    <span className="absolute top-3.5 left-3 text-indigo-400/70 font-mono text-sm leading-none select-none">›</span>

                    <p className="text-[13px] text-gray-700 leading-[1.55] pl-4 pr-12 font-medium">
                      {prompt}
                    </p>

                    {/* Action — copy state */}
                    <div className="absolute top-3 right-3">
                      {copiedPrompt === idx ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-success/8 border border-success/20 text-success">
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-white border border-gray-200 text-gray-400 group-hover:text-indigo-600 group-hover:border-indigo-300 group-hover:bg-indigo-50 transition-all">
                          <Copy className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </button>
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
                        <RecipeIcon recipe={r} size="sm" />
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
