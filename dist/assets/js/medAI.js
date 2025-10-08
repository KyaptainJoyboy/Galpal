// Medical AI Analysis Module for GalPal
class MedicalAI {
    constructor() {
        this.version = '1.0.0';
        this.analysisHistory = [];
    }

    async analyze(readingData) {
        try {
            const analysis = {
                summary: '',
                risks: [],
                advisories: [],
                citations: [],
                confidence: 0,
                timestamp: new Date().toISOString()
            };

            // Route to specific analysis based on fluid type
            switch (readingData.fluidType) {
                case 'blood':
                    return await this.analyzeBlood(readingData, analysis);
                case 'urine':
                    return await this.analyzeUrine(readingData, analysis);
                default:
                    throw new Error('Unsupported fluid type');
            }
        } catch (error) {
            console.error('AI Analysis failed:', error);
            return this.getDefaultAnalysis(error.message);
        }
    }

    async analyzeBlood(data, analysis) {
        const metrics = data.metrics;
        const patientData = data.patient;

        let summaryParts = [];
        let riskScore = 0;

        // Glucose Analysis
        if (metrics.glucose !== null) {
            const glucoseAnalysis = this.analyzeGlucose(metrics.glucose, patientData);
            summaryParts.push(glucoseAnalysis.summary);
            analysis.risks.push(...glucoseAnalysis.risks);
            analysis.advisories.push(...glucoseAnalysis.advisories);
            riskScore += glucoseAnalysis.riskScore;
        }

        // HbA1c Analysis
        if (metrics.hba1c !== null) {
            const hba1cAnalysis = this.analyzeHbA1c(metrics.hba1c, patientData);
            summaryParts.push(hba1cAnalysis.summary);
            analysis.risks.push(...hba1cAnalysis.risks);
            analysis.advisories.push(...hba1cAnalysis.advisories);
            riskScore += hba1cAnalysis.riskScore;
        }

        // Anemia Markers Analysis
        if (metrics.hemoglobin !== null || metrics.hematocrit !== null || metrics.rbcCount !== null) {
            const anemiaAnalysis = this.analyzeAnemiaMarkers(metrics, patientData);
            summaryParts.push(anemiaAnalysis.summary);
            analysis.risks.push(...anemiaAnalysis.risks);
            analysis.advisories.push(...anemiaAnalysis.advisories);
            riskScore += anemiaAnalysis.riskScore;
        }

        // WBC Analysis
        if (metrics.wbcCount !== null) {
            const wbcAnalysis = this.analyzeWBC(metrics.wbcCount, patientData);
            summaryParts.push(wbcAnalysis.summary);
            analysis.risks.push(...wbcAnalysis.risks);
            analysis.advisories.push(...wbcAnalysis.advisories);
            riskScore += wbcAnalysis.riskScore;
        }

        // Platelet Analysis
        if (metrics.plateletCount !== null) {
            const plateletAnalysis = this.analyzePlatelets(metrics.plateletCount, patientData);
            summaryParts.push(plateletAnalysis.summary);
            analysis.risks.push(...plateletAnalysis.risks);
            analysis.advisories.push(...plateletAnalysis.advisories);
            riskScore += plateletAnalysis.riskScore;
        }

        // Overall Summary
        analysis.summary = this.generateBloodSummary(summaryParts, riskScore, patientData);
        analysis.confidence = this.calculateConfidence(metrics);
        analysis.citations = this.getBloodCitations();

        return analysis;
    }

