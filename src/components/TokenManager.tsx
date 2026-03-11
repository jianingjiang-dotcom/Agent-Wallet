import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, Plus, Check, TrendingUp, TrendingDown, Trash2, Coins } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CryptoIcon } from '@/components/CryptoIcon';
import { ChainIcon } from '@/components/ChainIcon';
import { EmptyState } from '@/components/EmptyState';
import { searchTokens, TokenInfo } from '@/lib/tokens';
import { cn } from '@/lib/utils';
import { ChainId, Asset } from '@/types/wallet';

interface TokenManagerProps {
  addedSymbols: string[];
  addedAssets: Asset[];
  onAddToken: (token: TokenInfo) => void;
  onRemoveToken: (symbol: string) => void;
  onClose: () => void;
}

type CategoryFilter = 'all' | 'stablecoin' | 'layer1' | 'layer2' | 'defi' | 'meme';

export function TokenManager({ addedSymbols, addedAssets, onAddToken, onRemoveToken, onClose }: TokenManagerProps) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [tokenToDelete, setTokenToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'add' | 'my'>('add');

  const filteredTokens = useMemo(() => {
    let tokens = searchTokens(query);
    if (categoryFilter !== 'all') {
      tokens = tokens.filter(t => t.category === categoryFilter);
    }
    // Sort by name
    tokens.sort((a, b) => a.symbol.localeCompare(b.symbol));
    return tokens;
  }, [query, categoryFilter]);

  // Get unique added tokens with aggregated balances
  const myTokens = useMemo(() => {
    const tokenMap = new Map<string, {
      symbol: string;
      name: string;
      totalBalance: number;
      totalUsdValue: number;
      networks: ChainId[];
      change24h: number;
    }>();

    addedAssets.forEach(asset => {
      if (asset.network === 'all') return;
      const existing = tokenMap.get(asset.symbol);
      if (existing) {
        existing.totalBalance += asset.balance;
        existing.totalUsdValue += asset.usdValue;
        if (!existing.networks.includes(asset.network)) {
          existing.networks.push(asset.network);
        }
      } else {
        tokenMap.set(asset.symbol, {
          symbol: asset.symbol,
          name: asset.name,
          totalBalance: asset.balance,
          totalUsdValue: asset.usdValue,
          networks: [asset.network],
          change24h: asset.change24h,
        });
      }
    });

    return Array.from(tokenMap.values()).sort((a, b) => b.totalUsdValue - a.totalUsdValue);
  }, [addedAssets]);

  const categories: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: '全部' },
    { id: 'layer1', label: '公链' },
    { id: 'stablecoin', label: '稳定币' },
    { id: 'layer2', label: 'Layer 2' },
    { id: 'defi', label: 'DeFi' },
    { id: 'meme', label: 'Meme' },
  ];

  const handleAddToken = (token: TokenInfo) => {
    onAddToken(token);
  };

  const handleConfirmDelete = () => {
    if (tokenToDelete) {
      onRemoveToken(tokenToDelete);
      setTokenToDelete(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden relative">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="-ml-2">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-bold text-foreground">管理代币</h2>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'add' | 'my')}>
          <TabsList className="w-full">
            <TabsTrigger value="add" className="flex-1">
              <Plus className="w-4 h-4 mr-1.5" />
              添加代币
            </TabsTrigger>
            <TabsTrigger value="my" className="flex-1">
              <Coins className="w-4 h-4 mr-1.5" />
              我的代币
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Add Token Tab Content */}
      {activeTab === 'add' && (
        <>
          {/* Search Input */}
          <div className="px-4 py-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索代币名称或符号..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="border-b border-border">
            <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative",
                    categoryFilter === cat.id
                      ? "text-accent"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat.label}
                  {categoryFilter === cat.id && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-accent rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Token List */}
          <div className="flex-1 overflow-auto px-4 py-2">
            <AnimatePresence mode="popLayout">
              {filteredTokens.map((token, index) => {
                const isAdded = addedSymbols.includes(token.symbol);
                
                return (
                  <motion.div
                    key={token.symbol}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.02 }}
                    className="py-2"
                  >
                    <button
                      onClick={() => !isAdded && handleAddToken(token)}
                      disabled={isAdded}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl transition-colors",
                        isAdded 
                          ? "bg-muted/50 opacity-60 cursor-not-allowed"
                          : "bg-card hover:bg-muted/50 cursor-pointer"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <CryptoIcon symbol={token.symbol} size="md" />
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground text-sm">{token.symbol}</p>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {token.networks.length} 链
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-xs text-muted-foreground">{token.name}</p>
                            <div className="flex items-center gap-0.5">
                              {token.networks.slice(0, 3).map((network) => (
                                <ChainIcon key={network} chainId={network} size="xs" />
                              ))}
                              {token.networks.length > 3 && (
                                <span className="text-[10px] text-muted-foreground">+{token.networks.length - 3}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-2">
                          <p className="text-sm font-medium text-foreground">
                            ${token.price < 0.01 ? token.price.toFixed(6) : token.price.toLocaleString()}
                          </p>
                          <p className={cn(
                            "text-xs flex items-center justify-end gap-0.5",
                            token.change24h >= 0 ? "text-success" : "text-destructive"
                          )}>
                            {token.change24h >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {Math.abs(token.change24h)}%
                          </p>
                        </div>
                        {isAdded ? (
                          <Check className="w-5 h-5 text-success" />
                        ) : (
                          <Plus className="w-5 h-5 text-accent" />
                        )}
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredTokens.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">未找到匹配的代币</p>
                <p className="text-xs text-muted-foreground mt-1">尝试其他搜索词</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* My Tokens Tab Content */}
      {activeTab === 'my' && (
        <div className="flex-1 overflow-auto px-4 py-2">
          {myTokens.length === 0 ? (
            <EmptyState
              icon={Coins}
              title="暂无代币"
              description="添加代币开始管理您的资产"
              action={{
                label: '添加代币',
                icon: Plus,
                onClick: () => setActiveTab('add'),
              }}
            />
          ) : (
            <AnimatePresence mode="popLayout">
              {myTokens.map((token, index) => (
                <motion.div
                  key={token.symbol}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ delay: index * 0.03 }}
                  className="py-2"
                >
                  <div className="w-full flex items-center justify-between p-3 rounded-xl bg-card">
                    <div className="flex items-center gap-3">
                      <CryptoIcon symbol={token.symbol} size="md" />
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground text-sm">{token.symbol}</p>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-success border-success/30">
                            {token.networks.length} 链
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-xs text-muted-foreground">{token.name}</p>
                          <div className="flex items-center gap-0.5">
                            {token.networks.map((network) => (
                              <div key={network} className="flex items-center">
                                <ChainIcon chainId={network} size="xs" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {token.totalBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ≈ ${token.totalUsdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <button
                        onClick={() => setTokenToDelete(token.symbol)}
                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!tokenToDelete} onOpenChange={(open) => !open && setTokenToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除代币</AlertDialogTitle>
            <AlertDialogDescription>
              确定要从钱包中删除 {tokenToDelete} 吗？此操作不会影响您的链上资产。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
