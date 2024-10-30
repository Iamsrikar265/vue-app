export default {
    data() {
      return {
        image: null,
        file_path: null,
        bookData: {
          author: '',
          description: '',
          date: ''
        },
        resultMessage: '',
        user_role: ''
      };
    },
    created() {
      this.bookID = this.$route.params.bookID;
      this.fetchBookData(this.bookID);
      this.user_role = localStorage.getItem('user_role');
    },
    methods: {
      fetchBookData(bookID) {
        const token = localStorage.getItem('token');
        if (token) {
          fetch(`http://127.0.0.1:5000/api/editbook/${bookID}`, {
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
              this.bookData = data;
            })
            .catch(error => {
              if (error.message === '404') {
                this.resultMessage = 'Book not found';
              } else {
                this.resultMessage = 'Failed to fetch book details';
              }
            });
        } else {
          this.resultMessage = 'Please log in to access protected content';
        }
      },
      updateBook() {
        const bookID = this.bookID;
        const formData = new FormData();
        formData.append('author', this.bookData.author);
        formData.append('description', this.bookData.description);
        formData.append('image', this.image);
        formData.append('file_path', this.file_path);
  
        fetch(`http://127.0.0.1:5000/api/editbook/${bookID}`, {
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
              this.resultMessage = 'Book not found';
            } else {
              this.resultMessage = 'Failed to update book';
            }
          });
      },
      handleImageUpload(event) {
        this.image = event.target.files[0];
      },
      handleFileUpload(event) {
        this.file_path = event.target.files[0];
      }
    },
    template: `
      <div style="font-family: Arial, sans-serif; margin: 20px; padding: 20px; background-color: #fff; border: 1px solid #ddd; border-radius: 5px;">
    <h1 style="margin-top: 0;">Edit the Book</h1>
    
    <div style="margin-bottom: 15px;">
        <label for="author" style="display: block; margin-bottom: 5px; font-weight: bold;">Author:</label>
        <input type="text" id="author" v-model="bookData.author" placeholder="Enter author name" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box;" />
    </div>
    
    <div style="margin-bottom: 15px;">
        <label for="description" style="display: block; margin-bottom: 5px; font-weight: bold;">Description:</label>
        <textarea id="description" v-model="bookData.description" placeholder="Enter book description" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box; height: 100px;"></textarea>
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
        <button @click="updateBook" style="background-color: #007bff; color: #fff; border: 1px solid #000; padding: 10px 15px; border-radius: 3px; font-size: 14px; cursor: pointer;">Edit Book</button>
    </div>
    
    <div class="message" v-if="resultMessage" style="margin-top: 20px; color: #007bff;">{{ resultMessage }}</div>
    
    <br><br>
    <router-link to="/libfeed" style="text-decoration: none; color: #007bff; font-weight: bold; margin-right: 10px;">Go to Feed</router-link><br><br>
    <router-link to="/logout" style="text-decoration: none; color: #555;">Logout</router-link>
</div>

    `
  };
  