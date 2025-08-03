// Internationalization system for AgroClash

export interface TranslationKey {
  [key: string]: string | TranslationKey
}

export interface Language {
  code: string
  name: string
  nativeName: string
  rtl: boolean
  translations: TranslationKey
}

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'hi' | 'ar' | 'zh'

// Translation function type
export type TranslateFunction = (key: string, params?: Record<string, string | number>) => string

// Language detection utilities
export class LanguageDetector {
  static detectBrowserLanguage(): string {
    if (typeof window === 'undefined') return 'en'
    
    const browserLang = navigator.language || (navigator as any).userLanguage
    return browserLang.split('-')[0] // Get language code without region
  }

  static detectRegion(): string {
    if (typeof window === 'undefined') return 'US'
    
    const browserLang = navigator.language || (navigator as any).userLanguage
    const parts = browserLang.split('-')
    return parts.length > 1 ? parts[1].toUpperCase() : 'US'
  }

  static isRTL(languageCode: string): boolean {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur']
    return rtlLanguages.includes(languageCode)
  }
}

// Translation interpolation
export class TranslationInterpolator {
  static interpolate(template: string, params: Record<string, string | number> = {}): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key]?.toString() || match
    })
  }

  static pluralize(
    template: string, 
    count: number, 
    params: Record<string, string | number> = {}
  ): string {
    const rules = template.split('|')
    let selectedRule = rules[0]

    if (count === 0 && rules.length > 2) {
      selectedRule = rules[2] // zero form
    } else if (count === 1) {
      selectedRule = rules[0] // singular
    } else if (rules.length > 1) {
      selectedRule = rules[1] // plural
    }

    return this.interpolate(selectedRule, { ...params, count })
  }
}

// Main translation class
export class I18n {
  private currentLanguage: SupportedLanguage = 'en'
  private languages: Map<SupportedLanguage, Language> = new Map()
  private fallbackLanguage: SupportedLanguage = 'en'
  private listeners: Set<(language: SupportedLanguage) => void> = new Set()

  constructor() {
    this.loadLanguages()
    this.currentLanguage = this.detectInitialLanguage()
  }

  private detectInitialLanguage(): SupportedLanguage {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('agroclash_language') as SupportedLanguage
      if (stored && this.languages.has(stored)) {
        return stored
      }
    }

