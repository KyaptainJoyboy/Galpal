# GalPal - Medical Analysis Assistant

A comprehensive medical web application designed for Raspberry Pi deployment, featuring AI-assisted analysis of blood, urine, and saliva test results with telemedicine capabilities.

## 🏥 Features

### Core Functionality
- **Multi-Fluid Analysis**: Support for blood, urine, and saliva test analysis
- **AI-Powered Insights**: Lightweight rule-based medical interpretation
- **Patient Management**: Comprehensive patient profiles and health records
- **Report Generation**: PDF reports with charts and medical disclaimers
- **Telemedicine Integration**: Video consultations with WebRTC support
- **Health Wiki**: Trusted medical information with offline caching
- **Device Monitoring**: System health monitoring for Raspberry Pi

### Medical Safety
- **Consent Management**: Required consent for AI analysis with full transparency
- **Medical Disclaimers**: Clear warnings that AI is assistive, not diagnostic
- **Data Privacy**: Client-side encryption and local data storage
- **Accessibility**: WCAG 2.1 AA compliant with high contrast options

### Technical Highlights
- **Offline-First**: Works without internet connection
- **Responsive Design**: Optimized for all device sizes
- **PWA Ready**: Can be installed as a web app
- **Modular Architecture**: Clean separation of concerns
- **Bootstrap 5**: Professional medical UI/UX

## 🚀 Quick Start

### Prerequisites
- Raspberry Pi 4 (or any modern web server)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for initial setup and external integrations

### Installation

1. **Clone or Download**
   ```bash
   git clone https://github.com/your-repo/galpal.git
   cd galpal
   ```

2. **Serve the Files**
   ```bash
   # Using Python
   python3 -m http.server 8080
   
   # Using Node.js
   npx http-server -p 8080
   
   # Using PHP
   php -S localhost:8080
   ```

3. **Access the Application**
   Open your browser and navigate to `http://localhost:8080`

### Raspberry Pi Deployment

1. **Install Chromium**
   ```bash
   sudo apt update
   sudo apt install chromium-browser unclutter
   ```

2. **Set up Autostart** (create `/home/pi/.config/autostart/galpal.desktop`)
   ```ini
   [Desktop Entry]
   Type=Application
   Name=GalPal Kiosk
   Exec=chromium-browser --kiosk --disable-infobars --disable-session-crashed-bubble --disable-web-security --user-data-dir=/home/pi/chromium-data http://localhost:8080
   Hidden=false
   NoDisplay=false
   X-GNOME-Autostart-enabled=true
   ```

3. **Set up Local Web Server**
   ```bash
   # Install nginx
   sudo apt install nginx
   
   # Copy files to web directory
   sudo cp -r * /var/www/html/
   
   # Start nginx
   sudo systemctl enable nginx
   sudo systemctl start nginx
   ```

## 📊 Usage Guide

### First-Time Setup
1. **Welcome Screen**: Complete initial setup and review disclaimers
2. **Consent Agreement**: Read and accept AI analysis consent
3. **Settings Configuration**: Set theme, language, and preferences
4. **Add Patients**: Create patient profiles for testing

### Medical Analysis Workflow
1. **Select Patient**: Choose existing patient or create new profile
2. **Choose Test Type**: Blood, urine, or saliva analysis
3. **Enter Results**: Input test values using guided forms
4. **Consent Check**: Confirm consent for AI analysis
5. **Review Analysis**: Get AI interpretation with risk assessment
6. **Generate Report**: Create PDF with charts and recommendations
7. **Share Results**: Optional sharing with healthcare providers

### Consultation Features
1. **Book Appointment**: Schedule with available doctors
2. **NowServing Integration**: Direct links to Philippine booking platforms
3. **Video Calls**: In-app WebRTC video consultations
4. **File Sharing**: Share medical reports during consultations

## 🔧 Configuration

### Settings
- **Theme Options**: Light, dark, high-contrast modes
- **Language**: English (Philippines), Filipino, English (US)
- **Units**: Metric (mg/dL) or Imperial (mmol/L)
- **Privacy**: Data encryption, PIN protection, retention policies

