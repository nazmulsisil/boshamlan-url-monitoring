import React, { useState } from "react";
import axios from "axios";

// Available subdomains that can be checked
const AVAILABLE_SUBDOMAINS = ["om", "qa", "ae", "bh"];

const Home = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [additionalUrls, setAdditionalUrls] = useState("");
  const [skipSitemap, setSkipSitemap] = useState(false);
  const [selectedSubdomains, setSelectedSubdomains] = useState([]);

  const handleSubdomainToggle = (subdomain) => {
    setSelectedSubdomains((prev) =>
      prev.includes(subdomain)
        ? prev.filter((sd) => sd !== subdomain)
        : [...prev, subdomain]
    );
  };

  const handleSelectAllSubdomains = (e) => {
    setSelectedSubdomains(e.target.checked ? [...AVAILABLE_SUBDOMAINS] : []);
  };

  // Determine if the "Check URLs Now" button should be disabled
  const isCheckButtonDisabled = () => {
    // When checking sitemap links (skipSitemap is false), require at least one subdomain
    if (!skipSitemap && selectedSubdomains.length === 0) {
      return true;
    }

    // When skipping sitemap (only checking additional URLs), require some URLs
    if (skipSitemap && additionalUrls.trim() === "") {
      return true;
    }

    return false;
  };

  const fetchData = async () => {
    try {
      // Add validation to check if subdomains are selected when sitemap checking is required
      if (!skipSitemap && selectedSubdomains.length === 0) {
        alert(
          "Please select at least one subdomain when checking sitemap links"
        );
        return;
      }

      // If only checking additional URLs without sitemap, we don't need subdomains
      // But ensure we have some URLs to check
      if (skipSitemap && additionalUrls.trim() === "") {
        alert(
          "Please enter at least one URL to check or enable sitemap checking"
        );
        return;
      }

      setLoading(true);
      const additionalUrlsArray = additionalUrls
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url !== "");

      const result = await axios.post("/api/check-urls", {
        additionalUrls: additionalUrlsArray,
        skipSitemap,
        subdomains: selectedSubdomains,
      });

      setData(result.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching URL status:", error);
      setLoading(false);
      alert("Error checking URLs. Please try again.");
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
            {/* Single line subdomain selection with checkboxes */}
            <div className="w-full mb-4">
              <div className="flex items-center gap-1 mb-2">
                <h3 className="text-gray-700 whitespace-nowrap">
                  Select subdomains:
                </h3>

                {/* Horizontal single-line checkbox list */}
                <div className="flex flex-wrap items-center gap-3 ml-2">
                  {AVAILABLE_SUBDOMAINS.map((subdomain) => (
                    <div key={subdomain} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`subdomain-${subdomain}`}
                        checked={selectedSubdomains.includes(subdomain)}
                        onChange={() => handleSubdomainToggle(subdomain)}
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                      <label
                        htmlFor={`subdomain-${subdomain}`}
                        className="ml-1 text-sm text-gray-700 cursor-pointer"
                      >
                        {subdomain}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keep validation message */}
              {!skipSitemap && selectedSubdomains.length === 0 && (
                <div className="text-amber-600 text-xs">
                  * Please select at least one subdomain
                </div>
              )}
            </div>

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

            {/* Validation message when no URLs are provided but sitemap is skipped */}
            {skipSitemap && additionalUrls.trim() === "" && (
              <div className="text-amber-600 text-sm mb-2 w-full text-start">
                * Please enter at least one URL when skipping sitemap links
              </div>
            )}

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
              className={`border rounded m-3 px-4 py-2 ${
                isCheckButtonDisabled()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white transition-colors`}
              onClick={fetchData}
              disabled={isCheckButtonDisabled()}
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
            Checking URLs. Can take around 120 seconds.
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
                          rel="noopener noreferrer"
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
