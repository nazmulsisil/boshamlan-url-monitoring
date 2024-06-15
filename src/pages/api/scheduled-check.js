import checkUrls from "./check-urls";

export default async (req, res) => {
  try {
    const result = await checkUrls();
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send("Failed to execute scheduled URL check.");
  }
};
