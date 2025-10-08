// Database Management for GalPal Medical App - Supabase + IndexedDB Hybrid
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

class DatabaseService {
    constructor() {
        this.supabase = null;
        this.localDB = null;
        this.useLocal = false;
        this.initialized = false;
    }

    async init() {
        try {
            // Wait for ENV_CONFIG to be available
            let retries = 0;
            while (!window.ENV_CONFIG && retries < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                retries++;
            }

            // Initialize Supabase using environment variables
            const supabaseUrl = window.ENV_CONFIG?.supabaseUrl;
            const supabaseKey = window.ENV_CONFIG?.supabaseAnonKey;

            if (!supabaseUrl || !supabaseKey) {
                console.warn('Supabase credentials not found, using local database only');
                this.useLocal = true;
                await this.initLocalDB();
                this.initialized = true;
                return;
            }

            this.supabase = createClient(supabaseUrl, supabaseKey);

            // Always initialize local DB as well
            await this.initLocalDB();

            // Test Supabase connection
            try {
                const { error } = await this.supabase.from('patient_profiles').select('count').limit(1);
                if (!error) {
                    console.log('✓ Supabase connected - Using cloud database');
                    this.useLocal = false;
                } else {
                    console.log('✓ Using local IndexedDB');
                    this.useLocal = true;
                }
            } catch (err) {
                console.log('✓ Using local IndexedDB');
                this.useLocal = true;
            }

            this.initialized = true;
        } catch (error) {
            console.error('Database initialization failed:', error);
            this.useLocal = true;
            await this.initLocalDB();
            this.initialized = true;
        }
    }

