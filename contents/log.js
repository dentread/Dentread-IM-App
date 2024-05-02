let fetchedData; // Global variable to store fetched data
function downloadLog() {
    event.preventDefault();
    if (!fetchedData) {
        console.error('No data fetched yet.');
        return;
    }

    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.aoa_to_sheet([
        ["Folder", "File", "Size (MB)", "Synced at (UTC)"]
    ]);

    for (const folderName in fetchedData.folders) {
        if (fetchedData.folders.hasOwnProperty(folderName)) {
            fetchedData.folders[folderName].forEach(file => {
                XLSX.utils.sheet_add_aoa(ws, [
                    [folderName, file.filename, (file.filesize / 1048576).toFixed(2), file['Synced time']]
                ], { origin: -1 });
            });
        }
    }

    var currentTime = new Date(); // Get current time
    var timestamp = currentTime.toISOString().replace(/[-:]/g, '').replace('T', '_').replace(/\.\d{3}Z/, ''); // Convert to ISO string and format
    var filename = 'log_' + timestamp + '.xlsx'; // Append timestamp to the file name


    XLSX.utils.book_append_sheet(wb, ws, "Log");

    var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

    function s2ab(s) {
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }

    var blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });

    var downloadLink = document.createElement('a');
    downloadLink.href = window.URL.createObjectURL(blob);
    downloadLink.download = filename;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}
document.getElementById('downloadLink').removeEventListener('click', downloadLog);
document.getElementById('downloadLink').addEventListener('click', downloadLog);

// Call fetchData function when the page is loaded
document.getElementById('refreshlog').addEventListener('click', fetchlogData);
function fetchlogData() {
    const token = JSON.parse(localStorage.getItem('token'));
    let acces_token = token.access;

    if (!token) {
        console.error('Token not available. Redirecting to login page...');
        window.location.href = 'login_dentread.html';
    } else {

        const apiUrl = 'http://testapi.dentread.com/user-directory/';

        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${acces_token}`,
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                console.error('API request error:', response.statusText);
            }
        })
        .then(data => {
            fetchedData = data || { folders: {} }; // Assign fetched data to global variable or an empty object if no data is returned
            const tableBody = document.getElementById('logContainer');

            // Clear existing table contents
            tableBody.innerHTML = '';

            // Create table headers
            const tableHeader = document.createElement('tr');
            tableHeader.innerHTML = `
                <th>Folder</th>
                <th>File</th>
                <th>Size (MB)</th>
                <th>Synced at (UTC)</th>
            `;
            tableBody.appendChild(tableHeader);

            // Populate table with data
            for (const folderName in fetchedData.folders) {
                if (fetchedData.folders.hasOwnProperty(folderName)) {
                    const files = fetchedData.folders[folderName];

                    // Iterate over each file in the folder
                    files.forEach(file => {
                        // Create a table row for each file
                        const row = document.createElement('tr');
                        mbfilesize = (file.filesize / 1048576).toFixed(2)
                        // Populate the table row with file data
                        row.innerHTML = `
                            <td>${folderName}</td>
                            <td>${file.filename}</td>
                            <td>${mbfilesize}</td>
                            <td>${file['Synced time']}</td>
                        `;

                        // Append the row to the table body
                        tableBody.appendChild(row);
                    });
                }
            }
        })
        .catch(error => {
            console.error('API request error:', error.message);
        });
    }
}


