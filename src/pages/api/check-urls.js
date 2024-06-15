import axios from "axios";
import async from "async";
import twilio from "twilio";
const { performance } = require("perf_hooks");

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

    const urls = childLinks.map((link) => link.href);
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
      sendSmsNotification(errorUrls);
    }

    return {
      totalUrlsCount,
      errorUrlsCount: errorUrls.length,
      timeSpent,
    };
  } catch (error) {
    console.error("Error fetching URLs from API:", error);
    throw error;
  }
};

const sendSmsNotification = (errorUrls) => {
  const accountSid = "your_twilio_account_sid"; // Replace with your Twilio Account SID
  const authToken = "your_twilio_auth_token"; // Replace with your Twilio Auth Token
  const client = twilio(accountSid, authToken);

  const message = `The following URLs are down:\n\n${errorUrls
    .map((e) => `URL: ${e.url}, Status: ${e.status}`)
    .join("\n")}`;

  client.messages
    .create({
      body: message,
      from: "your_twilio_phone_number", // Replace with your Twilio phone number
      to: "your_phone_number", // Replace with your phone number
    })
    .then((message) => console.log(message.sid))
    .catch((error) => console.error(error));
};

export default async (req, res) => {
  try {
    const result = await checkUrls();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to check URLs" });
  }
};