    analyzeAnemiaMarkers(metrics, patient) {
        const result = {
            summary: '',
            risks: [],
            advisories: [],
            riskScore: 0
        };

        const sex = patient?.sex || 'unknown';
        let anemiaIndicators = [];

        // Hemoglobin analysis
        if (metrics.hemoglobin !== null) {
            const hemoglobinLow = (sex === 'male' && metrics.hemoglobin < 13.5) ||
                                 (sex === 'female' && metrics.hemoglobin < 12.0);
            if (hemoglobinLow) {
                anemiaIndicators.push(`low hemoglobin (${metrics.hemoglobin} g/dL)`);
            } else if ((sex === 'male' && metrics.hemoglobin >= 13.5) ||
                      (sex === 'female' && metrics.hemoglobin >= 12.0)) {
                result.summary = `Hemoglobin level is normal at ${metrics.hemoglobin} g/dL`;
            }
        }

        // Hematocrit analysis
        if (metrics.hematocrit !== null) {
            const hematocritLow = (sex === 'male' && metrics.hematocrit < 38.8) ||
                                 (sex === 'female' && metrics.hematocrit < 34.9);
            if (hematocritLow) {
                anemiaIndicators.push(`low hematocrit (${metrics.hematocrit}%)`);
            }
        }

        // RBC Count analysis
        if (metrics.rbcCount !== null) {
            const rbcLow = (sex === 'male' && metrics.rbcCount < 4.5) ||
                          (sex === 'female' && metrics.rbcCount < 4.0);
            if (rbcLow) {
                anemiaIndicators.push(`low RBC count (${metrics.rbcCount} x10⁶/μL)`);
            }
        }

        if (anemiaIndicators.length > 0) {
            result.summary = `Anemia indicators detected: ${anemiaIndicators.join(', ')}`;
            result.risks.push({
                level: 'MODERATE',
                description: 'Possible anemia'
            });
            result.advisories.push('Iron studies and complete blood count evaluation recommended');
            result.advisories.push('Consult healthcare provider for proper diagnosis and treatment');
            result.riskScore = 1;
        }

        return result;
    }

    analyzeGlucose(glucose, patient) {
        const result = {
            summary: '',
            risks: [],
            advisories: [],
            riskScore: 0
        };

        if (glucose < 70) {
            result.summary = `Blood glucose is low at ${glucose} mg/dL`;
            result.risks.push({
                level: 'HIGH',
                description: 'Hypoglycemia detected'
            });
            result.advisories.push('Consume 15-20g of fast-acting carbohydrates immediately');
            result.advisories.push('Retest in 15 minutes and seek medical attention if symptoms persist');
            result.riskScore = 3;
        } else if (glucose >= 70 && glucose <= 100) {
            result.summary = `Blood glucose is normal at ${glucose} mg/dL`;
            result.advisories.push('Maintain healthy diet and regular exercise');
            result.riskScore = 0;
        } else if (glucose > 100 && glucose <= 125) {
            result.summary = `Blood glucose is elevated at ${glucose} mg/dL (prediabetic range)`;
            result.risks.push({
                level: 'MODERATE',
                description: 'Prediabetes range detected'
            });
            result.advisories.push('Consider lifestyle modifications: diet and exercise');
            result.advisories.push('Follow up with healthcare provider for diabetes screening');
            result.riskScore = 1;
        } else if (glucose > 125) {
            result.summary = `Blood glucose is high at ${glucose} mg/dL (diabetic range)`;
            result.risks.push({
                level: 'HIGH',
                description: 'Diabetes range detected'
            });
            result.advisories.push('Immediate medical consultation recommended');
            result.advisories.push('Consider dietary modifications and medication evaluation');
            result.riskScore = 2;
        }

        return result;
    }

    analyzeHbA1c(hba1c, patient) {
        const result = {
            summary: '',
            risks: [],
            advisories: [],
            riskScore: 0
        };

        if (hba1c < 5.7) {
            result.summary = `HbA1c is normal at ${hba1c}%`;
            result.advisories.push('Continue current healthy lifestyle habits');
            result.riskScore = 0;
        } else if (hba1c >= 5.7 && hba1c <= 6.4) {
            result.summary = `HbA1c indicates prediabetes at ${hba1c}%`;
            result.risks.push({
                level: 'MODERATE',
                description: 'Prediabetes detected'
            });
            result.advisories.push('Implement lifestyle interventions to prevent diabetes');
            result.advisories.push('Regular monitoring recommended every 3-6 months');
            result.riskScore = 1;
        } else if (hba1c >= 6.5) {
            result.summary = `HbA1c indicates diabetes at ${hba1c}%`;
            result.risks.push({
                level: 'HIGH',
                description: 'Diabetes detected'
            });
            result.advisories.push('Comprehensive diabetes management plan needed');
            result.advisories.push('Regular medical follow-up and medication management essential');
            result.riskScore = 2;
        }

        return result;
    }

