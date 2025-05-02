import axios from "axios";
import async from "async";
const { performance } = require("perf_hooks");

// This function can run for a maximum of 60 seconds
export const config = {
  maxDuration: 60,
};

const apiEndpoint = "https://api2.boshamlan.com/v1/slugs";
const SUBDOMAINS = ["om", "qa", "ae", "bh"]; // All subdomains to check
const concurrencyLimit = 30; // Limit the number of concurrent requests
const errorUrls = [];
let totalUrlsCount = 0;
let crawledUrlsCount = 0;

const getSiteUrl = (subdomain) => `https://${subdomain}.boshamlan.com`;

const cleanUrl = (url = "") => url.replace(/([^:]\/)\/+/g, "$1");
const relativeToAbsoluteUrl = (relativeUrl, siteUrl) => {
  if (!relativeUrl) return "";
  if (typeof relativeUrl !== "string") return "";
  if (relativeUrl.includes("http")) return relativeUrl;
  return cleanUrl(`${siteUrl}/${relativeUrl}`);
};
const slugsToRelativeUrl = (slugs) => {
  return cleanUrl(`/${slugs.join("/")}`);
};

const checkUrlsForSubdomain = async (
  subdomain,
  additionalUrls,
  skipSitemap
) => {
  const apiHeaders = {
    "X-Subdomain": subdomain,
    "Content-Type": "application/json",
  };
  const siteUrl = getSiteUrl(subdomain);

  try {
    let urls = [];

    if (!skipSitemap) {
      const response = await axios.get(apiEndpoint, { headers: apiHeaders });
      const responseData = response.data;

      const childLinks = (responseData?.serp || []).map((slugsArr) => {
        return {
          title: slugsArr[0],
          href: relativeToAbsoluteUrl(
            slugsToRelativeUrl(slugsArr.slice(1)),
            siteUrl
          ),
        };
      });

      urls = [...childLinks.map((link) => link.href), ...additionalUrls];
    } else {
      urls = [...additionalUrls];
    }

    // Track these URLs for this subdomain
    const subdomainTotalUrls = urls.length;
    let subdomainCrawledUrls = 0;
    const subdomainErrorUrls = [];

    if (urls.length === 0) {
      return {
        subdomain,
        totalUrlsCount: 0,
        crawledUrlsCount: 0,
        errorUrlsCount: 0,
        errorUrls: [],
      };
    }

    const queue = async.queue(async (task, done) => {
      try {
        const response = await axios.get(task.url);
        subdomainCrawledUrls++;
        crawledUrlsCount++;
        if (response.status >= 402 || response.status === "No Response") {
          const errorUrl = {
            subdomain,
            url: task.url,
            status: response.status,
          };
          subdomainErrorUrls.push(errorUrl);
          errorUrls.push(errorUrl);
        }
      } catch (error) {
        subdomainCrawledUrls++;
        crawledUrlsCount++;
        const status = error.response ? error.response.status : "No Response";
        if (status >= 402 || status === "No Response") {
          const errorUrl = {
            subdomain,
            url: task.url,
            status,
          };
          subdomainErrorUrls.push(errorUrl);
          errorUrls.push(errorUrl);
        }
      }
      done();
    }, concurrencyLimit);

    urls.forEach((url) => {
      queue.push({ url });
    });

    await queue.drain();

    totalUrlsCount += subdomainTotalUrls;

    return {
      subdomain,
      totalUrlsCount: subdomainTotalUrls,
      crawledUrlsCount: subdomainCrawledUrls,
      errorUrlsCount: subdomainErrorUrls.length,
      errorUrls: subdomainErrorUrls,
    };
  } catch (error) {
    console.error(`Error fetching URLs for subdomain ${subdomain}:`, error);
    return {
      subdomain,
      totalUrlsCount: 0,
      crawledUrlsCount: 0,
      errorUrlsCount: 0,
      errorUrls: [],
      error: error.message,
    };
  }
};

const checkUrls = async (additionalUrls, skipSitemap) => {
  errorUrls.length = 0;
  crawledUrlsCount = 0;
  totalUrlsCount = 0;
  const startTime = performance.now();

  try {
    const subdomainResults = [];

    // Check each subdomain sequentially to avoid hammering the API
    for (const subdomain of SUBDOMAINS) {
      const result = await checkUrlsForSubdomain(
        subdomain,
        additionalUrls,
        skipSitemap
      );
      subdomainResults.push(result);
    }

    const endTime = performance.now();
    const timeSpent = (endTime - startTime) / 1000; // Time in seconds

    if (errorUrls.length > 0) {
      await sendEmailNotification(errorUrls);
    }

    return {
      subdomainResults,
      totalUrlsCount,
      crawledUrlsCount,
      errorUrlsCount: errorUrls.length,
      timeSpent,
      errorUrls,
    };
  } catch (error) {
    console.error("Error checking URLs across subdomains:", error);
    throw error;
  }
};

const sendEmailNotification = async (errorUrls) => {};

export default async (req, res) => {
  const { additionalUrls, skipSitemap } = req.body;
  try {
    const result = await checkUrls(additionalUrls || [], skipSitemap);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to check URLs" });
  }
};
