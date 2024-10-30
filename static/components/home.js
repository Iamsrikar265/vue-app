export default {
    template: `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; text-align: center; padding: 20px;
      margin: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">Library Web Application</h2>
        <div style="margin-top: 20px;">
          <button @click="navigateToLogin" style="font-family: Arial, sans-serif; text-decoration: none; color: #fff; background-color: #333; border: none; 
          padding: 10px 20px; border-radius: 5px; margin: 5px; cursor: pointer; transition: background-color 0.3s ease; hover:background-color: #555;">User Login</button>
          <button @click="navigateToRegister" style="font-family: Arial, sans-serif; text-decoration: none; color: #fff; background-color: #333; border: none; 
          padding: 10px 20px; border-radius: 5px; margin: 5px; cursor: pointer; transition: background-color 0.3s ease; hover:background-color: #555;">Register</button>
          <button @click="navigateToLiblogin" style="font-family: Arial, sans-serif; text-decoration: none; color: #fff; background-color: #333; border: none; 
          padding: 10px 20px; border-radius: 5px; margin: 5px; cursor: pointer; transition: background-color 0.3s ease; hover:background-color: #555;">Librarian Login</button>
        </div>
      </div>
    `,
    methods: {
      navigateToLogin() {
        this.$router.push('/login');
      },
      navigateToRegister() {
        this.$router.push('/register');
      },
      navigateToLiblogin(){
        this.$router.push('/liblogin');
      }
    },
    style: `
      .home-container {
        font-family: Arial, sans-serif;
        background-color: #f5f5f5;
        text-align: center;
        padding: 20px;
        margin: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .home-container h2 {
        color: #333;
        margin-bottom: 20px;
    }

    .button-group {
        margin-top: 20px;
    }

    .button-group button {
        font-family: Arial, sans-serif;
        text-decoration: none;
        color: #fff;
        background-color: #333;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        margin: 5px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .button-group button:hover {
        background-color: #555;
    }
    `
  };
  