    analyzeWBC(wbcCount, patient) {
        const result = {
            summary: '',
            risks: [],
            advisories: [],
            riskScore: 0
        };

        if (wbcCount < 4.5) {
            result.summary = `WBC count is low at ${wbcCount} x10³/μL (leukopenia)`;
            result.risks.push({
                level: 'MODERATE',
                description: 'Low white blood cell count detected'
            });
            result.advisories.push('May indicate weakened immune system or bone marrow issues');
            result.advisories.push('Consult healthcare provider for further evaluation');
            result.riskScore = 1;
        } else if (wbcCount >= 4.5 && wbcCount <= 11.0) {
            result.summary = `WBC count is normal at ${wbcCount} x10³/μL`;
            result.advisories.push('White blood cell count within normal range');
            result.riskScore = 0;
        } else if (wbcCount > 11.0) {
            result.summary = `WBC count is elevated at ${wbcCount} x10³/μL (leukocytosis)`;
            result.risks.push({
                level: 'MODERATE',
                description: 'Elevated white blood cell count'
            });
            result.advisories.push('May indicate infection, inflammation, or other conditions');
            result.advisories.push('Medical evaluation recommended to determine cause');
            result.riskScore = 1;
        }

        return result;
    }

    analyzePlatelets(plateletCount, patient) {
        const result = {
            summary: '',
            risks: [],
            advisories: [],
            riskScore: 0
        };

        if (plateletCount < 150) {
            result.summary = `Platelet count is low at ${plateletCount} x10³/μL (thrombocytopenia)`;
            result.risks.push({
                level: 'MODERATE',
                description: 'Low platelet count detected'
            });
            result.advisories.push('Increased bleeding risk - avoid activities with injury risk');
            result.advisories.push('Medical evaluation needed to determine cause');
            result.riskScore = 1;
        } else if (plateletCount >= 150 && plateletCount <= 400) {
            result.summary = `Platelet count is normal at ${plateletCount} x10³/μL`;
            result.advisories.push('Platelet count within normal range');
            result.riskScore = 0;
        } else if (plateletCount > 400) {
            result.summary = `Platelet count is elevated at ${plateletCount} x10³/μL (thrombocytosis)`;
            result.risks.push({
                level: 'MODERATE',
                description: 'Elevated platelet count'
            });
            result.advisories.push('May increase blood clot risk');
            result.advisories.push('Consult healthcare provider for evaluation');
            result.riskScore = 1;
        }

        return result;
    }

    analyzeCholesterol(metrics, patient) {
        const result = {
            summary: '',
            risks: [],
            advisories: [],
            riskScore: 0
        };

        let summaryParts = [];
        let maxRiskScore = 0;

        // Total Cholesterol
        if (metrics.cholesterolTotal !== null) {
            if (metrics.cholesterolTotal < 200) {
                summaryParts.push(`Total cholesterol is desirable at ${metrics.cholesterolTotal} mg/dL`);
            } else if (metrics.cholesterolTotal <= 239) {
                summaryParts.push(`Total cholesterol is borderline high at ${metrics.cholesterolTotal} mg/dL`);
                maxRiskScore = Math.max(maxRiskScore, 1);
            } else {
                summaryParts.push(`Total cholesterol is high at ${metrics.cholesterolTotal} mg/dL`);
                maxRiskScore = Math.max(maxRiskScore, 2);
            }
        }

        // LDL Cholesterol
        if (metrics.ldl !== null) {
            if (metrics.ldl < 100) {
                summaryParts.push(`LDL is optimal at ${metrics.ldl} mg/dL`);
            } else if (metrics.ldl <= 129) {
                summaryParts.push(`LDL is near optimal at ${metrics.ldl} mg/dL`);
            } else if (metrics.ldl <= 159) {
                summaryParts.push(`LDL is borderline high at ${metrics.ldl} mg/dL`);
                maxRiskScore = Math.max(maxRiskScore, 1);
            } else {
                summaryParts.push(`LDL is high at ${metrics.ldl} mg/dL`);
                maxRiskScore = Math.max(maxRiskScore, 2);
            }
        }

        // HDL Cholesterol
        if (metrics.hdl !== null) {
            const hdlThreshold = patient.sex === 'female' ? 50 : 40;
            if (metrics.hdl >= hdlThreshold + 10) {
                summaryParts.push(`HDL is good at ${metrics.hdl} mg/dL`);
            } else if (metrics.hdl >= hdlThreshold) {
                summaryParts.push(`HDL is adequate at ${metrics.hdl} mg/dL`);
            } else {
                summaryParts.push(`HDL is low at ${metrics.hdl} mg/dL`);
                maxRiskScore = Math.max(maxRiskScore, 1);
            }
        }

        result.summary = summaryParts.join('; ');
        result.riskScore = maxRiskScore;

        // Risk assessment
        if (maxRiskScore >= 2) {
            result.risks.push({
                level: 'HIGH',
                description: 'Elevated cardiovascular risk'
            });
            result.advisories.push('Immediate lifestyle modifications recommended');
            result.advisories.push('Consider statin therapy evaluation with physician');
        } else if (maxRiskScore >= 1) {
            result.risks.push({
                level: 'MODERATE',
                description: 'Moderate cardiovascular risk'
            });
            result.advisories.push('Dietary changes and regular exercise recommended');
            result.advisories.push('Recheck levels in 6-12 weeks');
        } else {
            result.advisories.push('Maintain heart-healthy diet and regular exercise');
        }

        return result;
    }

