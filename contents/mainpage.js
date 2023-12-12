
function fetchData() {

    const token = JSON.parse(localStorage.getItem('token'));
    let acces_token= token.access;

    if (!token) {
        console.error('Token not available. Redirecting to login page...');

        window.location.href = 'login_dentread.html';
    } else {
        console.log('Token available:', acces_token);

        const apiUrl = 'https://api.dentread.com/user-folders/';

        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${acces_token}`, 
                'Content-Type': 'application/json', 
            },

        })
        .then(response => {
            if (response.ok) {
                console.log('API request successful');
                return response.json(); 
            } else {

                console.error('API request error:', response.statusText);
            }
        })
        .then(data => {

            console.log('API response:', data);

            const folderNamesSet = new Set();
            const filenamesSet = new Set();
        
            for (const folderName in data.folders) {
                if (data.folders.hasOwnProperty(folderName)) {
                    folderNamesSet.add(folderName); 

                    data.folders[folderName].forEach(file => {
                        filenamesSet.add(file.filename); 
                    });
                }
            }
        

            localStorage.setItem('folderNames', JSON.stringify(Array.from(folderNamesSet)));
            localStorage.setItem('filenames', JSON.stringify(Array.from(filenamesSet)));
        
        })
        .catch(error => {
            console.error('API request error:', error.message);

        });
    }
}



