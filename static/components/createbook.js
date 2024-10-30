export default{
    data(){
        return{
            bookname:'',
            author:'',
            description:'',
            image:null,
            file_path:null,
        };
    },
    methods:{
        createBook(){
            const token = localStorage.getItem('token');
            if (token){
                const formdata=new FormData
                formdata.append('bookname',this.bookname);
                formdata.append('author',this.author);
                formdata.append('file_path',this.file_path);
                formdata.append('image',this.image);
                formdata.append('description',this.description);

                fetch('http://127.0.0.1:5000/api/addbook',{
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
                    this.bookname='',
                    this.author='',
                    this.description='',
                    this.file_path=null,
                    this.image=null,
                    window.location.href = '/libfeed';
                  })
                  .catch(error => {
                    if (error.message === '409') {
                      this.resultMessage = 'Book already exists'
                    } else {
                      this.resultMessage = 'Failed to create book';
                      console.log(error);
                    }
                });
            }
            else{
                this.resultMessage = 'Please log in as a librarian to create a book';
            }
        },
        handleImageUpload(event) {
            this.image = event.target.files[0];
        },
        handleFileUpload(event) {
            this.file_path = event.target.files[0];
        },

    },

    
    
    
    
    
    
    
    
    
    
    template: `
      <div style="font-family: Arial, sans-serif; margin: 20px; padding: 20px; background-color: #fff; border: 1px solid #ddd; border-radius: 5px;">
    <h1 style="margin-top: 0;">Add New Book</h1>
    
    <div style="margin-bottom: 15px;">
        <label for="bookname" style="display: block; margin-bottom: 5px; font-weight: bold;">Book Name:</label>
        <input type="text" id="bookname" v-model="bookname" placeholder="Enter book name" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box;" />
    </div>
    
    <div style="margin-bottom: 15px;">
        <label for="author" style="display: block; margin-bottom: 5px; font-weight: bold;">Author:</label>
        <input type="text" id="author" v-model="author" placeholder="Enter author name" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box;" />
    </div>
    
    <div style="margin-bottom: 15px;">
        <label for="description" style="display: block; margin-bottom: 5px; font-weight: bold;">Description:</label>
        <textarea id="description" v-model="description" placeholder="Enter book description" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box; height: 100px;"></textarea>
    </div>
    
    <div style="margin-bottom: 15px;">
        <label for="file_path" style="display: block; margin-bottom: 5px; font-weight: bold;">Upload Book File:</label>
        <input type="file" id="file_path" @change="handleFileUpload" style="border: 1px solid #ddd; border-radius: 3px;" />
    </div>
    
    <div style="margin-bottom: 15px;">
        <label for="image" style="display: block; margin-bottom: 5px; font-weight: bold;">Upload Book Image:</label>
        <input type="file" id="image" @change="handleImageUpload" style="border: 1px solid #ddd; border-radius: 3px;" />
    </div>
    
    <div style="margin-bottom: 15px;">
        <button @click="createBook" style="background-color: #007bff; color: #fff; border: 1px solid #000; padding: 10px 15px; border-radius: 3px; font-size: 14px; cursor: pointer;">Add Book</button>
    </div>
    
    <div class="message" v-if="resultMessage" style="margin-top: 20px; color: #007bff;">{{ resultMessage }}</div>
    
    <br><br>
    <router-link to="/libfeed" style="text-decoration: none; color: #007bff; font-weight: bold; margin-right: 10px;">Go to Feed</router-link><br><br>
    <router-link to="/logout" style="text-decoration: none; color: #555;">Logout</router-link>
</div>


    `
  };
  