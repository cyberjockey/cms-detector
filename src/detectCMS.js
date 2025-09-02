import axios from 'axios';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const cheerio = require('cheerio');

async function detectCMS(rawUrl) {
  try {
    // Validate URL is non-empty string
    if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === '') {
      return { cms: 'Error', reason: 'Empty or invalid URL' };
    }

    // Normalize URL: add http:// if no protocol present
    let url = rawUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'http://' + url;
    }

    // Make HTTP GET request with timeout
    const res = await axios.get(url, { timeout: 7000 });
    const html = res.data;
    const headers = res.headers;
    const $ = cheerio.load(html);

    // Cache meta generator content
    const metaGen = $('meta[name="generator"]').attr('content') ?? '';

    // Early exit detection to avoid unnecessary checks
    if (html.includes('/wp-content/') || metaGen.includes('WordPress')) {
      return { cms: 'WordPress', reason: 'Detected WordPress markers' };
    }

    if (url.includes('/administrator/') || metaGen.includes('Joomla')) {
      return { cms: 'Joomla', reason: 'Detected Joomla markers' };
    }

    if (headers['x-generator']?.includes('Drupal') || html.includes('/sites/all/themes/')) {
      return { cms: 'Drupal', reason: 'Detected Drupal markers' };
    }

    if (html.includes('cdn.shopify.com') || metaGen.includes('Shopify')) {
      return { cms: 'Shopify', reason: 'Detected Shopify markers' };
    }

    if (html.includes('static.wix.com') || headers['x-wix-request-id']) {
      return { cms: 'Wix', reason: 'Detected Wix markers' };
    }

    if (html.includes('static.squarespace.com')) {
      return { cms: 'Squarespace', reason: 'Detected Squarespace markers' };
    }

    if (metaGen.includes('Webflow')) {
      return { cms: 'Webflow', reason: 'Detected Webflow markers' };
    }

    return { cms: 'Unknown', reason: 'No CMS markers found' };

  } catch (error) {
    console.error(`Error fetching URL ${rawUrl}:`, error);

    if (error.response) {
      return { cms: 'Error', reason: `HTTP ${error.response.status} - ${error.response.statusText}` };
    } else if (error.request) {
      return { cms: 'Error', reason: 'No response received from server or request timed out' };
    } else {
      return { cms: 'Error', reason: error.message || 'Unknown error occurred' };
    }
  }
}

export default detectCMS;