    analyzeTriglycerides(triglycerides, patient) {
        const result = {
            summary: '',
            risks: [],
            advisories: [],
            riskScore: 0
        };

        if (triglycerides < 150) {
            result.summary = `Triglycerides are normal at ${triglycerides} mg/dL`;
            result.advisories.push('Continue current dietary habits');
            result.riskScore = 0;
        } else if (triglycerides <= 199) {
            result.summary = `Triglycerides are borderline high at ${triglycerides} mg/dL`;
            result.risks.push({
                level: 'MODERATE',
                description: 'Borderline high triglycerides'
            });
            result.advisories.push('Reduce refined carbohydrates and increase omega-3 fatty acids');
            result.riskScore = 1;
        } else if (triglycerides <= 499) {
            result.summary = `Triglycerides are high at ${triglycerides} mg/dL`;
            result.risks.push({
                level: 'HIGH',
                description: 'High triglycerides detected'
            });
            result.advisories.push('Significant dietary modifications and possible medication needed');
            result.riskScore = 2;
        } else {
            result.summary = `Triglycerides are very high at ${triglycerides} mg/dL`;
            result.risks.push({
                level: 'HIGH',
                description: 'Very high triglycerides - pancreatitis risk'
            });
            result.advisories.push('Immediate medical attention required');
            result.riskScore = 3;
        }

        return result;
    }

    async analyzeUrine(data, analysis) {
        const metrics = data.metrics;
        const patientData = data.patient;
        
        let summaryParts = [];
        let riskScore = 0;

        // pH Analysis
        if (metrics.ph !== null) {
            const phAnalysis = this.analyzeUrinePh(metrics.ph);
            summaryParts.push(phAnalysis.summary);
            analysis.risks.push(...phAnalysis.risks);
            analysis.advisories.push(...phAnalysis.advisories);
            riskScore += phAnalysis.riskScore;
        }

        // Protein Analysis
        if (metrics.proteinLevel) {
            const proteinAnalysis = this.analyzeUrineProtein(metrics.proteinLevel);
            summaryParts.push(proteinAnalysis.summary);
            analysis.risks.push(...proteinAnalysis.risks);
            analysis.advisories.push(...proteinAnalysis.advisories);
            riskScore += proteinAnalysis.riskScore;
        }

        // eGFR and Kidney Function Analysis
        if (metrics.eGFR !== null) {
            const kidneyAnalysis = this.analyzeKidneyFunction(metrics.eGFR, metrics.proteinMg);
            summaryParts.push(kidneyAnalysis.summary);
            analysis.risks.push(...kidneyAnalysis.risks);
            analysis.advisories.push(...kidneyAnalysis.advisories);
            riskScore += kidneyAnalysis.riskScore;
        }

        // Glucose Analysis
        if (metrics.glucose) {
            const glucoseAnalysis = this.analyzeUrineGlucose(metrics.glucose);
            summaryParts.push(glucoseAnalysis.summary);
            analysis.risks.push(...glucoseAnalysis.risks);
            analysis.advisories.push(...glucoseAnalysis.advisories);
            riskScore += glucoseAnalysis.riskScore;
        }

        // Ketones Analysis
        if (metrics.ketones) {
            const ketonesAnalysis = this.analyzeUrineKetones(metrics.ketones);
            summaryParts.push(ketonesAnalysis.summary);
            analysis.risks.push(...ketonesAnalysis.risks);
            analysis.advisories.push(...ketonesAnalysis.advisories);
            riskScore += ketonesAnalysis.riskScore;
        }

        // Nitrite and Leukocytes (UTI indicators)
        if (metrics.nitrite || metrics.leukocytes) {
            const infectionAnalysis = this.analyzeInfectionMarkers(metrics.nitrite, metrics.leukocytes);
            summaryParts.push(infectionAnalysis.summary);
            analysis.risks.push(...infectionAnalysis.risks);
            analysis.advisories.push(...infectionAnalysis.advisories);
            riskScore += infectionAnalysis.riskScore;
        }

        analysis.summary = this.generateUrineSummary(summaryParts, riskScore);
        analysis.confidence = this.calculateUrineConfidence(metrics);
        analysis.citations = this.getUrineCitations();

        return analysis;
    }

