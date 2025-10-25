# PhishDetector - Real-time URL Threat Detection System

A comprehensive phishing detection website that analyzes URLs using real-time security data from multiple sources including SSL Labs, VirusTotal, WHOIS databases, IP geolocation services, and threat intelligence feeds.

## 🚀 Features

### Real-time Security Analysis
- **SSL Certificate Validation**: Uses SSL Labs API for comprehensive certificate analysis
- **Domain Intelligence**: WHOIS lookup for domain age, registrar, and ownership information
- **IP Geolocation**: Real-time IP address resolution and location tracking
- **Threat Intelligence**: Integration with VirusTotal and other security databases
- **Safety Scoring**: Advanced algorithm combining multiple security factors (0-100 scale)

### User Interface
- Modern, responsive design with professional aesthetics
- Real-time scanning progress indicators with polling
- Comprehensive security reports with detailed metrics
- Interactive dashboard with scan history and statistics
- Educational content about phishing prevention

### Backend Infrastructure
- Supabase edge functions for serverless API processing
- PostgreSQL database for scan history and analytics
- Row Level Security (RLS) for data protection
- Real-time data synchronization with polling mechanism

## 🔧 Setup Instructions

### 1. Environment Configuration

Create a `.env` file with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API Keys for Security Services (Optional - system works with fallbacks)
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
WHOIS_API_KEY=your_whois_api_key_here
```

### 2. Required API Keys (Optional)

#### VirusTotal API
1. Sign up at [VirusTotal](https://www.virustotal.com/)
2. Go to your profile and generate an API key
3. Add to your Supabase edge function environment variables

#### WHOIS API
1. Sign up at [WhoisJSON](https://whoisjson.com/) or similar service
2. Get your API key from the dashboard
3. Add to your Supabase edge function environment variables

#### IP Geolocation
- The system uses [ip-api.com](http://ip-api.com/) which is free for non-commercial use
- No API key required for basic usage

### 3. Supabase Setup

1. Create a new Supabase project
2. Run the database migration: `supabase/migrations/create_url_scans_table.sql`
3. Deploy the edge functions:
   - `url-scanner`: Main scanning functionality
   - `scan-status`: Get scan results and status

### 4. Database Schema

The system uses the `url_scans` table with the following structure:
- URL and scan metadata
- Safety scores (0-100 scale)
- SSL certificate data
- Domain age information
- IP address details
- Threat categories and confidence scores
- Timestamps and status tracking

## 🔍 API Integration Details

### SSL Certificate Analysis
- Primary: SSL Labs API for comprehensive analysis
- Fallback: Basic HTTPS validation
- Metrics: Certificate validity, issuer, expiration, security grade

### Domain Intelligence
- WHOIS database lookup for registration details
- Domain age calculation (in days)
- Registrar and country information
- Suspicious domain pattern detection

### IP Address Analysis
- DNS resolution to IP address using Google DNS
- Geolocation lookup (city, region, country)
- ISP identification
- IP reputation checking

### Threat Intelligence
- VirusTotal integration for URL reputation
- Malware and phishing detection
- Threat category classification
- Machine learning confidence scores

### Safety Scoring Algorithm
The system calculates safety scores (0-100) based on:
- SSL certificate issues (deduct 0-25 points)
- Domain age and registration (deduct 0-20 points)
- Threat intelligence matches (deduct 0-40 points)
- URL structure analysis (deduct 0-15 points)

Higher scores indicate safer URLs.

## 🛡️ Security Features

- Row Level Security (RLS) on all database tables
- API rate limiting and error handling
- Input validation and URL normalization
- Secure API key management in edge functions
- CORS protection for all endpoints

## ⚡ Performance Optimizations

- Parallel API calls for faster scanning
- Database indexing for quick lookups
- Asynchronous scan processing with polling
- Graceful fallbacks for API failures
- Optimized SQL queries for analytics

## 🚀 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📊 Real-time Data Sources

- **SSL Labs API**: Certificate analysis and security grading
- **VirusTotal API**: Threat intelligence and reputation data
- **WhoisJSON API**: Domain registration and age information
- **Google DNS API**: Domain to IP resolution
- **IP-API**: IP geolocation and ISP information

## 🌐 Deployment

The application is designed to work with:
- Supabase for backend services and database
- Vercel/Netlify for frontend hosting
- Edge functions for real-time API processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with real URLs
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This tool is for educational and security research purposes. Always verify results with multiple sources for critical security decisions. The system provides safety assessments based on available data but cannot guarantee 100% accuracy.

## 🔗 External Resources

- [SSL Labs API Documentation](https://github.com/ssllabs/ssllabs-scan/blob/master/ssllabs-api-docs-v3.md)
- [VirusTotal API Documentation](https://developers.virustotal.com/reference)
- [Google Phishing Quiz](https://phishingquiz.withgoogle.com/)
- [Supabase Documentation](https://supabase.com/docs)