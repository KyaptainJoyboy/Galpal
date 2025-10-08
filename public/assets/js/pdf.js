// PDF Report Generator for GalPal Medical App
class PDFReportGenerator {
    constructor() {
        this.initialized = false;
        this.jsPDFLib = null;
    }

    async init() {
        if (this.initialized) return;
        
        // Check if jsPDF is loaded
        if (typeof window.jsPDF === 'undefined') {
            throw new Error('jsPDF library not loaded');
        }
        
        this.jsPDFLib = window.jsPDF;
        this.initialized = true;
    }

    async generateReport(reportData) {
        await this.init();
        
        try {
            const doc = new this.jsPDFLib.jsPDF();
            
            // Set up document properties
            doc.setProperties({
                title: 'GalPal Medical Analysis Report',
                subject: 'Medical Test Results and AI Analysis',
                author: 'GalPal Medical Assistant',
                creator: 'GalPal v1.0.0'
            });

            // Generate report content
            await this.addHeader(doc, reportData);
            this.addPatientInfo(doc, reportData.patient);
            this.addTestResults(doc, reportData.readings);
            this.addAIAnalysis(doc, reportData.analysis);
            this.addCharts(doc, reportData.charts);
            this.addFooter(doc, reportData.timestamp);

            // Save the PDF
            const filename = `galpal-report-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);
            
            return { success: true, filename };
            
        } catch (error) {
            console.error('PDF generation failed:', error);
            throw new Error(`PDF generation failed: ${error.message}`);
        }
    }

    async addHeader(doc, reportData) {
        // Header background
        doc.setFillColor(106, 76, 147); // Primary purple
        doc.rect(0, 0, 210, 30, 'F');
        
        // Logo area (text-based logo)
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('GalPal', 20, 20);
        
        // Subtitle
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Medical Analysis Report', 20, 26);
        
        // Report date
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 20);
        doc.text(`Time: ${new Date().toLocaleTimeString()}`, 150, 26);
        
        // Reset text color
        doc.setTextColor(0, 0, 0);
    }

    addPatientInfo(doc, patient) {
        let yPos = 45;
        
        // Section header
        doc.setFillColor(248, 246, 255); // Light lavender
        doc.rect(20, yPos - 5, 170, 15, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Patient Information', 25, yPos + 5);
        
        yPos += 20;
        
        // Patient details
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const patientInfo = [
            { label: 'Name:', value: patient?.name || 'N/A' },
            { label: 'Age:', value: patient?.age ? `${patient.age} years` : 'N/A' },
            { label: 'Sex:', value: patient?.sex ? this.capitalize(patient.sex) : 'N/A' },
            { label: 'MRN:', value: patient?.mrn || 'N/A' },
            { label: 'Test Date:', value: new Date().toLocaleDateString() }
        ];
        
        patientInfo.forEach((info, index) => {
            const xPos = 25 + (index % 2) * 85;
            const currentY = yPos + Math.floor(index / 2) * 10;
            
            doc.setFont('helvetica', 'bold');
            doc.text(info.label, xPos, currentY);
            doc.setFont('helvetica', 'normal');
            doc.text(info.value, xPos + 25, currentY);
        });
        
        return yPos + 35;
    }

    addTestResults(doc, readings) {
        let yPos = 110;
        
        if (!readings || !readings.metrics) {
            return yPos;
        }
        
        // Section header
        doc.setFillColor(248, 246, 255);
        doc.rect(20, yPos - 5, 170, 15, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Test Results - ${this.capitalize(readings.fluidType || 'Unknown')}`, 25, yPos + 5);
        
        yPos += 20;
        
        // Table header
        doc.setFillColor(240, 240, 240);
        doc.rect(25, yPos, 160, 10, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Parameter', 30, yPos + 7);
        doc.text('Value', 100, yPos + 7);
        doc.text('Reference Range', 140, yPos + 7);
        
        yPos += 10;
        
        // Test results
        doc.setFont('helvetica', 'normal');
        const metrics = readings.metrics;
        const referenceRanges = MedAI.getReferenceRanges(readings.fluidType);
        
        Object.entries(metrics).forEach(([key, value], index) => {
            if (value === null || value === '') return;
            
            const currentY = yPos + (index * 8) + 5;
            
            // Alternate row background
            if (index % 2 === 1) {
                doc.setFillColor(250, 250, 250);
                doc.rect(25, currentY - 3, 160, 8, 'F');
            }
            
            // Parameter name
            doc.text(this.formatParameterName(key), 30, currentY);
            
            // Value
            const formattedValue = this.formatValue(value, key);
            doc.text(formattedValue, 100, currentY);
            
            // Reference range
            const range = this.getFormattedRange(key, referenceRanges);
            doc.setTextColor(100, 100, 100);
            doc.text(range, 140, currentY);
            doc.setTextColor(0, 0, 0);
        });
        
        return yPos + (Object.keys(metrics).length * 8) + 15;
    }

    addAIAnalysis(doc, analysis) {
        let yPos = 180;
        
        if (!analysis) {
            return yPos;
        }
        
        // Check if we need a new page
        if (yPos > 250) {
            doc.addPage();
            yPos = 30;
        }
        
        // Section header
        doc.setFillColor(248, 246, 255);
        doc.rect(20, yPos - 5, 170, 15, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('AI Analysis & Interpretation', 25, yPos + 5);
        
        yPos += 25;
        
        // Summary
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary:', 25, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const summaryLines = doc.splitTextToSize(analysis.summary, 160);
        doc.text(summaryLines, 25, yPos);
        yPos += summaryLines.length * 5 + 10;
        
        // Risk Assessment
        if (analysis.risks && analysis.risks.length > 0) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Risk Assessment:', 25, yPos);
            yPos += 8;
            
            analysis.risks.forEach(risk => {
                // Risk level indicator
                const riskColor = this.getRiskColor(risk.level);
                doc.setFillColor(...riskColor);
                doc.rect(25, yPos - 3, 30, 8, 'F');
                
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text(risk.level, 27, yPos + 2);
                
                // Risk description
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(risk.description, 60, yPos + 2);
                
                yPos += 10;
            });
            
            yPos += 5;
        }
        
        // Recommendations
        if (analysis.advisories && analysis.advisories.length > 0) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Recommendations:', 25, yPos);
            yPos += 8;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            
            analysis.advisories.forEach((advisory, index) => {
                doc.text(`${index + 1}. ${advisory}`, 25, yPos);
                yPos += 6;
            });
        }
        
        return yPos + 10;
    }

