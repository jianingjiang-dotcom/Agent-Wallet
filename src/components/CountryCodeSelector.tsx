import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Search, Check } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

// Comprehensive countries list with flags
export const countries: Country[] = [
  // 亚洲
  { code: 'CN', name: '中国', dialCode: '+86', flag: '🇨🇳' },
  { code: 'HK', name: '中国香港', dialCode: '+852', flag: '🇭🇰' },
  { code: 'TW', name: '中国台湾', dialCode: '+886', flag: '🇹🇼' },
  { code: 'MO', name: '中国澳门', dialCode: '+853', flag: '🇲🇴' },
  { code: 'JP', name: '日本', dialCode: '+81', flag: '🇯🇵' },
  { code: 'KR', name: '韩国', dialCode: '+82', flag: '🇰🇷' },
  { code: 'SG', name: '新加坡', dialCode: '+65', flag: '🇸🇬' },
  { code: 'MY', name: '马来西亚', dialCode: '+60', flag: '🇲🇾' },
  { code: 'TH', name: '泰国', dialCode: '+66', flag: '🇹🇭' },
  { code: 'VN', name: '越南', dialCode: '+84', flag: '🇻🇳' },
  { code: 'PH', name: '菲律宾', dialCode: '+63', flag: '🇵🇭' },
  { code: 'ID', name: '印度尼西亚', dialCode: '+62', flag: '🇮🇩' },
  { code: 'IN', name: '印度', dialCode: '+91', flag: '🇮🇳' },
  { code: 'PK', name: '巴基斯坦', dialCode: '+92', flag: '🇵🇰' },
  { code: 'BD', name: '孟加拉国', dialCode: '+880', flag: '🇧🇩' },
  { code: 'LK', name: '斯里兰卡', dialCode: '+94', flag: '🇱🇰' },
  { code: 'NP', name: '尼泊尔', dialCode: '+977', flag: '🇳🇵' },
  { code: 'MM', name: '缅甸', dialCode: '+95', flag: '🇲🇲' },
  { code: 'KH', name: '柬埔寨', dialCode: '+855', flag: '🇰🇭' },
  { code: 'LA', name: '老挝', dialCode: '+856', flag: '🇱🇦' },
  { code: 'BN', name: '文莱', dialCode: '+673', flag: '🇧🇳' },
  { code: 'MN', name: '蒙古', dialCode: '+976', flag: '🇲🇳' },
  { code: 'KZ', name: '哈萨克斯坦', dialCode: '+7', flag: '🇰🇿' },
  { code: 'UZ', name: '乌兹别克斯坦', dialCode: '+998', flag: '🇺🇿' },
  { code: 'AZ', name: '阿塞拜疆', dialCode: '+994', flag: '🇦🇿' },
  { code: 'GE', name: '格鲁吉亚', dialCode: '+995', flag: '🇬🇪' },
  { code: 'AM', name: '亚美尼亚', dialCode: '+374', flag: '🇦🇲' },
  // 中东
  { code: 'AE', name: '阿联酋', dialCode: '+971', flag: '🇦🇪' },
  { code: 'SA', name: '沙特阿拉伯', dialCode: '+966', flag: '🇸🇦' },
  { code: 'QA', name: '卡塔尔', dialCode: '+974', flag: '🇶🇦' },
  { code: 'KW', name: '科威特', dialCode: '+965', flag: '🇰🇼' },
  { code: 'BH', name: '巴林', dialCode: '+973', flag: '🇧🇭' },
  { code: 'OM', name: '阿曼', dialCode: '+968', flag: '🇴🇲' },
  { code: 'IL', name: '以色列', dialCode: '+972', flag: '🇮🇱' },
  { code: 'JO', name: '约旦', dialCode: '+962', flag: '🇯🇴' },
  { code: 'LB', name: '黎巴嫩', dialCode: '+961', flag: '🇱🇧' },
  { code: 'IQ', name: '伊拉克', dialCode: '+964', flag: '🇮🇶' },
  { code: 'IR', name: '伊朗', dialCode: '+98', flag: '🇮🇷' },
  { code: 'TR', name: '土耳其', dialCode: '+90', flag: '🇹🇷' },
  // 欧洲
  { code: 'GB', name: '英国', dialCode: '+44', flag: '🇬🇧' },
  { code: 'DE', name: '德国', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: '法国', dialCode: '+33', flag: '🇫🇷' },
  { code: 'IT', name: '意大利', dialCode: '+39', flag: '🇮🇹' },
  { code: 'ES', name: '西班牙', dialCode: '+34', flag: '🇪🇸' },
  { code: 'PT', name: '葡萄牙', dialCode: '+351', flag: '🇵🇹' },
  { code: 'NL', name: '荷兰', dialCode: '+31', flag: '🇳🇱' },
  { code: 'BE', name: '比利时', dialCode: '+32', flag: '🇧🇪' },
  { code: 'CH', name: '瑞士', dialCode: '+41', flag: '🇨🇭' },
  { code: 'AT', name: '奥地利', dialCode: '+43', flag: '🇦🇹' },
  { code: 'SE', name: '瑞典', dialCode: '+46', flag: '🇸🇪' },
  { code: 'NO', name: '挪威', dialCode: '+47', flag: '🇳🇴' },
  { code: 'DK', name: '丹麦', dialCode: '+45', flag: '🇩🇰' },
  { code: 'FI', name: '芬兰', dialCode: '+358', flag: '🇫🇮' },
  { code: 'IE', name: '爱尔兰', dialCode: '+353', flag: '🇮🇪' },
  { code: 'PL', name: '波兰', dialCode: '+48', flag: '🇵🇱' },
  { code: 'CZ', name: '捷克', dialCode: '+420', flag: '🇨🇿' },
  { code: 'HU', name: '匈牙利', dialCode: '+36', flag: '🇭🇺' },
  { code: 'RO', name: '罗马尼亚', dialCode: '+40', flag: '🇷🇴' },
  { code: 'BG', name: '保加利亚', dialCode: '+359', flag: '🇧🇬' },
  { code: 'GR', name: '希腊', dialCode: '+30', flag: '🇬🇷' },
  { code: 'UA', name: '乌克兰', dialCode: '+380', flag: '🇺🇦' },
  { code: 'RU', name: '俄罗斯', dialCode: '+7', flag: '🇷🇺' },
  { code: 'BY', name: '白俄罗斯', dialCode: '+375', flag: '🇧🇾' },
  { code: 'HR', name: '克罗地亚', dialCode: '+385', flag: '🇭🇷' },
  { code: 'RS', name: '塞尔维亚', dialCode: '+381', flag: '🇷🇸' },
  { code: 'SK', name: '斯洛伐克', dialCode: '+421', flag: '🇸🇰' },
  { code: 'SI', name: '斯洛文尼亚', dialCode: '+386', flag: '🇸🇮' },
  { code: 'EE', name: '爱沙尼亚', dialCode: '+372', flag: '🇪🇪' },
  { code: 'LV', name: '拉脱维亚', dialCode: '+371', flag: '🇱🇻' },
  { code: 'LT', name: '立陶宛', dialCode: '+370', flag: '🇱🇹' },
  { code: 'LU', name: '卢森堡', dialCode: '+352', flag: '🇱🇺' },
  { code: 'MC', name: '摩纳哥', dialCode: '+377', flag: '🇲🇨' },
  { code: 'MT', name: '马耳他', dialCode: '+356', flag: '🇲🇹' },
  { code: 'IS', name: '冰岛', dialCode: '+354', flag: '🇮🇸' },
  { code: 'CY', name: '塞浦路斯', dialCode: '+357', flag: '🇨🇾' },
  // 北美洲
  { code: 'US', name: '美国', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: '加拿大', dialCode: '+1', flag: '🇨🇦' },
  { code: 'MX', name: '墨西哥', dialCode: '+52', flag: '🇲🇽' },
  { code: 'GT', name: '危地马拉', dialCode: '+502', flag: '🇬🇹' },
  { code: 'CU', name: '古巴', dialCode: '+53', flag: '🇨🇺' },
  { code: 'DO', name: '多米尼加', dialCode: '+1', flag: '🇩🇴' },
  { code: 'HT', name: '海地', dialCode: '+509', flag: '🇭🇹' },
  { code: 'JM', name: '牙买加', dialCode: '+1', flag: '🇯🇲' },
  { code: 'PR', name: '波多黎各', dialCode: '+1', flag: '🇵🇷' },
  { code: 'PA', name: '巴拿马', dialCode: '+507', flag: '🇵🇦' },
  { code: 'CR', name: '哥斯达黎加', dialCode: '+506', flag: '🇨🇷' },
  // 南美洲
  { code: 'BR', name: '巴西', dialCode: '+55', flag: '🇧🇷' },
  { code: 'AR', name: '阿根廷', dialCode: '+54', flag: '🇦🇷' },
  { code: 'CL', name: '智利', dialCode: '+56', flag: '🇨🇱' },
  { code: 'CO', name: '哥伦比亚', dialCode: '+57', flag: '🇨🇴' },
  { code: 'PE', name: '秘鲁', dialCode: '+51', flag: '🇵🇪' },
  { code: 'VE', name: '委内瑞拉', dialCode: '+58', flag: '🇻🇪' },
  { code: 'EC', name: '厄瓜多尔', dialCode: '+593', flag: '🇪🇨' },
  { code: 'BO', name: '玻利维亚', dialCode: '+591', flag: '🇧🇴' },
  { code: 'PY', name: '巴拉圭', dialCode: '+595', flag: '🇵🇾' },
  { code: 'UY', name: '乌拉圭', dialCode: '+598', flag: '🇺🇾' },
  // 大洋洲
  { code: 'AU', name: '澳大利亚', dialCode: '+61', flag: '🇦🇺' },
  { code: 'NZ', name: '新西兰', dialCode: '+64', flag: '🇳🇿' },
  { code: 'FJ', name: '斐济', dialCode: '+679', flag: '🇫🇯' },
  { code: 'PG', name: '巴布亚新几内亚', dialCode: '+675', flag: '🇵🇬' },
  // 非洲
  { code: 'ZA', name: '南非', dialCode: '+27', flag: '🇿🇦' },
  { code: 'EG', name: '埃及', dialCode: '+20', flag: '🇪🇬' },
  { code: 'NG', name: '尼日利亚', dialCode: '+234', flag: '🇳🇬' },
  { code: 'KE', name: '肯尼亚', dialCode: '+254', flag: '🇰🇪' },
  { code: 'GH', name: '加纳', dialCode: '+233', flag: '🇬🇭' },
  { code: 'MA', name: '摩洛哥', dialCode: '+212', flag: '🇲🇦' },
  { code: 'DZ', name: '阿尔及利亚', dialCode: '+213', flag: '🇩🇿' },
  { code: 'TN', name: '突尼斯', dialCode: '+216', flag: '🇹🇳' },
  { code: 'ET', name: '埃塞俄比亚', dialCode: '+251', flag: '🇪🇹' },
  { code: 'TZ', name: '坦桑尼亚', dialCode: '+255', flag: '🇹🇿' },
  { code: 'UG', name: '乌干达', dialCode: '+256', flag: '🇺🇬' },
  { code: 'SN', name: '塞内加尔', dialCode: '+221', flag: '🇸🇳' },
  { code: 'CI', name: '科特迪瓦', dialCode: '+225', flag: '🇨🇮' },
  { code: 'CM', name: '喀麦隆', dialCode: '+237', flag: '🇨🇲' },
  { code: 'AO', name: '安哥拉', dialCode: '+244', flag: '🇦🇴' },
  { code: 'ZW', name: '津巴布韦', dialCode: '+263', flag: '🇿🇼' },
  { code: 'MU', name: '毛里求斯', dialCode: '+230', flag: '🇲🇺' },
];

