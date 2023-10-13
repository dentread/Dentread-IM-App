
function fetchData() {
    // Your code to fetch data goes here
    // ...

    // For example, your existing code to fetch data
    const token = JSON.parse(localStorage.getItem('token'));
    let acces_token= token.access;

    if (!token) {
        console.error('Token not available. Redirecting to login page...');
        // Handle the case when the token is not available
        // For example, redirect back to the login page
        window.location.href = 'login_dentread.html';
    } else {
        console.log('Token available:', acces_token);

        // Define the API endpoint you want to access
        const apiUrl = 'http://testapi.dentread.com/user-folders/';

        // Make a GET request to the API with the token in the headers
        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${acces_token}`, // Include the token in the headers
                'Content-Type': 'application/json', // Set the content type as needed
            },
            // You can include other options like body, headers, etc., as required
        })
        .then(response => {
            if (response.ok) {
                console.log('API request successful');
                return response.json(); // Assuming the response is in JSON format
            } else {
                // Handle errors here (e.g., authentication error, server error)
                console.error('API request error:', response.statusText);
                // You may want to redirect to the login page or show an error message
            }
        })
        .then(data => {
            // Handle the data received from the API
            console.log('API response:', data);
        
            // Initialize sets for folder names and filenames
            const folderNamesSet = new Set();
            const filenamesSet = new Set();
        
            // Iterate through the folders in the JSON data
            for (const folderName in data.folders) {
                if (data.folders.hasOwnProperty(folderName)) {
                    folderNamesSet.add(folderName); // Add folder name to the set
        
                    // Iterate through the files in the current folder
                    data.folders[folderName].forEach(file => {
                        filenamesSet.add(file.filename); // Add filename to the set
                    });
                }
            }
        
            // Convert sets to arrays if needed and store them in local storage
            localStorage.setItem('folderNames', JSON.stringify(Array.from(folderNamesSet)));
            localStorage.setItem('filenames', JSON.stringify(Array.from(filenamesSet)));
        
            // You can also access these sets from local storage later
        })
        .catch(error => {
            // Handle network errors or other exceptions
            console.error('API request error:', error.message);
            // You may want to show an error message to the user
        });
    }
}