    addCharts(doc, charts) {
        // This is a placeholder for chart integration
        // In a real implementation, you would convert Chart.js charts to images
        // and embed them in the PDF
        
        if (!charts) return;
        
        // Check if we need a new page
        if (doc.internal.pageSize.height - doc.internal.getCurrentPageInfo().pageNumber < 100) {
            doc.addPage();
        }
        
        // Placeholder for chart
        let yPos = doc.autoTable ? doc.autoTable.previous.finalY + 20 : 230;
        
        doc.setFillColor(248, 246, 255);
        doc.rect(20, yPos, 170, 60, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text('Trend Chart (Visual data representation)', 25, yPos + 30);
        doc.text('Charts will be displayed in future versions', 25, yPos + 40);
        doc.setTextColor(0, 0, 0);
    }

    addFooter(doc, timestamp) {
        const pageCount = doc.internal.getNumberOfPages();
        
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // Footer line
            doc.setDrawColor(200, 200, 200);
            doc.line(20, 280, 190, 280);
            
            // Disclaimer
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            doc.text('⚠️  MEDICAL DISCLAIMER: This AI analysis is for informational purposes only.', 25, 288);
            doc.text('Always consult with qualified healthcare professionals for medical advice and treatment decisions.', 25, 293);
            
            // Page number and timestamp
            doc.setFont('helvetica', 'normal');
            doc.text(`Page ${i} of ${pageCount}`, 160, 288);
            doc.text(`Generated: ${new Date(timestamp).toLocaleString()}`, 160, 293);
            
            // Version info
            doc.text('GalPal Medical Assistant v1.0.0', 25, 297);
        }
        
        doc.setTextColor(0, 0, 0);
    }

    // Utility methods
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    formatParameterName(key) {
        const names = {
            glucose: 'Glucose',
            hba1c: 'HbA1c',
            hemoglobin: 'Hemoglobin',
            hematocrit: 'Hematocrit',
            rbcCount: 'RBC Count',
            cholesterolTotal: 'Total Cholesterol',
            ldl: 'LDL Cholesterol',
            hdl: 'HDL Cholesterol',
            triglycerides: 'Triglycerides',
            ph: 'pH',
            proteinLevel: 'Protein Level',
            proteinMg: 'Protein (mg/dL)',
            creatinine: 'Creatinine',
            eGFR: 'eGFR',
            ketones: 'Ketones',
            specificGravity: 'Specific Gravity',
            nitrite: 'Nitrite',
            leukocytes: 'Leukocytes'
        };

        return names[key] || key;
    }

    formatValue(value, key) {
        if (typeof value === 'number') {
            const units = {
                glucose: ' mg/dL',
                hba1c: '%',
                hemoglobin: ' g/dL',
                hematocrit: '%',
                rbcCount: ' x10⁶/μL',
                cholesterolTotal: ' mg/dL',
                ldl: ' mg/dL',
                hdl: ' mg/dL',
                triglycerides: ' mg/dL',
                proteinMg: ' mg/dL',
                creatinine: ' mg/dL',
                specificGravity: ''
            };

            return value + (units[key] || '');
        }

        return String(value);
    }

    getFormattedRange(key, ranges) {
        if (!ranges[key]) return 'N/A';
        
        const range = ranges[key];
        
        if (range.min !== undefined && range.max !== undefined) {
            return `${range.min} - ${range.max}${range.unit || ''}`;
        }
        
        if (range.normal) {
            return range.normal;
        }
        
        if (range.minMale && range.minFemale) {
            return `≥${range.minMale}M, ≥${range.minFemale}F ${range.unit || ''}`;
        }
        
        return 'See reference';
    }

    getRiskColor(level) {
        const colors = {
            'LOW': [40, 167, 69],     // Green
            'MODERATE': [255, 193, 7], // Yellow
            'HIGH': [220, 53, 69]      // Red
        };
        
        return colors[level] || [108, 117, 125]; // Gray
    }

    // Public method to check if PDF generation is available
    static isAvailable() {
        return typeof window.jsPDF !== 'undefined';
    }

    // Generate a simple test report
    async generateTestReport() {
        const testData = {
            patient: {
                name: 'Test Patient',
                age: 35,
                sex: 'female',
                mrn: 'TEST001'
            },
            readings: {
                fluidType: 'blood',
                metrics: {
                    glucose: 95,
                    hba1c: 5.4,
                    cholesterolTotal: 180,
                    ldl: 100,
                    hdl: 60,
                    triglycerides: 120
                }
            },
            analysis: {
                summary: 'Blood test results show values within normal ranges.',
                risks: [{
                    level: 'LOW',
                    description: 'No significant risks detected'
                }],
                advisories: [
                    'Continue maintaining healthy lifestyle',
                    'Regular monitoring recommended'
                ]
            },
            timestamp: new Date().toISOString()
        };
        
        return await this.generateReport(testData);
    }
}

// Create global instance
const PDFGenerator = new PDFReportGenerator();