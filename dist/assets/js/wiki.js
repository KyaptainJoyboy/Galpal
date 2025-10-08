// Health Wiki Service for GalPal Medical App
class WikiSearchService {
    constructor() {
        this.cache = new Map();
        this.lastSearchTime = 0;
        this.searchDelay = 1000; // 1 second delay between searches
        this.cachedTopics = [];
        this.maxCacheSize = 50;
    }

    async search(query) {
        // Rate limiting
        const now = Date.now();
        if (now - this.lastSearchTime < this.searchDelay) {
            await this.delay(this.searchDelay - (now - this.lastSearchTime));
        }
        this.lastSearchTime = Date.now();

        try {
            // Check cache first
            const cacheKey = query.toLowerCase().trim();
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            // Try to search in local topics first
            const localResults = await this.searchLocalTopics(query);
            if (localResults.length > 0) {
                this.cacheResults(cacheKey, localResults);
                return localResults;
            }

            // If no local results, try external search (mock implementation)
            const externalResults = await this.searchExternal(query);
            this.cacheResults(cacheKey, externalResults);
            
            return externalResults;

        } catch (error) {
            console.error('Wiki search failed:', error);
            return this.getDefaultResults(query);
        }
    }

    async searchLocalTopics(query) {
        try {
            // Load cached topics if not already loaded
            if (this.cachedTopics.length === 0) {
                await this.loadCachedTopics();
            }

            const searchTerms = query.toLowerCase().split(' ');
            
            return this.cachedTopics.filter(topic => {
                const titleWords = topic.title.toLowerCase().split(' ');
                const summaryWords = topic.summary.toLowerCase().split(' ');
                const keywords = topic.keywords ? topic.keywords.map(k => k.toLowerCase()) : [];
                
                return searchTerms.some(term => 
                    titleWords.some(word => word.includes(term)) ||
                    summaryWords.some(word => word.includes(term)) ||
                    keywords.some(keyword => keyword.includes(term))
                );
            }).slice(0, 10); // Limit to 10 results

        } catch (error) {
            console.error('Local search failed:', error);
            return [];
        }
    }

    async loadCachedTopics() {
        try {
            const response = await fetch('./assets/data/wiki-cache.json');
            if (response.ok) {
                this.cachedTopics = await response.json();
            }
        } catch (error) {
            console.error('Failed to load cached topics:', error);
            this.cachedTopics = this.getDefaultTopics();
        }
    }

    async searchExternal(query) {
        // Mock external search - in a real implementation, this would call
        // trusted medical APIs or scrape trusted websites
        
        // Simulate API delay
        await this.delay(1500);

        // Generate mock results based on query
        return this.generateMockResults(query);
    }

    generateMockResults(query) {
        const mockResults = [
            {
                id: Date.now(),
                title: `Understanding ${this.capitalize(query)}`,
                summary: `${this.capitalize(query)} refers to a medical condition or parameter that requires proper understanding and monitoring. This information is provided for educational purposes.`,
                source: 'Mayo Clinic',
                sourceUrl: 'https://www.mayoclinic.org',
                redFlags: 'Seek immediate medical attention if symptoms worsen or persist.',
                normalValues: 'Normal values vary by age, sex, and individual health status.',
                cachedAt: new Date().toISOString(),
                keywords: [query.toLowerCase(), 'health', 'medical', 'condition']
            },
            {
                id: Date.now() + 1,
                title: `${this.capitalize(query)} - Clinical Overview`,
                summary: `Clinical information about ${query.toLowerCase()} including causes, symptoms, diagnosis, and treatment approaches commonly used in medical practice.`,
                source: 'National Institutes of Health',
                sourceUrl: 'https://www.nih.gov',
                redFlags: 'Consult healthcare provider for proper diagnosis and treatment.',
                normalValues: 'Reference ranges may vary between laboratories.',
                cachedAt: new Date().toISOString(),
                keywords: [query.toLowerCase(), 'clinical', 'medical', 'health']
            }
        ];

        return mockResults;
    }