    async initLocalDB() {
        return new Promise((resolve, reject) => {
            // Use version 2 to force upgrade if needed
            const request = indexedDB.open('GalPalDB', 2);

            request.onerror = () => {
                console.error('Failed to open local database');
                reject(new Error('Failed to open local database'));
            };

            request.onsuccess = (event) => {
                this.localDB = event.target.result;
                console.log('✓ Local database opened successfully');
                console.log('Available object stores:', Array.from(this.localDB.objectStoreNames));
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('Upgrading database schema...');

                // Delete old stores if they exist to recreate them
                if (db.objectStoreNames.contains('patients')) {
                    db.deleteObjectStore('patients');
                }
                if (db.objectStoreNames.contains('analyses')) {
                    db.deleteObjectStore('analyses');
                }

                // Create patients store
                const patientsStore = db.createObjectStore('patients', { keyPath: 'id' });
                patientsStore.createIndex('name', 'name', { unique: false });
                patientsStore.createIndex('created_at', 'created_at', { unique: false });
                console.log('✓ Created patients object store');

                // Create analyses store
                const analysesStore = db.createObjectStore('analyses', { keyPath: 'id' });
                analysesStore.createIndex('patient_id', 'patient_id', { unique: false });
                analysesStore.createIndex('test_date', 'test_date', { unique: false });
                analysesStore.createIndex('created_at', 'created_at', { unique: false });
                console.log('✓ Created analyses object store');
            };
        });
    }

    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Patient Profile Methods
    async addPatient(patientData) {
        try {
            if (this.useLocal) {
                // Ensure database is initialized
                if (!this.localDB) {
                    await this.initLocalDB();
                }

                const patient = {
                    id: this.generateId(),
                    ...patientData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                return new Promise((resolve, reject) => {
                    try {
                        const transaction = this.localDB.transaction(['patients'], 'readwrite');

                        transaction.onerror = (event) => {
                            console.error('Transaction error:', event.target.error);
                            reject(new Error('Database transaction failed'));
                        };

                        const store = transaction.objectStore('patients');
                        const request = store.add(patient);

                        request.onsuccess = () => {
                            console.log('✓ Patient added to local database');
                            resolve(patient);
                        };

                        request.onerror = (event) => {
                            console.error('Add patient error:', event.target.error);
                            reject(new Error('Failed to add patient'));
                        };
                    } catch (err) {
                        console.error('Transaction setup error:', err);
                        reject(err);
                    }
                });
            } else {
                const { data, error } = await this.supabase
                    .from('patient_profiles')
                    .insert([{
                        name: patientData.name,
                        age: patientData.age,
                        sex: patientData.sex,
                        mrn: patientData.mrn || null,
                        date_of_birth: patientData.dateOfBirth || null,
                        contact_email: patientData.email || null,
                        contact_phone: patientData.phone || null,
                        medical_history: patientData.medicalHistory || null,
                        current_medications: patientData.medications || null,
                        allergies: patientData.allergies || null
                    }])
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }
        } catch (error) {
            console.error('Error adding patient:', error);
            throw error;
        }
    }

    async getPatients() {
        try {
            if (this.useLocal) {
                // Ensure database is initialized
                if (!this.localDB) {
                    await this.initLocalDB();
                }

                return new Promise((resolve, reject) => {
                    try {
                        const transaction = this.localDB.transaction(['patients'], 'readonly');

                        transaction.onerror = (event) => {
                            console.error('Transaction error:', event.target.error);
                            resolve([]); // Return empty array instead of rejecting
                        };

                        const store = transaction.objectStore('patients');
                        const request = store.getAll();

                        request.onsuccess = () => {
                            const patients = request.result.sort((a, b) =>
                                new Date(b.created_at) - new Date(a.created_at)
                            );
                            resolve(patients);
                        };

                        request.onerror = (event) => {
                            console.error('Get patients error:', event.target.error);
                            resolve([]); // Return empty array instead of rejecting
                        };
                    } catch (err) {
                        console.error('Transaction setup error:', err);
                        resolve([]); // Return empty array instead of rejecting
                    }
                });
            } else {
                const { data, error } = await this.supabase
                    .from('patient_profiles')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return data || [];
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
            return [];
        }
    }

    async getPatient(id) {
        try {
            if (this.useLocal) {
                return new Promise((resolve, reject) => {
                    const transaction = this.localDB.transaction(['patients'], 'readonly');
                    const store = transaction.objectStore('patients');
                    const request = store.get(id);

                    request.onsuccess = () => resolve(request.result || null);
                    request.onerror = () => reject(request.error);
                });
            } else {
                const { data, error } = await this.supabase
                    .from('patient_profiles')
                    .select('*')
                    .eq('id', id)
                    .maybeSingle();

                if (error) throw error;
                return data;
            }
        } catch (error) {
            console.error('Error fetching patient:', error);
            return null;
        }
    }

    async updatePatient(id, patientData) {
        try {
            if (this.useLocal) {
                return new Promise((resolve, reject) => {
                    const transaction = this.localDB.transaction(['patients'], 'readwrite');
                    const store = transaction.objectStore('patients');
                    const getRequest = store.get(id);

                    getRequest.onsuccess = () => {
                        const patient = {
                            ...getRequest.result,
                            ...patientData,
                            updated_at: new Date().toISOString()
                        };
                        const updateRequest = store.put(patient);
                        updateRequest.onsuccess = () => resolve(patient);
                        updateRequest.onerror = () => reject(updateRequest.error);
                    };
                    getRequest.onerror = () => reject(getRequest.error);
                });
            } else {
                const { data, error } = await this.supabase
                    .from('patient_profiles')
                    .update({
                        name: patientData.name,
                        age: patientData.age,
                        sex: patientData.sex,
                        mrn: patientData.mrn || null,
                        date_of_birth: patientData.dateOfBirth || null,
                        contact_email: patientData.email || null,
                        contact_phone: patientData.phone || null,
                        medical_history: patientData.medicalHistory || null,
                        current_medications: patientData.medications || null,
                        allergies: patientData.allergies || null
                    })
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }
        } catch (error) {
            console.error('Error updating patient:', error);
            throw error;
        }
    }

    async deletePatient(id) {
        try {
            if (this.useLocal) {
                return new Promise((resolve, reject) => {
                    const transaction = this.localDB.transaction(['patients', 'analyses'], 'readwrite');

                    // Delete patient
                    const patientStore = transaction.objectStore('patients');
                    patientStore.delete(id);

                    // Delete related analyses
                    const analysesStore = transaction.objectStore('analyses');
                    const index = analysesStore.index('patient_id');
                    const request = index.openCursor(IDBKeyRange.only(id));

                    request.onsuccess = (event) => {
                        const cursor = event.target.result;
                        if (cursor) {
                            analysesStore.delete(cursor.primaryKey);
                            cursor.continue();
                        }
                    };

                    transaction.oncomplete = () => resolve(true);
                    transaction.onerror = () => reject(transaction.error);
                });
            } else {
                const { error } = await this.supabase
                    .from('patient_profiles')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                return true;
            }
        } catch (error) {
            console.error('Error deleting patient:', error);
            throw error;
        }
    }

    async searchPatients(searchTerm) {
        try {
            const patients = await this.getPatients();
            const lowerSearch = searchTerm.toLowerCase();
            return patients.filter(p =>
                p.name.toLowerCase().includes(lowerSearch) ||
                (p.mrn && p.mrn.toLowerCase().includes(lowerSearch))
            );
        } catch (error) {
            console.error('Error searching patients:', error);
            return [];
        }
    }

    // Medical Analysis Methods
    async addAnalysis(analysisData) {
        try {
            if (this.useLocal) {
                // Ensure database is initialized
                if (!this.localDB) {
                    await this.initLocalDB();
                }

                const analysis = {
                    id: this.generateId(),
                    patient_id: analysisData.patientId,
                    fluid_type: analysisData.fluidType,
                    test_date: analysisData.testDate,
                    metrics: analysisData.metrics || {},
                    ai_summary: analysisData.aiSummary || null,
                    ai_interpretation: analysisData.aiInterpretation || null,
                    detected_conditions: analysisData.detectedConditions || [],
                    risk_factors: analysisData.riskFactors || [],
                    recommendations: analysisData.recommendations || null,
                    notes: analysisData.notes || null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                return new Promise((resolve, reject) => {
                    try {
                        const transaction = this.localDB.transaction(['analyses'], 'readwrite');

                        transaction.onerror = (event) => {
                            console.error('Transaction error:', event.target.error);
                            reject(new Error('Database transaction failed'));
                        };

                        const store = transaction.objectStore('analyses');
                        const request = store.add(analysis);

                        request.onsuccess = () => {
                            console.log('✓ Analysis added to local database');
                            resolve(analysis);
                        };

                        request.onerror = (event) => {
                            console.error('Add analysis error:', event.target.error);
                            reject(new Error('Failed to add analysis'));
                        };
                    } catch (err) {
                        console.error('Transaction setup error:', err);
                        reject(err);
                    }
                });
            } else {
                const { data, error } = await this.supabase
                    .from('medical_analyses')
                    .insert([{
                        patient_id: analysisData.patientId,
                        fluid_type: analysisData.fluidType,
                        test_date: analysisData.testDate,
                        metrics: analysisData.metrics || {},
                        ai_summary: analysisData.aiSummary || null,
                        ai_interpretation: analysisData.aiInterpretation || null,
                        detected_conditions: analysisData.detectedConditions || [],
                        risk_factors: analysisData.riskFactors || [],
                        recommendations: analysisData.recommendations || null,
                        notes: analysisData.notes || null
                    }])
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }
        } catch (error) {
            console.error('Error adding analysis:', error);
            throw error;
        }
    }

    async getAnalyses(patientId = null) {
        try {
            if (this.useLocal) {
                return new Promise((resolve, reject) => {
                    const transaction = this.localDB.transaction(['analyses'], 'readonly');
                    const store = transaction.objectStore('analyses');
                    const request = store.getAll();

                    request.onsuccess = () => {
                        let analyses = request.result;
                        if (patientId) {
                            analyses = analyses.filter(a => a.patient_id === patientId);
                        }
                        analyses.sort((a, b) => new Date(b.test_date) - new Date(a.test_date));
                        resolve(analyses);
                    };
                    request.onerror = () => reject(request.error);
                });
            } else {
                let query = this.supabase
                    .from('medical_analyses')
                    .select('*, patient_profiles(*)')
                    .order('test_date', { ascending: false });

                if (patientId) {
                    query = query.eq('patient_id', patientId);
                }

                const { data, error } = await query;
                if (error) throw error;
                return data || [];
            }
        } catch (error) {
            console.error('Error fetching analyses:', error);
            return [];
        }
    }

    async getAllAnalyses() {
        return this.getAnalyses();
    }

    async getAnalysis(analysisId) {
        try {
            if (this.useLocal) {
                // Ensure database is initialized
                if (!this.localDB) {
                    await this.initLocalDB();
                }

                return new Promise((resolve, reject) => {
                    try {
                        const transaction = this.localDB.transaction(['analyses'], 'readonly');

                        transaction.onerror = (event) => {
                            console.error('Transaction error:', event.target.error);
                            resolve(null);
                        };

                        const store = transaction.objectStore('analyses');
                        const request = store.get(analysisId);

                        request.onsuccess = () => {
                            resolve(request.result || null);
                        };

                        request.onerror = (event) => {
                            console.error('Get analysis error:', event.target.error);
                            resolve(null);
                        };
                    } catch (err) {
                        console.error('Transaction setup error:', err);
                        resolve(null);
                    }
                });
            } else {
                const { data, error } = await this.supabase
                    .from('medical_analyses')
                    .select('*, patient_profiles(*)')
                    .eq('id', analysisId)
                    .maybeSingle();

                if (error) throw error;
                return data;
            }
        } catch (error) {
            console.error('Error fetching analysis:', error);
            return null;
        }
    }

    async exportData() {
        try {
            const patients = await this.getPatients();
            const analyses = await this.getAnalyses();

            return {
                patients,
                analyses,
                exportDate: new Date().toISOString(),
                version: '1.0',
                database: this.useLocal ? 'local' : 'cloud'
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    async importData(importedData) {
        const results = {
            patients: 0,
            analyses: 0,
            errors: []
        };

        try {
            if (importedData.patients && Array.isArray(importedData.patients)) {
                for (const patient of importedData.patients) {
                    try {
                        await this.addPatient(patient);
                        results.patients++;
                    } catch (error) {
                        results.errors.push(`Patient ${patient.name}: ${error.message}`);
                    }
                }
            }

            if (importedData.analyses && Array.isArray(importedData.analyses)) {
                for (const analysis of importedData.analyses) {
                    try {
                        await this.addAnalysis(analysis);
                        results.analyses++;
                    } catch (error) {
                        results.errors.push(`Analysis: ${error.message}`);
                    }
                }
            }

            return results;
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const DB = new DatabaseService();

// Initialize asynchronously
DB.init().catch(err => {
    console.error('Failed to initialize database:', err);
});

window.DB = DB;
export default DB;
