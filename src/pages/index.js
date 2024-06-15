import React, { useState } from "react";
import axios from "axios";

const Home = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await axios.get("/api/check-urls");
      setData(result.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching URL status:", error);
      setLoading(false);
    }
  };

  const time = data.timeSpent?.toFixed();

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-center my-6 text-blue-600">
        URL Monitoring Status
      </h1>

      {!loading && (
        <div className="flex items-center justify-center mb-12">
          <button
            className="border rounded m-3 px-4 py-1 bg-blue-600 text-white"
            onClick={fetchData}
          >
            Check URLs Now
          </button>
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
                <td>{data.totalUrlsCount ?? "-"}</td>
                <td>{data.errorUrlsCount ?? "-"}</td>
                <td>
                  {time}
                  {time ? "s" : "-"}
                </td>
              </tr>
            </tbody>
          </table>

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
                      <td>{error.url}</td>
                      <td>
                        <div className="flex items-center justify-center">
                          {/* style like a chip */}
                          <div className="bg-red-500 text-white rounded px-2 w-auto">
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
    </div>
  );
};

export default Home;
