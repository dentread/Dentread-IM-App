function doSomething(message) {
    const errorMessageElement = document.getElementById('error-message');
    errorMessageElement.innerText = message;
    errorMessageElement.classList.add('show');
    const loginButton = document.querySelector('.btn-login');
    loginButton.classList.add('shake');

    setTimeout(() => {
        errorMessageElement.classList.remove('show');
        loginButton.classList.remove('shake');
    }, 2000);
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.toggle-password i');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

const rememberMeCheckbox = document.getElementById('remember-me');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

if (localStorage.getItem('rememberMe') === 'true') {
    rememberMeCheckbox.checked = true;
    usernameInput.value = localStorage.getItem('savedUsername');
    passwordInput.value = localStorage.getItem('savedPassword');
}

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); 

    const username = usernameInput.value;
    const password = passwordInput.value;
    const rememberMe = rememberMeCheckbox.checked; 

    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://testapi.dentread.com/authenticate_desktop/');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.responseType = 'json';

    xhr.onload = function () {
        if (xhr.status === 200) {
            if (xhr.response && xhr.response.token) {
                const token = xhr.response.token;
                const user_name = xhr.response.name;
                const orgname = xhr.response.orgname;
                const func = async () => {
                    const response = await window.versions.createDirectory(username);
                    if (response.success) {
                        const dentread_dir = response.directoryPath; 
                        
    
                        return dentread_dir; 
                    } else {
                        console.error('Directory creation failed:', response.message);
                        return null;
                    }
                };
    
                const dentread_dir = func();

                localStorage.setItem('token', JSON.stringify(token));
                localStorage.setItem('user_name', user_name)
                localStorage.setItem('orgname', orgname)

                if (rememberMe) {
                    localStorage.setItem('rememberMe', true);
                    localStorage.setItem('savedUsername', username);
                    localStorage.setItem('savedPassword', password);
                } else {
                    localStorage.removeItem('rememberMe');
                    localStorage.removeItem('savedUsername');
                    localStorage.removeItem('savedPassword');
                }

                window.location.href = 'mainpage.html';
            } else {
                doSomething('Authentication failed');
            }
        } else {
            console.error('API request error:', xhr.statusText);
            doSomething('Invalid Credentials !');
        }
    };
    xhr.onerror = function () {
        console.error('API request error:', xhr.statusText);
    };

    const formData = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

    xhr.send(formData);
});


