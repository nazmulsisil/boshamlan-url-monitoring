import axios from "axios";
import async from "async";
const { performance } = require("perf_hooks");

// This function can run for a maximum of 60 seconds
export const config = {
  maxDuration: 60,
};

const apiEndpoint = "https://api.boshamlan.com/v1/slugs";
const apiHeaders = {
  "X-Subdomain": "kw",
};
const concurrencyLimit = 100;
const errorUrls = [];
let totalUrlsCount = 0;
let crawledUrlsCount = 0;

const SITE_URL = "https://www.boshamlan.com"; // Replace with actual site URL

const cleanUrl = (url = "") => url.replace(/([^:]\/)\/+/g, "$1");
const relativeToAbsoluteUrl = (relativeUrl) => {
  if (!relativeUrl) return "";
  if (typeof relativeUrl !== "string") return "";
  if (relativeUrl.includes("http")) return relativeUrl;
  return cleanUrl(`${SITE_URL}/${relativeUrl}`);
};
const slugsToRelativeUrl = (slugs) => {
  return cleanUrl(`/${slugs.join("/")}`);
};

const checkUrls = async (additionalUrls, skipSitemap) => {
  errorUrls.length = 0;
  crawledUrlsCount = 0;
  const startTime = performance.now();

  try {
    let urls = [];

    if (!skipSitemap) {
      const response = await axios.get(apiEndpoint, { headers: apiHeaders });
      const responseData = response.data;

      const childLinks = (responseData?.serp || []).map((slugsArr) => {
        return {
          title: slugsArr[0],
          href: relativeToAbsoluteUrl(slugsToRelativeUrl(slugsArr.slice(1))),
        };
      });

      urls = [...childLinks.map((link) => link.href), ...additionalUrls];
    } else {
      urls = [...additionalUrls];
    }

    totalUrlsCount = urls.length;

    if (urls.length === 0) {
      const endTime = performance.now();
      const timeSpent = (endTime - startTime) / 1000; // Time in seconds
      return {
        totalUrlsCount: 0,
        crawledUrlsCount: 0,
        errorUrlsCount: 0,
        timeSpent,
        errorUrls: [],
      };
    }

    const queue = async.queue(async (task, done) => {
      try {
        const response = await axios.get(task.url);
        crawledUrlsCount++;
        if (response.status >= 402 || response.status === "No Response") {
          errorUrls.push({
            url: task.url,
            status: response.status,
          });
        }
      } catch (error) {
        crawledUrlsCount++;
        const status = error.response ? error.response.status : "No Response";
        if (status >= 402 || status === "No Response") {
          errorUrls.push({
            url: task.url,
            status: status,
          });
        }
      }
      done();
    }, concurrencyLimit);

    urls.forEach((url) => {
      queue.push({ url });
    });

    await queue.drain();

    const endTime = performance.now();
    const timeSpent = (endTime - startTime) / 1000; // Time in seconds

    if (errorUrls.length > 0) {
      await sendEmailNotification(errorUrls);
    }

    return {
      totalUrlsCount,
      crawledUrlsCount,
      errorUrlsCount: errorUrls.length,
      timeSpent,
      errorUrls,
    };
  } catch (error) {
    console.error("Error fetching URLs from API:", error);
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