### Integrations
- **NowServing PH**: Configure booking URLs for local doctors
- **Hospital Network**: Add hospitals in your area
- **Email Notifications**: SMTP settings for reports
- **Backup Location**: Set automatic backup directory

### Doctor Directory
Edit `assets/data/doctors.json` to add local healthcare providers:

```json
{
  "id": "dr007",
  "name": "Dr. Your Doctor",
  "specialty": "Internal Medicine",
  "hospital": "Local Hospital",
  "contact": {
    "phone": "+63 XX XXXX-XXXX",
    "email": "doctor@hospital.com"
  },
  "nowServingUrl": "https://nowserving.ph/dr-your-doctor"
}
```

## 🏗️ Architecture

### File Structure
```
galpal/
├── index.html              # Main application shell
├── assets/
│   ├── css/
│   │   └── theme.css       # Medical UI theme
│   ├── js/
│   │   ├── app.js          # Main application controller
│   │   ├── db.js           # IndexedDB database layer
│   │   ├── medAI.js        # Medical AI analysis engine
│   │   ├── pdf.js          # PDF report generator
│   │   ├── webrtc.js       # Video call functionality
│   │   └── wiki.js         # Health information search
│   └── data/
│       ├── doctors.json    # Healthcare provider directory
│       ├── research-updates.json
│       ├── wiki-topics.json
│       └── wiki-cache.json
└── README.md
```

### Data Model
- **Patients**: Personal info, medical history, allergies
- **Readings**: Test results with metrics and timestamps
- **Reports**: AI analysis results with risk assessments
- **Consultations**: Appointment scheduling and history
- **Doctors**: Provider directory with availability
- **Settings**: User preferences and configuration

## 🔒 Privacy & Security

### Data Protection
- **Local Storage**: All data stored in browser's IndexedDB
- **Encryption**: Optional AES encryption for sensitive data
- **No Cloud Sync**: Data never leaves the device unless explicitly shared
- **Consent Tracking**: Full audit trail of consent agreements

### Medical Compliance
- **Disclaimers**: Prominent warnings about AI limitations
- **Professional Oversight**: Encourages healthcare provider involvement
- **Data Retention**: Configurable automatic data deletion
- **Audit Logs**: Track all data access and modifications

## 🧪 Testing

### Test Data
The application includes sample data for demonstration:
- Mock patient profiles with test results
- Sample AI analysis outputs
- Demo consultation bookings
- Health wiki articles

### Browser Testing
Tested on:
- ✅ Chrome 120+ (Desktop/Mobile)
- ✅ Firefox 115+ (Desktop/Mobile)
- ✅ Safari 16+ (Desktop/Mobile)
- ✅ Edge 120+ (Desktop)

### Raspberry Pi Testing
Verified on:
- ✅ Raspberry Pi 4B (4GB RAM)
- ✅ Raspberry Pi OS Lite (64-bit)
- ✅ Chromium Browser (Kiosk Mode)

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make changes following the coding standards
4. Test thoroughly on multiple devices
5. Submit a pull request with detailed description

### Coding Standards
- **ES6+ JavaScript**: Modern syntax and features
- **Bootstrap 5**: Consistent UI components
- **WCAG 2.1 AA**: Accessibility compliance
- **JSDoc Comments**: Document all functions
- **Error Handling**: Graceful degradation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Medical Disclaimer

**IMPORTANT**: GalPal is an educational and assistive tool only. It is NOT intended to replace professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare providers with any questions regarding medical conditions or treatment options.

- AI analysis provides educational information only
- Results should not be used for clinical decisions
- Always consult healthcare professionals for medical concerns
- This tool has not been evaluated by medical regulatory agencies

## 🆘 Support

### Documentation
- Review this README for setup instructions
- Check the built-in Help section in the app
- Refer to the Settings page for configuration options

### Community
- Report issues on GitHub
- Share feedback for improvements
- Contribute to documentation

### Emergency
For medical emergencies, always contact local emergency services or your healthcare provider directly. Do not rely on this application for emergency medical situations.

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Compatibility**: Modern browsers, Raspberry Pi 4+