import React, { useState } from "react";
import axios from "axios";

const Home = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [additionalUrls, setAdditionalUrls] = useState("");
  const [skipSitemap, setSkipSitemap] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const additionalUrlsArray = additionalUrls
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url !== "");
      const result = await axios.post("/api/check-urls", {
        additionalUrls: additionalUrlsArray,
        skipSitemap,
      });
      setData(result.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching URL status:", error);
      setLoading(false);
    }
  };

  const time = data.timeSpent?.toFixed();

  // const found402PlusError = useMemo(
  //   () => data.errorUrls?.find((error) => error.status >= 402),
  //   [data.errorUrls]
  // );

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl text-center font-bold my-6 text-blue-600">
        Boshamlan Website Health Check
      </h1>

      {!loading && (
        <div className="flex items-center justify-center mb-12">
          <div className="flex flex-col items-center w-full">
            <h3 className="w-full text-start mb-1">
              Optionally you can pass a list of additional URLs to check, URLs
              must start with http:// or https://
            </h3>
            <textarea
              className="border rounded w-full p-2 mb-4"
              rows="4"
              placeholder="Enter additional URLs, one per line"
              value={additionalUrls}
              onChange={(e) => setAdditionalUrls(e.target.value)}
            />
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="skipSitemap"
                checked={skipSitemap}
                onChange={(e) => setSkipSitemap(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="skipSitemap" className="text-gray-700">
                Skip our sitemap links
              </label>
            </div>
            <button
              className="border rounded m-3 px-4 py-1 bg-blue-600 text-white"
              onClick={fetchData}
            >
              Check URLs Now
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col justify-center items-center gap-4 text-blue-500">
          <div className="lds-ripple">
            <div></div>
            <div></div>
          </div>

          <div className="text-gray-800-500">
            Checking URLs. Can take around 30 seconds.
          </div>
        </div>
      ) : (
        <div>
          <table>
            <thead>
              <tr>
                <th>Total URLs Crawled</th>
                <th>URLs Errored</th>
                <th>Time Spent</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{data.crawledUrlsCount ?? "-"}</td>
                <td>{data.errorUrlsCount ?? "-"}</td>
                <td>
                  {time}
                  {time ? "s" : "-"}
                </td>
              </tr>
            </tbody>
          </table>

          {data.errorUrls && data.errorUrls.length === 0 && (
            <div className="mt-12 flex flex-col items-center">
              <div
                className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <strong className="font-bold">🎉 Success!</strong>
                <span className="block sm:inline">
                  {" "}
                  All URLs are working fine. No errors found.
                </span>
              </div>
            </div>
          )}

          {data.errorUrls && data.errorUrls.length > 0 && (
            <div className="mt-12">
              <table>
                <thead>
                  <tr>
                    <th>Error URL</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.errorUrls.map((error, index) => (
                    <tr key={index}>
                      <td>
                        <a
                          target="_blank"
                          href={error.url}
                          className="text-blue-500"
                        >
                          {error.url}
                        </a>
                      </td>
                      <td>
                        <div className="flex items-center justify-center">
                          <div
                            className={`rounded px-2 w-auto ${
                              error.status === 404
                                ? "bg-red-500 text-white"
                                : ""
                            }`}
                          >
                            {error.status}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="h-6" />
    </div>
  );
};

export default Home;
