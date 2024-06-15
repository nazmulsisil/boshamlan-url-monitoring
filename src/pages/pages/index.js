import React, { useState, useEffect } from "react";
import axios from "axios";

const Home = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await axios.get("/api/check-urls");
        setData(result.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching URL status:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>URL Monitoring Status</h1>
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
    </div>
  );
};

export default Home;
