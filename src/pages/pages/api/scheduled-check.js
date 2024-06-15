import checkUrls from "./check-urls";

export default async (req, res) => {
  try {
    await checkUrls(req, res);
    res.status(200).send("Scheduled URL check executed.");
  } catch (error) {
    res.status(500).send("Failed to execute scheduled URL check.");
  }
};
