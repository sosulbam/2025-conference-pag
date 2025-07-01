// 이 코드는 방문자의 컴퓨터가 아닌, Netlify 서버에서 실행됩니다.

// 캐시를 위한 변수 선언
let cache = {
  timestamp: 0,
  data: null,
};

// 캐시 유지 시간 (초 단위, 여기서는 60초 = 1분)
const CACHE_DURATION_SECONDS = 60;

exports.handler = async function (event, context) {
  const now = Date.now();

  // 캐시가 유효한지 확인 (1분 이내인지)
  if (cache.data && (now - cache.timestamp) < CACHE_DURATION_SECONDS * 1000) {
    // --- 확인용 로그 추가 ---
    console.log("Serving from cache..."); 
    // 캐시가 유효하면, 구글에 요청하지 않고 저장된 데이터를 즉시 반환
    return {
      statusCode: 200,
      body: JSON.stringify(cache.data),
    };
  }

  // --- 캐시가 없거나 만료된 경우, 아래 코드가 실행됩니다 ---
  // --- 확인용 로그 추가 ---
  console.log("Cache expired or empty. Fetching new data from Google Sheets...");

  const API_KEY = process.env.API_KEY;
  const SPREADSHEET_ID = process.env.SHEET_ID;
  const SHEET_NAME = '팀리더지침';

  const API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?ranges=${encodeURIComponent(SHEET_NAME)}&fields=sheets(data(rowData(values(formattedValue,effectiveFormat(textFormat(bold,foregroundColorStyle(rgbColor)),borders)))))&key=${API_KEY}`;

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Google Sheets API Error: ${response.status} ${errorBody}`);
      return { statusCode: response.status, body: `Error fetching from Google Sheets: ${errorBody}` };
    }
    const data = await response.json();

    // 새로운 데이터로 캐시를 업데이트합니다.
    cache = {
      timestamp: now,
      data: data,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Netlify Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data due to a server error.' }),
    };
  }
};
