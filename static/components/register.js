export default {
    data() {
      return {
        username: '',
        password: '',
        message: '',
        role: 'user'
      };
    },
    methods: {
      registerUser() {
        fetch('http://127.0.0.1:5000/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: this.username,
            password: this.password,
            role: this.role
          })
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(response.status); 
            }
            return response.json();
          })
          .then(data => {
            this.message = data.message;
            this.username = '';
            this.password = '';
            window.location.href = '/login';
          })
          .catch(error => {
            console.error('There was a problem with the registration:', error);
            if (error.message === '409') {
              this.message = 'Username already exists';
            } else if (error.message === '400') {
              this.message = 'Username and password are required';
            } else {
              this.message = 'Failed to register user';
              console.log(error);
            }
          });
      }
    },
    template: `
      <div style="font-family: Arial, sans-serif;background-color: #f5f5f5;margin: 0;padding: 0;">
      <div style="text-align: center;
            padding: 20px;
            background-color: #d7c0d0;
            border: 3px solid #000;"><h1 style="color: #000;
            margin: 0;
            padding: 10px 0;
            font-family: cursive;">Register as a User</h1></div>
        <div style="max-width: 400px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
        <div style="margin-bottom: 10px;">
          <label for="username" style="display: block;
            margin-bottom: 5px;
            font-weight: bold;">Username:</label>
          <input type="text" id="username" v-model="username" style="width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 3px;
            box-sizing: border-box;" placeholder="Enter your username" />
        </div>
        <div class="form-group" style="margin-bottom: 10px;">
          <label for="password" style="display: block;
            margin-bottom: 5px;
            font-weight: bold;">Password:</label>
          <input type="password" id="password" v-model="password" style="width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 3px;
            box-sizing: border-box;" placeholder="Enter your password" />
        </div>
        <div class="form-group" style="margin-bottom: 10px;">
          <button @click="registerUser" style="background-color: #333;
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;">Register</button>
        </div>
        <p>Have an account? Then login here:</p>
        <router-link to="/login" style="color: #555;
            margin-top: 20px;">Login</router-link><br><br>
        <router-link to="/" style="color: #555;
            margin-top: 20px;">Go to Home</router-link><br><br>
        <div class="message" v-if="message">{{ message }}</div>
      </div>
      </div>
    `
  };
  