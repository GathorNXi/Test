#!/usr/bin/env node

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Compte le nombre de partenaires dans les bandeaux de cookies
 * Version simplifiée sans navigateur headless
 */
class SimpleCookiePartnerCounter {
  constructor() {
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
  }

  /**
   * Extrait le nombre de partenaires depuis le HTML/JavaScript
   */
  extractPartnerCount(html) {
    // Patterns pour trouver le nombre de partenaires dans le code source
    const patterns = [
      // Didomi - souvent dans des variables JavaScript
      /vendorsCount["']?\s*:?\s*(\d+)/i,
      /vendors["']?\s*:\s*\[[\s\S]*?\]/g, // Pour compter manuellement
      /"vendors"\s*:\s*(\d+)/i,

      // Patterns génériques dans le texte
      /(\d+)\s*partenaires?/gi,
      /partenaires?\s*[:(]\s*(\d+)/gi,
      /(\d+)\s*vendors?/gi,
      /vendors?\s*[:(]\s*(\d+)/gi,
      /(\d+)\s*partners?/gi,

      // Dans les configurations JSON embarquées
      /"vendorListVersion"\s*:\s*(\d+)/i,
      /"maxVendorId"\s*:\s*(\d+)/i,

      // TCF (Transparency & Consent Framework)
      /purposes\.vendorIds\s*=\s*\[([^\]]+)\]/i,
    ];

    const counts = [];

    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const num = parseInt(match[1], 10);
        if (num > 0 && num < 10000) { // Filtre pour éviter les faux positifs
          counts.push(num);
        }
      }
    }

    // Chercher aussi dans les scripts Didomi spécifiquement
    const didomiMatch = html.match(/didomiConfig\s*=\s*({[\s\S]*?});/);
    if (didomiMatch) {
      try {
        // Essayer d'extraire la config (simplifié, pas de vrai parsing JSON)
        const configText = didomiMatch[1];
        const vendorsMatch = configText.match(/"vendors"[\s\S]*?(\d+)/);
        if (vendorsMatch) {
          counts.push(parseInt(vendorsMatch[1], 10));
        }
      } catch (e) {
        // Ignorer les erreurs de parsing
      }
    }

    // Chercher les tableaux de vendors dans le JavaScript
    const vendorArrayMatches = html.matchAll(/"vendors"\s*:\s*\[([\s\S]*?)\]/g);
    for (const match of vendorArrayMatches) {
      // Compter les éléments séparés par des virgules (approximatif)
      const items = match[1].split(',').filter(item => item.trim());
      if (items.length > 0 && items.length < 10000) {
        counts.push(items.length);
      }
    }

    if (counts.length === 0) {
      return null;
    }

    // Retourner le nombre le plus fréquent et le plus plausible
    const frequency = {};
    counts.forEach(num => {
      frequency[num] = (frequency[num] || 0) + 1;
    });

    // Trier par fréquence et par taille (privilégier les nombres plus grands qui sont plus spécifiques)
    const sorted = Object.entries(frequency)
      .sort((a, b) => {
        // D'abord par fréquence
        if (b[1] !== a[1]) return b[1] - a[1];
        // Puis par valeur (préférer les nombres entre 50-1000)
        const aVal = parseInt(a[0]);
        const bVal = parseInt(b[0]);
        const aScore = (aVal >= 50 && aVal <= 1000) ? 1 : 0;
        const bScore = (bVal >= 50 && bVal <= 1000) ? 1 : 0;
        if (aScore !== bScore) return bScore - aScore;
        return bVal - aVal;
      });

    return parseInt(sorted[0][0], 10);
  }

  /**
   * Détecte la plateforme de consentement
   */
  detectPlatform(html) {
    const platforms = [
      { name: 'Didomi', patterns: ['didomi', 'didomiConfig'] },
      { name: 'OneTrust', patterns: ['onetrust', 'OneTrust'] },
      { name: 'Quantcast', patterns: ['quantcast', '__tcfapi', 'qc-cmp'] },
      { name: 'Cookiebot', patterns: ['cookiebot', 'CybotCookiebot'] },
      { name: 'TrustArc', patterns: ['trustarc', 'truste'] },
      { name: 'Axeptio', patterns: ['axeptio'] }
    ];

    for (const platform of platforms) {
      for (const pattern of platform.patterns) {
        if (html.toLowerCase().includes(pattern.toLowerCase())) {
          return platform.name;
        }
      }
    }

    return 'Inconnu';
  }

  /**
   * Analyse un site web
   */
  async analyzeSite(url) {
    console.log(`\n📊 Analyse de: ${url}`);
    console.log('='.repeat(60));

    try {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 15000,
        maxRedirects: 10,
        validateStatus: function (status) {
          return status >= 200 && status < 400; // Accept redirects and success
        }
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Détecter la plateforme
      const platform = this.detectPlatform(html);
      console.log(`📌 Plateforme détectée: ${platform}`);

      // Chercher le nombre de partenaires
      const partnerCount = this.extractPartnerCount(html);

      if (partnerCount !== null) {
        console.log(`✓ Nombre de partenaires trouvés: ${partnerCount}`);
      } else {
        console.log('⚠️  Impossible de déterminer le nombre de partenaires');
        console.log('   (Le site utilise peut-être un chargement dynamique)');
      }

      // Informations supplémentaires
      const hasGdprKeywords = (html.match(/rgpd|gdpr|consentement|cookies/gi) || []).length;
      console.log(`📝 Mentions RGPD/cookies trouvées: ${hasGdprKeywords}`);

      return {
        url,
        platform,
        partners: partnerCount,
        gdprMentions: hasGdprKeywords
      };

    } catch (error) {
      if (error.response) {
        console.log(`✗ Erreur HTTP ${error.response.status}: ${error.response.statusText}`);
      } else if (error.code === 'ENOTFOUND') {
        console.log(`✗ Impossible de résoudre le nom de domaine`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`✗ Délai d'attente dépassé`);
      } else {
        console.log(`✗ Erreur: ${error.message}`);
      }

      return {
        url,
        platform: null,
        partners: null,
        error: error.message
      };
    }
  }
}

// Fonction principale
async function main() {
  const urls = process.argv.slice(2);

  if (urls.length === 0) {
    console.log('Usage: node cookie-counter-simple.js <url1> [url2] [url3] ...');
    console.log('\nExemple:');
    console.log('  node cookie-counter-simple.js https://www.igen.fr/');
    console.log('  node cookie-counter-simple.js https://www.igen.fr/ https://www.lemonde.fr/');
    console.log('\nNote: Cette version analyse le HTML statique.');
    console.log('      Pour les sites avec chargement dynamique, utilisez cookie-counter.js (nécessite Puppeteer)');
    process.exit(1);
  }

  const counter = new SimpleCookiePartnerCounter();
  const results = [];

  for (const url of urls) {
    const result = await counter.analyzeSite(url);
    results.push(result);
  }

  // Afficher le résumé
  console.log('\n📋 RÉSUMÉ');
  console.log('='.repeat(60));
  for (const result of results) {
    const platformInfo = result.platform ? ` [${result.platform}]` : '';
    const status = result.partners !== null
      ? `✓ ${result.partners} partenaires${platformInfo}`
      : '✗ Non détecté';
    console.log(`${result.url}`);
    console.log(`  ${status}`);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(err => {
    console.error('Erreur fatale:', err);
    process.exit(1);
  });
}

module.exports = SimpleCookiePartnerCounter;
