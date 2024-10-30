export default{
    data(){
        return{
            section_name:'',
            s_description:'',
            s_image:null
        };
    },
    methods:{
        createSection(){
            const token = localStorage.getItem('token');
            if (token){
                const formdata=new FormData
                formdata.append('section_name',this.section_name);
                formdata.append('s_image',this.s_image);
                formdata.append('s_description',this.s_description);

                fetch('http://127.0.0.1:5000/api/addsection',{
                    method:'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                      },
                      body: formdata
                })
                .then(response => {
                    if (!response.ok) {
                      throw new Error(response.status);
                    }
                    return response.json();
                  })
                  .then(data => {
                    this.resultMessage = data.message;
                    this.section_name='',
                    this.s_description='',
                    this.s_image=null,
                    window.location.href = '/libfeed';
                  })
                  .catch(error => {
                    if (error.message === '409') {
                      this.resultMessage = 'Section already exists'
                    } else {
                      this.resultMessage = 'Failed to create section';
                      console.log(error);
                    }
                });
            }
            else{
                this.resultMessage = 'Please log in as a librarian to create a section';
            }
        },
        handleImageUpload(event) {
            this.s_image = event.target.files[0];
        },

    },

    
    
    
    
    
    
    
    
    
    
    template: `
      <div style="font-family: Arial, sans-serif; margin: 20px; padding: 20px; background-color: #fff; border: 1px solid #ddd; border-radius: 5px;">
    <h1 style="margin-top: 0;">Add New Section</h1>
    
    <div style="margin-bottom: 15px;">
        <label for="section_name" style="display: block; margin-bottom: 5px; font-weight: bold;">Section Name:</label>
        <input type="text" id="section_name" v-model="section_name" placeholder="Enter section name" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box;" />
    </div>
    
    <div style="margin-bottom: 15px;">
        <label for="s_description" style="display: block; margin-bottom: 5px; font-weight: bold;">Description:</label>
        <textarea id="s_description" v-model="s_description" placeholder="Enter the description" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box; height: 100px;"></textarea>
    </div>
    
    <div style="margin-bottom: 15px;">
        <label for="s_image" style="display: block; margin-bottom: 5px; font-weight: bold;">Upload Section Image:</label>
        <input type="file" id="s_image" @change="handleImageUpload" style="border: 1px solid #ddd; border-radius: 3px;" />
    </div>
    
    <div style="margin-bottom: 15px;">
        <button @click="createSection" style="background-color: #007bff; color: #fff; border: 1px solid #000; padding: 10px 15px; border-radius: 3px; font-size: 14px; cursor: pointer;">Add Section</button>
    </div>
    
    <div class="message" v-if="resultMessage" style="margin-top: 20px; color: #007bff;">{{ resultMessage }}</div>
    
    <br><br>
    <router-link to="/libfeed" style="text-decoration: none; color: #007bff; font-weight: bold; margin-right: 10px;">Go to Feed</router-link><br><br>
    <router-link to="/logout" style="text-decoration: none; color: #555;">Logout</router-link>
</div>


    `
  };
  