interface CountryCodeSelectorProps {
  selectedCountry: Country;
  onSelect: (country: Country) => void;
  className?: string;
}

export function CountryCodeSelector({ 
  selectedCountry, 
  onSelect,
  className 
}: CountryCodeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const query = searchQuery.toLowerCase();
    return countries.filter(
      c => c.name.toLowerCase().includes(query) || 
           c.dialCode.includes(query) ||
           c.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSelect = (country: Country) => {
    onSelect(country);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-1.5 px-3 h-full transition-colors",
          className
        )}
      >
        <span className="text-xl">{selectedCountry.flag}</span>
        <span className="text-sm font-medium text-foreground">{selectedCountry.dialCode}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[50vh]">
          <DrawerHeader className="border-b border-border pb-3">
            <DrawerTitle>选择国家/地区</DrawerTitle>
          </DrawerHeader>
          
          {/* Search */}
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索国家/地区或区号"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-4">
            {/* All countries */}
            <div className="pb-6">
              <div className="space-y-1">
                {filteredCountries.map((country) => (
                  <CountryItem
                    key={country.code}
                    country={country}
                    isSelected={selectedCountry.code === country.code}
                    onSelect={handleSelect}
                  />
                ))}
                {filteredCountries.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    未找到匹配的国家/地区
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </>
  );
}

interface CountryItemProps {
  country: Country;
  isSelected: boolean;
  onSelect: (country: Country) => void;
}

function CountryItem({ country, isSelected, onSelect }: CountryItemProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(country)}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-colors",
        isSelected ? "bg-accent/10" : ""
      )}
    >
      <span className="text-2xl">{country.flag}</span>
      <span className="flex-1 text-left font-medium text-foreground">
        {country.name}
      </span>
      <span className="text-sm text-muted-foreground">{country.dialCode}</span>
      {isSelected && (
        <Check className="w-5 h-5 text-accent" />
      )}
    </motion.button>
  );
}

export default CountryCodeSelector;
