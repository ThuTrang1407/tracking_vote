const axios = require("axios");

const API_URL =
  "https://voting.net-solutions.vn/wechoice/v2/voting/vote-count";

const sessionToken =
  "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyQWdlbnQiOiJDaHJvbWUiLCJ1c2VySWQiOjIzMTcxNzk5OTc2MTE5OTksImVtYWlsIjoiYWRvcHR3ZWNob2ljZUBnbWFpbC5jb20iLCJpYXQiOjE3ODMxMzk4MjQsImV4cCI6MTc4Mzc0NDYyNH0.pZBetCsEfXGUefznes6QJN2OJqM2uCP7KEyBcHjoS5M"; // token bạn lấy từ network

const awardId = "1139348144316121089";

async function fetchWeChoiceVotes() {
  const res = await axios.get(API_URL, {
    params: {
      awardId,
      sessionToken,
      save: 1,
    },
  });

  const list =
    res.data?.data?.data?.[0]?.countInfo || [];

  return list.map(item => ({
    id: item.finalCandidateId,
    voteCount: item.voteCount,
  }));
}

module.exports = { fetchWeChoiceVotes };