    analyzeUrinePh(ph) {
        const result = { summary: '', risks: [], advisories: [], riskScore: 0 };

        if (ph < 4.5) {
            result.summary = `Urine pH is very acidic at ${ph}`;
            result.risks.push({ level: 'MODERATE', description: 'Very acidic urine' });
            result.advisories.push('Consider dietary modifications to reduce acidity');
            result.riskScore = 1;
        } else if (ph >= 4.5 && ph <= 8.0) {
            result.summary = `Urine pH is normal at ${ph}`;
            result.advisories.push('pH level is within normal range');
            result.riskScore = 0;
        } else {
            result.summary = `Urine pH is very alkaline at ${ph}`;
            result.risks.push({ level: 'MODERATE', description: 'Very alkaline urine' });
            result.advisories.push('May indicate urinary tract infection or kidney issues');
            result.riskScore = 1;
        }

        return result;
    }

    analyzeUrineProtein(protein) {
        const result = { summary: '', risks: [], advisories: [], riskScore: 0 };

        switch (protein.toLowerCase()) {
            case 'negative':
                result.summary = 'No protein detected in urine';
                result.advisories.push('Normal finding - no proteinuria');
                result.riskScore = 0;
                break;
            case 'trace':
                result.summary = 'Trace amounts of protein detected';
                result.advisories.push('May be due to exercise or minor inflammation');
                result.riskScore = 0;
                break;
            case '1+':
            case '2+':
                result.summary = `Moderate protein levels detected (${protein})`;
                result.risks.push({ level: 'MODERATE', description: 'Moderate proteinuria' });
                result.advisories.push('Follow-up testing recommended to rule out kidney disease');
                result.riskScore = 1;
                break;
            case '3+':
            case '4+':
                result.summary = `High protein levels detected (${protein})`;
                result.risks.push({ level: 'HIGH', description: 'Significant proteinuria' });
                result.advisories.push('Immediate medical evaluation for kidney function recommended');
                result.riskScore = 2;
                break;
        }

        return result;
    }

    analyzeUrineGlucose(glucose) {
        const result = { summary: '', risks: [], advisories: [], riskScore: 0 };

        if (glucose === 'negative') {
            result.summary = 'No glucose detected in urine';
            result.advisories.push('Normal finding');
            result.riskScore = 0;
        } else {
            result.summary = `Glucose detected in urine (${glucose})`;
            result.risks.push({ level: 'HIGH', description: 'Glucosuria detected' });
            result.advisories.push('May indicate diabetes - blood glucose testing recommended');
            result.riskScore = 2;
        }

        return result;
    }

    analyzeUrineKetones(ketones) {
        const result = { summary: '', risks: [], advisories: [], riskScore: 0 };

        switch (ketones.toLowerCase()) {
            case 'negative':
                result.summary = 'No ketones detected';
                result.advisories.push('Normal finding');
                result.riskScore = 0;
                break;
            case 'trace':
            case 'small':
                result.summary = `Small amounts of ketones detected (${ketones})`;
                result.advisories.push('May indicate fasting, low-carb diet, or early diabetic ketoacidosis');
                result.riskScore = 0;
                break;
            case 'moderate':
            case 'large':
                result.summary = `Significant ketones detected (${ketones})`;
                result.risks.push({ level: 'HIGH', description: 'Significant ketonuria' });
                result.advisories.push('May indicate diabetic ketoacidosis - immediate medical attention recommended');
                result.riskScore = 2;
                break;
        }

        return result;
    }

