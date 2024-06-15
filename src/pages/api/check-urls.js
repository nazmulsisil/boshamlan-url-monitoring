import axios from "axios";
import async from "async";
const { performance } = require("perf_hooks");

// This function can run for a maximum of 5 seconds
export const config = {
  maxDuration: 3,
};

const apiEndpoint = "https://api.boshamlan.com/v1/slugs";
const apiHeaders = {
  "X-Subdomain": "kw",
};
const concurrencyLimit = 100;
const errorUrls = [];
let totalUrlsCount = 0;

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

const checkUrls = async () => {
  errorUrls.length = 0;
  const startTime = performance.now();

  try {
    const response = await axios.get(apiEndpoint, { headers: apiHeaders });
    const responseData = response.data;

    const childLinks = (responseData?.serp || []).map((slugsArr) => {
      return {
        title: slugsArr[0],
        href: relativeToAbsoluteUrl(slugsToRelativeUrl(slugsArr.slice(1))),
      };
    });

    const urls = [
      ...childLinks.map((link) => link.href),
      "https://www.boshamlan.com/404",
    ];

    totalUrlsCount = urls.length;

    const queue = async.queue(async (task, done) => {
      try {
        const response = await axios.get(task.url);
        if (response.status >= 402 || response.status === "No Response") {
          errorUrls.push({
            url: task.url,
            status: response.status,
          });
        }
      } catch (error) {
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
  try {
    const result = await checkUrls();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to check URLs" });
  }
};
