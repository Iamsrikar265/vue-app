export default {
    data() {
      return {
        img1: null,
        img2: null,
        img3:null
      };
    },
    methods: {
      fetchData() {
        fetch('http://127.0.0.1:5000/api/statspage', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        .then(response => response.json())
        .then(data => {
          this.img1 = data.img1;
          this.img2 = data.img2;
          this.img3=data.img3
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
      <div style="font-family: Arial, sans-serif; margin: 20px; padding: 20px; background-color: #fff; border: 1px solid #ddd; border-radius: 5px;">
    <h2 style="margin-top: 0;">Library Statistics</h2>
    
    <div v-if="img1" style="margin-bottom: 20px;">
        <img :src="img1" alt="Bar Chart1" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 3px;">
    </div>
    <div v-else style="margin-bottom: 20px;">
        <h5 style="color: #dc3545;">No data available for the bar chart</h5>
    </div>
  
    <div v-if="img2" style="margin-bottom: 20px;">
        <img :src="img2" alt="Bar Chart2" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 3px;">
    </div>
    <div v-else style="margin-bottom: 20px;">
        <h5 style="color: #dc3545;">No data available for the bar chart</h5>
    </div>
    
    <div v-if="img3">
        <img :src="img3" alt="Pie Chart" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 3px;">
    </div>
    <div v-else>
        <h5 style="color: #dc3545;">No data available for the pie chart</h5>
    </div><br><br>
    <router-link to="/libfeed" style="text-decoration: none; color: #007bff; font-weight: bold; margin-right: 10px;">Go to Feed</router-link><br>
</div>

    `
  };
  