    analyzeInfectionMarkers(nitrite, leukocytes) {
        const result = { summary: '', risks: [], advisories: [], riskScore: 0 };

        const hasNitrite = nitrite === 'positive';
        const hasLeukocytes = leukocytes && ['1+', '2+', '3+'].includes(leukocytes);

        if (hasNitrite && hasLeukocytes) {
            result.summary = 'Both nitrite and leukocytes positive - UTI likely';
            result.risks.push({ level: 'HIGH', description: 'Urinary tract infection probable' });
            result.advisories.push('Medical evaluation and possible antibiotic treatment recommended');
            result.riskScore = 2;
        } else if (hasNitrite || hasLeukocytes) {
            result.summary = 'Possible urinary tract infection indicators present';
            result.risks.push({ level: 'MODERATE', description: 'Possible UTI' });
            result.advisories.push('Consider medical evaluation and urine culture');
            result.riskScore = 1;
        } else {
            result.summary = 'No infection markers detected';
            result.advisories.push('No evidence of urinary tract infection');
            result.riskScore = 0;
        }

        return result;
    }

    analyzeKidneyFunction(eGFR, proteinMg) {
        const result = { summary: '', risks: [], advisories: [], riskScore: 0 };

        if (eGFR < 15) {
            result.summary = `eGFR at ${eGFR.toFixed(2)} mL/min/1.73m² indicates kidney failure (Stage 5 CKD)`;
            result.risks.push({ level: 'HIGH', description: 'Kidney failure detected' });
            result.advisories.push('Immediate nephrology consultation required');
            result.advisories.push('Dialysis or kidney transplant may be necessary');
            result.riskScore = 3;
        } else if (eGFR < 30) {
            result.summary = `eGFR at ${eGFR.toFixed(2)} mL/min/1.73m² indicates severe reduction in kidney function (Stage 4 CKD)`;
            result.risks.push({ level: 'HIGH', description: 'Severe kidney disease' });
            result.advisories.push('Urgent nephrology referral recommended');
            result.advisories.push('Prepare for possible renal replacement therapy');
            result.riskScore = 2;
        } else if (eGFR < 60) {
            result.summary = `eGFR at ${eGFR.toFixed(2)} mL/min/1.73m² indicates moderate reduction in kidney function (Stage 3 CKD)`;
            result.risks.push({ level: 'MODERATE', description: 'Chronic kidney disease detected' });
            result.advisories.push('Medical consultation recommended for CKD management');
            result.advisories.push('Monitor kidney function regularly and control underlying conditions');
            result.riskScore = 1;
        } else if (eGFR < 90) {
            result.summary = `eGFR at ${eGFR.toFixed(2)} mL/min/1.73m² indicates mild reduction in kidney function`;

            if (proteinMg && proteinMg >= 30) {
                result.risks.push({ level: 'MODERATE', description: 'Mild kidney disease with proteinuria' });
                result.advisories.push('Follow-up recommended to monitor kidney function');
                result.riskScore = 1;
            } else {
                result.advisories.push('Kidney function is mildly reduced but generally acceptable');
                result.riskScore = 0;
            }
        } else {
            result.summary = `eGFR at ${eGFR.toFixed(2)} mL/min/1.73m² indicates normal kidney function`;
            result.advisories.push('Kidney function is within normal range');
            result.riskScore = 0;
        }

        return result;
    }


    generateBloodSummary(parts, riskScore, patient) {
        let summary = parts.join('. ');
        
        if (riskScore === 0) {
            summary += '. Overall, blood parameters appear within acceptable ranges.';
        } else if (riskScore <= 2) {
            summary += '. Some parameters require attention and lifestyle modifications.';
        } else {
            summary += '. Several parameters indicate significant health risks requiring medical attention.';
        }

        return summary;
    }

    generateUrineSummary(parts, riskScore) {
        let summary = parts.join('. ');
        
        if (riskScore === 0) {
            summary += '. Urine analysis shows no significant abnormalities.';
        } else if (riskScore <= 2) {
            summary += '. Some findings warrant follow-up or monitoring.';
        } else {
            summary += '. Abnormal findings detected that require medical evaluation.';
        }

        return summary;
    }


