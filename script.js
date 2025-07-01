// 이제 API 키와 시트 ID가 코드에서 완전히 제거되었습니다.
// 대신 우리가 만든 Netlify Function을 호출합니다.
const API_URL = '/api/getSheetData';

// 웹페이지가 로드되면 자동으로 실행되는 함수
window.addEventListener('DOMContentLoaded', () => {
    fetchData();
});

// 구글 시트에서 데이터와 서식 정보를 가져오는 함수
async function fetchData() {
    const loader = document.getElementById('loader');
    const docContainer = document.getElementById('doc-container');
    
    docContainer.style.display = 'none';
    loader.style.display = 'block';

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('네트워크 응답에 문제가 있습니다.');
        
        const data = await response.json();
        if (!data.sheets?.[0]?.data?.[0]?.rowData) throw new Error('시트에 데이터가 없습니다.');

        displayDataAsDocument(data.sheets[0].data[0].rowData);

    } catch (error) {
        console.error('데이터를 가져오는 데 실패했습니다:', error);
        document.querySelector('.container').innerHTML = `<p style="color:red; text-align:center;">데이터 로딩에 실패했습니다. 잠시 후 다시 시도해주세요.</p>`;
    } finally {
        loader.style.display = 'none';
        docContainer.style.display = 'block';
    }
}

// 텍스트 처리(링크, 줄바꿈)를 위한 헬퍼 함수
function processCellText(text) {
    let processedText = (text || '').replace(/\n/g, '<br>');
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    processedText = processedText.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
    return processedText;
}

// 구글 API의 RGB 색상 객체를 CSS 색상 문자열로 변환하는 함수
function formatRgbColor(rgbColor) {
    if (!rgbColor) return null;
    const red = Math.round((rgbColor.red || 0) * 255);
    const green = Math.round((rgbColor.green || 0) * 255);
    const blue = Math.round((rgbColor.blue || 0) * 255);
    return `rgb(${red}, ${green}, ${blue})`;
}

// 가져온 데이터를 문서 형태로 화면에 표시하는 함수
function displayDataAsDocument(rowData) {
    const docContainer = document.getElementById('doc-container');
    docContainer.innerHTML = '';

    const cleanRows = rowData.filter(row => row.values && row.values.some(cell => cell.formattedValue));

    if (cleanRows[0]) {
        const mainTitle = document.createElement('h1');
        mainTitle.className = 'main-title';
        mainTitle.textContent = cleanRows[0].values[0].formattedValue || '';
        docContainer.appendChild(mainTitle);
    }
    if (cleanRows[1]) {
        const subTitle = document.createElement('p');
        subTitle.className = 'sub-title';
        subTitle.textContent = cleanRows[1].values[0].formattedValue || '';
        docContainer.appendChild(subTitle);
    }

    for (let i = 2; i < cleanRows.length; i++) {
        const currentRow = cleanRows[i];
        const isTitle = currentRow.values?.[0]?.effectiveFormat?.textFormat?.bold;

        if (isTitle) {
            const block = document.createElement('div');
            block.className = 'doc-block';

            const title = document.createElement('h2');
            title.className = 'doc-title';
            title.textContent = currentRow.values[0].formattedValue;
            block.appendChild(title);

            const nextRow = cleanRows[i + 1];
            const isTable = nextRow?.values?.some(cell => cell.effectiveFormat?.borders);
            
            if (isTable) {
                const tableWrapper = document.createElement('div');
                tableWrapper.className = 'table-wrapper';
                
                const table = document.createElement('table');
                table.className = 'doc-table';
                
                let tableRowIndex = i + 1;

                let columnCount = 0;
                if (nextRow.values) {
                    for (let j = nextRow.values.length - 1; j >= 0; j--) {
                        if (nextRow.values[j]?.formattedValue) {
                            columnCount = j + 1;
                            break;
                        }
                    }
                }

                if (columnCount > 0) {
                    const thead = document.createElement('thead');
                    const headerRow = document.createElement('tr');
                    for (let k = 0; k < columnCount; k++) {
                        const th = document.createElement('th');
                        const cellData = nextRow.values[k];
                        const textColor = cellData?.effectiveFormat?.textFormat?.foregroundColorStyle?.rgbColor;
                        th.innerHTML = processCellText(cellData?.formattedValue);
                        if (textColor) {
                            th.style.color = formatRgbColor(textColor);
                        }
                        headerRow.appendChild(th);
                    }
                    thead.appendChild(headerRow);
                    table.appendChild(thead);

                    const tbody = document.createElement('tbody');
                    tableRowIndex = i + 2;
                    while (tableRowIndex < cleanRows.length && cleanRows[tableRowIndex].values?.some(cell => cell.effectiveFormat?.borders)) {
                        const bodyTr = document.createElement('tr');
                        const tableRowData = cleanRows[tableRowIndex].values;
                        for (let k = 0; k < columnCount; k++) {
                            const td = document.createElement('td');
                            const cellData = tableRowData?.[k];
                            const textColor = cellData?.effectiveFormat?.textFormat?.foregroundColorStyle?.rgbColor;
                            td.innerHTML = processCellText(cellData?.formattedValue);
                            if (textColor) {
                                td.style.color = formatRgbColor(textColor);
                            }
                            bodyTr.appendChild(td);
                        }
                        tbody.appendChild(bodyTr);
                        tableRowIndex++;
                    }
                    table.appendChild(tbody);
                }
                
                tableWrapper.appendChild(table);
                block.appendChild(tableWrapper);
                i = tableRowIndex - 1; 
            } else {
                const content = document.createElement('div');
                content.className = 'doc-content';
                let contentHTML = '';
                
                let contentRowIndex = i + 1;
                while (contentRowIndex < cleanRows.length && !cleanRows[contentRowIndex].values?.[0]?.effectiveFormat?.textFormat?.bold) {
                    const contentRow = cleanRows[contentRowIndex];
                    let lineContent = '';
                    (contentRow.values || []).forEach(cell => {
                        const cellText = cell.formattedValue || '';
                        const textColor = cell.effectiveFormat?.textFormat?.foregroundColorStyle?.rgbColor;
                        if (textColor) {
                            lineContent += `<span style="color:${formatRgbColor(textColor)}">${cellText}</span>`;
                        } else {
                            lineContent += cellText;
                        }
                        lineContent += ' ';
                    });
                    
                    if (contentHTML !== '') contentHTML += '<br>';
                    contentHTML += processCellText(lineContent.trim());
                    contentRowIndex++;
                }
                content.innerHTML = contentHTML;
                block.appendChild(content);
                i = contentRowIndex - 1;
            }
            docContainer.appendChild(block);
        }
    }
}
