#!/usr/bin/env node

const puppeteer = require('puppeteer');

/**
 * Compte le nombre de partenaires dans les bandeaux de cookies
 */
class CookiePartnerCounter {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Attend que le bandeau de cookies apparaisse
   */
  async waitForCookieBanner(timeout = 5000) {
    const selectors = [
      // Didomi
      '#didomi-host',
      '.didomi-popup',
      '.didomi-consent-popup',
      // OneTrust
      '#onetrust-banner-sdk',
      '#onetrust-consent-sdk',
      // Quantcast
      '#qc-cmp2-ui',
      '.qc-cmp2-container',
      // TrustArc
      '#truste-consent-track',
      // Cookiebot
      '#CybotCookiebotDialog',
      // Générique
      '[class*="cookie"]',
      '[id*="cookie"]',
      '[class*="consent"]',
      '[id*="consent"]'
    ];

    try {
      await this.page.waitForSelector(selectors.join(','), { timeout });
      console.log('✓ Bandeau de cookies détecté');
      return true;
    } catch (error) {
      console.log('✗ Aucun bandeau de cookies détecté dans le délai imparti');
      return false;
    }
  }

  /**
   * Compte les partenaires Didomi
   */
  async countDidomiPartners() {
    try {
      // Chercher le bouton "Personnaliser" ou "En savoir plus"
      const customizeSelectors = [
        'button[aria-label*="Personnaliser"]',
        'button:has-text("Personnaliser")',
        'button:has-text("En savoir plus")',
        '.didomi-button-customize',
        'button[id*="customize"]',
        'button[class*="customize"]'
      ];

      // Cliquer sur le bouton de personnalisation
      for (const selector of customizeSelectors) {
        try {
          const button = await this.page.$(selector);
          if (button) {
            await button.click();
            await this.page.waitForTimeout(1000);
            console.log('✓ Panneau de personnalisation ouvert');
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // Chercher l'onglet "Nos partenaires" ou "Partenaires"
      const partnersTabSelectors = [
        'button:has-text("Nos partenaires")',
        'button:has-text("partenaires")',
        'button[aria-label*="partenaires"]',
        '.didomi-components-radio-option:has-text("partenaires")',
        '[class*="partner"]'
      ];

      for (const selector of partnersTabSelectors) {
        try {
          const tab = await this.page.$(selector);
          if (tab) {
            await tab.click();
            await this.page.waitForTimeout(1000);
            console.log('✓ Onglet partenaires ouvert');
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // Compter les partenaires
      const partnerCount = await this.page.evaluate(() => {
        // Chercher le nombre dans le texte
        const textPatterns = [
          /(\d+)\s*partenaires?/i,
          /partenaires?\s*\((\d+)\)/i,
          /(\d+)\s*vendors?/i
        ];

        const allText = document.body.innerText;
        for (const pattern of textPatterns) {
          const match = allText.match(pattern);
          if (match) {
            return parseInt(match[1], 10);
          }
        }

        // Compter les éléments de liste de partenaires
        const partnerElements = document.querySelectorAll(
          '.didomi-components-vendor, [class*="vendor-item"], [class*="partner-item"]'
        );
        if (partnerElements.length > 0) {
          return partnerElements.length;
        }

        return null;
      });

      return partnerCount;
    } catch (error) {
      console.log('Erreur lors du comptage Didomi:', error.message);
      return null;
    }
  }

  /**
   * Compte les partenaires OneTrust
   */
  async countOneTrustPartners() {
    try {
      const partnerCount = await this.page.evaluate(() => {
        // Chercher dans le texte
        const allText = document.body.innerText;
        const match = allText.match(/(\d+)\s*(vendors?|partenaires?)/i);
        if (match) {
          return parseInt(match[1], 10);
        }

        // Compter les éléments
        const vendors = document.querySelectorAll('.vendor-item, [class*="vendor"]');
        return vendors.length > 0 ? vendors.length : null;
      });

      return partnerCount;
    } catch (error) {
      return null;
    }
  }

  /**
   * Compte les partenaires Quantcast
   */
  async countQuantcastPartners() {
    try {
      const partnerCount = await this.page.evaluate(() => {
        const allText = document.body.innerText;
        const match = allText.match(/(\d+)\s*vendors?/i);
        return match ? parseInt(match[1], 10) : null;
      });

      return partnerCount;
    } catch (error) {
      return null;
    }
  }

  /**
   * Méthode générique pour compter les partenaires
   */
  async countPartners() {
    const count = await this.page.evaluate(() => {
      const allText = document.body.innerText;

      // Patterns pour trouver le nombre de partenaires
      const patterns = [
        /(\d+)\s*partenaires?/i,
        /partenaires?\s*\((\d+)\)/i,
        /(\d+)\s*vendors?/i,
        /vendors?\s*\((\d+)\)/i,
        /(\d+)\s*partners?/i
      ];

      for (const pattern of patterns) {
        const match = allText.match(pattern);
        if (match) {
          const number = parseInt(match[1], 10);
          if (number > 0) {
            return number;
          }
        }
      }

      return null;
    });

    return count;
  }

  /**
   * Analyse un site web et compte les partenaires
   */
  async analyzeSite(url) {
    console.log(`\n📊 Analyse de: ${url}`);
    console.log('='.repeat(60));

    try {
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Attendre le bandeau de cookies
      const hasCookieBanner = await this.waitForCookieBanner();

      if (!hasCookieBanner) {
        console.log('⚠️  Impossible de détecter un bandeau de cookies');
        return { url, partners: null, error: 'No cookie banner detected' };
      }

      // Attendre un peu pour que tout se charge
      await this.page.waitForTimeout(2000);

      // Détecter la plateforme de consentement
      const platform = await this.page.evaluate(() => {
        if (document.querySelector('#didomi-host, .didomi-popup')) return 'didomi';
        if (document.querySelector('#onetrust-banner-sdk')) return 'onetrust';
        if (document.querySelector('#qc-cmp2-ui')) return 'quantcast';
        if (document.querySelector('#CybotCookiebotDialog')) return 'cookiebot';
        return 'unknown';
      });

      console.log(`📌 Plateforme détectée: ${platform}`);

      let partnerCount = null;

      // Essayer les différentes méthodes selon la plateforme
      switch (platform) {
        case 'didomi':
          partnerCount = await this.countDidomiPartners();
          break;
        case 'onetrust':
          partnerCount = await this.countOneTrustPartners();
          break;
        case 'quantcast':
          partnerCount = await this.countQuantcastPartners();
          break;
        default:
          partnerCount = await this.countPartners();
      }

      // Si on n'a pas trouvé via les méthodes spécifiques, essayer la méthode générique
      if (partnerCount === null) {
        partnerCount = await this.countPartners();
      }

      if (partnerCount !== null) {
        console.log(`✓ Nombre de partenaires trouvés: ${partnerCount}`);
      } else {
        console.log('✗ Impossible de compter les partenaires');
      }

      return { url, partners: partnerCount, platform };
    } catch (error) {
      console.log(`✗ Erreur: ${error.message}`);
      return { url, partners: null, error: error.message };
    }
  }
}

// Fonction principale
async function main() {
  const urls = process.argv.slice(2);

  if (urls.length === 0) {
    console.log('Usage: node cookie-counter.js <url1> [url2] [url3] ...');
    console.log('\nExemple:');
    console.log('  node cookie-counter.js https://www.igen.fr/');
    process.exit(1);
  }

  const counter = new CookiePartnerCounter();

  try {
    await counter.init();

    const results = [];
    for (const url of urls) {
      const result = await counter.analyzeSite(url);
      results.push(result);
    }

    // Afficher le résumé
    console.log('\n📋 RÉSUMÉ');
    console.log('='.repeat(60));
    for (const result of results) {
      const status = result.partners !== null ? `✓ ${result.partners} partenaires` : '✗ Non détecté';
      console.log(`${result.url}: ${status}`);
    }

  } catch (error) {
    console.error('Erreur fatale:', error);
    process.exit(1);
  } finally {
    await counter.close();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = CookiePartnerCounter;
