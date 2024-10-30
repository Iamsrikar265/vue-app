export default {
    data() {
      return {
        s_image: null,
        sectionData: {
          s_description: '',
          s_date: ''
        },
        resultMessage: '',
        user_role: ''
      };
    },
    created() {
      this.sectionID = this.$route.params.sectionID;
      this.fetchSectionData(this.sectionID);
      this.user_role = localStorage.getItem('user_role');
    },
    methods: {
      fetchSectionData(sectionID) {
        const token = localStorage.getItem('token');
        if (token) {
          fetch(`http://127.0.0.1:5000/api/editsection/${sectionID}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
            .then(response => {
              if (!response.ok) {
                throw new Error(response.status);
              }
              return response.json();
            })
            .then(data => {
              this.sectionData = data;
            })
            .catch(error => {
              if (error.message === '404') {
                this.resultMessage = 'Section not found';
              } else {
                this.resultMessage = 'Failed to fetch section details';
              }
            });
        } else {
          this.resultMessage = 'Please log in to access protected content';
        }
      },
      updateSection() {
        const sectionID = this.sectionID;
        const formData = new FormData();
        formData.append('s_description', this.sectionData.s_description);
        formData.append('s_image', this.image);
  
        fetch(`http://127.0.0.1:5000/api/editsection/${sectionID}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(response.status);
            }
            return response.json();
          })
          .then(data => {
            this.resultMessage = data.message;
            window.location.href = '/libfeed';
          })
          .catch(error => {
            if (error.message === '404') {
              this.resultMessage = 'Section not found';
            } else {
              this.resultMessage = 'Failed to update section';
            }
          });
      },
      handleImageUpload(event) {
        this.image = event.target.files[0];
      }
    },
    template: `
      <div style="font-family: Arial, sans-serif; margin: 20px; padding: 20px; background-color: #fff; border: 1px solid #ddd; border-radius: 5px;">
    <h1 style="margin-top: 0;">Edit the Section</h1>
    
    <div style="margin-bottom: 15px;">
        <label for="s_description" style="display: block; margin-bottom: 5px; font-weight: bold;">Description:</label>
        <textarea id="s_description" v-model="sectionData.s_description" placeholder="Enter section description" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box; height: 100px;"></textarea>
    </div>
    
    <div style="margin-bottom: 15px;">
        <label for="s_image" style="display: block; margin-bottom: 5px; font-weight: bold;">Upload Section Image:</label>
        <input type="file" id="s_image" @change="handleImageUpload" style="border: 1px solid #ddd; border-radius: 3px;" />
    </div>
    
    <div style="margin-bottom: 15px;">
        <button @click="updateSection" style="background-color: #007bff; color: #fff; border: 1px solid #000; padding: 10px 15px; border-radius: 3px; font-size: 14px; cursor: pointer;">Edit Section</button>
    </div>
    
    <div class="message" v-if="resultMessage" style="margin-top: 20px; color: #007bff;">{{ resultMessage }}</div>
    
    <br><br>
    <router-link to="/libfeed" style="text-decoration: none; color: #007bff; font-weight: bold; margin-right: 10px;">Go to Feed</router-link><br><br>
    <router-link to="/logout" style="text-decoration: none; color: #555;">Logout</router-link>
</div>

    `
  };
  