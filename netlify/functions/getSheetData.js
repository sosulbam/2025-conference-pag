// 이 코드는 방문자의 컴퓨터가 아닌, Netlify 서버에서 실행됩니다.

exports.handler = async function (event, context) {
    // Netlify 환경 변수에서 API 키와 시트 ID를 안전하게 가져옵니다.
    const API_KEY = process.env.API_KEY;
    const SPREADSHEET_ID = process.env.SHEET_ID;
    // 시트 이름을 '팀리더지침'으로 수정합니다.
    const SHEET_NAME = '팀리더지침';

    const API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?ranges=${encodeURIComponent(SHEET_NAME)}&fields=sheets(data(rowData(values(formattedValue,effectiveFormat(textFormat(bold,foregroundColorStyle(rgbColor)),borders)))))&key=${API_KEY}`;

    try {
        // Netlify의 최신 환경에서는 fetch가 기본적으로 내장되어 있으므로, 별도의 라이브러리 없이 바로 사용합니다.
        const response = await fetch(API_URL);
        if (!response.ok) {
            // 오류 발생 시 더 자세한 정보를 반환하도록 수정
            const errorBody = await response.text();
            console.error(`Google Sheets API Error: ${response.status} ${errorBody}`);
            return { statusCode: response.status, body: `Error fetching from Google Sheets: ${errorBody}` };
        }
        const data = await response.json();

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