    calculateConfidence(metrics) {
        const validMetrics = Object.values(metrics).filter(v => v !== null && v !== '').length;
        const totalPossibleMetrics = 9; // glucose, hba1c, hemoglobin, hematocrit, rbcCount, total cholesterol, ldl, hdl, triglycerides

        return Math.min(100, (validMetrics / totalPossibleMetrics) * 100);
    }

    calculateUrineConfidence(metrics) {
        const validMetrics = Object.values(metrics).filter(v => v !== null && v !== '').length;
        const totalPossibleMetrics = 9; // ph, proteinLevel, proteinMg, creatinine, eGFR, glucose, ketones, specific gravity, nitrite, leukocytes

        return Math.min(100, (validMetrics / totalPossibleMetrics) * 100);
    }


    getBloodCitations() {
        return [
            'American Diabetes Association. Standards of Medical Care in Diabetes—2023',
            'ACC/AHA Guideline on the Management of Blood Cholesterol (2019)',
            'WHO Guidelines on Diagnostic Criteria for Diabetes Mellitus',
            'WHO Haemoglobin Concentrations for the Diagnosis of Anaemia (2011)'
        ];
    }

    getUrineCitations() {
        return [
            'European Association of Urology Guidelines on Urological Infections',
            'American Family Physician. Urinalysis: A Comprehensive Review (2019)',
            'KDIGO 2021 Clinical Practice Guideline for CKD Evaluation and Management',
            'National Kidney Foundation Clinical Practice Guidelines'
        ];
    }


    getDefaultAnalysis(errorMessage) {
        return {
            summary: 'Analysis could not be completed due to insufficient or invalid data. Please verify your input values and try again.',
            risks: [{
                level: 'LOW',
                description: 'Unable to assess risk - data insufficient'
            }],
            advisories: [
                'Please ensure all measurements are accurate and complete',
                'Consult with a healthcare provider for proper testing',
                'Consider retesting with verified equipment'
            ],
            citations: ['GalPal AI Analysis System v' + this.version],
            confidence: 0,
            timestamp: new Date().toISOString(),
            error: errorMessage
        };
    }

    // Additional utility methods
    getReferenceRanges(fluidType) {
        const ranges = {
            blood: {
                glucose: { min: 70, max: 100, unit: 'mg/dL', fasting: true },
                hba1c: { min: 4.0, max: 5.6, unit: '%' },
                cholesterolTotal: { min: 0, max: 200, unit: 'mg/dL' },
                ldl: { min: 0, max: 100, unit: 'mg/dL' },
                hdl: { minMale: 40, minFemale: 50, unit: 'mg/dL' },
                triglycerides: { min: 0, max: 150, unit: 'mg/dL' }
            },
            urine: {
                ph: { min: 4.5, max: 8.0 },
                protein: { normal: 'negative' },
                glucose: { normal: 'negative' },
                ketones: { normal: 'negative' },
                specificGravity: { min: 1.005, max: 1.030 },
                nitrite: { normal: 'negative' },
                leukocytes: { normal: 'negative' }
            },
            saliva: {
                ph: { min: 6.0, max: 7.4 },
                cortisol: { min: 0.094, max: 0.592, unit: 'ng/mL' },
                conductivity: { min: 1000, max: 3000, unit: 'μS/cm' }
            }
        };

        return ranges[fluidType] || {};
    }

    formatAnalysisForPDF(analysis) {
        return {
            summary: analysis.summary,
            risks: analysis.risks.map(risk => ({
                level: risk.level,
                description: risk.description,
                color: this.getRiskColor(risk.level)
            })),
            recommendations: analysis.advisories,
            confidence: `${analysis.confidence}%`,
            timestamp: new Date(analysis.timestamp).toLocaleString(),
            citations: analysis.citations
        };
    }

    getRiskColor(level) {
        const colors = {
            'LOW': '#28a745',
            'MODERATE': '#ffc107',
            'HIGH': '#dc3545'
        };
        return colors[level] || '#6c757d';
    }
}

// Create global instance
const MedAI = new MedicalAI();
window.MedAI = MedAI;