export default {
    data() {
      return {
        username: '',
        password: '',
        message: ''
      };
    },
    methods: {
      loginUser() {
        fetch('http://127.0.0.1:5000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: this.username,
            password: this.password
          })
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(response.status);
            }
            return response.json();
          })
          .then(data => {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user_role', data.role);
            localStorage.setItem('user_name', data.name);
            localStorage.setItem('login_time', data.login_time);
            this.message = 'Login successful';
            window.location.href = '/feed';
          })
          .catch(error => {
            console.error('There was a problem with the login:', error);
            if (error.message === '401') {
              this.message = 'Invalid credentials';
            } else {
              this.message = 'Failed to login';
              console.log(error);
            }
          });
      }
    },
    template: `
      <div style="font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
            text-align: center;">
        <div style="text-align: center;
            padding: 20px;
            background-color: #d7c0d0;
            border: 3px solid #000;"><h1 style="color: #000;
            margin: 0;
            padding: 10px 0;
            font-family: cursive;">User's Login</h1></div>
        <div style="max-width: 400px;
            margin: 50px auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
        <div style="margin-bottom: 20px;">
          <label for="username" style="display: block;
            margin-bottom: 5px;
            font-weight: bold;">Username:</label>
          <input type="text" id="username" v-model="username" style="width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 3px;
            box-sizing: border-box;" placeholder="Enter your username" />
        </div>
        <div class="form-group" style="margin-bottom: 20px;">
          <label for="password" style="display: block;
            margin-bottom: 5px;
            font-weight: bold;">Password:</label>
          <input type="password" id="password" v-model="password" style="width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 3px;
            box-sizing: border-box;" placeholder="Enter your password" />
        </div>
        <div class="form-group" style="margin-bottom: 20px;">
          <button @click="loginUser" style="background-color: #333;
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;" >Login</button>
        </div>
        <p>Don't have an account? Then register here:</p><br>
        <router-link to="/register" style="color: #333;
            text-decoration: none;
            margin-right: 10px;">Register</router-link>
        </div><br><br>
        <router-link to="/" style="color: #333;
            text-decoration: none;
            margin-right: 10px;">Go to Home</router-link>
        </div>
        <div class="message" v-if="message">{{ message }}</div>
      </div>
    `
  };
  