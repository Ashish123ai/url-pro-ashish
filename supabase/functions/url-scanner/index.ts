import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ScanRequest {
  url: string
}

interface ScanResult {
  id: string
  url: string
  status: string
  safety_score: number
  is_safe: boolean
  ssl_valid: boolean
  ssl_issuer: string
  ssl_expires_at: string
  domain_age_days: number
  ip_address: string
  ip_country: string
  threat_categories: string[]
  ml_confidence: number
  created_at: string
  updated_at: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url }: ScanRequest = await req.json()
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create initial scan record
    const { data: scanRecord, error: insertError } = await supabase
      .from('url_scans')
      .insert({ url, status: 'pending' })
      .select()
      .single()

    if (insertError) {
      throw new Error('Failed to create scan record')
    }

    // Start background scan process
    performScan(supabase, scanRecord.id, url)

    return new Response(
      JSON.stringify(scanRecord),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Scan error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function performScan(supabase: any, scanId: string, url: string) {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname

    // Parallel API calls for better performance
    const [sslData, domainData, ipData, threatData] = await Promise.allSettled([
      checkSSLCertificate(domain),
      getDomainInfo(domain),
      getIPInfo(domain),
      checkThreatIntelligence(url, domain, supabase)
    ])

    // Process results
    const ssl = sslData.status === 'fulfilled' ? sslData.value : getDefaultSSL()
    const domainInfo = domainData.status === 'fulfilled' ? domainData.value : getDefaultDomain()
    const ipInfo = ipData.status === 'fulfilled' ? ipData.value : getDefaultIP()
    const threats = threatData.status === 'fulfilled' ? threatData.value : getDefaultThreats()

    // Calculate safety score
    const safetyScore = calculateSafetyScore(ssl, domainInfo, threats, url)
    const isSafe = safetyScore >= 70

    // Update scan record
    await supabase
      .from('url_scans')
      .update({
        status: 'completed',
        safety_score: safetyScore,
        is_safe: isSafe,
        ssl_valid: ssl.isValid,
        ssl_issuer: ssl.issuer,
        ssl_expires_at: ssl.expiresAt,
        domain_age_days: domainInfo.ageDays,
        ip_address: ipInfo.address,
        ip_country: ipInfo.country,
        threat_categories: threats.categories,
        ml_confidence: threats.confidence
      })
      .eq('id', scanId)

  } catch (error) {
    console.error('Scan processing error:', error)
    
    // Mark scan as failed
    await supabase
      .from('url_scans')
      .update({ status: 'failed' })
      .eq('id', scanId)
  }
}

async function checkSSLCertificate(domain: string) {
  try {
    // Use SSL Labs API for comprehensive SSL analysis
    const response = await fetch(
      `https://api.ssllabs.com/api/v3/analyze?host=${domain}&publish=off&all=done&ignoreMismatch=on`,
      { 
        method: 'GET',
        headers: { 'User-Agent': 'PhishDetector/1.0' }
      }
    )
    
    if (!response.ok) {
      throw new Error('SSL Labs API error')
    }

    const data = await response.json()
    
    if (data.status === 'READY' && data.endpoints && data.endpoints.length > 0) {
      const endpoint = data.endpoints[0]
      const cert = endpoint.details?.cert
      
      return {
        isValid: endpoint.grade !== 'F' && endpoint.grade !== 'T',
        issuer: cert?.issuerLabel || 'Unknown',
        expiresAt: cert?.notAfter ? new Date(cert.notAfter).toISOString() : null,
        grade: endpoint.grade || 'Unknown'
      }
    }

    // Fallback to basic HTTPS check
    return await basicSSLCheck(domain)
  } catch (error) {
    console.error('SSL check error:', error)
    return await basicSSLCheck(domain)
  }
}

async function basicSSLCheck(domain: string) {
  try {
    const response = await fetch(`https://${domain}`, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(10000)
    })
    
    return {
      isValid: response.ok,
      issuer: 'Unknown',
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      grade: response.ok ? 'B' : 'F'
    }
  } catch {
    return getDefaultSSL()
  }
}

