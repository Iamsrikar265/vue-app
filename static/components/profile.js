export default {
    data() {
      return {
        username: '',
        img1: null,
        img2: null
      };
    },
    methods: {
      fetchData() {
        fetch('http://127.0.0.1:5000/api/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        .then(response => response.json())
        .then(data => {
          this.username = data.username;
          this.img1 = data.img1;
          this.img2 = data.img2;
        })
        .catch(error => {
          console.error('Error fetching data:', error);
        });
      }
    },
    created() {
      this.fetchData();
    },
    template: `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; max-width: 600px; margin: 0 auto; text-align: center;">
  <!-- Profile Heading -->
  <h2 style="color: #333; margin-bottom: 20px;">My Profile</h2>

  <!-- Username -->
  <h5 style="color: #555; margin-bottom: 5px;">Username:</h5>
  <p style="color: #333; margin-bottom: 20px;">{{ username }}</p>
  
  <!-- Bar Chart -->
  <div v-if="img1" style="margin-bottom: 40px;">
    <img :src="img1" alt="Bar Chart" style="max-width: 100%; height: auto;">
  </div>
  <div v-else style="margin-bottom: 40px;">
    <h5 style="color: #555;">No data available for the bar chart</h5>
  </div>
  
  <!-- Pie Chart -->
  <div v-if="img2">
    <img :src="img2" alt="Pie Chart" style="max-width: 100%; height: auto;">
  </div>
  <div v-else>
    <h5 style="color: #555;">No data available for the pie chart</h5>
  </div><br>
  <router-link to="/feed" style="text-decoration: none; color: #007bff; font-weight: bold; margin-right: 10px;">Go to Feed</router-link><br>
</div>

    `
  };
  