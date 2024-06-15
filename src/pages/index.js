import React, { useState, useEffect } from "react";
import axios from "axios";

const Home = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <h1>URL Monitoring Status</h1>
      {loading ? (
        <div>Loading...</div>
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
                <td>{data.totalUrlsCount}</td>
                <td>{data.errorUrlsCount}</td>
                <td>{data.timeSpent}s</td>
              </tr>
            </tbody>
          </table>
          <button onClick={fetchData}>Check URLs Now</button>
        </div>
      )}
    </div>
  );
};

export default Home;