    // Detect from browser
    const detected = LanguageDetector.detectBrowserLanguage() as SupportedLanguage
    return this.languages.has(detected) ? detected : this.fallbackLanguage
  }

  private loadLanguages() {
    // Load all supported languages
    this.languages.set('en', {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      rtl: false,
      translations: {} // Will be loaded dynamically
    })

    this.languages.set('es', {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      rtl: false,
      translations: {}
    })

    this.languages.set('fr', {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      rtl: false,
      translations: {}
    })

    this.languages.set('hi', {
      code: 'hi',
      name: 'Hindi',
      nativeName: 'हिन्दी',
      rtl: false,
      translations: {}
    })

    this.languages.set('ar', {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      rtl: true,
      translations: {}
    })

    this.languages.set('zh', {
      code: 'zh',
      name: 'Chinese',
      nativeName: '中文',
      rtl: false,
      translations: {}
    })
  }

  async loadTranslations(languageCode: SupportedLanguage): Promise<void> {
    try {
      // In a real app, this would load from files or API
      const translations = await this.fetchTranslations(languageCode)
      const language = this.languages.get(languageCode)
      if (language) {
        language.translations = translations
      }
    } catch (error) {
      console.error(`Failed to load translations for ${languageCode}:`, error)
    }
  }

  private async fetchTranslations(languageCode: SupportedLanguage): Promise<TranslationKey> {
    // Mock translation loading - in real app, load from files
    const mockTranslations: Record<SupportedLanguage, TranslationKey> = {
      en: {
        common: {
          loading: 'Loading...',
          error: 'Error',
          success: 'Success',
          cancel: 'Cancel',
          save: 'Save',
          delete: 'Delete',
          edit: 'Edit',
          add: 'Add',
          search: 'Search',
          filter: 'Filter',
          sort: 'Sort',
          refresh: 'Refresh'
        },
        dashboard: {
          title: 'Farm Dashboard',
          welcome: 'Welcome back, {{name}}!',
          totalPlots: 'Total Plots',
          activeCrops: 'Active Crops',
          readyToHarvest: 'Ready to Harvest',
          totalXP: 'Total XP'
        },
        plots: {
          title: 'Plot Management',
          addPlot: 'Add Plot',
          editPlot: 'Edit Plot',
          deletePlot: 'Delete Plot',
          plotName: 'Plot Name',
          area: 'Area',
          created: 'Created',
          noPlots: 'No plots yet',
          createFirstPlot: 'Create your first plot to start farming'
        },
        crops: {
          title: 'Crop Management',
          addCrop: 'Add Crop',
          plantCrop: 'Plant Crop',
          harvestCrop: 'Harvest Crop',
          cropName: 'Crop Name',
          variety: 'Variety',
          status: 'Status',
          growthStage: 'Growth Stage',
          planted: 'Planted',
          growing: 'Growing',
          flowering: 'Flowering',
          ready: 'Ready',
          harvested: 'Harvested'
        }
      },
      es: {
        common: {
          loading: 'Cargando...',
          error: 'Error',
          success: 'Éxito',
          cancel: 'Cancelar',
          save: 'Guardar',
          delete: 'Eliminar',
          edit: 'Editar',
          add: 'Agregar',
          search: 'Buscar',
          filter: 'Filtrar',
          sort: 'Ordenar',
          refresh: 'Actualizar'
        },
        dashboard: {
          title: 'Panel de Granja',
          welcome: '¡Bienvenido de vuelta, {{name}}!',
          totalPlots: 'Parcelas Totales',
          activeCrops: 'Cultivos Activos',
          readyToHarvest: 'Listo para Cosechar',
          totalXP: 'XP Total'
        },
        plots: {
          title: 'Gestión de Parcelas',
          addPlot: 'Agregar Parcela',
          editPlot: 'Editar Parcela',
          deletePlot: 'Eliminar Parcela',
          plotName: 'Nombre de Parcela',
          area: 'Área',
          created: 'Creado',
          noPlots: 'No hay parcelas aún',
          createFirstPlot: 'Crea tu primera parcela para comenzar a cultivar'
        },
        crops: {
          title: 'Gestión de Cultivos',
          addCrop: 'Agregar Cultivo',
          plantCrop: 'Plantar Cultivo',
          harvestCrop: 'Cosechar Cultivo',
          cropName: 'Nombre del Cultivo',
          variety: 'Variedad',
          status: 'Estado',
          growthStage: 'Etapa de Crecimiento',
          planted: 'Plantado',
          growing: 'Creciendo',
          flowering: 'Floreciendo',
          ready: 'Listo',
          harvested: 'Cosechado'
        }
      },
      fr: {
        common: {
          loading: 'Chargement...',
          error: 'Erreur',
          success: 'Succès',
          cancel: 'Annuler',
          save: 'Sauvegarder',
          delete: 'Supprimer',
          edit: 'Modifier',
          add: 'Ajouter',
          search: 'Rechercher',
          filter: 'Filtrer',
          sort: 'Trier',
          refresh: 'Actualiser'
        },
        dashboard: {
          title: 'Tableau de Bord de la Ferme',
          welcome: 'Bon retour, {{name}}!',
          totalPlots: 'Parcelles Totales',
          activeCrops: 'Cultures Actives',
          readyToHarvest: 'Prêt à Récolter',
          totalXP: 'XP Total'
        },
        plots: {
          title: 'Gestion des Parcelles',
          addPlot: 'Ajouter Parcelle',
          editPlot: 'Modifier Parcelle',
          deletePlot: 'Supprimer Parcelle',
          plotName: 'Nom de la Parcelle',
          area: 'Superficie',
          created: 'Créé',
          noPlots: 'Aucune parcelle encore',
          createFirstPlot: 'Créez votre première parcelle pour commencer à cultiver'
        },
        crops: {
          title: 'Gestion des Cultures',
          addCrop: 'Ajouter Culture',
          plantCrop: 'Planter Culture',
          harvestCrop: 'Récolter Culture',
          cropName: 'Nom de la Culture',
          variety: 'Variété',
          status: 'Statut',
          growthStage: 'Stade de Croissance',
          planted: 'Planté',
          growing: 'En Croissance',
          flowering: 'En Fleur',
          ready: 'Prêt',
          harvested: 'Récolté'
        }
      },
      hi: {
        common: {
          loading: 'लोड हो रहा है...',
          error: 'त्रुटि',
          success: 'सफलता',
          cancel: 'रद्द करें',
          save: 'सहेजें',
          delete: 'हटाएं',
          edit: 'संपादित करें',
          add: 'जोड़ें',
          search: 'खोजें',
          filter: 'फ़िल्टर',
          sort: 'क्रमबद्ध करें',
          refresh: 'ताज़ा करें'
        },
        dashboard: {
          title: 'फार्म डैशबोर्ड',
          welcome: 'वापसी पर स्वागत है, {{name}}!',
          totalPlots: 'कुल भूखंड',
          activeCrops: 'सक्रिय फसलें',
          readyToHarvest: 'कटाई के लिए तैयार',
          totalXP: 'कुल XP'
        },
        plots: {
          title: 'भूखंड प्रबंधन',
          addPlot: 'भूखंड जोड़ें',
          editPlot: 'भूखंड संपादित करें',
          deletePlot: 'भूखंड हटाएं',
          plotName: 'भूखंड का नाम',
          area: 'क्षेत्रफल',
          created: 'बनाया गया',
          noPlots: 'अभी तक कोई भूखंड नहीं',
          createFirstPlot: 'खेती शुरू करने के लिए अपना पहला भूखंड बनाएं'
        },
        crops: {
          title: 'फसल प्रबंधन',
          addCrop: 'फसल जोड़ें',
          plantCrop: 'फसल लगाएं',
          harvestCrop: 'फसल काटें',
          cropName: 'फसल का नाम',
          variety: 'किस्म',
          status: 'स्थिति',
          growthStage: 'विकास चरण',
          planted: 'लगाया गया',
          growing: 'बढ़ रहा है',
          flowering: 'फूल आ रहे हैं',
          ready: 'तैयार',
          harvested: 'कटाई की गई'
        }
      },
      ar: {
        common: {
          loading: 'جاري التحميل...',
          error: 'خطأ',
          success: 'نجح',
          cancel: 'إلغاء',
          save: 'حفظ',
          delete: 'حذف',
          edit: 'تعديل',
          add: 'إضافة',
          search: 'بحث',
          filter: 'تصفية',
          sort: 'ترتيب',
          refresh: 'تحديث'
        },
        dashboard: {
          title: 'لوحة تحكم المزرعة',
          welcome: 'مرحباً بعودتك، {{name}}!',
          totalPlots: 'إجمالي القطع',
          activeCrops: 'المحاصيل النشطة',
          readyToHarvest: 'جاهز للحصاد',
          totalXP: 'إجمالي النقاط'
        },
        plots: {
          title: 'إدارة القطع',
          addPlot: 'إضافة قطعة',
          editPlot: 'تعديل القطعة',
          deletePlot: 'حذف القطعة',
          plotName: 'اسم القطعة',
          area: 'المساحة',
          created: 'تم الإنشاء',
          noPlots: 'لا توجد قطع بعد',
          createFirstPlot: 'أنشئ قطعتك الأولى لبدء الزراعة'
        },
        crops: {
          title: 'إدارة المحاصيل',
          addCrop: 'إضافة محصول',
          plantCrop: 'زراعة محصول',
          harvestCrop: 'حصاد المحصول',
          cropName: 'اسم المحصول',
          variety: 'الصنف',
          status: 'الحالة',
          growthStage: 'مرحلة النمو',
          planted: 'مزروع',
          growing: 'ينمو',
          flowering: 'يزهر',
          ready: 'جاهز',
          harvested: 'محصود'
        }
      },
      zh: {
        common: {
          loading: '加载中...',
          error: '错误',
          success: '成功',
          cancel: '取消',
          save: '保存',
          delete: '删除',
          edit: '编辑',
          add: '添加',
          search: '搜索',
          filter: '筛选',
          sort: '排序',
          refresh: '刷新'
        },
        dashboard: {
          title: '农场仪表板',
          welcome: '欢迎回来，{{name}}！',
          totalPlots: '总地块',
          activeCrops: '活跃作物',
          readyToHarvest: '准备收获',
          totalXP: '总经验值'
        },
        plots: {
          title: '地块管理',
          addPlot: '添加地块',
          editPlot: '编辑地块',
          deletePlot: '删除地块',
          plotName: '地块名称',
          area: '面积',
          created: '创建时间',
          noPlots: '还没有地块',
          createFirstPlot: '创建您的第一个地块开始种植'
        },
        crops: {
          title: '作物管理',
          addCrop: '添加作物',
          plantCrop: '种植作物',
          harvestCrop: '收获作物',
          cropName: '作物名称',
          variety: '品种',
          status: '状态',
          growthStage: '生长阶段',
          planted: '已种植',
          growing: '生长中',
          flowering: '开花中',
          ready: '准备就绪',
          harvested: '已收获'
        }
      }
    }

    return mockTranslations[languageCode] || mockTranslations.en
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage
  }

  getSupportedLanguages(): Language[] {
    return Array.from(this.languages.values())
  }

  async setLanguage(languageCode: SupportedLanguage): Promise<void> {
    if (!this.languages.has(languageCode)) {
      throw new Error(`Unsupported language: ${languageCode}`)
    }

    // Load translations if not already loaded
    const language = this.languages.get(languageCode)!
    if (Object.keys(language.translations).length === 0) {
      await this.loadTranslations(languageCode)
    }

    this.currentLanguage = languageCode

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('agroclash_language', languageCode)
      document.documentElement.lang = languageCode
      document.documentElement.dir = language.rtl ? 'rtl' : 'ltr'
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(languageCode))
  }

  translate(key: string, params?: Record<string, string | number>): string {
    const language = this.languages.get(this.currentLanguage)
    if (!language) return key

    const translation = this.getNestedTranslation(language.translations, key)
    if (!translation) {
      // Try fallback language
      const fallbackLanguage = this.languages.get(this.fallbackLanguage)
      if (fallbackLanguage) {
        const fallbackTranslation = this.getNestedTranslation(fallbackLanguage.translations, key)
        if (fallbackTranslation) {
          return params ? TranslationInterpolator.interpolate(fallbackTranslation, params) : fallbackTranslation
        }
      }
      return key // Return key if no translation found
    }

    return params ? TranslationInterpolator.interpolate(translation, params) : translation
  }

  private getNestedTranslation(translations: TranslationKey, key: string): string | null {
    const keys = key.split('.')
    let current: any = translations

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k]
      } else {
        return null
      }
    }

    return typeof current === 'string' ? current : null
  }

  pluralize(key: string, count: number, params?: Record<string, string | number>): string {
    const template = this.translate(key, params)
    return TranslationInterpolator.pluralize(template, count, { ...params, count })
  }

  onLanguageChange(callback: (language: SupportedLanguage) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  isRTL(): boolean {
    const language = this.languages.get(this.currentLanguage)
    return language?.rtl || false
  }

  formatNumber(number: number): string {
    const language = this.languages.get(this.currentLanguage)
    if (!language) return number.toString()

    try {
      return new Intl.NumberFormat(language.code).format(number)
    } catch {
      return number.toString()
    }
  }

  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const language = this.languages.get(this.currentLanguage)
    if (!language) return date.toLocaleDateString()

    try {
      return new Intl.DateTimeFormat(language.code, options).format(date)
    } catch {
      return date.toLocaleDateString()
    }
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    const language = this.languages.get(this.currentLanguage)
    if (!language) return `${currency} ${amount}`

    try {
      return new Intl.NumberFormat(language.code, {
        style: 'currency',
        currency
      }).format(amount)
    } catch {
      return `${currency} ${amount}`
    }
  }
}

// Global instance
export const i18n = new I18n()

// Initialize translations for current language
i18n.loadTranslations(i18n.getCurrentLanguage())