async function getDomainInfo(domain: string) {
  try {
    // Use WHOIS API service
    const response = await fetch(`https://api.whoisjson.com/v1/${domain}`, {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('WHOIS_API_KEY') || 'demo'}`
      }
    })

    if (!response.ok) {
      throw new Error('WHOIS API error')
    }

    const data = await response.json()
    
    const createdDate = data.created_date ? new Date(data.created_date) : null
    const ageDays = createdDate ? 
      Math.floor((Date.now() - createdDate.getTime()) / (24 * 60 * 60 * 1000)) : 0

    return {
      ageDays,
      registrar: data.registrar?.name || 'Unknown',
      country: data.registrant?.country || 'Unknown'
    }
  } catch (error) {
    console.error('Domain info error:', error)
    return getDefaultDomain()
  }
}

async function getIPInfo(domain: string) {
  try {
    // First resolve domain to IP using Google DNS
    const dnsResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`)
    const dnsData = await dnsResponse.json()
    
    if (!dnsData.Answer || dnsData.Answer.length === 0) {
      throw new Error('DNS resolution failed')
    }

    const ipAddress = dnsData.Answer[0].data

    // Get IP geolocation info using ip-api.com (free service)
    const ipResponse = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,regionName,city,isp,query`)
    const ipData = await ipResponse.json()

    if (ipData.status === 'success') {
      return {
        address: ipAddress,
        country: ipData.country,
        region: ipData.regionName,
        city: ipData.city,
        isp: ipData.isp
      }
    }

    throw new Error('IP geolocation failed')
  } catch (error) {
    console.error('IP info error:', error)
    return getDefaultIP()
  }
}

async function checkThreatIntelligence(url: string, domain: string, supabase: any) {
  try {
    const mlPrediction = await performMLClassification(url, domain, supabase)

    const vtApiKey = Deno.env.get('VIRUSTOTAL_API_KEY')

    if (!vtApiKey) {
      console.warn('VirusTotal API key not configured, using ML-only prediction')
      return {
        categories: mlPrediction.predictedCategories,
        confidence: mlPrediction.confidence,
        maliciousCount: mlPrediction.isPhishing ? 1 : 0,
        suspiciousCount: mlPrediction.threatProbability > 0.5 ? 1 : 0
      }
    }

    const urlId = btoa(url).replace(/=/g, '')
    const response = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
      headers: {
        'x-apikey': vtApiKey
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        await submitUrlForAnalysis(url, vtApiKey)
      }
      return {
        categories: mlPrediction.predictedCategories,
        confidence: mlPrediction.confidence,
        maliciousCount: mlPrediction.isPhishing ? 1 : 0,
        suspiciousCount: mlPrediction.threatProbability > 0.5 ? 1 : 0
      }
    }

    const data = await response.json()
    const stats = data.data?.attributes?.last_analysis_stats || {}
    const categories = data.data?.attributes?.categories || {}

    const threatCategories = [...new Set([...mlPrediction.predictedCategories])]
    if (stats.malicious > 0) threatCategories.push('malware')
    if (stats.suspicious > 2) threatCategories.push('phishing')
    if (categories.phishing) threatCategories.push('phishing')
    if (categories.malware) threatCategories.push('malware')

    const combinedConfidence = (mlPrediction.confidence + Math.min((stats.malicious + stats.suspicious) / 10, 1.0)) / 2

    return {
      categories: threatCategories,
      confidence: combinedConfidence,
      maliciousCount: stats.malicious || 0,
      suspiciousCount: stats.suspicious || 0
    }
  } catch (error) {
    console.error('Threat intelligence error:', error)
    return getDefaultThreats()
  }
}

async function submitUrlForAnalysis(url: string, apiKey: string) {
  try {
    const formData = new FormData()
    formData.append('url', url)
    
    await fetch('https://www.virustotal.com/api/v3/urls', {
      method: 'POST',
      headers: {
        'x-apikey': apiKey
      },
      body: formData
    })
  } catch (error) {
    console.error('URL submission error:', error)
  }
}

function calculateSafetyScore(ssl: any, domain: any, threats: any, url: string): number {
  let score = 100 // Start with perfect score

  // SSL factors (deduct 0-25 points)
  if (!ssl.isValid) score -= 25
  else if (ssl.grade === 'F') score -= 20
  else if (ssl.grade === 'C' || ssl.grade === 'D') score -= 10

  // Domain age factors (deduct 0-20 points)
  if (domain.ageDays < 30) score -= 20
  else if (domain.ageDays < 365) score -= 15
  else if (domain.ageDays < 730) score -= 10

  // Threat intelligence factors (deduct 0-40 points)
  if (threats.maliciousCount > 0) score -= 40
  else if (threats.suspiciousCount > 3) score -= 30
  else if (threats.suspiciousCount > 1) score -= 15

  // URL structure factors (deduct 0-15 points)
  const suspiciousPatterns = [
    /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/, // IP address
    /[a-z0-9]{20,}/, // Long random strings
    /secure|login|verify|update|confirm/i, // Suspicious keywords
    /-.*-.*-/g // Multiple hyphens
  ]

  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(url)) score -= 4
  })

  return Math.max(score, 0)
}

function getDefaultSSL() {
  return {
    isValid: false,
    issuer: 'Unknown',
    expiresAt: null,
    grade: 'Unknown'
  }
}

function getDefaultDomain() {
  return {
    ageDays: 0,
    registrar: 'Unknown',
    country: 'Unknown'
  }
}

function getDefaultIP() {
  return {
    address: 'Unknown',
    country: 'Unknown',
    region: 'Unknown',
    city: 'Unknown',
    isp: 'Unknown'
  }
}

function getDefaultThreats() {
  return {
    categories: [],
    confidence: 0,
    maliciousCount: 0,
    suspiciousCount: 0
  }
}

async function performMLClassification(url: string, domain: string, supabase: any) {
  try {
    const features = extractMLFeatures(url)
    const threatScore = calculateMLThreatScore(features)
    const threatProbability = threatScore / 100

    const predictedCategories: string[] = []
    if (features.hasIpAddress) predictedCategories.push('IP-based URL')
    if (features.hasSuspiciousKeywords) predictedCategories.push('Suspicious keywords')
    if (features.urlLength > 100) predictedCategories.push('Abnormally long URL')
    if (features.subdomainCount > 3) predictedCategories.push('Excessive subdomains')
    if (features.entropyScore > 4.5) predictedCategories.push('High entropy')

    const historicalPattern = await checkHistoricalPatterns(domain, supabase)

    let adjustedProbability = threatProbability
    let confidence = 0.75

    if (historicalPattern) {
      adjustedProbability = (threatProbability + historicalPattern.confidence_score) / 2
      confidence = Math.min(0.95, confidence + 0.15)

      if (historicalPattern.pattern_type === 'phishing') {
        predictedCategories.push('Known phishing pattern')
      }
    }

    await updateMLPatterns(domain, features, adjustedProbability, supabase)

    return {
      isPhishing: adjustedProbability > 0.5,
      confidence,
      threatProbability: adjustedProbability,
      predictedCategories
    }
  } catch (error) {
    console.error('ML classification error:', error)
    return {
      isPhishing: false,
      confidence: 0.5,
      threatProbability: 0,
      predictedCategories: []
    }
  }
}

function extractMLFeatures(url: string) {
  const urlLower = url.toLowerCase()
  const numDots = (url.match(/\./g) || []).length
  const numHyphens = (url.match(/-/g) || []).length
  const numDigits = (url.match(/\d/g) || []).length
  const numSpecialChars = (url.match(/[^a-zA-Z0-9.-]/g) || []).length
  const hasIpAddress = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)

  const suspiciousKeywords = ['login', 'verify', 'account', 'update', 'secure', 'banking', 'password', 'confirm', 'suspended', 'locked', 'urgent']
  const hasSuspiciousKeywords = suspiciousKeywords.some(k => urlLower.includes(k))

  const entropyScore = calculateEntropy(url)

  let hostname = ''
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    hostname = urlObj.hostname
  } catch {
    hostname = url.split('/')[0]
  }

  const subdomainCount = Math.max(0, hostname.split('.').length - 2)
  const pathDepth = Math.max(0, url.split('/').length - 3)

  return {
    urlLength: url.length,
    numDots,
    numHyphens,
    numDigits,
    numSpecialChars,
    hasIpAddress,
    hasSuspiciousKeywords,
    entropyScore,
    subdomainCount,
    pathDepth
  }
}

function calculateEntropy(str: string): number {
  const len = str.length
  const frequencies: { [key: string]: number } = {}

  for (let i = 0; i < len; i++) {
    const char = str[i]
    frequencies[char] = (frequencies[char] || 0) + 1
  }

  let entropy = 0
  for (const char in frequencies) {
    const p = frequencies[char] / len
    entropy -= p * Math.log2(p)
  }

  return entropy
}

function calculateMLThreatScore(features: any): number {
  let score = 0

  if (features.urlLength > 75) score += 15
  if (features.urlLength > 100) score += 10
  if (features.numHyphens > 2) score += 10
  if (features.numDigits > 8) score += 10
  if (features.numSpecialChars > 5) score += 15
  if (features.hasIpAddress) score += 25
  if (features.hasSuspiciousKeywords) score += 20
  if (features.entropyScore > 4.5) score += 15
  if (features.subdomainCount > 3) score += 15
  if (features.pathDepth > 5) score += 10

  return Math.min(100, score)
}

async function checkHistoricalPatterns(domain: string, supabase: any) {
  try {
    const { data } = await supabase
      .from('ml_patterns')
      .select('*')
      .ilike('url_pattern', `%${domain}%`)
      .order('confidence_score', { ascending: false })
      .limit(1)
      .maybeSingle()

    return data
  } catch {
    return null
  }
}

async function updateMLPatterns(domain: string, features: any, threatProbability: number, supabase: any) {
  try {
    const patternType = threatProbability > 0.7 ? 'phishing' :
                       threatProbability > 0.4 ? 'suspicious' : 'legitimate'

    const { data: existing } = await supabase
      .from('ml_patterns')
      .select('*')
      .eq('url_pattern', domain)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('ml_patterns')
        .update({
          detection_count: existing.detection_count + 1,
          last_detected: new Date().toISOString(),
          confidence_score: (existing.confidence_score + threatProbability) / 2,
          features: features
        })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('ml_patterns')
        .insert({
          url_pattern: domain,
          pattern_type: patternType,
          confidence_score: threatProbability,
          detection_count: 1,
          features: features
        })
    }

    await supabase
      .from('blockchain_logs')
      .insert({
        log_type: 'pattern_learned',
        url: domain,
        data: {
          pattern_type: patternType,
          threat_probability: threatProbability,
          features
        }
      })
  } catch (error) {
    console.error('Error updating ML patterns:', error)
  }
}