    cacheResults(key, results) {
        // Implement LRU cache
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, results);
        
        // Also save to localStorage for persistence
        try {
            const cacheData = {
                [key]: {
                    results,
                    timestamp: Date.now()
                }
            };
            
            const existing = JSON.parse(localStorage.getItem('wikiCache') || '{}');
            const merged = { ...existing, ...cacheData };
            
            // Keep only recent entries (last 24 hours)
            const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
            const filtered = Object.entries(merged)
                .filter(([_, data]) => data.timestamp > dayAgo)
                .reduce((obj, [key, data]) => ({ ...obj, [key]: data }), {});
            
            localStorage.setItem('wikiCache', JSON.stringify(filtered));
        } catch (error) {
            console.warn('Failed to cache to localStorage:', error);
        }
    }

    loadCacheFromStorage() {
        try {
            const cached = JSON.parse(localStorage.getItem('wikiCache') || '{}');
            const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
            
            Object.entries(cached).forEach(([key, data]) => {
                if (data.timestamp > dayAgo) {
                    this.cache.set(key, data.results);
                }
            });
        } catch (error) {
            console.warn('Failed to load cache from storage:', error);
        }
    }

    getDefaultTopics() {
        return [
            {
                id: 1,
                title: 'Blood Glucose Levels',
                summary: 'Blood glucose (sugar) levels indicate how much glucose is in your blood. Normal fasting levels are 70-100 mg/dL.',
                source: 'American Diabetes Association',
                sourceUrl: 'https://diabetes.org',
                redFlags: 'Levels consistently above 126 mg/dL fasting or symptoms of extreme thirst, frequent urination.',
                normalValues: 'Fasting: 70-100 mg/dL; Random: <140 mg/dL',
                cachedAt: new Date().toISOString(),
                keywords: ['glucose', 'blood sugar', 'diabetes', 'hyperglycemia', 'hypoglycemia']
            },
            {
                id: 2,
                title: 'Cholesterol Management',
                summary: 'Cholesterol is a waxy substance in your blood. High levels can increase heart disease risk.',
                source: 'American Heart Association',
                sourceUrl: 'https://heart.org',
                redFlags: 'Total cholesterol >240 mg/dL or LDL >160 mg/dL with other risk factors.',
                normalValues: 'Total: <200 mg/dL; LDL: <100 mg/dL; HDL: ≥40 mg/dL (men), ≥50 mg/dL (women)',
                cachedAt: new Date().toISOString(),
                keywords: ['cholesterol', 'ldl', 'hdl', 'heart disease', 'cardiovascular']
            },
            {
                id: 3,
                title: 'Urinary Tract Infections',
                summary: 'UTIs are infections in any part of the urinary system. Most infections involve the bladder and urethra.',
                source: 'Mayo Clinic',
                sourceUrl: 'https://mayoclinic.org',
                redFlags: 'Fever, severe back pain, blood in urine, persistent symptoms despite treatment.',
                normalValues: 'Normal urine: Clear, light yellow, no protein/glucose, pH 4.5-8.0',
                cachedAt: new Date().toISOString(),
                keywords: ['uti', 'urinary tract infection', 'bladder', 'urine', 'cystitis']
            },
            {
                id: 4,
                title: 'Blood Pressure Guidelines',
                summary: 'Blood pressure measures the force of blood against artery walls. High BP increases cardiovascular risk.',
                source: 'American Heart Association',
                sourceUrl: 'https://heart.org',
                redFlags: 'BP >180/120 mmHg, severe headache, chest pain, difficulty breathing.',
                normalValues: 'Normal: <120/80 mmHg; Elevated: 120-129/<80; High: ≥130/80',
                cachedAt: new Date().toISOString(),
                keywords: ['blood pressure', 'hypertension', 'cardiovascular', 'systolic', 'diastolic']
            },
            {
                id: 5,
                title: 'HbA1c (Hemoglobin A1C)',
                summary: 'HbA1c reflects average blood sugar levels over 2-3 months. Used for diabetes diagnosis and monitoring.',
                source: 'American Diabetes Association',
                sourceUrl: 'https://diabetes.org',
                redFlags: 'HbA1c ≥6.5% indicates diabetes; rapid changes or extremely high values.',
                normalValues: 'Normal: <5.7%; Prediabetes: 5.7-6.4%; Diabetes: ≥6.5%',
                cachedAt: new Date().toISOString(),
                keywords: ['hba1c', 'hemoglobin a1c', 'diabetes', 'blood sugar', 'glycemic control']
            },
            {
                id: 6,
                title: 'Kidney Function Tests',
                summary: 'Tests like creatinine and protein in urine help assess how well kidneys filter waste from blood.',
                source: 'National Kidney Foundation',
                sourceUrl: 'https://kidney.org',
                redFlags: 'Persistent protein in urine, rising creatinine, reduced urine output.',
                normalValues: 'Creatinine: 0.6-1.2 mg/dL; Protein in urine: <150 mg/day',
                cachedAt: new Date().toISOString(),
                keywords: ['kidney', 'creatinine', 'protein', 'urine', 'renal function']
            }
        ];
    }

    getDefaultResults(query) {
        return [
            {
                id: Date.now(),
                title: `Search: ${query}`,
                summary: 'Unable to retrieve specific information at this time. Please try again or consult with a healthcare provider for accurate medical information.',
                source: 'GalPal System',
                sourceUrl: '#',
                redFlags: 'Always consult healthcare professionals for medical concerns.',
                normalValues: 'Reference values vary by individual and testing method.',
                cachedAt: new Date().toISOString(),
                keywords: [query.toLowerCase()]
            }
        ];
    }

    // Utility methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    // Popular searches and trending topics
    getPopularSearches() {
        return [
            'blood glucose',
            'cholesterol',
            'blood pressure',
            'urinary tract infection',
            'diabetes',
            'kidney function',
            'heart disease',
            'hypertension'
        ];
    }

    // Search suggestions based on partial input
    getSuggestions(partial) {
        const suggestions = [
            'blood glucose levels',
            'blood pressure',
            'cholesterol management',
            'diabetes symptoms',
            'hypertension',
            'kidney function',
            'urinary tract infection',
            'heart disease prevention',
            'medication interactions',
            'lab test results'
        ];

        const query = partial.toLowerCase().trim();
        if (query.length < 2) return [];

        return suggestions
            .filter(suggestion => suggestion.includes(query))
            .slice(0, 5);
    }

    // Get related topics
    getRelatedTopics(currentTopic) {
        const relations = {
            'glucose': ['diabetes', 'hba1c', 'insulin', 'diet'],
            'cholesterol': ['heart disease', 'triglycerides', 'statins', 'diet'],
            'blood pressure': ['hypertension', 'heart disease', 'stroke', 'medication'],
            'uti': ['kidney function', 'urinalysis', 'antibiotics', 'prevention'],
            'diabetes': ['glucose', 'hba1c', 'insulin', 'complications'],
            'kidney': ['creatinine', 'protein', 'blood pressure', 'diabetes']
        };

        const topic = currentTopic.toLowerCase();
        for (const [key, related] of Object.entries(relations)) {
            if (topic.includes(key)) {
                return related;
            }
        }

        return [];
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
        localStorage.removeItem('wikiCache');
    }

    // Get cache statistics
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            keys: Array.from(this.cache.keys())
        };
    }

    // Export search history
    exportSearchHistory() {
        const history = Array.from(this.cache.entries()).map(([query, results]) => ({
            query,
            resultCount: results.length,
            timestamp: results[0]?.cachedAt || new Date().toISOString()
        }));

        const dataStr = JSON.stringify(history, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `galpal-search-history-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

// Create global instance
const WikiService = new WikiSearchService();

// Initialize cache from storage when loaded
document.addEventListener('DOMContentLoaded', () => {
    WikiService.loadCacheFromStorage();
});